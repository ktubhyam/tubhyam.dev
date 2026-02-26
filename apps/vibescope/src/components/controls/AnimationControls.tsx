"use client";

import { useVibeStore } from "@/lib/store";

export function AnimationControls() {
  const isPlaying = useVibeStore((s) => s.isPlaying);
  const togglePlaying = useVibeStore((s) => s.togglePlaying);
  const speed = useVibeStore((s) => s.speed);
  const setSpeed = useVibeStore((s) => s.setSpeed);
  const amplitude = useVibeStore((s) => s.amplitude);
  const setAmplitude = useVibeStore((s) => s.setAmplitude);

  return (
    <div className="space-y-3">
      {/* Play / Pause */}
      <button
        onClick={togglePlaying}
        className={`w-full py-2 rounded-lg text-sm font-medium transition-all ${
          isPlaying
            ? "bg-accent/10 border border-accent/30 text-accent hover:bg-accent/15"
            : "bg-surface-hover border border-border text-text hover:border-border-hover"
        }`}
      >
        {isPlaying ? "⏸ Pause" : "▶ Play"}
      </button>

      {/* Speed slider */}
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <label className="text-[11px] text-text-secondary">Speed</label>
          <span className="text-[11px] font-mono text-accent tabular-nums">
            {speed.toFixed(1)}×
          </span>
        </div>
        <input
          type="range"
          min={0.1}
          max={3}
          step={0.1}
          value={speed}
          onChange={(e) => setSpeed(parseFloat(e.target.value))}
          className="vibe-slider w-full"
        />
      </div>

      {/* Amplitude slider */}
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <label className="text-[11px] text-text-secondary">Amplitude</label>
          <span className="text-[11px] font-mono text-accent tabular-nums">
            {amplitude.toFixed(1)}
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={2}
          step={0.1}
          value={amplitude}
          onChange={(e) => setAmplitude(parseFloat(e.target.value))}
          className="vibe-slider w-full"
        />
      </div>
    </div>
  );
}
