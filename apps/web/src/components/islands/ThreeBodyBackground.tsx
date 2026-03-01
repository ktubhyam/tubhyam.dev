/**
 * ThreeBodyBackground — 5-body gravitational simulation.
 *
 * Bodies 0-2: Chenciner-Montgomery figure-8 (always stable).
 * Bodies 3-4: satellites in RK4 orbit around the figure-8.
 *
 * Layers: potential heatmap · CoM crosshair · proximity arcs
 *         trails · particles · velocity vectors · bodies
 */
import { useRef, useEffect } from "react";

const G           = 1.0;
const M           = 1.0;
const SOFT_SQ     = 0.009;
const DT          = 0.0006;
const STEPS       = 4;
const TRAIL_LEN   = 300;
const SAT_TRAIL   = 200;
const PTRAIL_LEN  = 40;
const SEG         = 4;
const N_PARTICLES = 140;
const SAT_ESCAPE  = 1.45;
const PROX_THRESH = 0.55; // sim-units — draw arc below this distance

// Figure-8 choreography (Chenciner & Montgomery 2000)
const FIG8_IC = [
  { x:  0.97000436, y: -0.24308753, vx:  0.46620369, vy:  0.43236573 },
  { x: -0.97000436, y:  0.24308753, vx:  0.46620369, vy:  0.43236573 },
  { x:  0.0,        y:  0.0,        vx: -0.93240737, vy: -0.86473146 },
];

// Satellites: r=1.0, v_circ=sqrt(3/1)=1.73 — well within canvas bounds
const SAT_IC = [
  { x:  0.0,  y:  1.00, vx:  1.62, vy:  0.0  },
  { x:  0.0,  y: -1.00, vx: -1.62, vy:  0.0  },
];

// amber / teal / violet / emerald / rose  — matches DisplayCards
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

type V = { x: number; y: number; vx: number; vy: number };

function gravAccel(bodies: V[], selfIdx: number): [number, number] {
  let ax = 0, ay = 0;
  const px = bodies[selfIdx].x, py = bodies[selfIdx].y;
  for (let j = 0; j < bodies.length; j++) {
    if (j === selfIdx) continue;
    const dx = bodies[j].x - px, dy = bodies[j].y - py;
    const r2 = dx*dx + dy*dy + SOFT_SQ;
    const r3 = r2 * Math.sqrt(r2);
    ax += G * M * dx / r3;
    ay += G * M * dy / r3;
  }
  return [ax, ay];
}

function gravAccelAt(src: V[], px: number, py: number): [number, number] {
  let ax = 0, ay = 0;
  for (const b of src) {
    const dx = b.x - px, dy = b.y - py;
    const r2 = dx*dx + dy*dy + SOFT_SQ;
    const r3 = r2 * Math.sqrt(r2);
    ax += G * M * dx / r3;
    ay += G * M * dy / r3;
  }
  return [ax, ay];
}

function gravPotAt(src: V[], px: number, py: number): number {
  let phi = 0;
  for (const b of src) {
    const dx = b.x - px, dy = b.y - py;
    phi -= G * M / Math.sqrt(dx*dx + dy*dy + SOFT_SQ);
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

    const fig8 = FIG8_IC.map(b => ({ ...b }));
    const sats = SAT_IC.map(b => ({ ...b }));
    const all5 = (): V[] => [...fig8, ...sats];

    const trails: V[][] = Array.from({ length: 5 }, () => []);

    const rng = seededRng(0xf00dcafe);
    const particles = Array.from({ length: N_PARTICLES }, () => {
      const a = rng() * Math.PI * 2;
      const r = 0.15 + rng() * 1.4;
      return {
        x: Math.cos(a) * r, y: Math.sin(a) * r,
        vx: (rng() - 0.5) * 0.5, vy: (rng() - 0.5) * 0.5,
        trail: [] as { x: number; y: number }[],
      };
    });

    // Potential heatmap
    const POT_W = 80, POT_H = 48;
    const potC  = document.createElement("canvas");
    potC.width  = POT_W; potC.height = POT_H;
    const potX  = potC.getContext("2d")!;

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

    // Zoom out enough that r=1.45 satellites stay within the canvas vertically
    function sc() { return Math.min(cssW * 0.17, cssH * 0.30); }
    function toScreen(x: number, y: number): [number, number] {
      const s = sc();
      return [cssW / 2 + x * s, cssH / 2 + y * s];
    }
    function visRange() {
      const s = sc();
      return { xr: cssW / 2 / s, yr: cssH / 2 / s };
    }

    // ── Simulation ────────────────────────────────────────────────────────────

    function stepFig8() {
      for (let st = 0; st < STEPS; st++) {
        const a0 = fig8.map((_, i) => gravAccel(fig8, i));
        for (let i = 0; i < 3; i++) {
          fig8[i].x  += fig8[i].vx * DT + 0.5 * a0[i][0] * DT * DT;
          fig8[i].y  += fig8[i].vy * DT + 0.5 * a0[i][1] * DT * DT;
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

    function stepSats() {
      const dt = DT * STEPS;
      for (let si = 0; si < sats.length; si++) {
        const s = sats[si];
        const rk = (bx: number, by: number): [number, number] => gravAccelAt(fig8, bx, by);
        const [ax1, ay1] = rk(s.x, s.y);
        const k1x = s.vx, k1y = s.vy;
        const [ax2, ay2] = rk(s.x + 0.5*dt*k1x, s.y + 0.5*dt*k1y);
        const k2x = s.vx + 0.5*dt*ax1, k2y = s.vy + 0.5*dt*ay1;
        const [ax3, ay3] = rk(s.x + 0.5*dt*k2x, s.y + 0.5*dt*k2y);
        const k3x = s.vx + 0.5*dt*ax2, k3y = s.vy + 0.5*dt*ay2;
        const [ax4, ay4] = rk(s.x + dt*k3x, s.y + dt*k3y);
        s.x  += dt/6 * (k1x + 2*(s.vx+0.5*dt*ax2) + 2*k3x + (s.vx+dt*ax3));
        s.y  += dt/6 * (k1y + 2*(s.vy+0.5*dt*ay2) + 2*k3y + (s.vy+dt*ay3));
        s.vx += dt/6 * (ax1 + 2*ax2 + 2*ax3 + ax4);
        s.vy += dt/6 * (ay1 + 2*ay2 + 2*ay3 + ay4);
        if (Math.abs(s.x) > SAT_ESCAPE || Math.abs(s.y) > SAT_ESCAPE || s.vx**2+s.vy**2 > 28) {
          Object.assign(s, { ...SAT_IC[si] });
          s.vx *= 0.9 + rng() * 0.2;
          trails[3 + si] = [];
          continue;
        }
        trails[3 + si].push({ ...s });
        if (trails[3 + si].length > SAT_TRAIL) trails[3 + si].shift();
      }
    }

    function stepParticles() {
      const dt = DT * STEPS;
      const bodies = all5();
      for (const p of particles) {
        const [ax, ay] = gravAccelAt(bodies, p.x, p.y);
        p.vx += ax * dt; p.vy += ay * dt;
        p.x  += p.vx * dt; p.y  += p.vy * dt;
        if (Math.abs(p.x) > 3.2 || Math.abs(p.y) > 3.2 || p.vx**2+p.vy**2 > 32) {
          const a = rng() * Math.PI * 2, r = 0.15 + rng() * 1.1;
          p.x = Math.cos(a) * r; p.y = Math.sin(a) * r;
          p.vx = (rng()-0.5)*0.45; p.vy = (rng()-0.5)*0.45;
          p.trail = [];
        }
        p.trail.push({ x: p.x, y: p.y });
        if (p.trail.length > PTRAIL_LEN) p.trail.shift();
      }
    }

    function updatePot() {
      const { xr, yr } = visRange();
      const bodies = all5();
      const img = potX.createImageData(POT_W, POT_H);
      const d = img.data;
      for (let py = 0; py < POT_H; py++) {
        for (let px = 0; px < POT_W; px++) {
          const sx = -xr + (px / (POT_W-1)) * 2 * xr;
          const sy = -yr + (py / (POT_H-1)) * 2 * yr;
          const phi = gravPotAt(bodies, sx, sy);
          const t = Math.min(1, Math.max(0, -phi / 14));
          const alpha = Math.pow(t, 2.4) * 32;
          const idx = (py * POT_W + px) * 4;
          d[idx]   = 201; d[idx+1] = 160; d[idx+2] = 74; d[idx+3] = alpha;
        }
      }
      potX.putImageData(img, 0, 0);
    }

    // ── Draw ─────────────────────────────────────────────────────────────────

    function drawHeatmap() {
      ctx.save();
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(potC, 0, 0, cssW, cssH);
      ctx.restore();
    }

    function drawCoM() {
      const [cx, cy] = toScreen(0, 0);
      ctx.strokeStyle = "rgba(255,255,255,0.18)";
      ctx.lineWidth   = 1.0;
      ctx.beginPath();
      ctx.moveTo(cx - 8, cy); ctx.lineTo(cx + 8, cy);
      ctx.moveTo(cx, cy - 8); ctx.lineTo(cx, cy + 8);
      ctx.stroke();
    }

    // Glowing arc between bodies that pass close — the "interaction" effect
    function drawProximityArcs() {
      const bodies = all5();
      for (let i = 0; i < 5; i++) {
        for (let j = i + 1; j < 5; j++) {
          const dx = bodies[i].x - bodies[j].x;
          const dy = bodies[i].y - bodies[j].y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          if (dist > PROX_THRESH) continue;
          const t = 1 - dist / PROX_THRESH; // 0=far, 1=touching
          const [x1, y1] = toScreen(bodies[i].x, bodies[i].y);
          const [x2, y2] = toScreen(bodies[j].x, bodies[j].y);
          const [r1, g1, b1] = BODY_RGB[i];
          const [r2, g2, b2] = BODY_RGB[j];

          // Gradient arc between the two bodies
          const grad = ctx.createLinearGradient(x1, y1, x2, y2);
          grad.addColorStop(0, `rgba(${r1},${g1},${b1},${t * 0.40})`);
          grad.addColorStop(1, `rgba(${r2},${g2},${b2},${t * 0.40})`);
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.strokeStyle = grad;
          ctx.lineWidth = 1.0 + t * 2.5;
          ctx.stroke();

          // White flash at midpoint
          const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
          const gr = ctx.createRadialGradient(mx, my, 0, mx, my, 18 * t);
          gr.addColorStop(0, `rgba(255,255,255,${t * 0.30})`);
          gr.addColorStop(1, "rgba(255,255,255,0)");
          ctx.beginPath();
          ctx.arc(mx, my, 18 * t, 0, Math.PI * 2);
          ctx.fillStyle = gr;
          ctx.fill();
        }
      }
    }

    function drawTrails() {
      for (let i = 0; i < 5; i++) {
        const trail = trails[i];
        if (trail.length < 2) continue;
        const [r, g, b] = BODY_RGB[i];
        for (let t = 0; t < trail.length - 1; t += SEG) {
          const depth = (t + SEG) / trail.length;
          const op  = 0.08 + depth * 0.42;
          const lw  = 0.5  + depth * 2.0;
          ctx.beginPath();
          ctx.strokeStyle = `rgba(${r},${g},${b},${op})`;
          ctx.lineWidth   = lw;
          ctx.lineCap     = "round";
          const [sx, sy] = toScreen(trail[t].x, trail[t].y);
          ctx.moveTo(sx, sy);
          for (let k = 1; k < SEG && t + k < trail.length; k++) {
            const [px2, py2] = toScreen(trail[t+k].x, trail[t+k].y);
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
          const alpha = (k / trail.length) * 0.28;
          const [x0, y0] = toScreen(trail[k-1].x, trail[k-1].y);
          const [x1, y1] = toScreen(trail[k].x, trail[k].y);
          ctx.beginPath();
          ctx.moveTo(x0, y0); ctx.lineTo(x1, y1);
          ctx.strokeStyle = `rgba(200,215,255,${alpha})`;
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }
        const [px2, py2] = toScreen(p.x, p.y);
        ctx.beginPath();
        ctx.arc(px2, py2, 1.1, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(200,215,255,0.50)";
        ctx.fill();
      }
    }

    function drawVelocity() {
      const s = sc();
      const vs = s * 0.11;
      const bodies = all5();
      for (let i = 0; i < 5; i++) {
        const bod = bodies[i];
        const [bx, by] = toScreen(bod.x, bod.y);
        const [r, g, b] = BODY_RGB[i];
        const vx = bod.vx * vs, vy = bod.vy * vs;
        const spd = Math.sqrt(vx*vx + vy*vy);
        if (spd < 1) continue;
        const ex = bx + vx, ey = by + vy;
        ctx.beginPath();
        ctx.moveTo(bx, by); ctx.lineTo(ex, ey);
        ctx.strokeStyle = `rgba(${r},${g},${b},0.30)`;
        ctx.lineWidth   = 0.9;
        ctx.stroke();
        const angle = Math.atan2(vy, vx);
        ctx.beginPath();
        ctx.moveTo(ex, ey);
        ctx.lineTo(ex - 5*Math.cos(angle-0.40), ey - 5*Math.sin(angle-0.40));
        ctx.moveTo(ex, ey);
        ctx.lineTo(ex - 5*Math.cos(angle+0.40), ey - 5*Math.sin(angle+0.40));
        ctx.strokeStyle = `rgba(${r},${g},${b},0.22)`;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }
    }

    function drawBodies() {
      const bodies = all5();
      for (let i = 0; i < 5; i++) {
        const bod = bodies[i];
        const [bx, by] = toScreen(bod.x, bod.y);
        const [r, g, b] = BODY_RGB[i];

        // Speed-reactive pulse: figure-8 bodies reach ~2–3 during close passes
        const spd = Math.sqrt(bod.vx * bod.vx + bod.vy * bod.vy);
        const pulse = Math.min(spd / 2.8, 1); // 0=slow, 1=fast
        const glowR   = 30 + pulse * 18;       // 30–48 px
        const glowOp  = 0.28 + pulse * 0.18;   // 0.28–0.46

        // Ambient glow
        const glow = ctx.createRadialGradient(bx, by, 0, bx, by, glowR);
        glow.addColorStop(0,    `rgba(${r},${g},${b},${glowOp})`);
        glow.addColorStop(0.35, `rgba(${r},${g},${b},${glowOp * 0.4})`);
        glow.addColorStop(1,    `rgba(${r},${g},${b},0)`);
        ctx.beginPath();
        ctx.arc(bx, by, glowR, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();

        // Diffraction spikes — 4 thin radial lines (telescope-star effect)
        const spikeLen = 12 + pulse * 10;
        const spikeOp  = 0.14 + pulse * 0.10;
        for (let sp = 0; sp < 4; sp++) {
          const angle = sp * Math.PI / 2;
          ctx.beginPath();
          ctx.moveTo(bx + Math.cos(angle) * 5, by + Math.sin(angle) * 5);
          ctx.lineTo(bx + Math.cos(angle) * spikeLen, by + Math.sin(angle) * spikeLen);
          ctx.strokeStyle = `rgba(${r},${g},${b},${spikeOp})`;
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }

        // Ring
        ctx.beginPath();
        ctx.arc(bx, by, 7, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${r},${g},${b},0.65)`;
        ctx.lineWidth   = 1.4;
        ctx.stroke();

        // Core
        ctx.beginPath();
        ctx.arc(bx, by, 4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},0.95)`;
        ctx.fill();

        // White-hot centre
        ctx.beginPath();
        ctx.arc(bx, by, 1.8, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${0.75 + pulse * 0.20})`;
        ctx.fill();
      }
    }

    let potFrame = 0;
    function draw() {
      ctx.clearRect(0, 0, cssW, cssH);
      if (potFrame % 10 === 0) updatePot();
      potFrame++;
      drawHeatmap();
      drawCoM();
      drawProximityArcs();
      drawTrails();
      drawParticles();
      drawVelocity();
      drawBodies();
    }

    function loop() {
      if (!paused) {
        stepFig8();
        stepSats();
        stepParticles();
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
    updatePot();
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
