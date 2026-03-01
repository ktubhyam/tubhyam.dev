/**
 * SpectrumHero — Hero background: an animated benzaldehyde IR spectrum.
 * Canvas fills the section. Mouse proximity excites nearby peaks.
 * pointer-events: none — all interaction passes through to the UI.
 */
import { useEffect, useRef } from "react";

// Benzaldehyde peaks [x_normalized (0=4000cm⁻¹, 1=400cm⁻¹), intensity]
const PEAKS: [number, number, number][] = [
  [0.26, 1.00, 0.010], // 3070 cm⁻¹ ar C-H
  [0.33, 0.30, 0.009], // 2820 cm⁻¹ CHO
  [0.35, 0.26, 0.009], // 2740 cm⁻¹ Fermi
  [0.64, 0.95, 0.008], // 1700 cm⁻¹ C=O (dominant)
  [0.67, 0.62, 0.007], // 1600 cm⁻¹ C=C
  [0.69, 0.52, 0.007], // 1580 cm⁻¹ C=C
  [0.71, 0.48, 0.008], // 1450 cm⁻¹ C-H
  [0.75, 0.44, 0.007], // 1310 cm⁻¹
  [0.78, 0.46, 0.007], // 1205 cm⁻¹
  [0.83, 0.38, 0.009], // 1000 cm⁻¹
  [0.87, 0.50, 0.008], // 850 cm⁻¹
  [0.92, 0.42, 0.009], // 680 cm⁻¹
];

function lorentz(x: number, c: number, w: number, h: number) {
  return h / (1 + ((x - c) / w) ** 2);
}

export default function SpectrumHero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef(0);
  const mouseXRef = useRef(-1);
  const visibleRef = useRef(false);

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
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener("resize", resize);

    const io = new IntersectionObserver(
      ([entry]) => {
        visibleRef.current = entry.isIntersecting;
        if (!entry.isIntersecting) {
          cancelAnimationFrame(rafRef.current);
        } else if (!reduced) {
          const loop = (t: number) => { draw(t); rafRef.current = requestAnimationFrame(loop); };
          rafRef.current = requestAnimationFrame(loop);
        }
      },
      { threshold: 0 },
    );
    io.observe(canvas);

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      if (e.clientY >= rect.top && e.clientY <= rect.bottom) {
        mouseXRef.current = (e.clientX - rect.left) / rect.width;
      } else {
        mouseXRef.current = -1;
      }
    };
    window.addEventListener("mousemove", onMouseMove);

    const draw = (t: number) => {
      const W = canvas.offsetWidth;
      const H = canvas.offsetHeight;
      ctx.clearRect(0, 0, W, H);

      const N      = W * 2;
      const baseY  = H * 0.78;
      const specH  = H * 0.32;
      const mx     = mouseXRef.current;

      // Build spectrum array
      const pts: number[] = [];
      for (let i = 0; i <= N; i++) {
        const x = i / N;
        let y = 0;
        for (const [c, intensity, w] of PEAKS) {
          const breathe   = reduced ? 1 : 1 + Math.sin(t * 0.0005 + c * 30) * 0.05;
          const proximity = mx >= 0 ? Math.max(0, 1 - Math.abs(x - mx) / 0.06) : 0;
          const excite    = proximity * Math.sin(t * 0.006) * 0.4;
          y += lorentz(x, c, w, intensity * breathe * (1 + excite));
        }
        pts.push(Math.min(y, 1));
      }

      // Filled area under curve
      ctx.beginPath();
      ctx.moveTo(0, baseY);
      for (let i = 0; i <= N; i++) {
        ctx.lineTo((i / N) * W, baseY - pts[i] * specH);
      }
      ctx.lineTo(W, baseY);
      ctx.closePath();
      const fill = ctx.createLinearGradient(0, baseY - specH, 0, baseY);
      fill.addColorStop(0,   "rgba(201,160,74,0.0)");
      fill.addColorStop(0.5, "rgba(201,160,74,0.03)");
      fill.addColorStop(1,   "rgba(201,160,74,0.0)");
      ctx.fillStyle = fill;
      ctx.fill();

      // Spectrum line — horizontal gradient, brighter near C=O
      ctx.beginPath();
      for (let i = 0; i <= N; i++) {
        const sx = (i / N) * W;
        const sy = baseY - pts[i] * specH;
        i === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy);
      }
      const stroke = ctx.createLinearGradient(0, 0, W, 0);
      stroke.addColorStop(0,    "rgba(201,160,74,0.0)");
      stroke.addColorStop(0.20, "rgba(201,160,74,0.12)");
      stroke.addColorStop(0.62, "rgba(201,160,74,0.40)"); // C=O region
      stroke.addColorStop(0.68, "rgba(201,160,74,0.28)");
      stroke.addColorStop(0.85, "rgba(201,160,74,0.14)");
      stroke.addColorStop(1,    "rgba(201,160,74,0.0)");
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Baseline
      ctx.beginPath();
      ctx.moveTo(0, baseY); ctx.lineTo(W, baseY);
      ctx.strokeStyle = "rgba(255,255,255,0.025)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Cursor peak dot
      if (mx >= 0) {
        let nearest = PEAKS[0]; let minD = Infinity;
        for (const p of PEAKS) {
          const d = Math.abs(p[0] - mx);
          if (d < minD) { minD = d; nearest = p; }
        }
        if (minD < 0.06) {
          const px = nearest[0] * W;
          const py = baseY - nearest[1] * specH;
          const glow = ctx.createRadialGradient(px, py, 0, px, py, 12);
          glow.addColorStop(0, "rgba(201,160,74,0.6)");
          glow.addColorStop(1, "rgba(201,160,74,0)");
          ctx.beginPath(); ctx.arc(px, py, 12, 0, Math.PI * 2);
          ctx.fillStyle = glow; ctx.fill();
          ctx.beginPath(); ctx.arc(px, py, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(201,160,74,0.9)"; ctx.fill();
        }
      }
    };

    if (reduced) {
      draw(0);
    }
    // Non-reduced: IO starts/stops the loop

    return () => {
      cancelAnimationFrame(rafRef.current);
      io.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    />
  );
}
