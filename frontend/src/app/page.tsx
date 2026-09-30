"use client";

import React, { useState, useEffect, useRef } from "react";
import { HeaderNav } from "@/components/HeaderNav";
import { VoiceVisualizer } from "@/components/VoiceVisualizer";
import { SubtitlePanel } from "@/components/SubtitlePanel";
import { BottomControls } from "@/components/BottomControls";
import { ChatModalDrawer } from "@/components/ChatModalDrawer";
import {
  AVAILABLE_MODELS,
  AVAILABLE_LANGUAGES,
  FARMER_PRESETS,
} from "@/data/mockData";
import { AgentStatus, AIModel, LanguageOption, ChatMessage, VoicePreset } from "@/types/agent";

export default function Home() {
  // Application State
  const [status, setStatus] = useState<AgentStatus>("idle");
  const [currentModel, setCurrentModel] = useState<AIModel>(AVAILABLE_MODELS[0]);
  const [currentLanguage, setCurrentLanguage] = useState<LanguageOption>(AVAILABLE_LANGUAGES[0]);
  const [isMicActive, setIsMicActive] = useState<boolean>(false);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.85);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [audioLevel, setAudioLevel] = useState<number>(0.2);
  const [activePresetId, setActivePresetId] = useState<string>(FARMER_PRESETS[0].id);

  // Subtitle State
  const [currentSubtitle, setCurrentSubtitle] = useState<string>(
    FARMER_PRESETS[0].agentResponseHindi
  );
  const [translatedSubtitle, setTranslatedSubtitle] = useState<string>(
    FARMER_PRESETS[0].agentResponseEnglish
  );

  // Chat Conversation State
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      sender: "agent",
      text: FARMER_PRESETS[0].agentResponseHindi,
      translatedText: FARMER_PRESETS[0].agentResponseEnglish,
      timestamp: "Just now",
    },
  ]);

  const speechTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioSimTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Clean speech synthesis wrapper
  const triggerAgentSpeech = (
    spokenText: string,
    englishText?: string,
    durationMs: number = 8000
  ) => {
    // Cancel any previous speech
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    if (speechTimerRef.current) clearTimeout(speechTimerRef.current);
    if (audioSimTimerRef.current) clearInterval(audioSimTimerRef.current);

    setCurrentSubtitle(spokenText);
    if (englishText) setTranslatedSubtitle(englishText);

    setStatus("thinking");

    setTimeout(() => {
      setStatus("speaking");

      // Try browser native SpeechSynthesis
      if (typeof window !== "undefined" && "speechSynthesis" in window && !isMuted) {
        const utterance = new SpeechSynthesisUtterance(spokenText);
        utterance.rate = playbackSpeed;
        utterance.volume = isMuted ? 0 : volume;

        // Try to match language if available
        if (currentLanguage.code === "hi") {
          utterance.lang = "hi-IN";
        } else if (currentLanguage.code === "en") {
          utterance.lang = "en-IN";
        }

        utterance.onend = () => {
          setStatus("idle");
          if (audioSimTimerRef.current) clearInterval(audioSimTimerRef.current);
          setAudioLevel(0.15);
        };

        utterance.onerror = () => {
          setStatus("idle");
          if (audioSimTimerRef.current) clearInterval(audioSimTimerRef.current);
          setAudioLevel(0.15);
        };

        window.speechSynthesis.speak(utterance);
      }

      // Simulate dynamic audio level oscillations for the Canvas Voice Orb
      audioSimTimerRef.current = setInterval(() => {
        setAudioLevel(0.35 + Math.random() * 0.55);
      }, 90);

      // Fallback timer if speech ends or not supported
      speechTimerRef.current = setTimeout(() => {
        setStatus("idle");
        if (audioSimTimerRef.current) clearInterval(audioSimTimerRef.current);
        setAudioLevel(0.15);
      }, durationMs);
    }, 450);
  };

  // Switch Native Language
  const handleSelectLanguage = (lang: LanguageOption) => {
    setCurrentLanguage(lang);
    const activePreset = FARMER_PRESETS.find((p) => p.id === activePresetId) || FARMER_PRESETS[0];
    const text = lang.code === "en" ? activePreset.agentResponseEnglish : activePreset.agentResponseHindi;
    const trans = lang.code === "en" ? activePreset.agentResponseHindi : activePreset.agentResponseEnglish;
    triggerAgentSpeech(text, trans, 6000);
  };

  // Switch AI Model
  const handleSelectModel = (model: AIModel) => {
    setCurrentModel(model);
    setStatus("thinking");
    setTimeout(() => {
      const text = `Model switched to ${model.name}. Optimized for ${model.tag} with ${model.latencyMs}ms latency.`;
      triggerAgentSpeech(text, text, 4000);
    }, 400);
  };

  // Toggle Mic
  const handleToggleMic = () => {
    const nextState = !isMicActive;
    setIsMicActive(nextState);

    if (nextState) {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      setStatus("listening");
      // Simulate listening wave
      const listenInterval = setInterval(() => {
        setAudioLevel(0.2 + Math.random() * 0.35);
      }, 100);

      setTimeout(() => {
        clearInterval(listenInterval);
        setIsMicActive(false);
        const preset = FARMER_PRESETS[Math.floor(Math.random() * FARMER_PRESETS.length)];
        setActivePresetId(preset.id);
        const isEn = currentLanguage.code === "en";
        const reply = isEn ? preset.agentResponseEnglish : preset.agentResponseHindi;
        const trans = isEn ? preset.agentResponseHindi : preset.agentResponseEnglish;

        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            sender: "user",
            text: isEn ? preset.englishQuery : preset.hindiQuery,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
          {
            id: (Date.now() + 1).toString(),
            sender: "agent",
            text: reply,
            translatedText: trans,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);

        triggerAgentSpeech(reply, trans, 8500);
      }, 3500);
    } else {
      setStatus("idle");
      setAudioLevel(0.15);
    }
  };

  // Replay speech
  const handleReplay = () => {
    triggerAgentSpeech(currentSubtitle, translatedSubtitle, 7000);
  };

  // Preset Selection
  const handleSelectPreset = (preset: VoicePreset) => {
    setActivePresetId(preset.id);
    const isEn = currentLanguage.code === "en";
    const userQuery = isEn ? preset.englishQuery : preset.hindiQuery;
    const agentResponse = isEn ? preset.agentResponseEnglish : preset.agentResponseHindi;
    const translated = isEn ? preset.agentResponseHindi : preset.agentResponseEnglish;

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        sender: "user",
        text: userQuery,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
      {
        id: (Date.now() + 1).toString(),
        sender: "agent",
        text: agentResponse,
        translatedText: translated,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);

    triggerAgentSpeech(agentResponse, translated, 9000);
  };

  // Chat message submission from Keyboard Chat Drawer
  const handleSendMessage = (text: string) => {
    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, newMsg]);
    setStatus("thinking");

    // Generate responsive farm advisory answer
    setTimeout(() => {
      const responseHindi = `आपके प्रश्न "${text}" के लिए किसान डिजिटल सेवा केंद्र से विवरण प्राप्त हो गया है। हमारी अनुशंसा के अनुसार नजदीकी कृषि विज्ञान केंद्र से संपर्क करें अथवा 1800-180-1551 पर कॉल करें।`;
      const responseEnglish = `Details retrieved for your inquiry: "${text}". As per regional advisory, please consult your local Krishi Vigyan Kendra or dial toll-free 1800-180-1551.`;

      const isEn = currentLanguage.code === "en";
      const finalReply = isEn ? responseEnglish : responseHindi;
      const transReply = isEn ? responseHindi : responseEnglish;

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "agent",
          text: finalReply,
          translatedText: transReply,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);

      triggerAgentSpeech(finalReply, transReply, 7000);
    }, 1200);
  };

  // Quick prompts for keyboard drawer
  const quickPrompts = FARMER_PRESETS.map((p) => ({
    label: p.title,
    query: currentLanguage.code === "en" ? p.englishQuery : p.hindiQuery,
  }));

  return (
    <div className="min-h-screen flex flex-col bg-midnight text-mint selection:bg-mint selection:text-midnight">
      {/* 1. TOP BAR: AI Model Switcher & Keyboard Chat Button on Top Right Corner */}
      <HeaderNav
        currentModel={currentModel}
        models={AVAILABLE_MODELS}
        onSelectModel={handleSelectModel}
        currentLanguage={currentLanguage}
        languages={AVAILABLE_LANGUAGES}
        onSelectLanguage={handleSelectLanguage}
        isChatOpen={isChatOpen}
        onToggleChat={() => setIsChatOpen(!isChatOpen)}
        unreadCount={messages.length}
      />

      {/* 2. MAIN CENTER HERO: Active Voice Orb Animation + Live Subtitle on Right Part */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
          {/* LEFT / CENTER: Active Voice Animation Sphere (Canvas + Ripple Physics) */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center">
            <VoiceVisualizer
              status={status}
              audioLevel={audioLevel}
              language={currentLanguage.label}
              onToggleMic={handleToggleMic}
              isMicActive={isMicActive}
            />
          </div>

          {/* RIGHT PART: Realtime Subtitle of What the AI Agent Is Talking */}
          <div className="lg:col-span-6 flex flex-col h-full min-h-[360px] sm:min-h-[420px]">
            <SubtitlePanel
              status={status}
              currentSubtitle={currentSubtitle}
              playbackSpeed={playbackSpeed}
            />
          </div>
        </div>
      </main>

      {/* 3. KEYBOARD CHAT DRAWER (Slide-out when Keyboard icon is clicked) */}
      <ChatModalDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        messages={messages}
        onSendMessage={handleSendMessage}
        onPlayMessageVoice={(txt) => triggerAgentSpeech(txt, undefined, 6000)}
        quickPrompts={quickPrompts}
        currentModelName={currentModel.name}
      />

      {/* 4. BOTTOM CONTROLS: Microphone toggle, preset test triggers, volume slider */}
      <BottomControls
        isMicActive={isMicActive}
        onToggleMic={handleToggleMic}
        presets={FARMER_PRESETS}
        onSelectPreset={handleSelectPreset}
        activePresetId={activePresetId}
        volume={volume}
        onChangeVolume={(v) => {
          setVolume(v);
          if (v > 0) setIsMuted(false);
        }}
        isMuted={isMuted}
        onToggleMute={() => setIsMuted(!isMuted)}
      />
    </div>
  );
}
