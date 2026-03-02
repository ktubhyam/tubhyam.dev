/**
 * ReactionDiffusionBg — S5 Connect background.
 * Gray-Scott reaction-diffusion system: two chemicals reacting and diffusing
 * across a 2D grid. Generates organic branching coral patterns autonomously.
 * f=0.037, k=0.060 → dendritic growth. Amber wherever chemical V is high.
 * The chemistry is alive — patterns grow, consume, regenerate.
 */
import { useRef, useEffect } from "react";

// Simulation parameters
const DU = 0.2097;
const DV = 0.105;
const F  = 0.037;
const K  = 0.060;
const SIM_DT = 1.0;
const STEPS_PER_FRAME = 2;

// Seed count for initial nucleation
const N_SEEDS = 18;
const SEED_R  = 4; // radius of each seed in pixels

function makeGrid(size: number): Float32Array {
  return new Float32Array(size * size);
}

export default function ReactionDiffusionBg() {
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

    // Choose grid size based on device
    const GRID = window.innerWidth < 768 ? 128 : 256;

    // Ping-pong buffers
    const U: [Float32Array, Float32Array] = [makeGrid(GRID), makeGrid(GRID)];
    const V: [Float32Array, Float32Array] = [makeGrid(GRID), makeGrid(GRID)];
    let buf = 0;

    // Offscreen canvas for pixel rendering
    const off    = document.createElement("canvas");
    off.width    = GRID;
    off.height   = GRID;
    const offCtx = off.getContext("2d")!;
    const img    = offCtx.createImageData(GRID, GRID);
    const d      = img.data;

    // Seeded rng for reproducible init
    let seed = 0xc0ffee42;
    function rng() {
      seed = Math.imul(1664525, seed) + 1013904223 | 0;
      return (seed >>> 0) / 0xffffffff;
    }

    function initGrid() {
      U[0].fill(1.0);
      V[0].fill(0.0);
      for (let s = 0; s < N_SEEDS; s++) {
        const cx = Math.floor(rng() * (GRID - SEED_R * 2) + SEED_R);
        const cy = Math.floor(rng() * (GRID - SEED_R * 2) + SEED_R);
        for (let dy = -SEED_R; dy <= SEED_R; dy++) {
          for (let dx = -SEED_R; dx <= SEED_R; dx++) {
            if (dx * dx + dy * dy > SEED_R * SEED_R) continue;
            const i = ((cy + dy + GRID) % GRID) * GRID + ((cx + dx + GRID) % GRID);
            U[0][i] = 0.50 + (rng() - 0.5) * 0.04;
            V[0][i] = 0.25 + (rng() - 0.5) * 0.04;
          }
        }
      }
    }

    function step() {
      const su = U[buf], sv = V[buf];
      const du = U[1 - buf], dv = V[1 - buf];

      for (let y = 0; y < GRID; y++) {
        const yp = y === GRID - 1 ? 0 : y + 1;
        const ym = y === 0 ? GRID - 1 : y - 1;
        for (let x = 0; x < GRID; x++) {
          const xp = x === GRID - 1 ? 0 : x + 1;
          const xm = x === 0 ? GRID - 1 : x - 1;
          const i  = y * GRID + x;
          const u  = su[i], v = sv[i];

          const lapU = su[y * GRID + xp] + su[y * GRID + xm] + su[yp * GRID + x] + su[ym * GRID + x] - 4 * u;
          const lapV = sv[y * GRID + xp] + sv[y * GRID + xm] + sv[yp * GRID + x] + sv[ym * GRID + x] - 4 * v;

          const uvv = u * v * v;
          du[i] = Math.max(0, Math.min(1, u + SIM_DT * (DU * lapU - uvv + F * (1 - u))));
          dv[i] = Math.max(0, Math.min(1, v + SIM_DT * (DV * lapV + uvv - (F + K) * v)));
        }
      }
      buf = 1 - buf;
    }

    function renderPixels() {
      const sv = V[buf];
      for (let i = 0; i < GRID * GRID; i++) {
        const v  = sv[i];
        const t  = Math.min(1, Math.max(0, v * 2.8));
        const a  = Math.round(Math.pow(t, 1.25) * 210);
        const ii = i * 4;
        d[ii]     = 201;  // amber R
        d[ii + 1] = 160;  // amber G
        d[ii + 2] = 74;   // amber B
        d[ii + 3] = a;
      }
      offCtx.putImageData(img, 0, 0);
    }

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

    let renderFrame = 0;

    function loop() {
      if (!paused && cssW > 0) {
        for (let s = 0; s < STEPS_PER_FRAME; s++) step();

        // Re-render pixels every 2 animation frames
        if (renderFrame % 2 === 0) renderPixels();
        renderFrame++;

        ctx!.clearRect(0, 0, cssW, cssH);
        ctx!.save();
        ctx!.imageSmoothingEnabled = true;
        ctx!.imageSmoothingQuality = "high";
        ctx!.drawImage(off, 0, 0, cssW, cssH);
        ctx!.restore();
      }
      raf = requestAnimationFrame(loop);
    }

    initGrid();

    const visObs = new IntersectionObserver(([e]) => { paused = !e.isIntersecting; });
    visObs.observe(wrap);
    const resObs = new ResizeObserver(resize);
    resObs.observe(wrap);

    const TARGET_OPACITY = 0.28;
    function onScroll() {
      const rect  = wrap!.getBoundingClientRect();
      const viewH = window.innerHeight;
      const progress = Math.max(0, Math.min(1, (viewH * 0.92 - rect.top) / (viewH * 1.5)));
      const eased = progress * progress * (3 - 2 * progress);
      wrap!.style.opacity = String(eased * TARGET_OPACITY);
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
