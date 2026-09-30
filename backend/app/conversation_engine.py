import re
import uuid
import logging
from typing import Dict, Tuple, Optional
from app.config import settings
from app.system_prompt import KISAN_SAHAYAK_SYSTEM_PROMPT
from app.models import (
    SessionState, ScenarioEnum, CollectedFarmerData, ChatMessage,
    ChatResponse, StartSessionResponse
)

logger = logging.getLogger("kisan_sahayak.engine")

# In-memory session store (in production, use Redis or Postgres)
SESSIONS: Dict[str, SessionState] = {}

def create_session(language: str = "en") -> Tuple[str, SessionState]:
    session_id = str(uuid.uuid4())
    greeting_text = (
        "Namaste. I am your Crop Insurance assistant. "
        "Are you calling to check an issue with a received or rejected claim, "
        "or do you need help applying for new crop insurance?"
    )
    
    # Adjust initial greeting based on language preference if provided
    lang_code = language.lower()
    if lang_code.startswith("te"):
        greeting_text = (
            "నమస్తే అండి. నేను మీ పంటల బీమా సహాయకుడిని. "
            "మీరు క్లెయిమ్ తిరస్కరణ లేదా తక్కువ పరిహారం సమస్య గురించి మాట్లాడుతున్నారా, "
            "లేదా కొత్త పంటల బీమా కోసం దరఖాస్తు చేసుకోవడానికి సహాయం కావాలా?"
        )
    elif lang_code.startswith("hi"):
        greeting_text = (
            "नमस्ते जी। मैं आपका फसल बीमा सहायक हूँ। "
            "क्या आप क्लेम रिजेक्शन या कम मुआवजे की समस्या के लिए फोन कर रहे हैं, "
            "या आपको नई फसल बीमा आवेदन में मदद चाहिए?"
        )
    
    state = SessionState(
        session_id=session_id,
        language=lang_code,
        conversation_history=[
            ChatMessage(role="assistant", content=greeting_text)
        ]
    )
    SESSIONS[session_id] = state
    return session_id, state

def get_session(session_id: str) -> Optional[SessionState]:
    return SESSIONS.get(session_id)

def detect_language(user_text: str) -> Tuple[str, str]:
    """Detect spoken language from input text."""
    # Check for Telugu characters
    if any('\u0c00' <= char <= '\u0c7f' for char in user_text):
        return "te", "Telugu"
    # Check for Devanagari (Hindi/Marathi) characters
    if any('\u0900' <= char <= '\u097f' for char in user_text):
        if "आहे" in user_text or "नाही" in user_text or "माझा" in user_text:
            return "mr", "Marathi"
        return "hi", "Hindi"
    # Check for Tamil characters
    if any('\u0b80' <= char <= '\u0bff' for char in user_text):
        return "ta", "Tamil"
    # Default to English
    return "en", "English"

def strip_markdown_and_formatting(text: str) -> str:
    """Ensure SPOKEN-FIRST design: strip markdown symbols, bullet points, asterisks, tables."""
    # Replace markdown headings
    text = re.sub(r'#+\s*', '', text)
    # Replace markdown bold/italic
    text = re.sub(r'\*+|\_+', '', text)
    # Replace list bullets like * item, - item, 1. item
    text = re.sub(r'^\s*[\*\-\•]\s*', '', text, flags=re.MULTILINE)
    text = re.sub(r'^\s*\d+\.\s*', '', text, flags=re.MULTILINE)
    # Replace percent symbol for audio clarity in English
    # text = text.replace("%", " percent")
    # Clean extra whitespaces and line breaks into spoken text
    text = re.sub(r'\n+', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def enforce_single_question(text: str) -> str:
    """Ensure ONE QUESTION AT A TIME rule."""
    sentences = re.split(r'(?<=[.?!])\s+', text)
    question_count = 0
    filtered_sentences = []
    
    for sentence in sentences:
        if "?" in sentence:
            question_count += 1
            if question_count > 1:
                # Keep only the first question
                continue
        filtered_sentences.append(sentence)
        
    return " ".join(filtered_sentences)

def detect_scenario(user_text: str) -> ScenarioEnum:
    """Categorize caller intent into Scenario A or Scenario B."""
    text = user_text.lower()
    
    # Scenario A keywords (post-claim reduction / rejection / delay)
    claim_keywords = [
        "claim", "rejected", "received less", "payout", "cut", "money",
        "compensation", "loss", "damaged", "ruined", "delay", "haven't received",
        "తక్కువ", "క్లెయిమ్", "రద్దైంది", "నష్టం", "డబ్బులు",
        "कम", "रिजेक्ट", "मुआवजा", "नुकसान", "पैसा"
    ]
    
    # Scenario B keywords (pre-application & eligibility)
    apply_keywords = [
        "apply", "new", "insurance", "eligible", "premium", "kcc",
        "loanee", "documents", "process", "register", "how to insure",
        "కొత్త", "అప్లై", "దరఖాస్తు", "ప్రీమియం", "కాగితాలు",
        "नया", "आवेदन", "अप्लाई", "प्रीमियम", "कागज"
    ]
    
    a_score = sum(1 for kw in claim_keywords if kw in text)
    b_score = sum(1 for kw in apply_keywords if kw in text)
    
    if a_score > b_score:
        return ScenarioEnum.SCENARIO_A
    elif b_score > a_score:
        return ScenarioEnum.SCENARIO_B
    elif a_score > 0:
        return ScenarioEnum.SCENARIO_A
    elif b_score > 0:
        return ScenarioEnum.SCENARIO_B
    return ScenarioEnum.UNDETERMINED

async def in_call_llm(system_prompt: str, history: list) -> str:
    """Call external LLM (OpenAI / Gemini) if key is present."""
    if settings.OPENAI_API_KEY:
        try:
            from openai import AsyncOpenAI
            client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
            messages = [{"role": "system", "content": system_prompt}] + history
            resp = await client.chat.completions.create(
                model=settings.DEFAULT_MODEL,
                messages=messages,
                temperature=0.3,
                max_tokens=250
            )
            return resp.choices[0].message.content
        except Exception as e:
            logger.warning(f"OpenAI call failed: {e}")

    if settings.GEMINI_API_KEY:
        try:
            from google import genai
            client = genai.Client(api_key=settings.GEMINI_API_KEY)
            # Combine conversation
            contents = system_prompt + "\n\n"
            for m in history:
                contents += f"{m['role'].upper()}: {m['content']}\n"
            response = client.models.generate_content(
                model=settings.DEFAULT_MODEL or "gemini-flash-latest",
                contents=contents
            )
            return response.text
        except Exception as e:
            logger.warning(f"Gemini call failed: {e}")
            
    return ""

def rule_based_fallback_response(state: SessionState, user_text: str) -> str:
    """Rule-based conversational state machine adhering 100% to guidelines."""
    lang = state.language
    scenario = state.scenario
    step = state.current_step
    
    # 1. Handle Out-Of-Bounds deflection
    oob_keywords = ["weather", "fertilizer", "subsidy", "election", "politics", "market price", "వాతావరణం", "ఎరువులు", "मौसम", "खाद"]
    if any(kw in user_text.lower() for kw in oob_keywords):
        if lang == "te":
            return "అండి, నేను పిఎంఎఫ్‌బివై పంట బీమా నియమాలు మరియు క్లెయిమ్‌లకు మాత్రమే సహాయం చేయగలను. దయచేసి మీ పంట బీమా సమస్యపై దృష్టి పెడదాం."
        elif lang == "hi":
            return "जी, मैं केवल पीएमएफबीवाई फसल बीमा नियमों और दावों में सहायता कर सकता हूँ। आइए आपकी फसल समस्या पर ध्यान दें।"
        else:
            return "Sir, I can only assist you with PMFBY crop insurance rules, claims, and applications. Let us focus on your crop issue."

    # 2. Check PII violation prevention
    pii_keywords = ["aadhaar number", "bank account number", "otp", "pin", "ఆధార్ నంబర్", "ఖాతా నంబర్", "आधार नंबर"]
    if any(kw in user_text.lower() for kw in pii_keywords):
        if lang == "te":
            return "దయచేసి ఫోన్‌లో మీ ఆధార్ లేదా బ్యాంక్ పిన్ నంబర్లను చెప్పకండి. మీ వద్ద ఆధార్ కార్డు భద్రంగా ఉంచుకోండి."
        elif lang == "hi":
            return "कृपया फोन पर अपना आधार या बैंक नंबर न बोलें। बस अपना आधार कार्ड सुरक्षित रखें।"
        else:
            return "Please do not speak your confidential numbers over the phone. Just keep your Aadhaar card ready."

    # Scenario A (Post-claim issue)
    if scenario == ScenarioEnum.SCENARIO_A:
        if step == 1:
            state.current_step = 2
            if lang == "te":
                return "మీ సమస్య అర్థమైంది అండి. మీరు ఏ పంటకు బీమా చేశారు, మరియు అది ఏ సీజన్ — ఖరీఫ్ లేదా రబీ?"
            elif lang == "hi":
                return "आपकी समस्या समझ आई जी। आपने किस फसल का बीमा कराया था, और वह कौन सा सीजन था — खरीफ या रबी?"
            else:
                return "I understand your concern sir. Which crop did you insure, and for which season — Kharif or Rabi?"
        elif step == 2:
            state.current_step = 3
            if lang == "te":
                return "ధన్యవాదాలు అండి. మీకు రావాల్సిన బీమా మొత్తమెంత, మరియు ఎంత పరిహారం మీ బ్యాంక్ ఖాతాలో జమ అయింది?"
            elif lang == "hi":
                return "धन्यवाद जी। आपकी अपेक्षित बीमा राशि कितनी थी, और कितना मुआवजा आपके बैंक खाते में पहुंचा?"
            else:
                return "Thank you sir. What was your expected insured amount, and how much compensation actually reached your bank account?"
        elif step == 3:
            state.current_step = 4
            if lang == "te":
                return "సరే అండి. ఈ పంట నష్టం కేవలం మీ పొలానికే జరిగిందా, లేదా గ్రామంలోని అందరి పొలాలకు జరిగిందా?"
            elif lang == "hi":
                return "ठीक है जी। क्या यह फसल नुकसान सिर्फ आपके खेत में हुआ, या पूरे गांव की फसल प्रभावित हुई?"
            else:
                return "Understood sir. Did the damage happen to only your field, or was the entire village affected?"
        elif step == 4:
            state.current_step = 5
            if lang == "te":
                return "ఒకవేళ మీ పొలానికే నష్టం జరిగి ఉంటే, మీరు 72 గంటల వ్యవధిలో వ్యవసాయ అధికారులకు లేదా యాప్‌ ద్వారా నివేదించారా?"
            elif lang == "hi":
                return "यदि नुकसान केवल आपके खेत में हुआ, तो क्या आपने घटना के 72 घंटों के भीतर रिपोर्ट दर्ज कराई थी?"
            else:
                return "If the damage was only in your field, did you report it within 72 hours of the event?"
        elif step == 5:
            state.current_step = 6
            if lang == "te":
                return "ఈ నష్టం చేనులో పంట నిలబడి ఉన్నప్పుడు జరిగిందా, లేదా కోత కోసి నూర్పిడి కోసం ఎండబెడుతున్నప్పుడు జరిగిందా?"
            elif lang == "hi":
                return "क्या यह नुकसान खड़ी फसल में हुआ था, या कटाई के बाद खेत में सूखने के दौरान हुआ?"
            else:
                return "Did the loss happen while the crop was standing, or after harvesting while drying in the field?"
        elif step == 6:
            state.current_step = 7
            state.rti_ready = True
            if lang == "te":
                return (
                    "ప్రభుత్వ నిబంధనల ప్రకారం క్లెయిమ్ తిరస్కరణ లేదా తగ్గింపు వెనుక సెక్షన్ 25 ఏరియా కరెక్షన్ ఫ్యాక్టర్ లేదా CCE దిగుబడి వ్యత్యాసాలు ఉంటాయి. "
                    "దీనికి నిజమైన కారణం తెలుసుకోవడానికి మీకు RTI సమాచార హక్కు చట్టం కింద హక్కు ఉంది. "
                    "మీరు స్థానిక మండల్ వ్యవసాయ అధికారి PIOకి ఫారం-2 CCE ఫలితాలు మరియు ACF వివరాల కోసం దరఖాస్తు చేయవచ్చు. "
                    "మీ సమీప మీసేవ లేదా సిఎస్‌సి సెంటర్‌కు వెళ్లి మీ ఫోన్ నంబర్ చెప్తే crop.ins పోర్టల్ నుండి ప్రీ-ఫిల్ చేసిన ఆర్టీఐ డ్రాఫ్ట్ ప్రింట్ తీసుకోవచ్చు."
                )
            elif lang == "hi":
                return (
                    "सरकारी नियमों के अनुसार क्लेम में कटौती का कारण धारा 25 एरिया करेक्शन फैक्टर या CCE कटाई औसत हो सकता है। "
                    "असली कारण जानने के लिए आपके पास आरटीआई कानून के तहत अधिकार है। "
                    "आप स्थानीय तहसील कृषि अधिकारी PIO को फॉर्म-2 CCE परिणाम और ACF गुणक के लिए आवेदन जमा करें। "
                    "निकटतम सीएससी केंद्र जाकर अपना मोबाइल नंबर बताएं और crop.ins पोर्टल से तैयार आरटीआई ड्राफ्ट प्रिंट करवाएं।"
                )
            else:
                return (
                    "Based on government guidelines, claim reductions happen due to Section 25 Area Correction Factor or CCE yield shortfalls. "
                    "To demand official reasons, you have the legal right under the RTI Act. "
                    "Address an RTI application to your Mandal Agriculture Officer PIO for Form-2 CCE results and ACF multipliers. "
                    "Visit your nearest CSC center, share your phone number, and print your pre-filled RTI draft from the crop.ins portal."
                )
        else:
            state.rti_ready = True
            if lang == "te":
                return "మీరు స్థానిక సిఎస్సి సెంటర్ వద్ద మీ ఫోన్ నంబర్ చెప్పి crop.ins పోర్టల్ ద్వారా ఆర్టీఐ డ్రాఫ్ట్ ప్రింట్ పొంది సమర్పించవచ్చు."
            elif lang == "hi":
                return "आप निकटतम सीएससी सेंटर पर अपना मोबाइल नंबर बताकर crop.ins पोर्टल से तैयार आरटीआई आवेदन प्राप्त कर सकते हैं।"
            else:
                return "You can visit your nearest CSC center, share your phone number, and obtain your printed RTI draft from the crop.ins portal."

    # Scenario B (Pre-application guidance)
    elif scenario == ScenarioEnum.SCENARIO_B:
        if step == 1:
            state.current_step = 2
            if lang == "te":
                return "మీరు ఈ పంట కోసం బ్యాంక్ నుండి కిసాన్ క్రెడిట్ కార్డ్ రుణం తీసుకున్నారా, లేదా స్వయంగా దరఖాస్తు చేసుకుంటున్నారా?"
            elif lang == "hi":
                return "क्या आपके पास इस फसल के लिए बैंक से किसान क्रेडिट कार्ड लोन है, या आप स्वयं आवेदन कर रहे हैं?"
            else:
                return "Do you have an active Kisan Credit Card loan from a bank for this crop, or are you a non-loanee farmer applying on your own?"
        elif step == 2:
            state.current_step = 3
            if lang == "te":
                return (
                    "రుణగ్రహీతలకు బీమా ప్రీమియం బ్యాంక్ నుండి ఆటోమేటిక్‌గా కట్ అవుతుంది. నాన్-లోనీ రైతులు సిఎస్‌సి సెంటర్ లేదా pmfby.gov.in ద్వారా దరఖాస్తు చేసుకోవాలి. "
                    "మీ వద్ద భూమి పట్టాదారు పాస్‌బుక్, విత్తిన ధృవీకరణ పత్రం, ఆధార్ కార్డు మరియు బ్యాంక్ పాస్‌బుక్ తప్పనిసరిగా ఉండాలి."
                )
            elif lang == "hi":
                return (
                    "ऋणी किसानों का बीमा बैंक से अपने आप कट जाता है। गैर-ऋणी किसान सीएससी केंद्र या pmfby.gov.in से आवेदन कर सकते हैं। "
                    "आपके पास भूमि पासबुक, बुआई प्रमाण पत्र, आधार कार्ड और सक्रिय बैंक पासबुक होनी चाहिए।"
                )
            else:
                return (
                    "For loanee farmers, insurance is automatically deducted by your bank. Non-loanee farmers can apply via CSC or pmfby.gov.in. "
                    "You must have your land passbook, sowing certificate, Aadhaar card, and active bank passbook ready."
                )
        elif step == 3:
            state.current_step = 4
            if lang == "te":
                return (
                    "ప్రీమియం ధరలు ప్రభుత్వంచే పరిమితం చేయబడ్డాయి. ఖరీఫ్ పంటలకు గరిష్టంగా 2 శాతం, రబీ పంటలకు 1.5 శాతం, వాణిజ్య పంటలకు 5 శాతం మాత్రమే చెల్లించాలి. "
                    "మిగిలిన ప్రీమియం మొత్తాన్ని కేంద్ర మరియు రాష్ట్ర ప్రభుత్వాలు భరిస్తాయి."
                )
            elif lang == "hi":
                return (
                    "बीमा प्रीमियम की दरें तय हैं। खरीफ फसलों के लिए अधिकतम 2 प्रतिशत, रबी फसलों के लिए 1.5 प्रतिशत, और वाणिज्यिक फसलों के लिए 5 प्रतिशत देना होता है। "
                    "बाकी का प्रीमियम केंद्र और राज्य सरकारें देती हैं।"
                )
            else:
                return (
                    "Maximum premium caps are statutory. Kharif crops pay maximum 2 percent, Rabi crops pay 1.5 percent, and commercial crops pay 5 percent. "
                    "The remaining premium is fully paid by the Government."
                )
        else:
            if lang == "te":
                return (
                    "ముఖ్యమైన నిబంధనలు గుర్తుంచుకోండి: మీ ఆధార్‌లోని పేరు మరియు బ్యాంక్ ఖాతా పేరు ఒకేలా ఉండాలి. "
                    "మీ బ్యాంక్ ఖాతాలో DBT యాక్టివ్‌గా ఉందో లేదో సరిచూసుకోండి మరియు దరఖాస్తు రసీదు సంఖ్యను భద్రంగా ఉంచుకోండి."
                )
            elif lang == "hi":
                return (
                    "जरूरी नियम याद रखें: आपका आधार नाम और बैंक खाता नाम बिल्कुल समान होना चाहिए। "
                    "अपने बैंक खाते में डीबीटी सक्रिय रखें और सीएससी एजेंट से पावती रसीद सुरक्षित रखें।"
                )
            else:
                return (
                    "Golden rules to remember: Ensure your Aadhaar name matches your bank passbook name exactly. "
                    "Keep DBT active on your bank account, and safely preserve your application acknowledgment receipt."
                )

    # Default routing step
    if lang == "te":
        return "మీరు నమోదిత క్లెయిమ్ సమస్య గురించి మాట్లాడుతున్నారా, లేదా క్రొత్తగా పంట బీమా అప్లై చేయాలనుకుంటున్నారా?"
    elif lang == "hi":
        return "क्या आप क्लेम रिजेक्शन या कटौती की समस्या के लिए फोन कर रहे हैं, या नई फसल बीमा आवेदन में मदद चाहिए?"
    else:
        return "Are you calling to check an issue with a received or rejected claim, or do you need help applying for new crop insurance?"

async def process_chat(session_id: Optional[str], user_message: str, requested_lang: Optional[str] = None) -> ChatResponse:
    # Fetch or create session
    if not session_id or session_id not in SESSIONS:
        sid, state = create_session(language=requested_lang or "en")
        session_id = sid
    else:
        state = SESSIONS[session_id]

    # Detect language if not explicitly locked
    detected_lang, lang_name = detect_language(user_message)
    if requested_lang:
        state.language = requested_lang
        state.language_name = lang_name
    elif detected_lang != "en" or state.language == "en":
        state.language = detected_lang
        state.language_name = lang_name

    # Add user message to history
    state.conversation_history.append(ChatMessage(role="user", content=user_message))

    # Detect scenario if undetermined
    if state.scenario == ScenarioEnum.UNDETERMINED:
        scen = detect_scenario(user_message)
        if scen != ScenarioEnum.UNDETERMINED:
            state.scenario = scen
            state.current_step = 1

    # Try LLM first if API key configured
    raw_response = await in_call_llm(KISAN_SAHAYAK_SYSTEM_PROMPT, [
        {"role": m.role, "content": m.content} for m in state.conversation_history
    ])

    # Fallback to rule engine if LLM response is empty or unconfigured
    if not raw_response or len(raw_response.strip()) == 0:
        raw_response = rule_based_fallback_response(state, user_message)

    # Post-process response for spoken-first voice output
    spoken_text = strip_markdown_and_formatting(raw_response)
    spoken_text = enforce_single_question(spoken_text)

    # Set rti_ready flag if RTI guidance is detected or step is completed
    if "rti" in spoken_text.lower() or "సమాచార హక్కు" in spoken_text or "सूचना का अधिकार" in spoken_text or state.current_step >= 5:
        state.rti_ready = True

    # Save assistant response to conversation history
    state.conversation_history.append(ChatMessage(role="assistant", content=spoken_text))

    return ChatResponse(
        session_id=state.session_id,
        reply=spoken_text,
        language=state.language,
        scenario=state.scenario,
        spoken_formatted=spoken_text,
        state=state,
        rti_ready=state.rti_ready
    )
