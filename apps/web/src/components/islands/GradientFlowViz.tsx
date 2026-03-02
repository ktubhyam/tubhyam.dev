/**
 * GradientFlowViz — Particle animation of gradient reversal through a 5-node network.
 * Forward: teal particles flow Encoder → z_chem → Task Head / GRL → Domain Cls.
 * Backward: amber from Task Head; red from Domain Cls pauses at GRL, reverses to blue.
 */
import { useRef, useEffect, useState } from "react";

const NODES = [
  { label: "Encoder",    x: 0.12, y: 0.50, color: "#60A5FA" },
  { label: "z_chem",     x: 0.38, y: 0.50, color: "#4ECDC4" },
  { label: "Task Head",  x: 0.68, y: 0.22, color: "#34D399" },
  { label: "GRL×-1",    x: 0.68, y: 0.78, color: "#F87171" },
  { label: "Domain Cls", x: 0.88, y: 0.78, color: "#C9A04A" },
] as const;

// Edges: [fromNode, toNode]
const EDGES = [
  [0, 1],  // 0: Encoder → z_chem
  [1, 2],  // 1: z_chem → Task Head
  [1, 3],  // 2: z_chem → GRL
  [3, 4],  // 3: GRL → Domain Cls
  [2, 1],  // 4: Task Head → z_chem (backward)
  [1, 0],  // 5: z_chem → Encoder (backward)
  [4, 3],  // 6: Domain Cls → GRL (backward)
  [3, 1],  // 7: GRL → z_chem (reversed, blue)
] as const;

// Quadratic bezier control points (normalized 0-1)
const EDGE_CP: Array<[number, number]> = [
  [0.25, 0.50],  // 0
  [0.52, 0.29],  // 1
  [0.52, 0.71],  // 2
  [0.78, 0.78],  // 3
  [0.52, 0.33],  // 4
  [0.25, 0.44],  // 5
  [0.78, 0.83],  // 6
  [0.52, 0.67],  // 7
];

// Forward paths: each is an array of edge indices
const FWD_PATHS = [[0, 1], [0, 2, 3]];
// Backward paths (color, edges, hasGrlPause)
const BWD_PATHS = [
  { color: [201, 160, 74] as [number,number,number], edges: [4, 5], grlPause: false },
  { color: [248, 113, 113] as [number,number,number], edges: [6], grlPause: true },
];
const BWD_AFTER_PAUSE_EDGES = [7, 5];

const PARTICLE_SPEED = 0.0016; // fraction per ms
const TRAIL_LEN = 8;
const TEAL: [number,number,number] = [78, 205, 196];
const BLUE: [number,number,number] = [96, 165, 250];
const PAUSE_DUR = 400;
const NODE_W = 80, NODE_H = 26;
const DL = 20, DR = 20, DT = 38, DB = 38;

interface Particle {
  pathType: "fwd" | "bwd";
  edges: number[];
  edgeIdx: number;
  t: number;
  color: [number,number,number];
  trail: Array<[number,number]>;
  pausing: boolean;
  pauseStart: number;
  grlPause: boolean;
}

interface Ring { t: number }

export default function GradientFlowViz() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fwdFnRef = useRef<(() => void) | null>(null);
  const bwdFnRef = useRef<(() => void) | null>(null);
  const [phase, setPhase] = useState<"fwd" | "bwd">("fwd");

  useEffect(() => {
    const wrap = wrapRef.current!;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;

    let raf = 0, paused = false;
    let cssW = 0, cssH = 0;
    let lastNow = performance.now();

    const particles: Particle[] = [];
    const rings: Ring[] = [];
    let grlPulseT = 0;

    // Spawn timing
    let currentPhase: "fwd" | "bwd" = "fwd";
    let phaseStart = performance.now();
    const PHASE_DUR = 3200;
    const GAP_DUR = 1200;
    let inGap = false, gapStart = 0;
    let lastFwdSpawn = [0, 0];
    let lastBwdSpawn = [0, 0];
    const FWD_INTERVAL = [220, 280];
    const BWD_INTERVAL = [300, 0]; // path 1 only; path D triggers differently

    function toScreen(nx: number, ny: number): [number, number] {
      return [DL + nx * (cssW - DL - DR), DT + ny * (cssH - DT - DB)];
    }

    function quadBez(p0: [number,number], cp: [number,number], p1: [number,number], t: number): [number,number] {
      const mt = 1 - t;
      return [
        mt*mt*p0[0] + 2*mt*t*cp[0] + t*t*p1[0],
        mt*mt*p0[1] + 2*mt*t*cp[1] + t*t*p1[1],
      ];
    }

    function edgePos(edgeIdx: number, t: number): [number, number] {
      const [from, to] = EDGES[edgeIdx];
      const p0 = toScreen(NODES[from].x, NODES[from].y);
      const cp = toScreen(EDGE_CP[edgeIdx][0], EDGE_CP[edgeIdx][1]);
      const p1 = toScreen(NODES[to].x, NODES[to].y);
      return quadBez(p0, cp, p1, t);
    }

    function spawnFwd(pathIdx: number, now: number) {
      const edges = FWD_PATHS[pathIdx].slice();
      particles.push({
        pathType: "fwd", edges, edgeIdx: 0, t: 0,
        color: [...TEAL] as [number,number,number],
        trail: [], pausing: false, pauseStart: 0, grlPause: false,
      });
      lastFwdSpawn[pathIdx] = now;
    }

    function spawnBwd(pathIdx: number, now: number) {
      const spec = BWD_PATHS[pathIdx];
      particles.push({
        pathType: "bwd", edges: spec.edges.slice(), edgeIdx: 0, t: 0,
        color: [...spec.color] as [number,number,number],
        trail: [], pausing: false, pauseStart: 0, grlPause: spec.grlPause,
      });
      lastBwdSpawn[pathIdx] = now;
    }

    function triggerFwd(now: number) {
      currentPhase = "fwd";
      phaseStart = now;
      inGap = false;
      setPhase("fwd");
    }

    function triggerBwd(now: number) {
      currentPhase = "bwd";
      phaseStart = now;
      inGap = false;
      setPhase("bwd");
    }

    fwdFnRef.current = () => triggerFwd(performance.now());
    bwdFnRef.current = () => triggerBwd(performance.now());

    function updateParticles(now: number, dt: number) {
      // Spawn logic
      if (!inGap) {
        const elapsed = now - phaseStart;
        if (elapsed < PHASE_DUR) {
          if (currentPhase === "fwd") {
            for (let i = 0; i < 2; i++) {
              if (now - lastFwdSpawn[i] > FWD_INTERVAL[i]) spawnFwd(i, now);
            }
          } else {
            if (now - lastBwdSpawn[0] > BWD_INTERVAL[0]) spawnBwd(0, now);
            if (now - lastBwdSpawn[1] > 380) spawnBwd(1, now);
          }
        } else {
          inGap = true; gapStart = now;
        }
      } else if (now - gapStart > GAP_DUR) {
        const next = currentPhase === "fwd" ? "bwd" : "fwd";
        if (next === "fwd") triggerFwd(now); else triggerBwd(now);
      }

      // Update particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];

        // Record trail position
        const pos = edgePos(p.edges[p.edgeIdx], Math.min(1, p.t));
        p.trail.push(pos);
        if (p.trail.length > TRAIL_LEN) p.trail.shift();

        if (p.pausing) {
          if (now - p.pauseStart >= PAUSE_DUR) {
            p.pausing = false;
            p.color = [...BLUE] as [number,number,number];
            p.edges = [...p.edges, ...BWD_AFTER_PAUSE_EDGES];
            p.edgeIdx++;
            p.t = 0;
            // Emit ring pulse + text pulse
            rings.push({ t: 0 });
            grlPulseT = 1.0;
          }
          continue;
        }

        p.t += PARTICLE_SPEED * dt;
        if (p.t >= 1) {
          p.t = 0;
          // Check if this was edge 6 (Domain Cls → GRL) and has grlPause
          if (p.grlPause && p.edges[p.edgeIdx] === 6) {
            p.pausing = true;
            p.pauseStart = now;
            rings.push({ t: 0 });
            grlPulseT = 1.0;
            continue;
          }
          p.edgeIdx++;
          if (p.edgeIdx >= p.edges.length) {
            particles.splice(i, 1);
          }
        }
      }

      // Update rings
      for (let i = rings.length - 1; i >= 0; i--) {
        rings[i].t += dt / 800;
        if (rings[i].t >= 1) rings.splice(i, 1);
      }
      grlPulseT = Math.max(0, grlPulseT - dt / 600);
    }

    function drawEdges() {
      ctx.lineWidth = 1.5;
      for (let e = 0; e < 4; e++) { // only draw forward edges as base
        const [from, to] = EDGES[e];
        const [fx, fy] = toScreen(NODES[from].x, NODES[from].y);
        const [cx2, cy2] = toScreen(EDGE_CP[e][0], EDGE_CP[e][1]);
        const [tx, ty] = toScreen(NODES[to].x, NODES[to].y);
        ctx.beginPath();
        ctx.moveTo(fx, fy);
        ctx.quadraticCurveTo(cx2, cy2, tx, ty);
        ctx.strokeStyle = "rgba(63,63,70,0.7)";
        ctx.stroke();

        // Arrow head at ~0.8
        const ap = quadBez([fx, fy], [cx2, cy2], [tx, ty], 0.82);
        const bp = quadBez([fx, fy], [cx2, cy2], [tx, ty], 0.78);
        const angle = Math.atan2(ap[1] - bp[1], ap[0] - bp[0]);
        ctx.beginPath();
        ctx.moveTo(ap[0], ap[1]);
        ctx.lineTo(ap[0] - 7 * Math.cos(angle - 0.4), ap[1] - 7 * Math.sin(angle - 0.4));
        ctx.moveTo(ap[0], ap[1]);
        ctx.lineTo(ap[0] - 7 * Math.cos(angle + 0.4), ap[1] - 7 * Math.sin(angle + 0.4));
        ctx.strokeStyle = "rgba(63,63,70,0.7)";
        ctx.stroke();
      }
    }

    function drawNodes() {
      const nw = NODE_W, nh = NODE_H;
      for (let i = 0; i < NODES.length; i++) {
        const n = NODES[i];
        const [cx2, cy] = toScreen(n.x, n.y);
        const x = cx2 - nw / 2, y = cy - nh / 2;

        // Background
        ctx.fillStyle = "rgba(9,9,11,0.85)";
        ctx.beginPath();
        if ((ctx as any).roundRect) (ctx as any).roundRect(x, y, nw, nh, 6);
        else ctx.rect(x, y, nw, nh);
        ctx.fill();

        // Border
        ctx.strokeStyle = n.color + "66";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        if ((ctx as any).roundRect) (ctx as any).roundRect(x, y, nw, nh, 6);
        else ctx.rect(x, y, nw, nh);
        ctx.stroke();

        // Label
        ctx.fillStyle = i === 3 && grlPulseT > 0.05
          ? `rgba(248,113,113,${0.4 + grlPulseT * 0.6})`
          : n.color;
        ctx.font = `bold 10px monospace`;
        ctx.textAlign = "center";
        ctx.fillText(n.label, cx2, cy + 4);

        // GRL rings
        if (i === 3) {
          const [gx, gy] = toScreen(n.x, n.y);
          for (const ring of rings) {
            const r = ring.t * 55;
            const alpha = (1 - ring.t) * 0.55;
            ctx.beginPath();
            ctx.arc(gx, gy, r, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(248,113,113,${alpha})`;
            ctx.lineWidth = 2;
            ctx.stroke();
          }
        }

        // Node label below
        ctx.fillStyle = "rgba(113,113,122,0.6)";
        ctx.font = "9px monospace";
        ctx.fillText(n.label.split("×")[0].trim(), cx2, cy + nh / 2 + 12);
      }
    }

    function drawParticles() {
      for (const p of particles) {
        if (p.pausing) continue;
        const [cr, cg, cb] = p.color;
        // Trail
        for (let k = 1; k < p.trail.length; k++) {
          const alpha = (k / p.trail.length) * 0.5;
          const lw = (k / p.trail.length) * 3;
          ctx.beginPath();
          ctx.moveTo(p.trail[k-1][0], p.trail[k-1][1]);
          ctx.lineTo(p.trail[k][0], p.trail[k][1]);
          ctx.strokeStyle = `rgba(${cr},${cg},${cb},${alpha})`;
          ctx.lineWidth = lw;
          ctx.lineCap = "round";
          ctx.stroke();
        }
        // Particle dot
        const pos = p.trail[p.trail.length - 1];
        if (!pos) continue;
        const g = ctx.createRadialGradient(pos[0], pos[1], 0, pos[0], pos[1], 6);
        g.addColorStop(0, `rgba(${cr},${cg},${cb},0.9)`);
        g.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
        ctx.beginPath(); ctx.arc(pos[0], pos[1], 6, 0, Math.PI * 2);
        ctx.fillStyle = g; ctx.fill();
      }
    }

    function drawLegend() {
      const items = [
        { color: TEAL, label: "forward (chemistry)" },
        { color: [201, 160, 74] as [number,number,number], label: "backward (task grad)" },
        { color: BLUE, label: "reversed (domain grad)" },
      ];
      ctx.font = "9px monospace"; ctx.textAlign = "left";
      for (let i = 0; i < items.length; i++) {
        const [cr, cg, cb] = items[i].color;
        const lx = DL, ly = cssH - DB + 16 + i * 13;
        ctx.beginPath(); ctx.arc(lx + 4, ly - 3, 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgb(${cr},${cg},${cb})`; ctx.fill();
        ctx.fillStyle = "rgba(113,113,122,0.7)";
        ctx.fillText(items[i].label, lx + 10, ly);
      }
    }

    function resize() {
      const r = wrap.getBoundingClientRect();
      cssW = r.width || 600;
      cssH = Math.round(cssW * 0.46);
      const dpr = devicePixelRatio || 1;
      canvas.width = cssW * dpr; canvas.height = cssH * dpr;
      canvas.style.width = cssW + "px"; canvas.style.height = cssH + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function draw(now: number) {
      const dt = now - lastNow; lastNow = now;
      if (!paused) updateParticles(now, dt);
      const w = cssW, h = cssH;
      ctx.clearRect(0, 0, w, h);
      drawEdges();
      drawParticles();
      drawNodes();
      drawLegend();
      raf = requestAnimationFrame(draw);
    }

    const visObs = new IntersectionObserver(([e]) => { paused = !e.isIntersecting; });
    visObs.observe(wrap);
    const resObs = new ResizeObserver(resize);
    resObs.observe(wrap);

    resize();
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); visObs.disconnect(); resObs.disconnect(); };
  }, []);

  return (
    <div className="my-8 rounded-lg border border-zinc-800 bg-zinc-950 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800">
        <span className="text-xs font-mono text-zinc-400">gradient flow — forward + reversal</span>
        <div className="flex gap-2">
          <button
            onClick={() => fwdFnRef.current?.()}
            className="text-xs font-mono px-3 py-1 rounded border border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-teal-500 hover:text-teal-300 transition-colors"
          >
            ← forward
          </button>
          <button
            onClick={() => bwdFnRef.current?.()}
            className="text-xs font-mono px-3 py-1 rounded border border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-red-500 hover:text-red-300 transition-colors"
          >
            backward →
          </button>
        </div>
      </div>
      <div ref={wrapRef} className="relative overflow-hidden" style={{ aspectRatio: "100/46" }}>
        <canvas ref={canvasRef} className="absolute top-0 left-0" />
      </div>
      <div className="px-4 py-2 border-t border-zinc-800 text-xs font-mono text-zinc-500">
        {phase === "fwd"
          ? "forward pass — chemistry and domain signals flow to their respective heads"
          : "backward pass — red gradient pauses at GRL×-1, reverses to blue, forces z_chem domain-invariant"}
      </div>
    </div>
  );
}
