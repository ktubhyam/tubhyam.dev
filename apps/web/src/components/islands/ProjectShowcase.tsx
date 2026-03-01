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
    [[0.18, 0.50], [0.42, 0.88], [0.63, 0.65], [0.81, 0.38]],
    [[0.22, 0.60], [0.38, 0.82], [0.60, 1.00], [0.76, 0.45]],
    [[0.28, 0.42], [0.53, 0.72], [0.68, 0.95], [0.85, 0.33]],
  ] as [number, number][][];
  const CYCLE = 5500;
  const phase  = (t % (CYCLE * mols.length)) / CYCLE;
  const molIdx = Math.floor(phase) % mols.length;
  const blend  = phase - Math.floor(phase);
  const m1     = mols[molIdx];
  const m2     = mols[(molIdx + 1) % mols.length];
  const N    = Math.floor(W) * 2;
  const base = H * 0.80;
  const amp  = H * 0.68;

  // Gradient fill under spectrum
  ctx.beginPath();
  for (let i = 0; i <= N; i++) {
    const x = i / N;
    let y1 = 0, y2 = 0;
    for (const [c, h] of m1) y1 += lorentz(x, c, 0.032) * h;
    for (const [c, h] of m2) y2 += lorentz(x, c, 0.032) * h;
    const v = Math.min((y1 * (1 - blend) + y2 * blend) * 0.92, 1);
    const sx = (i / N) * W;
    const sy = base - v * amp;
    i === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy);
  }
  ctx.lineTo(W, base); ctx.lineTo(0, base); ctx.closePath();
  const fill = ctx.createLinearGradient(0, H * 0.10, 0, base);
  fill.addColorStop(0, AMBER + "0.18)");
  fill.addColorStop(1, AMBER + "0.01)");
  ctx.fillStyle = fill; ctx.fill();

  // Main spectrum curve
  ctx.beginPath();
  for (let i = 0; i <= N; i++) {
    const x = i / N;
    let y1 = 0, y2 = 0;
    for (const [c, h] of m1) y1 += lorentz(x, c, 0.032) * h;
    for (const [c, h] of m2) y2 += lorentz(x, c, 0.032) * h;
    const v = Math.min((y1 * (1 - blend) + y2 * blend) * 0.92, 1);
    const sx = (i / N) * W;
    const sy = base - v * amp;
    i === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy);
  }
  const grad = ctx.createLinearGradient(0, 0, W, 0);
  grad.addColorStop(0,    AMBER + "0)");
  grad.addColorStop(0.10, AMBER + "0.80)");
  grad.addColorStop(0.90, AMBER + "0.80)");
  grad.addColorStop(1,    AMBER + "0)");
  ctx.strokeStyle = grad; ctx.lineWidth = 1.5; ctx.stroke();

  // Vertical scan line sweeping across
  const scanX = ((t * 0.00013) % 1) * W;
  ctx.beginPath();
  ctx.moveTo(scanX, 0); ctx.lineTo(scanX, base);
  ctx.strokeStyle = TEAL + "0.15)"; ctx.lineWidth = 1; ctx.stroke();

  // Scan-spectrum intersection glow
  const scanFrac = scanX / W;
  let scanY1 = 0, scanY2 = 0;
  for (const [c, h] of m1) scanY1 += lorentz(scanFrac, c, 0.032) * h;
  for (const [c, h] of m2) scanY2 += lorentz(scanFrac, c, 0.032) * h;
  const scanV = Math.min((scanY1 * (1 - blend) + scanY2 * blend) * 0.92, 1);
  const scanPy = base - scanV * amp;
  const gr = ctx.createRadialGradient(scanX, scanPy, 0, scanX, scanPy, 12);
  gr.addColorStop(0, TEAL + "0.50)"); gr.addColorStop(1, TEAL + "0)");
  ctx.beginPath(); ctx.arc(scanX, scanPy, 12, 0, Math.PI * 2);
  ctx.fillStyle = gr; ctx.fill();

  // Peak markers: dots + wavenumber labels near scan
  const peaks = m1.map(([c, h], pi): [number, number] => [
    c * (1 - blend) + (m2[pi]?.[0] ?? c) * blend,
    h * (1 - blend) + (m2[pi]?.[1] ?? h) * blend,
  ]);
  const peakLabels = ["1710", "2850", "3040", "1490"];
  for (let pi = 0; pi < peaks.length; pi++) {
    const [pc, ph] = peaks[pi];
    if (ph < 0.30) continue;
    const px = pc * W;
    const py = base - ph * 0.92 * amp;
    const nearScan = Math.abs(scanX - px) < W * 0.06;
    ctx.beginPath();
    ctx.arc(px, py, nearScan ? 3.5 : 2, 0, Math.PI * 2);
    ctx.fillStyle = AMBER + (nearScan ? "0.90)" : "0.40)");
    ctx.fill();
    if (nearScan) {
      ctx.font = `8px "JetBrains Mono", monospace`;
      ctx.fillStyle = AMBER + "0.70)";
      ctx.textAlign = "center";
      ctx.fillText(peakLabels[pi] ?? "", px, py - 9);
    }
  }
  ctx.textAlign = "left";

  // X axis
  ctx.beginPath(); ctx.moveTo(0, base); ctx.lineTo(W, base);
  ctx.strokeStyle = MUTED + "0.15)"; ctx.lineWidth = 1; ctx.stroke();

  // Axis labels
  ctx.font = `9px "JetBrains Mono", monospace`;
  ctx.fillStyle = MUTED + "0.30)";
  ctx.fillText("cm\u207b\u00b9", 8, H - 4);
  ctx.textAlign = "right";
  ctx.fillStyle = AMBER + "0.38)";
  ctx.fillText("absorbance", W - 8, 14);
  ctx.textAlign = "left";
}

function drawSpektron(ctx: CanvasRenderingContext2D, W: number, H: number, t: number): void {
  const ARCHS = [
    { name: "D-LinOSS", r2: 0.913, color: AMBER },
    { name: "Mamba",    r2: 0.891, color: TEAL },
    { name: "Transf.",  r2: 0.876, color: "rgba(167,139,250," },
    { name: "S4D",      r2: 0.858, color: "rgba(52,211,153," },
    { name: "CNN",      r2: 0.812, color: MUTED },
  ];
  const CYCLE = 9000;
  const progress = (t % CYCLE) / CYCLE;
  const epoch = Math.floor(progress * 100);

  const pad = { l: 56, r: 10, t: 18, b: 16 };
  const usableW = W - pad.l - pad.r;
  const usableH = H - pad.t - pad.b;
  const rowH  = usableH / ARCHS.length;
  const barH  = Math.min(11, rowH * 0.52);
  const R2_MIN = 0.78;

  // Epoch counter
  ctx.font = `9px "JetBrains Mono", monospace`;
  ctx.fillStyle = MUTED + "0.30)";
  ctx.textAlign = "right";
  ctx.fillText(`epoch ${epoch}/100`, W - pad.r, pad.t - 4);
  ctx.textAlign = "left";

  // Reference grid lines
  for (const mark of [0.80, 0.85, 0.90, 0.95]) {
    const x = pad.l + ((mark - R2_MIN) / (1 - R2_MIN)) * usableW;
    ctx.beginPath();
    ctx.moveTo(x, pad.t); ctx.lineTo(x, H - pad.b);
    ctx.strokeStyle = MUTED + "0.07)"; ctx.lineWidth = 1; ctx.stroke();
    ctx.font = `7px "JetBrains Mono", monospace`;
    ctx.fillStyle = MUTED + "0.20)";
    ctx.textAlign = "center";
    ctx.fillText(mark.toFixed(2), x, H - 2);
  }
  ctx.textAlign = "left";

  // Architecture bars
  for (let i = 0; i < ARCHS.length; i++) {
    const { name, r2, color } = ARCHS[i];
    const y = pad.t + i * rowH + (rowH - barH) / 2;

    // Staggered start + ease-out fill
    const start = i * 0.07;
    const span  = Math.max(0.01, 0.72 - start);
    const raw   = Math.max(0, Math.min(1, (progress - start) / span));
    const eased = 1 - Math.pow(1 - raw, 3);
    const curR2 = R2_MIN + (r2 - R2_MIN) * eased;
    const barW  = ((curR2 - R2_MIN) / (1 - R2_MIN)) * usableW;

    // Track
    ctx.fillStyle = MUTED + "0.08)";
    ctx.fillRect(pad.l, y, usableW, barH);

    // Filled bar with per-arch glow
    ctx.fillStyle = color + (i === 0 ? "0.70)" : "0.45)");
    ctx.fillRect(pad.l, y, Math.max(0, barW), barH);

    // Leading edge glow
    if (barW > 2) {
      const glow = ctx.createLinearGradient(pad.l + barW - 8, 0, pad.l + barW, 0);
      glow.addColorStop(0, color + "0)");
      glow.addColorStop(1, color + (i === 0 ? "0.80)" : "0.55)"));
      ctx.fillStyle = glow;
      ctx.fillRect(pad.l + barW - 8, y, 8, barH);
    }

    // Arch name
    ctx.font = `9px "JetBrains Mono", monospace`;
    ctx.fillStyle = i === 0 ? AMBER + "0.80)" : MUTED + "0.50)";
    ctx.textAlign = "right";
    ctx.fillText(name, pad.l - 3, y + barH * 0.82);

    // R² value
    if (eased > 0.05) {
      ctx.textAlign = "left";
      ctx.fillStyle = color + (i === 0 ? "0.80)" : "0.55)");
      const vx = Math.min(pad.l + barW + 3, W - pad.r - 32);
      ctx.fillText(curR2.toFixed(3), vx, y + barH * 0.82);
    }
  }
  ctx.textAlign = "left";
}

function drawReactorTwin(ctx: CanvasRenderingContext2D, W: number, H: number, t: number): void {
  const N   = 80;
  const pl  = 12, pr = 12, pt = 18, pb = 20;
  const uW  = W - pl - pr;
  const uH  = H - pt - pb;
  const base = H - pb;
  const k   = 0.8;

  // Temperature heatmap background (cool left → warm right)
  const heat = ctx.createLinearGradient(pl, 0, W - pr, 0);
  heat.addColorStop(0, "rgba(78,205,196,0.04)");
  heat.addColorStop(1, "rgba(201,160,74,0.06)");
  ctx.fillStyle = heat;
  ctx.fillRect(pl, pt, uW, uH);

  // Seeded noise for scatter dots (deterministic per-call)
  const srng = (i: number): number => {
    const x = Math.sin(i * 127.1 + 43758.5) * 43758.5;
    return x - Math.floor(x);
  };

  // [A] and [B] — solid lines (true solution)
  for (let pass = 0; pass < 2; pass++) {
    const isB = pass === 1;
    ctx.beginPath();
    for (let i = 0; i <= N; i++) {
      const x  = i / N;
      const c  = isB ? 1 - Math.exp(-k * x * 3) : Math.exp(-k * x * 3);
      const sx = pl + x * uW;
      const sy = base - c * uH;
      i === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy);
    }
    ctx.strokeStyle = (isB ? TEAL : AMBER) + "0.65)";
    ctx.lineWidth = 1.8;
    ctx.stroke();
  }

  // Neural ODE twin — dashed, nearly identical (kNN shows match quality)
  const kNN = k * 1.004;
  ctx.setLineDash([4, 3]);
  for (let pass = 0; pass < 2; pass++) {
    const isB = pass === 1;
    ctx.beginPath();
    for (let i = 0; i <= N; i++) {
      const x  = i / N;
      const c  = isB ? 1 - Math.exp(-kNN * x * 3) : Math.exp(-kNN * x * 3);
      const sx = pl + x * uW;
      const sy = base - c * uH;
      i === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy);
    }
    ctx.strokeStyle = (isB ? TEAL : AMBER) + "0.28)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // Scatter measurement dots
  for (let di = 0; di < 13; di++) {
    const xf   = srng(di * 2) * 0.88 + 0.06;
    const noise = (srng(di * 2 + 1) - 0.5) * 0.05;
    const cA = Math.max(0, Math.exp(-k * xf * 3) + noise);
    const cB = Math.max(0, 1 - Math.exp(-k * xf * 3) - noise);
    const sx = pl + xf * uW;
    ctx.beginPath();
    ctx.arc(sx, base - cA * uH, 2, 0, Math.PI * 2);
    ctx.fillStyle = AMBER + "0.55)"; ctx.fill();
    ctx.beginPath();
    ctx.arc(sx, base - cB * uH, 2, 0, Math.PI * 2);
    ctx.fillStyle = TEAL + "0.55)"; ctx.fill();
  }

  // Animated cursor (operating point)
  const cur  = ((t * 0.00016) % 1);
  const cx   = pl + cur * uW;
  const cA   = Math.exp(-k * cur * 3);
  const cB   = 1 - Math.exp(-k * cur * 3);
  ctx.beginPath();
  ctx.moveTo(cx, pt); ctx.lineTo(cx, base);
  ctx.strokeStyle = "rgba(255,255,255,0.07)"; ctx.lineWidth = 1; ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, base - cA * uH, 3.5, 0, Math.PI * 2);
  ctx.fillStyle = AMBER + "0.90)"; ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, base - cB * uH, 3.5, 0, Math.PI * 2);
  ctx.fillStyle = TEAL + "0.90)"; ctx.fill();

  // Labels
  ctx.font = `9px "JetBrains Mono", monospace`;
  ctx.fillStyle = AMBER + "0.60)";
  ctx.fillText("[A]", pl + 4, pt + 12);
  ctx.fillStyle = TEAL + "0.60)";
  ctx.fillText("[B]", pl + 4, base - 6);
  ctx.fillStyle = MUTED + "0.22)";
  ctx.textAlign = "right";
  ctx.fillText("1500\u00d7 speedup", W - pr, pt + 12);
  ctx.textAlign = "left";

  // X axis
  ctx.beginPath(); ctx.moveTo(pl, base); ctx.lineTo(W - pr, base);
  ctx.strokeStyle = MUTED + "0.12)"; ctx.lineWidth = 1; ctx.stroke();
  ctx.fillStyle = MUTED + "0.22)";
  ctx.fillText("residence time \u2192", pl, H - 3);
}

function drawSpectraView(ctx: CanvasRenderingContext2D, W: number, H: number, t: number): void {
  // Three spectral components that decompose into the composite
  const COMP_COLORS = [AMBER, TEAL, "rgba(167,139,250,"] as const;
  const COMP_PEAKS: [number, number][][] = [
    [[0.20, 0.50], [0.38, 0.70]],
    [[0.55, 1.00], [0.67, 0.65]],
    [[0.78, 0.62], [0.88, 0.38], [0.94, 0.28]],
  ];
  const N    = Math.floor(W) * 2;
  const base = H * 0.82;
  const amp  = H * 0.68;

  // Sequential component reveal (10 s cycle)
  const CYCLE = 10000;
  const prog  = (t % CYCLE) / CYCLE;

  // Draw component fills + curves sequentially
  for (let ci = 0; ci < 3; ci++) {
    const compProg = Math.max(0, Math.min(1, (prog - ci * 0.16) / 0.16));
    if (compProg <= 0) continue;
    const color = COMP_COLORS[ci];
    const peaks = COMP_PEAKS[ci];

    // Fill
    ctx.beginPath();
    for (let i = 0; i <= N; i++) {
      const x = i / N;
      let y = 0;
      for (const [c, h] of peaks) y += lorentz(x, c, 0.036) * h;
      const sx = (i / N) * W;
      const sy = base - Math.min(y, 1) * amp * compProg;
      i === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy);
    }
    ctx.lineTo(W, base); ctx.lineTo(0, base); ctx.closePath();
    const fg = ctx.createLinearGradient(0, 0, 0, base);
    fg.addColorStop(0, color + (0.15 * compProg).toFixed(2) + ")");
    fg.addColorStop(1, color + "0)");
    ctx.fillStyle = fg; ctx.fill();

    // Curve
    ctx.beginPath();
    for (let i = 0; i <= N; i++) {
      const x = i / N;
      let y = 0;
      for (const [c, h] of peaks) y += lorentz(x, c, 0.036) * h;
      const sx = (i / N) * W;
      const sy = base - Math.min(y, 1) * amp * compProg;
      i === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy);
    }
    ctx.strokeStyle = color + (0.65 * compProg).toFixed(2) + ")";
    ctx.lineWidth = 1.3; ctx.stroke();
  }

  // Composite spectrum (sum of all 3)
  ctx.beginPath();
  for (let i = 0; i <= N; i++) {
    const x = i / N;
    let y = 0;
    for (const peaks of COMP_PEAKS)
      for (const [c, h] of peaks) y += lorentz(x, c, 0.036) * h;
    const sx = (i / N) * W;
    const sy = base - Math.min(y / 1.6, 1) * amp;
    i === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy);
  }
  ctx.strokeStyle = MUTED + "0.22)"; ctx.lineWidth = 1; ctx.stroke();

  // Scanning peak glow
  const allPeaks = COMP_PEAKS.flat();
  const si = Math.floor((t * 0.00055) % allPeaks.length);
  const [sc] = allPeaks[si];
  let sy = 0;
  for (const peaks of COMP_PEAKS)
    for (const [c, h] of peaks) sy += lorentz(sc, c, 0.036) * h;
  const px = sc * W;
  const py = base - Math.min(sy / 1.6, 1) * amp;
  const gr = ctx.createRadialGradient(px, py, 0, px, py, 16);
  gr.addColorStop(0, AMBER + "0.65)"); gr.addColorStop(1, AMBER + "0)");
  ctx.beginPath(); ctx.arc(px, py, 16, 0, Math.PI * 2);
  ctx.fillStyle = gr; ctx.fill();
  ctx.beginPath(); ctx.arc(px, py, 3, 0, Math.PI * 2);
  ctx.fillStyle = AMBER + "0.90)"; ctx.fill();

  // Wavenumber at scan point
  const freqs = ["1490", "1180", "1715", "1595", "875", "3045", "2820", "690"];
  ctx.font = `8px "JetBrains Mono", monospace`;
  ctx.fillStyle = AMBER + "0.65)"; ctx.textAlign = "center";
  ctx.fillText((freqs[si % freqs.length]) + " cm\u207b\u00b9", px, py - 12);

  // Component legend (top-right)
  const legNames = ["C\u2081", "C\u2082", "C\u2083"];
  for (let ci = 0; ci < 3; ci++) {
    const lx = W - 10 - (2 - ci) * 28;
    ctx.beginPath(); ctx.arc(lx, 10, 4, 0, Math.PI * 2);
    ctx.fillStyle = COMP_COLORS[ci] + "0.65)"; ctx.fill();
    ctx.fillStyle = COMP_COLORS[ci] + "0.55)";
    ctx.fillText(legNames[ci], lx + 7, 14);
  }
  ctx.textAlign = "left";

  // X axis
  ctx.beginPath(); ctx.moveTo(0, base); ctx.lineTo(W, base);
  ctx.strokeStyle = MUTED + "0.10)"; ctx.lineWidth = 1; ctx.stroke();
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
