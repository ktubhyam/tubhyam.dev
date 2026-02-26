/**
 * AvailabilityStatus — Terminal-style component showing current availability
 * and quick stats. Animates in with a typewriter effect showing status lines.
 */
import { useState, useEffect, useRef } from "react";
import { motion, useInView } from "motion/react";

interface StatusLine {
  label: string;
  value: string;
  color: "green" | "amber" | "red" | "teal" | "purple" | "blue";
}

interface Props {
  className?: string;
}

const STATUS_LINES: StatusLine[] = [
  { label: "status", value: "open to collaborate", color: "green" },
  { label: "location", value: "Mumbai, India", color: "teal" },
  { label: "timezone", value: "IST (UTC+5:30)", color: "blue" },
  { label: "response", value: "< 24 hours", color: "amber" },
  { label: "interests", value: "spectroscopy, ML, scientific computing", color: "purple" },
];

const COLOR_MAP: Record<string, string> = {
  green: "#34D399",
  amber: "#C9A04A",
  red: "#FF6B6B",
  teal: "#4ECDC4",
  purple: "#A78BFA",
  blue: "#60A5FA",
};

export default function AvailabilityStatus({ className = "" }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const [visibleLines, setVisibleLines] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    let count = 0;
    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        count++;
        setVisibleLines(count);
        if (count >= STATUS_LINES.length) clearInterval(interval);
      }, 250);
      return () => clearInterval(interval);
    }, 400);
    return () => clearTimeout(timer);
  }, [isInView]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`rounded-xl border border-border overflow-hidden bg-bg-secondary ${className}`}
    >
      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-surface border-b border-border">
        <div className="flex items-center gap-1.5">
          <div className="w-[10px] h-[10px] rounded-full bg-[#FF5F57]" />
          <div className="w-[10px] h-[10px] rounded-full bg-[#FEBC2E]" />
          <div className="w-[10px] h-[10px] rounded-full bg-[#28C840]" />
        </div>
        <span className="ml-2 text-[10px] font-mono text-text-muted/60 select-none">availability — status</span>
        {visibleLines >= STATUS_LINES.length && (
          <span className="ml-auto flex items-center gap-1.5 text-[10px] font-mono text-[#34D399]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#34D399] animate-pulse" />
            online
          </span>
        )}
      </div>

      <div className="p-4 font-mono text-xs leading-relaxed">
        {/* ASCII header */}
        <div className="text-[#333] mb-3 select-none">
          {"┌─────────────────────────────┐"}
          <br />
          {"│  "}<span className="text-[#C9A04A]">Tubhyam Karthikeyan</span>{"       │"}
          <br />
          {"│  "}<span className="text-text-muted/70">ICT Mumbai '30</span>{"             │"}
          <br />
          {"└─────────────────────────────┘"}
        </div>

        {/* Status lines */}
        {STATUS_LINES.slice(0, visibleLines).map((line, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="flex items-center gap-2 py-0.5"
          >
            <span className="text-text-muted/70 select-none">{">"}</span>
            <span className="text-[#888] w-20">{line.label}:</span>
            <span style={{ color: COLOR_MAP[line.color] }}>{line.value}</span>
          </motion.div>
        ))}

        {/* Cursor */}
        {visibleLines < STATUS_LINES.length && (
          <div className="flex items-center gap-2 py-0.5">
            <span className="text-text-muted/70 select-none">{">"}</span>
            <span className="inline-block w-[7px] h-[14px] bg-[#C9A04A] animate-blink" />
          </div>
        )}

        {/* Footer after all lines */}
        {visibleLines >= STATUS_LINES.length && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="mt-3 pt-3 border-t border-border text-text-muted/60"
          >
            <span className="text-text-muted/70">$</span> echo{" "}
            <span className="text-[#34D399]">"Let's build something together"</span>
            <span className="inline-block w-[7px] h-[14px] bg-[#C9A04A] animate-blink ml-1 translate-y-[1px]" />
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
