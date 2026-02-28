import { useEffect, useRef, useCallback } from "react";

/**
 * FullPageScroller — manages keyboard navigation (↑↓) between
 * .full-page-section elements within .full-page-scroller.
 * Does NOT render any DOM; purely a side-effect island.
 */
export default function FullPageScroller() {
  const currentRef = useRef(0);

  const getSections = useCallback((): HTMLElement[] => {
    const scroller = document.querySelector(".full-page-scroller");
    if (!scroller) return [];
    return Array.from(scroller.querySelectorAll<HTMLElement>(".full-page-section"));
  }, []);

  const scrollToSection = useCallback((index: number) => {
    const sections = getSections();
    if (index < 0 || index >= sections.length) return;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    sections[index].scrollIntoView({
      behavior: prefersReduced ? "auto" : "smooth",
      block: "start",
    });
    currentRef.current = index;
  }, [getSections]);

  useEffect(() => {
    // Track current section via IntersectionObserver
    const sections = getSections();
    if (sections.length === 0) return;

    const ratios: number[] = new Array(sections.length).fill(0);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const idx = sections.indexOf(entry.target as HTMLElement);
          if (idx !== -1) ratios[idx] = entry.intersectionRatio;
        });
        const maxIdx = ratios.indexOf(Math.max(...ratios));
        if (ratios[maxIdx] > 0) currentRef.current = maxIdx;
      },
      { threshold: [0, 0.1, 0.3, 0.5, 0.8, 1.0] }
    );

    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [getSections]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      const sections = getSections();
      if (e.key === "ArrowDown" || e.key === "PageDown") {
        e.preventDefault();
        scrollToSection(Math.min(currentRef.current + 1, sections.length - 1));
      } else if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        scrollToSection(Math.max(currentRef.current - 1, 0));
      } else if (e.key === "Home") {
        e.preventDefault();
        scrollToSection(0);
      } else if (e.key === "End") {
        e.preventDefault();
        scrollToSection(sections.length - 1);
      }
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [getSections, scrollToSection]);

  return null;
}
