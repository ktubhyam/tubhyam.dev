/**
 * SideNav — Right-side vertical navigation for the home page.
 * Terminal-style section tracker with line numbers and > prompt.
 * Respects prefers-reduced-motion by reducing/disabling animations.
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";

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

interface Section {
  id: string;
  label: string;
}

const SECTIONS: Section[] = [
  { id: "research", label: "research" },
  { id: "build", label: "build" },
  { id: "simulate", label: "simulate" },
  { id: "stack", label: "stack" },
  { id: "contact", label: "contact" },
];

export default function SideNav() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [active, setActive] = useState("");
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const ratiosRef = useRef<Record<string, number>>({});

  useEffect(() => {
    if (prefersReducedMotion) {
      setVisible(true);
      return;
    }
    const timer = setTimeout(() => setVisible(true), 1500);
    return () => clearTimeout(timer);
  }, [prefersReducedMotion]);

  useEffect(() => {
    const elements = document.querySelectorAll<HTMLElement>("[data-nav-section]");
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = (entry.target as HTMLElement).dataset.navSection;
          if (id) {
            ratiosRef.current[id] = entry.intersectionRatio;
          }
        });

        let maxRatio = 0;
        let maxId = "";
        for (const [id, ratio] of Object.entries(ratiosRef.current)) {
          if (ratio > maxRatio) {
            maxRatio = ratio;
            maxId = id;
          }
        }
        if (maxId && maxRatio > 0) {
          setActive(maxId);
        }
      },
      {
        threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
      }
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

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
  }, [prefersReducedMotion]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.nav
          initial={prefersReducedMotion ? false : { opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="hidden md:flex fixed right-6 top-1/2 -translate-y-1/2 z-50 flex-col items-center"
          aria-label="Section navigation"
        >
          <div className="side-nav-pill flex flex-col items-start gap-3 px-3 py-4">
            {/* Logo — scroll to top */}
            <button
              onClick={scrollToTop}
              className="flex items-center gap-1.5 mb-1 group cursor-pointer w-full"
              aria-label="Scroll to top"
            >
              <span className="text-[10px] font-mono font-medium text-[#C9A04A] tracking-tight transition-all duration-300 group-hover:drop-shadow-[0_0_6px_rgba(201,160,74,0.5)]">
                t.dev
              </span>
            </button>

            {/* Divider */}
            <div className="w-full h-px bg-[#1a1a1a]" />

            {/* Section items */}
            {SECTIONS.map((section, index) => {
              const isActive = active === section.id;
              const isHovered = hovered === section.id;

              return (
                <button
                  key={section.id}
                  onClick={() => scrollTo(section.id)}
                  onMouseEnter={() => setHovered(section.id)}
                  onMouseLeave={() => setHovered(null)}
                  className="flex items-center gap-1.5 group cursor-pointer w-full"
                  aria-label={`Go to ${section.label}`}
                  aria-current={isActive ? "true" : undefined}
                >
                  {/* Line number */}
                  <span className="text-[9px] font-mono text-[#333] w-3 text-right select-none flex-shrink-0">
                    {index + 1}
                  </span>

                  {/* Prompt indicator */}
                  <motion.span
                    className="text-[10px] font-mono w-2 flex-shrink-0"
                    animate={{
                      color: isActive ? "#C9A04A" : "transparent",
                      opacity: isActive ? 1 : 0,
                    }}
                    transition={{ duration: prefersReducedMotion ? 0 : 0.15 }}
                  >
                    {">"}
                  </motion.span>

                  {/* Label */}
                  <motion.span
                    className="text-[10px] font-mono tracking-[0.08em] whitespace-nowrap select-none"
                    animate={{
                      color: isActive ? "#C9A04A" : isHovered ? "#888" : "#555",
                    }}
                    transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
                  >
                    {section.label}
                  </motion.span>
                </button>
              );
            })}

            {/* Divider */}
            <div className="w-full h-px bg-[#1a1a1a]" />

            {/* Site links */}
            {[
              { href: "/research", label: "papers" },
              { href: "/projects", label: "projects" },
              { href: "/blog", label: "blog" },
            ].map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="flex items-center gap-1.5 group w-full"
              >
                <span className="text-[9px] font-mono text-[#333] w-3 text-right select-none flex-shrink-0">
                  ~
                </span>
                <span className="text-[10px] font-mono tracking-[0.08em] whitespace-nowrap select-none text-[#444] group-hover:text-[#888] transition-colors duration-200 ml-2">
                  {link.label}
                </span>
              </a>
            ))}
          </div>
        </motion.nav>
      )}
    </AnimatePresence>
  );
}
