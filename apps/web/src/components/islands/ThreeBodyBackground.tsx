/**
 * ThreeBodyBackground — 5-body gravitational simulation.
 *
 * 5 bodies on a regular pentagon, v_circ ≈ 1.515 — all visible from frame 0.
 * Colors match the 5 DisplayCard accent palette exactly.
 *
 * Render layers (back → front):
 *   Equipotential heat-map · Field arrows · CoM crosshair
 *   Potential rings · Trails · Particles · Velocity vectors · Bodies
 */
import { useRef, useEffect } from "react";

const G           = 1.0;
const M           = 1.0;
const SOFT_SQ     = 0.01;
const DT          = 0.0008;
const STEPS       = 3;
const TRAIL_LEN   = 280;
const PTRAIL_LEN  = 40;
const SEG         = 4;
const N_PARTICLES = 60;
const GRID_W      = 14;
const GRID_H      = 8;
const FIELD_EVERY = 3;
const ESCAPE_R    = 2.1;

// Regular pentagon, radius 0.6, circular-orbit velocities (v_circ ≈ 1.515)
// Zero total momentum. All bodies well within canvas bounds at start.
const IC = [
  { x:  0.6000, y:  0.0000, vx:  0.0000, vy:  1.515 },
  { x:  0.1854, y:  0.5706, vx: -1.4413, vy:  0.4681 },
  { x: -0.4854, y:  0.3528, vx: -0.8910, vy: -1.2265 },
  { x: -0.4854, y: -0.3528, vx:  0.8910, vy: -1.2265 },
  { x:  0.1854, y: -0.5706, vx:  1.4413, vy:  0.4681 },
];

// Matches DisplayCards: amber / teal / violet / emerald / rose
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

function gravAccel(bodies: { x: number; y: number }[], selfIdx: number): [number, number] {
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

function gravAccelAt(bodies: { x: number; y: number }[], px: number, py: number): [number, number] {
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

function gravPotentialAt(bodies: { x: number; y: number }[], px: number, py: number): number {
  let phi = 0;
  for (const b of bodies) {
    const dx = b.x - px, dy = b.y - py;
    phi -= G * M / Math.sqrt(dx * dx + dy * dy + SOFT_SQ);
  }
  return phi;
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

    const rng = seededRng(0xdeadbeef);
    const particles = Array.from({ length: N_PARTICLES }, () => {
      const angle = rng() * Math.PI * 2;
      const r = 0.2 + rng() * 1.2;
      return {
        x: Math.cos(angle) * r, y: Math.sin(angle) * r,
        vx: (rng() - 0.5) * 0.5, vy: (rng() - 0.5) * 0.5,
        trail: [] as { x: number; y: number }[],
      };
    });

    // Field grid data
    const fieldAx  = new Float32Array(GRID_W * GRID_H);
    const fieldAy  = new Float32Array(GRID_W * GRID_H);
    const fieldMag = new Float32Array(GRID_W * GRID_H);

    // Potential heat-map — low-res offscreen canvas, re-rendered every few seconds
    let potCanvas: HTMLCanvasElement | null = null;
    let potCtx: CanvasRenderingContext2D | null = null;
    const POT_W = 80, POT_H = 48;

    function initPotCanvas() {
      potCanvas = document.createElement("canvas");
      potCanvas.width  = POT_W;
      potCanvas.height = POT_H;
      potCtx = potCanvas.getContext("2d");
    }
    initPotCanvas();

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

    // Scale: fits ±2.1 sim units within canvas bounds
    function toScreen(x: number, y: number): [number, number] {
      const scale = Math.min(cssW * 0.22, cssH * 0.40);
      return [cssW / 2 + x * scale, cssH / 2 + y * scale];
    }
    function simRange() {
      const scale = Math.min(cssW * 0.22, cssH * 0.40);
      return { xr: cssW / 2 / scale, yr: cssH / 2 / scale };
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
        const spd = bodies[i].vx ** 2 + bodies[i].vy ** 2;
        const escaped = Math.abs(bodies[i].x) > ESCAPE_R || Math.abs(bodies[i].y) > ESCAPE_R || spd > 30;
        if (escaped) {
          const a = rng() * Math.PI * 2, r = 0.3 + rng() * 0.7;
          bodies[i].x  = Math.cos(a) * r; bodies[i].y  = Math.sin(a) * r;
          bodies[i].vx = (rng() - 0.5) * 0.8; bodies[i].vy = (rng() - 0.5) * 0.8;
          trails[i] = [];
          continue;
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
        const escaped = Math.abs(p.x) > 3.0 || Math.abs(p.y) > 3.0 || p.vx ** 2 + p.vy ** 2 > 30;
        if (escaped) {
          const a = rng() * Math.PI * 2, r = 0.2 + rng() * 1.0;
          p.x = Math.cos(a) * r; p.y = Math.sin(a) * r;
          p.vx = (rng() - 0.5) * 0.4; p.vy = (rng() - 0.5) * 0.4;
          p.trail = [];
        }
        p.trail.push({ x: p.x, y: p.y });
        if (p.trail.length > PTRAIL_LEN) p.trail.shift();
      }
    }

    function updateFieldGrid() {
      const { xr, yr } = simRange();
      const X0 = -xr * 0.95, X1 = xr * 0.95;
      const Y0 = -yr * 0.95, Y1 = yr * 0.95;
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

    // Potential heat-map drawn to low-res offscreen canvas, then stretched to fill
    function updatePotentialHeatmap() {
      if (!potCtx) return;
      const { xr, yr } = simRange();
      const imageData = potCtx.createImageData(POT_W, POT_H);
      const d = imageData.data;
      for (let py = 0; py < POT_H; py++) {
        for (let px = 0; px < POT_W; px++) {
          const sx = -xr + (px / (POT_W - 1)) * 2 * xr;
          const sy = -yr + (py / (POT_H - 1)) * 2 * yr;
          const phi = gravPotentialAt(bodies, sx, sy);
          // phi is negative (bound), map -30..0 → dark amber glow
          const t = Math.min(1, Math.max(0, -phi / 18));
          const alpha = Math.pow(t, 2.2) * 38;  // subtle: max ~38/255 opacity
          d[(py * POT_W + px) * 4 + 0] = 201;
          d[(py * POT_W + px) * 4 + 1] = 160;
          d[(py * POT_W + px) * 4 + 2] =  74;
          d[(py * POT_W + px) * 4 + 3] = alpha;
        }
      }
      potCtx.putImageData(imageData, 0, 0);
    }

    // ── Draw layers ───────────────────────────────────────────────────────────

    function drawPotentialHeatmap() {
      if (!potCanvas) return;
      ctx.save();
      ctx.globalAlpha = 1;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(potCanvas, 0, 0, cssW, cssH);
      ctx.restore();
    }

    function drawFieldGrid() {
      const { xr, yr } = simRange();
      const X0 = -xr * 0.95, X1 = xr * 0.95;
      const Y0 = -yr * 0.95, Y1 = yr * 0.95;
      for (let gy = 0; gy < GRID_H; gy++) {
        for (let gx = 0; gx < GRID_W; gx++) {
          const idx = gy * GRID_W + gx;
          const mag = fieldMag[idx];
          if (mag < 0.03) continue;
          const ax = fieldAx[idx], ay = fieldAy[idx];
          const sx = X0 + (gx / (GRID_W - 1)) * (X1 - X0);
          const sy = Y0 + (gy / (GRID_H - 1)) * (Y1 - Y0);
          const [px, py] = toScreen(sx, sy);
          const len = Math.min(Math.log1p(mag) * 12, 26);
          const nx = ax / mag, ny = ay / mag;
          const opacity = Math.min(mag * 0.10, 0.40);
          // Shaft
          ctx.beginPath();
          ctx.moveTo(px - nx * len * 0.4, py - ny * len * 0.4);
          ctx.lineTo(px + nx * len * 0.6, py + ny * len * 0.6);
          ctx.strokeStyle = `rgba(200,210,255,${opacity})`;
          ctx.lineWidth = 1.2;
          ctx.stroke();
          // Arrowhead
          const ex = px + nx * len * 0.6, ey = py + ny * len * 0.6;
          const angle = Math.atan2(ny, nx);
          const hl = 5.5;
          ctx.beginPath();
          ctx.moveTo(ex, ey);
          ctx.lineTo(ex - hl * Math.cos(angle - 0.45), ey - hl * Math.sin(angle - 0.45));
          ctx.moveTo(ex, ey);
          ctx.lineTo(ex - hl * Math.cos(angle + 0.45), ey - hl * Math.sin(angle + 0.45));
          ctx.strokeStyle = `rgba(200,210,255,${opacity * 0.75})`;
          ctx.lineWidth = 1.0;
          ctx.stroke();
        }
      }
    }

    function drawCenterOfMass() {
      const [cx, cy] = toScreen(0, 0);
      ctx.strokeStyle = "rgba(255,255,255,0.28)";
      ctx.lineWidth   = 1.2;
      ctx.beginPath();
      ctx.moveTo(cx - 10, cy); ctx.lineTo(cx + 10, cy);
      ctx.moveTo(cx, cy - 10); ctx.lineTo(cx, cy + 10);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,255,255,0.20)";
      ctx.lineWidth = 1.0;
      ctx.stroke();
    }

    function drawPotentialRings() {
      const radii = [16, 30, 48, 70, 97];
      ctx.setLineDash([4, 4]);
      for (let i = 0; i < N; i++) {
        const [bx, by] = toScreen(bodies[i].x, bodies[i].y);
        const [r, g, b] = BODY_RGB[i];
        for (let ri = 0; ri < radii.length; ri++) {
          const opacity = Math.max(0.20 - ri * 0.030, 0.028);
          ctx.beginPath();
          ctx.arc(bx, by, radii[ri], 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(${r},${g},${b},${opacity})`;
          ctx.lineWidth   = 1.2;
          ctx.stroke();
        }
      }
      ctx.setLineDash([]);
    }

    function drawBodyTrails() {
      for (let i = 0; i < N; i++) {
        const trail = trails[i];
        if (trail.length < 2) continue;
        const [r, g, b] = BODY_RGB[i];
        for (let t = 0; t < trail.length - 1; t += SEG) {
          const depth   = (t + SEG) / trail.length;
          const opacity = 0.20 + depth * 0.80;
          const lw      = 0.8  + depth * 3.2;
          ctx.beginPath();
          ctx.strokeStyle = `rgba(${r},${g},${b},${opacity})`;
          ctx.lineWidth   = lw;
          ctx.lineCap     = "round";
          const [sx, sy] = toScreen(trail[t].x, trail[t].y);
          ctx.moveTo(sx, sy);
          for (let k = 1; k < SEG && t + k < trail.length; k++) {
            const [px2, py2] = toScreen(trail[t + k].x, trail[t + k].y);
            ctx.lineTo(px2, py2);
          }
          ctx.stroke();
        }
      }
    }

    function drawParticles() {
      for (const p of particles) {
        const trail = p.trail;
        if (trail.length < 2) continue;
        for (let k = 1; k < trail.length; k++) {
          const alpha = (k / trail.length) * 0.50;
          const [x0, y0] = toScreen(trail[k - 1].x, trail[k - 1].y);
          const [x1, y1] = toScreen(trail[k].x, trail[k].y);
          ctx.beginPath();
          ctx.moveTo(x0, y0);
          ctx.lineTo(x1, y1);
          ctx.strokeStyle = `rgba(215,220,255,${alpha})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
        const [px2, py2] = toScreen(p.x, p.y);
        ctx.beginPath();
        ctx.arc(px2, py2, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(215,220,255,0.75)";
        ctx.fill();
      }
    }

    function drawVelocityVectors() {
      const scale = Math.min(cssW * 0.22, cssH * 0.40);
      const vs = scale * 0.12;
      for (let i = 0; i < N; i++) {
        const [bx, by] = toScreen(bodies[i].x, bodies[i].y);
        const [r, g, b] = BODY_RGB[i];
        const vx = bodies[i].vx * vs, vy = bodies[i].vy * vs;
        const spd = Math.sqrt(vx * vx + vy * vy);
        if (spd < 1) continue;
        const ex = bx + vx, ey = by + vy;
        ctx.beginPath();
        ctx.moveTo(bx, by); ctx.lineTo(ex, ey);
        ctx.strokeStyle = `rgba(${r},${g},${b},0.65)`;
        ctx.lineWidth   = 1.4;
        ctx.stroke();
        const angle = Math.atan2(vy, vx), hl = 7;
        ctx.beginPath();
        ctx.moveTo(ex, ey);
        ctx.lineTo(ex - hl * Math.cos(angle - 0.40), ey - hl * Math.sin(angle - 0.40));
        ctx.moveTo(ex, ey);
        ctx.lineTo(ex - hl * Math.cos(angle + 0.40), ey - hl * Math.sin(angle + 0.40));
        ctx.strokeStyle = `rgba(${r},${g},${b},0.55)`;
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }
    }

    function drawBodies() {
      for (let i = 0; i < N; i++) {
        const [bx, by] = toScreen(bodies[i].x, bodies[i].y);
        const [r, g, b] = BODY_RGB[i];

        // Wide ambient glow
        const glow = ctx.createRadialGradient(bx, by, 0, bx, by, 58);
        glow.addColorStop(0,    `rgba(${r},${g},${b},0.65)`);
        glow.addColorStop(0.30, `rgba(${r},${g},${b},0.28)`);
        glow.addColorStop(0.70, `rgba(${r},${g},${b},0.08)`);
        glow.addColorStop(1,    `rgba(${r},${g},${b},0)`);
        ctx.beginPath();
        ctx.arc(bx, by, 58, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();

        // Outer ring
        ctx.beginPath();
        ctx.arc(bx, by, 9.5, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${r},${g},${b},0.90)`;
        ctx.lineWidth   = 2.0;
        ctx.stroke();

        // Core
        ctx.beginPath();
        ctx.arc(bx, by, 5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},1.0)`;
        ctx.fill();

        // White-hot centre
        ctx.beginPath();
        ctx.arc(bx, by, 2.2, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255,0.95)";
        ctx.fill();
      }
    }

    let potFrame = 0;
    function draw() {
      ctx.clearRect(0, 0, cssW, cssH);
      // Update potential heat-map every 12 frames (cheap-ish)
      if (potFrame % 12 === 0) updatePotentialHeatmap();
      potFrame++;
      drawPotentialHeatmap();
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
    updatePotentialHeatmap();
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
