/**
 * TextRevealHighlight — Scroll-driven text where specific marked words/phrases
 * get highlighted from center outward, while the rest simply fades in.
 *
 * Usage: <TextRevealHighlight parts={[
 *   { text: "I build tools that " },
 *   { text: "decode molecular behavior", highlight: true },
 *   { text: " using " },
 *   { text: "machine learning", highlight: true },
 * ]} />
 */
import { useRef } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "motion/react";

interface TextPart {
  text: string;
  highlight?: boolean;
  highlightColor?: string;
}

interface Props {
  parts: TextPart[];
  className?: string;
  highlightColor?: string;
}

const DEFAULT_HIGHLIGHT = "rgba(201, 160, 74, 0.2)";

export default function TextRevealHighlight({ parts, className = "", highlightColor }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 0.8", "end 0.3"],
  });

  const defaultColor = highlightColor ?? DEFAULT_HIGHLIGHT;

  // Flatten all words with their highlight status and color
  const allWords: { word: string; highlight: boolean; color: string }[] = [];
  parts.forEach((part) => {
    part.text.split(" ").filter(Boolean).forEach((word) => {
      allWords.push({
        word,
        highlight: !!part.highlight,
        color: part.highlightColor ?? defaultColor,
      });
    });
  });

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <p className="flex flex-wrap gap-x-[0.35em] gap-y-1 text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-heading font-medium leading-[1.15] tracking-[-0.03em]">
        {allWords.map((item, i) => {
          const start = i / allWords.length;
          const end = Math.min((i + 1.5) / allWords.length, 1);
          return (
            <Word
              key={i}
              word={item.word}
              highlight={item.highlight}
              highlightColor={item.color}
              range={[start, end]}
              progress={scrollYProgress}
            />
          );
        })}
      </p>
    </div>
  );
}

function Word({
  word,
  highlight,
  highlightColor,
  range,
  progress,
}: {
  word: string;
  highlight: boolean;
  highlightColor: string;
  range: [number, number];
  progress: MotionValue<number>;
}) {
  const opacity = useTransform(progress, range, [0.25, 1]);

  // Highlight effect only on marked words
  const highlightScale = useTransform(progress, range, [0, 1]);
  const highlightOpacity = useTransform(progress, [range[0] + 0.05, range[1]], [0, 0.9]);

  return (
    <span className="relative inline-block">
      {highlight && (
        <motion.span
          className="absolute inset-0 -mx-1 rounded-[4px] origin-center"
          style={{
            scaleX: highlightScale,
            opacity: highlightOpacity,
            background: highlightColor,
          }}
        />
      )}
      <motion.span
        style={{ opacity }}
        className="relative z-10 text-[#fafafa]"
      >
        {word}
      </motion.span>
    </span>
  );
}
