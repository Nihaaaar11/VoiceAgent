from fastapi import APIRouter, HTTPException, Query, Response
from typing import Optional
from app.audio_service import synthesize_speech

router = APIRouter(prefix="/api/voice", tags=["Voice Audio Services"])

@router.get("/tts")
async def text_to_speech(text: str = Query(...), language: Optional[str] = Query(default="en")):
    """
    Generate audio (mp3/wav) for spoken text output.
    Useful for web application audio players and mobile clients.
    """
    if not text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")
        
    audio_bytes = await synthesize_speech(text=text, language=language or "en")
    if not audio_bytes:
        raise HTTPException(status_code=500, detail="TTS synthesis unavailable. Enable Sarvam AI or install gTTS.")
        
    return Response(content=audio_bytes, media_type="audio/mp3")
