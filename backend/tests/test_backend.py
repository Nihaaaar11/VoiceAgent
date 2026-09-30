from fastapi.testclient import TestClient
from app.main import app
from app.conversation_engine import strip_markdown_and_formatting, enforce_single_question, detect_language

client = TestClient(app)

def test_root_and_health():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "online"
    assert response.json()["stt_engine"] == "AssemblyAI Speech-to-Text"
    
    health_resp = client.get("/health")
    assert health_resp.status_code == 200
    assert health_resp.json()["status"] == "ok"

def test_voice_tool_webhook():
    # Test Case 1: Localized loss reported after 72 hours
    resp1 = client.post("/api/voice-tool", json={
        "crop": "Paddy",
        "sumInsured": 50000,
        "claimReceived": 0,
        "damageType": "LOCALIZED",
        "reportingDelayHours": 96
    })
    assert resp1.status_code == 200
    assert resp1.json()["ruleCode"] == "PMFBY_SEC_21.5.4"

    # Test Case 2: Widespread loss reduction (ACF)
    resp2 = client.post("/api/voice-tool", json={
        "crop": "Cotton",
        "sumInsured": 60000,
        "claimReceived": 20000,
        "damageType": "WIDESPREAD"
    })
    assert resp2.status_code == 200
    assert resp2.json()["ruleCode"] == "PMFBY_SEC_25"

def test_assemblyai_status_endpoint():
    response = client.get("/api/assemblyai/status")
    assert response.status_code == 200
    data = response.json()
    assert "configured" in data
    assert "AssemblyAI" in data["service"]

def test_spoken_formatting_and_language_detection():
    md_input = "# Heading\n* **Bullet item 1**\n- Bullet item 2"
    clean = strip_markdown_and_formatting(md_input)
    assert "#" not in clean
    assert "*" not in clean
    assert "-" not in clean

    multi_q = "Which crop did you insure? For which season Kharif or Rabi?"
    single_q = enforce_single_question(multi_q)
    assert single_q.count("?") <= 1

    tel_lang, tel_name = detect_language("నా పంట దెబ్బతిన్నది అండి")
    assert tel_lang == "te"
    
    hin_lang, hin_name = detect_language("मेरा क्लेम रिजेक्ट हो गया जी")
    assert hin_lang == "hi"

def test_start_session_greeting():
    resp = client.post("/api/chat/start?language=te")
    assert resp.status_code == 200
    data = resp.json()
    assert "session_id" in data
    assert "నమస్తే" in data["greeting"]
    assert data["language"] == "te"

def test_scenario_a_workflow():
    start_resp = client.post("/api/chat/start")
    sid = start_resp.json()["session_id"]

    chat1 = client.post("/api/chat/interact", json={
        "session_id": sid,
        "message": "I received less claim money for my damaged crop."
    })
    assert chat1.status_code == 200
    r1 = chat1.json()
    assert r1["scenario"] == "SCENARIO_A"

    chat2 = client.post("/api/chat/interact", json={
        "session_id": sid,
        "message": "Paddy crop, Kharif season."
    })
    assert chat2.status_code == 200

    chat3 = client.post("/api/chat/interact", json={
        "session_id": sid,
        "message": "Expected 50000 rupees but received only 10000 rupees."
    })
    assert chat3.status_code == 200

    chat4 = client.post("/api/chat/interact", json={
        "session_id": sid,
        "message": "Only my field was damaged due to heavy rain."
    })
    assert chat4.status_code == 200

    chat5 = client.post("/api/chat/interact", json={
        "session_id": sid,
        "message": "No, I reported it after 5 days."
    })
    assert chat5.status_code == 200

    chat6 = client.post("/api/chat/interact", json={
        "session_id": sid,
        "message": "Crop was standing in the field."
    })
    assert chat6.status_code == 200
    r6 = chat6.json()
    assert r6["rti_ready"] == True

def test_scenario_b_workflow():
    start_resp = client.post("/api/chat/start?language=hi")
    sid = start_resp.json()["session_id"]

    chat1 = client.post("/api/chat/interact", json={
        "session_id": sid,
        "message": "मुझे नया फसल बीमा करवाना है"
    })
    assert chat1.status_code == 200
    r1 = chat1.json()
    assert r1["scenario"] == "SCENARIO_B"

    chat2 = client.post("/api/chat/interact", json={
        "session_id": sid,
        "message": "मेरे पास बैंक का केसीसी लोन नहीं है"
    })
    assert chat2.status_code == 200

def test_safety_and_pii_guardrails():
    start_resp = client.post("/api/chat/start")
    sid = start_resp.json()["session_id"]

    chat1 = client.post("/api/chat/interact", json={
        "session_id": sid,
        "message": "My Aadhaar number is 1234 5678 9012"
    })
    assert chat1.status_code == 200
    assert "aadhaar card" in chat1.json()["reply"].lower() or "ఫోన్" in chat1.json()["reply"] or "आधार" in chat1.json()["reply"]

    chat2 = client.post("/api/chat/interact", json={
        "session_id": sid,
        "message": "What is the market price of fertilizer today?"
    })
    assert chat2.status_code == 200
    assert "pmfby" in chat2.json()["reply"].lower() or "పంట బీమా" in chat2.json()["reply"] or "फसल बीमा" in chat2.json()["reply"]

def test_rti_draft_generation():
    req_data = {
        "farmer_name": "Ramesh Kumar",
        "mobile_number": "9876543210",
        "mandal_tehsil": "Guntur Rural",
        "gram_panchayat": "Narakoduru",
        "district": "Guntur",
        "state_name": "Andhra Pradesh",
        "crop": "Paddy",
        "season": "Kharif 2025",
        "language": "te"
    }
    resp = client.post("/api/rti/draft", json=req_data)
    assert resp.status_code == 200
    data = resp.json()
    assert "సమాచార హక్కు" in data["draft_title"]
    assert len(data["categories_demanded"]) == 3
    assert "Form-2" in data["categories_demanded"][0]
    assert "printable_html" in data
