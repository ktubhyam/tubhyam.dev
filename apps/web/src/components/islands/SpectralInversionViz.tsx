/**
 * SpectralInversionViz — The inverse problem, animated.
 * A scan line sweeps left → right across a canvas showing two spectra:
 *   LEFT  of the line → raw measured IR (amber, slightly noisy)
 *   RIGHT of the line → model-reconstructed Raman (teal, clean)
 * The sweep reveals the reconstruction in real-time — the core of the research.
 * Benzaldehyde IR peaks (B3LYP/def2-TZVP) vs Raman reconstruction.
 */
import { useRef, useEffect } from "react";

const XMIN = 500;
const XMAX = 4000;
const CYCLE_MS = 5200; // one full sweep

const IR_PEAKS = [
  { wn: 3450, w: 120, h: 0.55 },
  { wn: 3065, w:  22, h: 0.22 },
  { wn: 2850, w:  20, h: 0.20 },
  { wn: 1700, w:  16, h: 0.88 },
  { wn: 1600, w:  18, h: 0.32 },
  { wn: 1455, w:  20, h: 0.28 },
  { wn: 1305, w:  16, h: 0.40 },
  { wn: 1170, w:  12, h: 0.26 },
  { wn: 1020, w:  10, h: 0.22 },
  { wn:  840, w:   9, h: 0.42 },
  { wn:  750, w:   8, h: 0.36 },
  { wn:  695, w:   8, h: 0.30 },
];

const RAMAN_PEAKS = [
  { wn: 3067, w: 16, h: 0.20 },
  { wn: 2848, w: 14, h: 0.18 },
  { wn: 1698, w: 12, h: 0.75 },
  { wn: 1597, w: 14, h: 0.30 },
  { wn: 1452, w: 16, h: 0.26 },
  { wn: 1305, w: 14, h: 0.22 },
  { wn: 1170, w: 11, h: 0.20 },
  { wn:  838, w:  6, h: 0.40 },
  { wn:  748, w:  5, h: 0.34 },
];

function lorentzian(x: number, c: number, w: number, h: number): number {
  return h / (1 + ((x - c) / w) ** 2);
}

function smoothstep(t: number): number {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
}

export default function SpectralInversionViz({ className = "" }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef    = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas    = canvasRef.current;
    if (!container || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf    = 0;
    let active = false;

    const PL = 14, PR = 14, PT = 16, PB = 28;

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      canvas!.width  = container!.clientWidth  * dpr;
      canvas!.height = container!.clientHeight * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function buildCurve(W: number, peaks: typeof IR_PEAKS, t: number, noisy: boolean): [number, number][] {
      const pw   = W - PL - PR;
      const pts: [number, number][] = [];
      for (let px = 0; px <= pw; px++) {
        const wn  = XMAX - (px / pw) * (XMAX - XMIN);
        let abs   = 0;
        for (const p of peaks) abs += lorentzian(wn, p.wn, p.w, p.h);
        if (noisy) abs += Math.sin(t * 0.7 + px * 0.06) * 0.025 + Math.sin(t * 1.3 + px * 0.13) * 0.015;
        const tr  = 1 - Math.max(0, Math.min(1, abs));
        pts.push([PL + px, 0 /* filled in draw */ + tr]);
      }
      return pts;
    }

    function draw(ts: number) {
      const t  = ts * 0.001;
      const W  = container!.clientWidth;
      const H  = container!.clientHeight;
      const pw = W - PL - PR;
      const ph = H - PT - PB;

      ctx!.clearRect(0, 0, W, H);

      // Scan position: sweeps 0 → pw, holds at each end briefly
      const phase = (ts % CYCLE_MS) / CYCLE_MS; // 0 → 1
      // Ease in/out — spend 15% paused at ends
      let scanFrac: number;
      if (phase < 0.12) {
        scanFrac = 0;
      } else if (phase < 0.50) {
        scanFrac = smoothstep((phase - 0.12) / 0.38);
      } else if (phase < 0.62) {
        scanFrac = 1;
      } else {
        scanFrac = 1 - smoothstep((phase - 0.62) / 0.38);
      }
      const scanX = PL + scanFrac * pw;

      // Build spectrum point arrays (transmittance, 0–1)
      const irPts    = buildCurve(W, IR_PEAKS,    t, true);
      const ramanPts = buildCurve(W, RAMAN_PEAKS, t, false);

      // Map transmittance → canvas Y
      function pty(tr: number): number { return PT + (1 - tr) * ph; }

      // --- Draw IR spectrum (amber) — LEFT of scan line via clip ---
      ctx!.save();
      ctx!.beginPath();
      ctx!.rect(0, 0, scanX, H);
      ctx!.clip();

      // Fill under IR curve
      ctx!.beginPath();
      irPts.forEach(([x, tr], i) => {
        const y = pty(tr);
        i === 0 ? ctx!.moveTo(x, y) : ctx!.lineTo(x, y);
      });
      ctx!.lineTo(PL + pw, PT + ph);
      ctx!.lineTo(PL, PT + ph);
      ctx!.closePath();
      const irFill = ctx!.createLinearGradient(0, PT, 0, PT + ph);
      irFill.addColorStop(0, "rgba(201,160,74,0.18)");
      irFill.addColorStop(1, "rgba(201,160,74,0.02)");
      ctx!.fillStyle = irFill;
      ctx!.fill();

      // IR curve line
      ctx!.beginPath();
      irPts.forEach(([x, tr], i) => {
        const y = pty(tr);
        i === 0 ? ctx!.moveTo(x, y) : ctx!.lineTo(x, y);
      });
      ctx!.strokeStyle = "#C9A04A";
      ctx!.lineWidth   = 1.5;
      ctx!.shadowColor = "rgba(201,160,74,0.55)";
      ctx!.shadowBlur  = 6;
      ctx!.stroke();
      ctx!.shadowBlur  = 0;
      ctx!.restore();

      // --- Draw Raman spectrum (teal) — RIGHT of scan line via clip ---
      ctx!.save();
      ctx!.beginPath();
      ctx!.rect(scanX, 0, W - scanX, H);
      ctx!.clip();

      // Fill under Raman curve
      ctx!.beginPath();
      ramanPts.forEach(([x, tr], i) => {
        const y = pty(tr);
        i === 0 ? ctx!.moveTo(x, y) : ctx!.lineTo(x, y);
      });
      ctx!.lineTo(PL + pw, PT + ph);
      ctx!.lineTo(PL, PT + ph);
      ctx!.closePath();
      const raFill = ctx!.createLinearGradient(0, PT, 0, PT + ph);
      raFill.addColorStop(0, "rgba(78,205,196,0.18)");
      raFill.addColorStop(1, "rgba(78,205,196,0.02)");
      ctx!.fillStyle = raFill;
      ctx!.fill();

      // Raman curve line
      ctx!.beginPath();
      ramanPts.forEach(([x, tr], i) => {
        const y = pty(tr);
        i === 0 ? ctx!.moveTo(x, y) : ctx!.lineTo(x, y);
      });
      ctx!.strokeStyle = "#4ECDC4";
      ctx!.lineWidth   = 1.5;
      ctx!.shadowColor = "rgba(78,205,196,0.55)";
      ctx!.shadowBlur  = 6;
      ctx!.stroke();
      ctx!.shadowBlur  = 0;
      ctx!.restore();

      // --- Scan line glow ---
      if (scanFrac > 0 && scanFrac < 1) {
        const scanGrad = ctx!.createLinearGradient(scanX - 18, 0, scanX + 18, 0);
        scanGrad.addColorStop(0,    "rgba(255,255,255,0)");
        scanGrad.addColorStop(0.35, "rgba(201,160,74,0.28)");
        scanGrad.addColorStop(0.5,  "rgba(255,255,255,0.70)");
        scanGrad.addColorStop(0.65, "rgba(78,205,196,0.28)");
        scanGrad.addColorStop(1,    "rgba(255,255,255,0)");
        ctx!.fillStyle = scanGrad;
        ctx!.fillRect(scanX - 18, PT, 36, ph);

        // Hard centre line
        ctx!.strokeStyle = "rgba(255,255,255,0.55)";
        ctx!.lineWidth   = 1;
        ctx!.shadowColor = "rgba(255,255,255,0.8)";
        ctx!.shadowBlur  = 8;
        ctx!.beginPath();
        ctx!.moveTo(scanX, PT);
        ctx!.lineTo(scanX, PT + ph);
        ctx!.stroke();
        ctx!.shadowBlur = 0;
      }

      // Axes
      ctx!.strokeStyle = "#1e1e1e";
      ctx!.lineWidth   = 0.5;
      ctx!.beginPath();
      ctx!.moveTo(PL, PT + ph);
      ctx!.lineTo(PL + pw, PT + ph);
      ctx!.stroke();

      // Wavenumber labels
      ctx!.fillStyle  = "#252525";
      ctx!.font       = "8px 'JetBrains Mono', monospace";
      ctx!.textAlign  = "center";
      [4000, 3000, 2000, 1500, 1000, 700].forEach((wn) => {
        const x = PL + ((XMAX - wn) / (XMAX - XMIN)) * pw;
        ctx!.fillText(String(wn), x, PT + ph + 11);
      });
      ctx!.fillStyle  = "#202020";
      ctx!.font       = "7px 'JetBrains Mono', monospace";
      ctx!.textAlign  = "right";
      ctx!.fillText("cm⁻¹", PL + pw, PT + ph + 21);

      // Side labels — fade in/out with scan position
      const leftAlpha  = Math.max(0, 1 - scanFrac * 2.5);
      const rightAlpha = Math.max(0, (scanFrac - 0.4) * 2.5);

      if (leftAlpha > 0.01) {
        ctx!.font      = "8px 'JetBrains Mono', monospace";
        ctx!.textAlign = "left";
        ctx!.fillStyle = `rgba(201,160,74,${leftAlpha * 0.55})`;
        ctx!.fillText("IR input", PL + 4, PT + 12);
      }
      if (rightAlpha > 0.01) {
        ctx!.font      = "8px 'JetBrains Mono', monospace";
        ctx!.textAlign = "right";
        ctx!.fillStyle = `rgba(78,205,196,${rightAlpha * 0.55})`;
        ctx!.fillText("Raman reconstruction", PL + pw - 4, PT + 12);
      }

      raf = requestAnimationFrame(draw);
    }

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !active) {
        active = true;
        raf = requestAnimationFrame(draw);
      } else if (!e.isIntersecting && active) {
        active = false;
        cancelAnimationFrame(raf);
      }
    });
    io.observe(container);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`rounded-xl border border-border overflow-hidden ${className}`}
    >
      <div className="flex items-center gap-1.5 px-3 py-2 bg-surface border-b border-border">
        <div className="flex gap-1.5">
          <div className="w-[10px] h-[10px] rounded-full bg-[#FF5F57]" />
          <div className="w-[10px] h-[10px] rounded-full bg-[#FEBC2E]" />
          <div className="w-[10px] h-[10px] rounded-full bg-[#28C840]" />
        </div>
        <span className="ml-2 text-[10px] font-mono text-text-muted/60">spectral_inversion — IR → Raman</span>
        <span className="ml-auto text-[10px] font-mono text-accent/60">● live</span>
      </div>
      <div style={{ background: "#070707" }}>
        <canvas
          ref={canvasRef}
          className="w-full block"
          style={{ height: "240px" }}
        />
      </div>
    </div>
  );
}
