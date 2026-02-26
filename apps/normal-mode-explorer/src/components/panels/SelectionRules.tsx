"use client";

import { useMemo } from "react";
import { useExplorerStore } from "@/lib/store";
import { TerminalPanel } from "../ui/TerminalPanel";

export function SelectionRules() {
  const molecule = useExplorerStore((s) => s.molecule);
  const modeA = useExplorerStore((s) => s.modeA);
  const modeB = useExplorerStore((s) => s.modeB);

  const { maxIR, maxRaman } = useMemo(() => {
    if (!molecule) return { maxIR: 1, maxRaman: 1 };
    return {
      maxIR: Math.max(...molecule.modes.map((m) => m.ir_intensity), 1),
      maxRaman: Math.max(...molecule.modes.map((m) => m.raman_activity), 1),
    };
  }, [molecule]);

  if (!molecule) return null;

  const modes = [
    { label: "A", index: modeA, color: "#00D8FF" },
    ...(modeB !== null ? [{ label: "B", index: modeB, color: "#C9A04A" }] : []),
  ];

  return (
    <TerminalPanel title="Selection Rules">
      <div className="p-3 space-y-3">
        {modes.map(({ label, index, color }) => {
          const mode = molecule.modes[index];
          if (!mode) return null;

          const irActive = mode.ir_intensity > 0.1;
          const ramanActive = mode.raman_activity > 0.1;
          const irPct = (mode.ir_intensity / maxIR) * 100;
          const ramanPct = (mode.raman_activity / maxRaman) * 100;

          return (
            <div key={label} className="space-y-2">
              <div className="flex items-center gap-1.5">
                <span
                  className="text-[10px] font-mono font-bold px-1 py-px rounded"
                  style={{ background: `${color}22`, color }}
                >
                  {label}
                </span>
                <span className="text-[11px] font-mono text-foreground/60">
                  ν = {mode.frequency.toFixed(0)} cm⁻¹
                </span>
              </div>

              <div className="space-y-0.5">
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className={irActive ? "text-ir" : "text-foreground/30"}>
                    IR {irActive ? "Active" : "Inactive"}
                  </span>
                  <span className="text-foreground/30">
                    {mode.ir_intensity.toFixed(2)}
                  </span>
                </div>
                <div className="h-1 bg-surface-2 rounded-full overflow-hidden" role="progressbar" aria-valuenow={irPct} aria-label={`IR intensity ${mode.ir_intensity.toFixed(2)}`}>
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.max(irPct, 1)}%`,
                      background: irActive ? "var(--ir-color)" : "var(--border-bright)",
                    }}
                  />
                </div>
              </div>

              <div className="space-y-0.5">
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className={ramanActive ? "text-raman" : "text-foreground/30"}>
                    Raman {ramanActive ? "Active" : "Inactive"}
                  </span>
                  <span className="text-foreground/30">
                    {mode.raman_activity.toFixed(2)}
                  </span>
                </div>
                <div className="h-1 bg-surface-2 rounded-full overflow-hidden" role="progressbar" aria-valuenow={ramanPct} aria-label={`Raman activity ${mode.raman_activity.toFixed(2)}`}>
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.max(ramanPct, 1)}%`,
                      background: ramanActive ? "var(--raman-color)" : "var(--border-bright)",
                    }}
                  />
                </div>
              </div>

              <p className="text-[9px] font-mono text-foreground/25 leading-relaxed">
                {irActive && "Requires change in dipole moment. "}
                {ramanActive && "Requires change in polarizability. "}
                {!irActive && !ramanActive && "Silent — no dipole or polarizability change."}
              </p>
            </div>
          );
        })}
      </div>
    </TerminalPanel>
  );
}
