import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import chat, rti, twilio, voice, assemblyai_router, voice_tool

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("kisan_sahayak")

app = FastAPI(
    title="Kisan Sahayak (క్రిసాన్ సహాయక్ / किसान सहायक) Voice Agent Backend",
    description="Empathetic, patient, and knowledgeable Voice Agent API powered by AssemblyAI STT for crop.ins portal, PMFBY, and RWBCIS.",
    version="1.2.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Enable CORS for frontend applications & web clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(chat.router)
app.include_router(rti.router)
app.include_router(twilio.router)
app.include_router(voice.router)
app.include_router(assemblyai_router.router)
app.include_router(voice_tool.router)

@app.get("/", tags=["Health & Status"])
async def root():
    return {
        "status": "online",
        "service": settings.APP_NAME,
        "stt_engine": "AssemblyAI Speech-to-Text",
        "voice_tool_webhook": "/api/voice-tool",
        "portal": "crop.ins",
        "supported_languages": ["Telugu (te)", "Hindi (hi)", "Marathi (mr)", "Tamil (ta)", "English (en)"],
        "docs": "/docs"
    }

@app.get("/health", tags=["Health & Status"])
async def health_check():
    return {"status": "ok"}
