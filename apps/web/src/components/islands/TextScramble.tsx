/**
 * TextScramble — Text decode/scramble effect on mount.
 * Characters scramble through random glyphs before settling on the final text.
 * Inspired by Matrix / hacker terminal aesthetics.
 */
import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "motion/react";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";

interface Props {
  text: string;
  className?: string;
  speed?: number;
  as?: "span" | "p" | "h1" | "h2" | "h3";
  mono?: boolean;
}

export default function TextScramble({ text, className = "", speed = 30, as: Tag = "span", mono = true }: Props) {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref as React.RefObject<Element>, { once: true, margin: "-50px" });
  const prefersReducedMotion = useReducedMotion();
  const [displayed, setDisplayed] = useState(text.replace(/[^\s]/g, " "));
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (prefersReducedMotion) {
      setDisplayed(text);
      return;
    }
    if (!isInView || hasAnimated.current) return;
    hasAnimated.current = true;

    let frame = 0;
    const totalFrames = text.length * 2;

    const interval = setInterval(() => {
      const progress = frame / totalFrames;
      const revealedCount = Math.floor(progress * text.length);

      const result = text
        .split("")
        .map((char, i) => {
          if (char === " ") return " ";
          if (i < revealedCount) return char;
          return CHARS[Math.floor(Math.random() * CHARS.length)];
        })
        .join("");

      setDisplayed(result);
      frame++;

      if (frame > totalFrames) {
        setDisplayed(text);
        clearInterval(interval);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [isInView, text, speed, prefersReducedMotion]);

  return (
    <Tag ref={ref as React.RefObject<HTMLSpanElement>} className={`${mono ? "font-mono " : ""}${className}`}>
      {displayed}
    </Tag>
  );
}
