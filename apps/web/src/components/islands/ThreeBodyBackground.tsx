/**
 * ThreeBodyBackground — 5-body gravitational simulation.
 *
 * Bodies 0-2: Chenciner-Montgomery figure-8 choreography (always stable).
 * Bodies 3-4: satellite test-particles orbiting the figure-8 system
 *             — feel gravity from 0-2, no feedback, always visible.
 *
 * Colours match the 5 DisplayCard accent palette:
 *   amber · teal · violet · emerald · rose
 *
 * Layers (back → front):
 *   Potential heat-map · Field arrows · CoM crosshair
 *   Potential rings · Trails · Particles · Velocity vectors · Bodies
 */
import { useRef, useEffect } from "react";

const G           = 1.0;
const M           = 1.0;
const SOFT_SQ     = 0.009;
const DT          = 0.0006;
const STEPS       = 4;
const TRAIL_LEN   = 300;
const SAT_TRAIL   = 200;
const PTRAIL_LEN  = 45;
const SEG         = 4;
const N_PARTICLES = 65;
const GRID_W      = 14;
const GRID_H      = 8;
const FIELD_EVERY = 3;
const SAT_ESCAPE  = 2.2;   // satellite respawn boundary

// Figure-8 initial conditions (Chenciner & Montgomery 2000)
const FIG8_IC = [
  { x:  0.97000436, y: -0.24308753, vx:  0.46620369, vy:  0.43236573 },
  { x: -0.97000436, y:  0.24308753, vx:  0.46620369, vy:  0.43236573 },
  { x:  0.0,        y:  0.0,        vx: -0.93240737, vy: -0.86473146 },
];

// Satellites start in stable orbits around the figure-8 system
// At r≈1.55 from centre, v_circ ≈ sqrt(3/1.55) ≈ 1.39
const SAT_IC = [
  { x:  0.0,   y:  1.55,  vx:  1.30, vy:  0.0  },
  { x:  0.0,   y: -1.55,  vx: -1.30, vy:  0.0  },
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

type Body = { x: number; y: number; vx: number; vy: number };

function gravAccel(bodies: Body[], selfIdx: number): [number, number] {
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

function gravAccelAt(sources: Body[], px: number, py: number): [number, number] {
  let ax = 0, ay = 0;
  for (const b of sources) {
    const dx = b.x - px, dy = b.y - py;
    const r2 = dx * dx + dy * dy + SOFT_SQ;
    const r3 = r2 * Math.sqrt(r2);
    ax += G * M * dx / r3;
    ay += G * M * dy / r3;
  }
  return [ax, ay];
}

function gravPotAt(sources: Body[], px: number, py: number): number {
  let phi = 0;
  for (const b of sources) {
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

    // Bodies: 0-2 figure-8, 3-4 satellites
    const fig8  = FIG8_IC.map(b => ({ ...b }));
    const sats  = SAT_IC.map(b => ({ ...b }));
    const allBodies = () => [...fig8, ...sats];

    // Trails: 5 total
    const trails: Body[][] = Array.from({ length: 5 }, () => []);

    const rng = seededRng(0xf00dcafe);
    const particles = Array.from({ length: N_PARTICLES }, () => {
      const angle = rng() * Math.PI * 2;
      const r = 0.2 + rng() * 1.3;
      return {
        x: Math.cos(angle) * r, y: Math.sin(angle) * r,
        vx: (rng() - 0.5) * 0.5, vy: (rng() - 0.5) * 0.5,
        trail: [] as Body[],
      };
    });

    const fieldAx  = new Float32Array(GRID_W * GRID_H);
    const fieldAy  = new Float32Array(GRID_W * GRID_H);
    const fieldMag = new Float32Array(GRID_W * GRID_H);

    // Low-res potential heatmap
    const POT_W = 80, POT_H = 48;
    const potCanvas = document.createElement("canvas");
    potCanvas.width  = POT_W;
    potCanvas.height = POT_H;
    const potCtx = potCanvas.getContext("2d")!;

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

    function scale() { return Math.min(cssW * 0.21, cssH * 0.39); }
    function toScreen(x: number, y: number): [number, number] {
      const s = scale();
      return [cssW / 2 + x * s, cssH / 2 + y * s];
    }
    function visRange() {
      const s = scale();
      return { xr: cssW / 2 / s, yr: cssH / 2 / s };
    }

    // ── Simulation ────────────────────────────────────────────────────────────

    function stepFig8() {
      // Velocity Verlet for the 3 figure-8 bodies
      for (let st = 0; st < STEPS; st++) {
        const a0 = fig8.map((_, i) => gravAccel(fig8, i));
        for (let i = 0; i < 3; i++) {
          fig8[i].x += fig8[i].vx * DT + 0.5 * a0[i][0] * DT * DT;
          fig8[i].y += fig8[i].vy * DT + 0.5 * a0[i][1] * DT * DT;
        }
        const a1 = fig8.map((_, i) => gravAccel(fig8, i));
        for (let i = 0; i < 3; i++) {
          fig8[i].vx += 0.5 * (a0[i][0] + a1[i][0]) * DT;
          fig8[i].vy += 0.5 * (a0[i][1] + a1[i][1]) * DT;
        }
      }
      for (let i = 0; i < 3; i++) {
        trails[i].push({ ...fig8[i] });
        if (trails[i].length > TRAIL_LEN) trails[i].shift();
      }
    }

    function stepSatellites() {
      // Runge-Kutta 4 for satellites in the field of fig8 only (no feedback)
      const dt = DT * STEPS;
      for (let si = 0; si < sats.length; si++) {
        const s = sats[si];
        // RK4
        const [ax1, ay1] = gravAccelAt(fig8, s.x, s.y);
        const k1x = s.vx, k1y = s.vy, k1vx = ax1, k1vy = ay1;

        const [ax2, ay2] = gravAccelAt(fig8, s.x + 0.5*dt*k1x, s.y + 0.5*dt*k1y);
        const k2x = s.vx + 0.5*dt*k1vx, k2y = s.vy + 0.5*dt*k1vy;
        const k2vx = ax2, k2vy = ay2;

        const [ax3, ay3] = gravAccelAt(fig8, s.x + 0.5*dt*k2x, s.y + 0.5*dt*k2y);
        const k3x = s.vx + 0.5*dt*k2vx, k3y = s.vy + 0.5*dt*k2vy;
        const k3vx = ax3, k3vy = ay3;

        const [ax4, ay4] = gravAccelAt(fig8, s.x + dt*k3x, s.y + dt*k3y);
        const k4x = s.vx + dt*k3vx, k4y = s.vy + dt*k3vy;
        const k4vx = ax4, k4vy = ay4;

        s.x  += dt/6 * (k1x  + 2*k2x  + 2*k3x  + k4x);
        s.y  += dt/6 * (k1y  + 2*k2y  + 2*k3y  + k4y);
        s.vx += dt/6 * (k1vx + 2*k2vx + 2*k3vx + k4vx);
        s.vy += dt/6 * (k1vy + 2*k2vy + 2*k3vy + k4vy);

        const spd2 = s.vx**2 + s.vy**2;
        if (Math.abs(s.x) > SAT_ESCAPE || Math.abs(s.y) > SAT_ESCAPE || spd2 > 28) {
          // Respawn at opposite starting position
          Object.assign(s, { ...SAT_IC[si] });
          s.vx *= (rng() * 0.4 + 0.8);
          s.vy *= (rng() * 0.4 + 0.8);
          trails[3 + si] = [];
          continue;
        }
        trails[3 + si].push({ ...s });
        if (trails[3 + si].length > SAT_TRAIL) trails[3 + si].shift();
      }
    }

    function stepParticles() {
      const dt = DT * STEPS;
      const all = allBodies();
      for (const p of particles) {
        const [ax, ay] = gravAccelAt(all, p.x, p.y);
        p.vx += ax * dt; p.vy += ay * dt;
        p.x  += p.vx * dt; p.y  += p.vy * dt;
        if (Math.abs(p.x) > 3.2 || Math.abs(p.y) > 3.2 || p.vx**2 + p.vy**2 > 32) {
          const a = rng() * Math.PI * 2, r = 0.2 + rng() * 1.1;
          p.x = Math.cos(a) * r; p.y = Math.sin(a) * r;
          p.vx = (rng() - 0.5) * 0.45; p.vy = (rng() - 0.5) * 0.45;
          p.trail = [];
        }
        p.trail.push({ x: p.x, y: p.y, vx: 0, vy: 0 });
        if (p.trail.length > PTRAIL_LEN) p.trail.shift();
      }
    }

    function updateFieldGrid() {
      const { xr, yr } = visRange();
      const X0 = -xr * 0.93, X1 = xr * 0.93;
      const Y0 = -yr * 0.93, Y1 = yr * 0.93;
      const all = allBodies();
      for (let gy = 0; gy < GRID_H; gy++) {
        for (let gx = 0; gx < GRID_W; gx++) {
          const sx = X0 + (gx / (GRID_W - 1)) * (X1 - X0);
          const sy = Y0 + (gy / (GRID_H - 1)) * (Y1 - Y0);
          const [ax, ay] = gravAccelAt(all, sx, sy);
          const idx = gy * GRID_W + gx;
          fieldAx[idx] = ax; fieldAy[idx] = ay;
          fieldMag[idx] = Math.sqrt(ax * ax + ay * ay);
        }
      }
    }

    function updatePotHeatmap() {
      const { xr, yr } = visRange();
      const all = allBodies();
      const img = potCtx.createImageData(POT_W, POT_H);
      const d = img.data;
      for (let py = 0; py < POT_H; py++) {
        for (let px = 0; px < POT_W; px++) {
          const sx = -xr + (px / (POT_W - 1)) * 2 * xr;
          const sy = -yr + (py / (POT_H - 1)) * 2 * yr;
          const phi = gravPotAt(all, sx, sy);
          const t = Math.min(1, Math.max(0, -phi / 15));
          const alpha = Math.pow(t, 2.0) * 55;
          const idx = (py * POT_W + px) * 4;
          d[idx]     = 201;
          d[idx + 1] = 160;
          d[idx + 2] =  74;
          d[idx + 3] = alpha;
        }
      }
      potCtx.putImageData(img, 0, 0);
    }

    // ── Draw layers ───────────────────────────────────────────────────────────

    function drawHeatmap() {
      ctx.save();
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(potCanvas, 0, 0, cssW, cssH);
      ctx.restore();
    }

    function drawFieldGrid() {
      const { xr, yr } = visRange();
      const X0 = -xr * 0.93, X1 = xr * 0.93;
      const Y0 = -yr * 0.93, Y1 = yr * 0.93;
      for (let gy = 0; gy < GRID_H; gy++) {
        for (let gx = 0; gx < GRID_W; gx++) {
          const idx = gy * GRID_W + gx;
          const mag = fieldMag[idx];
          if (mag < 0.025) continue;
          const ax = fieldAx[idx], ay = fieldAy[idx];
          const sx = X0 + (gx / (GRID_W - 1)) * (X1 - X0);
          const sy = Y0 + (gy / (GRID_H - 1)) * (Y1 - Y0);
          const [px, py] = toScreen(sx, sy);
          const len = Math.min(Math.log1p(mag) * 14, 30);
          const nx = ax / mag, ny = ay / mag;
          const op = Math.min(mag * 0.12, 0.50);
          // Shaft
          ctx.beginPath();
          ctx.moveTo(px - nx * len * 0.4, py - ny * len * 0.4);
          ctx.lineTo(px + nx * len * 0.6, py + ny * len * 0.6);
          ctx.strokeStyle = `rgba(180,210,255,${op})`;
          ctx.lineWidth = 1.4;
          ctx.stroke();
          // Arrowhead
          const ex = px + nx * len * 0.6, ey = py + ny * len * 0.6;
          const angle = Math.atan2(ny, nx);
          ctx.beginPath();
          ctx.moveTo(ex, ey);
          ctx.lineTo(ex - 7 * Math.cos(angle - 0.44), ey - 7 * Math.sin(angle - 0.44));
          ctx.moveTo(ex, ey);
          ctx.lineTo(ex - 7 * Math.cos(angle + 0.44), ey - 7 * Math.sin(angle + 0.44));
          ctx.strokeStyle = `rgba(180,210,255,${op * 0.8})`;
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }
      }
    }

    function drawCoM() {
      const [cx, cy] = toScreen(0, 0);
      ctx.strokeStyle = "rgba(255,255,255,0.32)";
      ctx.lineWidth   = 1.4;
      ctx.beginPath();
      ctx.moveTo(cx - 12, cy); ctx.lineTo(cx + 12, cy);
      ctx.moveTo(cx, cy - 12); ctx.lineTo(cx, cy + 12);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,255,255,0.22)";
      ctx.lineWidth = 1.0;
      ctx.stroke();
    }

    function drawPotRings() {
      const radii = [15, 28, 45, 66, 92];
      ctx.setLineDash([4, 4]);
      const all5 = [...fig8.map(b => ({ ...b })), ...sats];
      for (let i = 0; i < 5; i++) {
        const bx_sim = i < 3 ? fig8[i].x : sats[i - 3].x;
        const by_sim = i < 3 ? fig8[i].y : sats[i - 3].y;
        const [bx, by] = toScreen(bx_sim, by_sim);
        const [r, g, b] = BODY_RGB[i];
        for (let ri = 0; ri < radii.length; ri++) {
          const op = Math.max(0.25 - ri * 0.036, 0.030);
          ctx.beginPath();
          ctx.arc(bx, by, radii[ri], 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(${r},${g},${b},${op})`;
          ctx.lineWidth   = 1.3;
          ctx.stroke();
        }
      }
      ctx.setLineDash([]);
    }

    function drawTrails() {
      const all5x = [
        ...fig8.map(b => b.x),
        ...sats.map(b => b.x),
      ];
      const all5y = [
        ...fig8.map(b => b.y),
        ...sats.map(b => b.y),
      ];
      void all5x; void all5y;

      for (let i = 0; i < 5; i++) {
        const trail = trails[i];
        if (trail.length < 2) continue;
        const [r, g, b] = BODY_RGB[i];
        for (let t = 0; t < trail.length - 1; t += SEG) {
          const depth = (t + SEG) / trail.length;
          const op    = 0.22 + depth * 0.78;
          const lw    = 0.8  + depth * 3.8;
          ctx.beginPath();
          ctx.strokeStyle = `rgba(${r},${g},${b},${op})`;
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
          const alpha = (k / trail.length) * 0.55;
          const [x0, y0] = toScreen(trail[k - 1].x, trail[k - 1].y);
          const [x1, y1] = toScreen(trail[k].x, trail[k].y);
          ctx.beginPath();
          ctx.moveTo(x0, y0); ctx.lineTo(x1, y1);
          ctx.strokeStyle = `rgba(210,220,255,${alpha})`;
          ctx.lineWidth = 0.9;
          ctx.stroke();
        }
        const [px2, py2] = toScreen(p.x, p.y);
        ctx.beginPath();
        ctx.arc(px2, py2, 1.6, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(210,220,255,0.80)";
        ctx.fill();
      }
    }

    function drawVelocity() {
      const s = scale();
      const vs = s * 0.13;
      const all5 = [
        ...fig8,
        ...sats,
      ];
      for (let i = 0; i < 5; i++) {
        const bod = all5[i];
        const [bx, by] = toScreen(bod.x, bod.y);
        const [r, g, b] = BODY_RGB[i];
        const vx = bod.vx * vs, vy = bod.vy * vs;
        const spd = Math.sqrt(vx * vx + vy * vy);
        if (spd < 1) continue;
        const ex = bx + vx, ey = by + vy;
        ctx.beginPath();
        ctx.moveTo(bx, by); ctx.lineTo(ex, ey);
        ctx.strokeStyle = `rgba(${r},${g},${b},0.70)`;
        ctx.lineWidth   = 1.6;
        ctx.stroke();
        const angle = Math.atan2(vy, vx);
        ctx.beginPath();
        ctx.moveTo(ex, ey);
        ctx.lineTo(ex - 8 * Math.cos(angle - 0.40), ey - 8 * Math.sin(angle - 0.40));
        ctx.moveTo(ex, ey);
        ctx.lineTo(ex - 8 * Math.cos(angle + 0.40), ey - 8 * Math.sin(angle + 0.40));
        ctx.strokeStyle = `rgba(${r},${g},${b},0.55)`;
        ctx.lineWidth = 1.3;
        ctx.stroke();
      }
    }

    function drawBodies() {
      const all5 = [...fig8, ...sats];
      for (let i = 0; i < 5; i++) {
        const bod = all5[i];
        const [bx, by] = toScreen(bod.x, bod.y);
        const [r, g, b] = BODY_RGB[i];

        // Outer ambient glow
        const glow = ctx.createRadialGradient(bx, by, 0, bx, by, 72);
        glow.addColorStop(0,    `rgba(${r},${g},${b},0.72)`);
        glow.addColorStop(0.25, `rgba(${r},${g},${b},0.38)`);
        glow.addColorStop(0.6,  `rgba(${r},${g},${b},0.12)`);
        glow.addColorStop(1,    `rgba(${r},${g},${b},0)`);
        ctx.beginPath();
        ctx.arc(bx, by, 72, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();

        // Outer ring
        ctx.beginPath();
        ctx.arc(bx, by, 11, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${r},${g},${b},0.92)`;
        ctx.lineWidth   = 2.2;
        ctx.stroke();

        // Coloured core
        ctx.beginPath();
        ctx.arc(bx, by, 6, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},1.0)`;
        ctx.fill();

        // White-hot centre
        ctx.beginPath();
        ctx.arc(bx, by, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255,0.98)";
        ctx.fill();
      }
    }

    let potFrame = 0;
    function draw() {
      ctx.clearRect(0, 0, cssW, cssH);
      if (potFrame % 10 === 0) updatePotHeatmap();
      potFrame++;
      drawHeatmap();
      drawFieldGrid();
      drawCoM();
      drawPotRings();
      drawTrails();
      drawParticles();
      drawVelocity();
      drawBodies();
    }

    function loop() {
      if (!paused) {
        stepFig8();
        stepSatellites();
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
    updatePotHeatmap();
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
