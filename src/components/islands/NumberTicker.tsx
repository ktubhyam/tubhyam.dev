/**
 * NumberTicker — Smooth animated number counter with spring physics.
 * Counts up from 0 to target when in view, with a satisfying spring motion.
 */
import { useRef, useEffect } from "react";
import { motion, useMotionValue, useSpring, useInView, useTransform } from "motion/react";

interface Props {
  value: number;
  className?: string;
  suffix?: string;
  prefix?: string;
}

export default function NumberTicker({ value, className = "", suffix = "", prefix = "" }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref as React.RefObject<Element>, { once: true, margin: "-50px" });

  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, { stiffness: 80, damping: 20, mass: 1 });
  const displayValue = useTransform(springValue, (v) => Math.round(v));

  useEffect(() => {
    if (isInView) {
      motionValue.set(value);
    }
  }, [isInView, value, motionValue]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      <motion.span>{displayValue}</motion.span>
      {suffix}
    </span>
  );
}
