/**
 * CountUpStats — Animated statistics row with large numbers that count up,
 * accent-colored dividers, and labels. More visual than plain NumberTicker.
 */
import { useRef, useEffect } from "react";
import { motion, useMotionValue, useSpring, useInView, useTransform } from "motion/react";

interface Stat {
  value: number;
  label: string;
  suffix?: string;
  prefix?: string;
}

interface Props {
  stats: Stat[];
  className?: string;
}

export default function CountUpStats({ stats, className = "" }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref as React.RefObject<Element>, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      className={`grid grid-cols-2 gap-6 md:gap-8 ${className}`}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
    >
      {stats.map((stat, i) => (
        <motion.div
          key={i}
          className="flex flex-col items-center gap-1"
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: {
              opacity: 1,
              y: 0,
              transition: { duration: 0.5, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] },
            },
          }}
        >
          <div className="flex items-baseline gap-0.5">
            {stat.prefix && (
              <span className="text-lg font-heading text-[#C9A04A]/60">{stat.prefix}</span>
            )}
            <AnimatedNumber value={stat.value} isInView={isInView} />
            {stat.suffix && (
              <span className="text-lg font-heading text-[#C9A04A]/60">{stat.suffix}</span>
            )}
          </div>
          <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest">
            {stat.label}
          </span>
          {/* Accent dot */}
          <motion.div
            className="w-1 h-1 rounded-full bg-[#C9A04A]/40 mt-1"
            variants={{
              hidden: { scale: 0 },
              visible: { scale: 1, transition: { delay: 0.6 + i * 0.1 } },
            }}
          />
        </motion.div>
      ))}
    </motion.div>
  );
}

function AnimatedNumber({ value, isInView }: { value: number; isInView: boolean }) {
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, { stiffness: 60, damping: 20, mass: 1.5 });
  const display = useTransform(springValue, (v) => Math.round(v));

  useEffect(() => {
    if (isInView) motionValue.set(value);
  }, [isInView, value, motionValue]);

  return (
    <motion.span className="text-4xl md:text-5xl font-heading font-bold text-[#fafafa] tabular-nums">
      {display}
    </motion.span>
  );
}
