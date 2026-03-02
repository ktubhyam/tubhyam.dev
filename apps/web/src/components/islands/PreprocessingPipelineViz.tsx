import { useRef, useEffect, useState } from "react";

const RATIO = 68 / 100;

function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s |= 0; s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const PEAK_POSITIONS = [0.18, 0.42, 0.71];
const PEAK_HEIGHTS = [0.55, 0.82, 0.65];
const PEAK_WIDTHS = [0.04, 0.03, 0.035];
const N_BARS = 40;

function buildRaw(rand: () => number): number[] {
  const bars: number[] = [];
  for (let i = 0; i < N_BARS; i++) {
    const x = i / (N_BARS - 1);
    let val = 0;
    for (let p = 0; p < PEAK_POSITIONS.length; p++) {
      const dx = x - PEAK_POSITIONS[p];
      val += PEAK_HEIGHTS[p] * Math.exp(-(dx * dx) / (2 * PEAK_WIDTHS[p] * PEAK_WIDTHS[p]));
    }
    // polynomial baseline
    val += 0.12 + 0.25 * x - 0.15 * x * x;
    // noise
    val += (rand() - 0.5) * 0.12;
    bars.push(Math.max(0, val));
  }
  return bars;
}

function buildBaseline(rand: () => number): number[] {
  const bars: number[] = [];
  for (let i = 0; i < N_BARS; i++) {
    const x = i / (N_BARS - 1);
    let val = 0;
    for (let p = 0; p < PEAK_POSITIONS.length; p++) {
      const dx = x - PEAK_POSITIONS[p];
      val += PEAK_HEIGHTS[p] * Math.exp(-(dx * dx) / (2 * PEAK_WIDTHS[p] * PEAK_WIDTHS[p]));
    }
    val += (rand() - 0.5) * 0.12;
    bars.push(Math.max(0, val));
  }
  return bars;
}

function buildSmoothed(rand: () => number): number[] {
  const bars: number[] = [];
  for (let i = 0; i < N_BARS; i++) {
    const x = i / (N_BARS - 1);
    let val = 0;
    for (let p = 0; p < PEAK_POSITIONS.length; p++) {
      const dx = x - PEAK_POSITIONS[p];
      val += PEAK_HEIGHTS[p] * Math.exp(-(dx * dx) / (2 * PEAK_WIDTHS[p] * PEAK_WIDTHS[p]));
    }
    val += (rand() - 0.5) * 0.035;
    bars.push(Math.max(0, val));
  }
  return bars;
}

function buildNormalized(raw: number[]): number[] {
  const max = Math.max(...raw);
  return raw.map(v => v / max);
}

export default function PreprocessingPipelineViz() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [sweepPct, setSweepPct] = useState(0);
  const [running, setRunning] = useState(false);
  const sweepRef = useRef(0);
  const rafRef = useRef(0);
  const pausedRef = useRef(false);

  useEffect(() => {
    const wrap = wrapRef.current!;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let cssW = 0, cssH = 0;

    const rand1 = mulberry32(42);
    const rawBars = buildRaw(rand1);

    const rand2 = mulberry32(42);
    buildRaw(rand2); // consume same seed
    const rand3 = mulberry32(99);
    const baselineBars = buildBaseline(rand3);

    const rand4 = mulberry32(200);
    const smoothedBars = buildSmoothed(rand4);

    const normalizedBars = buildNormalized(smoothedBars.slice());

    const panels = [
      { label: "01 — Raw", color: "#71717a", bars: rawBars, raw: true, step: "baseline_als →" },
      { label: "02 — Baseline corrected", color: "#60A5FA", bars: baselineBars, raw: false, step: "savgol_smooth →" },
      { label: "03 — Smoothed", color: "#A78BFA", bars: smoothedBars, raw: false, step: "normalize_snv →" },
      { label: "04 — Normalized", color: "#4ECDC4", bars: normalizedBars, raw: false, step: "" },
    ];

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

    function draw() {
      if (!cssW) return;
      ctx.clearRect(0, 0, cssW, cssH);

      const sweep = sweepRef.current;
      const panelH = cssH * 0.22;
      const gap = cssH * 0.025;
      const totalPanels = panels.length;
      const totalH = totalPanels * panelH + (totalPanels - 1) * gap;
      const startY = (cssH - totalH) / 2;
      const padL = cssW * 0.13;
      const padR = cssW * 0.08;
      const plotW = cssW - padL - padR;

      panels.forEach((panel, pi) => {
        const py = startY + pi * (panelH + gap);

        // Panel background
        ctx.fillStyle = "rgba(24,24,27,0.7)";
        if ((ctx as any).roundRect) {
          (ctx as any).roundRect(padL - 4, py, plotW + 8, panelH, 4);
        } else {
          ctx.rect(padL - 4, py, plotW + 8, panelH);
        }
        ctx.fill();

        // Step label (right side caret), except last panel
        if (panel.step) {
          ctx.font = `${Math.max(9, cssW * 0.017)}px monospace`;
          ctx.fillStyle = "#52525b";
          ctx.textAlign = "left";
          ctx.fillText(panel.step, padL + plotW + 6, py + panelH * 0.5 + 4);
        }

        // Panel label
        ctx.font = `bold ${Math.max(9, cssW * 0.018)}px monospace`;
        ctx.fillStyle = panel.raw ? "#a1a1aa" : panel.color;
        ctx.textAlign = "left";
        ctx.fillText(panel.label, padL, py - 3);

        // Draw bars
        const barW = plotW / (N_BARS * 1.5);
        const maxVal = Math.max(...panel.bars, 0.01);
        const innerH = panelH - 8;

        panel.bars.forEach((val, bi) => {
          const x = padL + (bi / N_BARS) * plotW + barW * 0.25;
          const barX = bi / (N_BARS - 1);

          // Determine if cursor has passed this bar
          const revealed = !panel.raw && sweep > barX;

          let color: string;
          if (panel.raw) {
            color = "#71717a";
          } else if (revealed) {
            color = panel.color;
          } else {
            color = "#3f3f46";
          }

          const h = (val / maxVal) * innerH;
          ctx.fillStyle = color;
          ctx.fillRect(x, py + panelH - 4 - h, barW, h);
        });

        // Y-scale indicator
        ctx.font = `${Math.max(8, cssW * 0.014)}px monospace`;
        ctx.fillStyle = "#52525b";
        ctx.textAlign = "right";
        if (panel.raw) {
          ctx.fillText("~1.0", padL - 6, py + 8);
          ctx.fillText("0", padL - 6, py + panelH - 4);
        } else if (pi === 3) {
          ctx.fillText("1.0", padL - 6, py + 8);
          ctx.fillText("0", padL - 6, py + panelH - 4);
        } else {
          ctx.fillText("a.u.", padL - 6, py + 8);
          ctx.fillText("0", padL - 6, py + panelH - 4);
        }

        // Baseline for panel
        ctx.strokeStyle = "#3f3f46";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padL - 4, py + panelH - 4);
        ctx.lineTo(padL + plotW + 4, py + panelH - 4);
        ctx.stroke();
      });

      // Sweep cursor across ALL panels
      if (sweep > 0 && sweep < 1) {
        const sweepX = padL + sweep * plotW;
        const topY = startY - 2;
        const botY = startY + totalH + 2;

        // Glow
        const grad = ctx.createLinearGradient(sweepX - 6, 0, sweepX + 6, 0);
        grad.addColorStop(0, "rgba(78,205,196,0)");
        grad.addColorStop(0.5, "rgba(78,205,196,0.35)");
        grad.addColorStop(1, "rgba(78,205,196,0)");
        ctx.fillStyle = grad;
        ctx.fillRect(sweepX - 6, topY, 12, botY - topY);

        ctx.strokeStyle = "rgba(78,205,196,0.9)";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.moveTo(sweepX, topY);
        ctx.lineTo(sweepX, botY);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    function animate(now: number) {
      if (!pausedRef.current && running) {
        // advance handled via setInterval outside
      }
      draw();
      rafRef.current = requestAnimationFrame(animate);
    }

    const visObs = new IntersectionObserver(([e]) => {
      pausedRef.current = !e.isIntersecting;
    });
    visObs.observe(wrap);

    const resObs = new ResizeObserver(() => {
      resize();
      draw();
    });
    resObs.observe(wrap);

    resize();
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
      visObs.disconnect();
      resObs.disconnect();
    };
  }, []);

  // Sweep animation
  useEffect(() => {
    if (!running) return;
    const DURATION = 3500;
    const start = performance.now();
    let raf = 0;

    function tick(now: number) {
      const pct = Math.min((now - start) / DURATION, 1);
      sweepRef.current = pct;
      setSweepPct(pct);
      if (pct < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setRunning(false);
      }
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running]);

  // Auto-start on first intersection
  const startedRef = useRef(false);
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !startedRef.current) {
        startedRef.current = true;
        sweepRef.current = 0;
        setSweepPct(0);
        setRunning(true);
      }
    }, { threshold: 0.3 });
    obs.observe(wrap);
    return () => obs.disconnect();
  }, []);

  const stepIndex = sweepPct < 0.33 ? 1 : sweepPct < 0.66 ? 2 : sweepPct < 1 ? 3 : 4;

  return (
    <div className="my-8 rounded-lg border border-zinc-800 bg-zinc-950 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800">
        <span className="text-xs font-mono text-zinc-400">preprocessing pipeline — step-by-step</span>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-zinc-500">
            {sweepPct === 0 ? "ready" : sweepPct < 1 ? `step ${stepIndex}/4` : "complete"}
          </span>
          <button
            className="text-xs font-mono text-zinc-500 hover:text-teal-400 transition-colors"
            onClick={() => {
              sweepRef.current = 0;
              setSweepPct(0);
              setRunning(true);
            }}
          >
            ↺ replay
          </button>
        </div>
      </div>
      <div ref={wrapRef} className="relative overflow-hidden" style={{ aspectRatio: "100/68" }}>
        <canvas ref={canvasRef} className="absolute top-0 left-0" style={{ cursor: "crosshair" }} />
      </div>
      <div className="px-4 py-2 border-t border-zinc-800 text-xs font-mono text-zinc-500">
        baseline_als → savgol_smooth → normalize_snv — vertical cursor reveals each stage as it passes
      </div>
    </div>
  );
}
