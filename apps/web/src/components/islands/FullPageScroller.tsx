import { useEffect, useRef, useCallback } from "react";

/**
 * FullPageScroller — slide-based section navigation.
 *
 * Wheel events are intercepted (preventDefault) so the browser never performs
 * its own inertial scroll. Section changes are animated via a custom rAF loop
 * that drives scrollTop directly — no overshoot, no snap interference.
 *
 * Cinematic transforms (scale + blur + opacity, NO translateY) are driven by
 * the scroll events that fire during the rAF animation.
 */
export default function FullPageScroller() {
  const currentRef = useRef(0);
  const lockedRef  = useRef(false);
  const animIdRef  = useRef(0);

  const getSections = useCallback((): HTMLElement[] => {
    const scroller = document.querySelector(".full-page-scroller");
    if (!scroller) return [];
    return Array.from(scroller.querySelectorAll<HTMLElement>(".full-page-section"));
  }, []);

  // ── Custom rAF scroll animation (ease-out cubic, no browser inertia) ──────
  const animateTo = useCallback((container: HTMLElement, target: number) => {
    cancelAnimationFrame(animIdRef.current);
    const start     = container.scrollTop;
    const delta     = target - start;
    if (Math.abs(delta) < 2) { container.scrollTop = target; return; }
    const duration  = 700;
    const startTime = performance.now();

    // Temporarily disable scroll-snap so it doesn't fight the animation
    container.style.scrollSnapType = "none";

    function step(now: number) {
      const elapsed = Math.min(now - startTime, duration);
      const p       = elapsed / duration;
      // Ease in-out cubic
      const eased   = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
      container.scrollTop = start + delta * eased;

      if (elapsed < duration) {
        animIdRef.current = requestAnimationFrame(step);
      } else {
        container.scrollTop = target;
        // Restore scroll-snap after animation settles
        requestAnimationFrame(() => {
          container.style.scrollSnapType = "";
          lockedRef.current = false;
        });
      }
    }

    animIdRef.current = requestAnimationFrame(step);
  }, []);

  const scrollToSection = useCallback((index: number) => {
    const scroller  = document.querySelector<HTMLElement>(".full-page-scroller");
    const sections  = getSections();
    if (!scroller || index < 0 || index >= sections.length) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    currentRef.current   = index;

    if (prefersReduced) {
      scroller.scrollTop    = index * window.innerHeight;
      lockedRef.current     = false;
    } else {
      animateTo(scroller, index * window.innerHeight);
    }
  }, [getSections, animateTo]);

  // ── Track current section via IntersectionObserver ────────────────────────
  useEffect(() => {
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

  // ── Keyboard navigation ────────────────────────────────────────────────────
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      const sections = getSections();
      if (e.key === "ArrowDown" || e.key === "PageDown") {
        e.preventDefault();
        if (lockedRef.current) return;
        lockedRef.current = true;
        scrollToSection(Math.min(currentRef.current + 1, sections.length - 1));
      } else if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        if (lockedRef.current) return;
        lockedRef.current = true;
        scrollToSection(Math.max(currentRef.current - 1, 0));
      } else if (e.key === "Home") {
        e.preventDefault();
        lockedRef.current = true;
        scrollToSection(0);
      } else if (e.key === "End") {
        e.preventDefault();
        lockedRef.current = true;
        scrollToSection(sections.length - 1);
      }
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [getSections, scrollToSection]);

  // ── Wheel interception — one gesture = one section, zero inertia ──────────
  useEffect(() => {
    const scroller = document.querySelector<HTMLElement>(".full-page-scroller");
    if (!scroller) return;
    const sections = getSections();
    if (sections.length === 0) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault(); // block native scroll entirely

      if (lockedRef.current) return;

      const dir  = e.deltaY > 0 ? 1 : -1;
      const next = Math.max(0, Math.min(currentRef.current + dir, sections.length - 1));
      if (next === currentRef.current) return;

      lockedRef.current = true;
      scrollToSection(next);
      // lockedRef is released by animateTo's completion callback
    };

    scroller.addEventListener("wheel", onWheel, { passive: false });
    return () => scroller.removeEventListener("wheel", onWheel);
  }, [getSections, scrollToSection]);

  // ── Touch swipe support ────────────────────────────────────────────────────
  useEffect(() => {
    const scroller = document.querySelector<HTMLElement>(".full-page-scroller");
    if (!scroller) return;
    const sections = getSections();
    if (sections.length === 0) return;

    let startY = 0;

    const onTouchStart = (e: TouchEvent) => { startY = e.touches[0].clientY; };
    const onTouchEnd   = (e: TouchEvent) => {
      const dy = startY - e.changedTouches[0].clientY;
      if (Math.abs(dy) < 60 || lockedRef.current) return;
      const dir  = dy > 0 ? 1 : -1;
      const next = Math.max(0, Math.min(currentRef.current + dir, sections.length - 1));
      if (next === currentRef.current) return;
      lockedRef.current = true;
      scrollToSection(next);
    };

    scroller.addEventListener("touchstart", onTouchStart, { passive: true });
    scroller.addEventListener("touchend",   onTouchEnd,   { passive: true });
    return () => {
      scroller.removeEventListener("touchstart", onTouchStart);
      scroller.removeEventListener("touchend",   onTouchEnd);
    };
  }, [getSections, scrollToSection]);

  // ── Cinematic transforms — scale + blur + opacity (NO translateY) ─────────
  useEffect(() => {
    const scroller = document.querySelector<HTMLElement>(".full-page-scroller");
    if (!scroller) return;
    const sections = getSections();
    if (sections.length === 0) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const onScroll = () => {
      const vh        = window.innerHeight;
      const scrollTop = scroller.scrollTop;

      sections.forEach((el, i) => {
        const progress = (scrollTop - i * vh) / vh; // –1 (below) → 0 (visible) → 1 (above)
        if (progress < -1 || progress > 1) return;

        const outProgress = Math.max(0, progress);
        const inProgress  = Math.max(0, -progress);

        if (prefersReduced) {
          el.style.opacity = String(1 - outProgress * 0.3);
          return;
        }

        const p       = progress >= 0 ? outProgress : inProgress;
        const scale   = 1 - p * 0.03;
        const blur    = p * 3;
        const opacity = 1 - p * 0.25;

        el.style.transform = `scale(${scale})`;
        el.style.filter    = blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : "";
        el.style.opacity   = String(opacity);
      });
    };

    scroller.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      scroller.removeEventListener("scroll", onScroll);
      sections.forEach((el) => {
        el.style.transform = "";
        el.style.filter    = "";
        el.style.opacity   = "";
      });
    };
  }, [getSections]);

  return null;
}
