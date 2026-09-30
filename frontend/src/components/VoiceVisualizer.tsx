"use client";

import React, { useEffect, useRef } from "react";
import { motion } from "motion/react";
import { Mic, Volume2, Sparkles, Radio } from "lucide-react";
import { AgentStatus } from "@/types/agent";

interface VoiceVisualizerProps {
  status: AgentStatus;
  audioLevel: number; // 0 to 1
  language: string;
  onToggleMic: () => void;
  isMicActive: boolean;
}

export const VoiceVisualizer: React.FC<VoiceVisualizerProps> = ({
  status,
  audioLevel,
  language,
  onToggleMic,
  isMicActive,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const phaseRef = useRef<number>(0);
  const rotationRef = useRef<{ r1: number; r2: number; r3: number }>({ r1: 0, r2: 0, r3: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = canvas.offsetWidth * window.devicePixelRatio);
    let height = (canvas.height = canvas.offsetHeight * window.devicePixelRatio);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      height = canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    };

    window.addEventListener("resize", handleResize);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const dpr = window.devicePixelRatio || 1;
      const centerX = width / 2;
      const centerY = height / 2;
      const baseRadius = Math.min(width, height) * 0.22;

      // Dynamic activity factor
      let activity = 0.2;
      if (status === "speaking") {
        activity = 0.5 + audioLevel * 0.7;
      } else if (status === "listening") {
        activity = 0.3 + (isMicActive ? audioLevel * 0.6 : 0.15);
      } else if (status === "thinking") {
        activity = 0.45;
      }

      phaseRef.current += 0.025 + activity * 0.04;
      const phase = phaseRef.current;

      // Update 3D gyroscopic rotations
      rotationRef.current.r1 += 0.012 + activity * 0.015;
      rotationRef.current.r2 -= 0.016 + activity * 0.02;
      rotationRef.current.r3 += 0.009 + activity * 0.01;

      const { r1, r2, r3 } = rotationRef.current;

      // ==========================================
      // 1. OUTER DEEP AMBIENT HALO (Dark Velvet Glow)
      // ==========================================
      const ambientGlow = ctx.createRadialGradient(
        centerX,
        centerY,
        baseRadius * 0.8,
        centerX,
        centerY,
        baseRadius * 2.3
      );
      ambientGlow.addColorStop(0, "rgba(84, 0, 228, 0.16)");
      ambientGlow.addColorStop(0.4, "rgba(36, 0, 70, 0.25)");
      ambientGlow.addColorStop(0.7, "rgba(16, 0, 43, 0.12)");
      ambientGlow.addColorStop(1, "rgba(3, 0, 8, 0)");

      ctx.fillStyle = ambientGlow;
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius * 2.3, 0, Math.PI * 2);
      ctx.fill();

      // ==========================================
      // 2. GYROSCOPIC 3D ORBITAL RINGS (BACK PASS - behind core)
      // ==========================================
      const drawGyroRing = (
        tiltX: number,
        tiltY: number,
        currentRot: number,
        radiusMult: number,
        isFront: boolean
      ) => {
        const ringR = baseRadius * radiusMult;
        const totalSegments = 100;
        ctx.save();
        ctx.translate(centerX, centerY);

        for (let i = 0; i < totalSegments; i++) {
          const theta1 = (i / totalSegments) * Math.PI * 2 + currentRot;
          const theta2 = ((i + 1) / totalSegments) * Math.PI * 2 + currentRot;

          // 3D projection transformation
          const x3d_1 = Math.cos(theta1) * ringR;
          const y3d_1 = Math.sin(theta1) * ringR * Math.cos(tiltX);
          const z3d_1 = Math.sin(theta1) * ringR * Math.sin(tiltX) + x3d_1 * Math.sin(tiltY);

          const x3d_2 = Math.cos(theta2) * ringR;
          const y3d_2 = Math.sin(theta2) * ringR * Math.cos(tiltX);

          const segmentIsFront = z3d_1 >= 0;

          if (segmentIsFront === isFront) {
            ctx.beginPath();
            ctx.moveTo(x3d_1, y3d_1);
            ctx.lineTo(x3d_2, y3d_2);

            const depthAlpha = isFront ? 0.85 : 0.22;
            ctx.strokeStyle = `rgba(199, 125, 255, ${depthAlpha * (0.6 + activity * 0.4)})`;
            ctx.lineWidth = (isFront ? 2.2 : 1.2) * dpr;
            ctx.stroke();

            // Quantum orbital nodes / satellites on front ring
            if (isFront && i % 18 === 0) {
              ctx.beginPath();
              ctx.arc(x3d_1, y3d_1, (3 + activity * 2.5) * dpr, 0, Math.PI * 2);
              ctx.fillStyle = "#e0aaff";
              ctx.shadowColor = "#c77dff";
              ctx.shadowBlur = 10 * dpr;
              ctx.fill();
              ctx.shadowBlur = 0;
            }
          }
        }
        ctx.restore();
      };

      // Draw rings behind the dark sphere
      drawGyroRing(0.85, 0.45, r1, 1.35, false);
      drawGyroRing(0.4, -0.75, r2, 1.22, false);
      drawGyroRing(-0.65, 0.6, r3, 1.48, false);

      // ==========================================
      // 3. RADIAL SONIC FREQUENCY NEEDLES (76 Precision Needles)
      // ==========================================
      const numNeedles = 76;
      for (let i = 0; i < numNeedles; i++) {
        const angle = (i / numNeedles) * Math.PI * 2;
        const wave =
          Math.sin(angle * 6 + phase * 2.5) * Math.cos(angle * 3 - phase) +
          Math.sin(angle * 12 + phase) * 0.4;
        const needleLen =
          (10 + Math.abs(wave) * 38 * activity + (i % 4 === 0 ? audioLevel * 45 : 0)) * dpr;

        const rStart = baseRadius * 1.02;
        const rEnd = rStart + needleLen;

        const x1 = centerX + Math.cos(angle) * rStart;
        const y1 = centerY + Math.sin(angle) * rStart;
        const x2 = centerX + Math.cos(angle) * rEnd;
        const y2 = centerY + Math.sin(angle) * rEnd;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);

        // Intricate needle coloration
        if (i % 3 === 0) {
          ctx.strokeStyle = `rgba(224, 170, 255, ${0.7 + activity * 0.3})`;
          ctx.lineWidth = 2.2 * dpr;
        } else if (i % 2 === 0) {
          ctx.strokeStyle = `rgba(199, 125, 255, ${0.45 + activity * 0.4})`;
          ctx.lineWidth = 1.4 * dpr;
        } else {
          ctx.strokeStyle = `rgba(123, 44, 191, ${0.35 + activity * 0.3})`;
          ctx.lineWidth = 1.0 * dpr;
        }
        ctx.stroke();

        // Tip glowing micro-beads on active spikes
        if (needleLen > 22 * dpr && i % 2 === 0) {
          ctx.beginPath();
          ctx.arc(x2, y2, 1.8 * dpr, 0, Math.PI * 2);
          ctx.fillStyle = "#f4e5ff";
          ctx.fill();
        }
      }

      // ==========================================
      // 4. THE DARK CORE (DARKER THAN THE WEBSITE)
      // Website is #10002b; the orb uses #020005 -> #060010 (Obsidian Void)
      // ==========================================
      ctx.save();
      // Outer dark core shadow to carve depth into the canvas
      ctx.shadowColor = "#000000";
      ctx.shadowBlur = 32 * dpr;

      const darkCoreGradient = ctx.createRadialGradient(
        centerX - baseRadius * 0.25,
        centerY - baseRadius * 0.25,
        baseRadius * 0.05,
        centerX,
        centerY,
        baseRadius
      );
      darkCoreGradient.addColorStop(0, "#080016"); // Deepest dark purple-black
      darkCoreGradient.addColorStop(0.35, "#04000b"); // Near pure pitch black
      darkCoreGradient.addColorStop(0.75, "#020006"); // Absolute obsidian void
      darkCoreGradient.addColorStop(0.96, "#000002"); // Ominous event horizon
      darkCoreGradient.addColorStop(1, "rgba(84, 0, 228, 0.4)"); // Subtle electric amethyst rim

      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
      ctx.fillStyle = darkCoreGradient;
      ctx.fill();
      ctx.restore();

      // ==========================================
      // 5. INTRICATE WAVEFORM LATTICE / NEURAL FIBERS
      // Multi-harmonic oscillating wave filaments across the dark sphere
      // ==========================================
      const drawHarmonicStrand = (
        harmonic: number,
        speed: number,
        amp: number,
        color: string,
        lineW: number
      ) => {
        ctx.beginPath();
        const steps = 90;
        for (let j = 0; j <= steps; j++) {
          const a = (j / steps) * Math.PI * 2;
          const deformation =
            Math.sin(a * harmonic + phase * speed) * (amp * activity) +
            Math.cos(a * 3 - phase * 1.2) * (amp * 0.4 * activity);

          const r = baseRadius * 0.94 + deformation;
          const px = centerX + Math.cos(a) * r;
          const py = centerY + Math.sin(a) * r;

          if (j === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.strokeStyle = color;
        ctx.lineWidth = lineW * dpr;
        ctx.stroke();
      };

      drawHarmonicStrand(5, 1.8, 12, "rgba(224, 170, 255, 0.65)", 1.6);
      drawHarmonicStrand(7, -2.1, 16, "rgba(199, 125, 255, 0.5)", 1.2);
      drawHarmonicStrand(4, 1.4, 20, "rgba(123, 44, 191, 0.4)", 1.0);

      // ==========================================
      // 6. INNER SINGULARITY EYE / PRISMATIC IRIS
      // Deep black core lens with an audio-reactive quantum aperture
      // ==========================================
      const innerApertureRadius = baseRadius * (0.32 + activity * 0.12);

      // Inner dark pit
      const innerPit = ctx.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        innerApertureRadius
      );
      innerPit.addColorStop(0, "#000000"); // Zero light
      innerPit.addColorStop(0.7, "#030008");
      innerPit.addColorStop(0.95, "#0d0022");
      innerPit.addColorStop(1, "rgba(199, 125, 255, 0.65)");

      ctx.beginPath();
      ctx.arc(centerX, centerY, innerApertureRadius, 0, Math.PI * 2);
      ctx.fillStyle = innerPit;
      ctx.fill();
      ctx.strokeStyle = "rgba(224, 170, 255, 0.6)";
      ctx.lineWidth = 1.8 * dpr;
      ctx.stroke();

      // Pulsing quantum singularity core dot
      const singularitySize = (3.5 + audioLevel * 6) * dpr;
      ctx.beginPath();
      ctx.arc(centerX, centerY, singularitySize, 0, Math.PI * 2);
      ctx.fillStyle = status === "speaking" ? "#f9eeff" : "#c77dff";
      ctx.shadowColor = "#e0aaff";
      ctx.shadowBlur = 14 * dpr;
      ctx.fill();
      ctx.shadowBlur = 0;

      // ==========================================
      // 7. GYROSCOPIC 3D ORBITAL RINGS (FRONT PASS - over dark core)
      // ==========================================
      drawGyroRing(0.85, 0.45, r1, 1.35, true);
      drawGyroRing(0.4, -0.75, r2, 1.22, true);
      drawGyroRing(-0.65, 0.6, r3, 1.48, true);

      // Specular dark glass crescent reflection
      ctx.beginPath();
      ctx.ellipse(
        centerX - baseRadius * 0.35,
        centerY - baseRadius * 0.35,
        baseRadius * 0.22,
        baseRadius * 0.09,
        -Math.PI / 4,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
      ctx.fill();

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [status, audioLevel, isMicActive]);

  // Status configuration badges
  const statusConfig = {
    idle: {
      label: "Ready to Listen",
      color: "border-royal-violet-700/50 text-mauve bg-amethyst-deep/80 shadow-md",
      icon: Radio,
      glow: "",
    },
    listening: {
      label: isMicActive ? "Listening to Farmer..." : "Mic Paused",
      color: "border-mauve-magic text-mauve bg-amethyst-deep/90 shadow-lg shadow-mauve/20",
      icon: Mic,
      glow: "glow-mauve",
    },
    thinking: {
      label: "Synthesizing Advice...",
      color: "border-lavender-purple text-mauve-magic bg-amethyst-deep/90",
      icon: Sparkles,
      glow: "glow-violet animate-pulse",
    },
    speaking: {
      label: "Agent Speaking",
      color: "border-mauve text-mauve bg-amethyst-deep/95 shadow-xl shadow-mauve/30",
      icon: Volume2,
      glow: "glow-mauve",
    },
  }[status];

  const StatusIcon = statusConfig.icon;

  return (
    <div className="relative flex flex-col items-center justify-center w-full h-[380px] sm:h-[440px] md:h-[480px]">
      {/* Background Animated Concentric Pulsing Quantum Rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.div
          animate={{
            scale: status === "speaking" ? [1, 1.25, 1] : [1, 1.05, 1],
            opacity: status === "speaking" ? [0.35, 0.08, 0.35] : [0.12, 0.03, 0.12],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: status === "speaking" ? 4 : 12,
            repeat: Infinity,
            ease: "linear",
          }}
          className="w-72 h-72 sm:w-96 sm:h-96 rounded-full border border-dashed border-mauve/30 pointer-events-none"
        />
        <motion.div
          animate={{
            scale: status === "speaking" ? [1.1, 1.45, 1.1] : [1.02, 1.1, 1.02],
            opacity: status === "speaking" ? [0.2, 0.04, 0.2] : [0.08, 0.02, 0.08],
            rotate: [360, 180, 0],
          }}
          transition={{
            duration: status === "speaking" ? 6 : 16,
            repeat: Infinity,
            ease: "linear",
          }}
          className="w-96 h-96 sm:w-[450px] sm:h-[450px] rounded-full border border-royal-violet/30 pointer-events-none"
        />
      </div>

      {/* HTML5 Canvas Active Voice Reactor (Dark Matter Gyro Core) */}
      <canvas
        ref={canvasRef}
        className="w-full h-full max-w-[440px] max-h-[440px] cursor-pointer"
        onClick={onToggleMic}
        title="Click to toggle voice activation"
      />

      {/* Central Interactive Status Pill */}
      <div className="absolute bottom-4 flex flex-col items-center gap-2">
        <motion.div
          layout
          className={`flex items-center gap-2 px-4 py-1.5 rounded-full border backdrop-blur-md transition-all ${statusConfig.color} ${statusConfig.glow}`}
        >
          <StatusIcon className="w-4 h-4 animate-bounce" />
          <span className="text-xs font-semibold tracking-wide uppercase">
            {statusConfig.label}
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-mauve animate-ping ml-1" />
        </motion.div>

        <p className="text-[11px] text-royal-violet-800 font-mono">
          Click dark core to {isMicActive ? "mute mic" : "start talking"} • {language.toUpperCase()}
        </p>
      </div>
    </div>
  );
};
