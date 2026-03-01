/**
 * ThreeBodyBackground — Gravitational figure-8 canvas background.
 * Three equal-mass bodies in the Chenciner-Montgomery figure-8 orbit.
 * Visual style matches AtomOrbit3D: rgba opacity bands, radial glow,
 * same amber / teal / violet palette.
 *
 * Sizing: reads from wrapper div so it survives the astro-island wrapper.
 * Integration: Velocity Verlet, DT=0.0006, 4 sub-steps per rAF.
 */
import { useRef, useEffect } from "react";

const G = 1.0;
const M = 1.0;
const SOFTENING_SQ = 0.008;
const DT = 0.0006;
const STEPS_PER_FRAME = 4;
const TRAIL_LEN = 320;
const SEG = 6; // points per opacity band

// Chenciner & Montgomery (2000) figure-8 initial conditions
const IC = [
  { x:  0.97000436, y: -0.24308753, vx:  0.46620369, vy:  0.43236573 },
  { x: -0.97000436, y:  0.24308753, vx:  0.46620369, vy:  0.43236573 },
  { x:  0.0,        y:  0.0,        vx: -0.93240737, vy: -0.86473146 },
];

// Match orbit palette exactly
const COLORS_RGB: [number, number, number][] = [
  [201, 160,  74],  // amber  #C9A04A
  [ 78, 205, 196],  // teal   #4ECDC4
  [167, 139, 250],  // violet #A78BFA
];

function accel(bodies: { x: number; y: number }[], i: number) {
  let ax = 0, ay = 0;
  for (let j = 0; j < 3; j++) {
    if (j === i) continue;
    const dx = bodies[j].x - bodies[i].x;
    const dy = bodies[j].y - bodies[i].y;
    const r2 = dx * dx + dy * dy + SOFTENING_SQ;
    const r3 = r2 * Math.sqrt(r2);
    ax += (G * M * dx) / r3;
    ay += (G * M * dy) / r3;
  }
  return { ax, ay };
}

export default function ThreeBodyBackground() {
  const wrapRef  = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrap   = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let paused = false;
    let cssW = 0, cssH = 0;

    const bodies = IC.map((b) => ({ ...b }));
    const trails: { x: number; y: number }[][] = [[], [], []];

    function resize() {
      cssW = wrap.offsetWidth  || window.innerWidth;
      cssH = wrap.offsetHeight || window.innerHeight;
      const dpr = window.devicePixelRatio || 1;
      canvas.width  = cssW * dpr;
      canvas.height = cssH * dpr;
      canvas.style.width  = cssW + "px";
      canvas.style.height = cssH + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    // Figure-8 spans ≈ ±1.25 x, ±0.55 y — scale to ~48% of short axis
    function toScreen(x: number, y: number): [number, number] {
      const scale = Math.min(cssW * 0.26, cssH * 0.48);
      return [cssW / 2 + x * scale, cssH / 2 + y * scale];
    }

    function step() {
      for (let s = 0; s < STEPS_PER_FRAME; s++) {
        const a0 = bodies.map((_, i) => accel(bodies, i));
        for (let i = 0; i < 3; i++) {
          bodies[i].x += bodies[i].vx * DT + 0.5 * a0[i].ax * DT * DT;
          bodies[i].y += bodies[i].vy * DT + 0.5 * a0[i].ay * DT * DT;
        }
        const a1 = bodies.map((_, i) => accel(bodies, i));
        for (let i = 0; i < 3; i++) {
          bodies[i].vx += 0.5 * (a0[i].ax + a1[i].ax) * DT;
          bodies[i].vy += 0.5 * (a0[i].ay + a1[i].ay) * DT;
        }
      }
      for (let i = 0; i < 3; i++) {
        trails[i].push({ x: bodies[i].x, y: bodies[i].y });
        if (trails[i].length > TRAIL_LEN) trails[i].shift();
      }
    }

    function draw() {
      ctx.clearRect(0, 0, cssW, cssH);

      for (let i = 0; i < 3; i++) {
        const trail = trails[i];
        const [r, g, b] = COLORS_RGB[i];

        // Trail — opacity bands matching orbit ring style: 0.08 + depth * 0.42
        for (let t = 0; t < trail.length - 1; t += SEG) {
          const depth = (t + SEG) / trail.length;        // 0 (oldest) → 1 (newest)
          const opacity = 0.05 + depth * 0.38;
          const lw     = 0.4  + depth * 1.4;

          ctx.beginPath();
          ctx.strokeStyle = `rgba(${r},${g},${b},${opacity})`;
          ctx.lineWidth   = lw;
          ctx.lineCap     = "round";

          const [sx, sy] = toScreen(trail[t].x, trail[t].y);
          ctx.moveTo(sx, sy);
          for (let k = 1; k < SEG && t + k < trail.length; k++) {
            const [px, py] = toScreen(trail[t + k].x, trail[t + k].y);
            ctx.lineTo(px, py);
          }
          ctx.stroke();
        }

        // Body — glow + core, same style as orbit electron nodes
        const [bx, by] = toScreen(bodies[i].x, bodies[i].y);

        // Outer glow (large, faint) — matches orbit center glow
        const glowR = ctx.createRadialGradient(bx, by, 0, bx, by, 18);
        glowR.addColorStop(0,   `rgba(${r},${g},${b},0.18)`);
        glowR.addColorStop(0.4, `rgba(${r},${g},${b},0.06)`);
        glowR.addColorStop(1,   `rgba(${r},${g},${b},0)`);
        ctx.beginPath();
        ctx.arc(bx, by, 18, 0, Math.PI * 2);
        ctx.fillStyle = glowR;
        ctx.fill();

        // Inner bright ring — matches orbit electron stroke style
        ctx.beginPath();
        ctx.arc(bx, by, 4, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${r},${g},${b},0.55)`;
        ctx.lineWidth   = 1.2;
        ctx.stroke();

        // Core dot — matches orbit electron fill
        ctx.beginPath();
        ctx.arc(bx, by, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},0.85)`;
        ctx.fill();
      }
    }

    function loop() {
      if (!paused) { step(); draw(); }
      raf = requestAnimationFrame(loop);
    }

    const visObs = new IntersectionObserver(([e]) => {
      paused = !e.isIntersecting;
    });
    visObs.observe(wrap);

    const resObs = new ResizeObserver(resize);
    resObs.observe(wrap);

    resize();
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      visObs.disconnect();
      resObs.disconnect();
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none"
      style={{ opacity: 0.55 }}
    >
      <canvas ref={canvasRef} className="absolute inset-0" />
    </div>
  );
}
