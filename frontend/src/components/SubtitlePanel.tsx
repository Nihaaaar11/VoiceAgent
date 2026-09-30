"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AgentStatus } from "@/types/agent";

interface SubtitlePanelProps {
  status: AgentStatus;
  currentSubtitle: string;
  playbackSpeed?: number;
}

export const SubtitlePanel: React.FC<SubtitlePanelProps> = ({
  status,
  currentSubtitle,
  playbackSpeed = 1.0,
}) => {
  const [activeWordIndex, setActiveWordIndex] = useState(0);
  const words = (currentSubtitle || "").split(" ");

  // Progressively highlight words when speaking
  useEffect(() => {
    if (status !== "speaking") {
      setActiveWordIndex(words.length);
      return;
    }

    setActiveWordIndex(0);
    const intervalTime = Math.max(120, Math.floor(280 / playbackSpeed));
    const interval = setInterval(() => {
      setActiveWordIndex((prev) => {
        if (prev < words.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, intervalTime);

    return () => clearInterval(interval);
  }, [status, currentSubtitle, playbackSpeed, words.length]);

  return (
    <div className="flex flex-col justify-center h-full px-2 sm:px-6 py-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSubtitle}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="text-sm sm:text-lg lg:text-[22px] font-normal leading-relaxed sm:leading-relaxed text-left tracking-normal select-none"
        >
          {words.map((word, idx) => {
            const isCurrent = status === "speaking" && idx === activeWordIndex;
            const isSpoken = status === "speaking" ? idx <= activeWordIndex : true;

            return (
              <span
                key={`${word}-${idx}`}
                className={`inline-block mr-1.5 sm:mr-2 transition-all duration-150 ${
                  isCurrent
                    ? "text-[#f9eeff] font-bold drop-shadow-[0_0_14px_rgba(224,170,255,0.85)] scale-[1.02]"
                    : isSpoken
                    ? "text-[#f9eeff]/95"
                    : "text-[#dec6f6]/55"
                }`}
              >
                {word}
              </span>
            );
          })}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
