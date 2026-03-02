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

const RATIO = 54 / 100;
const TEAL = "#4ECDC4";
const AMBER = "#C9A04A";

export default function PeakMorphologyViz() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [shape, setShape] = useState(0.5);
  const [width, setWidth] = useState(20);
  const [asymmetry, setAsymmetry] = useState(0);

  const shapeRef = useRef(shape);
  const widthRef = useRef(width);
  const asymmetryRef = useRef(asymmetry);

  useEffect(() => { shapeRef.current = shape; }, [shape]);
  useEffect(() => { widthRef.current = width; }, [width]);
  useEffect(() => { asymmetryRef.current = asymmetry; }, [asymmetry]);

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

    function gaussian(x: number, mu: number, sigma: number): number {
      return Math.exp(-((x - mu) ** 2) / (2 * sigma * sigma));
    }
    function lorentzian(x: number, mu: number, gamma: number): number {
      return 1 / (1 + ((x - mu) / gamma) ** 2);
    }
    function peakVal(x: number, mu: number, hw: number, shp: number, asym: number): number {
      const base = shp < 0.5
        ? gaussian(x, mu, hw * (1 - shp * 2))
        : lorentzian(x, mu, hw * ((shp - 0.5) * 2 + 0.5));
      const shoulder = asym > 0 && x > mu
        ? asym * 0.4 * Math.exp(-((x - mu) / (hw * 3)) ** 2)
        : 0;
      return Math.min(1, base + shoulder);
    }

    function fwhm(hw: number, shp: number): number {
      // Approximate FWHM in wavenumber-like units: 1 pixel ~ 1 cm⁻¹
      if (shp < 0.5) return hw * 2.355 * (1 - shp * 2) * (3500 / 600);
      return hw * 2 * ((shp - 0.5) * 2 + 0.5) * (3500 / 600);
    }

    function draw() {
      if (!paused) {
        ctx.clearRect(0, 0, cssW, cssH);

        const shp = shapeRef.current;
        const hw = widthRef.current;
        const asym = asymmetryRef.current;

        const halfW = cssW / 2;
        const leftPeakX = halfW / 2;
        const plotTop = 24;
        const plotBot = cssH - 40;
        const plotH = plotBot - plotTop;

        // --- Background panels ---
        ctx.fillStyle = "#0e0e12";
        ctx.fillRect(0, 0, halfW - 1, cssH);
        ctx.fillStyle = "#0d0f12";
        ctx.fillRect(halfW + 1, 0, halfW - 1, cssH);

        // Divider
        ctx.strokeStyle = "#27272a";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(halfW, 0); ctx.lineTo(halfW, cssH);
        ctx.stroke();

        // --- LEFT PANEL: spectral peak ---
        const nPts = Math.floor(halfW - 24);
        const peakY = (v: number) => plotBot - v * plotH * 0.85;

        // Axis
        ctx.strokeStyle = "#3f3f46";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(12, plotBot); ctx.lineTo(halfW - 8, plotBot);
        ctx.stroke();

        // Axis ticks
        ctx.fillStyle = "#52525b";
        ctx.font = "9px monospace";
        ctx.textAlign = "center";
        const ticks = ["4000", "3000", "2000", "1000", "400"];
        for (let i = 0; i < ticks.length; i++) {
          const tx = 16 + (i / (ticks.length - 1)) * (halfW - 28);
          ctx.fillText(ticks[i], tx, plotBot + 12);
          ctx.strokeStyle = "#2a2a2e";
          ctx.beginPath();
          ctx.moveTo(tx, plotBot); ctx.lineTo(tx, plotBot + 4);
          ctx.stroke();
        }

        // Build peak curve
        const pts: [number, number][] = [];
        for (let i = 0; i < nPts; i++) {
          const px = 14 + i;
          const t = i / (nPts - 1);
          const mu = leftPeakX - 14;
          const v = peakVal(i, mu, hw, shp, asym);
          pts.push([px, peakY(v)]);
        }

        // Filled area under curve
        ctx.beginPath();
        ctx.moveTo(pts[0][0], plotBot);
        for (const [px, py] of pts) ctx.lineTo(px, py);
        ctx.lineTo(pts[pts.length - 1][0], plotBot);
        ctx.closePath();
        ctx.fillStyle = TEAL + "28";
        ctx.fill();

        // Curve stroke
        ctx.beginPath();
        ctx.moveTo(pts[0][0], pts[0][1]);
        for (const [px, py] of pts) ctx.lineTo(px, py);
        ctx.strokeStyle = TEAL;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // CNN kernel indicator: dashed vertical lines showing 3×3 coverage
        const kernelHalfPx = 3;
        const leftPeakXCanvas = leftPeakX;
        ctx.strokeStyle = "#F87171";
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(leftPeakXCanvas - kernelHalfPx, plotTop);
        ctx.lineTo(leftPeakXCanvas - kernelHalfPx, plotBot);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(leftPeakXCanvas + kernelHalfPx, plotTop);
        ctx.lineTo(leftPeakXCanvas + kernelHalfPx, plotBot);
        ctx.stroke();
        ctx.setLineDash([]);

        // Label for kernel indicator
        ctx.fillStyle = "#F87171";
        ctx.font = "8px monospace";
        ctx.textAlign = "center";
        ctx.fillText("CNN 3×3", leftPeakXCanvas, plotTop + 2);

        // Local support estimate
        const supportPts = pts.filter(([, py]) => py < plotBot - 3).length;
        ctx.fillStyle = "#52525b";
        ctx.font = "9px monospace";
        ctx.textAlign = "left";
        ctx.fillText(`local support: ~${supportPts} pts`, 14, cssH - 6);

        // FWHM info box
        const fwhmVal = fwhm(hw, shp).toFixed(0);
        const lorentTail = shp > 0.3 ? ((hw * 4) * (3500 / 600)).toFixed(0) : "—";
        const boxX = halfW - 120; const boxY = plotTop + 6;
        ctx.fillStyle = "#18181b";
        ctx.strokeStyle = "#3f3f46";
        ctx.lineWidth = 1;
        if ((ctx as any).roundRect) (ctx as any).roundRect(boxX, boxY, 108, 30, 4);
        else ctx.rect(boxX, boxY, 108, 30);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#a1a1aa";
        ctx.font = "8px monospace";
        ctx.textAlign = "left";
        ctx.fillText(`FWHM: ${fwhmVal} cm⁻¹`, boxX + 6, boxY + 11);
        ctx.fillText(`L-tail: ${lorentTail} cm⁻¹`, boxX + 6, boxY + 22);

        // Left panel label
        ctx.fillStyle = "#71717a";
        ctx.font = "bold 9px monospace";
        ctx.textAlign = "center";
        ctx.fillText("spectral peak", halfW / 2, cssH - 18);
        ctx.fillStyle = "#52525b";
        ctx.font = "8px monospace";
        ctx.fillText(shp < 0.3 ? "Gaussian" : shp > 0.7 ? "Lorentzian" : "Voigt", halfW / 2, cssH - 8);

        // --- RIGHT PANEL: 2D image blob ---
        const rng = mulberry32(42);
        const gridSize = 16;
        const rightPanelX = halfW + 4;
        const availW = halfW - 8;
        const availH = cssH - 32;
        const cellW = availW / (gridSize + 2);
        const cellH = availH / (gridSize + 4);
        const cellSize = Math.min(cellW, cellH);
        const blobStartX = rightPanelX + (availW - gridSize * cellSize) / 2;
        const blobStartY = plotTop + 4;

        const blobCx = gridSize / 2 - 0.5;
        const blobCy = gridSize / 2 - 0.5;
        const blobSigma = hw / 6;

        for (let row = 0; row < gridSize; row++) {
          for (let col = 0; col < gridSize; col++) {
            const dx = col - blobCx; const dy = row - blobCy;
            let v: number;
            if (shp < 0.5) {
              const s = blobSigma * (1 - shp * 2) + 1;
              v = Math.exp(-(dx * dx + dy * dy) / (2 * s * s));
            } else {
              const g = blobSigma * ((shp - 0.5) * 2 + 0.5) + 0.5;
              v = 1 / (1 + (dx * dx + dy * dy) / (g * g));
            }
            v = Math.max(0, Math.min(1, v + (rng() - 0.5) * 0.04));
            const alpha = v * 0.9;
            const r = Math.round(96 * (1 - v) + 60 * v);
            const g2 = Math.round(165 * v);
            const b = Math.round(250 * v);
            ctx.fillStyle = `rgba(${r},${g2},${b},${alpha})`;
            ctx.fillRect(
              blobStartX + col * cellSize,
              blobStartY + row * cellSize,
              cellSize - 0.5,
              cellSize - 0.5
            );
          }
        }

        // Grid border
        ctx.strokeStyle = "#27272a";
        ctx.lineWidth = 0.5;
        ctx.strokeRect(blobStartX, blobStartY, gridSize * cellSize, gridSize * cellSize);

        // Right label
        const blobBot = blobStartY + gridSize * cellSize;
        ctx.fillStyle = "#52525b";
        ctx.font = "9px monospace";
        ctx.textAlign = "center";
        const rightMid = halfW + availW / 2 + 4;
        ctx.fillText(`local support: ${Math.ceil(blobSigma * 3)}×${Math.ceil(blobSigma * 3)} px`, rightMid, blobBot + 12);

        ctx.fillStyle = "#71717a";
        ctx.font = "bold 9px monospace";
        ctx.fillText("image feature", rightMid, cssH - 18);
        ctx.fillStyle = "#52525b";
        ctx.font = "8px monospace";
        ctx.fillText("compact, bounded", rightMid, cssH - 8);
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
        <span className="text-xs font-mono text-zinc-400">peak morphology — spectral vs image features</span>
      </div>
      <div ref={wrapRef} className="relative overflow-hidden" style={{ aspectRatio: "100/54" }}>
        <canvas ref={canvasRef} className="absolute top-0 left-0" style={{ cursor: "crosshair" }} />
      </div>
      <div className="px-4 py-3 border-t border-zinc-800 space-y-2">
        <div className="flex flex-col sm:flex-row gap-3">
          <label className="flex items-center gap-2 flex-1 text-xs font-mono text-zinc-400">
            <span className="w-20 shrink-0">Shape</span>
            <input
              type="range" min={0} max={1} step={0.01} value={shape}
              onChange={(e) => setShape(parseFloat(e.target.value))}
              className="flex-1 accent-teal-400"
            />
            <span className="w-20 text-zinc-500">{shape < 0.3 ? "Gaussian" : shape > 0.7 ? "Lorentzian" : "Voigt"}</span>
          </label>
          <label className="flex items-center gap-2 flex-1 text-xs font-mono text-zinc-400">
            <span className="w-20 shrink-0">Width (σ/γ)</span>
            <input
              type="range" min={5} max={40} step={1} value={width}
              onChange={(e) => setWidth(parseInt(e.target.value))}
              className="flex-1 accent-teal-400"
            />
            <span className="w-20 text-zinc-500">{width} px</span>
          </label>
          <label className="flex items-center gap-2 flex-1 text-xs font-mono text-zinc-400">
            <span className="w-20 shrink-0">Asymmetry</span>
            <input
              type="range" min={0} max={1} step={0.01} value={asymmetry}
              onChange={(e) => setAsymmetry(parseFloat(e.target.value))}
              className="flex-1 accent-teal-400"
            />
            <span className="w-20 text-zinc-500">{asymmetry.toFixed(2)}</span>
          </label>
        </div>
        <p className="text-xs font-mono text-zinc-500">
          Red dashes = CNN 3×3 kernel view. Lorentzian tails extend far beyond what any local kernel captures — SSMs see the full sequence.
        </p>
      </div>
    </div>
  );
}
