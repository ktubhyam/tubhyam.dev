/**
 * ThreeBodyBackground — N-body gravitational simulation canvas.
 *
 * 5 bodies (matching the 5 DisplayCard accent colours):
 *   amber · teal · violet · emerald · rose
 * Bodies 0-2: Chenciner-Montgomery figure-8 choreography.
 * Bodies 3-4: additional chaotic bodies that interact with the figure-8.
 *
 * Render layers (back → front):
 *   Gravitational field grid · CoM crosshair · Potential rings
 *   Body trails · Test particles · Velocity vectors · Bodies
 */
import { useRef, useEffect } from "react";

const G           = 1.0;
const M           = 1.0;
const SOFT_SQ     = 0.008;
const DT          = 0.0006;
const STEPS       = 4;
const TRAIL_LEN   = 300;
const PTRAIL_LEN  = 35;
const SEG         = 5;
const N_PARTICLES = 50;
const GRID_W      = 15;
const GRID_H      = 9;
const FIELD_EVERY = 4;
const ESCAPE_R    = 1.9;   // canvas half-width ≈ 2.1 sim units → respawn at 1.9

// 5 bodies — 0-2 figure-8, 3-4 additional
const IC = [
  { x:  0.97000436, y: -0.24308753, vx:  0.46620369, vy:  0.43236573 },
  { x: -0.97000436, y:  0.24308753, vx:  0.46620369, vy:  0.43236573 },
  { x:  0.0,        y:  0.0,        vx: -0.93240737, vy: -0.86473146 },
  { x:  0.0,        y:  1.65,       vx:  0.60,       vy:  0.0        },
  { x: -1.35,       y: -0.55,       vx:  0.30,       vy:  0.55       },
];

// Matches DisplayCards accent palette: amber / teal / violet / emerald / rose
const BODY_RGB: [number, number, number][] = [
  [201, 160,  74],
  [ 78, 205, 196],
  [167, 139, 250],
  [ 52, 211, 153],
  [251, 113, 133],
];

function seededRng(seed: number) {
  let s = seed | 0;
  return () => {
    s = Math.imul(1664525, s) + 1013904223 | 0;
    return (s >>> 0) / 0xffffffff;
  };
}

function gravAccel(
  bodies: { x: number; y: number }[],
  selfIdx: number,
): [number, number] {
  let ax = 0, ay = 0;
  const px = bodies[selfIdx].x, py = bodies[selfIdx].y;
  for (let j = 0; j < bodies.length; j++) {
    if (j === selfIdx) continue;
    const dx = bodies[j].x - px, dy = bodies[j].y - py;
    const r2 = dx * dx + dy * dy + SOFT_SQ;
    const r3 = r2 * Math.sqrt(r2);
    ax += G * M * dx / r3;
    ay += G * M * dy / r3;
  }
  return [ax, ay];
}

function gravAccelAt(
  bodies: { x: number; y: number }[],
  px: number, py: number,
): [number, number] {
  let ax = 0, ay = 0;
  for (const b of bodies) {
    const dx = b.x - px, dy = b.y - py;
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

    const N = IC.length;
    const bodies = IC.map(b => ({ ...b }));
    const trails: { x: number; y: number }[][] = Array.from({ length: N }, () => []);

    const rng = seededRng(0xc0ffee42);
    const particles = Array.from({ length: N_PARTICLES }, () => {
      const angle = rng() * Math.PI * 2;
      const r = 0.3 + rng() * 1.5;
      return {
        x: Math.cos(angle) * r, y: Math.sin(angle) * r,
        vx: (rng() - 0.5) * 0.40, vy: (rng() - 0.5) * 0.40,
        trail: [] as { x: number; y: number }[],
      };
    });

    const fieldAx  = new Float32Array(GRID_W * GRID_H);
    const fieldAy  = new Float32Array(GRID_W * GRID_H);
    const fieldMag = new Float32Array(GRID_W * GRID_H);

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

    function toScreen(x: number, y: number): [number, number] {
      const scale = Math.min(cssW * 0.24, cssH * 0.44);
      return [cssW / 2 + x * scale, cssH / 2 + y * scale];
    }

    // ── Simulation ────────────────────────────────────────────────────────────

    function stepBodies() {
      for (let s = 0; s < STEPS; s++) {
        const a0 = Array.from({ length: N }, (_, i) => gravAccel(bodies, i));
        for (let i = 0; i < N; i++) {
          bodies[i].x += bodies[i].vx * DT + 0.5 * a0[i][0] * DT * DT;
          bodies[i].y += bodies[i].vy * DT + 0.5 * a0[i][1] * DT * DT;
        }
        const a1 = Array.from({ length: N }, (_, i) => gravAccel(bodies, i));
        for (let i = 0; i < N; i++) {
          bodies[i].vx += 0.5 * (a0[i][0] + a1[i][0]) * DT;
          bodies[i].vy += 0.5 * (a0[i][1] + a1[i][1]) * DT;
        }
      }
      for (let i = 0; i < N; i++) {
        // Extra bodies respawn when they leave the visible area
        if (i >= 3) {
          const spd = bodies[i].vx ** 2 + bodies[i].vy ** 2;
          if (Math.abs(bodies[i].x) > ESCAPE_R || Math.abs(bodies[i].y) > ESCAPE_R || spd > 25) {
            const a = rng() * Math.PI * 2;
            const r = 0.5 + rng() * 1.0;
            bodies[i].x  = Math.cos(a) * r; bodies[i].y  = Math.sin(a) * r;
            bodies[i].vx = (rng() - 0.5) * 0.5; bodies[i].vy = (rng() - 0.5) * 0.5;
            trails[i] = [];
            continue;
          }
        }
        trails[i].push({ x: bodies[i].x, y: bodies[i].y });
        if (trails[i].length > TRAIL_LEN) trails[i].shift();
      }
    }

    function stepParticles() {
      const dt = DT * STEPS;
      for (const p of particles) {
        const [ax, ay] = gravAccelAt(bodies, p.x, p.y);
        p.vx += ax * dt; p.vy += ay * dt;
        p.x  += p.vx * dt; p.y  += p.vy * dt;
        if (Math.abs(p.x) > 3.5 || Math.abs(p.y) > 3.5 || p.vx ** 2 + p.vy ** 2 > 28) {
          const a = rng() * Math.PI * 2, r = 0.3 + rng() * 1.2;
          p.x = Math.cos(a) * r; p.y = Math.sin(a) * r;
          p.vx = (rng() - 0.5) * 0.35; p.vy = (rng() - 0.5) * 0.35;
          p.trail = [];
        }
        p.trail.push({ x: p.x, y: p.y });
        if (p.trail.length > PTRAIL_LEN) p.trail.shift();
      }
    }

    function updateFieldGrid() {
      const X0 = -2.4, X1 = 2.4, Y0 = -1.5, Y1 = 1.5;
      for (let gy = 0; gy < GRID_H; gy++) {
        for (let gx = 0; gx < GRID_W; gx++) {
          const sx = X0 + (gx / (GRID_W - 1)) * (X1 - X0);
          const sy = Y0 + (gy / (GRID_H - 1)) * (Y1 - Y0);
          const [ax, ay] = gravAccelAt(bodies, sx, sy);
          const idx = gy * GRID_W + gx;
          fieldAx[idx] = ax; fieldAy[idx] = ay;
          fieldMag[idx] = Math.sqrt(ax * ax + ay * ay);
        }
      }
    }

    // ── Draw layers ───────────────────────────────────────────────────────────

    function drawFieldGrid() {
      const X0 = -2.4, X1 = 2.4, Y0 = -1.5, Y1 = 1.5;
      for (let gy = 0; gy < GRID_H; gy++) {
        for (let gx = 0; gx < GRID_W; gx++) {
          const idx = gy * GRID_W + gx;
          const mag = fieldMag[idx];
          if (mag < 0.03) continue;
          const ax = fieldAx[idx], ay = fieldAy[idx];
          const sx = X0 + (gx / (GRID_W - 1)) * (X1 - X0);
          const sy = Y0 + (gy / (GRID_H - 1)) * (Y1 - Y0);
          const [px, py] = toScreen(sx, sy);
          const len = Math.min(Math.log1p(mag) * 10, 16);
          const nx = ax / mag, ny = ay / mag;
          const opacity = Math.min(mag * 0.08, 0.28);
          ctx.beginPath();
          ctx.moveTo(px - nx * len * 0.35, py - ny * len * 0.35);
          ctx.lineTo(px + nx * len * 0.65, py + ny * len * 0.65);
          ctx.strokeStyle = `rgba(200,205,240,${opacity})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
          // arrowhead
          const tip = 4;
          const angle = Math.atan2(ny, nx);
          const ex = px + nx * len * 0.65, ey = py + ny * len * 0.65;
          ctx.beginPath();
          ctx.moveTo(ex, ey);
          ctx.lineTo(ex - tip * Math.cos(angle - 0.5), ey - tip * Math.sin(angle - 0.5));
          ctx.moveTo(ex, ey);
          ctx.lineTo(ex - tip * Math.cos(angle + 0.5), ey - tip * Math.sin(angle + 0.5));
          ctx.strokeStyle = `rgba(200,205,240,${opacity * 0.7})`;
          ctx.lineWidth = 0.7;
          ctx.stroke();
        }
      }
    }

    function drawCenterOfMass() {
      const [cx, cy] = toScreen(0, 0);
      ctx.strokeStyle = "rgba(255,255,255,0.20)";
      ctx.lineWidth   = 1.0;
      ctx.beginPath();
      ctx.moveTo(cx - 8, cy); ctx.lineTo(cx + 8, cy);
      ctx.moveTo(cx, cy - 8); ctx.lineTo(cx, cy + 8);
      ctx.stroke();
      // outer ring
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      ctx.lineWidth   = 0.8;
      ctx.stroke();
    }

    function drawPotentialRings() {
      const radii = [18, 34, 54, 78, 108];
      ctx.setLineDash([3, 5]);
      for (let i = 0; i < N; i++) {
        const [bx, by] = toScreen(bodies[i].x, bodies[i].y);
        const [r, g, b] = BODY_RGB[i];
        for (let ri = 0; ri < radii.length; ri++) {
          const opacity = Math.max(0.14 - ri * 0.022, 0.020);
          ctx.beginPath();
          ctx.arc(bx, by, radii[ri], 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(${r},${g},${b},${opacity})`;
          ctx.lineWidth   = 0.9;
          ctx.stroke();
        }
      }
      ctx.setLineDash([]);
    }

    function drawBodyTrails() {
      for (let i = 0; i < N; i++) {
        const trail = trails[i];
        const [r, g, b] = BODY_RGB[i];
        for (let t = 0; t < trail.length - 1; t += SEG) {
          const depth   = (t + SEG) / trail.length;
          const opacity = 0.18 + depth * 0.72;
          const lw      = 1.0  + depth * 2.5;
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
        ctx.beginPath();
        const [t0x, t0y] = toScreen(trail[0].x, trail[0].y);
        ctx.moveTo(t0x, t0y);
        for (let k = 1; k < trail.length; k++) {
          const alpha = (k / trail.length) * 0.45;
          const [tx, ty] = toScreen(trail[k].x, trail[k].y);
          ctx.strokeStyle = `rgba(220,225,255,${alpha})`;
          ctx.lineWidth   = 0.7;
          ctx.lineTo(tx, ty);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(tx, ty);
        }
        const [px, py] = toScreen(p.x, p.y);
        ctx.beginPath();
        ctx.arc(px, py, 1.4, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(220,225,255,0.65)";
        ctx.fill();
      }
    }

    function drawVelocityVectors() {
      const vs = Math.min(cssW * 0.24, cssH * 0.44) * 0.12;
      for (let i = 0; i < N; i++) {
        const [bx, by] = toScreen(bodies[i].x, bodies[i].y);
        const [r, g, b] = BODY_RGB[i];
        const vx = bodies[i].vx * vs, vy = bodies[i].vy * vs;
        const spd = Math.sqrt(vx * vx + vy * vy);
        if (spd < 1) continue;
        const ex = bx + vx, ey = by + vy;
        ctx.beginPath();
        ctx.moveTo(bx, by); ctx.lineTo(ex, ey);
        ctx.strokeStyle = `rgba(${r},${g},${b},0.55)`;
        ctx.lineWidth   = 1.2;
        ctx.stroke();
        const angle = Math.atan2(vy, vx), hl = 6;
        ctx.beginPath();
        ctx.moveTo(ex, ey);
        ctx.lineTo(ex - hl * Math.cos(angle - 0.42), ey - hl * Math.sin(angle - 0.42));
        ctx.moveTo(ex, ey);
        ctx.lineTo(ex - hl * Math.cos(angle + 0.42), ey - hl * Math.sin(angle + 0.42));
        ctx.strokeStyle = `rgba(${r},${g},${b},0.55)`;
        ctx.lineWidth   = 1.1;
        ctx.stroke();
      }
    }

    function drawBodies() {
      for (let i = 0; i < N; i++) {
        const [bx, by] = toScreen(bodies[i].x, bodies[i].y);
        const [r, g, b] = BODY_RGB[i];

        // Wide soft glow
        const glow = ctx.createRadialGradient(bx, by, 0, bx, by, 50);
        glow.addColorStop(0,   `rgba(${r},${g},${b},0.55)`);
        glow.addColorStop(0.35, `rgba(${r},${g},${b},0.22)`);
        glow.addColorStop(1,   `rgba(${r},${g},${b},0)`);
        ctx.beginPath();
        ctx.arc(bx, by, 50, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();

        // Mid ring
        ctx.beginPath();
        ctx.arc(bx, by, 8, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${r},${g},${b},0.85)`;
        ctx.lineWidth   = 1.8;
        ctx.stroke();

        // Core dot
        ctx.beginPath();
        ctx.arc(bx, by, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},1.0)`;
        ctx.fill();

        // White hot centre
        ctx.beginPath();
        ctx.arc(bx, by, 2, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255,0.90)";
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
        if (frame % FIELD_EVERY === 0) updateFieldGrid();
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
    >
      <canvas ref={canvasRef} className="absolute inset-0" />
    </div>
  );
}
