/**
 * StaggerReveal — Container that staggers the reveal of its children
 * on scroll entry. Each child fades up with a slight delay.
 */
import { useRef, type ReactNode } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";

interface Props {
  children: ReactNode;
  className?: string;
  stagger?: number;
  direction?: "up" | "down" | "left" | "right";
}

export default function StaggerReveal({
  children,
  className = "",
  stagger = 0.08,
  direction = "up",
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref as React.RefObject<Element>, { once: true, margin: "-80px" });
  const prefersReducedMotion = useReducedMotion();

  const directionMap = {
    up: { y: 30, x: 0 },
    down: { y: -30, x: 0 },
    left: { x: 30, y: 0 },
    right: { x: -30, y: 0 },
  };

  const { x, y } = directionMap[direction];

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: stagger,
          },
        },
      }}
    >
      {Array.isArray(children)
        ? children.map((child, i) => (
            <motion.div
              key={i}
              variants={{
                hidden: { opacity: 0, x, y, filter: "blur(4px)" },
                visible: {
                  opacity: 1,
                  x: 0,
                  y: 0,
                  filter: "blur(0px)",
                  transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
                },
              }}
            >
              {child}
            </motion.div>
          ))
        : children}
    </motion.div>
  );
}
