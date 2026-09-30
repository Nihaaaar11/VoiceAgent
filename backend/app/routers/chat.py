from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from app.models import (
    ChatRequest, ChatResponse, StartSessionResponse, SessionState
)
from app.conversation_engine import (
    create_session, get_session, process_chat
)

router = APIRouter(prefix="/api/chat", tags=["Chat & Session"])

@router.post("/start", response_model=StartSessionResponse)
async def start_session(language: Optional[str] = Query(default="en")):
    """
    Initialize a new voice conversation session with Kisan Sahayak.
    Returns initial warm greeting in requested or default language.
    """
    session_id, state = create_session(language=language or "en")
    greeting = state.conversation_history[0].content
    return StartSessionResponse(
        session_id=session_id,
        greeting=greeting,
        language=state.language,
        state=state
    )

@router.post("/interact", response_model=ChatResponse)
async def interact(req: ChatRequest):
    """
    Process turn-by-turn caller response.
    Applies adaptive language detection, spoken-first formatting, single question constraint, and scenario routing.
    """
    if not req.message or len(req.message.strip()) == 0:
        raise HTTPException(status_code=400, detail="Message cannot be empty")
        
    res = await process_chat(
        session_id=req.session_id,
        user_message=req.message,
        requested_lang=req.language
    )
    return res

@router.get("/session/{session_id}", response_model=SessionState)
async def get_session_state(session_id: str):
    """
    Fetch complete session state, scenario classification, and collected farmer attributes.
    """
    state = get_session(session_id)
    if not state:
        raise HTTPException(status_code=404, detail="Session not found")
    return state
