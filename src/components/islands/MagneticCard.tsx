/**
 * MagneticCard — Card with magnetic tilt + subtle glow that follows cursor.
 * Creates a premium interactive feel on hover.
 */
import { useRef, type ReactNode } from "react";
import { motion, useMotionValue, useSpring, useTransform, useMotionTemplate } from "motion/react";

interface Props {
  children: ReactNode;
  className?: string;
  href?: string;
}

export default function MagneticCard({ children, className = "", href }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  const rotateX = useSpring(useTransform(mouseY, [0, 1], [4, -4]), { stiffness: 200, damping: 20 });
  const rotateY = useSpring(useTransform(mouseX, [0, 1], [-4, 4]), { stiffness: 200, damping: 20 });

  const glowX = useTransform(mouseX, [0, 1], [0, 100]);
  const glowY = useTransform(mouseY, [0, 1], [0, 100]);
  const glowBackground = useMotionTemplate`radial-gradient(300px circle at ${glowX}% ${glowY}%, rgba(255,255,255,0.03), transparent 60%)`;

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set((e.clientX - rect.left) / rect.width);
    mouseY.set((e.clientY - rect.top) / rect.height);
  }

  function handleMouseLeave() {
    mouseX.set(0.5);
    mouseY.set(0.5);
  }

  const Tag = href ? "a" : "div";

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformPerspective: 800,
      }}
      className={`relative group ${className}`}
    >
      <Tag
        {...(href ? { href } : {})}
        className="block relative z-10 bg-[#111] border border-[#1a1a1a] rounded-2xl p-6 transition-colors duration-300 group-hover:border-[#2a2a2a] group-hover:bg-[#161616] cursor-pointer"
      >
        {children}
      </Tag>

      {/* Glow that follows cursor */}
      <motion.div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none -z-10"
        style={{ background: glowBackground }}
      />
    </motion.div>
  );
}
