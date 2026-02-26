"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { ControlPanel } from "@/components/controls/ControlPanel";
import { SpectrumPanel } from "@/components/spectrum/SpectrumPanel";
import { useKeyboardShortcuts } from "@/lib/hooks";

const MoleculeScene = dynamic(
  () => import("@/components/scene/MoleculeScene"),
  { ssr: false },
);

function KeyboardHint() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={`absolute bottom-3 left-3 z-10 transition-opacity duration-1000 hover:opacity-100 ${
        visible ? "opacity-60" : "opacity-0 pointer-events-none"
      }`}
    >
      <div className="bg-surface/80 backdrop-blur-sm border border-border rounded-lg px-3 py-1.5 text-[10px] font-mono text-text-muted">
        Space: play/pause · ↑↓: switch modes · Drag: rotate
      </div>
    </div>
  );
}

export default function Home() {
  useKeyboardShortcuts();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {/* Main area: 3D viewer + spectrum */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* 3D viewer */}
        <div className="flex-1 relative">
          <MoleculeScene />
          <KeyboardHint />

          {/* Sidebar toggle button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`absolute top-3 right-3 z-10 bg-surface/80 backdrop-blur-sm border border-border rounded-lg px-2.5 py-1.5 text-[11px] font-mono text-text-muted hover:text-text hover:border-border-hover transition-all ${
              sidebarOpen ? "max-md:hidden" : ""
            }`}
          >
            {sidebarOpen ? "← Hide" : "Controls →"}
          </button>
        </div>

        {/* Gradient separator */}
        <div className="h-px shrink-0 bg-linear-to-r from-transparent via-accent/30 to-transparent" />

        {/* Spectrum chart */}
        <div className="h-[200px] bg-bg-secondary shrink-0">
          <SpectrumPanel />
        </div>
      </div>

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Right sidebar */}
      <div
        className={`shrink-0 border-l border-border bg-surface overflow-y-auto transition-[width] duration-200 ${
          sidebarOpen
            ? "w-80 max-md:fixed max-md:right-0 max-md:top-0 max-md:bottom-0 max-md:z-30 max-md:shadow-2xl max-md:border-l-0"
            : "w-0 overflow-hidden border-l-0"
        }`}
      >
        <div className="w-80 h-full">
          {/* Close button on mobile */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="absolute top-2.5 right-2.5 z-10 w-7 h-7 flex items-center justify-center rounded-md text-text-muted hover:text-text hover:bg-surface-hover transition-colors md:hidden"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 3L11 11M3 11L11 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
          <ControlPanel />
        </div>
      </div>
    </div>
  );
}
