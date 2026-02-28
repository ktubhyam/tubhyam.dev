/**
 * InverseProblemFlow — Animated flow diagram showing the spectral inverse problem:
 * S(ν) → [Spektron] → M̂
 * Arrows and boxes entrance-animate on scroll into view.
 */
import { useRef } from "react";
import { motion, useInView } from "motion/react";

interface Props { className?: string }

const TRANSITION_BASE = {
  ease: [0.16, 1, 0.3, 1] as const,
};

export default function InverseProblemFlow({ className = "" }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  const boxVariants = (delay: number) => ({
    hidden: { opacity: 0, scale: 0.92, y: 8 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { ...TRANSITION_BASE, duration: 0.55, delay },
    },
  });

  const arrowVariants = (delay: number) => ({
    hidden: { opacity: 0, scaleX: 0 },
    visible: {
      opacity: 1,
      scaleX: 1,
      transition: { duration: 0.4, delay, ease: "easeOut" },
    },
  });

  return (
    <div
      ref={ref}
      className={`rounded-xl border border-border bg-bg-secondary overflow-hidden p-4 ${className}`}
    >
      <p className="text-[9px] font-mono text-text-muted/50 mb-4 uppercase tracking-widest">
        spectral inverse problem
      </p>

      <div className="flex items-stretch gap-2">
        {/* Box 1: S(ν) */}
        <motion.div
          variants={boxVariants(0)}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="flex-1 rounded-lg border border-border bg-surface p-3 flex flex-col items-center gap-2"
        >
          <svg viewBox="0 0 80 44" className="w-full h-auto" style={{ maxHeight: "44px" }}>
            <polyline
              points="4,38 10,38 14,32 17,14 20,36 26,38 32,30 36,10 39,36 46,37 50,22 54,38 60,37 65,28 68,36 76,38"
              fill="none"
              stroke="#C9A04A"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-[11px] font-mono text-accent font-medium leading-none">S(ν)</span>
          <span className="text-[8px] font-mono text-text-muted text-center leading-tight">vibrational spectrum</span>
        </motion.div>

        {/* Arrow 1 */}
        <motion.div
          variants={arrowVariants(0.25)}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="flex items-center justify-center flex-shrink-0 w-7"
          style={{ transformOrigin: "left center" }}
        >
          <svg viewBox="0 0 28 12" className="w-full h-3">
            <line x1="1" y1="6" x2="21" y2="6" stroke="#555" strokeWidth="1" />
            <polyline points="17,2 23,6 17,10" fill="none" stroke="#555" strokeWidth="1" />
          </svg>
        </motion.div>

        {/* Box 2: Spektron */}
        <motion.div
          variants={boxVariants(0.35)}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="flex-1 rounded-lg border border-accent/30 bg-accent/5 p-3 flex flex-col items-center gap-2"
        >
          {/* SSM architecture hint */}
          <svg viewBox="0 0 80 44" className="w-full h-auto" style={{ maxHeight: "44px" }}>
            {/* State space block diagram */}
            <rect x="4" y="10" width="20" height="24" rx="2" fill="none" stroke="#C9A04A" strokeWidth="1" opacity="0.5" />
            <text x="14" y="24" textAnchor="middle" fill="#C9A04A" fontSize="7" fontFamily="monospace" opacity="0.7">S</text>
            <line x1="24" y1="22" x2="34" y2="22" stroke="#C9A04A" strokeWidth="0.8" opacity="0.5" />
            <rect x="34" y="10" width="12" height="24" rx="2" fill="none" stroke="#C9A04A" strokeWidth="1" opacity="0.5" />
            <text x="40" y="24" textAnchor="middle" fill="#C9A04A" fontSize="6" fontFamily="monospace" opacity="0.7">A</text>
            <line x1="46" y1="22" x2="56" y2="22" stroke="#C9A04A" strokeWidth="0.8" opacity="0.5" />
            <rect x="56" y="10" width="20" height="24" rx="2" fill="none" stroke="#C9A04A" strokeWidth="1" opacity="0.5" />
            <text x="66" y="24" textAnchor="middle" fill="#C9A04A" fontSize="7" fontFamily="monospace" opacity="0.7">M</text>
          </svg>
          <span className="text-[11px] font-mono text-accent font-semibold leading-none">Spektron</span>
          <span className="text-[8px] font-mono text-accent/60 text-center leading-tight">SSM + attention</span>
        </motion.div>

        {/* Arrow 2 */}
        <motion.div
          variants={arrowVariants(0.6)}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="flex items-center justify-center flex-shrink-0 w-7"
          style={{ transformOrigin: "left center" }}
        >
          <svg viewBox="0 0 28 12" className="w-full h-3">
            <line x1="1" y1="6" x2="21" y2="6" stroke="#555" strokeWidth="1" />
            <polyline points="17,2 23,6 17,10" fill="none" stroke="#555" strokeWidth="1" />
          </svg>
        </motion.div>

        {/* Box 3: M̂ */}
        <motion.div
          variants={boxVariants(0.7)}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="flex-1 rounded-lg border border-border bg-surface p-3 flex flex-col items-center gap-2"
        >
          <svg viewBox="0 0 80 44" className="w-full h-auto" style={{ maxHeight: "44px" }}>
            {/* Simple molecule */}
            <circle cx="40" cy="14" r="7" fill="#FF6B6B" opacity="0.7" />
            <text x="40" y="17" textAnchor="middle" fill="#fff" fontSize="7" fontFamily="monospace" fontWeight="bold">O</text>
            <circle cx="22" cy="34" r="5" fill="#eee" opacity="0.6" />
            <circle cx="58" cy="34" r="5" fill="#eee" opacity="0.6" />
            <line x1="40" y1="21" x2="25" y2="30" stroke="#555" strokeWidth="1.5" />
            <line x1="40" y1="21" x2="55" y2="30" stroke="#555" strokeWidth="1.5" />
          </svg>
          <span className="text-[11px] font-mono text-text-secondary font-medium leading-none">M̂</span>
          <span className="text-[8px] font-mono text-text-muted text-center leading-tight">predicted structure</span>
        </motion.div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <p className="text-[8px] font-mono text-text-muted/40 italic">
          QM9S · 130K molecules · target R² = 0.95
        </p>
        <span className="text-[8px] font-mono text-accent/40">v0.1.0</span>
      </div>
    </div>
  );
}
