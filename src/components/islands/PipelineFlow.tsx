/**
 * PipelineFlow — Animated horizontal data pipeline.
 * Shows data flowing through stages (ingest → preprocess → train → evaluate → deploy)
 * with animated connection lines and stage indicators.
 */
import { useState, useEffect, useRef } from "react";
import { motion, useInView } from "motion/react";

interface Stage {
  label: string;
  icon: string; // SVG path
  color: string;
  detail?: string;
}

interface Props {
  stages?: Stage[];
  title?: string;
  className?: string;
}

const DEFAULT_STAGES: Stage[] = [
  { label: "Ingest", icon: "M4 16l4.586-4.586a2 2 0 0 1 2.828 0L16 16m-2-2l1.586-1.586a2 2 0 0 1 2.828 0L20 14", color: "#60A5FA", detail: "350K spectra" },
  { label: "Preprocess", icon: "M4 4v5h.582m15.356 2A8.001 8.001 0 0 0 4.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 0 1-15.357-2m15.357 2H15", color: "#4ECDC4", detail: "Wavelet + Norm" },
  { label: "Train", icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z", color: "#C9A04A", detail: "4x RTX 5090" },
  { label: "Evaluate", icon: "M9 19v-6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2zm0 0V9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v10m-6 0a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2m0 0V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z", color: "#A78BFA", detail: "R² = 0.961" },
  { label: "Deploy", icon: "M5 12h14M12 5l7 7-7 7", color: "#34D399", detail: "REST API" },
];

export default function PipelineFlow({
  stages = DEFAULT_STAGES,
  title = "pipeline — spectral_fm",
  className = "",
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const [activeStage, setActiveStage] = useState(-1);

  useEffect(() => {
    if (!isInView) return;
    let current = -1;
    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        current++;
        setActiveStage(current);
        if (current >= stages.length - 1) clearInterval(interval);
      }, 500);
      return () => clearInterval(interval);
    }, 300);
    return () => clearTimeout(timer);
  }, [isInView, stages.length]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`rounded-xl border border-[#1a1a1a] overflow-hidden bg-[#0a0a0a] ${className}`}
    >
      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-[#0f0f0f] border-b border-[#1a1a1a]">
        <div className="flex items-center gap-1.5">
          <div className="w-[10px] h-[10px] rounded-full bg-[#FF5F57]" />
          <div className="w-[10px] h-[10px] rounded-full bg-[#FEBC2E]" />
          <div className="w-[10px] h-[10px] rounded-full bg-[#28C840]" />
        </div>
        <span className="ml-2 text-[10px] font-mono text-[#444] select-none">{title}</span>
      </div>

      {/* Pipeline */}
      <div className="p-5 overflow-x-auto">
        <div className="flex items-center justify-between min-w-[400px] gap-1">
          {stages.map((stage, i) => {
            const isActive = i <= activeStage;
            const isCurrent = i === activeStage && activeStage < stages.length - 1;

            return (
              <div key={i} className="flex items-center flex-1">
                {/* Stage node */}
                <motion.div
                  className="flex flex-col items-center gap-2 flex-shrink-0"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={isActive ? { opacity: 1, scale: 1 } : { opacity: 0.3, scale: 0.8 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  {/* Circle */}
                  <div
                    className={`relative w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${isCurrent ? "animate-pulse" : ""}`}
                    style={{
                      borderColor: isActive ? stage.color : "#222",
                      backgroundColor: isActive ? `${stage.color}15` : "transparent",
                      boxShadow: isActive ? `0 0 12px ${stage.color}30` : "none",
                    }}
                  >
                    <svg
                      width="16" height="16" viewBox="0 0 24 24"
                      fill="none" stroke={isActive ? stage.color : "#444"}
                      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                    >
                      <path d={stage.icon} />
                    </svg>
                  </div>

                  {/* Label */}
                  <span
                    className="text-[9px] font-mono uppercase tracking-wider"
                    style={{ color: isActive ? stage.color : "#444" }}
                  >
                    {stage.label}
                  </span>

                  {/* Detail */}
                  {stage.detail && (
                    <motion.span
                      className="text-[8px] font-mono"
                      style={{ color: isActive ? "#888" : "#333" }}
                      animate={{ opacity: isActive ? 1 : 0 }}
                    >
                      {stage.detail}
                    </motion.span>
                  )}
                </motion.div>

                {/* Connector line */}
                {i < stages.length - 1 && (
                  <div className="flex-1 h-[2px] mx-2 relative overflow-hidden rounded-full bg-[#1a1a1a]">
                    <motion.div
                      className="absolute inset-y-0 left-0 rounded-full"
                      style={{ backgroundColor: stage.color }}
                      initial={{ width: "0%" }}
                      animate={{ width: i < activeStage ? "100%" : "0%" }}
                      transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
                    />
                    {/* Animated dot traveling along line */}
                    {i === activeStage - 1 && (
                      <motion.div
                        className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: stage.color, boxShadow: `0 0 6px ${stage.color}` }}
                        initial={{ left: "0%" }}
                        animate={{ left: "100%" }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                      />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
