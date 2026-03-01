/**
 * ThreeBodyBackground — Gravitational figure-8 choreography canvas.
 * Three equal-mass bodies chase each other in the Chenciner-Montgomery
 * figure-8 orbit. Trails drawn with fading opacity. Pauses off-screen.
 *
 * Integration: Velocity Verlet (symplectic, conserves energy).
 * Initial conditions: Chenciner & Montgomery (2000), scaled to G=1, m=1.
 */
import { useEffect, useRef } from "react";

const G = 1.0;
const M = 1.0;
const SOFTENING_SQ = 0.01;  // prevents singularity; sqrt(0.01)=0.1 length units
const DT = 0.0006;
const STEPS_PER_FRAME = 4;
const TRAIL_LEN = 280;
const SEG = 8; // points per opacity band in trail

// Figure-8 initial conditions (Chenciner & Montgomery 2000)
const IC: { x: number; y: number; vx: number; vy: number }[] = [
  { x:  0.97000436, y: -0.24308753, vx:  0.46620369, vy:  0.43236573 },
  { x: -0.97000436, y:  0.24308753, vx:  0.46620369, vy:  0.43236573 },
  { x:  0.0,        y:  0.0,        vx: -0.93240737, vy: -0.86473146 },
];

const COLORS = ["#C9A04A", "#4ECDC4", "#A78BFA"] as const;

function accel(
  bodies: { x: number; y: number }[],
  i: number,
): { ax: number; ay: number } {
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
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let paused = false;
    let cssW = 0, cssH = 0;

    // Mutable simulation state
    const bodies = IC.map((b) => ({ ...b }));
    const trails: { x: number; y: number }[][] = [[], [], []];

    function resize() {
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      cssW = rect.width;
      cssH = rect.height;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = cssW * dpr;
      canvas.height = cssH * dpr;
      canvas.style.width = cssW + "px";
      canvas.style.height = cssH + "px";
      // Use setTransform to avoid cumulative scale on repeated resize
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    // Map simulation coords → CSS pixels
    // Figure-8 spans ≈ ±1.25 in x, ±0.55 in y.
    // Scale so the orbit fills ~55% of the shorter dimension.
    function toScreen(x: number, y: number): [number, number] {
      const scale = Math.min(cssW * 0.27, cssH * 0.5);
      return [cssW / 2 + x * scale, cssH / 2 + y * scale];
    }

    function step() {
      for (let s = 0; s < STEPS_PER_FRAME; s++) {
        const a0 = bodies.map((_, i) => accel(bodies, i));
        // Update positions
        for (let i = 0; i < 3; i++) {
          bodies[i].x += bodies[i].vx * DT + 0.5 * a0[i].ax * DT * DT;
          bodies[i].y += bodies[i].vy * DT + 0.5 * a0[i].ay * DT * DT;
        }
        // Recompute accelerations at new positions
        const a1 = bodies.map((_, i) => accel(bodies, i));
        // Update velocities
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
        const color = COLORS[i];
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;

        // Draw trail in bands of SEG points, opacity increases toward head
        for (let t = 0; t < trail.length - 1; t += SEG) {
          const alpha = ((t + SEG) / trail.length) * 0.55;
          ctx.globalAlpha = alpha;
          ctx.beginPath();
          const [sx, sy] = toScreen(trail[t].x, trail[t].y);
          ctx.moveTo(sx, sy);
          for (let k = 1; k < SEG && t + k < trail.length; k++) {
            const [px, py] = toScreen(trail[t + k].x, trail[t + k].y);
            ctx.lineTo(px, py);
          }
          ctx.stroke();
        }

        // Body: solid core + radial glow
        const [bx, by] = toScreen(bodies[i].x, bodies[i].y);
        ctx.globalAlpha = 1;

        // Outer glow
        const glow = ctx.createRadialGradient(bx, by, 0, bx, by, 10);
        glow.addColorStop(0, color + "cc");
        glow.addColorStop(0.4, color + "44");
        glow.addColorStop(1, color + "00");
        ctx.beginPath();
        ctx.arc(bx, by, 10, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();

        // Core dot
        ctx.beginPath();
        ctx.arc(bx, by, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
      }

      ctx.globalAlpha = 1;
    }

    function loop() {
      if (!paused) {
        step();
        draw();
      }
      raf = requestAnimationFrame(loop);
    }

    const visObs = new IntersectionObserver(([e]) => {
      paused = !e.isIntersecting;
    });
    visObs.observe(canvas);

    const resObs = new ResizeObserver(resize);
    resObs.observe(canvas.parentElement ?? canvas);

    resize();
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      visObs.disconnect();
      resObs.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none"
      style={{ opacity: 0.2 }}
    />
  );
}
