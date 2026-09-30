export type AgentStatus = "idle" | "listening" | "thinking" | "speaking";

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  latencyMs: number;
  tag: string;
  description: string;
}

export interface LanguageOption {
  code: string;
  label: string;
  nativeLabel: string;
  flag: string;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "agent";
  text: string;
  translatedText?: string;
  timestamp: string;
  audioDuration?: string;
}

export interface VoicePreset {
  id: string;
  title: string;
  hindiQuery: string;
  englishQuery: string;
  agentResponseHindi: string;
  agentResponseEnglish: string;
}
