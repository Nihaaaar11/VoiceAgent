"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Cpu,
  Keyboard,
  ChevronDown,
  Globe,
  Radio,
  Check,
  Zap,
} from "lucide-react";
import { AIModel, LanguageOption } from "@/types/agent";

interface HeaderNavProps {
  currentModel: AIModel;
  models: AIModel[];
  onSelectModel: (model: AIModel) => void;
  currentLanguage: LanguageOption;
  languages: LanguageOption[];
  onSelectLanguage: (lang: LanguageOption) => void;
  isChatOpen: boolean;
  onToggleChat: () => void;
  unreadCount?: number;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  currentModel,
  models,
  onSelectModel,
  currentLanguage,
  languages,
  onSelectLanguage,
  isChatOpen,
  onToggleChat,
  unreadCount = 0,
}) => {
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

  const modelRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modelRef.current && !modelRef.current.contains(e.target as Node)) {
        setModelDropdownOpen(false);
      }
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="w-full glass-panel border-b border-eucalyptus/20 px-4 sm:px-6 py-3.5 flex items-center justify-between sticky top-0 z-40">
      {/* Left: Brand & Telemetry Badge */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-mint to-sage flex items-center justify-center text-midnight shadow-md shadow-mint/20 font-black text-lg">
          V
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-mint leading-none">
              VoiceAgent
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-dusk/70 text-sage border border-sage/30">
              <span className="w-1.5 h-1.5 rounded-full bg-mint animate-pulse" />
              Live AssemblyAI Core
            </span>
          </div>
          <p className="text-[11px] text-eucalyptus hidden sm:block">
            Multilingual Voice Assistant for Farmers
          </p>
        </div>
      </div>

      {/* Middle/Left: Language Picker */}
      <div className="relative" ref={langRef}>
        <button
          onClick={() => setLangDropdownOpen(!langDropdownOpen)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-dusk/60 hover:bg-slate-dusk border border-eucalyptus/40 text-mint text-xs transition-all font-medium"
        >
          <Globe className="w-3.5 h-3.5 text-sage" />
          <span>{currentLanguage.nativeLabel}</span>
          <span className="text-[10px] text-eucalyptus">({currentLanguage.label})</span>
          <ChevronDown className={`w-3.5 h-3.5 text-eucalyptus transition-transform ${langDropdownOpen ? "rotate-180" : ""}`} />
        </button>

        {langDropdownOpen && (
          <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-48 rounded-xl bg-slate-dusk border border-eucalyptus/30 shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95">
            <div className="px-2.5 py-1 text-[10px] uppercase font-semibold text-eucalyptus">
              Select Native Language
            </div>
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  onSelectLanguage(lang);
                  setLangDropdownOpen(false);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                  currentLanguage.code === lang.code
                    ? "bg-mint text-midnight font-bold"
                    : "text-mint hover:bg-midnight/60"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>{lang.flag}</span>
                  <span>{lang.nativeLabel}</span>
                  <span className="text-[10px] opacity-75">({lang.label})</span>
                </div>
                {currentLanguage.code === lang.code && <Check className="w-3.5 h-3.5" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* TOP RIGHT CORNER: AI Model Switcher & Keyboard Chat Option */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* 1. AI Model Switcher Dropdown */}
        <div className="relative" ref={modelRef}>
          <button
            onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-dusk/80 hover:bg-slate-dusk border border-eucalyptus/40 text-mint text-xs transition-all shadow-sm hover:border-mint"
            title="Switch AI Engine"
          >
            <div className="w-2 h-2 rounded-full bg-mint animate-ping" />
            <Cpu className="w-3.5 h-3.5 text-sage" />
            <div className="flex flex-col text-left">
              <span className="font-semibold text-mint text-xs leading-none">
                {currentModel.name}
              </span>
              <span className="text-[9px] text-eucalyptus font-mono">
                {currentModel.latencyMs}ms • {currentModel.tag}
              </span>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-eucalyptus transition-transform ml-0.5 ${modelDropdownOpen ? "rotate-180" : ""}`} />
          </button>

          {modelDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl bg-slate-dusk border border-eucalyptus/30 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95">
              <div className="px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider text-sage flex items-center justify-between">
                <span>Switch AI Model</span>
                <span className="text-[9px] text-eucalyptus font-mono">Auto-Sync</span>
              </div>
              <div className="space-y-1 mt-1">
                {models.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      onSelectModel(m);
                      setModelDropdownOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded-lg text-xs transition-all flex items-start justify-between ${
                      currentModel.id === m.id
                        ? "bg-midnight text-mint border border-mint/40"
                        : "text-mint hover:bg-midnight/40"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5 font-semibold text-mint">
                        <span>{m.name}</span>
                        {currentModel.id === m.id && (
                          <span className="px-1.5 py-0.2 text-[9px] rounded-full bg-mint text-midnight font-bold">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-eucalyptus line-clamp-1 mt-0.5">
                        {m.description}
                      </p>
                    </div>
                    <span className="text-[10px] font-mono text-sage whitespace-nowrap ml-2">
                      {m.latencyMs}ms
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 2. Keyboard Option to Chat with the AI Agent */}
        <button
          onClick={onToggleChat}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all relative ${
            isChatOpen
              ? "bg-mint text-midnight border-mint shadow-lg shadow-mint/20"
              : "bg-slate-dusk/80 text-mint border-eucalyptus/40 hover:border-mint hover:bg-slate-dusk"
          }`}
          title="Toggle Keyboard Chat"
        >
          <Keyboard className="w-4 h-4" />
          <span className="hidden sm:inline">Keyboard Chat</span>
          {unreadCount > 0 && !isChatOpen && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-mint text-midnight text-[10px] font-bold flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};
