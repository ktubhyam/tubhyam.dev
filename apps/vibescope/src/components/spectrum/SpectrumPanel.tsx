"use client";

import { useVibeStore } from "@/lib/store";
import { SpectrumChart } from "./SpectrumChart";

export function SpectrumPanel() {
  const molecule = useVibeStore((s) => s.molecule);
  const spectrumType = useVibeStore((s) => s.spectrumType);
  const setSpectrumType = useVibeStore((s) => s.setSpectrumType);

  if (!molecule) {
    return (
      <div className="flex items-center justify-center h-full text-text-muted text-sm">
        Select a molecule to view its spectrum
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-1.5 border-b border-border">
        <span className="text-[11px] font-medium text-text-secondary uppercase tracking-wider">
          Spectrum
        </span>
        <div className="flex gap-1">
          <button
            onClick={() => setSpectrumType("ir")}
            className={`px-2.5 py-0.5 rounded text-[11px] font-mono transition-colors ${
              spectrumType === "ir"
                ? "bg-accent-dim text-accent"
                : "text-text-muted hover:text-text-secondary"
            }`}
          >
            IR
          </button>
          <button
            onClick={() => setSpectrumType("raman")}
            className={`px-2.5 py-0.5 rounded text-[11px] font-mono transition-colors ${
              spectrumType === "raman"
                ? "bg-accent-dim text-accent"
                : "text-text-muted hover:text-text-secondary"
            }`}
          >
            Raman
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 px-2 py-1">
        <SpectrumChart molecule={molecule} type={spectrumType} />
      </div>
    </div>
  );
}
