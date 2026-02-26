"use client";

import { useExplorerStore } from "@/lib/store";
import { MOLECULE_SYMMETRY } from "@/lib/constants";
import { TerminalPanel } from "../ui/TerminalPanel";

export function SymmetryInfo() {
  const molecule = useExplorerStore((s) => s.molecule);
  const modeA = useExplorerStore((s) => s.modeA);

  if (!molecule) return null;

  const symmetryData = MOLECULE_SYMMETRY[molecule.name.toLowerCase().replace(/\s+/g, "_")];
  const pointGroup = symmetryData?.pointGroup || molecule.pointGroup || "Unknown";
  const modeLabel = symmetryData?.modeLabels[modeA] || molecule.modes[modeA]?.symmetry || "—";

  const totalModes = molecule.modes.length;
  const irCount = molecule.modes.filter((m) => m.ir_intensity > 0.1).length;
  const ramanCount = molecule.modes.filter((m) => m.raman_activity > 0.1).length;
  const silentCount = molecule.modes.filter(
    (m) => m.ir_intensity <= 0.1 && m.raman_activity <= 0.1,
  ).length;

  return (
    <TerminalPanel title="Symmetry">
      <div className="p-3 space-y-2 text-[11px] font-mono">
        <div className="flex items-center justify-between">
          <span className="text-foreground/40">Point Group</span>
          <span className="text-cyan">{pointGroup}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-foreground/40">Irrep (Mode A)</span>
          <span className="text-foreground/70">{modeLabel}</span>
        </div>

        <div className="border-t border-border pt-2 mt-2 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-foreground/40">Total modes</span>
            <span className="text-foreground/60">{totalModes}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-ir/70">IR active</span>
            <span className="text-foreground/60">{irCount}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-raman/70">Raman active</span>
            <span className="text-foreground/60">{ramanCount}</span>
          </div>
          {silentCount > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-foreground/30">Silent</span>
              <span className="text-foreground/60">{silentCount}</span>
            </div>
          )}
        </div>
      </div>
    </TerminalPanel>
  );
}
