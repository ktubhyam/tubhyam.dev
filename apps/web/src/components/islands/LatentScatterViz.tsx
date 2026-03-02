/**
 * LatentScatterViz — UMAP-projection scatter of z_chem before/after VIB.
 * 16 points: 8 molecules × 2 instruments.
 * Toggle morphs instrument blobs → paired molecular clusters with spring animation.
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

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function lerpRgb(a: string, b: string, t: number): [number, number, number] {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  return [(r1 + (r2 - r1) * t) | 0, (g1 + (g2 - g1) * t) | 0, (b1 + (b2 - b1) * t) | 0];
}

const MOLECULES = ["CH₄", "C₂H₆", "CO₂", "NH₃", "C₆H₆", "CH₃OH", "N₂", "H₂O"];
const MOL_COLORS = ["#4ECDC4", "#C9A04A", "#A78BFA", "#34D399", "#60A5FA", "#F87171", "#FBBF24", "#818CF8"];
const INST_COLORS = ["#4ECDC4", "#C9A04A"];
const TRANS_DUR = 950;
const PAD = { l: 44, r: 24, t: 20, b: 32 };

interface Pt {
  mol: number; inst: number;
  bx: number; by: number;
  ax: number; ay: number;
  phase: number; freq: number;
}

export default function LatentScatterViz() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const toggleRef = useRef<(() => void) | null>(null);
  const [label, setLabel] = useState("apply VIB →");
  const [caption, setCaption] = useState("16 points (8 molecules × 2 instruments) — colored by instrument");

  useEffect(() => {
    const wrap = wrapRef.current!;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const rng = mulberry32(0xDEADBEEF);

    const pts: Pt[] = [];
    for (let m = 0; m < 8; m++) {
      for (let inst = 0; inst < 2; inst++) {
        const bx = (inst === 0 ? 0.28 : 0.72) + (rng() - 0.5) * 0.22;
        const by = 0.5 + (rng() - 0.5) * 0.24;
        const angle = (m / 8) * Math.PI * 2 - Math.PI / 2;
        const ax = 0.5 + Math.cos(angle) * 0.32 + (rng() - 0.5) * 0.035 + (inst === 0 ? -0.018 : 0.018);
        const ay = 0.5 + Math.sin(angle) * 0.29 + (rng() - 0.5) * 0.035 + (inst === 0 ? -0.015 : 0.015);
        pts.push({ mol: m, inst, bx, by, ax, ay, phase: rng() * Math.PI * 2, freq: 0.7 + rng() * 0.5 });
      }
    }

    let raf = 0, paused = false;
    let startT01 = 0, targetT01 = 0;
    let transStart = 0, transitioning = false;
    let elapsed = 0, lastNow = performance.now();
    let hovered = -1;
    let cssW = 0, cssH = 0;

    function getT01(now: number): number {
      if (!transitioning) return targetT01;
      const p = Math.min(1, (now - transStart) / TRANS_DUR);
      if (p >= 1) { transitioning = false; return targetT01; }
      return startT01 + (targetT01 - startT01) * easeInOutCubic(p);
    }

    function toC(nx: number, ny: number): [number, number] {
      return [PAD.l + nx * (cssW - PAD.l - PAD.r), PAD.t + ny * (cssH - PAD.t - PAD.b)];
    }

    function ptPos(pt: Pt, t01: number): [number, number] {
      const nx = pt.bx + (pt.ax - pt.bx) * t01;
      const ny = pt.by + (pt.ay - pt.by) * t01;
      const amp = transitioning ? 0 : 0.005;
      return toC(
        nx + Math.sin(elapsed * pt.freq * 1.1 + pt.phase) * amp,
        ny + Math.cos(elapsed * pt.freq * 0.8 + pt.phase + 1) * amp,
      );
    }

    function resize() {
      const r = wrap.getBoundingClientRect();
      cssW = r.width || 500;
      cssH = Math.round(cssW * 0.54);
      const dpr = devicePixelRatio || 1;
      canvas.width = cssW * dpr; canvas.height = cssH * dpr;
      canvas.style.width = cssW + "px"; canvas.style.height = cssH + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function draw(now: number) {
      const dt = (now - lastNow) / 1000; lastNow = now;
      if (!paused) elapsed += dt;
      const t01 = getT01(now);
      const w = cssW, h = cssH;
      ctx.clearRect(0, 0, w, h);

      // Axes
      ctx.strokeStyle = "rgba(63,63,70,0.5)"; ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(PAD.l, PAD.t); ctx.lineTo(PAD.l, h - PAD.b); ctx.lineTo(w - PAD.r, h - PAD.b);
      ctx.stroke();
      ctx.fillStyle = "rgba(113,113,122,0.7)"; ctx.font = "10px monospace"; ctx.textAlign = "center";
      ctx.fillText("PC₁", w / 2, h - 4);
      ctx.save(); ctx.translate(11, h / 2); ctx.rotate(-Math.PI / 2);
      ctx.fillText("PC₂", 0, 0); ctx.restore();

      // Instrument halos (fade out as VIB applied)
      const haloA = Math.max(0, 1 - t01 * 2.2);
      if (haloA > 0.005) {
        for (let inst = 0; inst < 2; inst++) {
          const [hx, hy] = toC(inst === 0 ? 0.28 : 0.72, 0.5);
          const r = (w - PAD.l - PAD.r) * 0.16;
          const [ir, ig, ib] = hexToRgb(INST_COLORS[inst]);
          const g = ctx.createRadialGradient(hx, hy, 0, hx, hy, r);
          g.addColorStop(0, `rgba(${ir},${ig},${ib},${0.14 * haloA})`);
          g.addColorStop(1, `rgba(${ir},${ig},${ib},0)`);
          ctx.beginPath(); ctx.arc(hx, hy, r, 0, Math.PI * 2);
          ctx.fillStyle = g; ctx.fill();
        }
      }

      // Dashed connection lines (after VIB)
      if (t01 > 0.01) {
        ctx.save(); ctx.setLineDash([3, 5]); ctx.lineWidth = 1;
        for (let m = 0; m < 8; m++) {
          const [x0, y0] = ptPos(pts[m * 2], t01);
          const [x1, y1] = ptPos(pts[m * 2 + 1], t01);
          const [mr, mg, mb] = hexToRgb(MOL_COLORS[m]);
          ctx.strokeStyle = `rgba(${mr},${mg},${mb},${0.42 * t01})`;
          ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
        }
        ctx.setLineDash([]); ctx.restore();
      }

      // Points
      for (let i = 0; i < pts.length; i++) {
        const pt = pts[i];
        const [px, py] = ptPos(pt, t01);
        const [cr, cg, cb] = lerpRgb(INST_COLORS[pt.inst], MOL_COLORS[pt.mol], t01);
        const isHov = i === hovered;
        if (isHov) {
          const g = ctx.createRadialGradient(px, py, 0, px, py, 18);
          g.addColorStop(0, `rgba(${cr},${cg},${cb},0.35)`); g.addColorStop(1, "rgba(0,0,0,0)");
          ctx.beginPath(); ctx.arc(px, py, 18, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
        }
        ctx.beginPath(); ctx.arc(px, py, isHov ? 7 : 5, 0, Math.PI * 2);
        ctx.fillStyle = `rgb(${cr},${cg},${cb})`; ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.2)"; ctx.lineWidth = 1; ctx.stroke();
      }

      // Tooltip
      if (hovered >= 0 && hovered < pts.length) {
        const pt = pts[hovered];
        const [px, py] = ptPos(pt, t01);
        const txt = `${MOLECULES[pt.mol]} · Inst ${pt.inst === 0 ? "A" : "B"}`;
        ctx.font = "bold 11px monospace";
        const tw = ctx.measureText(txt).width + 16;
        let tx = px + 10, ty = py - 14;
        if (tx + tw > w - 4) tx = px - tw - 10;
        if (ty < 4) ty = py + 14;
        ctx.fillStyle = "rgba(9,9,11,0.92)";
        ctx.beginPath();
        if ((ctx as any).roundRect) (ctx as any).roundRect(tx, ty, tw, 22, 4);
        else ctx.rect(tx, ty, tw, 22);
        ctx.fill();
        ctx.fillStyle = "#e4e4e7"; ctx.textAlign = "left"; ctx.fillText(txt, tx + 8, ty + 15);
      }

      // Legend
      ctx.font = "10px monospace"; ctx.textAlign = "left";
      if (t01 < 0.5) {
        for (let inst = 0; inst < 2; inst++) {
          const lx = PAD.l + 12, ly = PAD.t + 14 + inst * 16;
          ctx.beginPath(); ctx.arc(lx, ly - 4, 4, 0, Math.PI * 2);
          ctx.fillStyle = INST_COLORS[inst]; ctx.fill();
          ctx.fillStyle = "rgba(113,113,122,0.8)";
          ctx.fillText(`Inst ${inst === 0 ? "A" : "B"}`, lx + 9, ly);
        }
      } else {
        for (let m = 0; m < 4; m++) {
          const lx = PAD.l + 12, ly = PAD.t + 14 + m * 15;
          ctx.beginPath(); ctx.arc(lx, ly - 4, 4, 0, Math.PI * 2);
          ctx.fillStyle = MOL_COLORS[m]; ctx.fill();
          ctx.fillStyle = "rgba(113,113,122,0.8)";
          ctx.fillText(MOLECULES[m], lx + 9, ly);
        }
      }

      raf = requestAnimationFrame(draw);
    }

    canvas.addEventListener("mousemove", (e) => {
      const r = canvas.getBoundingClientRect();
      const mx = e.clientX - r.left, my = e.clientY - r.top;
      const t01 = getT01(performance.now());
      let best = -1, bestD = 196;
      for (let i = 0; i < pts.length; i++) {
        const [px, py] = ptPos(pts[i], t01);
        const d = (px - mx) ** 2 + (py - my) ** 2;
        if (d < bestD) { bestD = d; best = i; }
      }
      hovered = best;
    });
    canvas.addEventListener("mouseleave", () => { hovered = -1; });

    toggleRef.current = () => {
      const now = performance.now();
      startT01 = getT01(now);
      targetT01 = targetT01 === 0 ? 1 : 0;
      transStart = now; transitioning = true;
      setLabel(targetT01 === 1 ? "← before VIB" : "apply VIB →");
      setCaption(targetT01 === 1
        ? "same points — rearranged by molecule, instrument pairs connected"
        : "16 points (8 molecules × 2 instruments) — colored by instrument");
    };

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
        <span className="text-xs font-mono text-zinc-400">latent space — z_chem (UMAP projection)</span>
        <button
          onClick={() => toggleRef.current?.()}
          className="text-xs font-mono px-3 py-1 rounded border border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-zinc-500 hover:text-zinc-100 transition-colors"
        >
          {label}
        </button>
      </div>
      <div ref={wrapRef} className="relative overflow-hidden" style={{ aspectRatio: "100/54" }}>
        <canvas ref={canvasRef} className="absolute top-0 left-0" style={{ cursor: "crosshair" }} />
      </div>
      <div className="px-4 py-2 border-t border-zinc-800 text-xs font-mono text-zinc-500">{caption}</div>
    </div>
  );
}
