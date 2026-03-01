/**
 * ArchRace — 5-lane R² bar race for architecture comparison.
 * GSAP ScrollTrigger animates bars 0 → final R² on scroll entry.
 * D-LinOSS amber, Mamba teal, others text-muted.
 */
import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface Arch {
  name: string;
  r2: number;
  color: string;
}

const ARCHS: Arch[] = [
  { name: "D-LinOSS",    r2: 0.913, color: "#C9A04A" },
  { name: "Mamba",       r2: 0.891, color: "#4ECDC4" },
  { name: "Transformer", r2: 0.876, color: "#555555" },
  { name: "S4D",         r2: 0.858, color: "#555555" },
  { name: "CNN",         r2: 0.812, color: "#555555" },
];

const MAX_R2 = 1.0;

interface Props {
  className?: string;
}

export default function ArchRace({ className = "" }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const barRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const container = containerRef.current;
    if (!container) return;

    if (reduced) {
      barRefs.current.forEach((bar, i) => {
        if (bar) bar.style.width = `${(ARCHS[i].r2 / MAX_R2) * 100}%`;
      });
      return;
    }

    const ctx = gsap.context(() => {
      barRefs.current.forEach((bar, i) => {
        if (!bar) return;
        gsap.fromTo(
          bar,
          { width: "0%" },
          {
            width: `${(ARCHS[i].r2 / MAX_R2) * 100}%`,
            duration: 0.8,
            ease: "power2.out",
            delay: i * 0.06,
            scrollTrigger: {
              trigger: container,
              start: "top 80%",
              once: true,
            },
          },
        );
      });
    }, container);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className={`flex flex-col gap-2.5 ${className}`}>
      {ARCHS.map((arch, i) => (
        <div key={arch.name} className="flex items-center gap-3">
          {/* Label */}
          <span
            className="text-[10px] font-mono w-[88px] flex-shrink-0 text-right"
            style={{ color: arch.color === "#555555" ? "var(--color-text-muted)" : arch.color }}
          >
            {arch.name}
          </span>

          {/* Track */}
          <div className="flex-1 h-[4px] bg-white/[0.04] rounded-full overflow-hidden">
            <div
              ref={(el) => { barRefs.current[i] = el; }}
              className="h-full rounded-full"
              style={{ width: "0%", backgroundColor: arch.color }}
            />
          </div>

          {/* Value */}
          <span
            className="text-[10px] font-mono w-[38px] flex-shrink-0"
            style={{ color: arch.color === "#555555" ? "var(--color-text-muted)" : arch.color }}
          >
            {arch.r2.toFixed(3)}
          </span>
        </div>
      ))}
    </div>
  );
}
