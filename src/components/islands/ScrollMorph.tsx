/**
 * ScrollMorph — A card that morphs into a horizontal bar on scroll,
 * text appears inside, and specific words get highlighted from center outward.
 * The user's signature animation idea.
 *
 * Usage: <ScrollMorph parts={[
 *   { text: "Decoding " },
 *   { text: "molecular structure", highlight: true },
 *   { text: " from spectra" },
 * ]} label="Research" />
 */
import { useRef } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "motion/react";

interface TextPart {
  text: string;
  highlight?: boolean;
}

interface Props {
  parts: TextPart[];
  label?: string;
  className?: string;
}

export default function ScrollMorph({ parts, label = "", className = "" }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 0.7", "end 0.2"],
  });

  // Phase 1 (0-0.35): Card morphs from compact square to horizontal bar
  const borderRadius = useTransform(scrollYProgress, [0, 0.35], [24, 14]);
  const width = useTransform(scrollYProgress, [0, 0.35], ["160px", "100%"]);
  const height = useTransform(scrollYProgress, [0, 0.35], ["160px", "72px"]);
  const borderOpacity = useTransform(scrollYProgress, [0, 0.35], [0.06, 0.12]);

  // Phase 2 (0.3-0.6): Text fades in and slides up
  const textOpacity = useTransform(scrollYProgress, [0.3, 0.55], [0, 1]);
  const textY = useTransform(scrollYProgress, [0.3, 0.55], [16, 0]);

  // Label fades out as morph begins
  const labelOpacity = useTransform(scrollYProgress, [0, 0.25], [0.5, 0]);

  // Card background
  const bgColor = useTransform(scrollYProgress, [0, 0.35], ["rgba(255,255,255,0.03)", "rgba(255,255,255,0.05)"]);

  return (
    <div ref={containerRef} className={`relative h-[70vh] flex items-center justify-center ${className}`}>
      <div className="sticky top-1/2 -translate-y-1/2 w-full max-w-3xl mx-auto flex items-center justify-center px-6">
        <motion.div
          className="relative flex items-center justify-center overflow-hidden"
          style={{
            borderRadius,
            width,
            height,
            backgroundColor: bgColor,
            borderWidth: 1,
            borderStyle: "solid",
            borderColor: useTransform(borderOpacity, (v) => `rgba(255,255,255,${v})`),
          }}
        >
          {/* Label in initial card state */}
          {label && (
            <motion.span
              className="absolute text-[10px] font-mono text-[#444] uppercase tracking-[0.2em]"
              style={{ opacity: labelOpacity }}
            >
              {label}
            </motion.span>
          )}

          {/* Text with targeted highlights */}
          <motion.div
            className="relative z-10 flex flex-wrap items-center justify-center gap-x-[0.3em] px-6"
            style={{ opacity: textOpacity, y: textY }}
          >
            {parts.map((part, i) => (
              <MorphWord
                key={i}
                text={part.text}
                highlight={!!part.highlight}
                scrollProgress={scrollYProgress}
                index={i}
                total={parts.length}
              />
            ))}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

function MorphWord({
  text,
  highlight,
  scrollProgress,
  index,
  total,
}: {
  text: string;
  highlight: boolean;
  scrollProgress: MotionValue<number>;
  index: number;
  total: number;
}) {
  // Highlight sweep happens in phase 3 (0.6 - 1.0), staggered per highlighted word
  const highlightStart = 0.6 + (index / total) * 0.2;
  const highlightEnd = Math.min(highlightStart + 0.25, 1);

  const highlightWidth = useTransform(scrollProgress, [highlightStart, highlightEnd], ["0%", "108%"]);
  const highlightOpacity = useTransform(scrollProgress, [highlightStart, highlightStart + 0.08], [0, 1]);

  return (
    <span className="relative inline-block">
      {highlight && (
        <motion.span
          className="absolute inset-0 -mx-1 rounded-[4px] origin-center"
          style={{
            scaleX: useTransform(scrollProgress, [highlightStart, highlightEnd], [0, 1]),
            opacity: highlightOpacity,
            background: "rgba(201, 160, 74, 0.2)",
          }}
        />
      )}
      <span className="relative z-10 text-base sm:text-lg font-heading font-medium text-[#fafafa] whitespace-nowrap">
        {text}
      </span>
    </span>
  );
}
