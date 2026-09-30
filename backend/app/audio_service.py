import io
import logging
from typing import Optional
from app.config import settings

logger = logging.getLogger("kisan_sahayak.audio")

async def synthesize_speech(text: str, language: str = "en") -> Optional[bytes]:
    """
    Synthesize spoken audio from text.
    Supports Sarvam AI (Indian languages), Deepgram, or fallback.
    """
    # If Sarvam AI API Key is provided for Indian languages (Telugu, Hindi, Tamil, etc.)
    if settings.SARVAM_API_KEY:
        try:
            import aiohttp
            target_lang = "te-IN" if language == "te" else ("hi-IN" if language == "hi" else "en-IN")
            url = "https://api.sarvam.ai/text-to-speech"
            headers = {"api-subscription-key": settings.SARVAM_API_KEY, "Content-Type": "application/json"}
            payload = {
                "inputs": [text],
                "target_language_code": target_lang,
                "speaker": "meera",
                "pitch": 0,
                "pace": 1.0,
                "loudness": 1.5,
                "speech_sample_rate": 22050,
                "enable_preprocessing": True
            }
            async with aiohttp.ClientSession() as session:
                async with session.post(url, json=payload, headers=headers) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        if "audios" in data and len(data["audios"]) > 0:
                            import base64
                            return base64.b64decode(data["audios"][0])
        except Exception as e:
            logger.warning(f"Sarvam TTS failed: {e}")

    # Fallback to gTTS if available
    try:
        from gtts import gTTS
        lang_code = "te" if language == "te" else ("hi" if language == "hi" else "en")
        tts = gTTS(text=text, lang=lang_code)
        fp = io.BytesIO()
        tts.write_to_fp(fp)
        fp.seek(0)
        return fp.read()
    except Exception as e:
        logger.warning(f"gTTS fallback failed or not installed: {e}")
        return None
