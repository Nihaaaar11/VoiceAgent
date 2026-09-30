import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import os from "os";
import { fileURLToPath } from "url";
import WebSocket from "ws";
import soundPlay from "sound-play";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const ASSEMBLYAI_WS_URL = "wss://agents.assemblyai.com/v1/ws";
const NEXTJS_BACKEND_TOOL = process.env.VOICE_TOOL_URL || "http://localhost:3000/api/voice-tool";
const API_KEY = process.env.ASSEMBLYAI_API_KEY;

if (!API_KEY) {
  console.error("Missing ASSEMBLYAI_API_KEY in environment variables.");
  process.exit(1);
}

// Helper: Convert PCM buffer to WAV format
function pcmToWav(pcmBuffer, sampleRate = 24000, numChannels = 1, bitDepth = 16) {
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcmBuffer.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM format
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE((sampleRate * numChannels * bitDepth) / 8, 28);
  header.writeUInt16LE((numChannels * bitDepth) / 8, 32);
  header.writeUInt16LE(bitDepth, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcmBuffer.length, 40);
  return Buffer.concat([header, pcmBuffer]);
}

// Sequential Audio Playback Queue to prevent dual overlapping voices & gaps
class AudioPlayerQueue {
  constructor() {
    this.queue = [];
    this.isPlaying = false;
  }

  enqueue(wavBuffer) {
    const tempPath = path.join(os.tmpdir(), `kisan_reply_${Date.now()}_${Math.random().toString(36).substring(7)}.wav`);
    fs.writeFileSync(tempPath, wavBuffer);
    this.queue.push(tempPath);
    this.processNext();
  }

  async processNext() {
    if (this.isPlaying || this.queue.length === 0) return;
    this.isPlaying = true;
    const currentFile = this.queue.shift();

    try {
      await soundPlay.play(currentFile);
    } catch (err) {
      // Audio playback warning ignore
    } finally {
      try {
        if (fs.existsSync(currentFile)) fs.unlinkSync(currentFile);
      } catch (e) {}
      this.isPlaying = false;
      this.processNext();
    }
  }

  stopAll() {
    this.queue = [];
    this.isPlaying = false;
  }
}

const audioQueue = new AudioPlayerQueue();

// Dynamically load mic module
let MicModule = null;
try {
  MicModule = (await import("mic")).default;
} catch (e) {
  console.warn("⚠️ Native 'mic' module not found.");
}

// 1. Vocabulary Boosting Keyterms
const KEYTERMS_PROMPT = [
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
];

// 2. Behavioral Boundaries & Guidelines (LLM Context)
const SYSTEM_PROMPT = `
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
`;

// 3. Tool Binding Schema
const TOOLS = [
  {
    type: "function",
    name: "diagnose_claim",
    description: "Calculates PMFBY claim deductions against operational guidelines.",
    parameters: {
      type: "object",
      properties: {
        crop: { type: "string" },
        sumInsured: { type: "number" },
        claimReceived: { type: "number" },
        damageType: {
          type: "string",
          enum: ["LOCALIZED", "WIDESPREAD", "POST_HARVEST", "PREVENTED_SOWING"]
        },
        reportingDelayHours: { type: "number" }
      },
      required: ["crop", "sumInsured", "claimReceived", "damageType"]
    }
  }
];

// 4. Connect to AssemblyAI Voice Agent API
const ws = new WebSocket(ASSEMBLYAI_WS_URL, {
  headers: { Authorization: `Bearer ${API_KEY}` }
});

let sessionReady = false;
let audioChunks = [];

ws.on("open", () => {
  console.log("Connected to AssemblyAI Voice Agent API");

  const sessionConfig = {
    type: "session.update",
    session: {
      // 1. Vocabulary boosting (STT Context)
      transcription: {
        keyterms_prompt: KEYTERMS_PROMPT
      },
      // 2. Behavioral Boundaries & Guidelines (LLM Context)
      system_prompt: SYSTEM_PROMPT,
      greeting: "Namaste. I am your crop insurance assistant. Are you calling about a reduced claim, or do you need help applying for new insurance?",
      output: { voice: "ivy" },
      // 3. Tool Binding (Deterministic Context)
      tools: TOOLS,
      turn_detection: {
        type: "server_vad",
        threshold: 0.65,
        prefix_padding_ms: 300,
        silence_duration_ms: 700
      }
    }
  };

  ws.send(JSON.stringify(sessionConfig));
});

ws.on("message", async (raw) => {
  const event = JSON.parse(raw.toString());

  if (event.type === "session.ready") {
    sessionReady = true;
    console.log("🟢 Agent ready. Speak into your microphone...");
    startMicrophone();
  }

  // Log user transcript events when AssemblyAI transcribes farmer's speech
  if (event.type === "transcript" || event.type === "user_speech" || event.transcript) {
    const text = event.transcript || event.text;
    if (text) {
      console.log(`🗣️ [Farmer Spoke]: "${text}"`);
    }
  }

  // Log assistant reply text
  if (event.type === "reply.text" || event.text) {
    if (event.text) {
      console.log(`🤖 [Kisan Sahayak]: "${event.text}"`);
    }
  }

  // Log errors
  if (event.type === "error") {
    console.error("❌ AssemblyAI Event Error:", event.message || event);
  }

  // Handle Tool Calls initiated by AssemblyAI
  if (event.type === "tool.call") {
    console.log("🔧 AssemblyAI requested tool execution:", event.name, event.parameters);

    if (event.name === "diagnose_claim") {
      try {
        const response = await fetch(NEXTJS_BACKEND_TOOL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(event.parameters)
        });
        const diagnosis = await response.json();
        console.log(`💡 [Rule Diagnosis]: ${diagnosis.clauseTitle} (${diagnosis.ruleCode})`);

        // Return the verified statutory result back to AssemblyAI
        ws.send(JSON.stringify({
          type: "tool.result",
          call_id: event.call_id,
          result: JSON.stringify({
            ruleCode: diagnosis.ruleCode,
            explanation: diagnosis.spokenSummary,
            action: "Visit your local CSC to file an RTI for: " + (diagnosis.requiredDataPoints ? diagnosis.requiredDataPoints.join(", ") : "")
          })
        }));
      } catch (err) {
        console.error("Backend tool call failed:", err);
      }
    }
  }

  // Stream synthesized audio chunks
  if (event.type === "reply.audio") {
    const chunk = Buffer.from(event.data, "base64");
    audioChunks.push(chunk);
  }

  // When assistant finishes turn, convert accumulated PCM to WAV and enqueue for sequential playback
  if (event.type === "reply.done") {
    if (audioChunks.length > 0) {
      const fullPcm = Buffer.concat(audioChunks);
      audioChunks = [];
      const wavBuffer = pcmToWav(fullPcm, 24000);
      audioQueue.enqueue(wavBuffer);
    }
  }

  // Barge-in: flush playback immediately if user interrupts
  if (event.type === "reply.done" && event.status === "interrupted") {
    audioChunks = [];
    audioQueue.stopAll();
  }
});

function startMicrophone() {
  if (!MicModule) {
    console.log("ℹ️ Audio microphone input disabled.");
    return;
  }

  try {
    const micInstance = MicModule({
      rate: "16000",
      channels: "1",
      encoding: "signed-integer",
      bitwidth: "16",
      endian: "little",
      exitOnSilence: 0
    });

    const micStream = micInstance.getAudioStream();
    
    micStream.on("error", (err) => {
      console.warn("⚠️ Microphone stream notice:", err.message);
    });

    micStream.on("data", (chunk) => {
      if (sessionReady && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: "input.audio",
          audio: chunk.toString("base64")
        }));
      }
    });

    micInstance.start();
    console.log("🎙️ Microphone active & streaming at 16kHz 16-bit Mono (SoX engine connected).");
  } catch (err) {
    console.warn("⚠️ Failed to initialize mic hardware:", err.message);
  }
}
