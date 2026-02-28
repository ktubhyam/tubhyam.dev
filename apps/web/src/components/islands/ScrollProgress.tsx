import { useEffect, useRef } from "react";

export default function ScrollProgress() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;

    function update() {
      const scrollEl = document.querySelector(".full-page-scroller") as HTMLElement | null;
      const el = scrollEl ?? document.documentElement;
      const scrollTop = el.scrollTop;
      const scrollHeight = el.scrollHeight - el.clientHeight;
      const progress = scrollHeight > 0 ? scrollTop / scrollHeight : 0;
      if (bar) {
        bar.style.transform = `scaleX(${progress})`;
        bar.style.width = "100%";
      }
    }

    const scrollTarget = document.querySelector(".full-page-scroller") ?? window;
    scrollTarget.addEventListener("scroll", update, { passive: true });
    update();
    return () => scrollTarget.removeEventListener("scroll", update);
  }, []);

  return (
    <div
      ref={barRef}
      className="scroll-progress-bar"
      aria-hidden="true"
    />
  );
}
