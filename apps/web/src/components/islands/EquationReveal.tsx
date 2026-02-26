/**
 * EquationReveal — Equations type themselves in character by character,
 * hold briefly, then delete character by character (reverse typewriter),
 * and the next equation types in. Seamless loop, no disappearing gap.
 */
import { useState, useEffect, useRef } from "react";
import { motion, useInView } from "motion/react";

interface EquationSegment {
  text: string;
  color?: "variable" | "operator" | "function" | "number" | "subscript" | "annotation" | "bracket";
}

interface EquationDef {
  segments: EquationSegment[];
  annotation: string;
  label: string;
}

interface Props {
  equations?: EquationDef[];
  title?: string;
  className?: string;
  typingSpeed?: number;
  deleteSpeed?: number;
  holdTime?: number;
}

const COLOR_MAP: Record<string, string> = {
  variable: "#e0e0e0",
  operator: "#FF6B6B",
  function: "#C9A04A",
  number: "#4ECDC4",
  subscript: "#888",
  annotation: "#555",
  bracket: "#666",
};

const DEFAULT_EQUATIONS: EquationDef[] = [
  {
    label: "VIB Head",
    annotation: "Variational Information Bottleneck — disentangle chemistry from instrument artifacts",
    segments: [
      { text: "z", color: "variable" },
      { text: "chem", color: "subscript" },
      { text: " = ", color: "operator" },
      { text: "VIB", color: "function" },
      { text: "(", color: "bracket" },
      { text: "E", color: "function" },
      { text: "(", color: "bracket" },
      { text: "x", color: "variable" },
      { text: ")", color: "bracket" },
      { text: ")", color: "bracket" },
      { text: ", ", color: "operator" },
      { text: "β", color: "number" },
      { text: " · ", color: "operator" },
      { text: "KL", color: "function" },
      { text: "(", color: "bracket" },
      { text: "q", color: "variable" },
      { text: " ‖ ", color: "operator" },
      { text: "p", color: "variable" },
      { text: ")", color: "bracket" },
    ],
  },
  {
    label: "Loss",
    annotation: "Training objective — reconstruction + KL regularization + adversarial disentanglement",
    segments: [
      { text: "L", color: "function" },
      { text: " = ", color: "operator" },
      { text: "L", color: "function" },
      { text: "recon", color: "subscript" },
      { text: " + ", color: "operator" },
      { text: "β", color: "number" },
      { text: " · ", color: "operator" },
      { text: "L", color: "function" },
      { text: "KL", color: "subscript" },
      { text: " + ", color: "operator" },
      { text: "λ", color: "number" },
      { text: " · ", color: "operator" },
      { text: "L", color: "function" },
      { text: "adv", color: "subscript" },
    ],
  },
  {
    label: "Theorem 1",
    annotation: "Information Completeness Ratio — quantifies the observable fraction of vibrational modes",
    segments: [
      { text: "R", color: "function" },
      { text: "(", color: "bracket" },
      { text: "G", color: "variable" },
      { text: ", ", color: "operator" },
      { text: "N", color: "variable" },
      { text: ")", color: "bracket" },
      { text: " = ", color: "operator" },
      { text: "(", color: "bracket" },
      { text: "N", color: "function" },
      { text: "IR", color: "subscript" },
      { text: " + ", color: "operator" },
      { text: "N", color: "function" },
      { text: "Raman", color: "subscript" },
      { text: ")", color: "bracket" },
      { text: " / ", color: "operator" },
      { text: "(", color: "bracket" },
      { text: "3N", color: "number" },
      { text: " − ", color: "operator" },
      { text: "6", color: "number" },
      { text: ")", color: "bracket" },
    ],
  },
  {
    label: "Theorem 2",
    annotation: "Modal Complementarity — IR and Raman observe strictly disjoint mode sets in centrosymmetric molecules",
    segments: [
      { text: "I", color: "function" },
      { text: "(", color: "bracket" },
      { text: "X", color: "variable" },
      { text: "; ", color: "operator" },
      { text: "Y", color: "variable" },
      { text: "IR", color: "subscript" },
      { text: ", ", color: "operator" },
      { text: "Y", color: "variable" },
      { text: "Raman", color: "subscript" },
      { text: ")", color: "bracket" },
      { text: " ≥ ", color: "operator" },
      { text: "I", color: "function" },
      { text: "(", color: "bracket" },
      { text: "X", color: "variable" },
      { text: "; ", color: "operator" },
      { text: "Y", color: "variable" },
      { text: "IR", color: "subscript" },
      { text: ")", color: "bracket" },
    ],
  },
];

export default function EquationReveal({
  equations = DEFAULT_EQUATIONS,
  title = "theorem — symmetry quotient",
  className = "",
  typingSpeed = 40,
  deleteSpeed = 20,
  holdTime = 3000,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const [currentIdx, setCurrentIdx] = useState(0);
  const [visibleChars, setVisibleChars] = useState(0);
  const [showAnnotation, setShowAnnotation] = useState(false);
  const [phase, setPhase] = useState<"typing" | "holding" | "deleting" | "switching">("typing");

  const eq = equations[currentIdx];
  const totalChars = eq.segments.reduce((sum, seg) => sum + seg.text.length, 0);

  // Cycle: type → hold → delete → switch → type...
  useEffect(() => {
    if (!isInView) return;

    let timeout: ReturnType<typeof setTimeout>;
    let interval: ReturnType<typeof setInterval>;

    if (phase === "typing") {
      let current = visibleChars;
      timeout = setTimeout(() => {
        interval = setInterval(() => {
          current++;
          setVisibleChars(current);
          if (current >= totalChars) {
            clearInterval(interval);
            setShowAnnotation(true);
            setPhase("holding");
          }
        }, typingSpeed);
      }, currentIdx === 0 && visibleChars === 0 ? 300 : 100);
    } else if (phase === "holding") {
      timeout = setTimeout(() => {
        setShowAnnotation(false);
        setPhase("deleting");
      }, holdTime);
    } else if (phase === "deleting") {
      let current = visibleChars;
      interval = setInterval(() => {
        current--;
        setVisibleChars(current);
        if (current <= 0) {
          clearInterval(interval);
          setPhase("switching");
        }
      }, deleteSpeed);
    } else if (phase === "switching") {
      // Brief pause at empty state, then advance
      timeout = setTimeout(() => {
        setCurrentIdx((i) => (i + 1) % equations.length);
        setVisibleChars(0);
        setPhase("typing");
      }, 150);
    }

    return () => {
      clearTimeout(timeout);
      if (interval) clearInterval(interval);
    };
  }, [isInView, phase, currentIdx, totalChars, typingSpeed, deleteSpeed, holdTime, equations.length, visibleChars]);

  function renderEquation() {
    let charCount = 0;
    return eq.segments.map((seg, i) => {
      const segStart = charCount;
      charCount += seg.text.length;
      const visibleLen = Math.max(0, Math.min(seg.text.length, visibleChars - segStart));
      const text = seg.text.slice(0, visibleLen);
      if (text.length === 0) return null;
      const color = seg.color ? COLOR_MAP[seg.color] : "#e0e0e0";
      const isSubscript = seg.color === "subscript";
      return (
        <span key={i} style={{ color }} className={isSubscript ? "text-[60%] align-sub" : ""}>
          {text}
        </span>
      );
    });
  }

  // Show cursor during typing or deleting
  const showCursor = phase === "typing" || phase === "deleting" || phase === "switching";

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
        {/* Equation counter dots */}
        <div className="ml-auto flex items-center gap-1.5">
          {equations.map((_, i) => (
            <div
              key={i}
              className="w-[5px] h-[5px] rounded-full transition-all duration-300"
              style={{
                backgroundColor: i === currentIdx ? "#C9A04A" : "#333",
                boxShadow: i === currentIdx ? "0 0 6px rgba(201, 160, 74, 0.4)" : "none",
              }}
            />
          ))}
        </div>
      </div>

      {/* Equation */}
      <div className="p-6 flex flex-col items-center gap-4 min-h-[120px] justify-center">
        <div className="flex flex-col items-center gap-3">
          {/* Label — fades with annotation timing */}
          <span
            className="text-[9px] font-mono text-[#C9A04A]/60 uppercase tracking-widest transition-opacity duration-300"
            style={{ opacity: visibleChars > 0 ? 1 : 0 }}
          >
            {eq.label}
          </span>

          {/* Equation text */}
          <div className="font-mono text-sm sm:text-lg md:text-2xl tracking-wide whitespace-nowrap min-h-[32px] overflow-x-auto">
            {renderEquation()}
            {showCursor && (
              <span className="inline-block w-[8px] h-[18px] bg-[#C9A04A] animate-blink ml-px translate-y-[2px]" />
            )}
          </div>

          {/* Annotation */}
          <p
            className="text-[11px] font-mono text-text-muted/70 text-center max-w-sm leading-relaxed transition-all duration-300"
            style={{
              opacity: showAnnotation ? 1 : 0,
              transform: showAnnotation ? "translateY(0)" : "translateY(6px)",
            }}
          >
            {eq.annotation}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
