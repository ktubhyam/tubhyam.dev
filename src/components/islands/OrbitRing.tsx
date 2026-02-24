/**
 * OrbitRing — Items orbit around a central element in concentric rings.
 * Smooth continuous rotation with staggered speeds per ring.
 * Creates a solar-system / electron-shell aesthetic.
 */
import { useRef } from "react";
import { motion, useInView } from "motion/react";

interface OrbitItem {
  label: string;
  icon: string; // SVG path
}

interface Props {
  centerLabel: string;
  centerIcon: string;
  rings: OrbitItem[][];
  className?: string;
}

export default function OrbitRing({ centerLabel, centerIcon, rings, className = "" }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  const ringRadii = [100, 170, 240]; // px from center

  return (
    <div ref={ref} className={`relative flex items-center justify-center ${className}`} style={{ height: "500px" }}>
      {/* Orbit rings (circles) */}
      {rings.map((_, ringIndex) => (
        <motion.div
          key={`ring-${ringIndex}`}
          className="absolute rounded-full border border-white/[0.04]"
          style={{
            width: ringRadii[ringIndex] * 2,
            height: ringRadii[ringIndex] * 2,
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={isInView ? { scale: 1, opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.2 + ringIndex * 0.15 }}
        />
      ))}

      {/* Orbiting items */}
      {rings.map((items, ringIndex) =>
        items.map((item, itemIndex) => {
          const angle = (360 / items.length) * itemIndex;
          const radius = ringRadii[ringIndex];
          const duration = 20 + ringIndex * 10; // outer rings slower

          return (
            <motion.div
              key={`item-${ringIndex}-${itemIndex}`}
              className="absolute"
              style={{
                width: radius * 2,
                height: radius * 2,
              }}
              initial={{ rotate: angle, opacity: 0 }}
              animate={isInView ? {
                rotate: [angle, angle + 360],
                opacity: 1,
              } : {}}
              transition={{
                rotate: {
                  duration,
                  repeat: Infinity,
                  ease: "linear",
                },
                opacity: { duration: 0.5, delay: 0.4 + ringIndex * 0.2 + itemIndex * 0.1 },
              }}
            >
              {/* Item positioned at top of the rotating container */}
              <motion.div
                className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1.5"
                // Counter-rotate to keep items upright
                animate={isInView ? { rotate: [-(angle), -(angle + 360)] } : {}}
                transition={{
                  rotate: { duration, repeat: Infinity, ease: "linear" },
                }}
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/[0.04] border border-white/10 hover:border-[#C9A04A]/30 hover:bg-[#C9A04A]/5 transition-colors duration-300">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d={item.icon} />
                  </svg>
                </div>
                <span className="text-[9px] font-mono text-white/30 whitespace-nowrap">
                  {item.label}
                </span>
              </motion.div>
            </motion.div>
          );
        })
      )}

      {/* Center node */}
      <motion.div
        className="relative z-10 flex flex-col items-center gap-2"
        initial={{ scale: 0 }}
        animate={isInView ? { scale: 1 } : {}}
        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
      >
        <motion.div
          className="flex items-center justify-center w-20 h-20 rounded-full bg-[#C9A04A]/10 border border-[#C9A04A]/30"
          animate={isInView ? {
            boxShadow: [
              "0 0 0px rgba(201, 160, 74, 0)",
              "0 0 30px rgba(201, 160, 74, 0.15)",
              "0 0 0px rgba(201, 160, 74, 0)",
            ],
          } : {}}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C9A04A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d={centerIcon} />
          </svg>
        </motion.div>
        <span className="text-xs font-mono text-[#C9A04A]/70">{centerLabel}</span>
      </motion.div>
    </div>
  );
}
