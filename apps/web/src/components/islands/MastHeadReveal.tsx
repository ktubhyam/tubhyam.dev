/**
 * MastHeadReveal — Character-by-character blur+fade stagger reveal.
 * Used for the "LATENT CHEMISTRY" masthead in the writing section.
 */
import { useRef } from "react";
import { motion, useInView } from "motion/react";

interface Props {
  text: string;
  className?: string;
}

export default function MastHeadReveal({ text, className = "" }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const reduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <div ref={ref} className={className} aria-label={text}>
      {text.split("").map((char, i) => (
        <motion.span
          key={i}
          initial={reduced ? { opacity: 1, y: 0, filter: "blur(0px)" } : { opacity: 0, y: 24, filter: "blur(8px)" }}
          animate={
            reduced || isInView
              ? { opacity: 1, y: 0, filter: "blur(0px)" }
              : { opacity: 0, y: 24, filter: "blur(8px)" }
          }
          transition={reduced ? { duration: 0 } : {
            delay: i * 0.034,
            duration: 0.55,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="inline-block"
          style={{ whiteSpace: "pre" }}
        >
          {char}
        </motion.span>
      ))}
    </div>
  );
}
