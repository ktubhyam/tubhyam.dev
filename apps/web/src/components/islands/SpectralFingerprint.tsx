/**
 * SpectralFingerprint — S1 Research right column.
 * Animated vertical bar chart at real benzaldehyde peak positions.
 * Amber bars = IR absorbance. Teal bars = Raman reconstruction.
 * Each bar breathes independently — like an equalizer for molecular identity.
 * Peaks follow B3LYP/def2-TZVP data; teal bars offset right to show both.
 */
import { useRef, useEffect } from "react";

const XMIN = 500;
const XMAX = 4000;
const BAR_W = 5;

const IR_PEAKS = [
  { wn: 3450, h: 0.55, phase: 0.00 },
  { wn: 3065, h: 0.22, phase: 1.20 },
  { wn: 2850, h: 0.20, phase: 2.50 },
  { wn: 1700, h: 0.88, phase: 0.70 },
  { wn: 1600, h: 0.32, phase: 1.80 },
  { wn: 1455, h: 0.28, phase: 3.10 },
  { wn: 1305, h: 0.40, phase: 0.40 },
  { wn: 1170, h: 0.26, phase: 2.20 },
  { wn: 1020, h: 0.22, phase: 1.50 },
  { wn:  840, h: 0.42, phase: 3.80 },
  { wn:  750, h: 0.36, phase: 2.80 },
  { wn:  695, h: 0.30, phase: 1.10 },
];

const RAMAN_PEAKS = [
  { wn: 3067, h: 0.18, phase: 0.60 },
  { wn: 2848, h: 0.17, phase: 1.90 },
  { wn: 1698, h: 0.72, phase: 2.40 },
  { wn: 1597, h: 0.28, phase: 0.90 },
  { wn: 1452, h: 0.24, phase: 3.50 },
  { wn:  838, h: 0.38, phase: 1.30 },
  { wn:  748, h: 0.32, phase: 2.70 },
];

export default function SpectralFingerprint({ className = "" }: { className?: string }) {
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
    const PL = 10, PR = 12, PT = 14, PB = 24;

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      const W   = container!.clientWidth;
      const H   = container!.clientHeight;
      canvas!.width  = W * dpr;
      canvas!.height = H * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function draw(ts: number) {
      const t  = ts * 0.001;
      const W  = container!.clientWidth;
      const H  = container!.clientHeight;
      const pw = W - PL - PR;
      const ph = H - PT - PB;

      ctx!.clearRect(0, 0, W, H);

      // Faint horizontal grid lines at 25 / 50 / 75 / 100% absorbance
      ctx!.strokeStyle = "#131313";
      ctx!.lineWidth = 0.5;
      for (let i = 1; i <= 4; i++) {
        const gy = PT + ph - (i / 4) * ph;
        ctx!.beginPath();
        ctx!.moveTo(PL, gy);
        ctx!.lineTo(PL + pw, gy);
        ctx!.stroke();
      }

      function xOf(wn: number): number {
        return PL + ((XMAX - wn) / (XMAX - XMIN)) * pw;
      }

      // Draw IR bars (amber)
      for (const p of IR_PEAKS) {
        const breathe = 0.68 + 0.32 * Math.sin(t * 0.52 + p.phase);
        const barH    = p.h * breathe * ph;
        const x       = xOf(p.wn);
        const y0      = PT + ph - barH;

        const grad = ctx!.createLinearGradient(x, y0, x, PT + ph);
        grad.addColorStop(0,   "rgba(201,160,74,0.95)");
        grad.addColorStop(0.5, "rgba(201,160,74,0.60)");
        grad.addColorStop(1,   "rgba(201,160,74,0.04)");

        ctx!.shadowColor = "rgba(201,160,74,0.75)";
        ctx!.shadowBlur  = 9;
        ctx!.fillStyle   = grad;
        ctx!.fillRect(x - BAR_W / 2, y0, BAR_W, barH);
      }

      // Draw Raman bars (teal) — shifted 7px right
      ctx!.shadowColor = "rgba(78,205,196,0.70)";
      for (const p of RAMAN_PEAKS) {
        const breathe = 0.62 + 0.38 * Math.sin(t * 0.45 + p.phase + 1.5);
        const barH    = p.h * breathe * ph;
        const x       = xOf(p.wn) + 7;
        const y0      = PT + ph - barH;

        const grad = ctx!.createLinearGradient(x, y0, x, PT + ph);
        grad.addColorStop(0,   "rgba(78,205,196,0.90)");
        grad.addColorStop(0.5, "rgba(78,205,196,0.55)");
        grad.addColorStop(1,   "rgba(78,205,196,0.04)");

        ctx!.fillStyle = grad;
        ctx!.fillRect(x - (BAR_W - 1) / 2, y0, BAR_W - 1, barH);
      }
      ctx!.shadowBlur = 0;

      // Baseline
      ctx!.strokeStyle = "#1e1e1e";
      ctx!.lineWidth   = 0.6;
      ctx!.beginPath();
      ctx!.moveTo(PL, PT + ph);
      ctx!.lineTo(PL + pw, PT + ph);
      ctx!.stroke();

      // Wavenumber axis labels
      ctx!.fillStyle  = "#252525";
      ctx!.font       = "8px 'JetBrains Mono', monospace";
      ctx!.textAlign  = "center";
      [4000, 3000, 2000, 1500, 1000, 700].forEach((wn) => {
        ctx!.fillText(String(wn), xOf(wn), PT + ph + 11);
      });

      // Unit + legend
      ctx!.font      = "7px 'JetBrains Mono', monospace";
      ctx!.fillStyle = "#222";
      ctx!.textAlign = "right";
      ctx!.fillText("cm⁻¹", PL + pw, PT + ph + 21);

      // IR legend dot
      ctx!.fillStyle = "rgba(201,160,74,0.65)";
      ctx!.beginPath();
      ctx!.arc(PL + 6, PT + ph + 18, 2.5, 0, Math.PI * 2);
      ctx!.fill();
      ctx!.fillStyle  = "#2a2a2a";
      ctx!.font       = "7px 'JetBrains Mono', monospace";
      ctx!.textAlign  = "left";
      ctx!.fillText("IR", PL + 12, PT + ph + 21);

      // Raman legend dot
      ctx!.fillStyle = "rgba(78,205,196,0.65)";
      ctx!.beginPath();
      ctx!.arc(PL + 32, PT + ph + 18, 2.5, 0, Math.PI * 2);
      ctx!.fill();
      ctx!.fillStyle  = "#2a2a2a";
      ctx!.fillText("Raman", PL + 38, PT + ph + 21);

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
        <span className="ml-2 text-[10px] font-mono text-text-muted/60">molecular_fingerprint — C₆H₅CHO</span>
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
