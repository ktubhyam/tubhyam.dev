/**
 * NetworkPulseBg — S2 Build background.
 * 48 nodes in 4 library-colored clusters (SpectraKit · Spektron · SpectraView · ReactorTwin).
 * Nodes connect via slightly curved edges. Data pulses travel along edges.
 * Nodes breathe slowly. Cross-library edges show inter-dependency.
 * Zero particles, zero trails — pure graph network coming alive.
 */
import { useRef, useEffect } from "react";

// Library definitions
const LIBS = [
  { color: [201, 160, 74]  as [number,number,number], qx: [0.04, 0.46], qy: [0.04, 0.50] }, // amber  — SpectraKit
  { color: [78,  205, 196] as [number,number,number], qx: [0.54, 0.96], qy: [0.04, 0.50] }, // teal   — Spektron
  { color: [167, 139, 250] as [number,number,number], qx: [0.04, 0.46], qy: [0.50, 0.96] }, // violet — SpectraView
  { color: [52,  211, 153] as [number,number,number], qx: [0.54, 0.96], qy: [0.50, 0.96] }, // green  — ReactorTwin
];
const NODES_PER_LIB = 12; // 48 total

// Seeded LCG — deterministic layout every time
function makeRng(s: number) {
  let seed = s | 0;
  return () => { seed = Math.imul(1664525, seed) + 1013904223 | 0; return (seed >>> 0) / 0xffffffff; };
}

export default function NetworkPulseBg() {
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

    // ── Node and edge data ───────────────────────────────────────────────────

    type Node = { fx: number; fy: number; lib: number; phase: number; period: number };
    type Edge = {
      a: number; b: number;          // node indices
      ctrl: number;                  // perpendicular offset factor (signed)
      period: number;                // pulse travel time (s)
      offset: number;                // phase offset [0,1)
      dir: 1 | -1;                   // pulse direction
    };

    let nodes: Node[] = [];
    let edges: Edge[] = [];

    function buildGraph() {
      const rng = makeRng(0xbeefcafe);
      nodes = [];
      for (let li = 0; li < 4; li++) {
        const { qx, qy } = LIBS[li];
        for (let k = 0; k < NODES_PER_LIB; k++) {
          nodes.push({
            fx: qx[0] + rng() * (qx[1] - qx[0]),
            fy: qy[0] + rng() * (qy[1] - qy[0]),
            lib: li,
            phase: rng() * Math.PI * 2,
            period: 2.8 + rng() * 2.4,
          });
        }
      }

      edges = [];
      const added = new Set<string>();

      function addEdge(a: number, b: number) {
        const key = `${Math.min(a,b)}-${Math.max(a,b)}`;
        if (added.has(key) || a === b) return;
        added.add(key);
        const rng2 = makeRng(a * 97 + b * 31);
        edges.push({
          a, b,
          ctrl: (rng2() - 0.5) * 0.18, // curvature: ±9% of edge length, perp direction
          period: 3.5 + rng2() * 4.5,
          offset: rng2(),
          dir: rng2() > 0.5 ? 1 : -1,
        });
      }

      // Within-library: connect each node to its 2 nearest same-library neighbors
      for (let li = 0; li < 4; li++) {
        const group = nodes.map((n, i) => ({ n, i })).filter(({ n }) => n.lib === li);
        for (const { i } of group) {
          const sorted = group
            .filter(({ i: j }) => j !== i)
            .sort((a, b) => {
              const da = (nodes[a.i].fx - nodes[i].fx) ** 2 + (nodes[a.i].fy - nodes[i].fy) ** 2;
              const db = (nodes[b.i].fx - nodes[i].fx) ** 2 + (nodes[b.i].fy - nodes[i].fy) ** 2;
              return da - db;
            });
          for (let k = 0; k < Math.min(2, sorted.length); k++) addEdge(i, sorted[k].i);
        }
      }

      // Cross-library: 10 edges connecting closest inter-library pairs
      const crossRng = makeRng(0xcafe1234);
      const crossPairs: { d: number; i: number; j: number }[] = [];
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          if (nodes[i].lib === nodes[j].lib) continue;
          const d = (nodes[i].fx - nodes[j].fx) ** 2 + (nodes[i].fy - nodes[j].fy) ** 2;
          crossPairs.push({ d, i, j });
        }
      }
      crossPairs.sort((a, b) => a.d - b.d);
      for (let k = 0; k < Math.min(10, crossPairs.length); k++) {
        addEdge(crossPairs[k].i, crossPairs[k].j);
        if (crossRng() > 0.5 && k + 1 < crossPairs.length) {
          addEdge(crossPairs[k + 1].i, crossPairs[k + 1].j);
          k++;
        }
      }
    }

    // ── Bezier helpers ───────────────────────────────────────────────────────

    function controlPt(ax: number, ay: number, bx: number, by: number, ctrl: number) {
      const mx = (ax + bx) * 0.5;
      const my = (ay + by) * 0.5;
      const dx = bx - ax, dy = by - ay;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      // Perpendicular unit vector
      const px = -dy / len, py = dx / len;
      return { cx: mx + px * ctrl * len, cy: my + py * ctrl * len };
    }

    function bezierPt(ax: number, ay: number, cx: number, cy: number, bx: number, by: number, t: number) {
      const mt = 1 - t;
      return {
        x: mt * mt * ax + 2 * mt * t * cx + t * t * bx,
        y: mt * mt * ay + 2 * mt * t * cy + t * t * by,
      };
    }

    // ── Resize ───────────────────────────────────────────────────────────────

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

    // ── Main loop ────────────────────────────────────────────────────────────

    function loop(ts: number) {
      if (!paused && cssW > 0) {
        const t = ts * 0.001;
        ctx!.clearRect(0, 0, cssW, cssH);

        // ── Edges ────────────────────────────────────────────────────────────
        for (const e of edges) {
          const na = nodes[e.a], nb = nodes[e.b];
          const ax = na.fx * cssW, ay = na.fy * cssH;
          const bx = nb.fx * cssW, by = nb.fy * cssH;
          const { cx, cy } = controlPt(ax, ay, bx, by, e.ctrl);

          // Cross-library edge blends both library colors; same-library uses its own
          const sameLib = na.lib === nb.lib;
          const [Ra, Ga, Ba] = LIBS[na.lib].color;
          const [Rb, Gb, Bb] = LIBS[nb.lib].color;

          if (sameLib) {
            ctx!.beginPath();
            ctx!.moveTo(ax, ay);
            ctx!.quadraticCurveTo(cx, cy, bx, by);
            ctx!.strokeStyle = `rgba(${Ra},${Ga},${Ba},0.10)`;
            ctx!.lineWidth = 0.6;
            ctx!.stroke();
          } else {
            // Cross-library: gradient along path mid-point
            const mid = bezierPt(ax, ay, cx, cy, bx, by, 0.5);
            const grad = ctx!.createLinearGradient(ax, ay, bx, by);
            grad.addColorStop(0, `rgba(${Ra},${Ga},${Ba},0.08)`);
            grad.addColorStop(0.5, `rgba(${Math.round((Ra+Rb)/2)},${Math.round((Ga+Gb)/2)},${Math.round((Ba+Bb)/2)},0.12)`);
            grad.addColorStop(1, `rgba(${Rb},${Gb},${Bb},0.08)`);
            ctx!.beginPath();
            ctx!.moveTo(ax, ay);
            ctx!.quadraticCurveTo(cx, cy, bx, by);
            ctx!.strokeStyle = grad;
            ctx!.lineWidth = 0.7;
            ctx!.stroke();
          }

          // ── Pulse dot ────────────────────────────────────────────────────
          const rawFrac = ((t / e.period + e.offset) % 1.0);
          const frac    = e.dir === 1 ? rawFrac : 1 - rawFrac;

          // Only show pulse when in mid-80% of path (fade near endpoints)
          const edgeFade = Math.min(1, Math.min(frac, 1 - frac) * 15);
          if (edgeFade > 0) {
            const { x: px, y: py } = bezierPt(ax, ay, cx, cy, bx, by, frac);
            const [Rp, Gp, Bp] = sameLib
              ? LIBS[na.lib].color
              : [Math.round((Ra + Rb) / 2), Math.round((Ga + Gb) / 2), Math.round((Ba + Bb) / 2)];
            const alpha = edgeFade * 0.90;

            // Glow
            const g = ctx!.createRadialGradient(px, py, 0, px, py, 6);
            g.addColorStop(0, `rgba(${Rp},${Gp},${Bp},${(alpha * 0.75).toFixed(2)})`);
            g.addColorStop(1, `rgba(${Rp},${Gp},${Bp},0)`);
            ctx!.beginPath();
            ctx!.arc(px, py, 6, 0, Math.PI * 2);
            ctx!.fillStyle = g;
            ctx!.fill();

            // Core dot
            ctx!.beginPath();
            ctx!.arc(px, py, 1.8, 0, Math.PI * 2);
            ctx!.fillStyle = `rgba(${Rp},${Gp},${Bp},${alpha.toFixed(2)})`;
            ctx!.fill();

            // White centre
            ctx!.beginPath();
            ctx!.arc(px, py, 0.8, 0, Math.PI * 2);
            ctx!.fillStyle = `rgba(255,255,255,${(alpha * 0.85).toFixed(2)})`;
            ctx!.fill();
          }
        }

        // ── Nodes ────────────────────────────────────────────────────────────
        for (const n of nodes) {
          const nx = n.fx * cssW;
          const ny = n.fy * cssH;
          const [R, G, B] = LIBS[n.lib].color;
          const breath = 0.35 + 0.25 * Math.sin(t / n.period + n.phase); // 0.10–0.60

          // Outer glow
          const glow = ctx!.createRadialGradient(nx, ny, 0, nx, ny, 9);
          glow.addColorStop(0, `rgba(${R},${G},${B},${(breath * 0.7).toFixed(2)})`);
          glow.addColorStop(1, `rgba(${R},${G},${B},0)`);
          ctx!.beginPath();
          ctx!.arc(nx, ny, 9, 0, Math.PI * 2);
          ctx!.fillStyle = glow;
          ctx!.fill();

          // Core dot
          ctx!.beginPath();
          ctx!.arc(nx, ny, 2.2, 0, Math.PI * 2);
          ctx!.fillStyle = `rgba(${R},${G},${B},${Math.min(1, breath * 1.8).toFixed(2)})`;
          ctx!.fill();

          // White inner
          ctx!.beginPath();
          ctx!.arc(nx, ny, 0.9, 0, Math.PI * 2);
          ctx!.fillStyle = `rgba(255,255,255,${(breath * 1.2).toFixed(2)})`;
          ctx!.fill();
        }
      }
      raf = requestAnimationFrame(loop);
    }

    buildGraph();

    const visObs = new IntersectionObserver(([e]) => { paused = !e.isIntersecting; });
    visObs.observe(wrap);
    const resObs = new ResizeObserver(resize);
    resObs.observe(wrap);

    const TARGET_OPACITY = 0.80;
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
