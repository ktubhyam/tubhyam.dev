"use client";

import { useExplorerStore } from "@/lib/store";
import { TerminalPanel } from "../ui/TerminalPanel";

export function AnimationControls() {
  const isPlaying = useExplorerStore((s) => s.isPlaying);
  const speed = useExplorerStore((s) => s.speed);
  const amplitude = useExplorerStore((s) => s.amplitude);
  const togglePlaying = useExplorerStore((s) => s.togglePlaying);
  const setSpeed = useExplorerStore((s) => s.setSpeed);
  const setAmplitude = useExplorerStore((s) => s.setAmplitude);

  const superpositionEnabled = useExplorerStore((s) => s.superpositionEnabled);
  const setSuperpositionEnabled = useExplorerStore((s) => s.setSuperpositionEnabled);
  const clearSuperposition = useExplorerStore((s) => s.clearSuperposition);
  const showArrows = useExplorerStore((s) => s.showArrows);
  const showTrails = useExplorerStore((s) => s.showTrails);
  const showSymmetryElements = useExplorerStore((s) => s.showSymmetryElements);
  const showLabels = useExplorerStore((s) => s.showLabels);
  const showGrid = useExplorerStore((s) => s.showGrid);
  const toggleArrows = useExplorerStore((s) => s.toggleArrows);
  const toggleTrails = useExplorerStore((s) => s.toggleTrails);
  const toggleSymmetryElements = useExplorerStore((s) => s.toggleSymmetryElements);
  const toggleLabels = useExplorerStore((s) => s.toggleLabels);
  const toggleGrid = useExplorerStore((s) => s.toggleGrid);

  return (
    <TerminalPanel title="Animation">
      <div className="p-3 space-y-3">
        {/* Play/Pause */}
        <button
          onClick={togglePlaying}
          className="w-full flex items-center justify-center gap-2 py-1.5 rounded bg-surface-2 border border-border hover:border-border-bright transition-colors text-xs font-mono text-foreground/70 hover:text-foreground"
        >
          {isPlaying ? (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
              Pause
            </>
          ) : (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5,3 19,12 5,21" />
              </svg>
              Play
            </>
          )}
          <span className="text-foreground/25 text-[10px]">[Space]</span>
        </button>

        {/* Speed */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px] font-mono">
            <span className="text-foreground/40">Speed</span>
            <span className="text-foreground/60">{speed.toFixed(1)}×</span>
          </div>
          <input
            type="range"
            min={0.1}
            max={3}
            step={0.1}
            value={speed}
            onChange={(e) => setSpeed(parseFloat(e.target.value))}
            aria-label="Animation speed"
          />
        </div>

        {/* Amplitude */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px] font-mono">
            <span className="text-foreground/40">Amplitude</span>
            <span className="text-foreground/60">{amplitude.toFixed(1)}</span>
          </div>
          <input
            type="range"
            min={0}
            max={2}
            step={0.1}
            value={amplitude}
            onChange={(e) => setAmplitude(parseFloat(e.target.value))}
            aria-label="Vibration amplitude"
          />
        </div>

        {/* Superposition toggle */}
        <div className="border-t border-border pt-2">
          <button
            onClick={() => {
              if (superpositionEnabled) {
                clearSuperposition();
                setSuperpositionEnabled(false);
              } else {
                setSuperpositionEnabled(true);
              }
            }}
            aria-pressed={superpositionEnabled}
            className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-[10px] font-mono transition-colors ${
              superpositionEnabled
                ? "bg-success/10 text-success border border-success/30"
                : "bg-surface-2 text-foreground/40 border border-border hover:border-border-bright hover:text-foreground/60"
            }`}
          >
            <span>Superposition</span>
            <span className="text-[8px]">{superpositionEnabled ? "ON" : "OFF"} [S]</span>
          </button>
        </div>

        {/* Visual toggles */}
        <div className="border-t border-border pt-2 space-y-1.5">
          <div className="text-[9px] font-mono text-foreground/30 mb-1">Display</div>
          <ToggleButton active={showArrows} onClick={toggleArrows} label="Arrows" />
          <ToggleButton active={showTrails} onClick={toggleTrails} label="Trails" />
          <ToggleButton active={showLabels} onClick={toggleLabels} label="Labels" />
          <ToggleButton active={showGrid} onClick={toggleGrid} label="Grid" />
          <ToggleButton active={showSymmetryElements} onClick={toggleSymmetryElements} label="Symmetry" />
        </div>
      </div>
    </TerminalPanel>
  );
}

function ToggleButton({ active, onClick, label }: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`w-full flex items-center justify-between px-2 py-1 rounded text-[10px] font-mono transition-colors ${
        active
          ? "bg-cyan/10 text-cyan border border-cyan/30"
          : "bg-surface-2 text-foreground/40 border border-border hover:border-border-bright hover:text-foreground/60"
      }`}
    >
      <span>{label}</span>
      <span className="text-[8px]">{active ? "ON" : "OFF"}</span>
    </button>
  );
}
