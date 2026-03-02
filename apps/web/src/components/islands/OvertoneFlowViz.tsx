import { useRef, useEffect, useState, useCallback } from "react";

const RATIO = 44 / 100;
const TEAL = "#4ECDC4";
const AMBER = "#C9A04A";
const ZINC700 = "#3f3f46";
const ZINC500 = "#71717a";
const ZINC900 = "#18181b";

function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s |= 0; s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Peak {
  id: string;
  xFrac: number;      // 0–1 fraction across canvas
  label: string;
  height: number;     // 0–1 normalized
  color: string;
  maskable: boolean;
  sourceFor?: string[]; // ids that can supply info to this peak
}

const PEAKS: Peak[] = [
  { id: "oh", xFrac: 0.15, label: "O-H fund.", height: 0.72, color: TEAL, maskable: true, sourceFor: [] },
  { id: "ch", xFrac: 0.25, label: "C-H fund.", height: 0.68, color: TEAL, maskable: true, sourceFor: [] },
  { id: "co", xFrac: 0.45, label: "C=O fund.", height: 0.85, color: TEAL, maskable: true, sourceFor: [] },
  { id: "ch_ov", xFrac: 0.70, label: "C-H overtone", height: 0.28, color: AMBER, maskable: false, sourceFor: ["ch"] },
  { id: "comb", xFrac: 0.83, label: "Combination", height: 0.22, color: AMBER, maskable: false, sourceFor: ["ch", "co"] },
];

// Sources for each maskable peak (which visible peaks send particles to it)
const FLOW_SOURCES: Record<string, string[]> = {
  ch: ["ch_ov", "comb"],
  co: ["comb"],
  oh: ["ch_ov"], // approximate — uses combination band info
};

interface Particle {
  id: number;
  source: string;   // peak id
  target: string;   // peak id
  t: number;        // 0–1 progress
  trail: Array<{ x: number; y: number }>;
}

let _pid = 0;

export default function OvertoneFlowViz() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [masked, setMasked] = useState<Set<string>>(new Set());
  const [reconstructed, setReconstructed] = useState<Set<string>>(new Set());
  const [glowing, setGlowing] = useState<Map<string, number>>(new Map()); // id → glow start time

  const maskedRef = useRef(masked);
  const reconstructedRef = useRef(reconstructed);
  const glowingRef = useRef(glowing);
  maskedRef.current = masked;
  reconstructedRef.current = reconstructed;
  glowingRef.current = glowing;

  const particlesRef = useRef<Particle[]>([]);
  const cssWRef = useRef(600);
  const cssHRef = useRef(264);

  const maskPeak = useCallback((id: string) => {
    setMasked((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    setReconstructed((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    // Spawn particles from source peaks
    const sources = FLOW_SOURCES[id] || [];
    const rng = mulberry32(Date.now() & 0xffffffff);
    for (const src of sources) {
      for (let i = 0; i < 8; i++) {
        particlesRef.current.push({
          id: _pid++,
          source: src,
          target: id,
          t: -(rng() * 0.3), // staggered start
          trail: [],
        });
      }
    }
  }, []);

  const reset = useCallback(() => {
    setMasked(new Set());
    setReconstructed(new Set());
    setGlowing(new Map());
    particlesRef.current = [];
  }, []);

  useEffect(() => {
    const wrap = wrapRef.current!;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let raf = 0, paused = false, cssW = 0, cssH = 0;
    let lastTime = 0;

    function resize() {
      const r = wrap.getBoundingClientRect();
      cssW = r.width || 600; cssH = Math.round(cssW * RATIO);
      cssWRef.current = cssW; cssHRef.current = cssH;
      const dpr = devicePixelRatio || 1;
      canvas.width = cssW * dpr; canvas.height = cssH * dpr;
      canvas.style.width = cssW + "px"; canvas.style.height = cssH + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function getPeakPos(id: string): { x: number; y: number } {
      const p = PEAKS.find((pk) => pk.id === id)!;
      const padL = cssW * 0.04;
      const padR = cssW * 0.04;
      const usableW = cssW - padL - padR;
      const baseY = cssH * 0.82;
      const maxPeakH = cssH * 0.55;
      return {
        x: padL + p.xFrac * usableW,
        y: baseY - p.height * maxPeakH,
      };
    }

    function bezierPoint(
      t: number,
      x0: number, y0: number,
      x3: number, y3: number
    ): { x: number; y: number } {
      // Control points: arc upward
      const midX = (x0 + x3) / 2;
      const ctrlY = Math.min(y0, y3) - cssH * 0.28;
      const x1 = x0 + (midX - x0) * 0.5;
      const y1 = ctrlY;
      const x2 = x3 + (midX - x3) * 0.5;
      const y2 = ctrlY;
      const mt = 1 - t;
      const x = mt * mt * mt * x0 + 3 * mt * mt * t * x1 + 3 * mt * t * t * x2 + t * t * t * x3;
      const y = mt * mt * mt * y0 + 3 * mt * mt * t * y1 + 3 * mt * t * t * y2 + t * t * t * y3;
      return { x, y };
    }

    function draw(now: number) {
      if (!paused) {
        const dt = Math.min(0.05, (now - lastTime) / 1000);
        lastTime = now;

        ctx.clearRect(0, 0, cssW, cssH);

        const padL = cssW * 0.04;
        const padR = cssW * 0.04;
        const usableW = cssW - padL - padR;
        const baseY = cssH * 0.82;
        const maxPeakH = cssH * 0.55;

        // Background baseline
        ctx.strokeStyle = ZINC700;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padL, baseY);
        ctx.lineTo(padL + usableW, baseY);
        ctx.stroke();

        const maskedIds = maskedRef.current;
        const reconIds = reconstructedRef.current;
        const glowMap = glowingRef.current;

        // Draw peaks
        for (const p of PEAKS) {
          const px = padL + p.xFrac * usableW;
          const peakH = p.height * maxPeakH;
          const peakTop = baseY - peakH;
          const halfW = usableW * 0.035;

          const isMasked = maskedIds.has(p.id);
          const isRecon = reconIds.has(p.id);
          const glowAge = glowMap.has(p.id) ? (now - glowMap.get(p.id)!) / 1000 : null;
          const isGlowing = glowAge !== null && glowAge < 1.2;

          // Peak fill as gaussian curve
          ctx.beginPath();
          const pts = 40;
          for (let i = 0; i <= pts; i++) {
            const t = i / pts;
            const dx = (t - 0.5) * halfW * 6;
            const ht = peakH * Math.exp(-0.5 * (dx / (halfW * 1.2)) ** 2);
            const px2 = px + dx;
            const py2 = baseY - ht;
            if (i === 0) ctx.moveTo(px2, baseY);
            else if (i === 1) { ctx.lineTo(px2, py2); }
            else ctx.lineTo(px2, py2);
          }
          ctx.lineTo(px + halfW * 3, baseY);
          ctx.closePath();

          let fillColor: string;
          if (isMasked && !isRecon) {
            fillColor = "#27272a";
          } else if (isGlowing) {
            const alpha = Math.max(0, 1 - glowAge! / 1.2);
            const tealHex = Math.round(alpha * 0xbb).toString(16).padStart(2, "0");
            fillColor = TEAL + tealHex;
          } else {
            fillColor = p.color + (p.maskable ? "aa" : "77");
          }

          ctx.fillStyle = fillColor;
          ctx.fill();

          // Stroke
          ctx.strokeStyle = isMasked && !isRecon ? ZINC700 : (isGlowing ? TEAL : p.color);
          ctx.lineWidth = 1;
          ctx.stroke();

          // Glow halo
          if (isGlowing) {
            const alpha = Math.max(0, 1 - glowAge! / 1.2);
            const grd = ctx.createRadialGradient(px, peakTop, 0, px, peakTop, halfW * 4);
            grd.addColorStop(0, `rgba(78,205,196,${alpha * 0.4})`);
            grd.addColorStop(1, "rgba(78,205,196,0)");
            ctx.fillStyle = grd;
            ctx.beginPath();
            ctx.arc(px, peakTop, halfW * 4, 0, Math.PI * 2);
            ctx.fill();
          }

          // Masked indicator
          if (isMasked && !isRecon) {
            ctx.font = `bold ${Math.max(7, cssW * 0.015)}px monospace`;
            ctx.fillStyle = ZINC500;
            ctx.textAlign = "center";
            ctx.fillText("[MASK]", px, peakTop - 4);
          }

          // Label
          const labelFs = Math.max(7, cssW * 0.014);
          ctx.font = `${labelFs}px monospace`;
          ctx.fillStyle = isMasked && !isRecon ? ZINC500 : (p.maskable ? "#a1a1aa" : AMBER + "cc");
          ctx.textAlign = "center";
          ctx.fillText(p.label, px, baseY + cssH * 0.06);
        }

        // Update and draw particles
        const dead: number[] = [];
        const newlyArrived: string[] = [];

        for (const part of particlesRef.current) {
          part.t += dt / 1.5; // 1.5s transit
          if (part.t < 0) continue; // not started yet

          const src = getPeakPos(part.source);
          const tgt = getPeakPos(part.target);
          const tc = Math.min(1, part.t);
          const pos = bezierPoint(tc, src.x, src.y, tgt.x, tgt.y);

          // Update trail
          part.trail.push({ x: pos.x, y: pos.y });
          if (part.trail.length > 6) part.trail.shift();

          if (part.t >= 1) {
            dead.push(part.id);
            newlyArrived.push(part.target);
          }

          // Draw trail
          if (part.trail.length > 1) {
            for (let ti = 1; ti < part.trail.length; ti++) {
              const alpha = (ti / part.trail.length) * 0.7;
              ctx.beginPath();
              ctx.strokeStyle = `rgba(201,160,74,${alpha})`;
              ctx.lineWidth = 1.5;
              ctx.moveTo(part.trail[ti - 1].x, part.trail[ti - 1].y);
              ctx.lineTo(part.trail[ti].x, part.trail[ti].y);
              ctx.stroke();
            }
          }

          // Draw particle dot
          const grd = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, 4);
          grd.addColorStop(0, AMBER);
          grd.addColorStop(1, AMBER + "00");
          ctx.fillStyle = grd;
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, 4, 0, Math.PI * 2);
          ctx.fill();
        }

        // Remove dead particles and handle arrivals
        if (dead.length > 0) {
          particlesRef.current = particlesRef.current.filter((p) => !dead.includes(p.id));
        }
        if (newlyArrived.length > 0) {
          // Check if all particles for a target have arrived (none remaining for that target)
          const remaining = new Set(particlesRef.current.map((p) => p.target));
          for (const tgt of newlyArrived) {
            if (!remaining.has(tgt) && maskedIds.has(tgt)) {
              setReconstructed((prev) => {
                const next = new Set(prev);
                next.add(tgt);
                return next;
              });
              setGlowing((prev) => {
                const next = new Map(prev);
                next.set(tgt, now);
                return next;
              });
            }
          }
        }

        // Title
        const titleFs = Math.max(8, cssW * 0.016);
        ctx.font = `${titleFs}px monospace`;
        ctx.fillStyle = ZINC500;
        ctx.textAlign = "left";
        ctx.fillText("overtone / combination band correlations", padL, cssH * 0.06);
      }
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
        <span className="text-xs font-mono text-zinc-400">overtone flow — reconstruction from visible context</span>
      </div>
      <div ref={wrapRef} className="relative overflow-hidden" style={{ aspectRatio: "100/44" }}>
        <canvas ref={canvasRef} className="absolute top-0 left-0" style={{ cursor: "crosshair" }} />
      </div>
      <div className="px-4 py-2 border-t border-zinc-800 flex items-center gap-2 flex-wrap">
        {(["ch", "co", "oh"] as const).map((id) => {
          const labels: Record<string, string> = { ch: "Mask C-H", co: "Mask C=O", oh: "Mask O-H" };
          const active = masked.has(id);
          return (
            <button
              key={id}
              onClick={() => maskPeak(id)}
              disabled={active}
              className={`px-3 py-1 text-xs font-mono rounded border transition-colors ${
                active
                  ? "border-zinc-700 text-zinc-600 cursor-not-allowed"
                  : "border-zinc-600 text-zinc-400 hover:border-amber-500 hover:text-amber-400"
              }`}
            >
              {labels[id]}
            </button>
          );
        })}
        <button
          onClick={reset}
          className="px-3 py-1 text-xs font-mono rounded border border-zinc-700 text-zinc-500 hover:text-zinc-400 transition-colors"
        >
          Reset
        </button>
        <span className="text-xs font-mono text-zinc-600 ml-auto">
          amber particles flow from overtones to reconstruct masked fundamentals
        </span>
      </div>
    </div>
  );
}
