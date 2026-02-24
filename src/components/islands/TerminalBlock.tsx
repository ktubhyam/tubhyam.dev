/**
 * TerminalBlock — Realistic terminal window with syntax-highlighted code
 * that types out character by character with an active line highlight
 * and a subtle horizontal scanline effect.
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, useInView } from "motion/react";

interface ColoredSpan {
  text: string;
  color?: "green" | "amber" | "purple" | "teal" | "red" | "muted" | "white" | "blue";
}

interface TerminalLine {
  prompt?: string;
  spans: ColoredSpan[];
  delay?: number;
}

interface Props {
  lines: TerminalLine[];
  title?: string;
  className?: string;
  typingSpeed?: number;
}

const COLOR_MAP: Record<string, string> = {
  green: "#34D399",
  amber: "#C9A04A",
  purple: "#A78BFA",
  teal: "#4ECDC4",
  red: "#FF6B6B",
  muted: "#555",
  white: "#e0e0e0",
  blue: "#60A5FA",
};

export default function TerminalBlock({
  lines,
  title = "terminal",
  className = "",
  typingSpeed = 30,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const [visibleChars, setVisibleChars] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const totalCharsRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const flatChars = useRef<{ char: string; color: string; lineIdx: number; isPrompt: boolean }[]>([]);

  // Build flat character array on mount
  useEffect(() => {
    const chars: typeof flatChars.current = [];
    lines.forEach((line, lineIdx) => {
      if (line.prompt) {
        for (const ch of line.prompt) {
          chars.push({ char: ch, color: "#555", lineIdx, isPrompt: true });
        }
      }
      for (const span of line.spans) {
        const color = span.color ? COLOR_MAP[span.color] ?? "#e0e0e0" : "#e0e0e0";
        for (const ch of span.text) {
          chars.push({ char: ch, color, lineIdx, isPrompt: false });
        }
      }
      chars.push({ char: "\n", color: "", lineIdx, isPrompt: false });
    });
    flatChars.current = chars;
    totalCharsRef.current = chars.length;
  }, [lines]);

  // Start typing when in view
  useEffect(() => {
    if (!isInView) return;

    const startDelay = setTimeout(() => {
      let currentChar = 0;
      intervalRef.current = setInterval(() => {
        currentChar++;
        setVisibleChars(currentChar);
        if (currentChar >= totalCharsRef.current) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setIsDone(true);
        }
      }, typingSpeed);
    }, 300);

    return () => {
      clearTimeout(startDelay);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isInView, typingSpeed]);

  const getCurrentLineIdx = useCallback(() => {
    const chars = flatChars.current;
    if (visibleChars <= 0) return 0;
    const lastVisible = chars[Math.min(visibleChars - 1, chars.length - 1)];
    return lastVisible?.lineIdx ?? 0;
  }, [visibleChars]);

  // Render visible characters
  const renderLines = useCallback(() => {
    const chars = flatChars.current;
    const visible = chars.slice(0, visibleChars);
    const currentLine = getCurrentLineIdx();

    // Group by line
    const lineGroups: Map<number, typeof chars> = new Map();
    for (const ch of visible) {
      if (ch.char === "\n") continue;
      if (!lineGroups.has(ch.lineIdx)) lineGroups.set(ch.lineIdx, []);
      lineGroups.get(ch.lineIdx)!.push(ch);
    }

    return lines.map((line, lineIdx) => {
      const lineChars = lineGroups.get(lineIdx) ?? [];
      const firstCharOfLine = chars.findIndex((c) => c.lineIdx === lineIdx);
      if (firstCharOfLine >= visibleChars) return null;

      const isActiveLine = lineIdx === currentLine && !isDone;

      return (
        <div
          key={lineIdx}
          className="flex relative transition-colors duration-150"
          style={{
            backgroundColor: isActiveLine ? "rgba(201, 160, 74, 0.04)" : "transparent",
            borderLeft: isActiveLine ? "2px solid rgba(201, 160, 74, 0.3)" : "2px solid transparent",
            paddingLeft: "6px",
            marginLeft: "-8px",
          }}
        >
          {/* Line number */}
          <span className="w-5 text-right mr-3 select-none flex-shrink-0 text-[#333]" style={{ fontSize: "inherit" }}>
            {lineIdx + 1}
          </span>

          {/* Content */}
          <span className="flex-1">
            {lineChars.map((ch, i) => (
              <span
                key={i}
                style={{ color: ch.color }}
                className={ch.isPrompt ? "select-none" : ""}
              >
                {ch.char}
              </span>
            ))}
            {/* Cursor on current line */}
            {lineIdx === currentLine && visibleChars < totalCharsRef.current && (
              <span className="inline-block w-[7px] h-[14px] bg-[#C9A04A] animate-blink ml-px translate-y-[1px]" />
            )}
          </span>
        </div>
      );
    });
  }, [visibleChars, lines, isDone, getCurrentLineIdx]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`rounded-xl border border-[#1a1a1a] overflow-hidden bg-[#0a0a0a] relative ${className}`}
    >
      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-[#0f0f0f] border-b border-[#1a1a1a]">
        <div className="flex items-center gap-1.5">
          <div className="w-[10px] h-[10px] rounded-full bg-[#FF5F57]" />
          <div className="w-[10px] h-[10px] rounded-full bg-[#FEBC2E]" />
          <div className="w-[10px] h-[10px] rounded-full bg-[#28C840]" />
        </div>
        <span className="ml-2 text-[10px] font-mono text-[#444] select-none">{title}</span>
        {!isDone && visibleChars > 0 && (
          <span className="ml-auto flex items-center gap-1.5 text-[10px] font-mono text-[#C9A04A]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C9A04A] animate-pulse" />
            typing
          </span>
        )}
      </div>

      {/* Terminal content */}
      <div className="p-4 font-mono text-xs md:text-sm leading-relaxed min-h-[120px] whitespace-pre relative overflow-hidden">
        {renderLines()}

        {/* Subtle scanline overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)",
            backgroundSize: "100% 4px",
          }}
        />
      </div>
    </motion.div>
  );
}
