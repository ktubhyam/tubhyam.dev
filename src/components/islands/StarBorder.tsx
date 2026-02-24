/**
 * StarBorder — Animated glowing border with traveling star effect.
 * From React Bits (MIT + Commons Clause).
 */
import type { ReactNode, CSSProperties } from "react";

interface StarBorderProps {
  as?: "button" | "a" | "div";
  className?: string;
  children?: ReactNode;
  color?: string;
  speed?: CSSProperties["animationDuration"];
  thickness?: number;
  href?: string;
  [key: string]: unknown;
}

export default function StarBorder({
  as: Component = "button",
  className = "",
  color = "#C9A04A",
  speed = "6s",
  thickness = 1,
  children,
  ...rest
}: StarBorderProps) {
  return (
    <Component
      className={`relative inline-block overflow-hidden rounded-full ${className}`}
      style={{ padding: `${thickness}px 0` }}
      {...(rest as Record<string, unknown>)}
    >
      <div
        className="absolute w-[300%] h-[50%] opacity-70 bottom-[-11px] right-[-250%] rounded-full animate-star-movement-bottom z-0"
        style={{
          background: `radial-gradient(circle, ${color}, transparent 10%)`,
          animationDuration: speed,
        }}
      />
      <div
        className="absolute w-[300%] h-[50%] opacity-70 top-[-10px] left-[-250%] rounded-full animate-star-movement-top z-0"
        style={{
          background: `radial-gradient(circle, ${color}, transparent 10%)`,
          animationDuration: speed,
        }}
      />
      <div className="relative z-10 bg-[#0a0a0a] border border-[#1a1a1a] text-[#fafafa] text-center text-sm font-heading font-medium py-3 px-6 rounded-full">
        {children}
      </div>
    </Component>
  );
}
