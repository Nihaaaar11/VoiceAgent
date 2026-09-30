"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Send,
  Bot,
  User,
  Volume2,
  Sparkles,
  ArrowRight,
  CornerDownLeft,
} from "lucide-react";
import { ChatMessage } from "@/types/agent";

interface ChatModalDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onPlayMessageVoice: (text: string) => void;
  quickPrompts: { label: string; query: string }[];
  currentModelName: string;
}

export const ChatModalDrawer: React.FC<ChatModalDrawerProps> = ({
  isOpen,
  onClose,
  messages,
  onSendMessage,
  onPlayMessageVoice,
  quickPrompts,
  currentModelName,
}) => {
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText("");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-midnight/70 backdrop-blur-sm z-50 md:bg-midnight/50"
          />

          {/* Slide-out Drawer Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className="fixed top-0 right-0 h-full w-full sm:w-[460px] bg-slate-dusk/95 border-l border-eucalyptus/30 shadow-2xl z-50 flex flex-col backdrop-blur-xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-eucalyptus/20 bg-midnight/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-mint/20 text-mint flex items-center justify-center border border-mint/30">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-mint">Keyboard Chat Mode</h2>
                  <p className="text-[11px] text-eucalyptus font-mono">
                    Interacting with {currentModelName}
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-eucalyptus hover:text-mint hover:bg-slate-dusk transition-all"
                title="Close Chat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Prompts Carousel for Farmers */}
            <div className="px-4 py-2.5 border-b border-eucalyptus/15 bg-midnight/30 flex gap-2 overflow-x-auto no-scrollbar">
              <span className="text-[10px] uppercase font-bold text-eucalyptus shrink-0 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-mint" /> Quick:
              </span>
              {quickPrompts.map((p, i) => (
                <button
                  key={i}
                  onClick={() => onSendMessage(p.query)}
                  className="shrink-0 text-xs px-2.5 py-1 rounded-full bg-slate-dusk border border-eucalyptus/40 hover:border-mint text-mint transition-all hover:bg-mint/10 flex items-center gap-1 font-medium"
                >
                  <span>{p.label}</span>
                  <ArrowRight className="w-2.5 h-2.5 text-sage" />
                </button>
              ))}
            </div>

            {/* Message History List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-eucalyptus">
                  <Bot className="w-10 h-10 text-sage mb-2 opacity-60" />
                  <p className="text-sm font-medium text-mint">No messages yet</p>
                  <p className="text-xs text-eucalyptus mt-1">
                    Type a question below or pick a quick prompt to converse with the voice assistant.
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isUser = msg.sender === "user";
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 px-1">
                        {isUser ? (
                          <>
                            <span className="text-[10px] text-eucalyptus font-mono">
                              {msg.timestamp}
                            </span>
                            <span className="text-[11px] font-semibold text-sage">You</span>
                            <User className="w-3 h-3 text-sage" />
                          </>
                        ) : (
                          <>
                            <Bot className="w-3 h-3 text-mint" />
                            <span className="text-[11px] font-semibold text-mint">Voice Agent</span>
                            <span className="text-[10px] text-eucalyptus font-mono">
                              {msg.timestamp}
                            </span>
                          </>
                        )}
                      </div>

                      <div
                        className={`max-w-[85%] rounded-2xl p-3 text-sm leading-relaxed border transition-all ${
                          isUser
                            ? "bg-slate-dusk text-mint border-sage/40 rounded-tr-none shadow-md"
                            : "bg-midnight/80 text-mint border-eucalyptus/30 rounded-tl-none shadow-md"
                        }`}
                      >
                        <p>{msg.text}</p>
                        {msg.translatedText && (
                          <p className="mt-2 pt-2 border-t border-eucalyptus/20 text-xs text-sage italic">
                            {msg.translatedText}
                          </p>
                        )}

                        {!isUser && (
                          <div className="mt-2 pt-1 flex justify-end">
                            <button
                              onClick={() => onPlayMessageVoice(msg.text)}
                              className="flex items-center gap-1 text-[11px] text-sage hover:text-mint transition-colors py-0.5 px-1.5 rounded hover:bg-slate-dusk/60"
                              title="Speak this response aloud"
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                              <span>Listen in Voice Orb</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSubmit} className="p-3 bg-midnight/70 border-t border-eucalyptus/20">
              <div className="flex items-center gap-2 bg-slate-dusk rounded-xl border border-eucalyptus/40 px-3 py-1.5 focus-within:border-mint transition-colors shadow-inner">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Ask in Hindi or English (e.g. mandi rate, crops, schemes)..."
                  className="flex-1 bg-transparent text-sm text-mint placeholder:text-eucalyptus/60 outline-none"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="p-1.5 rounded-lg bg-mint text-midnight hover:bg-sage disabled:opacity-40 disabled:hover:bg-mint transition-all"
                  title="Send Message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center justify-between mt-2 px-1 text-[10px] text-eucalyptus font-mono">
                <span className="flex items-center gap-1">
                  Press <CornerDownLeft className="w-2.5 h-2.5" /> to send
                </span>
                <span>AssemblyAI Voice Compatible</span>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
