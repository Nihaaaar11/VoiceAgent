import io
import os
import tempfile
import logging
from typing import Optional
from app.config import settings

logger = logging.getLogger("kisan_sahayak.assemblyai")

def is_assemblyai_configured() -> bool:
    return bool(settings.ASSEMBLYAI_API_KEY and settings.ASSEMBLYAI_API_KEY.strip())

async def transcribe_audio_with_assemblyai(audio_bytes: bytes, file_extension: str = "wav") -> Optional[str]:
    """
    Transcribe raw audio bytes using AssemblyAI STT API.
    Supports Indian languages and English speech recognition.
    """
    if not is_assemblyai_configured():
        logger.warning("ASSEMBLYAI_API_KEY is not set in environment.")
        return None

    try:
        import assemblyai as aai
        aai.settings.api_key = settings.ASSEMBLYAI_API_KEY
        
        # Save audio bytes to temporary file for AssemblyAI client
        with tempfile.NamedTemporaryFile(suffix=f".{file_extension}", delete=False) as temp_audio:
            temp_audio.write(audio_bytes)
            temp_path = temp_audio.name

        try:
            transcriber = aai.Transcriber()
            config = aai.TranscriptionConfig(language_detection=True)
            transcript = transcriber.transcribe(temp_path, config=config)
            
            if transcript.status == aai.TranscriptStatus.error:
                logger.error(f"AssemblyAI Transcription Error: {transcript.error}")
                return None
                
            return transcript.text
        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)
                
    except Exception as e:
        logger.error(f"AssemblyAI transcription exception: {e}")
        return None
