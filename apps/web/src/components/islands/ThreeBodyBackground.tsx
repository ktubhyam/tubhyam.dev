/**
 * ThreeBodyBackground — Full gravitational simulation canvas.
 *
 * Layers (back → front):
 *   1. Gravitational field grid  — sparse force-direction arrows across the sim space
 *   2. Center-of-mass marker     — fixed crosshair at (0,0), momentum conservation
 *   3. Potential rings            — dashed Roche-lobe approximation per body (4 rings)
 *   4. Body trails               — 340-pt depth-fading paths, orbit visual language
 *   5. 50 test particles         — massless, comet tails, respond to full gravity field
 *   6. Velocity vectors          — small arrows on main bodies showing momentum
 *   7. Body glows + cores        — radial gradient + ring + dot, matches AtomOrbit3D
 *
 * Integration: Velocity Verlet (main bodies), Euler (particles — cheaper, fine for dust).
 * Field grid recomputed every 4 frames; particles escape → respawn near center.
 */
import { useRef, useEffect } from "react";

const G            = 1.0;
const M            = 1.0;
const SOFT_SQ      = 0.008;
const DT           = 0.0006;
const STEPS        = 4;
const TRAIL_LEN    = 340;
const PTRAIL_LEN   = 28;
const SEG          = 6;
const N_PARTICLES  = 50;
const GRID_W       = 15;
const GRID_H       = 9;
const FIELD_PERIOD = 4;     // recompute field grid every N frames

const IC = [
  { x:  0.97000436, y: -0.24308753, vx:  0.46620369, vy:  0.43236573 },
  { x: -0.97000436, y:  0.24308753, vx:  0.46620369, vy:  0.43236573 },
  { x:  0.0,        y:  0.0,        vx: -0.93240737, vy: -0.86473146 },
];

const BODY_RGB: [number, number, number][] = [
  [201, 160,  74],
  [ 78, 205, 196],
  [167, 139, 250],
];

function seededRng(seed: number) {
  let s = seed | 0;
  return () => {
    s = Math.imul(1664525, s) + 1013904223 | 0;
    return (s >>> 0) / 0xffffffff;
  };
}

function gravAccel(
  sources: { x: number; y: number }[],
  px: number, py: number,
): [number, number] {
  let ax = 0, ay = 0;
  for (const s of sources) {
    const dx = s.x - px, dy = s.y - py;
    const r2 = dx * dx + dy * dy + SOFT_SQ;
    const r3 = r2 * Math.sqrt(r2);
    ax += G * M * dx / r3;
    ay += G * M * dy / r3;
  }
  return [ax, ay];
}

export default function ThreeBodyBackground() {
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
    let frame  = 0;

    const bodies = IC.map(b => ({ ...b }));
    const trails: { x: number; y: number }[][] = [[], [], []];

    const rng = seededRng(0xc0ffee42);
    const particles = Array.from({ length: N_PARTICLES }, () => {
      const angle = rng() * Math.PI * 2;
      const r = 0.4 + rng() * 1.6;
      return {
        x: Math.cos(angle) * r, y: Math.sin(angle) * r,
        vx: (rng() - 0.5) * 0.4, vy: (rng() - 0.5) * 0.4,
        trail: [] as { x: number; y: number }[],
      };
    });

    // Pre-allocated field grid arrays
    const fieldAx = new Float32Array(GRID_W * GRID_H);
    const fieldAy = new Float32Array(GRID_W * GRID_H);
    const fieldMag = new Float32Array(GRID_W * GRID_H);

    function resize() {
      cssW = wrap!.offsetWidth  || window.innerWidth;
      cssH = wrap!.offsetHeight || window.innerHeight;
      const dpr = window.devicePixelRatio || 1;
      canvas!.width  = cssW * dpr;
      canvas!.height = cssH * dpr;
      canvas!.style.width  = cssW + "px";
      canvas!.style.height = cssH + "px";
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function toScreen(x: number, y: number): [number, number] {
      const scale = Math.min(cssW * 0.26, cssH * 0.48);
      return [cssW / 2 + x * scale, cssH / 2 + y * scale];
    }

    // ── Simulation ───────────────────────────────────────────────────────────

    function stepBodies() {
      for (let s = 0; s < STEPS; s++) {
        const a0 = bodies.map((_, i) =>
          gravAccel(bodies.filter((_, j) => j !== i), bodies[i].x, bodies[i].y));
        for (let i = 0; i < 3; i++) {
          bodies[i].x += bodies[i].vx * DT + 0.5 * a0[i][0] * DT * DT;
          bodies[i].y += bodies[i].vy * DT + 0.5 * a0[i][1] * DT * DT;
        }
        const a1 = bodies.map((_, i) =>
          gravAccel(bodies.filter((_, j) => j !== i), bodies[i].x, bodies[i].y));
        for (let i = 0; i < 3; i++) {
          bodies[i].vx += 0.5 * (a0[i][0] + a1[i][0]) * DT;
          bodies[i].vy += 0.5 * (a0[i][1] + a1[i][1]) * DT;
        }
      }
      for (let i = 0; i < 3; i++) {
        trails[i].push({ x: bodies[i].x, y: bodies[i].y });
        if (trails[i].length > TRAIL_LEN) trails[i].shift();
      }
    }

    function stepParticles() {
      const totalDT = DT * STEPS;
      for (const p of particles) {
        const [ax, ay] = gravAccel(bodies, p.x, p.y);
        p.vx += ax * totalDT;
        p.vy += ay * totalDT;
        p.x  += p.vx * totalDT;
        p.y  += p.vy * totalDT;
        if (Math.abs(p.x) > 3.8 || Math.abs(p.y) > 3.8 ||
            p.vx * p.vx + p.vy * p.vy > 28) {
          const angle = rng() * Math.PI * 2;
          const r = 0.3 + rng() * 1.3;
          p.x = Math.cos(angle) * r; p.y = Math.sin(angle) * r;
          p.vx = (rng() - 0.5) * 0.35; p.vy = (rng() - 0.5) * 0.35;
          p.trail = [];
        }
        p.trail.push({ x: p.x, y: p.y });
        if (p.trail.length > PTRAIL_LEN) p.trail.shift();
      }
    }

    function updateFieldGrid() {
      const SX0 = -2.4, SX1 = 2.4, SY0 = -1.5, SY1 = 1.5;
      for (let gy = 0; gy < GRID_H; gy++) {
        for (let gx = 0; gx < GRID_W; gx++) {
          const sx = SX0 + (gx / (GRID_W - 1)) * (SX1 - SX0);
          const sy = SY0 + (gy / (GRID_H - 1)) * (SY1 - SY0);
          const [ax, ay] = gravAccel(bodies, sx, sy);
          const idx = gy * GRID_W + gx;
          fieldAx[idx]  = ax;
          fieldAy[idx]  = ay;
          fieldMag[idx] = Math.sqrt(ax * ax + ay * ay);
        }
      }
    }

    // ── Draw layers ──────────────────────────────────────────────────────────

    function drawFieldGrid() {
      const SX0 = -2.4, SX1 = 2.4, SY0 = -1.5, SY1 = 1.5;
      for (let gy = 0; gy < GRID_H; gy++) {
        for (let gx = 0; gx < GRID_W; gx++) {
          const sx = SX0 + (gx / (GRID_W - 1)) * (SX1 - SX0);
          const sy = SY0 + (gy / (GRID_H - 1)) * (SY1 - SY0);
          const [px, py] = toScreen(sx, sy);
          const idx  = gy * GRID_W + gx;
          const mag  = fieldMag[idx];
          if (mag < 0.05) continue;
          const ax = fieldAx[idx], ay = fieldAy[idx];
          const len = Math.min(Math.log1p(mag) * 5.5, 9);
          const nx = ax / mag, ny = ay / mag;
          const opacity = Math.min(mag * 0.018, 0.07);
          ctx.beginPath();
          ctx.moveTo(px - nx * len * 0.35, py - ny * len * 0.35);
          ctx.lineTo(px + nx * len * 0.65, py + ny * len * 0.65);
          ctx.strokeStyle = `rgba(190,190,230,${opacity})`;
          ctx.lineWidth   = 0.5;
          ctx.stroke();
        }
      }
    }

    function drawCenterOfMass() {
      const [cx, cy] = toScreen(0, 0);
      const sz = 5;
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth   = 0.6;
      ctx.beginPath();
      ctx.moveTo(cx - sz, cy); ctx.lineTo(cx + sz, cy);
      ctx.moveTo(cx, cy - sz); ctx.lineTo(cx, cy + sz);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy, 2, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,255,255,0.05)";
      ctx.stroke();
    }

    function drawPotentialRings() {
      const radii = [22, 40, 62, 90];
      ctx.setLineDash([2, 7]);
      for (let i = 0; i < 3; i++) {
        const [bx, by] = toScreen(bodies[i].x, bodies[i].y);
        const [r, g, b] = BODY_RGB[i];
        for (let ri = 0; ri < radii.length; ri++) {
          const opacity = (0.040 - ri * 0.008);
          ctx.beginPath();
          ctx.arc(bx, by, radii[ri], 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(${r},${g},${b},${opacity})`;
          ctx.lineWidth   = 0.5;
          ctx.stroke();
        }
      }
      ctx.setLineDash([]);
    }

    function drawBodyTrails() {
      for (let i = 0; i < 3; i++) {
        const trail = trails[i];
        const [r, g, b] = BODY_RGB[i];
        for (let t = 0; t < trail.length - 1; t += SEG) {
          const depth   = (t + SEG) / trail.length;
          const opacity = 0.05 + depth * 0.40;
          const lw      = 0.4  + depth * 1.5;
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
      }
    }

    function drawParticles() {
      for (const p of particles) {
        const trail = p.trail;
        if (trail.length < 2) continue;
        // Comet tail
        ctx.beginPath();
        const [t0x, t0y] = toScreen(trail[0].x, trail[0].y);
        ctx.moveTo(t0x, t0y);
        for (let k = 1; k < trail.length; k++) {
          const alpha = (k / trail.length) * 0.16;
          ctx.strokeStyle = `rgba(210,210,240,${alpha})`;
          const [tx, ty] = toScreen(trail[k].x, trail[k].y);
          ctx.lineTo(tx, ty);
        }
        ctx.lineWidth = 0.5;
        ctx.stroke();
        // Dot
        const [px, py] = toScreen(p.x, p.y);
        ctx.beginPath();
        ctx.arc(px, py, 0.9, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(200,200,225,0.40)";
        ctx.fill();
      }
    }

    function drawVelocityVectors() {
      const velScale = Math.min(cssW * 0.26, cssH * 0.48) * 0.12;
      for (let i = 0; i < 3; i++) {
        const [bx, by] = toScreen(bodies[i].x, bodies[i].y);
        const [r, g, b] = BODY_RGB[i];
        const vx = bodies[i].vx * velScale;
        const vy = bodies[i].vy * velScale;
        const speed = Math.sqrt(vx * vx + vy * vy);
        if (speed < 1) continue;
        const ex = bx + vx, ey = by + vy;
        // Shaft
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.lineTo(ex, ey);
        ctx.strokeStyle = `rgba(${r},${g},${b},0.30)`;
        ctx.lineWidth   = 0.8;
        ctx.stroke();
        // Arrowhead
        const angle = Math.atan2(vy, vx);
        const hl = 5;
        ctx.beginPath();
        ctx.moveTo(ex, ey);
        ctx.lineTo(ex - hl * Math.cos(angle - 0.42), ey - hl * Math.sin(angle - 0.42));
        ctx.moveTo(ex, ey);
        ctx.lineTo(ex - hl * Math.cos(angle + 0.42), ey - hl * Math.sin(angle + 0.42));
        ctx.strokeStyle = `rgba(${r},${g},${b},0.30)`;
        ctx.lineWidth   = 0.8;
        ctx.stroke();
      }
    }

    function drawBodies() {
      for (let i = 0; i < 3; i++) {
        const [bx, by] = toScreen(bodies[i].x, bodies[i].y);
        const [r, g, b] = BODY_RGB[i];

        const glow = ctx.createRadialGradient(bx, by, 0, bx, by, 22);
        glow.addColorStop(0,   `rgba(${r},${g},${b},0.22)`);
        glow.addColorStop(0.4, `rgba(${r},${g},${b},0.07)`);
        glow.addColorStop(1,   `rgba(${r},${g},${b},0)`);
        ctx.beginPath();
        ctx.arc(bx, by, 22, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(bx, by, 5, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${r},${g},${b},0.55)`;
        ctx.lineWidth   = 1.2;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(bx, by, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},0.92)`;
        ctx.fill();
      }
    }

    function draw() {
      ctx.clearRect(0, 0, cssW, cssH);
      drawFieldGrid();
      drawCenterOfMass();
      drawPotentialRings();
      drawBodyTrails();
      drawParticles();
      drawVelocityVectors();
      drawBodies();
    }

    function loop() {
      if (!paused) {
        stepBodies();
        stepParticles();
        if (frame % FIELD_PERIOD === 0) updateFieldGrid();
        draw();
        frame++;
      }
      raf = requestAnimationFrame(loop);
    }

    const visObs = new IntersectionObserver(([e]) => { paused = !e.isIntersecting; });
    visObs.observe(wrap);
    const resObs = new ResizeObserver(resize);
    resObs.observe(wrap);

    resize();
    updateFieldGrid();
    raf = requestAnimationFrame(loop);

    return () => { cancelAnimationFrame(raf); visObs.disconnect(); resObs.disconnect(); };
  }, []);

  return (
    <div
      ref={wrapRef}
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none"
      style={{ opacity: 0.70 }}
    >
      <canvas ref={canvasRef} className="absolute inset-0" />
    </div>
  );
}
