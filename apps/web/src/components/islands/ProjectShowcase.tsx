/**
 * ProjectShowcase — Tabbed project browser for the Build section.
 * Replaces the static bento grid with an interactive panel showing
 * per-project canvas visualizations, typed terminal output, install
 * commands, and stat badges. Four projects: SpectraKit, Spektron,
 * ReactorTwin, SpectraView. Tab switching fades out → swaps data →
 * fades in. Terminal lines type character-by-character on each switch.
 */
import { useState, useEffect, useRef, useCallback } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

type VizKind = "spectrakit" | "spektron" | "reactortwin" | "spectraview";

interface Stat {
  label: string;
  value: string;
}

interface Project {
  num: string;
  name: string;
  version: string;
  status: string;
  statusColor: string;
  description: string;
  install: string | null;
  href: string;
  stats: Stat[];
  terminalLines: string[];
  vizKind: VizKind;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const AMBER = "rgba(201,160,74,";
const TEAL  = "rgba(78,205,196,";
const MUTED = "rgba(136,136,136,";

const PROJECTS: Project[] = [
  {
    num: "001",
    name: "SpectraKit",
    version: "v1.8.0",
    status: "stable",
    statusColor: "#34D399",
    description:
      "Python library for vibrational spectroscopy preprocessing and analysis. Baseline correction, smoothing, normalization, peak detection.",
    install: "pip install spectrakit",
    href: "/projects/spectrakit",
    stats: [
      { label: "tests", value: "699" },
      { label: "coverage", value: "97%" },
    ],
    terminalLines: [
      "$ pnpm --filter spectrakit test",
      "Running 699 unit tests...",
      "✓ baseline_correction   (128ms)",
      "✓ peak_detection        (94ms)",
      "✓ normalization         (67ms)",
      "✓ smoothing             (103ms)",
      "",
      "699 passed · Coverage: 97.3% ✓",
    ],
    vizKind: "spectrakit",
  },
  {
    num: "002",
    name: "Spektron",
    version: "v0.1.0",
    status: "training",
    statusColor: "#C9A04A",
    description:
      "5-architecture spectral inversion benchmark at parameter parity (~1M params). D-LinOSS, Mamba, S4D, Transformer, CNN on QM9S (130K molecules).",
    install: null,
    href: "/projects/spektron",
    stats: [
      { label: "architectures", value: "5" },
      { label: "dataset", value: "130K" },
    ],
    terminalLines: [
      "$ python3 train.py --arch d-linoss --seed 42",
      "Epoch  24/100 | loss=0.312 | R²=0.847",
      "Epoch  25/100 | loss=0.298 | R²=0.859",
      "Epoch  26/100 | loss=0.281 | R²=0.871",
      "Epoch  27/100 | loss=0.267 | R²=0.882",
      "",
      "Best checkpoint: R²=0.882 @ epoch 27",
    ],
    vizKind: "spektron",
  },
  {
    num: "003",
    name: "ReactorTwin",
    version: "v1.0.0",
    status: "stable",
    statusColor: "#34D399",
    description:
      "Neural ODE surrogate digital twin for chemical reactors. 1500× faster than numerical simulation. Physics-informed, PyPI stable.",
    install: "pip install reactortwin",
    href: "/projects/reactortwin",
    stats: [
      { label: "speedup", value: "1500×" },
      { label: "tests", value: "1477" },
    ],
    terminalLines: [
      "$ python3 -c 'import reactortwin; rt = ReactorTwin()'",
      "Loading surrogate model...",
      "Numerical solver:  12,400ms",
      "Neural ODE twin:       8ms",
      "",
      "Speedup: 1550× · R²=0.998 ✓",
      "Coverage: 90.4% · 1477 tests ✓",
    ],
    vizKind: "reactortwin",
  },
  {
    num: "004",
    name: "SpectraView",
    version: "v0.1.0",
    status: "beta",
    statusColor: "#A78BFA",
    description:
      "TypeScript React library for spectrum visualization. 15 components, Canvas + SVG rendering, interactive peak annotation.",
    install: "npm install spectraview",
    href: "https://github.com/ktubhyam/spectraview",
    stats: [
      { label: "components", value: "15" },
      { label: "tests", value: "266" },
    ],
    terminalLines: [
      "$ pnpm --filter spectraview test",
      "Running 266 component tests...",
      "✓ SpectrumChart      (44ms)",
      "✓ PeakAnnotation     (31ms)",
      "✓ CanvasRenderer     (58ms)",
      "✓ SVGRenderer        (29ms)",
      "",
      "266 passed · 6 ★ on GitHub ✓",
    ],
    vizKind: "spectraview",
  },
];

// ── Canvas draw functions (192px tall variants) ───────────────────────────────

function lorentz(x: number, c: number, w: number): number {
  return 1 / (1 + ((x - c) / w) ** 2);
}

function drawSpectraKit(ctx: CanvasRenderingContext2D, W: number, H: number, t: number): void {
  const mols = [
    [[0.22, 0.45], [0.50, 0.90], [0.65, 0.60], [0.82, 0.35]],
    [[0.18, 0.55], [0.40, 0.80], [0.62, 1.00], [0.78, 0.42]],
    [[0.30, 0.40], [0.55, 0.70], [0.70, 0.95], [0.87, 0.30]],
  ] as [number, number][][];
  const PERIOD = 4000;
  const phase  = (t % (PERIOD * mols.length)) / PERIOD;
  const idx    = Math.floor(phase);
  const blend  = phase - idx;
  const m1     = mols[idx % mols.length];
  const m2     = mols[(idx + 1) % mols.length];
  const N    = W * 2;
  const base = H * 0.82;
  const amp  = H * 0.70;
  ctx.beginPath();
  for (let i = 0; i <= N; i++) {
    const x = i / N;
    let y1 = 0, y2 = 0;
    for (const [c, h] of m1) y1 += lorentz(x, c, 0.035) * h;
    for (const [c, h] of m2) y2 += lorentz(x, c, 0.035) * h;
    const v = Math.min((y1 * (1 - blend) + y2 * blend) * 0.85, 1);
    const sx = (i / N) * W;
    const sy = base - v * amp;
    i === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy);
  }
  const g = ctx.createLinearGradient(0, 0, W, 0);
  g.addColorStop(0,    AMBER + "0)");
  g.addColorStop(0.25, AMBER + "0.45)");
  g.addColorStop(0.65, AMBER + "0.55)");
  g.addColorStop(1,    AMBER + "0)");
  ctx.strokeStyle = g; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, base);
  ctx.lineTo(W, base);
  ctx.strokeStyle = MUTED + "0.12)";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.font = `9px "JetBrains Mono", monospace`;
  ctx.fillStyle = MUTED + "0.35)";
  ctx.fillText("wavenumber (cm\u207b\u00b9)", 8, H - 4);
  ctx.textAlign = "right";
  ctx.fillText("absorbance", W - 8, 14);
  ctx.textAlign = "left";
}

function drawSpektron(ctx: CanvasRenderingContext2D, W: number, H: number, t: number): void {
  const cycle  = (t * 0.0003) % 1;
  const loss   = 0.08 + 2.32 * Math.exp(-4 * cycle) + Math.sin(t * 0.003) * 0.015;
  const r2     = 0.95 / (1 + Math.exp(-10 * (cycle - 0.45)));
  const pad = 16;
  const bW  = W - pad * 2;
  const row1 = H * 0.30;
  const row2 = H * 0.62;
  const barH = H * 0.12;
  const lossNorm = Math.min(loss / 2.5, 1);
  ctx.fillStyle = MUTED + "0.12)";
  ctx.fillRect(pad, row1, bW, barH);
  ctx.fillStyle = AMBER + "0.50)";
  ctx.fillRect(pad, row1, bW * lossNorm, barH);
  ctx.fillStyle = MUTED + "0.12)";
  ctx.fillRect(pad, row2, bW, barH);
  ctx.fillStyle = TEAL + "0.55)";
  ctx.fillRect(pad, row2, bW * r2, barH);
  ctx.font = `${Math.max(9, H * 0.08)}px "JetBrains Mono", monospace`;
  ctx.fillStyle = MUTED + "0.5)";
  ctx.fillText("loss", pad, row1 - 5);
  ctx.fillText("R\u00b2", pad, row2 - 5);
  ctx.fillStyle = AMBER + "0.7)";
  ctx.textAlign = "right";
  ctx.fillText(loss.toFixed(3), W - pad, row1 - 5);
  ctx.fillStyle = TEAL + "0.75)";
  ctx.fillText(r2.toFixed(3), W - pad, row2 - 5);
  ctx.textAlign = "left";
  const histY = H * 0.85;
  const histH = H * 0.10;
  ctx.beginPath();
  for (let i = 0; i <= 100; i++) {
    const xi = i / 100;
    const yi = 0.95 / (1 + Math.exp(-10 * (xi - 0.45)));
    const sx = pad + xi * bW;
    const sy = histY - yi * histH;
    i === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy);
  }
  ctx.strokeStyle = TEAL + "0.3)";
  ctx.lineWidth = 1;
  ctx.stroke();
  const dotX = pad + cycle * bW;
  const dotY = histY - r2 * histH;
  ctx.beginPath();
  ctx.arc(dotX, dotY, 3, 0, Math.PI * 2);
  ctx.fillStyle = TEAL + "0.8)";
  ctx.fill();
}

function drawReactorTwin(ctx: CanvasRenderingContext2D, W: number, H: number, t: number): void {
  const N    = 80;
  const pad  = 16;
  const base = H - pad;
  const amp  = H - pad * 2.5;
  const k    = 0.8;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  for (let i = 0; i <= N; i++) {
    const x   = i / N;
    const cA  = Math.exp(-k * x * 3);
    const sx  = pad + x * (W - pad * 2);
    const sy  = base - cA * amp;
    i === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy);
  }
  ctx.strokeStyle = AMBER + "0.55)"; ctx.stroke();
  ctx.beginPath();
  for (let i = 0; i <= N; i++) {
    const x   = i / N;
    const cB  = 1 - Math.exp(-k * x * 3);
    const sx  = pad + x * (W - pad * 2);
    const sy  = base - cB * amp;
    i === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy);
  }
  ctx.strokeStyle = TEAL + "0.55)"; ctx.stroke();
  const cursor = ((t * 0.0002) % 1);
  const cx     = pad + cursor * (W - pad * 2);
  ctx.beginPath();
  ctx.moveTo(cx, pad);
  ctx.lineTo(cx, base);
  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.font = `${Math.max(9, H * 0.08)}px "JetBrains Mono", monospace`;
  ctx.fillStyle = AMBER + "0.55)";
  ctx.fillText("[A] substrate", pad + 4, pad + H * 0.14);
  ctx.fillStyle = TEAL + "0.55)";
  ctx.fillText("[B] product", pad + 4, base - 4);
  ctx.fillStyle = MUTED + "0.3)";
  ctx.textAlign = "right";
  const axisLabelY = base + 12 > H ? H - 2 : base + 12;
  ctx.fillText("residence time \u2192", W - pad, axisLabelY);
  ctx.textAlign = "left";
}

function drawSpectraView(ctx: CanvasRenderingContext2D, W: number, H: number, t: number): void {
  const peaks: [number, number][] = [
    [0.18, 0.42], [0.30, 0.60], [0.47, 0.55], [0.60, 1.0],
    [0.72, 0.70], [0.84, 0.40], [0.92, 0.33],
  ];
  const N    = W * 2;
  const base = H * 0.85;
  const amp  = H * 0.72;
  ctx.beginPath();
  for (let i = 0; i <= N; i++) {
    const x = i / N;
    let y = 0;
    for (const [c, h] of peaks) y += lorentz(x, c, 0.04) * h;
    const sx = (i / N) * W;
    const sy = base - Math.min(y, 1) * amp;
    i === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy);
  }
  ctx.strokeStyle = MUTED + "0.25)"; ctx.lineWidth = 1; ctx.stroke();
  const scanIdx = Math.floor((t * 0.0008) % peaks.length);
  const [sc, sh] = peaks[scanIdx];
  const pw = 0.07;
  ctx.beginPath();
  let started = false;
  for (let i = 0; i <= N; i++) {
    const x   = i / N;
    const v   = Math.min(lorentz(x, sc, 0.04) * sh, 1);
    const env = Math.max(0, 1 - Math.abs(x - sc) / pw);
    if (env > 0) {
      const sx = (i / N) * W;
      const sy = base - v * amp;
      if (!started) { ctx.moveTo(sx, sy); started = true; }
      else ctx.lineTo(sx, sy);
    }
  }
  ctx.strokeStyle = AMBER + "0.75)"; ctx.lineWidth = 2; ctx.stroke();
  const px = sc * W;
  const py = base - sh * amp;
  const gr = ctx.createRadialGradient(px, py, 0, px, py, 14);
  gr.addColorStop(0, AMBER + "0.7)");
  gr.addColorStop(1, AMBER + "0)");
  ctx.beginPath(); ctx.arc(px, py, 14, 0, Math.PI * 2);
  ctx.fillStyle = gr; ctx.fill();
  const freqLabels = ["3045", "2820", "1715", "1595", "1490", "1180", "875"];
  ctx.font = `9px "JetBrains Mono", monospace`;
  ctx.fillStyle = AMBER + "0.5)";
  ctx.textAlign = "center";
  ctx.fillText(freqLabels[scanIdx] + " cm\u207b\u00b9", px, py - 12);
  ctx.textAlign = "left";
  ctx.beginPath();
  ctx.moveTo(0, base);
  ctx.lineTo(W, base);
  ctx.strokeStyle = MUTED + "0.10)";
  ctx.lineWidth = 1;
  ctx.stroke();
}

// ── Canvas component ──────────────────────────────────────────────────────────

interface ProjectCanvasProps {
  vizKind: VizKind;
  reduced: boolean;
}

function ProjectCanvas({ vizKind, reduced }: ProjectCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);
  const visRef    = useRef<boolean>(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const setup = () => {
      const dpr = window.devicePixelRatio || 1;
      const W   = canvas.offsetWidth;
      const H   = canvas.offsetHeight;
      canvas.width  = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    setup();

    const ro = new ResizeObserver(setup);
    ro.observe(canvas);

    const draw = (t: number) => {
      const W = canvas.offsetWidth;
      const H = canvas.offsetHeight;
      ctx.clearRect(0, 0, W, H);
      switch (vizKind) {
        case "spectrakit":  drawSpectraKit(ctx, W, H, t);  break;
        case "spektron":    drawSpektron(ctx, W, H, t);    break;
        case "reactortwin": drawReactorTwin(ctx, W, H, t); break;
        case "spectraview": drawSpectraView(ctx, W, H, t); break;
      }
    };

    if (reduced) {
      draw(0);
      ro.disconnect();
      return;
    }

    const loop = (t: number) => {
      if (visRef.current) draw(t);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    const io = new IntersectionObserver(
      ([entry]) => { visRef.current = entry.isIntersecting; },
      { threshold: 0 },
    );
    io.observe(canvas);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      io.disconnect();
    };
  }, [vizKind, reduced]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full block"
      style={{ height: 192 }}
      aria-hidden="true"
    />
  );
}

// ── Terminal component ────────────────────────────────────────────────────────

interface TerminalProps {
  lines: string[];
  statusColor: string;
  reduced: boolean;
}

function Terminal({ lines, statusColor, reduced }: TerminalProps) {
  // Each entry: { text: string, done: boolean }
  // We type char by char per line, then reveal next line.
  const [visibleLines, setVisibleLines] = useState<string[]>([]);
  const [cursorCol, setCursorCol]       = useState<number>(0);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    setVisibleLines([]);
    setCursorCol(0);

    if (reduced) {
      setVisibleLines(lines);
      setCursorCol(-1);
      return;
    }

    let lineIdx = 0;
    let charIdx = 0;

    const typeLine = () => {
      if (lineIdx >= lines.length) {
        setCursorCol(-1);
        return;
      }
      const line = lines[lineIdx];
      if (charIdx === 0) {
        setVisibleLines((prev) => [...prev, ""]);
      }
      if (line === "") {
        // empty line — advance after a short pause
        lineIdx++;
        charIdx = 0;
        const t = setTimeout(typeLine, 80);
        timersRef.current.push(t);
        return;
      }
      if (charIdx < line.length) {
        const captured = { lineIdx, charIdx };
        setVisibleLines((prev) => {
          const next = [...prev];
          next[captured.lineIdx] = line.slice(0, captured.charIdx + 1);
          return next;
        });
        setCursorCol(charIdx + 1);
        charIdx++;
        const t = setTimeout(typeLine, 18);
        timersRef.current.push(t);
      } else {
        // line done, move to next
        lineIdx++;
        charIdx = 0;
        const t = setTimeout(typeLine, 120);
        timersRef.current.push(t);
      }
    };

    const t0 = setTimeout(typeLine, 80);
    timersRef.current.push(t0);

    return () => {
      timersRef.current.forEach(clearTimeout);
    };
  }, [lines, reduced]);

  const lastLineIdx = visibleLines.length - 1;

  return (
    <div
      className="mt-2 rounded-lg bg-[#080808] border border-border p-3 font-mono text-[11px] min-h-[120px]"
      aria-label="terminal output"
    >
      {lines.map((originalLine, lineIdx) => {
        const visible = visibleLines[lineIdx];
        if (visible === undefined) return null;

        const isCommand = originalLine.startsWith("$");
        const isLast    = lineIdx === lines.length - 1;
        const isActive  = lineIdx === lastLineIdx && cursorCol >= 0;

        if (originalLine === "") {
          return <div key={lineIdx} className="h-[1.4em]" />;
        }

        return (
          <div key={lineIdx} className="leading-[1.6]">
            <span
              style={{
                color: isLast
                  ? statusColor
                  : isCommand
                  ? "#34D399"
                  : "#888888",
              }}
            >
              {visible}
            </span>
            {isActive && (
              <span
                className="inline-block w-[7px] h-[1em] ml-px translate-y-[1px]"
                style={{
                  backgroundColor: "#C9A04A",
                  animation: "blink 1s step-end infinite",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Install command row ───────────────────────────────────────────────────────

function InstallRow({ command }: { command: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      const t = setTimeout(() => setCopied(false), 1500);
      return () => clearTimeout(t);
    } catch {
      // clipboard unavailable
    }
  }, [command]);

  return (
    <div className="bg-[#0a0a0a] border border-border rounded-lg px-3 py-2 font-mono text-[11px] text-accent flex items-center justify-between mt-3">
      <span>{command}</span>
      <button
        onClick={handleCopy}
        className="ml-3 text-[10px] text-text-muted hover:text-text-primary transition-colors select-none shrink-0"
        aria-label="Copy install command"
      >
        {copied ? "\u2713" : "copy"}
      </button>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ProjectShowcase() {
  const [activeIdx, setActiveIdx]   = useState<number>(0);
  const [opacity, setOpacity]       = useState<number>(1);
  const [displayIdx, setDisplayIdx] = useState<number>(0);
  const reducedRef = useRef<boolean>(false);

  useEffect(() => {
    reducedRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  const handleTabClick = useCallback(
    (idx: number) => {
      if (idx === activeIdx) return;
      if (reducedRef.current) {
        setActiveIdx(idx);
        setDisplayIdx(idx);
        return;
      }
      setOpacity(0);
      const t = setTimeout(() => {
        setActiveIdx(idx);
        setDisplayIdx(idx);
        setOpacity(1);
      }, 180);
      return () => clearTimeout(t);
    },
    [activeIdx],
  );

  const project = PROJECTS[displayIdx];
  const reduced = reducedRef.current;

  return (
    <div className="w-full">
      {/* Tab strip */}
      <div className="relative border-b border-border">
        <div className="flex">
          {PROJECTS.map((p, i) => (
            <button
              key={p.num}
              onClick={() => handleTabClick(i)}
              className="flex-1 py-2.5 px-1 text-[12px] font-mono transition-colors duration-150 relative"
              style={{
                color: activeIdx === i ? "#C9A04A" : "#555555",
              }}
            >
              {p.name}
            </button>
          ))}
        </div>
        {/* Sliding amber underline */}
        <div
          className="absolute bottom-0 h-[2px] bg-accent"
          style={{
            width: "25%",
            transform: `translateX(calc(${activeIdx} * 100%))`,
            transition: "transform 220ms cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        />
      </div>

      {/* Main panel */}
      <div
        className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6"
        style={{
          opacity,
          transition: reducedRef.current ? "none" : "opacity 180ms ease",
        }}
      >
        {/* Left: project info */}
        <div className="flex flex-col gap-3">
          {/* Number */}
          <span className="font-mono text-[32px] font-bold leading-none text-text-faint select-none">
            {project.num}
          </span>

          {/* Name + version + status */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-2xl font-heading font-semibold text-text-primary">
              {project.name}
            </span>
            <span className="text-[11px] font-mono text-text-muted border border-border rounded-full px-2 py-0.5">
              {project.version}
            </span>
            <span className="flex items-center gap-1.5 text-[11px] font-mono" style={{ color: project.statusColor }}>
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{ backgroundColor: project.statusColor }}
              />
              {project.status}
            </span>
          </div>

          {/* Description */}
          <p className="text-[13px] text-text-secondary leading-relaxed">
            {project.description}
          </p>

          {/* Install command */}
          {project.install && <InstallRow command={project.install} />}

          {/* Stats row */}
          <div className="flex flex-wrap gap-2 mt-1">
            {project.stats.map((s) => (
              <span
                key={s.label}
                className="text-[10px] font-mono text-text-muted border border-border rounded-full px-2.5 py-0.5"
              >
                {s.value} {s.label}
              </span>
            ))}
          </div>

          {/* Link */}
          <a
            href={project.href}
            className="mt-auto text-[12px] font-mono text-accent hover:text-accent-bright transition-colors"
          >
            View project \u2192
          </a>
        </div>

        {/* Right: canvas + terminal */}
        <div className="flex flex-col">
          <div className="rounded-lg overflow-hidden border border-border bg-[#0a0a0a]">
            <ProjectCanvas vizKind={project.vizKind} reduced={reduced} />
          </div>
          <Terminal
            key={displayIdx}
            lines={project.terminalLines}
            statusColor={project.statusColor}
            reduced={reduced}
          />
        </div>
      </div>

      {/* blink keyframe */}
      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
