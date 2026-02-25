/**
 * SinkhornExplorer — Interactive Sinkhorn OT visualizer.
 * Two spectra (source + shifted target) with real-time transport plan visualization.
 * Users adjust epsilon, iterations, shift, and toggle MSE vs Wasserstein.
 */
import { useState, useRef, useMemo, useCallback } from "react";
import { motion, useInView } from "motion/react";

interface Props {
  className?: string;
}

const N = 64; // Grid resolution for computation
const W = 440;
const H_SPEC = 120; // Spectrum panel height
const H_PLAN = 100; // Transport plan panel height
const H_TOTAL = H_SPEC + H_PLAN + 40; // +40 for labels
const PAD = { top: 12, right: 16, bottom: 14, left: 36 };

function gaussian(x: number, center: number, width: number, height: number): number {
  return height * Math.exp(-0.5 * ((x - center) / width) ** 2);
}

function generateSpectrum(shift: number): { source: number[]; target: number[] } {
  const peaks = [
    { center: 12, width: 3, height: 0.9 },
    { center: 24, width: 2.5, height: 0.6 },
    { center: 38, width: 4, height: 1.0 },
    { center: 50, width: 2, height: 0.45 },
    { center: 56, width: 3, height: 0.3 },
  ];
  const source: number[] = [];
  const target: number[] = [];
  for (let i = 0; i < N; i++) {
    let s = 0.02; // small baseline
    let t = 0.02;
    for (const p of peaks) {
      s += gaussian(i, p.center, p.width, p.height);
      t += gaussian(i, p.center + shift * (N / 100), p.width, p.height);
    }
    source.push(s);
    target.push(t);
  }
  return { source, target };
}

function normalize(arr: number[]): number[] {
  const sum = arr.reduce((a, b) => a + b, 0);
  return sum > 0 ? arr.map((v) => v / sum) : arr;
}

function computeMSE(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += (a[i] - b[i]) ** 2;
  }
  return sum / a.length;
}

function sinkhornOT(
  mu: number[],
  nu: number[],
  epsilon: number,
  maxIter: number
): { plan: number[][]; cost: number } {
  const n = mu.length;

  // Cost matrix: squared distance
  const C: number[][] = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i - j) ** 2)
  );

  // Gibbs kernel: K = exp(-C/epsilon)
  const K: number[][] = C.map((row) =>
    row.map((c) => Math.exp(-c / epsilon))
  );

  // Sinkhorn iterations in standard domain
  const u = new Float64Array(n).fill(1);
  const v = new Float64Array(n).fill(1);

  for (let iter = 0; iter < maxIter; iter++) {
    // u = mu / (K @ v)
    for (let i = 0; i < n; i++) {
      let Kv = 0;
      for (let j = 0; j < n; j++) Kv += K[i][j] * v[j];
      u[i] = Kv > 1e-30 ? mu[i] / Kv : 0;
    }
    // v = nu / (K^T @ u)
    for (let j = 0; j < n; j++) {
      let Ktu = 0;
      for (let i = 0; i < n; i++) Ktu += K[i][j] * u[i];
      v[j] = Ktu > 1e-30 ? nu[j] / Ktu : 0;
    }
  }

  // Transport plan: pi = diag(u) @ K @ diag(v)
  const plan: number[][] = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => u[i] * K[i][j] * v[j])
  );

  // OT cost: <C, pi>
  let cost = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      cost += C[i][j] * plan[i][j];
    }
  }

  return { plan, cost };
}

export default function SinkhornExplorer({ className = "" }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  const [epsilon, setEpsilon] = useState(1.0);
  const [iterations, setIterations] = useState(50);
  const [shift, setShift] = useState(5);
  const [lossMode, setLossMode] = useState<"wasserstein" | "mse">("wasserstein");

  const plotW = W - PAD.left - PAD.right;
  const specH = H_SPEC - PAD.top - PAD.bottom;
  const planTop = H_SPEC + 16;
  const planH = H_PLAN - 10;

  const { source, target } = useMemo(() => generateSpectrum(shift), [shift]);
  const muNorm = useMemo(() => normalize(source), [source]);
  const nuNorm = useMemo(() => normalize(target), [target]);

  const { plan, cost: otCost } = useMemo(
    () => sinkhornOT(muNorm, nuNorm, epsilon, iterations),
    [muNorm, nuNorm, epsilon, iterations]
  );

  const mseCost = useMemo(() => computeMSE(muNorm, nuNorm), [muNorm, nuNorm]);

  const maxSpec = useMemo(() => {
    let m = 0;
    for (let i = 0; i < N; i++) {
      m = Math.max(m, source[i], target[i]);
    }
    return m;
  }, [source, target]);

  const toSpecSVG = useCallback(
    (idx: number, val: number) => ({
      x: PAD.left + (idx / (N - 1)) * plotW,
      y: PAD.top + specH - (val / maxSpec) * specH,
    }),
    [plotW, specH, maxSpec]
  );

  const specPath = useCallback(
    (data: number[]) =>
      data
        .map((v, i) => {
          const { x, y } = toSpecSVG(i, v);
          return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
        })
        .join(" "),
    [toSpecSVG]
  );

  // Top-K transport lines (show only significant transport)
  const transportLines = useMemo(() => {
    let maxPi = 0;
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        maxPi = Math.max(maxPi, plan[i][j]);
      }
    }
    const threshold = maxPi * 0.03;
    const lines: Array<{ i: number; j: number; weight: number }> = [];
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        if (plan[i][j] > threshold) {
          lines.push({ i, j, weight: plan[i][j] / maxPi });
        }
      }
    }
    // Limit to top 200 lines for performance
    lines.sort((a, b) => b.weight - a.weight);
    return lines.slice(0, 200);
  }, [plan]);

  const displayCost = lossMode === "wasserstein" ? otCost : mseCost;
  const costLabel = lossMode === "wasserstein" ? "W_ε" : "MSE";

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
          sinkhorn_explorer.py
        </span>
        <span className="ml-auto text-[10px] font-mono text-teal">interactive</span>
      </div>

      {/* Controls */}
      <div className="px-4 py-3 border-b border-border flex flex-wrap gap-x-5 gap-y-2 items-center">
        <label className="flex items-center gap-2 text-[11px] font-mono text-text-muted">
          ε
          <input
            type="range"
            min={-2}
            max={1.6}
            step={0.05}
            value={Math.log10(epsilon)}
            onChange={(e) => setEpsilon(Math.pow(10, Number(e.target.value)))}
            className="w-16 accent-[#A78BFA]"
          />
          <span className="text-text-secondary w-10 text-right">{epsilon.toFixed(2)}</span>
        </label>
        <label className="flex items-center gap-2 text-[11px] font-mono text-text-muted">
          iters
          <input
            type="range"
            min={1}
            max={100}
            value={iterations}
            onChange={(e) => setIterations(Number(e.target.value))}
            className="w-16 accent-[#C9A04A]"
          />
          <span className="text-text-secondary w-10 text-right">{iterations}</span>
        </label>
        <label className="flex items-center gap-2 text-[11px] font-mono text-text-muted">
          shift
          <input
            type="range"
            min={-50}
            max={50}
            value={shift}
            onChange={(e) => setShift(Number(e.target.value))}
            className="w-16 accent-[#4ECDC4]"
          />
          <span className="text-text-secondary w-14 text-right">{shift} cm⁻¹</span>
        </label>
        <div className="ml-auto flex gap-1">
          {(["wasserstein", "mse"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setLossMode(mode)}
              className={`px-3 py-1 text-[11px] font-mono rounded-md border transition-colors ${
                lossMode === mode
                  ? mode === "wasserstein"
                    ? "border-[#C9A04A] bg-[#C9A04A]/10 text-[#C9A04A]"
                    : "border-[#FF6B6B] bg-[#FF6B6B]/10 text-[#FF6B6B]"
                  : "border-border text-text-muted hover:text-text-secondary"
              }`}
            >
              {mode === "wasserstein" ? "Wasserstein" : "MSE"}
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
          {/* Spectrum panel */}
          {/* Y-axis grid */}
          {[0, 0.5, 1.0].map((v, i) => {
            const y = PAD.top + specH - v * specH;
            return (
              <g key={`sg${i}`}>
                <line x1={PAD.left} y1={y} x2={PAD.left + plotW} y2={y} stroke="#1a1a1a" strokeWidth="0.5" />
                <text x={PAD.left - 4} y={y + 3} textAnchor="end" fill="#444" fontSize="6" fontFamily="monospace">
                  {(v * maxSpec).toFixed(1)}
                </text>
              </g>
            );
          })}

          {/* Axes */}
          <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={PAD.top + specH} stroke="#333" strokeWidth="1" />
          <line
            x1={PAD.left}
            y1={PAD.top + specH}
            x2={PAD.left + plotW}
            y2={PAD.top + specH}
            stroke="#333"
            strokeWidth="1"
          />

          {/* Source spectrum (amber) */}
          <path d={specPath(source)} fill="none" stroke="#C9A04A" strokeWidth="1.5" />
          {/* Target spectrum (teal) */}
          <path d={specPath(target)} fill="none" stroke="#4ECDC4" strokeWidth="1.5" />

          {/* Spectrum legend */}
          <g transform={`translate(${PAD.left + plotW - 80}, ${PAD.top + 4})`}>
            <line x1={0} y1={0} x2={10} y2={0} stroke="#C9A04A" strokeWidth="1.5" />
            <text x={14} y={3} fill="#888" fontSize="6" fontFamily="monospace">source μ</text>
            <line x1={0} y1={10} x2={10} y2={10} stroke="#4ECDC4" strokeWidth="1.5" />
            <text x={14} y={13} fill="#888" fontSize="6" fontFamily="monospace">target ν</text>
          </g>

          {/* Label */}
          <text
            x={PAD.left + plotW / 2}
            y={H_SPEC + 8}
            textAnchor="middle"
            fill="#555"
            fontSize="7"
            fontFamily="monospace"
          >
            wavenumber (cm⁻¹)
          </text>

          {/* Transport plan panel */}
          <text
            x={PAD.left}
            y={planTop - 2}
            fill="#666"
            fontSize="7"
            fontFamily="monospace"
          >
            transport plan π
          </text>

          {/* Transport lines */}
          {transportLines.map((line, idx) => {
            const x1 = PAD.left + (line.i / (N - 1)) * plotW;
            const x2 = PAD.left + (line.j / (N - 1)) * plotW;
            const y1 = planTop + 4;
            const y2 = planTop + planH - 4;
            const color = lossMode === "wasserstein" ? "#C9A04A" : "#FF6B6B";
            return (
              <line
                key={idx}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={color}
                strokeWidth={Math.max(0.3, line.weight * 2)}
                opacity={Math.max(0.05, line.weight * 0.6)}
              />
            );
          })}

          {/* Source/target bars at edges of transport plan */}
          {Array.from({ length: N }).map((_, i) => {
            const x = PAD.left + (i / (N - 1)) * plotW;
            return (
              <g key={`bar${i}`}>
                <rect x={x - 1} y={planTop} width={2} height={3} fill="#C9A04A" opacity={muNorm[i] * N * 0.5} />
                <rect x={x - 1} y={planTop + planH - 3} width={2} height={3} fill="#4ECDC4" opacity={nuNorm[i] * N * 0.5} />
              </g>
            );
          })}

          {/* Cost readout */}
          <text
            x={PAD.left + plotW}
            y={planTop + planH + 12}
            textAnchor="end"
            fill={lossMode === "wasserstein" ? "#C9A04A" : "#FF6B6B"}
            fontSize="9"
            fontFamily="monospace"
            fontWeight="bold"
          >
            {costLabel} = {displayCost.toExponential(3)}
          </text>
        </svg>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 text-[10px] font-mono text-text-muted border-t border-border">
        {shift === 0 ? (
          <span>Shift the target spectrum to see how each loss responds to peak displacement.</span>
        ) : lossMode === "wasserstein" ? (
          <span>
            <span className="text-[#C9A04A]">Wasserstein</span> cost scales smoothly with shift distance.
            {epsilon < 0.1 ? " Low ε gives a sharp transport plan but risks numerical underflow." : ""}
            {epsilon > 5 ? " High ε blurs the plan — all mass spreads uniformly." : ""}
          </span>
        ) : (
          <span>
            <span className="text-[#FF6B6B]">MSE</span> penalizes displaced peaks at both the source and
            destination, regardless of how far the shift is.
          </span>
        )}
      </div>
    </motion.div>
  );
}
