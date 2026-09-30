from fastapi import APIRouter, HTTPException, Response
from fastapi.responses import HTMLResponse
from app.models import RTIDraftRequest, RTIDraftResponse
from app.rti_generator import generate_rti_draft
from app.conversation_engine import get_session

router = APIRouter(prefix="/api/rti", tags=["RTI Draft Generator"])

@router.post("/draft", response_model=RTIDraftResponse)
async def create_rti_draft(req: RTIDraftRequest):
    """
    Generate pre-filled Right to Information (RTI) application draft for crop.ins portal.
    Demands Category 1 (Form-2 CCE), Category 2 (ACF multiplier), and Category 3 (Sown vs Insured Acreage).
    """
    if req.session_id:
        state = get_session(req.session_id)
        if state:
            # Auto-populate fields if present in session state
            if not req.language:
                req.language = state.language
            if state.collected_data.crop and req.crop == "Insured Crop":
                req.crop = state.collected_data.crop
            if state.collected_data.season and req.season == "Kharif / Rabi":
                req.season = state.collected_data.season
            if state.collected_data.mandal_tehsil and req.mandal_tehsil == "[Your Mandal / Tehsil Name]":
                req.mandal_tehsil = state.collected_data.mandal_tehsil
            if state.collected_data.gram_panchayat and req.gram_panchayat == "[Your Gram Panchayat Name]":
                req.gram_panchayat = state.collected_data.gram_panchayat

    draft_response = generate_rti_draft(req)
    return draft_response

@router.get("/print/{session_id}", response_class=HTMLResponse)
async def print_rti_page(session_id: str):
    """
    Render clean, printable HTML draft ready for CSC agents or farmers to print directly.
    """
    state = get_session(session_id)
    req = RTIDraftRequest(
        session_id=session_id,
        language=state.language if state else "en",
        mandal_tehsil=state.collected_data.mandal_tehsil if state and state.collected_data.mandal_tehsil else "[Mandal/Tehsil Office]",
        gram_panchayat=state.collected_data.gram_panchayat if state and state.collected_data.gram_panchayat else "[Gram Panchayat]",
        crop=state.collected_data.crop if state and state.collected_data.crop else "Insured Crop",
        season=state.collected_data.season if state and state.collected_data.season else "Kharif / Rabi"
    )
    draft = generate_rti_draft(req)
    return HTMLResponse(content=draft.printable_html)
