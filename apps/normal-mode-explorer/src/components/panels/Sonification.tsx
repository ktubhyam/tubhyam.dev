"use client";

import { useRef, useCallback } from "react";
import { useExplorerStore } from "@/lib/store";
import { TerminalPanel } from "../ui/TerminalPanel";

/** Map cm⁻¹ to audible Hz. IR range ~400-4000 cm⁻¹ → ~200-800 Hz */
function cmToHz(cmInv: number): number {
  // Linear map: 400 cm⁻¹ → 200 Hz, 4000 cm⁻¹ → 800 Hz
  return 200 + ((cmInv - 400) / 3600) * 600;
}

export function Sonification() {
  const molecule = useExplorerStore((s) => s.molecule);
  const modeA = useExplorerStore((s) => s.modeA);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  const playTone = useCallback(
    (modeIndex: number) => {
      if (!molecule) return;
      const mode = molecule.modes[modeIndex];
      if (!mode) return;

      // Create audio context lazily
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext();
      }
      const ctx = audioCtxRef.current;

      // Stop previous
      if (oscillatorRef.current) {
        oscillatorRef.current.stop();
        oscillatorRef.current.disconnect();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.value = cmToHz(mode.frequency);

      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 1.5);

      oscillatorRef.current = osc;
      gainRef.current = gain;
    },
    [molecule],
  );

  const playChord = useCallback(() => {
    if (!molecule) return;

    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    const ctx = audioCtxRef.current;

    molecule.modes.forEach((mode, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.value = cmToHz(mode.frequency);

      // Scale volume by IR intensity
      const vol = Math.min(mode.ir_intensity / 10, 0.08);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.1); // Stagger slightly
      osc.stop(ctx.currentTime + 2.5);
    });
  }, [molecule]);

  if (!molecule) return null;

  const mode = molecule.modes[modeA];
  const hz = mode ? cmToHz(mode.frequency) : 0;

  return (
    <TerminalPanel title="Sonification">
      <div className="p-3 space-y-2">
        <div className="text-[10px] font-mono text-foreground/40">
          {mode?.frequency.toFixed(0)} cm⁻¹ → {hz.toFixed(0)} Hz
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => playTone(modeA)}
            className="flex-1 py-1.5 rounded bg-surface-2 border border-border hover:border-cyan/40 transition-colors text-[10px] font-mono text-foreground/60 hover:text-cyan"
          >
            ♪ Play Mode
          </button>
          <button
            onClick={playChord}
            className="flex-1 py-1.5 rounded bg-surface-2 border border-border hover:border-accent/40 transition-colors text-[10px] font-mono text-foreground/60 hover:text-accent"
          >
            ♫ All Modes
          </button>
        </div>

        <p className="text-[8px] font-mono text-foreground/20 leading-relaxed">
          Frequencies scaled from IR range (400–4000 cm⁻¹) to audible range (200–800 Hz).
          IR intensity maps to volume.
        </p>
      </div>
    </TerminalPanel>
  );
}
