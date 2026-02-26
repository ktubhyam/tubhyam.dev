"use client";

import { useExplorerStore } from "@/lib/store";
import { MOLECULE_SYMMETRY } from "@/lib/constants";

/** Compact mode info + prev/next navigation shown above the canvas on mobile */
export function MobileModeStrip() {
  const molecule = useExplorerStore((s) => s.molecule);
  const modeA = useExplorerStore((s) => s.modeA);
  const setModeA = useExplorerStore((s) => s.setModeA);
  const isPlaying = useExplorerStore((s) => s.isPlaying);
  const togglePlaying = useExplorerStore((s) => s.togglePlaying);

  if (!molecule) return null;

  const mode = molecule.modes[modeA];
  if (!mode) return null;

  const maxMode = molecule.modes.length - 1;
  const symmetryData = MOLECULE_SYMMETRY[molecule.name.toLowerCase().replace(/\s+/g, "_")];
  const symmetryLabel = symmetryData?.modeLabels[modeA] || mode.symmetry || "";
  const modeDesc = symmetryData?.modeDescriptions?.[modeA] || "";
  const pointGroup = symmetryData?.pointGroup || molecule.pointGroup || "";

  const irActive = mode.ir_intensity > 0.1;
  const ramanActive = mode.raman_activity > 0.1;

  return (
    <div className="lg:hidden flex items-center gap-1.5 px-2 py-1.5 border-b border-border bg-surface/80 backdrop-blur-sm">
      {/* Prev */}
      <button
        onClick={() => setModeA(Math.max(0, modeA - 1))}
        disabled={modeA === 0}
        aria-label="Previous mode"
        className="w-9 h-9 flex items-center justify-center rounded bg-surface-2 border border-border text-foreground/50 disabled:opacity-20"
      >
        <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
          <path d="M8 2L4 6L8 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      {/* Mode info */}
      <div className="flex-1 flex items-center justify-center gap-2 min-w-0">
        <span className="text-[10px] font-mono text-cyan font-bold">
          {modeA + 1}/{molecule.modes.length}
        </span>
        <span className="text-xs font-mono text-foreground font-medium">
          {mode.frequency.toFixed(0)} cm⁻¹
        </span>
        {symmetryLabel && (
          <span className="text-[10px] font-mono text-foreground/50">{symmetryLabel}</span>
        )}
        {modeDesc && (
          <span className="text-[10px] font-mono text-foreground/50 truncate max-w-[100px]">{modeDesc}</span>
        )}
        <div className="flex gap-0.5">
          {irActive && (
            <span className="text-[7px] px-1 py-px rounded bg-ir/15 text-ir">IR</span>
          )}
          {ramanActive && (
            <span className="text-[7px] px-1 py-px rounded bg-raman/15 text-raman">R</span>
          )}
        </div>
      </div>

      {/* Play/Pause */}
      <button
        onClick={togglePlaying}
        aria-label={isPlaying ? "Pause animation" : "Play animation"}
        className="w-9 h-9 flex items-center justify-center rounded bg-surface-2 border border-border text-foreground/50"
      >
        {isPlaying ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5,3 19,12 5,21" />
          </svg>
        )}
      </button>

      {/* Next */}
      <button
        onClick={() => setModeA(Math.min(maxMode, modeA + 1))}
        disabled={modeA === maxMode}
        aria-label="Next mode"
        className="w-9 h-9 flex items-center justify-center rounded bg-surface-2 border border-border text-foreground/50 disabled:opacity-20"
      >
        <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
          <path d="M4 2L8 6L4 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}
