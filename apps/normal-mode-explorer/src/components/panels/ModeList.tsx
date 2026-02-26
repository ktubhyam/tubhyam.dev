"use client";

import { useRef, useEffect } from "react";
import { useExplorerStore } from "@/lib/store";
import { MOLECULE_SYMMETRY } from "@/lib/constants";
import { TerminalPanel } from "../ui/TerminalPanel";

export function ModeList() {
  const molecule = useExplorerStore((s) => s.molecule);
  const modeA = useExplorerStore((s) => s.modeA);
  const modeB = useExplorerStore((s) => s.modeB);
  const setModeA = useExplorerStore((s) => s.setModeA);
  const setModeB = useExplorerStore((s) => s.setModeB);
  const superpositionEnabled = useExplorerStore((s) => s.superpositionEnabled);
  const superpositionModes = useExplorerStore((s) => s.superpositionModes);
  const toggleSuperpositionMode = useExplorerStore((s) => s.toggleSuperpositionMode);

  const listRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (activeRef.current && listRef.current) {
      activeRef.current.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [modeA]);

  if (!molecule) return null;

  const symmetryData = MOLECULE_SYMMETRY[molecule.name.toLowerCase().replace(/\s+/g, "_")];

  const handleClick = (index: number, e: React.MouseEvent) => {
    if (superpositionEnabled) {
      toggleSuperpositionMode(index);
      return;
    }
    if (e.shiftKey || e.metaKey) {
      setModeB(modeB === index ? null : index);
    } else {
      setModeA(index);
    }
  };

  return (
    <TerminalPanel title="Normal Modes">
      <div className="px-1 py-1">
        <div className="text-[9px] font-mono text-foreground/30 px-2 py-1 flex justify-between">
          <span>
            {superpositionEnabled
              ? `Superposition · ${superpositionModes.size} selected`
              : "Click = A · Shift+Click = B"}
          </span>
          {modeB !== null && !superpositionEnabled && (
            <button
              onClick={() => setModeB(null)}
              className="text-accent/60 hover:text-accent"
              aria-label="Clear mode B"
            >
              Clear B
            </button>
          )}
        </div>
      </div>
      <div ref={listRef} className="max-h-[280px] overflow-y-auto px-1 pb-1">
        {molecule.modes.map((mode, i) => {
          const isA = i === modeA && !superpositionEnabled;
          const isB = i === modeB && !superpositionEnabled;
          const isSuper = superpositionEnabled && superpositionModes.has(i);
          const symLabel = symmetryData?.modeLabels[i] || mode.symmetry || "";
          const irActive = mode.ir_intensity > 0.1;
          const ramanActive = mode.raman_activity > 0.1;

          return (
            <button
              key={i}
              ref={isA ? activeRef : null}
              onClick={(e) => handleClick(i, e)}
              aria-pressed={isA || isB || isSuper}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left transition-colors text-xs font-mono ${
                isSuper
                  ? "bg-success/10 text-success"
                  : isA
                    ? "bg-cyan/10 text-cyan"
                    : isB
                      ? "bg-accent/10 text-accent"
                      : "text-foreground/60 hover:bg-surface-2 hover:text-foreground/80"
              }`}
            >
              {/* Superposition checkbox */}
              {superpositionEnabled && (
                <span className={`w-3 h-3 rounded-sm border flex items-center justify-center text-[8px] ${
                  isSuper ? "border-success bg-success/20 text-success" : "border-border-bright"
                }`}>
                  {isSuper && "✓"}
                </span>
              )}

              {/* Mode index */}
              <span className="w-4 text-right text-foreground/30 text-[10px]">
                {i + 1}
              </span>

              {/* Frequency */}
              <span className="flex-1">{mode.frequency.toFixed(0)} cm⁻¹</span>

              {/* Symmetry label */}
              {symLabel && (
                <span className="text-[10px] text-foreground/40">{symLabel}</span>
              )}

              {/* IR/Raman badges */}
              <div className="flex gap-0.5">
                {irActive && (
                  <span className="text-[8px] px-1 py-px rounded bg-ir/15 text-ir">
                    IR
                  </span>
                )}
                {ramanActive && (
                  <span className="text-[8px] px-1 py-px rounded bg-raman/15 text-raman">
                    R
                  </span>
                )}
              </div>

              {/* A/B indicator */}
              {isA && <span className="text-[9px] font-bold text-cyan">A</span>}
              {isB && <span className="text-[9px] font-bold text-accent">B</span>}
            </button>
          );
        })}
      </div>
    </TerminalPanel>
  );
}
