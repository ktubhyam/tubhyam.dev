/**
 * HeroSpectrum — Canvas-based animated IR spectrum for the hero section.
 * Renders a benzaldehyde IR spectrum with a subtle breathing animation.
 */
import { useRef, useEffect } from "react";
import { useInView } from "motion/react";

const PEAKS = [
  { center: 3450, width: 120, height: 0.55 }, // broad O-H
  { center: 3065, width: 22,  height: 0.22 }, // aromatic C-H
  { center: 2850, width: 20,  height: 0.20 }, // aldehyde C-H
  { center: 1700, width: 16,  height: 0.88 }, // C=O (strong)
  { center: 1600, width: 18,  height: 0.32 }, // aromatic C=C
  { center: 1455, width: 20,  height: 0.28 }, // C-H bend
  { center: 1305, width: 16,  height: 0.40 }, // C-O
  { center: 1170, width: 12,  height: 0.26 }, // fingerprint
  { center: 1020, width: 10,  height: 0.22 }, // fingerprint
  { center: 840,  width: 9,   height: 0.42 }, // aromatic oop
  { center: 750,  width: 8,   height: 0.36 }, // oop
  { center: 695,  width: 8,   height: 0.30 }, // oop
];

function lorentzian(x: number, c: number, w: number, h: number): number {
  return h / (1 + ((x - c) / w) ** 2);
}

interface Props { className?: string }

export default function HeroSpectrum({ className = "" }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isInView = useInView(containerRef, { once: false });
  const rafRef = useRef(0);
  const startRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isInView) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const W = canvas.clientWidth;
    const H = canvas.clientHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    const PL = 36, PR = 10, PT = 10, PB = 28;
    const pw = W - PL - PR;
    const ph = H - PT - PB;
    const XMIN = 500, XMAX = 4000;

    function xToCanvas(wn: number): number {
      // Chemistry convention: high wavenumber on left
      return PL + ((XMAX - wn) / (XMAX - XMIN)) * pw;
    }

    function drawFrame(now: number) {
      const t = (now - startRef.current) / 1000;
      ctx.clearRect(0, 0, W, H);

      // Build spectrum points (transmittance)
      const pts: [number, number][] = [];
      for (let px = 0; px <= pw; px++) {
        const wn = XMAX - (px / pw) * (XMAX - XMIN);
        let abs = 0;
        for (const p of PEAKS) abs += lorentzian(wn, p.center, p.width, p.height);
        // Subtle breathing noise
        abs += Math.sin(t * 0.6 + px * 0.018) * 0.012;
        abs = Math.max(0, Math.min(1, abs));
        const tr = 1 - abs;
        pts.push([PL + px, PT + (1 - tr) * ph]);
      }

      // Fill under curve
      ctx.beginPath();
      for (let i = 0; i < pts.length; i++) {
        if (i === 0) ctx.moveTo(pts[i][0], pts[i][1]);
        else ctx.lineTo(pts[i][0], pts[i][1]);
      }
      ctx.lineTo(PL + pw, PT + ph);
      ctx.lineTo(PL, PT + ph);
      ctx.closePath();
      const fillGrad = ctx.createLinearGradient(0, PT, 0, PT + ph);
      fillGrad.addColorStop(0, "rgba(201,160,74,0.10)");
      fillGrad.addColorStop(1, "rgba(201,160,74,0.01)");
      ctx.fillStyle = fillGrad;
      ctx.fill();

      // Spectrum line
      ctx.beginPath();
      for (let i = 0; i < pts.length; i++) {
        if (i === 0) ctx.moveTo(pts[i][0], pts[i][1]);
        else ctx.lineTo(pts[i][0], pts[i][1]);
      }
      ctx.strokeStyle = "#C9A04A";
      ctx.lineWidth = 1.4;
      ctx.shadowColor = "rgba(201,160,74,0.45)";
      ctx.shadowBlur = 5;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Grid lines
      ctx.strokeStyle = "#1a1a1a";
      ctx.lineWidth = 0.5;
      [1000, 2000, 3000].forEach((wn) => {
        const x = xToCanvas(wn);
        ctx.beginPath();
        ctx.moveTo(x, PT);
        ctx.lineTo(x, PT + ph);
        ctx.stroke();
      });

      // Baseline (T = 100%)
      ctx.strokeStyle = "#1F1F1F";
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(PL, PT);
      ctx.lineTo(PL + pw, PT);
      ctx.stroke();

      // X-axis labels
      ctx.fillStyle = "#444";
      ctx.font = "9px 'JetBrains Mono', monospace";
      ctx.textAlign = "center";
      [4000, 3000, 2000, 1000].forEach((wn) => {
        ctx.fillText(String(wn), xToCanvas(wn), PT + ph + 14);
      });

      // Axis unit
      ctx.fillStyle = "#333";
      ctx.font = "8px 'JetBrains Mono', monospace";
      ctx.textAlign = "center";
      ctx.fillText("wavenumber / cm⁻¹", PL + pw / 2, PT + ph + 24);

      // Y-axis label (rotated)
      ctx.save();
      ctx.fillStyle = "#3a3a3a";
      ctx.font = "8px 'JetBrains Mono', monospace";
      ctx.translate(12, PT + ph / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = "center";
      ctx.fillText("T (%)", 0, 0);
      ctx.restore();

      // Axes border
      ctx.strokeStyle = "#2a2a2a";
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(PL, PT);
      ctx.lineTo(PL, PT + ph);
      ctx.lineTo(PL + pw, PT + ph);
      ctx.stroke();

      rafRef.current = requestAnimationFrame(drawFrame);
    }

    startRef.current = performance.now();
    rafRef.current = requestAnimationFrame(drawFrame);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isInView]);

  return (
    <div ref={containerRef} className={`rounded-xl border border-border overflow-hidden ${className}`}>
      <div className="flex items-center gap-1.5 px-3 py-2 bg-surface border-b border-border">
        <div className="flex gap-1.5">
          <div className="w-[10px] h-[10px] rounded-full bg-[#FF5F57]" />
          <div className="w-[10px] h-[10px] rounded-full bg-[#FEBC2E]" />
          <div className="w-[10px] h-[10px] rounded-full bg-[#28C840]" />
        </div>
        <span className="ml-2 text-[10px] font-mono text-text-muted/60">ir_spectrum — benzaldehyde.mol</span>
        <span className="ml-auto text-[10px] font-mono text-accent/60">● live</span>
      </div>
      <div style={{ background: "#070707" }}>
        <canvas
          ref={canvasRef}
          className="w-full block"
          style={{ height: "190px" }}
        />
      </div>
    </div>
  );
}
