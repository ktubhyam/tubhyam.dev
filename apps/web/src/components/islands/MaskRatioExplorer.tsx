import { useRef, useEffect, useState } from "react";

const RATIO = 52 / 100;
const N_BARS = 60;
const TEAL = "#4ECDC4";
const AMBER = "#C9A04A";
const RED = "#F87171";
const ZINC700 = "#3f3f46";
const ZINC500 = "#71717a";
const ZINC900 = "#18181b";

function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s |= 0; s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Pre-generate bar heights (fixed across all renders)
const BAR_RNG = mulberry32(0xdeadbeef);
const BASE_HEIGHTS: number[] = (() => {
  const h: number[] = [];
  // Build a spectrum with a few peaks
  const peaks = [
    { center: 8, width: 3, height: 0.85 },
    { center: 18, width: 2, height: 0.55 },
    { center: 28, width: 4, height: 1.0 },
    { center: 38, width: 3, height: 0.7 },
    { center: 46, width: 2, height: 0.45 },
    { center: 53, width: 3, height: 0.6 },
  ];
  for (let i = 0; i < N_BARS; i++) {
    let v = 0.04 + BAR_RNG() * 0.03;
    for (const p of peaks) {
      v += p.height * Math.exp(-0.5 * ((i - p.center) / p.width) ** 2);
    }
    h.push(Math.min(1, v));
  }
  return h;
})();

// Quality curve: inverted parabola peaking at ~0.325, with sweet spot 0.28-0.38
function qualityCurve(r: number): number {
  // Sigmoid-based rise, then falloff
  const peak = 0.325;
  const left = 1 / (1 + Math.exp(-18 * (r - 0.08)));
  const right = 1 / (1 + Math.exp(14 * (r - 0.60)));
  const shape = left * right;
  // Slight asymmetric peak
  const bump = Math.exp(-0.5 * ((r - peak) / 0.085) ** 2) * 0.18;
  return Math.min(1, shape * 0.82 + bump);
}

function getMaskedSet(ratio: number, seed: number): Set<number> {
  const rng = mulberry32(seed);
  const n = Math.round(ratio * N_BARS);
  const indices = Array.from({ length: N_BARS }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return new Set(indices.slice(0, n));
}

export default function MaskRatioExplorer() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ratio, setRatio] = useState(0.35);
  const [mode, setMode] = useState<"input" | "loss-only">("input");
  const ratioRef = useRef(ratio);
  const modeRef = useRef(mode);
  ratioRef.current = ratio;
  modeRef.current = mode;

  useEffect(() => {
    const wrap = wrapRef.current!;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let raf = 0, paused = false, cssW = 0, cssH = 0;

    function resize() {
      const r = wrap.getBoundingClientRect();
      cssW = r.width || 600; cssH = Math.round(cssW * RATIO);
      const dpr = devicePixelRatio || 1;
      canvas.width = cssW * dpr; canvas.height = cssH * dpr;
      canvas.style.width = cssW + "px"; canvas.style.height = cssH + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function draw(_now: number) {
      if (!paused) {
        ctx.clearRect(0, 0, cssW, cssH);

        const r = ratioRef.current;
        const m = modeRef.current;
        const masked = getMaskedSet(r, 0xabcd1234);

        const specH = cssH * 0.58;
        const curveH = cssH * 0.38;
        const curveTop = cssH * 0.62;
        const padL = cssW * 0.05;
        const padR = cssW * 0.05;
        const specW = cssW - padL - padR;

        // --- SPECTRUM SECTION ---
        const barW = specW / N_BARS;
        const barPadX = barW * 0.12;
        const maxBarH = specH * 0.88;

        // Spectrum label
        ctx.font = `${Math.max(9, cssW * 0.018)}px monospace`;
        ctx.fillStyle = ZINC500;
        ctx.textAlign = "left";
        ctx.fillText("IR spectrum — masked patches", padL, cssH * 0.06);

        for (let i = 0; i < N_BARS; i++) {
          const x = padL + i * barW + barPadX;
          const bw = barW - barPadX * 2;
          const bh = BASE_HEIGHTS[i] * maxBarH;
          const by = specH - bh;

          if (masked.has(i)) {
            if (m === "input") {
              // Gray filled — mask token replaces encoder input
              ctx.fillStyle = "#27272a";
              ctx.strokeStyle = "#3f3f46";
              ctx.lineWidth = 0.5;
              ctx.beginPath();
              ctx.rect(x, by, bw, bh);
              ctx.fill();
              ctx.stroke();
            } else {
              // loss-only: bar still shows, outline box shows where loss computed
              ctx.fillStyle = AMBER + "55";
              ctx.beginPath();
              ctx.rect(x, by, bw, bh);
              ctx.fill();
              // Dashed outline
              ctx.strokeStyle = RED + "aa";
              ctx.lineWidth = 1;
              ctx.setLineDash([2, 2]);
              ctx.strokeRect(x - 0.5, by - 0.5, bw + 1, bh + 1);
              ctx.setLineDash([]);
            }
          } else {
            ctx.fillStyle = TEAL + "bb";
            ctx.beginPath();
            ctx.rect(x, by, bw, bh);
            ctx.fill();
          }
        }

        // Spectrum baseline
        ctx.strokeStyle = ZINC700;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(padL, specH);
        ctx.lineTo(padL + specW, specH);
        ctx.stroke();

        // --- QUALITY CURVE SECTION ---
        const curveY = (rv: number) =>
          curveTop + curveH - qualityCurve(rv) * (curveH - cssH * 0.04) - cssH * 0.02;

        // Axes
        ctx.strokeStyle = ZINC700;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(padL, curveTop);
        ctx.lineTo(padL, curveTop + curveH);
        ctx.lineTo(padL + specW, curveTop + curveH);
        ctx.stroke();

        // Sweet spot shaded band (28-38%)
        const ssX1 = padL + 0.28 * specW;
        const ssX2 = padL + 0.38 * specW;
        ctx.fillStyle = TEAL + "18";
        ctx.fillRect(ssX1, curveTop, ssX2 - ssX1, curveH);
        // Sweet spot border lines
        ctx.strokeStyle = TEAL + "40";
        ctx.lineWidth = 0.6;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(ssX1, curveTop);
        ctx.lineTo(ssX1, curveTop + curveH);
        ctx.moveTo(ssX2, curveTop);
        ctx.lineTo(ssX2, curveTop + curveH);
        ctx.stroke();
        ctx.setLineDash([]);

        // Sweet spot label
        const fs = Math.max(8, cssW * 0.016);
        ctx.font = `${fs}px monospace`;
        ctx.fillStyle = TEAL + "88";
        ctx.textAlign = "center";
        ctx.fillText("sweet spot", (ssX1 + ssX2) / 2, curveTop + cssH * 0.025);

        // Draw quality curve (smooth, sampled)
        ctx.beginPath();
        ctx.strokeStyle = TEAL;
        ctx.lineWidth = 1.5;
        const steps = 200;
        for (let s = 0; s <= steps; s++) {
          const rv = 0.05 + (s / steps) * 0.70;
          const cx = padL + ((rv - 0.05) / 0.70) * specW;
          const cy = curveY(rv);
          if (s === 0) ctx.moveTo(cx, cy); else ctx.lineTo(cx, cy);
        }
        ctx.stroke();

        // Current ratio vertical cursor with glow
        const curX = padL + ((r - 0.05) / 0.70) * specW;
        const curY = curveY(r);

        // Glow
        const grd = ctx.createRadialGradient(curX, curY, 0, curX, curY, 8);
        grd.addColorStop(0, AMBER + "cc");
        grd.addColorStop(1, AMBER + "00");
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(curX, curY, 8, 0, Math.PI * 2);
        ctx.fill();

        // Vertical dashed line from cursor to axis
        ctx.strokeStyle = AMBER + "66";
        ctx.lineWidth = 0.8;
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.moveTo(curX, curY + 5);
        ctx.lineTo(curX, curveTop + curveH);
        ctx.stroke();
        ctx.setLineDash([]);

        // Cursor dot
        ctx.fillStyle = AMBER;
        ctx.beginPath();
        ctx.arc(curX, curY, 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Ratio % label above cursor
        ctx.font = `bold ${Math.max(9, cssW * 0.018)}px monospace`;
        ctx.fillStyle = AMBER;
        ctx.textAlign = "center";
        ctx.fillText(`${Math.round(r * 100)}%`, curX, curY - 8);

        // Axis labels
        const axisFs = Math.max(7, cssW * 0.014);
        ctx.font = `${axisFs}px monospace`;
        ctx.fillStyle = ZINC500;
        ctx.textAlign = "center";
        ctx.fillText("masking ratio →", padL + specW / 2, curveTop + curveH + cssH * 0.045);

        // Y-axis label (rotated)
        ctx.save();
        ctx.translate(padL - cssW * 0.025, curveTop + curveH / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.textAlign = "center";
        ctx.fillText("reconstruction quality", 0, 0);
        ctx.restore();

        // X-axis tick labels
        [0.1, 0.3, 0.5, 0.7].forEach((rv) => {
          const tx = padL + ((rv - 0.05) / 0.70) * specW;
          ctx.fillStyle = ZINC500;
          ctx.textAlign = "center";
          ctx.fillText(`${Math.round(rv * 100)}%`, tx, curveTop + curveH + cssH * 0.025);
        });

        // loss-only warning
        if (m === "loss-only") {
          ctx.font = `bold ${Math.max(9, cssW * 0.018)}px monospace`;
          ctx.fillStyle = RED;
          ctx.textAlign = "right";
          ctx.fillText("near-identity collapse risk", padL + specW, curveTop - cssH * 0.01);
        }
      }
      raf = requestAnimationFrame(draw);
    }

    const visObs = new IntersectionObserver(([e]) => { paused = !e.isIntersecting; });
    visObs.observe(wrap);
    const resObs = new ResizeObserver(resize);
    resObs.observe(wrap);
    resize();
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); visObs.disconnect(); resObs.disconnect(); };
  }, []);

  return (
    <div className="my-8 rounded-lg border border-zinc-800 bg-zinc-950 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800">
        <span className="text-xs font-mono text-zinc-400">mask ratio explorer</span>
        <div className="flex gap-1">
          {(["input", "loss-only"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-2 py-0.5 text-xs font-mono rounded border transition-colors ${
                mode === m
                  ? m === "input"
                    ? "border-teal-500 bg-teal-500/10 text-teal-400"
                    : "border-red-500 bg-red-500/10 text-red-400"
                  : "border-zinc-700 text-zinc-500 hover:text-zinc-400"
              }`}
            >
              {m === "input" ? "input masking" : "loss-only masking"}
            </button>
          ))}
        </div>
      </div>
      <div ref={wrapRef} className="relative overflow-hidden" style={{ aspectRatio: "100/52" }}>
        <canvas ref={canvasRef} className="absolute top-0 left-0" style={{ cursor: "crosshair" }} />
      </div>
      <div className="px-4 py-2 border-t border-zinc-800 flex items-center gap-4">
        <label className="flex items-center gap-2 text-xs font-mono text-zinc-500">
          masking ratio
          <input
            type="range"
            min={5}
            max={75}
            value={Math.round(ratio * 100)}
            onChange={(e) => setRatio(Number(e.target.value) / 100)}
            className="w-28 accent-amber-500"
          />
          <span className="text-zinc-400 w-8">{Math.round(ratio * 100)}%</span>
        </label>
        <span className="text-xs font-mono text-zinc-600 ml-auto">
          {ratio >= 0.28 && ratio <= 0.38
            ? <span className="text-teal-500">within sweet spot (28–38%)</span>
            : ratio < 0.28
            ? "below sweet spot — too easy"
            : "above sweet spot — fragmented context"}
        </span>
      </div>
    </div>
  );
}
