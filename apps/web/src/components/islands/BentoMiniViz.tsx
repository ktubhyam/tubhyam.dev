/**
 * BentoMiniViz — Small canvas visualizations embedded in project bento cards.
 * Each `kind` tells a different story about the project.
 *
 * spectrakit  — scrolling spectrum waveform cycling through molecules
 * spektron    — training run: loss dropping, R² climbing
 * reactortwin — reactor: substrate → product concentration curves
 * spectraview — spectrum with a scanning highlighted peak
 */
import { useEffect, useRef } from "react";

export type BentoKind = "spectrakit" | "spektron" | "reactortwin" | "spectraview";

const AMBER = "rgba(201,160,74,";
const TEAL  = "rgba(78,205,196,";
const MUTED = "rgba(136,136,136,";

function lorentz(x: number, c: number, w: number) {
  return 1 / (1 + ((x - c) / w) ** 2);
}

// ── SpectraKit: scrolling spectrum that morphs between 3 molecules ──────────
function drawSpectraKit(ctx: CanvasRenderingContext2D, W: number, H: number, t: number) {
  const mols = [
    [[0.22,0.45],[0.50,0.90],[0.65,0.60],[0.82,0.35]],  // benzaldehyde
    [[0.18,0.55],[0.40,0.80],[0.62,1.00],[0.78,0.42]],  // acetone-ish
    [[0.30,0.40],[0.55,0.70],[0.70,0.95],[0.87,0.30]],  // methanol-ish
  ] as [number,number][][];
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
  ctx.strokeStyle = g; ctx.lineWidth = 1.2; ctx.stroke();
}

// ── Spektron: loss bar + R² meter ────────────────────────────────────────────
function drawSpektron(ctx: CanvasRenderingContext2D, W: number, H: number, t: number) {
  // Simulate a training run: oscillates so it looks live
  const cycle  = (t * 0.0003) % 1;
  // Loss: 2.4 → 0.08 (log-ish decay)
  const loss   = 0.08 + 2.32 * Math.exp(-4 * cycle) + Math.sin(t * 0.003) * 0.015;
  // R²: 0 → 0.95 (sigmoid-ish)
  const r2     = 0.95 / (1 + Math.exp(-10 * (cycle - 0.45)));

  const pad = 12;
  const bW  = W - pad * 2;
  const row1 = H * 0.35;
  const row2 = H * 0.72;
  const barH = H * 0.14;

  // Loss bar (amber, decreasing)
  const lossNorm = Math.min(loss / 2.5, 1);
  ctx.fillStyle = MUTED + "0.12)";
  ctx.fillRect(pad, row1, bW, barH);
  ctx.fillStyle = AMBER + "0.50)";
  ctx.fillRect(pad, row1, bW * lossNorm, barH);

  // R² bar (teal, increasing)
  ctx.fillStyle = MUTED + "0.12)";
  ctx.fillRect(pad, row2, bW, barH);
  ctx.fillStyle = TEAL + "0.55)";
  ctx.fillRect(pad, row2, bW * r2, barH);

  // Labels
  ctx.font = `${Math.max(8, H * 0.18)}px "JetBrains Mono", monospace`;
  ctx.fillStyle = MUTED + "0.5)";
  ctx.fillText("loss", pad, row1 - 3);
  ctx.fillText("R²", pad, row2 - 3);

  ctx.fillStyle = AMBER + "0.7)";
  ctx.textAlign = "right";
  ctx.fillText(loss.toFixed(3), W - pad, row1 - 3);

  ctx.fillStyle = TEAL + "0.75)";
  ctx.fillText(r2.toFixed(3), W - pad, row2 - 3);
  ctx.textAlign = "left";
}

// ── ReactorTwin: substrate [A] falling, product [B] rising ──────────────────
function drawReactorTwin(ctx: CanvasRenderingContext2D, W: number, H: number, t: number) {
  const N    = 80;
  const pad  = 8;
  const base = H - pad;
  const amp  = H - pad * 2;
  const k    = 0.8; // rate constant (normalised)

  ctx.lineWidth = 1.3;

  // [A]: C_A = exp(-k*x)
  ctx.beginPath();
  for (let i = 0; i <= N; i++) {
    const x   = i / N;
    const cA  = Math.exp(-k * x * 3);
    const sx  = pad + x * (W - pad * 2);
    const sy  = base - cA * amp;
    i === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy);
  }
  ctx.strokeStyle = AMBER + "0.55)"; ctx.stroke();

  // [B]: C_B = 1 - exp(-k*x)
  ctx.beginPath();
  for (let i = 0; i <= N; i++) {
    const x   = i / N;
    const cB  = 1 - Math.exp(-k * x * 3);
    const sx  = pad + x * (W - pad * 2);
    const sy  = base - cB * amp;
    i === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy);
  }
  ctx.strokeStyle = TEAL + "0.55)"; ctx.stroke();

  // Animated time cursor
  const cursor = ((t * 0.0002) % 1);
  const cx     = pad + cursor * (W - pad * 2);
  ctx.beginPath();
  ctx.moveTo(cx, pad);
  ctx.lineTo(cx, base);
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 1;
  ctx.stroke();

  // Labels [A] [B]
  ctx.font = `${Math.max(8, H * 0.18)}px "JetBrains Mono", monospace`;
  ctx.fillStyle = AMBER + "0.55)";
  ctx.fillText("[A]", W - 28, pad + H * 0.22);
  ctx.fillStyle = TEAL + "0.55)";
  ctx.fillText("[B]", W - 28, H - pad);
}

// ── SpectraView: spectrum with scanning highlighted peak ─────────────────────
function drawSpectraView(ctx: CanvasRenderingContext2D, W: number, H: number, t: number) {
  const peaks: [number, number][] = [
    [0.18,0.42],[0.30,0.60],[0.47,0.55],[0.60,1.0],[0.72,0.70],[0.84,0.40],[0.92,0.33],
  ];
  const N    = W * 2;
  const base = H * 0.85;
  const amp  = H * 0.72;

  // Draw full spectrum (dim)
  ctx.beginPath();
  for (let i = 0; i <= N; i++) {
    const x = i / N;
    let y = 0;
    for (const [c, h] of peaks) y += lorentz(x, c, 0.04) * h;
    const sx = (i / N) * W;
    const sy = base - Math.min(y, 1) * amp;
    i === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy);
  }
  ctx.strokeStyle = MUTED + "0.3)"; ctx.lineWidth = 1; ctx.stroke();

  // Scanning peak highlight: cycle through peaks
  const scanIdx = Math.floor((t * 0.0008) % peaks.length);
  const [sc, sh] = peaks[scanIdx];
  const pw = 0.07;

  ctx.beginPath();
  for (let i = 0; i <= N; i++) {
    const x   = i / N;
    const v   = Math.min(lorentz(x, sc, 0.04) * sh, 1);
    const env = Math.max(0, 1 - Math.abs(x - sc) / pw);
    const sx  = (i / N) * W;
    const sy  = base - v * amp;
    if (env > 0) { i === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy); }
  }
  ctx.strokeStyle = AMBER + "0.75)"; ctx.lineWidth = 1.5; ctx.stroke();

  // Glowing dot at peak apex
  const px = sc * W;
  const py = base - sh * amp;
  const gr = ctx.createRadialGradient(px, py, 0, px, py, 10);
  gr.addColorStop(0, AMBER + "0.8)");
  gr.addColorStop(1, AMBER + "0)");
  ctx.beginPath(); ctx.arc(px, py, 10, 0, Math.PI * 2);
  ctx.fillStyle = gr; ctx.fill();
}

export default function BentoMiniViz({ kind }: { kind: BentoKind }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const raf = useRef(0);
  const visibleRef = useRef(false);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
      switch (kind) {
        case "spectrakit":  drawSpectraKit(ctx, W, H, t);  break;
        case "spektron":    drawSpektron(ctx, W, H, t);    break;
        case "reactortwin": drawReactorTwin(ctx, W, H, t); break;
        case "spectraview": drawSpectraView(ctx, W, H, t); break;
      }
    };

    const startLoop = () => {
      const loop = (t: number) => {
        if (visibleRef.current) draw(t);
        raf.current = requestAnimationFrame(loop);
      };
      raf.current = requestAnimationFrame(loop);
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        visibleRef.current = entry.isIntersecting;
      },
      { threshold: 0 },
    );
    io.observe(canvas);

    if (reduced) { draw(0); }
    else { startLoop(); }

    return () => {
      cancelAnimationFrame(raf.current);
      ro.disconnect();
      io.disconnect();
    };
  }, [kind]);

  return (
    <canvas
      ref={ref}
      className="w-full block"
      style={{ height: 44 }}
      aria-hidden="true"
    />
  );
}
