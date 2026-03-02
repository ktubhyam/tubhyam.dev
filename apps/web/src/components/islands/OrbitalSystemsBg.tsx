/**
 * OrbitalSystemsBg — S2 Build background.
 * Four orbital systems, one per library (SpectraKit · Spektron · SpectraView · ReactorTwin).
 * Each system has a glowing nucleus with 2–3 electrons tracing 3D-projected elliptical orbits.
 * Long fading trails. Faint ring guides. Very slow and elegant.
 *
 * 3D projection: orbit defined by inclination i and longitude of ascending node ψ.
 *   x = cx + (r·cos θ·cos ψ − r·sin θ·sin ψ) · scale
 *   y = cy + (r·cos θ·sin ψ + r·sin θ·cos ψ)·cos(i) · scale
 *   z =      (r·cos θ·sin ψ + r·sin θ·cos ψ)·sin(i)   ← depth cue
 */
import { useRef, useEffect } from "react";

const TRAIL_LEN = 120;

type Electron = { r: number; omega: number; phase: number; incl: number; psi: number };
type System   = { color: [number, number, number]; posX: number; posY: number; electrons: Electron[] };

// One system per library.  Very slow omega (12–32 s per revolution).
const SYSTEMS: System[] = [
  {
    color: [201, 160, 74],     // amber  — SpectraKit
    posX: 0.22, posY: 0.30,
    electrons: [
      { r: 54, omega: 0.30, phase: 0.0,  incl: 1.10, psi: 0.0  },
      { r: 88, omega: 0.17, phase: 2.1,  incl: 0.62, psi: 0.95 },
    ],
  },
  {
    color: [78, 205, 196],     // teal   — Spektron
    posX: 0.78, posY: 0.27,
    electrons: [
      { r: 46, omega: 0.42, phase: 1.6,  incl: 1.18, psi: 1.30 },
      { r: 76, omega: 0.24, phase: 3.4,  incl: 0.70, psi: 0.50 },
      { r: 106, omega: 0.14, phase: 0.8, incl: 0.38, psi: 2.10 },
    ],
  },
  {
    color: [167, 139, 250],    // violet — SpectraView
    posX: 0.22, posY: 0.73,
    electrons: [
      { r: 57, omega: 0.34, phase: 3.0,  incl: 0.95, psi: 0.70 },
      { r: 91, omega: 0.19, phase: 0.5,  incl: 0.52, psi: 1.80 },
    ],
  },
  {
    color: [52, 211, 153],     // green  — ReactorTwin
    posX: 0.78, posY: 0.73,
    electrons: [
      { r: 51, omega: 0.37, phase: 1.1,  incl: 1.05, psi: 0.40 },
      { r: 84, omega: 0.21, phase: 4.3,  incl: 0.58, psi: 1.20 },
    ],
  },
];

export default function OrbitalSystemsBg() {
  const wrapRef   = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrap   = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf    = 0;
    let paused = false;
    let cssW   = 0, cssH = 0;

    // Per-electron trail ring buffers
    const trails: { x: number; y: number }[][][] = SYSTEMS.map((s) =>
      s.electrons.map(() => [])
    );

    function proj(cx: number, cy: number, r: number, a: number, incl: number, psi: number, sc: number) {
      const xo = r * Math.cos(a);
      const yo = r * Math.sin(a);
      const xr = xo * Math.cos(psi) - yo * Math.sin(psi);
      const yr = xo * Math.sin(psi) + yo * Math.cos(psi);
      return {
        x: cx + xr * sc,
        y: cy + yr * Math.cos(incl) * sc,
        z: yr * Math.sin(incl),          // positive = toward viewer
      };
    }

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

    function drawRingGuide(cx: number, cy: number, r: number, incl: number, psi: number, sc: number, [R, G, B]: [number, number, number]) {
      ctx!.beginPath();
      for (let k = 0; k <= 64; k++) {
        const { x, y } = proj(cx, cy, r, (k / 64) * Math.PI * 2, incl, psi, sc);
        k === 0 ? ctx!.moveTo(x, y) : ctx!.lineTo(x, y);
      }
      ctx!.closePath();
      ctx!.strokeStyle = `rgba(${R},${G},${B},0.07)`;
      ctx!.lineWidth = 0.5;
      ctx!.stroke();
    }

    function drawNucleus(cx: number, cy: number, [R, G, B]: [number, number, number]) {
      const glow = ctx!.createRadialGradient(cx, cy, 0, cx, cy, 22);
      glow.addColorStop(0,   `rgba(${R},${G},${B},0.55)`);
      glow.addColorStop(0.5, `rgba(${R},${G},${B},0.12)`);
      glow.addColorStop(1,   `rgba(${R},${G},${B},0)`);
      ctx!.beginPath();
      ctx!.arc(cx, cy, 22, 0, Math.PI * 2);
      ctx!.fillStyle = glow;
      ctx!.fill();

      ctx!.beginPath();
      ctx!.arc(cx, cy, 3.5, 0, Math.PI * 2);
      ctx!.fillStyle = `rgba(${R},${G},${B},0.95)`;
      ctx!.fill();

      ctx!.beginPath();
      ctx!.arc(cx, cy, 1.4, 0, Math.PI * 2);
      ctx!.fillStyle = "rgba(255,255,255,0.92)";
      ctx!.fill();
    }

    function drawTrail(trail: { x: number; y: number }[], [R, G, B]: [number, number, number]) {
      if (trail.length < 2) return;
      for (let k = 1; k < trail.length; k++) {
        const frac = k / trail.length;
        const a = frac * frac * 0.62; // quadratic fade — thin transparent tail, bright head
        ctx!.beginPath();
        ctx!.moveTo(trail[k - 1].x, trail[k - 1].y);
        ctx!.lineTo(trail[k].x, trail[k].y);
        ctx!.strokeStyle = `rgba(${R},${G},${B},${a.toFixed(3)})`;
        ctx!.lineWidth = 0.8 + frac * 0.7;
        ctx!.stroke();
      }
    }

    function drawElectron(x: number, y: number, z: number, r: number, [R, G, B]: [number, number, number]) {
      const depth = 0.60 + 0.40 * Math.max(-1, Math.min(1, z / r));
      const eg = ctx!.createRadialGradient(x, y, 0, x, y, 8);
      eg.addColorStop(0, `rgba(${R},${G},${B},${(depth * 0.85).toFixed(2)})`);
      eg.addColorStop(1, `rgba(${R},${G},${B},0)`);
      ctx!.beginPath();
      ctx!.arc(x, y, 8, 0, Math.PI * 2);
      ctx!.fillStyle = eg;
      ctx!.fill();

      ctx!.beginPath();
      ctx!.arc(x, y, 2.4, 0, Math.PI * 2);
      ctx!.fillStyle = `rgba(${R},${G},${B},${depth.toFixed(2)})`;
      ctx!.fill();

      ctx!.beginPath();
      ctx!.arc(x, y, 1.0, 0, Math.PI * 2);
      ctx!.fillStyle = `rgba(255,255,255,${(depth * 0.88).toFixed(2)})`;
      ctx!.fill();
    }

    function loop(ts: number) {
      if (!paused && cssW > 0) {
        const t  = ts * 0.001;
        const sc = Math.min(1.0, cssW / 880, cssH / 540);

        ctx!.clearRect(0, 0, cssW, cssH);

        for (let si = 0; si < SYSTEMS.length; si++) {
          const sys = SYSTEMS[si];
          const cx = cssW * sys.posX;
          const cy = cssH * sys.posY;
          const col = sys.color;

          // Ring guides (drawn first so they're behind everything)
          for (const el of sys.electrons) {
            drawRingGuide(cx, cy, el.r, el.incl, el.psi, sc, col);
          }

          drawNucleus(cx, cy, col);

          for (let ei = 0; ei < sys.electrons.length; ei++) {
            const el    = sys.electrons[ei];
            const angle = el.phase + el.omega * t;
            const { x, y, z } = proj(cx, cy, el.r, angle, el.incl, el.psi, sc);

            const trail = trails[si][ei];
            trail.push({ x, y });
            if (trail.length > TRAIL_LEN) trail.shift();

            drawTrail(trail, col);
            drawElectron(x, y, z, el.r * sc, col);
          }
        }
      }
      raf = requestAnimationFrame(loop);
    }

    const visObs = new IntersectionObserver(([e]) => { paused = !e.isIntersecting; });
    visObs.observe(wrap);
    const resObs = new ResizeObserver(resize);
    resObs.observe(wrap);

    const TARGET_OPACITY = 0.82;
    function onScroll() {
      const rect  = wrap!.getBoundingClientRect();
      const viewH = window.innerHeight;
      const progress = Math.max(0, Math.min(1, (viewH * 0.92 - rect.top) / (viewH * 1.5)));
      const eased = progress * progress * (3 - 2 * progress);
      wrap!.style.opacity = String(eased * TARGET_OPACITY);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    resize();
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      visObs.disconnect();
      resObs.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <div ref={wrapRef} aria-hidden="true" className="absolute inset-0 pointer-events-none" style={{ opacity: 0 }}>
      <canvas ref={canvasRef} className="absolute inset-0" />
    </div>
  );
}
