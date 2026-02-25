/**
 * ReceptiveFieldDemo — Interactive visualization comparing CNN vs SSM receptive fields.
 * Users adjust kernel size and layer count, see the receptive field highlighted on a spectrum.
 * Demonstrates why CNNs miss long-range spectral correlations.
 */
import { useState, useRef, useMemo, useCallback } from "react";
import { motion, useInView } from "motion/react";

interface Props {
  className?: string;
}

function gaussian(x: number, center: number, width: number, height: number): number {
  return height * Math.exp(-((x - center) ** 2) / (2 * width ** 2));
}

const PEAKS = [
  { pos: 0.06, h: 0.55, w: 0.012, label: "O-H bend", color: "#4ECDC4" },
  { pos: 0.15, h: 0.40, w: 0.015, label: "C-C", color: "#888" },
  { pos: 0.28, h: 0.80, w: 0.010, label: "C=O", color: "#FF6B6B" },
  { pos: 0.38, h: 0.30, w: 0.020, label: "", color: "#888" },
  { pos: 0.55, h: 0.65, w: 0.012, label: "C-H", color: "#C9A04A" },
  { pos: 0.70, h: 0.50, w: 0.015, label: "N-H", color: "#A78BFA" },
  { pos: 0.82, h: 0.90, w: 0.011, label: "O-H str", color: "#4ECDC4" },
  { pos: 0.93, h: 0.35, w: 0.018, label: "", color: "#888" },
];

const CORRELATIONS = [
  { from: 0.06, to: 0.82, label: "O-H bend ↔ O-H stretch", color: "#4ECDC4" },
  { from: 0.28, to: 0.55, label: "C=O ↔ C-H coupling", color: "#C9A04A" },
];

export default function ReceptiveFieldDemo({ className = "" }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const [kernelSize, setKernelSize] = useState(7);
  const [layers, setLayers] = useState(6);
  const [focusPoint, setFocusPoint] = useState(0.82); // O-H stretch
  const [model, setModel] = useState<"cnn" | "ssm">("cnn");

  const W = 440;
  const H = 200;
  const PAD = { top: 25, right: 15, bottom: 35, left: 15 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  const receptiveField = layers * (kernelSize - 1) + 1;
  const rfFraction = receptiveField / 3501;
  const rfHalf = rfFraction / 2;

  const spectrumPath = useMemo(() => {
    const pts: string[] = [];
    const N = 300;
    for (let i = 0; i <= N; i++) {
      const x = i / N;
      let y = 0.02;
      for (const p of PEAKS) {
        y += gaussian(x, p.pos, p.w, p.h);
      }
      y = Math.min(y, 1);
      const px = PAD.left + x * plotW;
      const py = PAD.top + plotH - y * plotH;
      pts.push(`${i === 0 ? "M" : "L"}${px.toFixed(1)},${py.toFixed(1)}`);
    }
    return pts.join(" ");
  }, [plotW, plotH]);

  const handleSpectrumClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const svg = e.currentTarget;
      const rect = svg.getBoundingClientRect();
      const svgX = ((e.clientX - rect.left) / rect.width) * W;
      const frac = (svgX - PAD.left) / plotW;
      if (frac >= 0 && frac <= 1) setFocusPoint(frac);
    },
    [plotW]
  );

  const rfLeft = model === "ssm" ? 0 : Math.max(0, focusPoint - rfHalf);
  const rfRight = model === "ssm" ? 1 : Math.min(1, focusPoint + rfHalf);

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
          receptive_field_explorer.py
        </span>
        <span className="ml-auto text-[10px] font-mono text-teal">interactive</span>
      </div>

      {/* Controls */}
      <div className="px-4 py-3 border-b border-border flex flex-wrap gap-4 items-center">
        <div className="flex gap-2">
          <button
            onClick={() => setModel("cnn")}
            className={`px-3 py-1 text-[11px] font-mono rounded-md border transition-colors ${
              model === "cnn"
                ? "border-[#FF6B6B] bg-[#FF6B6B]/10 text-[#FF6B6B]"
                : "border-border text-text-muted hover:text-text-secondary"
            }`}
          >
            CNN
          </button>
          <button
            onClick={() => setModel("ssm")}
            className={`px-3 py-1 text-[11px] font-mono rounded-md border transition-colors ${
              model === "ssm"
                ? "border-[#34D399] bg-[#34D399]/10 text-[#34D399]"
                : "border-border text-text-muted hover:text-text-secondary"
            }`}
          >
            SSM
          </button>
        </div>

        {model === "cnn" && (
          <>
            <label className="flex items-center gap-2 text-[11px] font-mono text-text-muted">
              kernel
              <input
                type="range"
                min={3}
                max={31}
                step={2}
                value={kernelSize}
                onChange={(e) => setKernelSize(Number(e.target.value))}
                className="w-20 accent-[#FF6B6B]"
              />
              <span className="text-text-secondary w-5 text-right">{kernelSize}</span>
            </label>
            <label className="flex items-center gap-2 text-[11px] font-mono text-text-muted">
              layers
              <input
                type="range"
                min={1}
                max={16}
                value={layers}
                onChange={(e) => setLayers(Number(e.target.value))}
                className="w-20 accent-[#FF6B6B]"
              />
              <span className="text-text-secondary w-5 text-right">{layers}</span>
            </label>
          </>
        )}

        <span className="ml-auto text-[11px] font-mono">
          {model === "cnn" ? (
            <>
              <span className="text-text-muted">field: </span>
              <span className={rfFraction >= 1 ? "text-[#34D399]" : "text-[#FF6B6B]"}>
                {receptiveField} pts
              </span>
              <span className="text-text-muted"> ({(rfFraction * 100).toFixed(1)}%)</span>
            </>
          ) : (
            <>
              <span className="text-text-muted">field: </span>
              <span className="text-[#34D399]">3501 pts</span>
              <span className="text-text-muted"> (100%, O(N))</span>
            </>
          )}
        </span>
      </div>

      {/* Spectrum SVG */}
      <div className="px-4 pt-3 pb-1">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full h-auto cursor-crosshair"
          preserveAspectRatio="xMidYMid meet"
          onClick={handleSpectrumClick}
        >
          {/* Receptive field highlight */}
          <rect
            x={PAD.left + rfLeft * plotW}
            y={PAD.top}
            width={(rfRight - rfLeft) * plotW}
            height={plotH}
            fill={model === "ssm" ? "#34D399" : "#FF6B6B"}
            opacity={0.08}
          />
          <line
            x1={PAD.left + rfLeft * plotW}
            y1={PAD.top}
            x2={PAD.left + rfLeft * plotW}
            y2={PAD.top + plotH}
            stroke={model === "ssm" ? "#34D399" : "#FF6B6B"}
            strokeWidth="1"
            opacity={0.4}
          />
          <line
            x1={PAD.left + rfRight * plotW}
            y1={PAD.top}
            x2={PAD.left + rfRight * plotW}
            y2={PAD.top + plotH}
            stroke={model === "ssm" ? "#34D399" : "#FF6B6B"}
            strokeWidth="1"
            opacity={0.4}
          />

          {/* Correlation arcs */}
          {CORRELATIONS.map((c, i) => {
            const x1 = PAD.left + c.from * plotW;
            const x2 = PAD.left + c.to * plotW;
            const midX = (x1 + x2) / 2;
            const arcH = 20 + i * 8;
            const visible =
              model === "ssm" ||
              (focusPoint - rfHalf <= c.from &&
                focusPoint + rfHalf >= c.to);
            return (
              <g key={i} opacity={visible ? 0.7 : 0.15}>
                <path
                  d={`M${x1},${PAD.top + 5} Q${midX},${PAD.top - arcH} ${x2},${PAD.top + 5}`}
                  fill="none"
                  stroke={c.color}
                  strokeWidth="1"
                  strokeDasharray={visible ? "none" : "3,3"}
                />
                <text
                  x={midX}
                  y={PAD.top - arcH + 8}
                  textAnchor="middle"
                  fill={c.color}
                  fontSize="6"
                  fontFamily="monospace"
                  opacity={visible ? 1 : 0.4}
                >
                  {c.label}
                </text>
              </g>
            );
          })}

          {/* Axes */}
          <line
            x1={PAD.left}
            y1={PAD.top + plotH}
            x2={PAD.left + plotW}
            y2={PAD.top + plotH}
            stroke="#333"
            strokeWidth="1"
          />

          {/* Axis labels */}
          <text x={PAD.left} y={PAD.top + plotH + 12} fill="#555" fontSize="7" fontFamily="monospace">
            500
          </text>
          <text x={PAD.left + plotW} y={PAD.top + plotH + 12} fill="#555" fontSize="7" fontFamily="monospace" textAnchor="end">
            4000
          </text>
          <text x={PAD.left + plotW / 2} y={PAD.top + plotH + 22} fill="#444" fontSize="7" fontFamily="monospace" textAnchor="middle">
            Wavenumber (cm⁻&#185;)
          </text>

          {/* Spectrum line */}
          <path d={spectrumPath} fill="none" stroke="#C9A04A" strokeWidth="1.5" strokeLinejoin="round" />

          {/* Peak labels */}
          {PEAKS.filter((p) => p.label).map((p, i) => (
            <text
              key={i}
              x={PAD.left + p.pos * plotW}
              y={PAD.top + plotH - p.h * plotH - 6}
              textAnchor="middle"
              fill={p.color}
              fontSize="7"
              fontFamily="monospace"
            >
              {p.label}
            </text>
          ))}

          {/* Focus point indicator */}
          <circle
            cx={PAD.left + focusPoint * plotW}
            cy={PAD.top + plotH + 2}
            r={3}
            fill={model === "ssm" ? "#34D399" : "#FF6B6B"}
          />
        </svg>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 text-[10px] font-mono text-text-muted border-t border-border">
        {model === "cnn" ? (
          rfFraction < 0.5 ? (
            <span>
              <span className="text-[#FF6B6B]">CNN misses</span> correlations outside the{" "}
              {(rfFraction * 100).toFixed(1)}% window. Click on the spectrum to move the focus point.
            </span>
          ) : (
            <span>
              <span className="text-[#FEBC2E]">Large receptive field</span> requires{" "}
              {layers} layers &times; k={kernelSize}. Click to move focus.
            </span>
          )
        ) : (
          <span>
            <span className="text-[#34D399]">SSM sees the entire spectrum</span> in O(N) time.
            Every peak is correlated with every other peak through the hidden state.
          </span>
        )}
      </div>
    </motion.div>
  );
}
