/**
 * CrossSpectralLens — Canvas overlay over HeroSpectrum card.
 * A circular lens (r=60px) follows the cursor.
 * Outside lens: measured IR spectrum (amber, benzaldehyde).
 * Inside lens: model's predicted Raman reconstruction (teal, same peaks, different widths/intensities).
 * Visual metaphor for the spectral inverse problem.
 * pointer-events: none. Falls back to static split if prefers-reduced-motion.
 */
import { useEffect, useRef } from "react";

const LENS_R = 60;

// Benzaldehyde-like peaks: [center_norm, ir_intensity, raman_intensity]
// IR: absorption peaks, strong for polar bonds
// Raman: scattering peaks, strong for symmetric/polarizable bonds
const PEAKS: [number, number, number][] = [
  [0.16, 0.32, 0.55], // aromatic C-H (Raman active)
  [0.28, 0.25, 0.30],
  [0.62, 0.96, 0.45], // C=O IR dominant, weaker Raman
  [0.66, 0.62, 0.68], // C=C (Raman active)
  [0.70, 0.50, 0.82], // C=C (strong Raman)
  [0.79, 0.44, 0.38],
  [0.88, 0.46, 0.58],
];

function lorentz(x: number, c: number, w: number) {
  return 1 / (1 + ((x - c) / w) ** 2);
}

function getIR(x: number): number {
  let y = 0;
  for (const [c, h] of PEAKS) y += lorentz(x, c, 0.038) * h;
  return Math.min(y * 0.9, 1);
}

function getRaman(x: number): number {
  let y = 0;
  for (const [c, , h] of PEAKS) y += lorentz(x, c, 0.028) * h; // narrower peaks for Raman
  return Math.min(y * 0.85, 1);
}

interface Props {
  className?: string;
}

export default function CrossSpectralLens({ className = "" }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef<{ x: number; y: number } | null>(null);
  const rafRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width  = canvas.offsetWidth  * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const onMouseMove = (e: MouseEvent) => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      if (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
        mouseRef.current = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        };
      } else {
        mouseRef.current = null;
      }
    };
    window.addEventListener("mousemove", onMouseMove);

    const drawSpectra = (_t: number) => {
      const W = canvas.offsetWidth;
      const H = canvas.offsetHeight;
      ctx.clearRect(0, 0, W, H);

      const mouse = mouseRef.current;
      const N = W * 2;
      const base = H * 0.85;
      const amp  = H * 0.70;

      if (!mouse && !reduced) return; // nothing to draw without cursor

      const drawCurve = (
        getY: (x: number) => number,
        color: string,
        alpha: number,
        clip?: { cx: number; cy: number; r: number; inside: boolean },
      ) => {
        ctx.save();
        if (clip) {
          ctx.beginPath();
          if (clip.inside) {
            ctx.arc(clip.cx, clip.cy, clip.r, 0, Math.PI * 2);
            ctx.clip();
          } else {
            // Clip outside the circle: fill rect then subtract circle
            ctx.rect(0, 0, W, H);
            ctx.arc(clip.cx, clip.cy, clip.r, 0, Math.PI * 2, true);
            ctx.clip();
          }
        }

        ctx.beginPath();
        for (let i = 0; i <= N; i++) {
          const x = i / N;
          const v = getY(x);
          const sx = (i / N) * W;
          const sy = base - v * amp;
          i === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy);
        }
        ctx.strokeStyle = `${color}${Math.round(alpha * 255).toString(16).padStart(2, "0")}`;
        ctx.lineWidth = 1.3;
        ctx.stroke();
        ctx.restore();
      };

      if (reduced || !mouse) {
        // Static: left half IR, right half Raman
        const midX = W / 2;
        ctx.save();
        ctx.rect(0, 0, midX, H);
        ctx.clip();
        drawCurve(getIR, "#C9A04A", 0.55);
        ctx.restore();

        ctx.save();
        ctx.beginPath();
        ctx.rect(midX, 0, W - midX, H);
        ctx.clip();
        drawCurve(getRaman, "#4ECDC4", 0.55);
        ctx.restore();

        // Divider
        ctx.beginPath();
        ctx.moveTo(midX, 0);
        ctx.lineTo(midX, H);
        ctx.strokeStyle = "rgba(255,255,255,0.08)";
        ctx.lineWidth = 1;
        ctx.stroke();
        return;
      }

      const { x: mx, y: my } = mouse;

      // Draw IR outside lens (amber)
      drawCurve(getIR, "#C9A04A", 0.50, { cx: mx, cy: my, r: LENS_R, inside: false });

      // Draw Raman inside lens (teal)
      drawCurve(getRaman, "#4ECDC4", 0.80, { cx: mx, cy: my, r: LENS_R, inside: true });

      // Lens ring
      ctx.beginPath();
      ctx.arc(mx, my, LENS_R, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(78,205,196,0.35)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Lens fill (subtle teal tint inside)
      ctx.beginPath();
      ctx.arc(mx, my, LENS_R, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(78,205,196,0.04)";
      ctx.fill();

      // Label inside lens: "Raman"
      ctx.fillStyle = "rgba(78,205,196,0.6)";
      ctx.font = `9px "JetBrains Mono", monospace`;
      ctx.textAlign = "center";
      ctx.fillText("Raman", mx, my - LENS_R + 14);
      ctx.textAlign = "left";
    };

    if (reduced) {
      drawSpectra(0);
    } else {
      const loop = (t: number) => {
        drawSpectra(t);
        rafRef.current = requestAnimationFrame(loop);
      };
      rafRef.current = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      style={{ zIndex: 1 }}
      aria-hidden="true"
    />
  );
}
