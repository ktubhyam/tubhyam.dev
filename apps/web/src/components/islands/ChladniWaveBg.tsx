/**
 * ChladniWaveBg — S3 Explore background.
 * Animated Chladni figures: standing wave patterns on a vibrating plate.
 * Cycles through normal mode shapes (m,n). Nodal lines glow white.
 * Antinodes glow amber (positive) or violet (negative).
 * These are literally the shapes of molecular normal modes.
 */
import { useRef, useEffect } from "react";

// Grid dimensions for offscreen pixel buffer
const GW = 160;
const GH = 96;

// Mode sequence — (m, n) pairs, ascending complexity
const MODES: [number, number][] = [
  [1, 1], [1, 2], [2, 1], [2, 2],
  [1, 3], [3, 1], [2, 3], [3, 2], [3, 3],
  [1, 4], [4, 1], [2, 4], [4, 2], [4, 4],
];

// Time per mode: 5s hold, 6s transition = 11s total
const HOLD_MS   = 5000;
const TRANS_MS  = 6000;
const PERIOD_MS = HOLD_MS + TRANS_MS;

// Angular frequency base — scaled by sqrt(m²+n²)
const OMEGA_BASE = 1.5; // rad/s

function smoothstep(t: number): number {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
}

export default function ChladniWaveBg() {
  const wrapRef   = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrap   = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Offscreen canvas for pixel manipulation
    const off    = document.createElement("canvas");
    off.width    = GW;
    off.height   = GH;
    const offCtx = off.getContext("2d")!;

    let raf    = 0;
    let paused = false;
    let cssW   = 0, cssH = 0;

    function resize() {
      const r = wrap!.getBoundingClientRect();
      const w = r.width  || wrap!.offsetWidth  || window.innerWidth;
      const h = r.height || wrap!.offsetHeight || window.innerHeight;
      if (!w || !h) { requestAnimationFrame(resize); return; }
      cssW = w; cssH = h;
      const dpr = window.devicePixelRatio || 1;
      canvas!.width  = cssW * dpr;
      canvas!.height = cssH * dpr;
      canvas!.style.width  = cssW + "px";
      canvas!.style.height = cssH + "px";
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    // Pre-allocate ImageData
    const img = offCtx.createImageData(GW, GH);
    const d   = img.data;

    let lastPixelFrame = -1;

    function updatePixels(tSec: number) {
      const totalPhase = (tSec * 1000) / PERIOD_MS;
      const modeIdx    = Math.floor(totalPhase) % MODES.length;
      const phaseInPeriod = totalPhase - Math.floor(totalPhase); // 0→1 over PERIOD_MS

      // blend: 0 during hold, 0→1 during transition
      const blend = phaseInPeriod < HOLD_MS / PERIOD_MS
        ? 0
        : smoothstep((phaseInPeriod - HOLD_MS / PERIOD_MS) / (TRANS_MS / PERIOD_MS));

      const [m1, n1] = MODES[modeIdx];
      const [m2, n2] = MODES[(modeIdx + 1) % MODES.length];
      const omega1   = OMEGA_BASE * Math.sqrt(m1 * m1 + n1 * n1);
      const omega2   = OMEGA_BASE * Math.sqrt(m2 * m2 + n2 * n2);

      for (let py = 0; py < GH; py++) {
        const yf = py / (GH - 1); // 0→1
        for (let px = 0; px < GW; px++) {
          const xf = px / (GW - 1); // 0→1

          const v1 = Math.sin(m1 * Math.PI * xf) * Math.sin(n1 * Math.PI * yf) * Math.cos(omega1 * tSec);
          const v2 = Math.sin(m2 * Math.PI * xf) * Math.sin(n2 * Math.PI * yf) * Math.cos(omega2 * tSec);
          const v  = (1 - blend) * v1 + blend * v2; // −1 to +1

          const idx = (py * GW + px) * 4;

          if (Math.abs(v) < 0.11) {
            // Nodal line — white glow
            const t2 = (0.11 - Math.abs(v)) / 0.11;
            d[idx]   = 255;
            d[idx+1] = 255;
            d[idx+2] = 255;
            d[idx+3] = Math.round(t2 * t2 * 170);
          } else if (v > 0) {
            // Positive antinode — amber
            const a = Math.pow(v, 1.4) * 175;
            d[idx]   = 201;
            d[idx+1] = 160;
            d[idx+2] = 74;
            d[idx+3] = Math.round(a);
          } else {
            // Negative antinode — violet
            const a = Math.pow(-v, 1.4) * 135;
            d[idx]   = 167;
            d[idx+1] = 139;
            d[idx+2] = 250;
            d[idx+3] = Math.round(a);
          }
        }
      }
      offCtx.putImageData(img, 0, 0);
    }

    function loop(ts: number) {
      if (!paused && cssW > 0) {
        const tSec = ts * 0.001;

        // Update pixel buffer every 2 frames (~30fps for the field)
        const frame = Math.floor(ts / 33);
        if (frame !== lastPixelFrame) {
          updatePixels(tSec);
          lastPixelFrame = frame;
        }

        ctx!.clearRect(0, 0, cssW, cssH);
        ctx!.save();
        ctx!.imageSmoothingEnabled  = true;
        ctx!.imageSmoothingQuality  = "high";
        ctx!.globalAlpha            = 0.82;
        ctx!.drawImage(off, 0, 0, cssW, cssH);
        ctx!.restore();
      }
      raf = requestAnimationFrame(loop);
    }

    const visObs = new IntersectionObserver(([e]) => { paused = !e.isIntersecting; });
    visObs.observe(wrap);
    const resObs = new ResizeObserver(resize);
    resObs.observe(wrap);

    resize();
    raf = requestAnimationFrame(loop);

    return () => { cancelAnimationFrame(raf); visObs.disconnect(); resObs.disconnect(); };
  }, []);

  return (
    <div ref={wrapRef} aria-hidden="true" className="absolute inset-0 pointer-events-none" style={{ opacity: 0.18 }}>
      <canvas ref={canvasRef} className="absolute inset-0" />
    </div>
  );
}
