import { useRef, useEffect, useState, useCallback } from "react";

const RATIO = 50 / 100;
const N = 8; // 8-bin spectra
const N_ITERS = 8;
const TEAL = "#4ECDC4";
const AMBER = "#C9A04A";
const ZINC700 = "#3f3f46";
const ZINC500 = "#71717a";
const ZINC900 = "#18181b";

// Source: a simple "shifted" version of target
const SOURCE_HEIGHTS = [0.2, 0.7, 0.95, 0.5, 0.3, 0.15, 0.6, 0.4];
const TARGET_HEIGHTS = [0.15, 0.3, 0.5, 0.95, 0.7, 0.4, 0.2, 0.25];

function normalize(arr: number[]): number[] {
  const sum = arr.reduce((a, b) => a + b, 0);
  return arr.map((v) => v / sum);
}

const SRC_NORM = normalize(SOURCE_HEIGHTS);
const TGT_NORM = normalize(TARGET_HEIGHTS);
const EPS = 2.0;

// Pre-compute Sinkhorn plan at each iteration
function computeSinkhornSteps(): number[][][] {
  const n = N;
  // Cost matrix
  const C: number[][] = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i - j) ** 2)
  );
  const K: number[][] = C.map((row) => row.map((c) => Math.exp(-c / EPS)));

  const steps: number[][][] = [];
  const u = new Float64Array(n).fill(1);
  const v = new Float64Array(n).fill(1);

  // Iter 0: uniform plan
  const uniformVal = 1 / (n * n);
  steps.push(Array.from({ length: n }, () => Array(n).fill(uniformVal)));

  for (let iter = 0; iter < N_ITERS; iter++) {
    // One Sinkhorn step
    for (let i = 0; i < n; i++) {
      let Kv = 0;
      for (let j = 0; j < n; j++) Kv += K[i][j] * v[j];
      u[i] = Kv > 1e-30 ? SRC_NORM[i] / Kv : 0;
    }
    for (let j = 0; j < n; j++) {
      let Ktu = 0;
      for (let i = 0; i < n; i++) Ktu += K[i][j] * u[i];
      v[j] = Ktu > 1e-30 ? TGT_NORM[j] / Ktu : 0;
    }
    // Record plan
    const plan: number[][] = Array.from({ length: n }, (_, i) =>
      Array.from({ length: n }, (_, j) => u[i] * K[i][j] * v[j])
    );
    steps.push(plan);
  }
  return steps;
}

const SINKHORN_STEPS = computeSinkhornSteps();

// Marginal residual per step
function marginalResidual(plan: number[][]): number {
  let err = 0;
  for (let i = 0; i < N; i++) {
    let rowSum = 0;
    for (let j = 0; j < N; j++) rowSum += plan[i][j];
    err += Math.abs(rowSum - SRC_NORM[i]);
  }
  return err / N;
}

const RESIDUALS = SINKHORN_STEPS.map(marginalResidual);

export default function SinkhornConvergenceViz() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [iter, setIter] = useState(0);
  const [playing, setPlaying] = useState(false);
  const iterRef = useRef(iter);
  const playingRef = useRef(playing);
  iterRef.current = iter;
  playingRef.current = playing;

  // Animated interpolation between plan states
  const animTRef = useRef(1.0);
  const prevIterRef = useRef(0);

  const step = useCallback(() => {
    setIter((i) => {
      if (i >= N_ITERS) { setPlaying(false); return i; }
      prevIterRef.current = i;
      animTRef.current = 0;
      return i + 1;
    });
  }, []);

  // Auto-play interval
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setIter((i) => {
        if (i >= N_ITERS) { setPlaying(false); return i; }
        prevIterRef.current = i;
        animTRef.current = 0;
        return i + 1;
      });
    }, 800);
    return () => clearInterval(id);
  }, [playing]);

  useEffect(() => {
    const wrap = wrapRef.current!;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let raf = 0, paused = false, cssW = 0, cssH = 0;
    let lastTime = 0;

    function resize() {
      const r = wrap.getBoundingClientRect();
      cssW = r.width || 600; cssH = Math.round(cssW * RATIO);
      const dpr = devicePixelRatio || 1;
      canvas.width = cssW * dpr; canvas.height = cssH * dpr;
      canvas.style.width = cssW + "px"; canvas.style.height = cssH + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function draw(now: number) {
      if (!paused) {
        const dt = Math.min(0.1, (now - lastTime) / 1000);
        lastTime = now;
        animTRef.current = Math.min(1, animTRef.current + dt * 2.5);
        const t = animTRef.current;
        const currentIter = iterRef.current;
        const prevIter = prevIterRef.current;

        ctx.clearRect(0, 0, cssW, cssH);

        const leftW = cssW * 0.28;
        const rightW = cssW * 0.28;
        const centerX = leftW + cssW * 0.02;
        const centerW = cssW - leftW - rightW - cssW * 0.04;
        const padTop = cssH * 0.08;
        const padBot = cssH * 0.12;
        const specH = cssH - padTop - padBot;

        // --- SOURCE BARS (left) ---
        const srcBarW = leftW / (N + 2);
        const srcBarGap = srcBarW * 0.2;
        const maxSrcH = specH * 0.9;

        ctx.font = `${Math.max(7, cssW * 0.014)}px monospace`;
        ctx.fillStyle = ZINC500;
        ctx.textAlign = "center";
        ctx.fillText("source μ", leftW / 2, padTop * 0.6);

        for (let i = 0; i < N; i++) {
          const bh = SOURCE_HEIGHTS[i] * maxSrcH;
          const bx = srcBarGap + i * (srcBarW + srcBarGap / (N - 1));
          const by = padTop + specH - bh;
          ctx.fillStyle = TEAL + "99";
          ctx.strokeStyle = TEAL;
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.rect(bx, by, srcBarW, bh);
          ctx.fill();
          ctx.stroke();
        }

        // --- TARGET BARS (right) ---
        const tgtStartX = cssW - rightW;
        const tgtBarW = rightW / (N + 2);
        const tgtBarGap = tgtBarW * 0.2;

        ctx.fillStyle = ZINC500;
        ctx.textAlign = "center";
        ctx.fillText("target ν", tgtStartX + rightW / 2, padTop * 0.6);

        for (let i = 0; i < N; i++) {
          const bh = TARGET_HEIGHTS[i] * maxSrcH;
          const bx = tgtStartX + tgtBarGap + i * (tgtBarW + tgtBarGap / (N - 1));
          const by = padTop + specH - bh;
          ctx.fillStyle = AMBER + "99";
          ctx.strokeStyle = AMBER;
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.rect(bx, by, tgtBarW, bh);
          ctx.fill();
          ctx.stroke();
        }

        // --- TRANSPORT PLAN HEATMAP (center) ---
        ctx.fillStyle = ZINC500;
        ctx.textAlign = "center";
        ctx.fillText("transport plan π", centerX + centerW / 2, padTop * 0.6);

        const cellW = centerW / N;
        const cellH = specH / N;

        // Get current and previous plan (interpolate)
        const curPlan = SINKHORN_STEPS[currentIter];
        const prevPlan = SINKHORN_STEPS[prevIter];

        // Find max for normalization
        let maxVal = 0;
        for (let i = 0; i < N; i++)
          for (let j = 0; j < N; j++)
            maxVal = Math.max(maxVal, curPlan[i][j]);

        for (let i = 0; i < N; i++) {
          for (let j = 0; j < N; j++) {
            const curV = curPlan[i][j] / (maxVal || 1);
            const prevV = prevPlan[i][j] / (maxVal || 1);
            const v = prevV + (curV - prevV) * t;

            const cx2 = centerX + j * cellW;
            const cy2 = padTop + i * cellH;

            // Color: dim teal at 0, bright teal at 1
            const alpha = Math.max(0.04, v);
            ctx.fillStyle = `rgba(78,205,196,${alpha.toFixed(3)})`;
            ctx.beginPath();
            ctx.rect(cx2 + 0.5, cy2 + 0.5, cellW - 1, cellH - 1);
            ctx.fill();
          }
        }

        // Grid lines
        ctx.strokeStyle = ZINC900;
        ctx.lineWidth = 0.5;
        for (let i = 0; i <= N; i++) {
          ctx.beginPath();
          ctx.moveTo(centerX, padTop + i * cellH);
          ctx.lineTo(centerX + centerW, padTop + i * cellH);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(centerX + i * cellW, padTop);
          ctx.lineTo(centerX + i * cellW, padTop + specH);
          ctx.stroke();
        }

        // Heatmap border
        ctx.strokeStyle = ZINC700;
        ctx.lineWidth = 1;
        ctx.strokeRect(centerX, padTop, centerW, specH);

        // Axis labels i (source row) and j (target col) — small
        const labelFs = Math.max(6, cssW * 0.012);
        ctx.font = `${labelFs}px monospace`;
        ctx.fillStyle = ZINC500;
        for (let i = 0; i < N; i++) {
          ctx.textAlign = "right";
          ctx.fillText(`${i}`, centerX - 2, padTop + i * cellH + cellH / 2 + 3);
          ctx.textAlign = "center";
          ctx.fillText(`${i}`, centerX + i * cellW + cellW / 2, padTop + specH + 8);
        }
        ctx.fillStyle = ZINC500;
        ctx.textAlign = "center";
        ctx.fillText("j (target)", centerX + centerW / 2, padTop + specH + cssH * 0.06);
        ctx.save();
        ctx.translate(centerX - cssW * 0.03, padTop + specH / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.textAlign = "center";
        ctx.fillText("i (source)", 0, 0);
        ctx.restore();

        // --- MARGINAL RESIDUAL BAR (below heatmap) ---
        const residY = padTop + specH + cssH * 0.03;
        const residH = cssH * 0.03;
        const maxResid = RESIDUALS[0] || 1;
        const curResid = RESIDUALS[currentIter];
        const prevResid = RESIDUALS[prevIter];
        const dispResid = prevResid + (curResid - prevResid) * t;
        const residFrac = Math.max(0, Math.min(1, dispResid / maxResid));

        ctx.fillStyle = ZINC700;
        ctx.beginPath();
        ctx.rect(centerX, residY, centerW, residH);
        ctx.fill();

        const residColor = residFrac > 0.5 ? "#F87171" : residFrac > 0.1 ? AMBER : "#34D399";
        ctx.fillStyle = residColor;
        ctx.beginPath();
        ctx.rect(centerX, residY, centerW * residFrac, residH);
        ctx.fill();

        ctx.font = `${labelFs}px monospace`;
        ctx.fillStyle = ZINC500;
        ctx.textAlign = "left";
        ctx.fillText(`marginal residual: ${dispResid.toExponential(2)}`, centerX, residY + residH + 8);

        // Convergence flow arrows (post-convergence at iter >= 6)
        if (currentIter >= 6 && t > 0.4) {
          const fadeIn = Math.min(1, (t - 0.4) / 0.6);
          for (let i = 0; i < N; i++) {
            let maxJ = 0, maxV = 0;
            for (let j = 0; j < N; j++) {
              if (curPlan[i][j] > maxV) { maxV = curPlan[i][j]; maxJ = j; }
            }
            if (maxV / maxVal < 0.15) continue;

            const srcX = srcBarGap + i * (srcBarW + srcBarGap / (N - 1)) + srcBarW / 2;
            const srcY = padTop + specH * 0.5;
            const tgtX = tgtStartX + tgtBarGap + maxJ * (tgtBarW + tgtBarGap / (N - 1)) + tgtBarW / 2;
            const tgtY = padTop + specH * 0.5;
            const weight = maxV / maxVal;

            ctx.strokeStyle = `rgba(78,205,196,${(fadeIn * weight * 0.5).toFixed(3)})`;
            ctx.lineWidth = Math.max(0.5, weight * 2);
            ctx.beginPath();
            const cx3 = cssW / 2;
            const cy3 = padTop + (i / N) * specH + cellH / 2;
            ctx.moveTo(srcX, srcY);
            ctx.bezierCurveTo(cx3, cy3, cx3, cy3, tgtX, tgtY);
            ctx.stroke();
          }
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
        <span className="text-xs font-mono text-zinc-400">sinkhorn convergence — transport plan evolution</span>
        <span className="text-xs font-mono text-zinc-600">iter {iter} / {N_ITERS}</span>
      </div>
      <div ref={wrapRef} className="relative overflow-hidden" style={{ aspectRatio: "100/50" }}>
        <canvas ref={canvasRef} className="absolute top-0 left-0" style={{ cursor: "crosshair" }} />
      </div>
      <div className="px-4 py-2 border-t border-zinc-800 flex items-center gap-2">
        <button
          onClick={() => {
            if (iter >= N_ITERS) {
              prevIterRef.current = 0;
              animTRef.current = 1;
              setIter(0);
              setPlaying(true);
            } else {
              setPlaying((p) => !p);
            }
          }}
          className="px-3 py-1 text-xs font-mono rounded border border-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          {iter >= N_ITERS ? "restart" : playing ? "pause" : "play"}
        </button>
        <button
          onClick={step}
          disabled={iter >= N_ITERS || playing}
          className="px-3 py-1 text-xs font-mono rounded border border-zinc-700 text-zinc-400 hover:text-zinc-200 disabled:text-zinc-700 disabled:cursor-not-allowed transition-colors"
        >
          step
        </button>
        <button
          onClick={() => {
            prevIterRef.current = 0;
            animTRef.current = 1;
            setIter(0);
            setPlaying(false);
          }}
          className="px-3 py-1 text-xs font-mono rounded border border-zinc-700 text-zinc-500 hover:text-zinc-400 transition-colors"
        >
          reset
        </button>
        <span className="text-xs font-mono text-zinc-600 ml-auto">
          {iter === 0
            ? "uniform plan — no geometric structure"
            : iter < 4
            ? "sharpening — transport corridors forming"
            : iter < N_ITERS
            ? "converging — diagonal structure emerging"
            : "converged — marginal residual < 0.001"}
        </span>
      </div>
    </div>
  );
}
