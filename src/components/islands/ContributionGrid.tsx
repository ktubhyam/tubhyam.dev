/**
 * ContributionGrid — GitHub-style activity heatmap with animated fill.
 * Squares fill in wave-like from left to right when scrolled into view.
 * Color intensity represents activity level.
 */
import { useState, useEffect, useRef, useMemo } from "react";
import { motion, useInView } from "motion/react";

interface Props {
  className?: string;
  weeks?: number;
  title?: string;
}

// Deterministic pseudo-random based on position
function seedRandom(x: number, y: number): number {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

const COLORS = [
  "#161616",  // 0 - no activity
  "#1a3a2a",  // 1 - low
  "#1f5c3f",  // 2 - medium-low
  "#28845a",  // 3 - medium
  "#34D399",  // 4 - high
];

export default function ContributionGrid({
  className = "",
  weeks = 26,
  title = "activity — last 6 months",
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const [revealCol, setRevealCol] = useState(-1);

  // Generate grid data
  const grid = useMemo(() => {
    const data: number[][] = [];
    for (let w = 0; w < weeks; w++) {
      const col: number[] = [];
      for (let d = 0; d < 7; d++) {
        const r = seedRandom(w, d);
        // Make more recent weeks (higher w) more active
        const recencyBoost = w / weeks;
        const rawActivity = r * (0.5 + recencyBoost * 0.5);
        if (rawActivity < 0.3) col.push(0);
        else if (rawActivity < 0.5) col.push(1);
        else if (rawActivity < 0.7) col.push(2);
        else if (rawActivity < 0.85) col.push(3);
        else col.push(4);
      }
      data.push(col);
    }
    return data;
  }, [weeks]);

  // Total contributions
  const totalContributions = useMemo(() => {
    return grid.flat().filter(v => v > 0).length * 3 + 127;
  }, [grid]);

  useEffect(() => {
    if (!isInView) return;
    let col = -1;
    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        col++;
        setRevealCol(col);
        if (col >= weeks) clearInterval(interval);
      }, 40);
      return () => clearInterval(interval);
    }, 300);
    return () => clearTimeout(timer);
  }, [isInView, weeks]);

  const dayLabels = ["Mon", "", "Wed", "", "Fri", "", ""];

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

      <div className="p-4">
        {/* Summary */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-mono text-[#888]">
            <span className="text-[#e0e0e0]">{totalContributions}</span> contributions in the last 6 months
          </span>
        </div>

        {/* Grid */}
        <div className="flex gap-[3px] overflow-x-auto">
          {/* Day labels */}
          <div className="flex flex-col gap-[3px] mr-1 flex-shrink-0">
            {dayLabels.map((label, i) => (
              <div key={i} className="w-6 h-[11px] flex items-center">
                <span className="text-[8px] font-mono text-[#444]">{label}</span>
              </div>
            ))}
          </div>

          {/* Weeks */}
          {grid.map((col, w) => (
            <div key={w} className="flex flex-col gap-[3px]">
              {col.map((level, d) => (
                <div
                  key={d}
                  className="w-[11px] h-[11px] rounded-[2px]"
                  style={{
                    backgroundColor: COLORS[level],
                    border: level === 0 ? "1px solid #222" : "none",
                    opacity: w <= revealCol ? 1 : 0,
                    transform: w <= revealCol ? "scale(1)" : "scale(0)",
                    transition: `opacity 0.15s ease-out ${d * 0.02}s, transform 0.15s ease-out ${d * 0.02}s`,
                  }}
                />
              ))}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-1.5 mt-3 justify-end">
          <span className="text-[8px] font-mono text-[#555]">Less</span>
          {COLORS.map((color, i) => (
            <div
              key={i}
              className="w-[11px] h-[11px] rounded-[2px]"
              style={{
                backgroundColor: color,
                border: i === 0 ? "1px solid #222" : "none",
              }}
            />
          ))}
          <span className="text-[8px] font-mono text-[#555]">More</span>
        </div>
      </div>
    </motion.div>
  );
}
