/**
 * LogStream — Animated training log console that scrolls upward.
 * Shows ML training metrics (epoch, loss, R², lr) appearing line by line
 * with colored values, like watching model training in real time.
 */
import { useState, useEffect, useRef } from "react";
import { motion, useInView } from "motion/react";

interface LogEntry {
  epoch: number;
  loss: number;
  r2: number;
  lr: string;
  extra?: string;
}

interface Props {
  title?: string;
  className?: string;
  speed?: number; // ms per log line
}

const TRAINING_LOG: LogEntry[] = [
  { epoch: 1, loss: 2.847, r2: 0.312, lr: "1e-3" },
  { epoch: 2, loss: 1.923, r2: 0.456, lr: "1e-3" },
  { epoch: 3, loss: 1.341, r2: 0.589, lr: "1e-3" },
  { epoch: 4, loss: 0.987, r2: 0.672, lr: "5e-4" },
  { epoch: 5, loss: 0.742, r2: 0.741, lr: "5e-4" },
  { epoch: 6, loss: 0.561, r2: 0.798, lr: "5e-4", extra: "checkpoint saved" },
  { epoch: 7, loss: 0.423, r2: 0.843, lr: "1e-4" },
  { epoch: 8, loss: 0.318, r2: 0.879, lr: "1e-4" },
  { epoch: 9, loss: 0.241, r2: 0.912, lr: "1e-4", extra: "new best R²" },
  { epoch: 10, loss: 0.189, r2: 0.935, lr: "5e-5" },
  { epoch: 11, loss: 0.152, r2: 0.948, lr: "5e-5" },
  { epoch: 12, loss: 0.128, r2: 0.961, lr: "5e-5", extra: "training complete" },
];

function getLossColor(loss: number): string {
  if (loss > 1.5) return "#FF6B6B";
  if (loss > 0.5) return "#C9A04A";
  return "#34D399";
}

function getR2Color(r2: number): string {
  if (r2 < 0.5) return "#FF6B6B";
  if (r2 < 0.8) return "#C9A04A";
  return "#34D399";
}

export default function LogStream({
  title = "training — spectral_fm.py",
  className = "",
  speed = 400,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const [visibleLines, setVisibleLines] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isInView) return;
    let current = 0;
    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        current++;
        setVisibleLines(current);
        if (current >= TRAINING_LOG.length) clearInterval(interval);
      }, speed);
      return () => clearInterval(interval);
    }, 300);
    return () => clearTimeout(timer);
  }, [isInView, speed]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [visibleLines]);

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
        <span className="ml-2 text-[10px] font-mono text-text-muted/60 select-none">{title}</span>
        {visibleLines > 0 && visibleLines < TRAINING_LOG.length && (
          <span className="ml-auto flex items-center gap-1.5 text-[10px] font-mono text-[#34D399]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#34D399] animate-pulse" />
            training
          </span>
        )}
        {visibleLines >= TRAINING_LOG.length && (
          <span className="ml-auto text-[10px] font-mono text-[#C9A04A]">
            done
          </span>
        )}
      </div>

      {/* Log content */}
      <div ref={containerRef} className="p-4 font-mono text-[11px] leading-[1.8] max-h-[220px] overflow-y-auto scrollbar-thin">
        {/* Header */}
        {visibleLines > 0 && (
          <div className="text-text-muted/70 mb-1">
            <span className="text-[#C9A04A]">Spekron</span> v0.3.1 — 4x RTX 5090 — mixed precision
          </div>
        )}

        {TRAINING_LOG.slice(0, visibleLines).map((entry, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-wrap gap-x-2"
          >
            <span className="text-text-muted/70">
              [{String(entry.epoch).padStart(2, "0")}/{TRAINING_LOG.length}]
            </span>
            <span className="text-text-secondary">loss:</span>
            <span style={{ color: getLossColor(entry.loss) }}>
              {entry.loss.toFixed(3)}
            </span>
            <span className="text-text-secondary">R²:</span>
            <span style={{ color: getR2Color(entry.r2) }}>
              {entry.r2.toFixed(3)}
            </span>
            <span className="text-text-secondary">lr:</span>
            <span className="text-violet">{entry.lr}</span>
            {entry.extra && (
              <span className="text-teal">
                — {entry.extra}
              </span>
            )}
          </motion.div>
        ))}

        {/* Cursor */}
        {visibleLines > 0 && visibleLines < TRAINING_LOG.length && (
          <span className="inline-block w-[7px] h-[13px] bg-[#C9A04A] animate-blink ml-px translate-y-[2px]" />
        )}
      </div>
    </motion.div>
  );
}
