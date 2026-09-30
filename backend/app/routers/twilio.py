from fastapi import APIRouter, Form, Response
from typing import Optional
import html
from app.conversation_engine import create_session, process_chat, get_session

router = APIRouter(prefix="/api/twilio", tags=["Twilio Voice Telephony"])

@router.post("/voice")
async def twilio_incoming_voice(
    CallSid: Optional[str] = Form(None),
    From: Optional[str] = Form(None),
    SpeechResult: Optional[str] = Form(None)
):
    """
    Twilio Webhook for incoming phone calls.
    Returns TwiML <Gather> or <Say> for interactive voice response.
    """
    session_id = CallSid or "twilio-demo-session"
    state = get_session(session_id)
    
    if not state:
        sid, state = create_session(language="en")
        greeting = state.conversation_history[0].content
        # Escape HTML special chars for TwiML
        safe_greeting = html.escape(greeting)
        twiml = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Gather input="speech" action="/api/twilio/voice" method="POST" speechTimeout="auto" language="te-IN,hi-IN,en-IN">
        <Say voice="Polly.Aditi">{safe_greeting}</Say>
    </Gather>
    <Say voice="Polly.Aditi">We did not receive any input. Goodbye.</Say>
</Response>"""
        return Response(content=twiml, media_type="application/xml")
        
    if SpeechResult:
        res = await process_chat(session_id=session_id, user_message=SpeechResult)
        safe_reply = html.escape(res.reply)
        
        # Select appropriate voice language for Twilio TTS
        voice_name = "Polly.Aditi"
        if res.language == "hi":
            voice_name = "Polly.Aditi"
        elif res.language == "te":
            voice_name = "Polly.Aditi" # standard Indian English/Hindi/Telugu voice
            
        twiml = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Gather input="speech" action="/api/twilio/voice" method="POST" speechTimeout="auto" language="te-IN,hi-IN,en-IN">
        <Say voice="{voice_name}">{safe_reply}</Say>
    </Gather>
    <Say voice="{voice_name}">Thank you for calling Kisan Sahayak. Goodbye.</Say>
</Response>"""
        return Response(content=twiml, media_type="application/xml")

    twiml = """<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Gather input="speech" action="/api/twilio/voice" method="POST" speechTimeout="auto">
        <Say voice="Polly.Aditi">Please speak after the tone.</Say>
    </Gather>
</Response>"""
    return Response(content=twiml, media_type="application/xml")
