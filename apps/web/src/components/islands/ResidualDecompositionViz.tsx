import { useRef, useEffect, useState, useCallback } from "react";

const RATIO = 46 / 100;
const T_MAX = 24;      // hours
const N_PTS = 240;     // time points
const CATALYST_H = 12; // hours — event time

function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Curves {
  trueState: number[];
  physicsModel: number[];
  neuralODE: number[];
}

function buildCurves(): Curves {
  const rng = mulberry32(0xabcdef01);
  const trueState: number[] = [];
  const physicsModel: number[] = [];
  const neuralODE: number[] = [];

  for (let i = 0; i < N_PTS; i++) {
    const t = (i / (N_PTS - 1)) * T_MAX;
    const noise = (rng() - 0.5) * 0.025;

    // True state: sinusoidal with drift + sharp drop after catalyst event
    const base = 0.65 + 0.15 * Math.sin(t * 0.4 + 0.5);
    const drift = t > CATALYST_H
      ? -0.22 * (1 - Math.exp(-(t - CATALYST_H) * 0.25))
      : 0;
    trueState.push(Math.max(0.05, Math.min(1.0, base + drift + noise)));

    // Physics model: accurate early, diverges after hour 12
    const physBase = 0.65 + 0.15 * Math.sin(t * 0.4 + 0.5);
    const physDrift = t > CATALYST_H
      ? 0.18 * (1 - Math.exp(-(t - CATALYST_H) * 0.18))
      : 0;
    physicsModel.push(Math.max(0.05, Math.min(1.0, physBase + physDrift + noise * 0.3)));

    // Neural ODE: closely tracks true state
    const neuralNoise = (rng() - 0.5) * 0.012;
    neuralODE.push(Math.max(0.05, Math.min(1.0, base + drift + neuralNoise)));
  }

  return { trueState, physicsModel, neuralODE };
}

const CURVES = buildCurves();

export default function ResidualDecompositionViz() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [animProgress, setAnimProgress] = useState(0); // 0–1
  const animRef = useRef(0);
  const animActiveRef = useRef(false);

  const startAnimation = useCallback(() => {
    animRef.current = 0;
    animActiveRef.current = true;
    setAnimProgress(0);
  }, []);

  // IntersectionObserver for auto-start once
  const hasStartedRef = useRef(false);

  useEffect(() => {
    const wrap = wrapRef.current!;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let raf = 0;
    let paused = false;
    let cssW = 0;
    let cssH = 0;
    const ANIM_DURATION_MS = 4000;
    let animStartMs = -1;

    function resize() {
      const r = wrap.getBoundingClientRect();
      cssW = r.width || 600;
      cssH = Math.round(cssW * RATIO);
      const dpr = devicePixelRatio || 1;
      canvas.width = cssW * dpr;
      canvas.height = cssH * dpr;
      canvas.style.width = cssW + "px";
      canvas.style.height = cssH + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function draw(now: number) {
      if (!paused && animActiveRef.current) {
        if (animStartMs < 0) animStartMs = now;
        const elapsed = now - animStartMs;
        const prog = Math.min(elapsed / ANIM_DURATION_MS, 1.0);
        animRef.current = prog;
        setAnimProgress(prog);
        if (prog >= 1.0) {
          animActiveRef.current = false;
          animStartMs = -1;
        }
      }

      if (!cssW || !cssH) {
        raf = requestAnimationFrame(draw);
        return;
      }

      const prog = animRef.current;

      ctx.clearRect(0, 0, cssW, cssH);
      ctx.fillStyle = "#09090b";
      ctx.fillRect(0, 0, cssW, cssH);

      const padT = 16;
      const padB = 28;
      const padL = 44;
      const padR = 16;
      const plotW = cssW - padL - padR;
      const plotH = cssH - padT - padB;

      function tToX(t: number): number {
        return padL + (t / T_MAX) * plotW;
      }
      function vToY(v: number): number {
        return padT + (1 - v) * plotH;
      }

      // ---- Grid ----
      ctx.strokeStyle = "#18181b";
      ctx.lineWidth = 0.5;
      for (let h = 0; h <= 6; h++) {
        const x = tToX(h * 4);
        ctx.beginPath();
        ctx.moveTo(x, padT);
        ctx.lineTo(x, padT + plotH);
        ctx.stroke();
      }
      for (let v = 0; v <= 4; v++) {
        const y = vToY(v / 4);
        ctx.beginPath();
        ctx.moveTo(padL, y);
        ctx.lineTo(padL + plotW, y);
        ctx.stroke();
      }

      // ---- Axes ----
      ctx.strokeStyle = "#3f3f46";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padL, padT);
      ctx.lineTo(padL, padT + plotH);
      ctx.lineTo(padL + plotW, padT + plotH);
      ctx.stroke();

      // Axis tick labels
      const tickFs = Math.max(8, cssW * 0.012);
      ctx.font = `${tickFs}px monospace`;
      ctx.fillStyle = "#52525b";
      ctx.textAlign = "center";
      for (let h = 0; h <= 6; h++) {
        ctx.fillText(`${h * 4}h`, tToX(h * 4), padT + plotH + 12);
      }
      ctx.textAlign = "right";
      for (let v = 0; v <= 4; v++) {
        ctx.fillText((v / 4).toFixed(2), padL - 4, vToY(v / 4) + 3);
      }

      // Y-axis label
      ctx.save();
      ctx.translate(12, padT + plotH / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = "center";
      ctx.fillStyle = "#71717a";
      ctx.font = `${Math.max(9, cssW * 0.013)}px monospace`;
      ctx.fillText("concentration", 0, 0);
      ctx.restore();

      // ---- Catalyst event line ----
      const evX = tToX(CATALYST_H);
      ctx.strokeStyle = "rgba(248,113,113,0.5)";
      ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(evX, padT);
      ctx.lineTo(evX, padT + plotH);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "#F87171";
      ctx.font = `${Math.max(8, cssW * 0.012)}px monospace`;
      ctx.textAlign = "center";
      ctx.fillText("catalyst event", evX, padT + 8);

      // How many data points to draw based on progress
      const maxIdx = Math.floor(prog * N_PTS);

      // ---- Shaded regions ----
      // Physics gap (red, alpha 0.15)
      if (maxIdx > 1) {
        ctx.beginPath();
        for (let i = 0; i < maxIdx; i++) {
          const t = (i / (N_PTS - 1)) * T_MAX;
          const x = tToX(t);
          const y = vToY(CURVES.trueState[i]);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        for (let i = maxIdx - 1; i >= 0; i--) {
          const t = (i / (N_PTS - 1)) * T_MAX;
          const x = tToX(t);
          const y = vToY(CURVES.physicsModel[i]);
          ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fillStyle = "rgba(248,113,113,0.12)";
        ctx.fill();
      }

      // Neural ODE gap (teal, alpha 0.08)
      if (maxIdx > 1) {
        ctx.beginPath();
        for (let i = 0; i < maxIdx; i++) {
          const t = (i / (N_PTS - 1)) * T_MAX;
          const x = tToX(t);
          const y = vToY(CURVES.trueState[i]);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        for (let i = maxIdx - 1; i >= 0; i--) {
          const t = (i / (N_PTS - 1)) * T_MAX;
          const x = tToX(t);
          const y = vToY(CURVES.neuralODE[i]);
          ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fillStyle = "rgba(78,205,196,0.07)";
        ctx.fill();
      }

      // ---- Curves ----
      function drawCurve(
        data: number[],
        color: string,
        lineWidth: number,
        dashed: boolean
      ) {
        if (maxIdx < 2) return;
        if (dashed) ctx.setLineDash([5, 4]);
        else ctx.setLineDash([]);
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.beginPath();
        for (let i = 0; i < maxIdx; i++) {
          const t = (i / (N_PTS - 1)) * T_MAX;
          const x = tToX(t);
          const y = vToY(data[i]);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }

      drawCurve(CURVES.physicsModel, "#60A5FA", 1.4, true);
      drawCurve(CURVES.trueState, "#34D399", 1.8, false);
      drawCurve(CURVES.neuralODE, "#4ECDC4", 1.6, false);

      // ---- Cursor (animated sweep) ----
      if (prog > 0 && prog < 1) {
        const cursorT = prog * T_MAX;
        const cursorX = tToX(cursorT);

        const cursorGrd = ctx.createLinearGradient(cursorX, padT, cursorX, padT + plotH);
        cursorGrd.addColorStop(0, "rgba(201,160,74,0)");
        cursorGrd.addColorStop(0.5, "rgba(201,160,74,0.6)");
        cursorGrd.addColorStop(1, "rgba(201,160,74,0.1)");
        ctx.strokeStyle = cursorGrd;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cursorX, padT);
        ctx.lineTo(cursorX, padT + plotH);
        ctx.stroke();
      }

      // ---- End-of-curve labels ----
      if (prog >= 1.0) {
        const labelT = T_MAX;
        const labelX = tToX(labelT) - 2;
        const labelFs = Math.max(8, cssW * 0.012);
        ctx.font = `${labelFs}px monospace`;
        ctx.textAlign = "right";

        ctx.fillStyle = "#4ECDC4";
        ctx.fillText("Neural ODE: 94.1% acc", labelX, vToY(CURVES.neuralODE[N_PTS - 1]) - 5);
        ctx.fillStyle = "#60A5FA";
        ctx.fillText("Physics only: 71.3% acc", labelX, vToY(CURVES.physicsModel[N_PTS - 1]) + 12);
      }

      // ---- Legend ----
      const legX = padL + 6;
      const legY = padT + 6;
      const legFs = Math.max(8, cssW * 0.012);
      ctx.font = `${legFs}px monospace`;
      ctx.textAlign = "left";

      ctx.strokeStyle = "#34D399";
      ctx.lineWidth = 1.8;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(legX, legY + 4);
      ctx.lineTo(legX + 14, legY + 4);
      ctx.stroke();
      ctx.fillStyle = "#71717a";
      ctx.fillText("true state", legX + 17, legY + 7);

      ctx.strokeStyle = "#60A5FA";
      ctx.lineWidth = 1.4;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(legX, legY + 16);
      ctx.lineTo(legX + 14, legY + 16);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillText("physics model", legX + 17, legY + 19);

      ctx.strokeStyle = "#4ECDC4";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(legX, legY + 28);
      ctx.lineTo(legX + 14, legY + 28);
      ctx.stroke();
      ctx.fillText("neural ODE", legX + 17, legY + 31);

      raf = requestAnimationFrame(draw);
    }

    const visObs = new IntersectionObserver(
      ([e]) => {
        paused = !e.isIntersecting;
        if (e.isIntersecting && !hasStartedRef.current) {
          hasStartedRef.current = true;
          animRef.current = 0;
          animActiveRef.current = true;
          animStartMs = -1;
        }
      },
      { threshold: 0.3 }
    );
    visObs.observe(wrap);
    const resObs = new ResizeObserver(resize);
    resObs.observe(wrap);
    resize();
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      visObs.disconnect();
      resObs.disconnect();
    };
  }, []);

  const curT = (animProgress * T_MAX).toFixed(1);

  return (
    <div className="my-8 rounded-lg border border-zinc-800 bg-zinc-950 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800">
        <span className="text-xs font-mono text-zinc-400">residual decomposition — physics vs neural ODE</span>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-zinc-400">
            t = <span className="text-zinc-200">{curT} h</span>
          </span>
          <button
            onClick={startAnimation}
            className="text-xs font-mono px-2 py-1 rounded border border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-500 transition-colors"
            title="Replay animation"
          >
            &#x21BA;
          </button>
        </div>
      </div>
      <div ref={wrapRef} className="relative overflow-hidden" style={{ aspectRatio: "100/46" }}>
        <canvas ref={canvasRef} className="absolute top-0 left-0" style={{ cursor: "default" }} />
      </div>
      <div className="px-4 py-2 border-t border-zinc-800 text-xs font-mono text-zinc-500">
        red shading: gap between physics model and truth (grows after catalyst event at 12h) &nbsp;|&nbsp; teal shading: gap for neural ODE (stays small throughout)
      </div>
    </div>
  );
}
