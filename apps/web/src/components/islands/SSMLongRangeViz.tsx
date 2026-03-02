import { useRef, useEffect, useState } from "react";

const RATIO = 40 / 100;

function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Peak {
  pos: number;   // 0–1 fraction
  height: number;
  width: number;
}

function buildPeaks(): Peak[] {
  const rng = mulberry32(0xdeadbeef);
  const peaks: Peak[] = [];
  const N = 12;
  for (let i = 0; i < N; i++) {
    peaks.push({
      pos: 0.04 + rng() * 0.92,
      height: 0.25 + rng() * 0.75,
      width: 0.008 + rng() * 0.018,
    });
  }
  return peaks;
}

const PEAKS = buildPeaks();
const NEAR_IDX = 9;   // peak near the cursor sweep zone
const FAR_IDX = 2;    // peak far from cursor

export default function SSMLongRangeViz() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<"ssm" | "cnn">("ssm");
  const modeRef = useRef<"ssm" | "cnn">("ssm");

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    const wrap = wrapRef.current!;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let raf = 0;
    let paused = false;
    let cssW = 0;
    let cssH = 0;

    // Cursor state
    let cursorPos = 0;          // 0–1 fraction
    const CURSOR_SPEED = 0.00018; // fraction per ms

    // Particles
    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;  // 0–1
      color: string;
    }
    const particles: Particle[] = [];
    let lastPeakBurst = -1;
    let lastMs = performance.now();

    function spectrumY(pos: number): number {
      let val = 0.04;
      for (const p of PEAKS) {
        val += p.height * Math.exp(-((pos - p.pos) ** 2) / (2 * p.width ** 2));
      }
      return Math.min(val, 1.0);
    }

    function resize() {
      const r = wrap.getBoundingClientRect();
      cssW = r.width || 600;
      cssH = Math.round(cssW * RATIO);
      const dpr = devicePixelRatio || 1;
      canvas.width = cssW * dpr;
      canvas.height = cssH * dpr;
      canvas.style.width = cssW + "px";
      canvas.style.height = cssH + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function draw(now: number) {
      const dt = now - lastMs;
      lastMs = now;

      if (!paused) {
        cursorPos = (cursorPos + CURSOR_SPEED * dt) % 1;
      }

      if (!cssW || !cssH) {
        raf = requestAnimationFrame(draw);
        return;
      }

      const m = modeRef.current;
      const padT = 28;
      const padB = 22;
      const padL = 12;
      const padR = 12;
      const plotW = cssW - padL - padR;
      const plotH = cssH - padT - padB;

      ctx.clearRect(0, 0, cssW, cssH);
      ctx.fillStyle = "#09090b";
      ctx.fillRect(0, 0, cssW, cssH);

      const cursorX = padL + cursorPos * plotW;

      // ---- Memory trail ----
      const trailLength = m === "ssm" ? 1.0 : 0.10;
      const trailStart = Math.max(0, cursorPos - trailLength);
      const TRAIL_STEPS = 200;

      for (let i = 0; i < TRAIL_STEPS; i++) {
        const frac = trailStart + (i / TRAIL_STEPS) * (cursorPos - trailStart);
        if (frac < 0 || frac > 1) continue;
        const ageFrac = (frac - trailStart) / (cursorPos - trailStart + 1e-9);
        const alpha = m === "ssm"
          ? ageFrac * 0.35
          : ageFrac > 0.85 ? (ageFrac - 0.85) / 0.15 * 0.5 : 0;

        const x = padL + frac * plotW;
        const y = padT + plotH - spectrumY(frac) * plotH * 0.85;
        ctx.fillStyle = `rgba(78,205,196,${alpha})`;
        ctx.fillRect(x, y, (plotW / TRAIL_STEPS) + 1, spectrumY(frac) * plotH * 0.85 + plotH * 0.15);
      }

      // ---- Spectrum line ----
      const N = 400;
      ctx.strokeStyle = "rgba(201,160,74,0.7)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let i = 0; i <= N; i++) {
        const pos = i / N;
        const x = padL + pos * plotW;
        const y = padT + plotH - spectrumY(pos) * plotH * 0.85;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // ---- Near and far peak highlights ----
      const nearPeak = PEAKS[NEAR_IDX];
      const farPeak = PEAKS[FAR_IDX];

      const nearX = padL + nearPeak.pos * plotW;
      const farX = padL + farPeak.pos * plotW;
      const nearY = padT + plotH - nearPeak.height * plotH * 0.85;
      const farY = padT + farPeak.pos * plotH - farPeak.height * plotH * 0.85;
      const farYActual = padT + plotH - spectrumY(farPeak.pos) * plotH * 0.85;

      // Dashed vertical lines for highlighted peaks
      const drawDashedV = (x: number, color: string) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = 0.8;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(x, padT);
        ctx.lineTo(x, padT + plotH);
        ctx.stroke();
        ctx.setLineDash([]);
      };
      drawDashedV(nearX, "rgba(167,139,250,0.5)");
      drawDashedV(farX, "rgba(167,139,250,0.5)");

      // Arc connecting near and far peak (SSM: visible, CNN: broken/X)
      const arcMidX = (nearX + farX) / 2;
      const arcMidY = padT + 10;
      const canSeeArc = m === "ssm";

      if (canSeeArc) {
        ctx.strokeStyle = "rgba(78,205,196,0.4)";
        ctx.lineWidth = 1;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(nearX, nearY);
        ctx.quadraticCurveTo(arcMidX, arcMidY, farX, farYActual);
        ctx.stroke();
        // Arc label
        ctx.fillStyle = "rgba(78,205,196,0.7)";
        ctx.font = `${Math.max(8, cssW * 0.012)}px monospace`;
        ctx.textAlign = "center";
        ctx.fillText("long-range correlation", arcMidX, arcMidY - 3);
      } else {
        // Draw broken arc with X in the middle
        ctx.strokeStyle = "rgba(248,113,113,0.4)";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(nearX, nearY);
        ctx.quadraticCurveTo(arcMidX, arcMidY, farX, farYActual);
        ctx.stroke();
        ctx.setLineDash([]);
        // X mark
        const xSize = 5;
        ctx.strokeStyle = "rgba(248,113,113,0.9)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(arcMidX - xSize, arcMidY - xSize);
        ctx.lineTo(arcMidX + xSize, arcMidY + xSize);
        ctx.moveTo(arcMidX + xSize, arcMidY - xSize);
        ctx.lineTo(arcMidX - xSize, arcMidY + xSize);
        ctx.stroke();
        ctx.fillStyle = "rgba(248,113,113,0.7)";
        ctx.font = `${Math.max(8, cssW * 0.012)}px monospace`;
        ctx.textAlign = "center";
        ctx.fillText("out of reach", arcMidX, arcMidY - 7);
      }

      // ---- Particles ----
      // Check if cursor crosses a peak
      for (let pi = 0; pi < PEAKS.length; pi++) {
        const p = PEAKS[pi];
        const dist = Math.abs(cursorPos - p.pos);
        if (dist < 0.008 && lastPeakBurst !== pi) {
          lastPeakBurst = pi;
          const px2 = padL + p.pos * plotW;
          const py2 = padT + plotH - p.height * plotH * 0.85;
          for (let k = 0; k < 12; k++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 0.3 + Math.random() * 0.8;
            particles.push({
              x: px2,
              y: py2,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed - 0.5,
              life: 1.0,
              color: "#4ECDC4",
            });
          }
        }
      }
      if (Math.abs(cursorPos - PEAKS[lastPeakBurst]?.pos ?? 99) > 0.02) {
        // reset burst tracker when cursor moves away
      }

      // Update and draw particles
      for (let pi = particles.length - 1; pi >= 0; pi--) {
        const p = particles[pi];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05;
        p.life -= 0.03;
        if (p.life <= 0) {
          particles.splice(pi, 1);
          continue;
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(78,205,196,${p.life * 0.8})`;
        ctx.fill();
      }

      // ---- Cursor (glowing vertical line) ----
      const grd = ctx.createLinearGradient(cursorX, padT, cursorX, padT + plotH);
      grd.addColorStop(0, "rgba(78,205,196,0)");
      grd.addColorStop(0.3, "rgba(78,205,196,0.8)");
      grd.addColorStop(1, "rgba(78,205,196,0.2)");

      ctx.strokeStyle = grd;
      ctx.lineWidth = 2;
      ctx.shadowColor = "#4ECDC4";
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(cursorX, padT);
      ctx.lineTo(cursorX, padT + plotH);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // ---- Axes ----
      ctx.strokeStyle = "#27272a";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padL, padT + plotH);
      ctx.lineTo(padL + plotW, padT + plotH);
      ctx.stroke();

      // ---- Metrics (top) ----
      const memPts = m === "ssm" ? 2048 : 64;
      ctx.fillStyle = "#71717a";
      ctx.font = `${Math.max(9, cssW * 0.013)}px monospace`;
      ctx.textAlign = "left";
      ctx.fillText("memory span:", padL + 2, 14);
      ctx.fillStyle = m === "ssm" ? "#4ECDC4" : "#F87171";
      ctx.fillText(`${memPts} pts`, padL + 82, 14);

      ctx.fillStyle = "#71717a";
      ctx.textAlign = "right";
      ctx.fillText(`mode: ${m.toUpperCase()}`, cssW - padR, 14);

      // ---- Axis label ----
      ctx.fillStyle = "#52525b";
      ctx.font = `${Math.max(8, cssW * 0.012)}px monospace`;
      ctx.textAlign = "center";
      ctx.fillText("wavenumber \u2192", padL + plotW / 2, padT + plotH + 14);

      raf = requestAnimationFrame(draw);
    }

    const visObs = new IntersectionObserver(([e]) => {
      paused = !e.isIntersecting;
    });
    visObs.observe(wrap);
    const resObs = new ResizeObserver(resize);
    resObs.observe(wrap);
    resize();
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      visObs.disconnect();
      resObs.disconnect();
    };
  }, []);

  return (
    <div className="my-8 rounded-lg border border-zinc-800 bg-zinc-950 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800">
        <span className="text-xs font-mono text-zinc-400">SSM long-range memory — cursor sweeps spectrum</span>
        <button
          onClick={() => setMode((m) => (m === "ssm" ? "cnn" : "ssm"))}
          className={`text-xs font-mono px-3 py-1 rounded border transition-colors ${
            mode === "ssm"
              ? "border-teal-700 bg-teal-950 text-teal-400"
              : "border-red-800 bg-red-950 text-red-400"
          }`}
        >
          {mode === "ssm" ? "SSM" : "CNN"} &mdash; toggle
        </button>
      </div>
      <div ref={wrapRef} className="relative overflow-hidden" style={{ aspectRatio: "100/40" }}>
        <canvas ref={canvasRef} className="absolute top-0 left-0" style={{ cursor: "crosshair" }} />
      </div>
      <div className="px-4 py-2 border-t border-zinc-800 text-xs font-mono text-zinc-500">
        {mode === "ssm"
          ? "SSM: full-history trail — every earlier peak remains in memory. Arc connects correlated peaks."
          : "CNN: trail cuts off after ~10% of spectrum. Distant peak correlation is unreachable (broken arc)."}
      </div>
    </div>
  );
}
