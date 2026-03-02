/**
 * LennardJonesBg — S2 Build background.
 * 50 particles in a 2D periodic box running real LJ molecular dynamics.
 * Particles are coloured by library (SpectraKit/Spektron/SpectraView/ReactorTwin).
 * Temperature cycles cold→hot→cold every 30s: crystalline clusters ↔ gas phase.
 * Bonds draw between particles within the attractive well (r < 1.5σ).
 */
import { useRef, useEffect } from "react";

// ── Constants ─────────────────────────────────────────────────────────────────

const N          = 50;
const L          = 9.2;       // box size (sim units)
const SIGMA      = 1.0;
const EPS        = 1.0;
const CUTOFF     = 2.5;
const CUTOFF_SQ  = CUTOFF * CUTOFF;
const BOND_DIST  = 1.55;      // draw bonds below this r
const DT         = 0.006;
const SUB_STEPS  = 3;
const THERMO_N   = 8;         // rescale every N sub-steps

const T_COLD     = 0.30;
const T_HOT      = 1.35;
const CYCLE_MS   = 32000;

// gold=SpectraKit, cyan=Spektron, purple=SpectraView, green=ReactorTwin
const GROUP_COLORS: [number, number, number][] = [
  [201, 160,  74],
  [ 78, 205, 196],
  [167, 139, 250],
  [ 52, 211, 153],
];
// How many particles per group (sums to N=50)
const GROUP_SIZES = [13, 13, 12, 12];

// ── LJ force between two particles ───────────────────────────────────────────

function ljForce(r2: number): number {
  // Returns scalar F/r so caller multiplies by (dx, dy) to get force vector.
  // F(r) = 24ε/r * [2(σ/r)^12 - (σ/r)^6]  →  F/r = 24ε/r² * [2(σ/r)^12 - (σ/r)^6]
  const ir2  = SIGMA * SIGMA / r2;
  const ir6  = ir2 * ir2 * ir2;
  const ir12 = ir6 * ir6;
  return 24 * EPS / r2 * (2 * ir12 - ir6);
}

// ── Temperature from velocities ───────────────────────────────────────────────

function currentTemp(vx: Float64Array, vy: Float64Array): number {
  let ke = 0;
  for (let i = 0; i < N; i++) ke += vx[i] * vx[i] + vy[i] * vy[i];
  return ke / (2 * N); // 2D equipartition: <KE> = N * k_B * T, m=1
}

function rescale(vx: Float64Array, vy: Float64Array, T_target: number) {
  const T_cur = currentTemp(vx, vy);
  if (T_cur < 1e-8) return;
  const scale = Math.sqrt(T_target / T_cur);
  for (let i = 0; i < N; i++) { vx[i] *= scale; vy[i] *= scale; }
}

// ── Target temperature from elapsed time ──────────────────────────────────────

function targetTemp(t_ms: number): number {
  const frac = (t_ms % CYCLE_MS) / CYCLE_MS; // 0→1 over 32s
  // Piecewise: 0-0.35 cold | 0.35-0.50 ramp up | 0.50-0.85 hot | 0.85-1.0 ramp down
  if (frac < 0.35) return T_COLD;
  if (frac < 0.50) {
    const p = (frac - 0.35) / 0.15;
    return T_COLD + (T_HOT - T_COLD) * p * p * (3 - 2 * p);
  }
  if (frac < 0.85) return T_HOT;
  const p = (frac - 0.85) / 0.15;
  return T_HOT - (T_HOT - T_COLD) * p * p * (3 - 2 * p);
}

// ── Seeded pseudo-rng (for deterministic init) ────────────────────────────────

function seededRng(seed: number) {
  let s = seed | 0;
  return () => {
    s = Math.imul(1664525, s) + 1013904223 | 0;
    return (s >>> 0) / 0xffffffff;
  };
}

// ── Main component ────────────────────────────────────────────────────────────

export default function LennardJonesBg() {
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

    // ── State arrays ──────────────────────────────────────────────────────────
    const px = new Float64Array(N);
    const py = new Float64Array(N);
    const vx = new Float64Array(N);
    const vy = new Float64Array(N);
    const ax = new Float64Array(N);
    const ay = new Float64Array(N);
    // Colour index per particle
    const color = new Uint8Array(N);

    // ── Initialise particles on hexagonal lattice ─────────────────────────────
    const rng = seededRng(0xdeadbeef);
    const NX = 8, NY = Math.ceil(N / NX);
    const dx = L / NX, dy = L / NY;
    let ci = 0;
    for (let j = 0; j < NY && ci < N; j++) {
      for (let i = 0; i < NX && ci < N; i++) {
        px[ci] = (i + (j % 2) * 0.5 + rng() * 0.18 - 0.09) * dx;
        py[ci] = (j + rng() * 0.18 - 0.09) * dy;
        // Clamp into [0, L)
        px[ci] = ((px[ci] % L) + L) % L;
        py[ci] = ((py[ci] % L) + L) % L;
        ci++;
      }
    }

    // Assign colour groups
    let gi = 0, remaining = GROUP_SIZES[0];
    for (let i = 0; i < N; i++) {
      while (remaining === 0 && gi < GROUP_COLORS.length - 1) {
        gi++;
        remaining = GROUP_SIZES[gi];
      }
      color[i] = gi;
      remaining--;
    }

    // Random initial velocities scaled to T_COLD
    for (let i = 0; i < N; i++) {
      vx[i] = (rng() - 0.5) * 1.2;
      vy[i] = (rng() - 0.5) * 1.2;
    }
    // Remove centre-of-mass drift
    let vxcm = 0, vycm = 0;
    for (let i = 0; i < N; i++) { vxcm += vx[i]; vycm += vy[i]; }
    vxcm /= N; vycm /= N;
    for (let i = 0; i < N; i++) { vx[i] -= vxcm; vy[i] -= vycm; }
    rescale(vx, vy, T_COLD);

    // ── Compute forces ────────────────────────────────────────────────────────
    function computeForces() {
      ax.fill(0); ay.fill(0);
      for (let i = 0; i < N - 1; i++) {
        for (let j = i + 1; j < N; j++) {
          let ddx = px[j] - px[i];
          let ddy = py[j] - py[i];
          // Minimum image convention
          ddx -= L * Math.round(ddx / L);
          ddy -= L * Math.round(ddy / L);
          const r2 = ddx * ddx + ddy * ddy;
          if (r2 < CUTOFF_SQ && r2 > 0.1) {
            const f = ljForce(r2);
            ax[i] += f * ddx; ay[i] += f * ddy;
            ax[j] -= f * ddx; ay[j] -= f * ddy;
          }
        }
      }
    }

    // ── Velocity Verlet step ──────────────────────────────────────────────────
    let thermoCount = 0;

    function step(T_target: number) {
      for (let s = 0; s < SUB_STEPS; s++) {
        // Half-kick + drift
        for (let i = 0; i < N; i++) {
          vx[i] += 0.5 * ax[i] * DT;
          vy[i] += 0.5 * ay[i] * DT;
          px[i] += vx[i] * DT;
          py[i] += vy[i] * DT;
          // Periodic boundary
          px[i] = ((px[i] % L) + L) % L;
          py[i] = ((py[i] % L) + L) % L;
        }
        computeForces();
        // Half-kick
        for (let i = 0; i < N; i++) {
          vx[i] += 0.5 * ax[i] * DT;
          vy[i] += 0.5 * ay[i] * DT;
        }
        // Thermostat
        thermoCount++;
        if (thermoCount % THERMO_N === 0) {
          rescale(vx, vy, T_target);
        }
      }
    }

    // ── Resize ────────────────────────────────────────────────────────────────
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

    // ── Sim→screen mapping ────────────────────────────────────────────────────
    function sx(x: number) { return (x / L) * cssW; }
    function sy(y: number) { return (y / L) * cssH; }

    // ── Draw ──────────────────────────────────────────────────────────────────
    function draw() {
      ctx!.clearRect(0, 0, cssW, cssH);

      // Bonds — draw first (below particles)
      for (let i = 0; i < N - 1; i++) {
        for (let j = i + 1; j < N; j++) {
          let ddx = px[j] - px[i];
          let ddy = py[j] - py[i];
          ddx -= L * Math.round(ddx / L);
          ddy -= L * Math.round(ddy / L);
          const r = Math.sqrt(ddx * ddx + ddy * ddy);
          if (r < BOND_DIST) {
            const alpha = ((BOND_DIST - r) / (BOND_DIST - SIGMA)) * 0.30;
            const x1 = sx(px[i]), y1 = sy(py[i]);
            const x2 = sx(px[i] + ddx), y2 = sy(py[i] + ddy);
            const [r1, g1, b1] = GROUP_COLORS[color[i]];
            const [r2, g2, b2] = GROUP_COLORS[color[j]];
            const grad = ctx!.createLinearGradient(x1, y1, x2, y2);
            grad.addColorStop(0, `rgba(${r1},${g1},${b1},${alpha})`);
            grad.addColorStop(1, `rgba(${r2},${g2},${b2},${alpha})`);
            ctx!.beginPath();
            ctx!.moveTo(x1, y1); ctx!.lineTo(x2, y2);
            ctx!.strokeStyle = grad;
            ctx!.lineWidth = 0.9;
            ctx!.stroke();
          }
        }
      }

      // Particles
      for (let i = 0; i < N; i++) {
        const bx2 = sx(px[i]);
        const by2 = sy(py[i]);
        const [r2, g2, b2] = GROUP_COLORS[color[i]];
        const speed = Math.sqrt(vx[i] * vx[i] + vy[i] * vy[i]);
        const pulse = Math.min(speed / 2.5, 1);

        // Glow
        const gR = 14 + pulse * 8;
        const glow = ctx!.createRadialGradient(bx2, by2, 0, bx2, by2, gR);
        glow.addColorStop(0,   `rgba(${r2},${g2},${b2},${0.12 + pulse * 0.10})`);
        glow.addColorStop(0.4, `rgba(${r2},${g2},${b2},${0.04 + pulse * 0.04})`);
        glow.addColorStop(1,   `rgba(${r2},${g2},${b2},0)`);
        ctx!.beginPath();
        ctx!.arc(bx2, by2, gR, 0, Math.PI * 2);
        ctx!.fillStyle = glow;
        ctx!.fill();

        // Ring
        ctx!.beginPath();
        ctx!.arc(bx2, by2, 3.5, 0, Math.PI * 2);
        ctx!.strokeStyle = `rgba(${r2},${g2},${b2},0.65)`;
        ctx!.lineWidth = 1.2;
        ctx!.stroke();

        // Core
        ctx!.beginPath();
        ctx!.arc(bx2, by2, 2.0, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(${r2},${g2},${b2},0.90)`;
        ctx!.fill();

        // White hot centre
        ctx!.beginPath();
        ctx!.arc(bx2, by2, 0.9, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(255,255,255,${0.70 + pulse * 0.25})`;
        ctx!.fill();
      }
    }

    // ── Main loop ─────────────────────────────────────────────────────────────
    computeForces(); // initial forces

    function loop(ts: number) {
      if (!paused && cssW > 0) {
        const T_target = targetTemp(ts);
        step(T_target);
        draw();
      }
      raf = requestAnimationFrame(loop);
    }

    const visObs = new IntersectionObserver(([e]) => { paused = !e.isIntersecting; });
    visObs.observe(wrap);
    const resObs = new ResizeObserver(resize);
    resObs.observe(wrap);

    const TARGET_OPACITY = 0.85;
    let lastScrollY = window.scrollY;
    function onScroll() {
      const rect  = wrap!.getBoundingClientRect();
      const viewH = window.innerHeight;
      const progress = Math.max(0, Math.min(1, (viewH * 0.92 - rect.top) / (viewH * 1.5)));
      const eased = progress * progress * (3 - 2 * progress);
      wrap!.style.opacity = String(eased * TARGET_OPACITY);
      lastScrollY = window.scrollY;
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
