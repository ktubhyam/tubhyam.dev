"use client";

import { useVibeStore } from "@/lib/store";
import { MoleculePicker } from "./MoleculePicker";
import { ModeSelector } from "./ModeSelector";
import { AnimationControls } from "./AnimationControls";

function SelectedModeInfo() {
  const molecule = useVibeStore((s) => s.molecule);
  const selectedMode = useVibeStore((s) => s.selectedMode);

  if (!molecule || !molecule.modes.length) return null;

  const mode = molecule.modes[selectedMode];
  if (!mode) return null;

  return (
    <div className="px-4 py-3 border-b border-border">
      <div className="rounded-lg bg-accent-dim/50 border border-accent/20 px-3 py-2.5">
        <div className="flex items-baseline justify-between">
          <span className="text-[11px] font-medium text-text-secondary uppercase tracking-wider">
            Mode {selectedMode + 1}
          </span>
          <span className="text-[11px] font-mono text-text-muted">
            {mode.symmetry || `${molecule.modes.length} total`}
          </span>
        </div>
        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="text-lg font-semibold text-accent tabular-nums">
            {mode.frequency.toFixed(1)}
          </span>
          <span className="text-[11px] font-mono text-accent/70">cm⁻¹</span>
        </div>
        <div className="mt-1.5 flex gap-4 text-[10px] font-mono text-text-muted">
          <span>IR: {mode.ir_intensity.toFixed(2)}</span>
          <span>Raman: {mode.raman_activity.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}

export function ControlPanel() {
  const molecule = useVibeStore((s) => s.molecule);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <h1 className="text-sm font-semibold tracking-tight">VibeScope</h1>
        </div>
        <p className="text-[11px] text-text-muted mt-0.5">
          3D Molecular Vibration Visualizer
        </p>
      </div>

      {/* Molecule picker */}
      <div className="px-4 py-3 border-b border-border">
        <MoleculePicker />
      </div>

      {/* Molecule info */}
      {molecule && (
        <div className="px-4 py-2.5 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium capitalize">{molecule.name}</span>
            <span className="text-[11px] font-mono text-text-muted bg-bg-secondary px-1.5 py-0.5 rounded">
              {molecule.formula}
            </span>
          </div>
          <div className="text-[11px] text-text-muted mt-1 font-mono">
            {molecule.atomCount} atoms · {molecule.modes.length} modes
          </div>
        </div>
      )}

      {/* Selected mode info */}
      <SelectedModeInfo />

      {/* Mode selector */}
      <div className="flex-1 overflow-y-auto border-b border-border min-h-0">
        <ModeSelector />
      </div>

      {/* Animation controls */}
      <div className="px-4 py-3 shrink-0">
        <AnimationControls />
      </div>
    </div>
  );
}
