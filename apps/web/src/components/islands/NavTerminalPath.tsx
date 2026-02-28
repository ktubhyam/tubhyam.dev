/**
 * NavTerminalPath — Terminal-style section tracker for GlassNav.
 * On pages with full-page sections: tracks current section via IntersectionObserver.
 * On sub-pages: derives path from window.location.pathname.
 * Renders traffic lights + ~/path█ display.
 */
import { useState, useEffect } from "react";

const SECTION_PATH_MAP: Record<string, string> = {
  hero: "~",
  research: "~/research",
  build: "~/build",
  explore: "~/explore",
  writing: "~/writing",
  connect: "~/connect",
};

const PAGE_PATH_MAP: Record<string, string> = {
  "/": "~",
  "/research": "~/research",
  "/projects": "~/projects",
  "/blog": "~/writing",
  "/simulations": "~/explore",
  "/about": "~/about",
};

function getPagePath(): string {
  const pathname = window.location.pathname;
  if (pathname === "/") return "~";
  for (const [route, path] of Object.entries(PAGE_PATH_MAP)) {
    if (route !== "/" && pathname.startsWith(route)) return path;
  }
  const parts = pathname.split("/").filter(Boolean);
  return parts.length ? `~/${parts[0]}` : "~";
}

export default function NavTerminalPath() {
  const [currentPath, setCurrentPath] = useState("~");

  useEffect(() => {
    const sections = Array.from(
      document.querySelectorAll<HTMLElement>("section[data-nav-section]")
    );

    if (sections.length === 0) {
      setCurrentPath(getPagePath());
      return;
    }

    const ratios = new Map<HTMLElement, number>();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          ratios.set(entry.target as HTMLElement, entry.intersectionRatio);
        });
        let maxRatio = 0;
        let best: HTMLElement | null = null;
        ratios.forEach((ratio, el) => {
          if (ratio > maxRatio) {
            maxRatio = ratio;
            best = el;
          }
        });
        if (best && maxRatio > 0) {
          const slug = (best as HTMLElement).dataset.navSection ?? "hero";
          setCurrentPath(SECTION_PATH_MAP[slug] ?? `~/${slug}`);
        }
      },
      { threshold: 0.4 }
    );

    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="flex items-center gap-2">
      {/* Traffic lights */}
      <div className="flex items-center gap-[5px]">
        <div className="w-[10px] h-[10px] rounded-full bg-[#FF5F57]" />
        <div className="w-[10px] h-[10px] rounded-full bg-[#FEBC2E]" />
        <div className="w-[10px] h-[10px] rounded-full bg-[#28C840]" />
      </div>
      {/* Path + blinking cursor — hidden on mobile */}
      <span className="hidden md:inline-flex items-center text-[11px] font-mono tracking-tight select-none" style={{ color: "rgba(85,85,85,0.7)" }}>
        {currentPath}
        <span className="animate-blink ml-px">█</span>
      </span>
    </div>
  );
}
