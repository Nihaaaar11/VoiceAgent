import { AIModel, LanguageOption, VoicePreset } from "@/types/agent";

export const AVAILABLE_MODELS: AIModel[] = [
  {
    id: "assemblyai-lemur",
    name: "AssemblyAI LeMUR",
    provider: "AssemblyAI",
    latencyMs: 72,
    tag: "Voice Native",
    description: "Ultra-low latency speech understanding tailored for conversational audio.",
  },
  {
    id: "claude-3-5-sonnet",
    name: "Claude 3.5 Sonnet",
    provider: "Anthropic",
    latencyMs: 140,
    tag: "Deep Reasoning",
    description: "High precision agricultural advisory and crop disease diagnostics.",
  },
  {
    id: "gpt-4o-voice",
    name: "GPT-4o Realtime",
    provider: "OpenAI",
    latencyMs: 110,
    tag: "Multimodal",
    description: "Real-time speech-to-speech with natural conversational interruptions.",
  },
  {
    id: "gemini-1-5-flash",
    name: "Gemini 1.5 Flash",
    provider: "Google DeepMind",
    latencyMs: 65,
    tag: "Ultra Fast",
    description: "Optimized for fast bilingual translation and rapid mobile responses.",
  },
];

export const AVAILABLE_LANGUAGES: LanguageOption[] = [
  { code: "hi", label: "Hindi", nativeLabel: "हिन्दी", flag: "🇮🇳" },
  { code: "en", label: "English", nativeLabel: "English", flag: "🌐" },
  { code: "te", label: "Telugu", nativeLabel: "తెలుగు", flag: "🌾" },
  { code: "ta", label: "Tamil", nativeLabel: "தமிழ்", flag: "🌱" },
  { code: "mr", label: "Marathi", nativeLabel: "मराठी", flag: "🚜" },
  { code: "kn", label: "Kannada", nativeLabel: "ಕನ್ನಡ", flag: "🌿" },
];

export const FARMER_PRESETS: VoicePreset[] = [
  {
    id: "wheat-msp",
    title: "Wheat MSP & Mandi Rates",
    hindiQuery: "गेहूं का ताजा न्यूनतम समर्थन मूल्य और नजदीकी मंडी का भाव क्या है?",
    englishQuery: "What is the current wheat MSP and nearby mandi price?",
    agentResponseHindi:
      "नमस्ते किसान भाई! वर्ष 2025-26 के लिए गेहूं का न्यूनतम समर्थन मूल्य ₹2,425 प्रति क्विंटल तय किया गया है। आपकी नजदीकी मंडी में आज औसत भाव ₹2,480 से ₹2,530 प्रति क्विंटल चल रहा है। क्या आप आज के ई-नाम टोकन का पंजीकरण करवाना चाहते हैं?",
    agentResponseEnglish:
      "Greetings Kisan brother! The Minimum Support Price for wheat for 2025-26 is set at ₹2,425 per quintal. In your nearest mandi, today's average rate is hovering between ₹2,480 and ₹2,530. Would you like assistance registering an e-NAM mandi slot?",
  },
  {
    id: "pest-control",
    title: "Crop Disease Diagnosis",
    hindiQuery: "मेरी धान की फसल में पत्तियां पीली पड़ रही हैं, मुझे क्या करना चाहिए?",
    englishQuery: "My paddy leaves are turning yellow, what should I do?",
    agentResponseHindi:
      "धान की पत्तियों का पीला पड़ना नाइट्रोजन की कमी या जिंक की कमी का लक्षण हो सकता है। यदि पत्तियों के बीच में भूरे धब्बे हैं, तो यह जीवाणु झुलसा (Bacterial Blight) हो सकता है। प्राथमिक उपचार हेतु प्रति एकड़ 5 किलोग्राम जिंक सल्फेट और 2 किलोग्राम यूरिया का 200 लीटर पानी में घोल बनाकर तुरंत छिड़काव करें।",
    agentResponseEnglish:
      "Yellowing of paddy leaves typically signals zinc or nitrogen deficiency. If there are brown lesions along the leaf margins, it may be Bacterial Leaf Blight. For immediate recovery, spray 5 kg Zinc Sulphate and 2 kg Urea dissolved in 200 liters of water per acre.",
  },
  {
    id: "subsidy-scheme",
    title: "PM-Kisan & Solar Pump Subsidy",
    hindiQuery: "पीएम कुसुम योजना के तहत सोलर पंप पर कितनी सब्सिडी मिल रही है?",
    englishQuery: "How much subsidy is available for solar pumps under PM-KUSUM?",
    agentResponseHindi:
      "पीएम कुसुम योजना के तहत किसानों को 3 एचपी से 7.5 एचपी तक के सोलर पंप स्थापना पर केंद्र और राज्य सरकार मिलकर 60% तक की प्रत्यक्ष सब्सिडी प्रदान कर रही हैं। किसान को केवल 10% अग्रिम राशि देनी होती है, जबकि शेष 30% तक बैंक ऋण उपलब्ध है। क्या मैं आपके लिए आवश्यक दस्तावेजों की सूची खोलूं?",
    agentResponseEnglish:
      "Under the PM-KUSUM scheme, farmers receive up to 60% combined central and state subsidy for installing 3 HP to 7.5 HP solar water pumps. You only need to invest 10% upfront, and up to 30% is financeable via bank loans. Would you like to review the required documents?",
  },
];
