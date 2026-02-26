"use client";

import { useExplorerStore } from "@/lib/store";
import { TerminalPanel } from "../ui/TerminalPanel";

export function DisplacementTable() {
  const molecule = useExplorerStore((s) => s.molecule);
  const modeA = useExplorerStore((s) => s.modeA);

  if (!molecule) return null;

  const mode = molecule.modes[modeA];
  if (!mode) return null;

  return (
    <TerminalPanel title="Displacement Vectors">
      <div className="p-2 overflow-x-auto">
        <table className="w-full text-[10px] font-mono">
          <thead>
            <tr className="text-foreground/30 border-b border-border">
              <th className="text-left py-1 px-1">#</th>
              <th className="text-left py-1 px-1">Atom</th>
              <th className="text-right py-1 px-1">dx</th>
              <th className="text-right py-1 px-1">dy</th>
              <th className="text-right py-1 px-1">dz</th>
              <th className="text-right py-1 px-1">|d|</th>
            </tr>
          </thead>
          <tbody>
            {molecule.atoms.map((atom, i) => {
              const d = mode.displacements[i];
              const mag = Math.sqrt(d[0] ** 2 + d[1] ** 2 + d[2] ** 2);
              const maxMag = Math.max(
                ...mode.displacements.map((dd) =>
                  Math.sqrt(dd[0] ** 2 + dd[1] ** 2 + dd[2] ** 2),
                ),
              );
              const relMag = maxMag > 0 ? mag / maxMag : 0;

              return (
                <tr
                  key={i}
                  className="border-b border-border/30 hover:bg-surface-2/50"
                >
                  <td className="py-1 px-1 text-foreground/25">{i + 1}</td>
                  <td className="py-1 px-1 text-foreground/70">{atom.element}</td>
                  <td className="py-1 px-1 text-right text-cyan/70">
                    {d[0].toFixed(4)}
                  </td>
                  <td className="py-1 px-1 text-right text-cyan/70">
                    {d[1].toFixed(4)}
                  </td>
                  <td className="py-1 px-1 text-right text-cyan/70">
                    {d[2].toFixed(4)}
                  </td>
                  <td className="py-1 px-1 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <div
                        className="h-1 rounded-full bg-cyan/40"
                        style={{ width: `${relMag * 30}px` }}
                      />
                      <span className="text-foreground/50">{mag.toFixed(4)}</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </TerminalPanel>
  );
}
