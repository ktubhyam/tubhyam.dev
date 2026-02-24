/**
 * GlowLine — A horizontal line that draws across the viewport with
 * accent-colored glow, revealing tags/words at spaced intervals.
 * Triggered on scroll. Replaces the parallax marquee with something
 * more purposeful and less distracting.
 */
import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";

interface Props {
  words: string[];
  className?: string;
}

export default function GlowLine({ words, className = "" }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 0.85", "end 0.3"],
  });

  const lineWidth = useTransform(scrollYProgress, [0, 0.6], ["0%", "100%"]);
  const glowOpacity = useTransform(scrollYProgress, [0, 0.3, 0.8, 1], [0, 0.8, 0.8, 0.3]);

  return (
    <div ref={containerRef} className={`relative py-16 ${className}`}>
      {/* Base line (muted) */}
      <div className="absolute top-1/2 left-0 right-0 h-px bg-[#1a1a1a]" />

      {/* Animated drawing line with glow */}
      <motion.div
        className="absolute top-1/2 left-0 h-px origin-left"
        style={{
          width: lineWidth,
          background: "linear-gradient(90deg, rgba(201, 160, 74, 0.6), rgba(201, 160, 74, 0.2))",
          boxShadow: "0 0 12px rgba(201, 160, 74, 0.3), 0 0 4px rgba(201, 160, 74, 0.5)",
          opacity: glowOpacity,
        }}
      />

      {/* Words spaced along the line */}
      <div className="relative flex justify-between items-center px-6 md:px-12">
        {words.map((word, i) => {
          const wordStart = (i / words.length) * 0.7;
          const wordEnd = wordStart + 0.15;

          return (
            <WordNode
              key={i}
              word={word}
              scrollProgress={scrollYProgress}
              start={wordStart}
              end={wordEnd}
            />
          );
        })}
      </div>
    </div>
  );
}

function WordNode({
  word,
  scrollProgress,
  start,
  end,
}: {
  word: string;
  scrollProgress: ReturnType<typeof useScroll>["scrollYProgress"];
  start: number;
  end: number;
}) {
  const opacity = useTransform(scrollProgress, [start, end], [0, 1]);
  const y = useTransform(scrollProgress, [start, end], [8, 0]);
  const dotScale = useTransform(scrollProgress, [start, start + 0.05], [0, 1]);

  return (
    <motion.div className="flex flex-col items-center gap-3" style={{ opacity, y }}>
      <span className="text-xs font-mono text-[#C9A04A]/70 tracking-wider uppercase whitespace-nowrap">
        {word}
      </span>
      <motion.div
        className="w-1.5 h-1.5 rounded-full bg-[#C9A04A]"
        style={{
          scale: dotScale,
          boxShadow: "0 0 8px rgba(201, 160, 74, 0.5)",
        }}
      />
    </motion.div>
  );
}
