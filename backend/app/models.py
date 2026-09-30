from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class ScenarioEnum(str, Enum):
    UNDETERMINED = "UNDETERMINED"
    SCENARIO_A = "SCENARIO_A" # Post-claim issue / reduction / rejection / delay
    SCENARIO_B = "SCENARIO_B" # Pre-application & eligibility guidance

class ChatMessage(BaseModel):
    role: str # "user" or "assistant" or "system"
    content: str
    timestamp: Optional[str] = None

class CollectedFarmerData(BaseModel):
    crop: Optional[str] = None
    season: Optional[str] = None # Kharif / Rabi
    expected_amount: Optional[str] = None
    received_amount: Optional[str] = None
    damage_scope: Optional[str] = None # individual / village
    reported_within_72h: Optional[bool] = None
    harvest_status: Optional[str] = None # standing / post_harvest_drying
    days_post_harvest: Optional[int] = None
    is_loanee: Optional[bool] = None # True for KCC loanee, False for non-loanee
    mandal_tehsil: Optional[str] = None
    gram_panchayat: Optional[str] = None
    district: Optional[str] = None
    state_name: Optional[str] = None
    mobile_number: Optional[str] = None

class SessionState(BaseModel):
    session_id: str
    language: str = "en" # te, hi, mr, ta, en
    language_name: str = "English"
    scenario: ScenarioEnum = ScenarioEnum.UNDETERMINED
    current_step: int = 1
    collected_data: CollectedFarmerData = Field(default_factory=CollectedFarmerData)
    conversation_history: List[ChatMessage] = Field(default_factory=list)
    rti_ready: bool = False

class StartSessionResponse(BaseModel):
    session_id: str
    greeting: str
    language: str = "en"
    state: SessionState

class ChatRequest(BaseModel):
    session_id: Optional[str] = None
    message: str
    language: Optional[str] = None

class ChatResponse(BaseModel):
    session_id: str
    reply: str
    language: str
    scenario: ScenarioEnum
    spoken_formatted: str
    state: SessionState
    rti_ready: bool = False

class RTIDraftRequest(BaseModel):
    session_id: Optional[str] = None
    farmer_name: Optional[str] = "Farmer / 🏢 Application Holder"
    mobile_number: Optional[str] = "XXXXXXXXXX"
    mandal_tehsil: Optional[str] = "[Your Mandal / Tehsil Name]"
    gram_panchayat: Optional[str] = "[Your Gram Panchayat Name]"
    district: Optional[str] = "[Your District]"
    state_name: Optional[str] = "[Your State]"
    crop: Optional[str] = "Insured Crop"
    season: Optional[str] = "Kharif / Rabi"
    year: Optional[str] = "2025-2026"
    language: Optional[str] = "en"

class RTIDraftResponse(BaseModel):
    session_id: Optional[str] = None
    draft_title: str
    addressee: str
    body_markdown: str
    body_text: str
    categories_demanded: List[str]
    printable_html: str
