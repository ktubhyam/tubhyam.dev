/**
 * NeuralLandscape — 3D wireframe loss landscape with animated gradient descent.
 * Rendered entirely on a canvas via orthographic 3D projection.
 * Auto-rotates. Ball follows gradient descent with momentum, resets on convergence.
 */
import { useEffect, useRef } from "react";

const GRID  = 22;       // grid resolution (GRID × GRID points)
const RANGE = 3.2;      // x/y from -RANGE to +RANGE
const AMBER = [201, 160, 74] as const;
const TEAL  = [78, 205, 196]  as const;

// Loss surface: bowl + local bumps
function loss(x: number, y: number): number {
  const bowl   = (x * x + y * y) * 0.28;
  const bumps  = Math.sin(x * 2.2) * Math.cos(y * 1.8) * 0.18
               + Math.sin(x * 0.9 + 1.2) * Math.sin(y * 1.5) * 0.12;
  return bowl + bumps;
}

function gradLoss(x: number, y: number): [number, number] {
  const eps = 0.01;
  return [
    (loss(x + eps, y) - loss(x - eps, y)) / (2 * eps),
    (loss(x, y + eps) - loss(x, y - eps)) / (2 * eps),
  ];
}

// Min loss for colour normalisation
const L_MIN = 0;
const L_MAX = loss(RANGE, RANGE);

function lerpColor(a: readonly [number,number,number], b: readonly [number,number,number], t: number) {
  return `rgba(${Math.round(a[0]+(b[0]-a[0])*t)},${Math.round(a[1]+(b[1]-a[1])*t)},${Math.round(a[2]+(b[2]-a[2])*t)},`;
}

export default function NeuralLandscape({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const setup = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width  = canvas.offsetWidth  * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    setup();
    window.addEventListener("resize", setup);

    // Gradient descent ball state
    let bx  =  2.8, by  =  2.5;
    let vx  =  0,   vy  =  0;
    const LR    = 0.025;
    const MOM   = 0.82;
    let   iterN = 0;

    const resetBall = () => {
      const angle = Math.random() * Math.PI * 2;
      const r     = 2.2 + Math.random() * 0.8;
      bx = Math.cos(angle) * r;
      by = Math.sin(angle) * r;
      vx = 0; vy = 0; iterN = 0;
    };

    // Trail: last N ball positions
    const TRAIL_LEN = 28;
    const trail: [number, number][] = [];

    let rotY = 0.35;

    const project = (x: number, y: number, z: number, W: number, H: number) => {
      // Rotate around Y axis
      const x1  = x * Math.cos(rotY) + z * Math.sin(rotY);
      const z1  = -x * Math.sin(rotY) + z * Math.cos(rotY);
      // Fixed tilt (X rotation ~35°)
      const tilt = 0.60;
      const y1   = y * Math.cos(tilt) - z1 * Math.sin(tilt);
      const cellW = W / (GRID + 3);
      const sx   = W * 0.5 + x1 * cellW;
      const sy   = H * 0.5 + y1 * cellW * 0.9;
      return { sx, sy, depth: z1 };
    };

    const draw = (t: number) => {
      if (!canvas) return;
      const W = canvas.offsetWidth;
      const H = canvas.offsetHeight;
      ctx.clearRect(0, 0, W, H);

      if (!reduced) rotY = 0.25 + Math.sin(t * 0.00018) * 0.30;

      // Pre-compute grid
      const step = (2 * RANGE) / (GRID - 1);
      const pts: { sx: number; sy: number; z: number; depth: number }[][] = [];
      for (let row = 0; row < GRID; row++) {
        pts[row] = [];
        for (let col = 0; col < GRID; col++) {
          const gx = -RANGE + col * step;
          const gy = -RANGE + row * step;
          const gz = -loss(gx, gy);           // negate: low loss = visually high
          const { sx, sy, depth } = project(gx, gy, gz, W, H);
          pts[row][col] = { sx, sy, z: loss(gx, gy), depth };
        }
      }

      // Draw grid lines, back-to-front (depth sort by row/col)
      ctx.lineWidth = 0.5;
      for (let row = 0; row < GRID - 1; row++) {
        for (let col = 0; col < GRID - 1; col++) {
          const p  = pts[row][col];
          const pr = pts[row][col + 1];
          const pd = pts[row + 1][col];
          const lNorm = Math.min((p.z - L_MIN) / L_MAX, 1);
          const alpha = 0.12 + lNorm * 0.08;
          // High loss = amber-ish, low loss = teal-ish
          const col_ = lerpColor(TEAL, AMBER, lNorm);
          ctx.strokeStyle = col_ + alpha + ")";
          ctx.beginPath();
          ctx.moveTo(p.sx, p.sy);
          ctx.lineTo(pr.sx, pr.sy);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(p.sx, p.sy);
          ctx.lineTo(pd.sx, pd.sy);
          ctx.stroke();
        }
      }

      if (!reduced) {
        // Step gradient descent
        const [gx_, gy_] = gradLoss(bx, by);
        vx = MOM * vx - LR * gx_;
        vy = MOM * vy - LR * gy_;
        bx = Math.max(-RANGE + 0.1, Math.min(RANGE - 0.1, bx + vx));
        by = Math.max(-RANGE + 0.1, Math.min(RANGE - 0.1, by + vy));
        iterN++;

        trail.push([bx, by]);
        if (trail.length > TRAIL_LEN) trail.shift();

        // Reset when converged or stuck at boundary
        if (iterN > 320 || (Math.abs(bx) < 0.15 && Math.abs(by) < 0.15 && iterN > 60)) {
          resetBall();
          trail.length = 0;
        }

        // Draw trail
        for (let i = 1; i < trail.length; i++) {
          const [tx, ty] = trail[i];
          const [px_, py_] = trail[i - 1];
          const tz_ = -loss(tx, ty);
          const pz_ = -loss(px_, py_);
          const { sx: tsx, sy: tsy } = project(tx, ty, tz_, W, H);
          const { sx: psx, sy: psy } = project(px_, py_, pz_, W, H);
          const alpha = (i / trail.length) * 0.55;
          ctx.strokeStyle = TEAL[0] + "," + TEAL[1] + "," + TEAL[2];
          ctx.strokeStyle = `rgba(${TEAL[0]},${TEAL[1]},${TEAL[2]},${alpha})`;
          ctx.lineWidth = 1.2 * (i / trail.length);
          ctx.beginPath();
          ctx.moveTo(psx, psy);
          ctx.lineTo(tsx, tsy);
          ctx.stroke();
        }

        // Ball
        const bz_ = -loss(bx, by);
        const { sx: bsx, sy: bsy } = project(bx, by, bz_, W, H);
        const glow = ctx.createRadialGradient(bsx, bsy, 0, bsx, bsy, 8);
        glow.addColorStop(0, `rgba(${TEAL[0]},${TEAL[1]},${TEAL[2]},0.9)`);
        glow.addColorStop(1, `rgba(${TEAL[0]},${TEAL[1]},${TEAL[2]},0)`);
        ctx.beginPath(); ctx.arc(bsx, bsy, 8, 0, Math.PI * 2);
        ctx.fillStyle = glow; ctx.fill();
        ctx.beginPath(); ctx.arc(bsx, bsy, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${TEAL[0]},${TEAL[1]},${TEAL[2]},1)`; ctx.fill();
      }
    };

    if (reduced) {
      draw(0);
    } else {
      const loop = (t: number) => { draw(t); rafRef.current = requestAnimationFrame(loop); };
      rafRef.current = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", setup);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full block ${className}`}
      aria-hidden="true"
    />
  );
}
