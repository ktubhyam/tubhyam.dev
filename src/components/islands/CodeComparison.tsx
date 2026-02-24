/**
 * CodeComparison — A before/after split-view diff terminal.
 * Shows two code panels side by side with red/green highlighting
 * to indicate removed and added lines. Animates in on scroll.
 */
import { useState, useEffect, useRef } from "react";
import { motion, useInView } from "motion/react";

interface DiffLine {
  text: string;
  type: "unchanged" | "removed" | "added" | "comment";
}

interface Props {
  before?: DiffLine[];
  after?: DiffLine[];
  beforeTitle?: string;
  afterTitle?: string;
  title?: string;
  className?: string;
}

const DEFAULT_BEFORE: DiffLine[] = [
  { text: "def predict(spectrum):", type: "unchanged" },
  { text: "    # Manual peak picking", type: "comment" },
  { text: "    peaks = find_peaks(spectrum)", type: "removed" },
  { text: "    features = extract(peaks)", type: "removed" },
  { text: "    return svm.predict(features)", type: "removed" },
];

const DEFAULT_AFTER: DiffLine[] = [
  { text: "def predict(spectrum):", type: "unchanged" },
  { text: "    # End-to-end learned", type: "comment" },
  { text: "    z = encoder(spectrum)", type: "added" },
  { text: "    z_chem = vib.disentangle(z)", type: "added" },
  { text: "    return retriever(z_chem)", type: "added" },
];

const LINE_COLORS = {
  unchanged: { bg: "transparent", text: "#888", prefix: " " },
  removed: { bg: "rgba(255, 107, 107, 0.08)", text: "#FF6B6B", prefix: "−" },
  added: { bg: "rgba(52, 211, 153, 0.08)", text: "#34D399", prefix: "+" },
  comment: { bg: "transparent", text: "#555", prefix: " " },
};

export default function CodeComparison({
  before = DEFAULT_BEFORE,
  after = DEFAULT_AFTER,
  beforeTitle = "before",
  afterTitle = "after",
  title = "diff — predict.py",
  className = "",
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const [visibleBefore, setVisibleBefore] = useState(0);
  const [visibleAfter, setVisibleAfter] = useState(0);
  const [phase, setPhase] = useState<"before" | "after" | "done">("before");

  useEffect(() => {
    if (!isInView) return;
    let bCount = 0;
    let aCount = 0;

    const timer = setTimeout(() => {
      // Phase 1: reveal before
      const bInterval = setInterval(() => {
        bCount++;
        setVisibleBefore(bCount);
        if (bCount >= before.length) {
          clearInterval(bInterval);
          // Phase 2: reveal after
          setTimeout(() => {
            setPhase("after");
            const aInterval = setInterval(() => {
              aCount++;
              setVisibleAfter(aCount);
              if (aCount >= after.length) {
                clearInterval(aInterval);
                setPhase("done");
              }
            }, 150);
          }, 400);
        }
      }, 150);
    }, 300);

    return () => clearTimeout(timer);
  }, [isInView, before.length, after.length]);

  function renderLines(lines: DiffLine[], visible: number) {
    return lines.slice(0, visible).map((line, i) => {
      const cfg = LINE_COLORS[line.type];
      return (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.15 }}
          className="flex"
          style={{ backgroundColor: cfg.bg }}
        >
          <span className="w-5 text-center flex-shrink-0 select-none" style={{ color: cfg.text, opacity: 0.5 }}>
            {cfg.prefix}
          </span>
          <span style={{ color: cfg.text }}>{line.text}</span>
        </motion.div>
      );
    });
  }

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
      </div>

      {/* Split view */}
      <div className="grid grid-cols-1 md:grid-cols-2 divide-x divide-border">
        {/* Before */}
        <div className="p-3">
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border">
            <span className="w-2 h-2 rounded-full bg-[#FF6B6B]" />
            <span className="text-[9px] font-mono text-[#FF6B6B] uppercase tracking-wider">{beforeTitle}</span>
          </div>
          <div className="font-mono text-[11px] leading-[1.7] whitespace-pre">
            {renderLines(before, visibleBefore)}
          </div>
        </div>

        {/* After */}
        <div className="p-3">
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border">
            <span className="w-2 h-2 rounded-full bg-[#34D399]" />
            <span className="text-[9px] font-mono text-[#34D399] uppercase tracking-wider">{afterTitle}</span>
          </div>
          <div className="font-mono text-[11px] leading-[1.7] whitespace-pre">
            {renderLines(after, visibleAfter)}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
