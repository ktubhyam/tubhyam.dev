/**
 * DisentanglementTracker — Animated TensorBoard-style chart of 3 training curves
 * over 50K steps: z_chem domain acc (drops to chance), z_inst domain acc (rises),
 * z_chem mol acc (rises). Cursor sweeps on scroll entry; hover crosshair.
 */
import { useRef, useEffect, useState } from "react";

function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s |= 0; s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function sigmoid(x: number, center: number, k: number): number {
  return 1 / (1 + Math.exp(-k * (x - center)));
}

const N = 300; // data points
const SWEEP_DUR = 3500; // ms for cursor to cross full width
const PAD = { l: 52, r: 88, t: 28, b: 36 };

// Color palette
const C_GREEN = "#34D399";
const C_AMBER = "#C9A04A";
const C_TEAL  = "#4ECDC4";

function hexToRgb(hex: string): [number,number,number] {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
}

function generateCurves(rng: () => number) {
  const pts = Array.from({ length: N }, (_, i) => i / (N - 1));
  // z_chem domain acc: 82% → 52.1% (sigmoid drop at 0.30)
  const zchemDomain = pts.map(s => {
    const base = 0.821 - (0.821 - 0.521) * sigmoid(s, 0.30, 16);
    return Math.max(0.49, Math.min(0.99, base + (rng() - 0.5) * 0.018));
  });
  // z_inst domain acc: 54% → 94.7% (sigmoid rise at 0.30)
  const zinstDomain = pts.map(s => {
    const base = 0.54 + (0.947 - 0.54) * sigmoid(s, 0.30, 16);
    return Math.max(0.40, Math.min(0.99, base + (rng() - 0.5) * 0.018));
  });
  // z_chem mol acc: 38% → 87.3% (exp rise)
  const zchemMol = pts.map(s => {
    const base = 0.38 + (0.873 - 0.38) * (1 - Math.exp(-4.2 * s));
    return Math.max(0.30, Math.min(0.95, base + (rng() - 0.5) * 0.013));
  });
  return { zchemDomain, zinstDomain, zchemMol };
}

const rng = mulberry32(0xCAFEBABE);
const CURVES = generateCurves(rng);

export default function DisentanglementTracker() {
  const wrapRef  = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const replayRef = useRef<(() => void) | null>(null);
  const [stepLabel, setStepLabel] = useState("step 0");

  useEffect(() => {
    const wrap = wrapRef.current!;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;

    let raf = 0, paused = false;
    let cssW = 0, cssH = 0;
    let cursorT = 0; // 0..1 across x-axis
    let playing = false;
    let playStart = 0;
    let lastNow = performance.now();
    let mouseX = -1, mouseY = -1;
    let hasPlayed = false;

    function toX(t: number) { return PAD.l + t * (cssW - PAD.l - PAD.r); }
    function toY(v: number) { return PAD.t + (1 - v) * (cssH - PAD.t - PAD.b); }
    function fromX(px: number) { return Math.max(0, Math.min(1, (px - PAD.l) / (cssW - PAD.l - PAD.r))); }

    function play() {
      playing = true;
      playStart = performance.now() - cursorT * SWEEP_DUR;
    }

    replayRef.current = () => { cursorT = 0; play(); };

    function drawBetaRegion() {
      const x0 = toX(0), x1 = toX(0.6);
      ctx.fillStyle = "rgba(113,113,122,0.07)";
      ctx.fillRect(x0, PAD.t, x1 - x0, cssH - PAD.t - PAD.b);
      ctx.fillStyle = "rgba(113,113,122,0.45)";
      ctx.font = "9px monospace"; ctx.textAlign = "center";
      ctx.fillText("β annealing", (x0 + x1) / 2, PAD.t + 11);
    }

    function drawBaseline() {
      ctx.save();
      ctx.setLineDash([4, 5]);
      ctx.strokeStyle = "rgba(113,113,122,0.35)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(toX(0), toY(0.5));
      ctx.lineTo(toX(1), toY(0.5));
      ctx.stroke();
      ctx.restore();
      ctx.fillStyle = "rgba(113,113,122,0.5)";
      ctx.font = "9px monospace"; ctx.textAlign = "left";
      ctx.fillText("chance", toX(0) + 2, toY(0.5) - 3);
    }

    function drawAxes() {
      ctx.strokeStyle = "rgba(63,63,70,0.5)"; ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(PAD.l, PAD.t); ctx.lineTo(PAD.l, cssH - PAD.b);
      ctx.lineTo(cssW - PAD.r, cssH - PAD.b);
      ctx.stroke();

      // Y-axis ticks
      ctx.fillStyle = "rgba(113,113,122,0.6)"; ctx.font = "9px monospace";
      for (const v of [0.5, 0.75, 1.0]) {
        const y = toY(v);
        ctx.textAlign = "right";
        ctx.fillText(`${(v * 100).toFixed(0)}%`, PAD.l - 4, y + 3);
        ctx.strokeStyle = "rgba(63,63,70,0.25)"; ctx.lineWidth = 0.5;
        ctx.beginPath(); ctx.moveTo(PAD.l, y); ctx.lineTo(cssW - PAD.r, y); ctx.stroke();
      }

      // X-axis labels
      ctx.textAlign = "center";
      for (const step of [0, 10000, 20000, 30000, 40000, 50000]) {
        const x = toX(step / 50000);
        ctx.fillStyle = "rgba(113,113,122,0.6)";
        ctx.fillText(step === 0 ? "0" : `${step/1000}K`, x, cssH - PAD.b + 13);
      }
      ctx.fillStyle = "rgba(113,113,122,0.5)"; ctx.font = "9px monospace";
      ctx.textAlign = "center";
      ctx.fillText("training steps", cssW / 2, cssH - 4);
    }

    function drawCurve(data: number[], color: string, endIdx: number) {
      if (endIdx < 1) return;
      const [r, g, b] = hexToRgb(color);
      ctx.lineWidth = 2; ctx.lineJoin = "round"; ctx.lineCap = "round";
      ctx.strokeStyle = color;
      ctx.beginPath();
      for (let i = 0; i <= Math.min(endIdx, N - 1); i++) {
        const x = toX(i / (N - 1));
        const y = toY(data[i]);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Glow
      ctx.lineWidth = 6;
      ctx.strokeStyle = `rgba(${r},${g},${b},0.12)`;
      ctx.beginPath();
      for (let i = 0; i <= Math.min(endIdx, N - 1); i++) {
        const x = toX(i / (N - 1));
        const y = toY(data[i]);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    function drawFinalLabels(endIdx: number) {
      if (endIdx < N - 2) return;
      const curves = [
        { data: CURVES.zchemDomain, color: C_GREEN,  label: "z_chem dom" },
        { data: CURVES.zinstDomain, color: C_AMBER,  label: "z_inst dom" },
        { data: CURVES.zchemMol,    color: C_TEAL,   label: "z_chem mol" },
      ];
      ctx.font = "10px monospace"; ctx.textAlign = "left";
      for (const c of curves) {
        const v = c.data[N - 1];
        const y = toY(v);
        ctx.fillStyle = c.color;
        ctx.fillText(`${(v * 100).toFixed(1)}%`, cssW - PAD.r + 4, y + 3);
      }
    }

    function drawCursor(cursorX: number) {
      const g = ctx.createLinearGradient(cursorX, PAD.t, cursorX, cssH - PAD.b);
      g.addColorStop(0, "rgba(255,255,255,0)");
      g.addColorStop(0.15, "rgba(255,255,255,0.14)");
      g.addColorStop(0.85, "rgba(255,255,255,0.14)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.fillRect(cursorX - 1, PAD.t, 2, cssH - PAD.t - PAD.b);
    }

    function drawHoverCrosshair(hoverT: number) {
      if (hoverT < 0 || hoverT > cursorT + 0.001) return;
      const idx = Math.round(hoverT * (N - 1));
      const x = toX(hoverT);

      // Vertical line
      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(x, PAD.t); ctx.lineTo(x, cssH - PAD.b); ctx.stroke();
      ctx.setLineDash([]);

      // Dots + tooltip
      const vals = [
        { data: CURVES.zchemDomain, color: C_GREEN,  label: "z_chem dom" },
        { data: CURVES.zinstDomain, color: C_AMBER,  label: "z_inst dom" },
        { data: CURVES.zchemMol,    color: C_TEAL,   label: "z_chem mol" },
      ];

      let tooltipLines: string[] = [`step ${Math.round(hoverT * 50000).toLocaleString()}`];
      for (const c of vals) {
        const v = c.data[Math.min(idx, N - 1)];
        const y = toY(v);
        ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = c.color; ctx.fill();
        ctx.strokeStyle = "rgba(0,0,0,0.5)"; ctx.lineWidth = 1; ctx.stroke();
        tooltipLines.push(`${c.label}: ${(v * 100).toFixed(1)}%`);
      }

      // Tooltip box
      ctx.font = "10px monospace";
      const maxW = Math.max(...tooltipLines.map(l => ctx.measureText(l).width));
      const boxW = maxW + 16, boxH = tooltipLines.length * 15 + 8;
      let tx = x + 8, ty = Math.max(PAD.t, mouseY - boxH / 2);
      if (tx + boxW > cssW - 4) tx = x - boxW - 8;
      ctx.fillStyle = "rgba(9,9,11,0.92)";
      ctx.beginPath();
      if ((ctx as any).roundRect) (ctx as any).roundRect(tx, ty, boxW, boxH, 4);
      else ctx.rect(tx, ty, boxW, boxH);
      ctx.fill();
      ctx.fillStyle = "#e4e4e7"; ctx.textAlign = "left";
      for (let i = 0; i < tooltipLines.length; i++) {
        ctx.fillStyle = i === 0 ? "#a1a1aa" : [C_GREEN, C_AMBER, C_TEAL][i - 1];
        ctx.fillText(tooltipLines[i], tx + 8, ty + 13 + i * 15);
      }
    }

    function drawLegend() {
      const items = [
        { color: C_GREEN, label: "z_chem domain acc" },
        { color: C_AMBER, label: "z_inst domain acc" },
        { color: C_TEAL,  label: "z_chem mol acc"   },
      ];
      ctx.font = "9px monospace"; ctx.textAlign = "left";
      for (let i = 0; i < items.length; i++) {
        const lx = PAD.l + 8, ly = PAD.t + 14 + i * 14;
        ctx.beginPath(); ctx.arc(lx, ly - 4, 3, 0, Math.PI * 2);
        ctx.fillStyle = items[i].color; ctx.fill();
        ctx.fillStyle = "rgba(113,113,122,0.8)";
        ctx.fillText(items[i].label, lx + 7, ly);
      }
    }

    function resize() {
      const r = wrap.getBoundingClientRect();
      cssW = r.width || 600;
      cssH = Math.round(cssW * 0.48);
      const dpr = devicePixelRatio || 1;
      canvas.width = cssW * dpr; canvas.height = cssH * dpr;
      canvas.style.width = cssW + "px"; canvas.style.height = cssH + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function draw(now: number) {
      lastNow = now;
      if (!paused && playing) {
        cursorT = Math.min(1, (now - playStart) / SWEEP_DUR);
        if (cursorT >= 1) { playing = false; cursorT = 1; }
        const step = Math.round(cursorT * 50000);
        setStepLabel(`step ${step.toLocaleString()}`);
      }

      const w = cssW, h = cssH;
      ctx.clearRect(0, 0, w, h);
      drawBetaRegion();
      drawBaseline();
      drawAxes();

      const endIdx = Math.round(cursorT * (N - 1));
      drawCurve(CURVES.zchemDomain, C_GREEN, endIdx);
      drawCurve(CURVES.zinstDomain, C_AMBER, endIdx);
      drawCurve(CURVES.zchemMol,    C_TEAL,  endIdx);
      drawFinalLabels(endIdx);

      if (cursorT < 1) drawCursor(toX(cursorT));

      if (mouseX >= PAD.l && mouseX <= cssW - PAD.r) {
        drawHoverCrosshair(fromX(mouseX));
      }

      drawLegend();
      raf = requestAnimationFrame(draw);
    }

    canvas.addEventListener("mousemove", (e) => {
      const r = canvas.getBoundingClientRect();
      mouseX = e.clientX - r.left;
      mouseY = e.clientY - r.top;
    });
    canvas.addEventListener("mouseleave", () => { mouseX = -1; mouseY = -1; });

    const visObs = new IntersectionObserver(([e]) => {
      paused = !e.isIntersecting;
      if (e.isIntersecting && !hasPlayed) {
        hasPlayed = true;
        cursorT = 0;
        play();
      }
    });
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
        <span className="text-xs font-mono text-zinc-400">disentanglement tracker — training dynamics</span>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-zinc-500">{stepLabel}</span>
          <button
            onClick={() => replayRef.current?.()}
            className="text-xs font-mono px-2 py-1 rounded border border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 transition-colors"
            title="Replay animation"
          >
            ↺
          </button>
        </div>
      </div>
      <div ref={wrapRef} className="relative">
        <canvas ref={canvasRef} style={{ cursor: "crosshair", display: "block" }} />
      </div>
      <div className="px-4 py-2 border-t border-zinc-800 text-xs font-mono text-zinc-500">
        z_chem domain acc → chance level (52.1%) · z_inst domain acc ↑ (94.7%) · z_chem mol acc ↑ (87.3%)
      </div>
    </div>
  );
}
