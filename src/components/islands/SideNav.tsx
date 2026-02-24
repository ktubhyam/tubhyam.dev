/**
 * SideNav — Right-side vertical navigation for the home page.
 * Tracks scroll position via IntersectionObserver and highlights the active section.
 * Desktop: glass pill with dots + labels. Mobile: minimal dots only.
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";

interface Section {
  id: string;
  label: string;
}

const SECTIONS: Section[] = [
  { id: "research", label: "Research" },
  { id: "build", label: "Build" },
  { id: "simulate", label: "Simulate" },
  { id: "stack", label: "Stack" },
  { id: "contact", label: "Contact" },
];

export default function SideNav() {
  const [active, setActive] = useState("");
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const ratiosRef = useRef<Record<string, number>>({});

  // Delay entry animation
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  // IntersectionObserver to track which section is most visible
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

        // Find the section with the highest intersection ratio
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
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.nav
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="fixed right-4 md:right-6 top-1/2 -translate-y-1/2 z-50 flex flex-col items-center"
          aria-label="Section navigation"
        >
          <div className="side-nav-pill flex flex-col items-center gap-4 md:gap-5 px-2 md:px-3 py-4 md:py-5">
            {/* Logo — scroll to top */}
            <button
              onClick={scrollToTop}
              className="flex items-center gap-1 mb-1 group cursor-pointer"
              aria-label="Scroll to top"
            >
              <span className="text-[11px] font-bold tracking-[-0.02em] text-[#C9A04A] transition-all duration-300 group-hover:drop-shadow-[0_0_6px_rgba(201,160,74,0.5)]"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                TK
              </span>
              <span className="w-[4px] h-[4px] rounded-full bg-[#C9A04A] animate-[dot-color_10s_ease-in-out_infinite]" />
            </button>

            {/* Divider */}
            <div className="w-4 h-px bg-white/[0.06]" />

            {/* Section items */}
            {SECTIONS.map((section) => {
              const isActive = active === section.id;
              const isHovered = hovered === section.id;

              return (
                <button
                  key={section.id}
                  onClick={() => scrollTo(section.id)}
                  onMouseEnter={() => setHovered(section.id)}
                  onMouseLeave={() => setHovered(null)}
                  className="flex items-center gap-2.5 group cursor-pointer relative"
                  aria-label={`Go to ${section.label}`}
                  aria-current={isActive ? "true" : undefined}
                >
                  {/* Dot */}
                  <motion.div
                    className="rounded-full flex-shrink-0"
                    animate={{
                      width: isActive ? 7 : 5,
                      height: isActive ? 7 : 5,
                      backgroundColor: isActive ? "#C9A04A" : isHovered ? "#666" : "#333",
                      boxShadow: isActive
                        ? "0 0 8px rgba(201, 160, 74, 0.5)"
                        : "none",
                    }}
                    transition={{ duration: 0.2 }}
                  />

                  {/* Label (hidden on mobile) */}
                  <motion.span
                    className="hidden md:block text-[10px] font-mono uppercase tracking-[0.12em] whitespace-nowrap select-none"
                    animate={{
                      color: isActive ? "#C9A04A" : isHovered ? "#666" : "#444",
                      opacity: isActive ? 1 : isHovered ? 0.8 : 0.5,
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    {section.label}
                  </motion.span>
                </button>
              );
            })}

            {/* Divider */}
            <div className="w-4 h-px bg-white/[0.06]" />

            {/* Site links (hidden on mobile) */}
            {[
              { href: "/research", label: "Papers" },
              { href: "/projects", label: "Projects" },
              { href: "/blog", label: "Blog" },
            ].map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="hidden md:flex items-center gap-2.5 group"
              >
                <svg viewBox="0 0 24 24" className="w-[5px] h-[5px] flex-shrink-0 text-[#333] group-hover:text-[#666] transition-colors" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M7 17L17 7M17 7H7M17 7v10" />
                </svg>
                <span className="text-[10px] font-mono uppercase tracking-[0.12em] whitespace-nowrap select-none text-[#444] opacity-50 group-hover:text-[#666] group-hover:opacity-80 transition-all duration-200">
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
