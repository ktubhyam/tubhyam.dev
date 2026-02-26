"use client";

import { useRef, useEffect } from "react";
import { useVibeStore } from "@/lib/store";

export function ModeSelector() {
  const molecule = useVibeStore((s) => s.molecule);
  const selectedMode = useVibeStore((s) => s.selectedMode);
  const setSelectedMode = useVibeStore((s) => s.setSelectedMode);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Auto-scroll selected mode into view
  useEffect(() => {
    const btn = buttonRefs.current[selectedMode];
    if (btn) {
      btn.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [selectedMode]);

  if (!molecule || !molecule.modes.length) {
    return (
      <div className="px-4 py-8 text-center text-text-muted text-sm">
        No modes available
      </div>
    );
  }

  const maxIR = Math.max(...molecule.modes.map((m) => m.ir_intensity), 1);

  return (
    <div className="px-2 py-2">
      <div className="px-2 mb-2">
        <span className="text-[11px] font-medium text-text-secondary uppercase tracking-wider">
          Normal Modes
        </span>
      </div>
      <div className="space-y-0.5">
        {molecule.modes.map((mode, i) => {
          const isSelected = i === selectedMode;
          const irBar = (mode.ir_intensity / maxIR) * 100;

          return (
            <button
              key={mode.index}
              ref={(el) => {
                buttonRefs.current[i] = el;
              }}
              onClick={() => setSelectedMode(i)}
              className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-left transition-colors ${
                isSelected
                  ? "bg-accent-dim text-accent"
                  : "hover:bg-surface-hover text-text-secondary"
              }`}
            >
              <span className="text-[11px] font-mono w-6 text-right shrink-0 tabular-nums">
                {i + 1}
              </span>
              <span className="text-[12px] font-mono flex-1 tabular-nums">
                {mode.frequency.toFixed(0)} cm⁻¹
              </span>
              {/* IR intensity bar */}
              <div className="w-16 h-1.5 bg-border rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    isSelected ? "bg-accent" : "bg-accent/50"
                  }`}
                  style={{ width: `${irBar}%` }}
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
