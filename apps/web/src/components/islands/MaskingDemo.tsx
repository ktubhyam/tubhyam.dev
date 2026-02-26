/**
 * MaskingDemo — Interactive masked pretraining visualizer.
 * Shows the critical difference between input masking and loss-only masking,
 * demonstrating the near-identity collapse pitfall.
 */
import { useState, useRef, useMemo, useCallback } from "react";
import { motion, useInView } from "motion/react";

interface Props {
  className?: string;
}

const N_POINTS = 384; // Spectrum resolution for display
const N_PATCHES = 48; // Number of patches (divisible into N_POINTS)
const PATCH_SIZE = N_POINTS / N_PATCHES; // Points per patch
const W = 440;
const H_ENCODER = 90; // Encoder input panel
const H_RECON = 90; // Reconstruction panel
const H_PATCHES = 20; // Patch indicator strip
const H_TOTAL = H_ENCODER + H_PATCHES + H_RECON + 50;
const PAD = { top: 10, right: 16, bottom: 8, left: 36 };

function gaussian(x: number, center: number, width: number, height: number): number {
  return height * Math.exp(-0.5 * ((x - center) / width) ** 2);
}

// Deterministic pseudo-random based on seed
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function generateSpectrum(): number[] {
  const peaks = [
    { center: 45, width: 12, height: 0.9 },
    { center: 95, width: 8, height: 0.55 },
    { center: 140, width: 18, height: 1.0 },
    { center: 195, width: 10, height: 0.7 },
    { center: 235, width: 6, height: 0.35 },
    { center: 270, width: 14, height: 0.8 },
    { center: 330, width: 10, height: 0.5 },
    { center: 360, width: 8, height: 0.3 },
  ];
  const spec: number[] = [];
  for (let i = 0; i < N_POINTS; i++) {
    let v = 0.03; // baseline
    for (const p of peaks) {
      v += gaussian(i, p.center, p.width, p.height);
    }
    spec.push(v);
  }
  return spec;
}

const SPECTRUM = generateSpectrum();
const MAX_SPEC = Math.max(...SPECTRUM);

export default function MaskingDemo({ className = "" }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  const [maskRatio, setMaskRatio] = useState(0.35);
  const [mode, setMode] = useState<"input" | "loss-only">("input");
  const [step, setStep] = useState(2500);
  const [seed, setSeed] = useState(42);

  const plotW = W - PAD.left - PAD.right;

  // Select masked patches based on seed and ratio
  const maskedIndices = useMemo(() => {
    const nMasked = Math.floor(maskRatio * N_PATCHES);
    const rng = seededRandom(seed);
    const indices = Array.from({ length: N_PATCHES }, (_, i) => i);
    // Fisher-Yates shuffle
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    return new Set(indices.slice(0, nMasked));
  }, [maskRatio, seed]);

  // Simulate reconstruction
  const reconstruction = useMemo(() => {
    const rng = seededRandom(seed + 1000);
    const recon: number[] = [];

    if (mode === "loss-only") {
      // Near-identity: converges almost perfectly by step 700
      const identityFactor = Math.max(0, 1 - step / 500);
      for (let i = 0; i < N_POINTS; i++) {
        const noise = (rng() - 0.5) * 0.02 * identityFactor;
        recon.push(SPECTRUM[i] + noise);
      }
    } else {
      // Input masking: gradual improvement, never perfect
      const noiseFactor = Math.max(0.06, 1 - step / 4500);
      for (let i = 0; i < N_POINTS; i++) {
        const patchIdx = Math.floor(i / PATCH_SIZE);
        if (maskedIndices.has(patchIdx)) {
          // Masked: reconstruction improves over training
          const noise = (rng() - 0.5) * MAX_SPEC * noiseFactor;
          // Blend between noise and ground truth based on step
          const blend = Math.min(0.92, step / 5000);
          recon.push(SPECTRUM[i] * blend + (SPECTRUM[i] + noise) * (1 - blend));
        } else {
          // Unmasked: near-perfect from the encoder
          recon.push(SPECTRUM[i] + (rng() - 0.5) * 0.01);
        }
      }
    }
    return recon;
  }, [mode, step, seed, maskedIndices]);

  // MSRP: only over masked patches
  const msrp = useMemo(() => {
    let sum = 0;
    let count = 0;
    for (let i = 0; i < N_POINTS; i++) {
      const patchIdx = Math.floor(i / PATCH_SIZE);
      if (maskedIndices.has(patchIdx)) {
        sum += (SPECTRUM[i] - reconstruction[i]) ** 2;
        count++;
      }
    }
    return count > 0 ? sum / count : 0;
  }, [reconstruction, maskedIndices]);

  const toSVG = useCallback(
    (idx: number, val: number, panelTop: number, panelH: number) => ({
      x: PAD.left + (idx / (N_POINTS - 1)) * plotW,
      y: panelTop + panelH - (val / MAX_SPEC) * panelH * 0.9,
    }),
    [plotW]
  );

  const specPath = useCallback(
    (data: number[], panelTop: number, panelH: number) =>
      data
        .map((v, i) => {
          const { x, y } = toSVG(i, v, panelTop, panelH);
          return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
        })
        .join(" "),
    [toSVG]
  );

  // Encoder view: full spectrum or with gaps
  const encoderPath = useMemo(() => {
    if (mode === "loss-only") {
      // Full spectrum visible to encoder
      return specPath(SPECTRUM, PAD.top, H_ENCODER);
    }
    // Input masking: create segments excluding masked patches
    const segments: string[] = [];
    let inSegment = false;
    for (let i = 0; i < N_POINTS; i++) {
      const patchIdx = Math.floor(i / PATCH_SIZE);
      if (!maskedIndices.has(patchIdx)) {
        const { x, y } = toSVG(i, SPECTRUM[i], PAD.top, H_ENCODER);
        if (!inSegment) {
          segments.push(`M${x.toFixed(1)},${y.toFixed(1)}`);
          inSegment = true;
        } else {
          segments.push(`L${x.toFixed(1)},${y.toFixed(1)}`);
        }
      } else {
        inSegment = false;
      }
    }
    return segments.join(" ");
  }, [mode, maskedIndices, specPath, toSVG]);

  const patchesTop = PAD.top + H_ENCODER + 4;
  const reconTop = patchesTop + H_PATCHES + 8;

  const isCollapsed = mode === "loss-only" && step >= 700;
  const statusText =
    mode === "loss-only"
      ? step < 700
        ? "converging rapidly..."
        : "IDENTITY COLLAPSE"
      : step < 1000
        ? "learning spectral structure..."
        : step < 3000
          ? "reconstructing masked peaks"
          : "high-quality reconstruction";

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`rounded-xl border border-border overflow-hidden bg-bg-secondary ${className}`}
    >
      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-surface border-b border-border">
        <div className="flex items-center gap-1.5">
          <div className="w-[10px] h-[10px] rounded-full bg-[#FF5F57]" />
          <div className="w-[10px] h-[10px] rounded-full bg-[#FEBC2E]" />
          <div className="w-[10px] h-[10px] rounded-full bg-[#28C840]" />
        </div>
        <span className="ml-2 text-[10px] font-mono text-text-muted/60 select-none">
          masking_demo.py
        </span>
        <span className="ml-auto text-[10px] font-mono text-teal">interactive</span>
      </div>

      {/* Controls */}
      <div className="px-4 py-3 border-b border-border flex flex-wrap gap-x-5 gap-y-2 items-center">
        <label className="flex items-center gap-2 text-[11px] font-mono text-text-muted">
          mask
          <input
            type="range"
            min={0}
            max={0.75}
            step={0.05}
            value={maskRatio}
            onChange={(e) => setMaskRatio(Number(e.target.value))}
            className="w-14 accent-[#FF6B6B]"
          />
          <span className="text-text-secondary w-8 text-right">{(maskRatio * 100).toFixed(0)}%</span>
        </label>
        <label className="flex items-center gap-2 text-[11px] font-mono text-text-muted">
          step
          <input
            type="range"
            min={0}
            max={5000}
            step={100}
            value={step}
            onChange={(e) => setStep(Number(e.target.value))}
            className="w-16 accent-[#C9A04A]"
          />
          <span className="text-text-secondary w-12 text-right">{step}</span>
        </label>
        <button
          onClick={() => setSeed((s) => s + 7)}
          className="px-2 py-1 text-[11px] font-mono rounded-md border border-border text-text-muted hover:text-text-secondary transition-colors"
        >
          resample
        </button>
        <div className="ml-auto flex gap-1">
          {(["input", "loss-only"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-3 py-1 text-[11px] font-mono rounded-md border transition-colors ${
                mode === m
                  ? m === "input"
                    ? "border-[#34D399] bg-[#34D399]/10 text-[#34D399]"
                    : "border-[#FF6B6B] bg-[#FF6B6B]/10 text-[#FF6B6B]"
                  : "border-border text-text-muted hover:text-text-secondary"
              }`}
            >
              {m === "input" ? "input masking" : "loss-only"}
            </button>
          ))}
        </div>
      </div>

      {/* Visualization */}
      <div className="px-4 pt-3 pb-1">
        <svg
          viewBox={`0 0 ${W} ${H_TOTAL}`}
          className="w-full h-auto"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Panel label: encoder input */}
          <text x={PAD.left} y={PAD.top - 2} fill="#666" fontSize="7" fontFamily="monospace">
            encoder input
          </text>

          {/* Encoder panel background */}
          <rect x={PAD.left} y={PAD.top} width={plotW} height={H_ENCODER} fill="#0a0a0a" rx={2} />

          {/* Mask token regions (gray blocks for input masking) */}
          {mode === "input" &&
            Array.from(maskedIndices).map((patchIdx) => {
              const x1 = PAD.left + (patchIdx * PATCH_SIZE / (N_POINTS - 1)) * plotW;
              const x2 = PAD.left + ((patchIdx + 1) * PATCH_SIZE / (N_POINTS - 1)) * plotW;
              return (
                <rect
                  key={`mask${patchIdx}`}
                  x={x1}
                  y={PAD.top}
                  width={x2 - x1}
                  height={H_ENCODER}
                  fill="#2a2a2a"
                  opacity={0.5}
                />
              );
            })}

          {/* Encoder spectrum */}
          <path d={encoderPath} fill="none" stroke="#C9A04A" strokeWidth="1.2" />

          {/* Mask token labels */}
          {mode === "input" &&
            Array.from(maskedIndices)
              .filter((_, i) => i % 3 === 0)
              .map((patchIdx) => {
                const cx = PAD.left + ((patchIdx + 0.5) * PATCH_SIZE / (N_POINTS - 1)) * plotW;
                return (
                  <text
                    key={`ml${patchIdx}`}
                    x={cx}
                    y={PAD.top + H_ENCODER / 2 + 3}
                    textAnchor="middle"
                    fill="#555"
                    fontSize="5"
                    fontFamily="monospace"
                  >
                    [M]
                  </text>
                );
              })}

          {/* Patch indicator strip */}
          {Array.from({ length: N_PATCHES }).map((_, i) => {
            const x = PAD.left + (i * PATCH_SIZE / (N_POINTS - 1)) * plotW;
            const w = (PATCH_SIZE / (N_POINTS - 1)) * plotW - 1;
            const isMasked = maskedIndices.has(i);
            return (
              <rect
                key={`p${i}`}
                x={x}
                y={patchesTop}
                width={Math.max(1, w)}
                height={H_PATCHES - 4}
                rx={1}
                fill={isMasked ? "#FF6B6B" : "#222"}
                opacity={isMasked ? 0.7 : 0.3}
              />
            );
          })}

          {/* Panel label: reconstruction */}
          <text x={PAD.left} y={reconTop - 2} fill="#666" fontSize="7" fontFamily="monospace">
            reconstruction (masked patches)
          </text>

          {/* Reconstruction panel background */}
          <rect x={PAD.left} y={reconTop} width={plotW} height={H_RECON} fill="#0a0a0a" rx={2} />

          {/* Ground truth on masked patches (dashed amber) */}
          {Array.from(maskedIndices).map((patchIdx) => {
            const startIdx = patchIdx * PATCH_SIZE;
            const endIdx = Math.min(startIdx + PATCH_SIZE, N_POINTS);
            const path = SPECTRUM.slice(startIdx, endIdx)
              .map((v, i) => {
                const { x, y } = toSVG(startIdx + i, v, reconTop, H_RECON);
                return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
              })
              .join(" ");
            return (
              <path
                key={`gt${patchIdx}`}
                d={path}
                fill="none"
                stroke="#C9A04A"
                strokeWidth="1"
                strokeDasharray="3,2"
                opacity={0.6}
              />
            );
          })}

          {/* Reconstruction on masked patches (solid green) */}
          {Array.from(maskedIndices).map((patchIdx) => {
            const startIdx = patchIdx * PATCH_SIZE;
            const endIdx = Math.min(startIdx + PATCH_SIZE, N_POINTS);
            const path = reconstruction.slice(startIdx, endIdx)
              .map((v, i) => {
                const { x, y } = toSVG(startIdx + i, Math.max(0, v), reconTop, H_RECON);
                return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
              })
              .join(" ");
            return (
              <path
                key={`rc${patchIdx}`}
                d={path}
                fill="none"
                stroke={isCollapsed ? "#FF6B6B" : "#34D399"}
                strokeWidth="1.2"
              />
            );
          })}

          {/* Reconstruction legend */}
          <g transform={`translate(${PAD.left + plotW - 100}, ${reconTop + 6})`}>
            <line x1={0} y1={0} x2={10} y2={0} stroke="#C9A04A" strokeWidth="1" strokeDasharray="3,2" opacity={0.6} />
            <text x={14} y={3} fill="#888" fontSize="6" fontFamily="monospace">ground truth</text>
            <line x1={0} y1={10} x2={10} y2={10} stroke={isCollapsed ? "#FF6B6B" : "#34D399"} strokeWidth="1.2" />
            <text x={14} y={13} fill="#888" fontSize="6" fontFamily="monospace">predicted</text>
          </g>

          {/* MSRP readout */}
          <text
            x={PAD.left + plotW}
            y={reconTop + H_RECON + 14}
            textAnchor="end"
            fill={isCollapsed ? "#FF6B6B" : "#C9A04A"}
            fontSize="9"
            fontFamily="monospace"
            fontWeight="bold"
          >
            MSRP = {msrp.toFixed(4)}
          </text>

          {/* Status label */}
          <text
            x={PAD.left}
            y={reconTop + H_RECON + 14}
            fill={isCollapsed ? "#FF6B6B" : "#34D399"}
            fontSize="8"
            fontFamily="monospace"
            fontWeight={isCollapsed ? "bold" : "normal"}
          >
            {statusText}
          </text>
        </svg>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 text-[10px] font-mono text-text-muted border-t border-border">
        {mode === "input" ? (
          <span>
            <span className="text-[#34D399]">Input masking</span> replaces masked patches with a learned
            [MASK] token before the encoder. The model must infer masked content from surrounding peaks.
          </span>
        ) : (
          <span>
            <span className="text-[#FF6B6B]">Loss-only masking</span> feeds the full spectrum to the encoder
            and only computes loss on masked positions. The model learns to copy — not to understand.
          </span>
        )}
      </div>
    </motion.div>
  );
}
