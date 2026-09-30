"use client";

import React from "react";
import { Mic, MicOff, Volume2, VolumeX, Sparkles } from "lucide-react";
import { VoicePreset } from "@/types/agent";
import GlideSelect from "@/components/GlideSelect";

interface BottomControlsProps {
  isMicActive: boolean;
  onToggleMic: () => void;
  presets: VoicePreset[];
  onSelectPreset: (preset: VoicePreset) => void;
  activePresetId?: string;
  volume: number;
  onChangeVolume: (val: number) => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const BottomControls: React.FC<BottomControlsProps> = ({
  isMicActive,
  onToggleMic,
  presets,
  onSelectPreset,
  activePresetId,
  volume,
  onChangeVolume,
  isMuted,
  onToggleMute,
}) => {
  // Format options with tags for GlideSelect
  const queryOptions = presets.map((p) => {
    let tag = "Voice";
    if (p.id.includes("wheat") || p.id.includes("mandi")) tag = "Mandi Rate";
    else if (p.id.includes("pest") || p.id.includes("disease")) tag = "Disease";
    else if (p.id.includes("subsidy") || p.id.includes("solar")) tag = "Subsidy";

    return {
      value: p.id,
      label: p.title,
      tag,
    };
  });

  return (
    <footer className="w-full glass-panel border-t border-eucalyptus/20 px-6 sm:px-8 py-3 flex flex-col sm:flex-row items-center justify-between gap-4 mt-auto">
      {/* Left: GlideSelect component for Test Voice Queries */}
      <div className="flex items-center gap-3 pl-8 sm:pl-0">
        <span className="text-[11px] font-bold uppercase tracking-wider text-sage flex items-center gap-1.5 shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-mint" />
          Test Voice Queries:
        </span>
        <GlideSelect
          options={queryOptions}
          value={activePresetId}
          onChange={(val: string) => {
            const found = presets.find((p) => p.id === val);
            if (found) onSelectPreset(found);
          }}
          placeholder="Select scenario…"
          showTags={true}
          accentColor="#e0aaff"
          surfaceColor="#240046"
          highlightColor="#5a189a"
          textColor="#f9eeff"
          size="md"
          radius={12}
          menuWidth={300}
          placement="top"
          align="left"
          popDuration={180}
          glideDuration={220}
          rememberPosition={true}
          ariaLabel="Test voice queries"
        />
      </div>

      {/* Center & Right Controls */}
      <div className="flex items-center gap-4 sm:gap-6">
        {/* Volume & Audio Slider */}
        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={onToggleMute}
            className="text-eucalyptus hover:text-mint transition-colors p-1"
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4 text-sage" />
            ) : (
              <Volume2 className="w-4 h-4 text-mint" />
            )}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : volume}
            onChange={(e) => onChangeVolume(parseFloat(e.target.value))}
            className="w-20 h-1.5 bg-midnight rounded-lg appearance-none cursor-pointer accent-mint"
            title="Volume Control"
          />
        </div>

        {/* Big Microphone Activation Action Button */}
        <button
          onClick={onToggleMic}
          className={`flex items-center gap-2.5 px-5 py-2.5 rounded-full font-bold text-xs sm:text-sm tracking-wide transition-all shadow-xl ${
            isMicActive
              ? "bg-mint text-midnight glow-mint scale-105"
              : "bg-slate-dusk text-mint border border-eucalyptus/50 hover:border-mint hover:bg-slate-dusk/80"
          }`}
        >
          {isMicActive ? (
            <>
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-midnight opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-midnight" />
              </span>
              <Mic className="w-4 h-4" />
              <span>Mic Active (Listening)</span>
            </>
          ) : (
            <>
              <MicOff className="w-4 h-4 text-eucalyptus" />
              <span>Start Voice Session</span>
            </>
          )}
        </button>
      </div>
    </footer>
  );
};
