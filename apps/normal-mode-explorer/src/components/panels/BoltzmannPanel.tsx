"use client";

import { useMemo } from "react";
import { useExplorerStore } from "@/lib/store";
import { TerminalPanel } from "../ui/TerminalPanel";

const K_B = 0.695034; // Boltzmann constant in cm⁻¹/K
const H_PLANCK = 1; // We work in cm⁻¹ units, so hν = frequency in cm⁻¹

export function BoltzmannPanel() {
  const molecule = useExplorerStore((s) => s.molecule);
  const temperature = useExplorerStore((s) => s.temperature);
  const setTemperature = useExplorerStore((s) => s.setTemperature);
  const modeA = useExplorerStore((s) => s.modeA);

  const populations = useMemo(() => {
    if (!molecule) return [];

    const kT = K_B * temperature;
    if (kT <= 0) return molecule.modes.map(() => 0);

    // Boltzmann factors: exp(-hν / kT)
    const factors = molecule.modes.map((mode) =>
      Math.exp(-mode.frequency / kT),
    );
    const partitionFn = factors.reduce((sum, f) => sum + f, 0);

    return factors.map((f) => f / partitionFn);
  }, [molecule, temperature]);

  if (!molecule) return null;

  const maxPop = Math.max(...populations, 1e-10);

  // Zero-point energy: (1/2) Σ hν_i
  const zpe = molecule.modes.reduce((sum, mode) => sum + mode.frequency, 0) * 0.5;

  // Average thermal energy
  const avgEnergy = populations.reduce(
    (sum, p, i) => sum + p * molecule.modes[i].frequency,
    0,
  );

  return (
    <TerminalPanel title="Thermal Population">
      <div className="p-3 space-y-3">
        {/* Temperature slider */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px] font-mono">
            <span className="text-foreground/40">Temperature</span>
            <span className="text-foreground/60">{temperature} K</span>
          </div>
          <input
            type="range"
            min={10}
            max={3000}
            step={10}
            value={temperature}
            onChange={(e) => setTemperature(parseInt(e.target.value))}
            aria-label="Temperature"
          />
          <div className="flex justify-between text-[8px] font-mono text-foreground/20">
            <span>10 K</span>
            <span>300 K</span>
            <span>3000 K</span>
          </div>
        </div>

        {/* Population bars */}
        <div className="space-y-1">
          {molecule.modes.map((mode, i) => {
            const pop = populations[i] || 0;
            const isSelected = i === modeA;
            const barW = (pop / maxPop) * 100;

            return (
              <div key={i} className="flex items-center gap-1.5 text-[9px] font-mono">
                <span className="w-8 text-right text-foreground/25">
                  ν{i + 1}
                </span>
                <div className="flex-1 h-2.5 bg-surface-2 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.max(barW, 0.5)}%`,
                      background: isSelected
                        ? "var(--cyan)"
                        : `color-mix(in srgb, var(--accent) ${Math.min(pop * 500, 100)}%, var(--border-bright))`,
                    }}
                  />
                </div>
                <span className="w-10 text-right text-foreground/30">
                  {(pop * 100).toFixed(1)}%
                </span>
              </div>
            );
          })}
        </div>

        {/* Stats */}
        <div className="border-t border-border pt-2 space-y-1 text-[10px] font-mono">
          <div className="flex justify-between">
            <span className="text-foreground/40">Zero-point energy</span>
            <span className="text-foreground/60">{zpe.toFixed(0)} cm⁻¹</span>
          </div>
          <div className="flex justify-between">
            <span className="text-foreground/40">⟨E⟩ thermal</span>
            <span className="text-foreground/60">{avgEnergy.toFixed(0)} cm⁻¹</span>
          </div>
        </div>
      </div>
    </TerminalPanel>
  );
}
