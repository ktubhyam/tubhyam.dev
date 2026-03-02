/**
 * NeuralNetBg — S2 Build background.
 * Feedforward neural network: 6 layers, ~96 directed edges.
 * Activation waves sweep left→right every 4.5s — nodes flash as the
 * wave front passes, pulses travel along connections between layers.
 * Network structure is always faintly visible between waves.
 * Amber (input) → teal (output) colour gradient across layers.
 */
import { useRef, useEffect } from "react";

const LAYERS       = [4, 6, 8, 8, 6, 3];
const WAVE_PERIOD  = 5.5;   // seconds between wave starts
const LAYER_DELAY  = 0.55;  // seconds per layer in propagation (slower = more elegant)
const DECAY        = 2.2;   // activation e-fold decay rate
const JITTER       = 0.05;  // max per-node random delay within its layer
const CONNS        = 3;     // out-connections per node (capped at dest layer size)

const AMBER: [number, number, number] = [201, 160,  74];
const TEAL:  [number, number, number] = [ 78, 205, 196];

function lerp3(a: [number,number,number], b: [number,number,number], t: number): [number,number,number] {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

function makeRng(seed: number) {
  let s = seed | 0;
  return () => { s = Math.imul(1664525, s) + 1013904223 | 0; return (s >>> 0) / 0xffffffff; };
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export default function NeuralNetBg() {
  const wrapRef   = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrap   = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0, paused = false, cssW = 0, cssH = 0;

    // ── Network structure ────────────────────────────────────────────────────
    type Node = { xf: number; yf: number; layer: number };
    type Edge = { a: number; b: number };

    const totalNodes = LAYERS.reduce((s, v) => s + v, 0);
    const nodes: Node[]        = [];
    const edges: Edge[]        = [];
    const nodeJitter           = new Float32Array(totalNodes);
    const fireTime             = new Float32Array(totalNodes);
    let   waveStart            = -WAVE_PERIOD * 2;
    let   waveDir              = 1;  // 1 = left→right, -1 = right→left, alternates

    // Build node positions and edges once
    (() => {
      const rng = makeRng(0xfeed1234);
      let idx = 0;
      for (let li = 0; li < LAYERS.length; li++) {
        const count = LAYERS[li];
        const xf = 0.07 + (li / (LAYERS.length - 1)) * 0.86;
        for (let ni = 0; ni < count; ni++) {
          const yf = count === 1 ? 0.5 : 0.13 + (ni / (count - 1)) * 0.74;
          nodes.push({ xf, yf, layer: li });
          nodeJitter[idx++] = rng() * JITTER;
        }
      }

      let base = 0;
      for (let li = 0; li < LAYERS.length - 1; li++) {
        const fromCount = LAYERS[li];
        const toCount   = LAYERS[li + 1];
        const toBase    = base + fromCount;
        for (let fi = 0; fi < fromCount; fi++) {
          const n = Math.min(CONNS, toCount);
          const targets = shuffle(Array.from({ length: toCount }, (_, i) => i), makeRng(li * 997 + fi * 101));
          for (let k = 0; k < n; k++) {
            edges.push({ a: base + fi, b: toBase + targets[k] });
          }
        }
        base += fromCount;
      }
    })();

    function startWave(t: number) {
      waveStart = t;
      waveDir   = waveDir === 1 ? -1 : 1;  // alternate direction each wave
      let base = 0;
      for (let li = 0; li < LAYERS.length; li++) {
        // Forward: layer 0 fires first. Backward: last layer fires first.
        const layerOrder = waveDir === 1 ? li : (LAYERS.length - 1 - li);
        for (let ni = 0; ni < LAYERS[li]; ni++) {
          fireTime[base + ni] = waveStart + layerOrder * LAYER_DELAY + nodeJitter[base + ni];
        }
        base += LAYERS[li];
      }
    }

    function act(t: number, ni: number): number {
      const dt = t - fireTime[ni];
      return dt < 0 ? 0 : Math.exp(-DECAY * dt);
    }

    // ── Resize ───────────────────────────────────────────────────────────────
    function resize() {
      const r = wrap!.getBoundingClientRect();
      const w = r.width  || window.innerWidth;
      const h = r.height || window.innerHeight;
      if (!w || !h) { requestAnimationFrame(resize); return; }
      cssW = w; cssH = h;
      const dpr = window.devicePixelRatio || 1;
      canvas!.width  = cssW * dpr;
      canvas!.height = cssH * dpr;
      canvas!.style.width  = cssW + "px";
      canvas!.style.height = cssH + "px";
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    // ── Main loop ────────────────────────────────────────────────────────────
    function loop(ts: number) {
      if (!paused && cssW > 0) {
        const t = ts * 0.001;
        if (t - waveStart > WAVE_PERIOD) startWave(t);

        ctx!.clearRect(0, 0, cssW, cssH);

        // ── Edges ─────────────────────────────────────────────────────────
        for (const e of edges) {
          const na = nodes[e.a], nb = nodes[e.b];
          const ax = na.xf * cssW, ay = na.yf * cssH;
          const bx = nb.xf * cssW, by = nb.yf * cssH;

          const actA = act(t, e.a);
          const actB = act(t, e.b);
          const glow = Math.max(actA * 0.55, actB * 0.75);

          // Base line — always faintly visible so network shape shows at rest
          ctx!.beginPath();
          ctx!.moveTo(ax, ay);
          ctx!.lineTo(bx, by);
          ctx!.strokeStyle = `rgba(180,200,220,${(0.055 + glow * 0.20).toFixed(3)})`;
          ctx!.lineWidth = 0.45 + glow * 0.65;
          ctx!.stroke();

          // Pulse: travels from source fire-time to dest fire-time
          const pStart = fireTime[e.a];
          const pEnd   = fireTime[e.b];
          if (t > pStart && t < pEnd + 0.2) {
            const span = Math.max(pEnd - pStart, 0.01);
            const frac = Math.max(0, Math.min(1, (t - pStart) / span));
            const fade = Math.min(frac * 10, (1 - frac) * 10, 1.0);
            if (fade > 0.01) {
              const px = ax + (bx - ax) * frac;
              const py = ay + (by - ay) * frac;
              const [Rp, Gp, Bp] = lerp3(
                lerp3(AMBER, TEAL, na.layer / (LAYERS.length - 1)),
                lerp3(AMBER, TEAL, nb.layer / (LAYERS.length - 1)),
                frac
              );
              const g = ctx!.createRadialGradient(px, py, 0, px, py, 8);
              g.addColorStop(0, `rgba(${Rp},${Gp},${Bp},${(fade * 0.60).toFixed(2)})`);
              g.addColorStop(1, `rgba(${Rp},${Gp},${Bp},0)`);
              ctx!.beginPath();
              ctx!.arc(px, py, 8, 0, Math.PI * 2);
              ctx!.fillStyle = g;
              ctx!.fill();

              ctx!.beginPath();
              ctx!.arc(px, py, 2.0, 0, Math.PI * 2);
              ctx!.fillStyle = `rgba(${Rp},${Gp},${Bp},${(fade * 0.88).toFixed(2)})`;
              ctx!.fill();
            }
          }
        }

        // ── Nodes ─────────────────────────────────────────────────────────
        for (let ni = 0; ni < nodes.length; ni++) {
          const n = nodes[ni];
          const nx = n.xf * cssW;
          const ny = n.yf * cssH;
          const [R, G, B] = lerp3(AMBER, TEAL, n.layer / (LAYERS.length - 1));
          const a = act(t, ni);
          const alpha = 0.10 + a * 0.90;  // always visible at 10%, peaks at 100%

          // Glow (radius grows with activation)
          const gr = 4 + a * 12;
          const glow = ctx!.createRadialGradient(nx, ny, 0, nx, ny, gr);
          glow.addColorStop(0, `rgba(${R},${G},${B},${(alpha * 0.62).toFixed(2)})`);
          glow.addColorStop(1, `rgba(${R},${G},${B},0)`);
          ctx!.beginPath();
          ctx!.arc(nx, ny, gr, 0, Math.PI * 2);
          ctx!.fillStyle = glow;
          ctx!.fill();

          // Core dot
          ctx!.beginPath();
          ctx!.arc(nx, ny, 2.2, 0, Math.PI * 2);
          ctx!.fillStyle = `rgba(${R},${G},${B},${Math.min(1, alpha).toFixed(2)})`;
          ctx!.fill();

          // White flash at activation peak
          if (a > 0.12) {
            ctx!.beginPath();
            ctx!.arc(nx, ny, 1.0, 0, Math.PI * 2);
            ctx!.fillStyle = `rgba(255,255,255,${(a * 0.82).toFixed(2)})`;
            ctx!.fill();
          }
        }
      }
      raf = requestAnimationFrame(loop);
    }

    const visObs = new IntersectionObserver(([e]) => { paused = !e.isIntersecting; });
    visObs.observe(wrap);
    const resObs = new ResizeObserver(resize);
    resObs.observe(wrap);

    const TARGET_OPACITY = 0.72;
    function onScroll() {
      const rect  = wrap!.getBoundingClientRect();
      const viewH = window.innerHeight;
      const fadeIn  = Math.max(0, Math.min(1, (viewH * 0.92 - rect.top) / (viewH * 1.5)));
      const fadeOut = Math.max(0, Math.min(1, rect.bottom / (viewH * 0.40)));
      const eased   = fadeIn * fadeIn * (3 - 2 * fadeIn) * fadeOut;
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
