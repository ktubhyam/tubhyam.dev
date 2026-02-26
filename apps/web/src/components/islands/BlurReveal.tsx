/**
 * BlurReveal — Text that blurs in letter by letter from the bottom.
 * Used for hero titles — premium Apple-like feel.
 */
import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";

interface Props {
  text: string;
  className?: string;
  delay?: number;
  as?: "h1" | "h2" | "h3" | "p" | "span";
}

export default function BlurReveal({ text, className = "", delay = 0, as: Tag = "h1" }: Props) {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const prefersReducedMotion = useReducedMotion();

  const words = text.split(" ");

  if (prefersReducedMotion) {
    return <Tag className={`flex flex-wrap gap-x-3 gap-y-1 ${className}`}>{text}</Tag>;
  }

  return (
    <Tag ref={ref} className={`flex flex-wrap gap-x-3 gap-y-1 ${className}`}>
      {words.map((word, i) => (
        <span key={i} className="inline-block overflow-hidden">
          <motion.span
            className="inline-block"
            initial={{ y: "100%", filter: "blur(8px)", opacity: 0 }}
            animate={
              isInView
                ? { y: "0%", filter: "blur(0px)", opacity: 1 }
                : { y: "100%", filter: "blur(8px)", opacity: 0 }
            }
            transition={{
              duration: 0.6,
              delay: delay + i * 0.06,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}
