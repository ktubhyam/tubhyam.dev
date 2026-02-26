/**
 * ParallaxText — Infinite scrolling text marquee that responds to scroll velocity.
 * Creates a kinetic typography effect. Inspired by Aceternity/Magic UI.
 * Respects prefers-reduced-motion by disabling the parallax animation.
 */
import { useRef, useState, useEffect } from "react";
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  useMotionValue,
  useVelocity,
  useAnimationFrame,
} from "motion/react";

interface Props {
  text: string;
  baseVelocity?: number;
  className?: string;
}

function wrap(min: number, max: number, v: number) {
  const range = max - min;
  return ((((v - min) % range) + range) % range) + min;
}

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mql.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  return prefersReducedMotion;
}

export default function ParallaxText({ text, baseVelocity = 2, className = "" }: Props) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, { damping: 50, stiffness: 300 });
  const velocityFactor = useTransform(smoothVelocity, [0, 1000], [0, 3], { clamp: false });

  const directionFactor = useRef(1);
  const x = useTransform(baseX, (v) => `${wrap(-25, 0, v)}%`);

  useAnimationFrame((_, delta) => {
    if (prefersReducedMotion) return;

    let moveBy = directionFactor.current * baseVelocity * (delta / 1000);
    if (velocityFactor.get() < 0) {
      directionFactor.current = -1;
    } else if (velocityFactor.get() > 0) {
      directionFactor.current = 1;
    }
    moveBy += directionFactor.current * moveBy * velocityFactor.get();
    baseX.set(baseX.get() + moveBy);
  });

  const repeated = `${text} — `.repeat(6);

  return (
    <div className={`overflow-hidden whitespace-nowrap ${className}`}>
      <motion.div className="inline-block" style={prefersReducedMotion ? undefined : { x }}>
        <span className="inline-block text-[clamp(2rem,6vw,5rem)] font-heading font-medium tracking-tight">
          {repeated}
        </span>
      </motion.div>
    </div>
  );
}
