/**
 * InverseSpectrumFlow — Canvas animation showing what Spektron does:
 *   MEASUREMENT (clean spectrum) → CORRUPTION (add noise) → RECOVERY (iterative denoising)
 *
 * Three panels side by side. The recovery panel runs an animated "iterative refinement"
 * loop: starts blurry/noisy and sharpens toward the clean signal over N iterations.
 */
import { useEffect, useRef } from "react";

const AMBER = "rgba(201,160,74,";
const TEAL  = "rgba(78,205,196,";
const MUTED = "rgba(136,136,136,";

// Benzaldehyde-like peaks [center, intensity]
const PEAKS: [number, number][] = [
  [0.16, 0.32],[0.28, 0.28],[0.62, 0.96],[0.66, 0.62],[0.70, 0.50],[0.79, 0.44],[0.88, 0.46],
];

function lorentz(x: number, c: number, w: number) {
  return 1 / (1 + ((x - c) / w) ** 2);
}

function getClean(x: number): number {
  let y = 0;
  for (const [c, h] of PEAKS) y += lorentz(x, c, 0.038) * h;
  return Math.min(y * 0.9, 1);
}

function getNoise(x: number, seed: number): number {
  // Deterministic noise via sin-hash
  return (Math.sin(x * 137.5 + seed * 7.3) + Math.sin(x * 91.3 + seed * 3.1)) * 0.5;
}

// Draw a spectrum panel
function drawPanel(
  ctx: CanvasRenderingContext2D,
  x0: number, y0: number, pw: number, ph: number,
  label: string, sublabel: string,
  color: string,
  getY: (t: number) => number,
  W_canvas: number,
) {
  const N    = pw * 2;
  const base = y0 + ph * 0.88;
  const amp  = ph * 0.72;

  // Panel background
  ctx.fillStyle = "rgba(17,17,17,0.6)";
  ctx.beginPath();
  ctx.roundRect(x0, y0, pw, ph, 6);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.05)";
  ctx.lineWidth = 0.5;
  ctx.stroke();

  // Spectrum curve
  ctx.beginPath();
  for (let i = 0; i <= N; i++) {
    const t  = i / N;
    const v  = getY(t);
    const sx = x0 + t * pw;
    const sy = base - v * amp;
    i === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy);
  }
  ctx.strokeStyle = color + "0.7)";
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Fill under curve
  ctx.lineTo(x0 + pw, base);
  ctx.lineTo(x0,     base);
  ctx.closePath();
  ctx.fillStyle = color + "0.05)";
  ctx.fill();

  // Baseline
  ctx.beginPath();
  ctx.moveTo(x0, base);
  ctx.lineTo(x0 + pw, base);
  ctx.strokeStyle = "rgba(255,255,255,0.04)";
  ctx.lineWidth = 0.5;
  ctx.stroke();

  // Label
  ctx.font = `500 ${Math.max(8, ph * 0.13)}px "JetBrains Mono", monospace`;
  ctx.fillStyle = color + "0.65)";
  ctx.fillText(label, x0 + 6, y0 + ph * 0.12);

  ctx.font = `${Math.max(7, ph * 0.10)}px "JetBrains Mono", monospace`;
  ctx.fillStyle = MUTED + "0.35)";
  ctx.fillText(sublabel, x0 + 6, y0 + ph * 0.22);
}

// Arrow between panels
function drawArrow(ctx: CanvasRenderingContext2D, x: number, cy: number, pulse: number) {
  const a   = 7;
  const len = 14;
  ctx.globalAlpha = 0.35 + pulse * 0.4;
  ctx.strokeStyle = MUTED + "0.8)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, cy);
  ctx.lineTo(x + len, cy);
  ctx.moveTo(x + len - a * 0.6, cy - a * 0.4);
  ctx.lineTo(x + len, cy);
  ctx.lineTo(x + len - a * 0.6, cy + a * 0.4);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

export default function InverseSpectrumFlow({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const setup = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width  = canvas.offsetWidth  * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    setup();
    window.addEventListener("resize", setup);

    const draw = (t: number) => {
      const W = canvas.offsetWidth;
      const H = canvas.offsetHeight;
      ctx.clearRect(0, 0, W, H);

      const ARROW_W = 28;
      const pad     = 8;
      const avail   = W - pad * 2 - ARROW_W * 2;
      const pw      = avail / 3;
      const ph      = H - pad * 2;

      // Noise seed cycles slowly
      const noiseSeed = reduced ? 0 : Math.floor(t * 0.003) % 60;

      // Recovery: iteration 0..100, cycles
      const iterCycle = reduced ? 1 : (t * 0.0008) % 1;
      const iter      = Math.floor(iterCycle * 100);
      // Blend: 0 = full noise, 1 = clean
      const blend     = Math.pow(iter / 100, 0.5);

      const x0 = pad;
      const x1 = pad + pw + ARROW_W;
      const x2 = pad + pw * 2 + ARROW_W * 2;
      const y0 = pad;

      // Panel 1: clean spectrum
      drawPanel(ctx, x0, y0, pw, ph, "MEASUREMENT", "S(ν)", AMBER,
        (x) => getClean(x), W);

      // Panel 2: noisy
      drawPanel(ctx, x1, y0, pw, ph, "CORRUPTION", "+noise", MUTED,
        (x) => Math.max(0, getClean(x) + getNoise(x, noiseSeed) * (0.35)), W);

      // Panel 3: recovery — interpolates from noisy → clean
      const iterLabel = `iter: ${String(iter).padStart(3, "0")}`;
      drawPanel(ctx, x2, y0, pw, ph, "RECOVERY", iterLabel, TEAL,
        (x) => {
          const clean = getClean(x);
          const noisy = Math.max(0, clean + getNoise(x, noiseSeed) * (0.35 * (1 - blend)));
          return noisy * (1 - blend) + clean * blend;
        }, W);

      // Arrows
      const arrowPulse = reduced ? 0.5 : Math.abs(Math.sin(t * 0.002));
      const midY = pad + ph * 0.50;
      drawArrow(ctx, x0 + pw + 2, midY, arrowPulse);
      drawArrow(ctx, x1 + pw + 2, midY, arrowPulse);

      // Iter progress dot on panel 3 baseline
      if (!reduced) {
        const bx = x2 + iterCycle * pw;
        const by = y0 + ph * 0.92;
        ctx.beginPath(); ctx.arc(bx, by, 2, 0, Math.PI * 2);
        ctx.fillStyle = TEAL + "0.7)"; ctx.fill();
      }
    };

    if (reduced) { draw(0); }
    else {
      const loop = (t: number) => { draw(t); rafRef.current = requestAnimationFrame(loop); };
      rafRef.current = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", setup);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full block ${className}`}
      style={{ height: 130 }}
      aria-hidden="true"
    />
  );
}
