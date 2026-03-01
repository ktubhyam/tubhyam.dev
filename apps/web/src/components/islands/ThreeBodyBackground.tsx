/**
 * ThreeBodyBackground — Three-body gravitational simulation canvas.
 *
 * Physics:
 *   - 3 main bodies in the Chenciner-Montgomery figure-8 choreography
 *   - 24 massless test particles responding to the gravitational field
 *   - Gravitational potential rings (Roche-lobe approximation) per body
 *
 * Visuals match AtomOrbit3D: rgba depth-based opacity, same color palette,
 * radial glow, depth-scaled line widths.
 *
 * Sizing reads from a wrapper div — survives the astro-island wrapper.
 * Integration: Velocity Verlet, DT=0.0006, 4 sub-steps per rAF.
 */
import { useRef, useEffect } from "react";

// ─── Physics constants ────────────────────────────────────────────────────────

const G             = 1.0;
const M             = 1.0;
const SOFTENING_SQ  = 0.008;
const DT            = 0.0006;
const STEPS         = 4;        // Verlet sub-steps per rAF tick

const TRAIL_LEN     = 340;      // main body trail points
const PTRAIL_LEN    = 22;       // test particle trail points
const SEG           = 6;        // points per opacity band (trails)
const N_PARTICLES   = 24;       // test particles

// Chenciner & Montgomery (2000) figure-8 initial conditions
const IC = [
  { x:  0.97000436, y: -0.24308753, vx:  0.46620369, vy:  0.43236573 },
  { x: -0.97000436, y:  0.24308753, vx:  0.46620369, vy:  0.43236573 },
  { x:  0.0,        y:  0.0,        vx: -0.93240737, vy: -0.86473146 },
];

// Match AtomOrbit3D palette exactly
const BODY_RGB: [number, number, number][] = [
  [201, 160,  74],  // amber  #C9A04A
  [ 78, 205, 196],  // teal   #4ECDC4
  [167, 139, 250],  // violet #A78BFA
];

// ─── Seeded RNG (deterministic initial conditions) ────────────────────────────

function makeRng(seed: number) {
  let s = seed | 0;
  return () => {
    s = Math.imul(1664525, s) + 1013904223 | 0;
    return ((s >>> 0) / 0xffffffff);
  };
}

// ─── Gravity ──────────────────────────────────────────────────────────────────

function gravAccel(
  sources: { x: number; y: number }[],
  px: number, py: number,
): [number, number] {
  let ax = 0, ay = 0;
  for (const s of sources) {
    const dx = s.x - px, dy = s.y - py;
    const r2 = dx * dx + dy * dy + SOFTENING_SQ;
    const r3 = r2 * Math.sqrt(r2);
    ax += G * M * dx / r3;
    ay += G * M * dy / r3;
  }
  return [ax, ay];
}

// ─── Component ───────────────────────────────────────────────────────────────

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

    // ── Main bodies ──
    const bodies = IC.map(b => ({ ...b }));
    const trails: { x: number; y: number }[][] = [[], [], []];

    // ── Test particles (seeded so they're the same every mount) ──
    const rng = makeRng(0xdeadbeef);
    const particles = Array.from({ length: N_PARTICLES }, () => {
      const angle = rng() * Math.PI * 2;
      const r     = 0.5 + rng() * 1.5;
      return {
        x: Math.cos(angle) * r,
        y: Math.sin(angle) * r,
        vx: (rng() - 0.5) * 0.35,
        vy: (rng() - 0.5) * 0.35,
        trail: [] as { x: number; y: number }[],
      };
    });

    // ── Canvas sizing ──
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

    // Figure-8 spans ≈ ±1.25 x, ±0.55 y
    function toScreen(x: number, y: number): [number, number] {
      const scale = Math.min(cssW * 0.26, cssH * 0.48);
      return [cssW / 2 + x * scale, cssH / 2 + y * scale];
    }

    // ── Verlet step for main bodies ──
    function stepBodies() {
      for (let s = 0; s < STEPS; s++) {
        const a0 = bodies.map((_, i) => {
          const others = bodies.filter((_, j) => j !== i);
          return gravAccel(others, bodies[i].x, bodies[i].y);
        });
        for (let i = 0; i < 3; i++) {
          bodies[i].x  += bodies[i].vx * DT + 0.5 * a0[i][0] * DT * DT;
          bodies[i].y  += bodies[i].vy * DT + 0.5 * a0[i][1] * DT * DT;
        }
        const a1 = bodies.map((_, i) => {
          const others = bodies.filter((_, j) => j !== i);
          return gravAccel(others, bodies[i].x, bodies[i].y);
        });
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

    // ── Euler step for test particles (cheaper, slight inaccuracy is fine) ──
    function stepParticles() {
      const totalDT = DT * STEPS;
      for (const p of particles) {
        const [ax, ay] = gravAccel(bodies, p.x, p.y);
        p.vx += ax * totalDT;
        p.vy += ay * totalDT;
        p.x  += p.vx * totalDT;
        p.y  += p.vy * totalDT;

        // Reset escaped particles to a new random position near the action
        if (Math.abs(p.x) > 3.5 || Math.abs(p.y) > 3.5 ||
            p.vx * p.vx + p.vy * p.vy > 25) {
          const angle = rng() * Math.PI * 2;
          const r     = 0.4 + rng() * 1.2;
          p.x  = Math.cos(angle) * r;
          p.y  = Math.sin(angle) * r;
          p.vx = (rng() - 0.5) * 0.3;
          p.vy = (rng() - 0.5) * 0.3;
          p.trail = [];
        }

        p.trail.push({ x: p.x, y: p.y });
        if (p.trail.length > PTRAIL_LEN) p.trail.shift();
      }
    }

    // ── Draw ─────────────────────────────────────────────────────────────────

    function drawBodyTrails() {
      for (let i = 0; i < 3; i++) {
        const trail = trails[i];
        const [r, g, b] = BODY_RGB[i];
        // Opacity bands: matches orbit ring style 0.05 + depth * 0.38
        for (let t = 0; t < trail.length - 1; t += SEG) {
          const depth   = (t + SEG) / trail.length;
          const opacity = 0.05 + depth * 0.38;
          const lw      = 0.4  + depth * 1.4;
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

    function drawBodies() {
      for (let i = 0; i < 3; i++) {
        const [bx, by] = toScreen(bodies[i].x, bodies[i].y);
        const [r, g, b] = BODY_RGB[i];

        // Outer glow — matches orbit center glow
        const glow = ctx.createRadialGradient(bx, by, 0, bx, by, 20);
        glow.addColorStop(0,   `rgba(${r},${g},${b},0.20)`);
        glow.addColorStop(0.4, `rgba(${r},${g},${b},0.07)`);
        glow.addColorStop(1,   `rgba(${r},${g},${b},0)`);
        ctx.beginPath();
        ctx.arc(bx, by, 20, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();

        // Ring — matches orbit electron stroke
        ctx.beginPath();
        ctx.arc(bx, by, 4.5, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${r},${g},${b},0.55)`;
        ctx.lineWidth   = 1.2;
        ctx.stroke();

        // Core — matches orbit electron fill
        ctx.beginPath();
        ctx.arc(bx, by, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},0.90)`;
        ctx.fill();
      }
    }

    // Gravitational potential rings (Roche-lobe approximation)
    // Dashed concentric circles — visual influence zones per body
    function drawPotentialRings() {
      const radii = [28, 52, 82];
      for (let i = 0; i < 3; i++) {
        const [bx, by] = toScreen(bodies[i].x, bodies[i].y);
        const [r, g, b] = BODY_RGB[i];
        ctx.setLineDash([3, 9]);
        for (let ri = 0; ri < radii.length; ri++) {
          const opacity = 0.035 - ri * 0.008;
          ctx.beginPath();
          ctx.arc(bx, by, radii[ri], 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(${r},${g},${b},${opacity})`;
          ctx.lineWidth   = 0.6;
          ctx.stroke();
        }
        ctx.setLineDash([]);
      }
    }

    // Test particles + comet trails
    function drawParticles() {
      for (const p of particles) {
        const trail = p.trail;
        if (trail.length < 2) continue;

        // Comet tail — faint white trail
        ctx.beginPath();
        ctx.strokeStyle = "rgba(220,220,255,0.12)";
        ctx.lineWidth   = 0.6;
        const [tx0, ty0] = toScreen(trail[0].x, trail[0].y);
        ctx.moveTo(tx0, ty0);
        for (let k = 1; k < trail.length; k++) {
          const alpha = k / trail.length * 0.18;
          ctx.strokeStyle = `rgba(220,220,255,${alpha})`;
          const [tx, ty] = toScreen(trail[k].x, trail[k].y);
          ctx.lineTo(tx, ty);
        }
        ctx.stroke();

        // Particle dot
        const [px, py] = toScreen(p.x, p.y);
        ctx.beginPath();
        ctx.arc(px, py, 1.0, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(200,200,220,0.45)";
        ctx.fill();
      }
    }

    function draw() {
      ctx.clearRect(0, 0, cssW, cssH);
      drawPotentialRings();
      drawBodyTrails();
      drawParticles();
      drawBodies();
    }

    function loop() {
      if (!paused) {
        stepBodies();
        stepParticles();
        draw();
      }
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
      style={{ opacity: 0.65 }}
    >
      <canvas ref={canvasRef} className="absolute inset-0" />
    </div>
  );
}
