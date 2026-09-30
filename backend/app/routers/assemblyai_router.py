from fastapi import APIRouter, UploadFile, File, Form, HTTPException, WebSocket, WebSocketDisconnect
from typing import Optional
import base64
import logging

from app.config import settings
from app.assemblyai_service import transcribe_audio_with_assemblyai, is_assemblyai_configured
from app.conversation_engine import process_chat, get_session, create_session
from app.audio_service import synthesize_speech

logger = logging.getLogger("kisan_sahayak.assemblyai_router")

router = APIRouter(prefix="/api/assemblyai", tags=["AssemblyAI Voice Engine"])

@router.get("/status")
async def assemblyai_status():
    """
    Check if AssemblyAI voice service is configured and ready.
    """
    return {
        "configured": is_assemblyai_configured(),
        "service": "AssemblyAI Real-Time & Async Speech-to-Text"
    }

@router.post("/transcribe-and-respond")
async def transcribe_and_respond(
    file: UploadFile = File(...),
    session_id: Optional[str] = Form(None),
    language: Optional[str] = Form(None)
):
    """
    Transcribe farmer's recorded spoken audio via AssemblyAI STT,
    process it through Kisan Sahayak AI agent, and return spoken text + audio response.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="Audio file must be provided")

    audio_bytes = await file.read()
    if len(audio_bytes) == 0:
        raise HTTPException(status_code=400, detail="Uploaded audio file is empty")

    ext = file.filename.split(".")[-1].lower() if "." in file.filename else "wav"
    
    # Transcribe audio using AssemblyAI
    transcript = await transcribe_audio_with_assemblyai(audio_bytes, file_extension=ext)
    
    if not transcript or not transcript.strip():
        # Fallback if AssemblyAI key is not set or audio could not be transcribed
        return {
            "session_id": session_id or "new_session",
            "transcript": "[Audio received]",
            "assemblyai_status": "transcription_unavailable_or_empty",
            "message": "Could not transcribe audio. Please ensure ASSEMBLYAI_API_KEY is configured or speak clearly.",
            "error": "AssemblyAI key unconfigured or silent audio"
        }

    # Process transcript through Kisan Sahayak conversation engine
    chat_res = await process_chat(
        session_id=session_id,
        user_message=transcript,
        requested_lang=language
    )

    # Synthesize TTS voice output for assistant's reply
    tts_audio = await synthesize_speech(text=chat_res.reply, language=chat_res.language)
    audio_b64 = base64.b64encode(tts_audio).decode("utf-8") if tts_audio else None

    return {
        "session_id": chat_res.session_id,
        "transcript": transcript,
        "reply": chat_res.reply,
        "spoken_formatted": chat_res.spoken_formatted,
        "language": chat_res.language,
        "scenario": chat_res.scenario,
        "state": chat_res.state,
        "rti_ready": chat_res.rti_ready,
        "audio_base64": audio_b64
    }

@router.websocket("/ws/{session_id}")
async def assemblyai_voice_websocket(websocket: WebSocket, session_id: str):
    """
    WebSocket endpoint for real-time voice interaction with Kisan Sahayak.
    Receives JSON or audio chunks and streams back assistant responses.
    """
    await websocket.accept()
    logger.info(f"WebSocket voice connection opened for session: {session_id}")

    state = get_session(session_id)
    if not state:
        sid, state = create_session()
        session_id = sid

    # Send initial greeting
    greeting = state.conversation_history[0].content
    await websocket.send_json({
        "event": "greeting",
        "session_id": session_id,
        "text": greeting,
        "language": state.language
    })

    try:
        while True:
            data = await websocket.receive_json()
            user_text = data.get("text", "")
            
            if user_text:
                res = await process_chat(session_id=session_id, user_message=user_text)
                
                # Generate TTS
                audio_bytes = await synthesize_speech(text=res.reply, language=res.language)
                audio_b64 = base64.b64encode(audio_bytes).decode("utf-8") if audio_bytes else None
                
                await websocket.send_json({
                    "event": "response",
                    "session_id": res.session_id,
                    "reply": res.reply,
                    "language": res.language,
                    "scenario": res.scenario,
                    "rti_ready": res.rti_ready,
                    "audio_base64": audio_b64
                })
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for session: {session_id}")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        await websocket.close()
