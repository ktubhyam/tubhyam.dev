import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";

function usePrefersReducedMotion() {
  const [val, setVal] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setVal(mql.matches);
    const handler = (e: MediaQueryListEvent) => setVal(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);
  return val;
}

interface Section {
  id: string;
  label: string;
  number: string;
}

const SECTIONS: Section[] = [
  { id: "hero",    label: "HERO",     number: "00" },
  { id: "research", label: "RESEARCH", number: "01" },
  { id: "build",   label: "BUILD",    number: "02" },
  { id: "explore", label: "EXPLORE",  number: "03" },
  { id: "writing", label: "WRITING",  number: "04" },
  { id: "connect", label: "CONNECT",  number: "05" },
];

export default function SideNav() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [active, setActive] = useState("hero");
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const ratiosRef = useRef<Record<string, number>>({});

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), prefersReducedMotion ? 0 : 1500);
    return () => clearTimeout(timer);
  }, [prefersReducedMotion]);

  useEffect(() => {
    const elements = document.querySelectorAll<HTMLElement>("[data-nav-section]");
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = (entry.target as HTMLElement).dataset.navSection;
          if (id) ratiosRef.current[id] = entry.intersectionRatio;
        });

        let maxRatio = 0;
        let maxId = "";
        for (const [id, ratio] of Object.entries(ratiosRef.current)) {
          if (ratio > maxRatio) { maxRatio = ratio; maxId = id; }
        }
        if (maxId && maxRatio > 0) setActive(maxId);
      },
      { threshold: [0, 0.1, 0.2, 0.3, 0.5, 0.8, 1.0] }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const scrollTo = useCallback((id: string) => {
    const el = document.querySelector(`[data-nav-section="${id}"]`);
    if (el) {
      el.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" });
    }
  }, [prefersReducedMotion]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.nav
          initial={prefersReducedMotion ? false : { opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="hidden md:flex fixed right-6 top-1/2 -translate-y-1/2 z-50 flex-col items-end gap-2"
          aria-label="Section navigation"
        >
          {SECTIONS.map((section) => {
            const isActive = active === section.id;
            const isHovered = hovered === section.id;

            return (
              <button
                key={section.id}
                onClick={() => scrollTo(section.id)}
                onMouseEnter={() => setHovered(section.id)}
                onMouseLeave={() => setHovered(null)}
                className="flex items-center gap-2 group cursor-pointer"
                aria-label={`Go to ${section.label}`}
                aria-current={isActive ? "true" : undefined}
              >
                {/* Label — visible on hover or active */}
                <AnimatePresence>
                  {(isHovered || isActive) && (
                    <motion.span
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 8 }}
                      transition={{ duration: prefersReducedMotion ? 0 : 0.15 }}
                      className="text-[10px] font-mono tracking-[0.12em] whitespace-nowrap select-none"
                      style={{ color: isActive ? "#C9A04A" : "#888" }}
                    >
                      {section.number} / {section.label}
                    </motion.span>
                  )}
                </AnimatePresence>

                {/* Dot */}
                <motion.span
                  animate={{
                    backgroundColor: isActive ? "#C9A04A" : isHovered ? "#555" : "#2a2a2a",
                    width: isActive ? "8px" : "6px",
                    height: isActive ? "8px" : "6px",
                  }}
                  transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
                  className="rounded-full flex-shrink-0 block"
                  style={{ width: "6px", height: "6px" }}
                />
              </button>
            );
          })}
        </motion.nav>
      )}
    </AnimatePresence>
  );
}
