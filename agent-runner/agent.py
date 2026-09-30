import os
import json
import asyncio
import base64
import sys
from pathlib import Path
from dotenv import load_dotenv

# Load env variables from agent-runner/.env, root .env.local, or root .env
root_dir = Path(__file__).resolve().parent.parent
load_dotenv(root_dir / ".env.local")
load_dotenv(root_dir / ".env")
load_dotenv()

API_KEY = os.getenv("ASSEMBLYAI_API_KEY")
NEXTJS_BACKEND_TOOL = os.getenv("VOICE_TOOL_URL", "http://localhost:3000/api/voice-tool")
ASSEMBLYAI_WS_URL = "wss://agents.assemblyai.com/v1/ws"

if not API_KEY:
    print("Error: Missing ASSEMBLYAI_API_KEY in environment variables.", flush=True)
    sys.exit(1)

KEYTERMS_PROMPT = [
    "PMFBY",
    "Kisan Credit Card",
    "KCC",
    "Kharif",
    "Rabi",
    "Pahani",
    "Patwari",
    "Crop Cutting Experiment",
    "CCE",
    "Area Correction Factor",
    "CSC",
    "RTI"
]

SYSTEM_PROMPT = """
You are "Kisan Sahayak", an official voice assistant for PMFBY crop insurance on the 'crop.ins' portal.

BEHAVIOR:
1. Speak in short, simple sentences (1-2 sentences at a time).
2. Ask only ONE question at a time.
3. For post-claim deductions:
   - Ask crop and season.
   - Ask expected sum insured and amount received.
   - Ask if loss was localized or whole-village.
4. Once you have crop, sumInsured, claimReceived, and damageType, CALL 'diagnose_claim'. DO NOT calculate deductions yourself.
5. When the tool returns, explain the clause simply and instruct them to visit their local CSC to request an RTI for CCE Form-2 logs.
6. For pre-application:
   - Check if they have a KCC loan.
   - State statutory premium caps: 2% Kharif, 1.5% Rabi, 5% Commercial.
   - List required documents: Land RoR/Pahani, Sowing Certificate, Aadhaar-linked Bank Passbook.
7. DEFLECT all non-crop insurance questions.
"""

TOOLS = [
    {
        "type": "function",
        "name": "diagnose_claim",
        "description": "Calculates PMFBY claim deductions against operational guidelines.",
        "parameters": {
            "type": "object",
            "properties": {
                "crop": {"type": "string"},
                "sumInsured": {"type": "number"},
                "claimReceived": {"type": "number"},
                "damageType": {
                    "type": "string",
                    "enum": ["LOCALIZED", "WIDESPREAD", "POST_HARVEST", "PREVENTED_SOWING"]
                },
                "reportingDelayHours": {"type": "number"}
            },
            "required": ["crop", "sumInsured", "claimReceived", "damageType"]
        }
    }
]

async def run_agent():
    import websockets
    import httpx
    import pyaudio

    # Initialize PyAudio for Microphone and Speaker
    p = pyaudio.PyAudio()
    
    # 16kHz 16-bit Mono PCM for optimal Speech-to-Text
    FORMAT = pyaudio.paInt16
    CHANNELS = 1
    RATE = 16000
    CHUNK = 1024

    mic_stream = p.open(format=FORMAT, channels=CHANNELS, rate=RATE, input=True, frames_per_buffer=CHUNK)
    speaker_stream = p.open(format=FORMAT, channels=CHANNELS, rate=24000, output=True)

    print("[INFO] Audio hardware initialized (Microphone @ 16kHz & Speaker @ 24kHz ready).", flush=True)
    print("[INFO] Connecting to AssemblyAI Voice Agent API...", flush=True)

    headers = {"Authorization": f"Bearer {API_KEY}"}
    
    async with websockets.connect(ASSEMBLYAI_WS_URL, additional_headers=headers) as ws:
        print("[SUCCESS] Connected to AssemblyAI Voice Agent API.", flush=True)

        # Send session update configuration
        session_config = {
            "type": "session.update",
            "session": {
                "transcription": {
                    "keyterms_prompt": KEYTERMS_PROMPT
                },
                "system_prompt": SYSTEM_PROMPT,
                "greeting": "Namaste. I am your crop insurance assistant. Are you calling about a reduced claim, or do you need help applying for new insurance?",
                "output": {"voice": "ivy"},
                "tools": TOOLS,
                "turn_detection": {
                    "type": "server_vad",
                    "threshold": 0.65,
                    "prefix_padding_ms": 300,
                    "silence_duration_ms": 700
                }
            }
        }
        await ws.send(json.dumps(session_config))

        session_ready = asyncio.Event()

        # Task to continuously stream microphone audio to AssemblyAI
        async def stream_mic():
            await session_ready.wait()
            print("[READY] Agent ready. Speak into your microphone!", flush=True)
            loop = asyncio.get_event_loop()
            while True:
                try:
                    data = await loop.run_in_executor(None, mic_stream.read, CHUNK, False)
                    if data:
                        audio_b64 = base64.b64encode(data).decode("utf-8")
                        msg = {"type": "input.audio", "audio": audio_b64}
                        await ws.send(json.dumps(msg))
                except Exception as e:
                    print(f"[WARN] Mic read: {e}", flush=True)
                await asyncio.sleep(0.01)

        # Task to handle incoming WebSocket messages from AssemblyAI
        async def handle_ws_messages():
            async for message in ws:
                event = json.loads(message)
                event_type = event.get("type")

                if event_type == "session.ready":
                    session_ready.set()

                # Log user transcript events when AssemblyAI transcribes spoken audio
                elif event_type in ["transcript", "user_speech"] or "transcript" in event:
                    text = event.get("transcript") or event.get("text")
                    if text:
                        print(f"[Farmer Spoke]: \"{text}\"", flush=True)

                # Log assistant reply text
                elif event_type == "reply.text" or "text" in event:
                    text = event.get("text")
                    if text:
                        print(f"[Kisan Sahayak]: \"{text}\"", flush=True)

                # Handle Tool Execution Calls
                elif event_type == "tool.call":
                    tool_name = event.get("name")
                    params = event.get("parameters", {})
                    call_id = event.get("call_id")
                    print(f"[TOOL CALL] AssemblyAI requested tool call: {tool_name}({params})", flush=True)

                    if tool_name == "diagnose_claim":
                        try:
                            async with httpx.AsyncClient() as client:
                                res = await client.post(NEXTJS_BACKEND_TOOL, json=params, timeout=10.0)
                                diagnosis = res.json()
                                print(f"[DIAGNOSIS] Rule Diagnosis returned: {diagnosis.get('clauseTitle')}", flush=True)
                                
                                req_pts = diagnosis.get("requiredDataPoints", [])
                                req_str = ", ".join(req_pts) if isinstance(req_pts, list) else str(req_pts)
                                
                                result_payload = {
                                    "ruleCode": diagnosis.get("ruleCode"),
                                    "explanation": diagnosis.get("spokenSummary"),
                                    "action": "Visit your local CSC to file an RTI for: " + req_str
                                }

                                await ws.send(json.dumps({
                                    "type": "tool.result",
                                    "call_id": call_id,
                                    "result": json.dumps(result_payload)
                                }))
                        except Exception as err:
                            print(f"[ERROR] Backend tool call failed: {err}", flush=True)

                # Stream audio playback cleanly to Speaker without buffer overlaps
                elif event_type == "reply.audio":
                    audio_bytes = base64.b64decode(event.get("data", ""))
                    speaker_stream.write(audio_bytes)

        await asyncio.gather(stream_mic(), handle_ws_messages())

if __name__ == "__main__":
    try:
        asyncio.run(run_agent())
    except KeyboardInterrupt:
        print("\n[EXIT] Voice Agent session ended.", flush=True)
