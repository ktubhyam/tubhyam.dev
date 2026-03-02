/**
 * SpectralWaterfallBg — S1 Research background.
 * A live spectroscopy waterfall: benzaldehyde IR peaks rendered as a
 * scrolling vertical heatmap. Each pixel column = one wavenumber
 * (4000 cm⁻¹ left → 500 cm⁻¹ right, chemistry convention).
 * Rows scroll upward continuously. Amber = IR absorbance peaks.
 * Teal = Raman reconstruction — fades in / out, cycling the inverse problem.
 * The background literally looks like spectroscopy data in motion.
 */
import { useRef, useEffect } from "react";

const XMIN = 500;
const XMAX = 4000;
const GRID_W = 300; // horizontal resolution (wavenumber axis)
const SCROLL_SPEED = 38; // rows per second scrolling upward (base auto-scroll)

// Benzaldehyde IR peaks: { wn: cm⁻¹, w: half-width, h: peak height 0–1 }
const IR_PEAKS = [
  { wn: 3450, w: 110, h: 0.56 }, // broad O-H stretch
  { wn: 3065, w:  20, h: 0.30 }, // aromatic C-H
  { wn: 2850, w:  18, h: 0.26 }, // aldehyde C-H
  { wn: 1700, w:  14, h: 0.92 }, // C=O (strong)
  { wn: 1600, w:  16, h: 0.38 }, // aromatic C=C
  { wn: 1455, w:  18, h: 0.32 }, // C-H bend
  { wn: 1305, w:  14, h: 0.44 }, // C-O
  { wn: 1170, w:  11, h: 0.30 }, // fingerprint
  { wn: 1020, w:   9, h: 0.26 }, // fingerprint
  { wn:  840, w:   8, h: 0.46 }, // aromatic oop
  { wn:  750, w:   7, h: 0.40 }, // oop
  { wn:  695, w:   7, h: 0.34 }, // oop
];

// Predicted Raman reconstruction — slightly offset widths/intensities
const RAMAN_PEAKS = [
  { wn: 3067, w: 16, h: 0.22 },
  { wn: 2848, w: 14, h: 0.20 },
  { wn: 1698, w: 12, h: 0.78 },
  { wn: 1597, w: 14, h: 0.34 },
  { wn: 1452, w: 16, h: 0.28 },
  { wn:  838, w:  6, h: 0.44 },
  { wn:  748, w:  5, h: 0.38 },
];

function lorentzian(x: number, c: number, w: number, h: number): number {
  return h / (1 + ((x - c) / w) ** 2);
}

function wnAt(col: number): number {
  return XMAX - (col / (GRID_W - 1)) * (XMAX - XMIN);
}

function irAt(col: number, t: number): number {
  const wn = wnAt(col);
  let v = 0;
  for (const p of IR_PEAKS) {
    const breath = 0.70 + 0.30 * Math.sin(t * 0.38 + p.wn * 0.00085);
    v += lorentzian(wn, p.wn, p.w, p.h) * breath;
  }
  return Math.min(1, v);
}

function ramanAt(col: number, t: number): number {
  const wn = wnAt(col);
  let v = 0;
  for (const p of RAMAN_PEAKS) {
    const breath = 0.60 + 0.40 * Math.sin(t * 0.33 + p.wn * 0.0012 + 1.6);
    v += lorentzian(wn, p.wn, p.w, p.h) * breath;
  }
  return Math.min(1, v);
}

export default function SpectralWaterfallBg() {
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

    // Offscreen pixel buffer (GRID_W × dynamic height)
    const off    = document.createElement("canvas");
    off.width    = GRID_W;
    off.height   = 1;
    const offCtx = off.getContext("2d")!;
    let img      = offCtx.createImageData(GRID_W, 1);
    let d        = img.data;
    let bufH     = 1;

    function rebuildBuffer(h: number) {
      bufH     = Math.max(1, h);
      off.height = bufH;
      img      = offCtx.createImageData(GRID_W, bufH);
      d        = img.data;
      d.fill(0);
    }

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
      rebuildBuffer(Math.ceil(cssH));
    }

    let scrollAccum    = 0;
    let lastTs         = 0;
    let scrollVelocity = 0;
    let lastScrollY    = window.scrollY;
    const TARGET_OPACITY = 0.44;

    function onScroll() {
      const rect  = wrap!.getBoundingClientRect();
      const viewH = window.innerHeight;

      // Fade in: 0 when section top at viewport bottom, full when section top crosses 70% of viewport
      const progress = Math.max(0, Math.min(1, (viewH - rect.top) / (viewH * 0.72)));
      // Smooth ease-in
      const eased = progress * progress * (3 - 2 * progress);
      wrap!.style.opacity = String(eased * TARGET_OPACITY);

      // Boost waterfall speed proportional to scroll-down delta
      const dy = window.scrollY - lastScrollY;
      lastScrollY = window.scrollY;
      if (dy > 0 && rect.top < viewH && rect.bottom > 0) {
        scrollVelocity += dy * 5.5;
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    // Set initial opacity (handles case where page loads already scrolled)
    onScroll();

    function loop(ts: number) {
      if (!paused && cssW > 0 && bufH > 1) {
        const dt = lastTs > 0 ? (ts - lastTs) * 0.001 : 0.016;
        lastTs = ts;
        const t = ts * 0.001;

        scrollAccum += dt * SCROLL_SPEED + scrollVelocity;
        scrollVelocity = 0;
        const scrollRows = Math.floor(scrollAccum);
        scrollAccum -= scrollRows;

        if (scrollRows > 0) {
          const rowBytes = GRID_W * 4;
          // Shift all rows up by scrollRows (old rows near top fall off)
          d.copyWithin(0, Math.min(scrollRows * rowBytes, d.length));

          // Raman overlay fade: 0 during first half of 12s cycle, 1 during second half
          const ramanCycle = (t % 12) / 12; // 0 → 1 over 12s
          const ramanFade  = ramanCycle < 0.4
            ? 0
            : ramanCycle < 0.55
              ? (ramanCycle - 0.4) / 0.15     // ramp in
              : ramanCycle < 0.75
                ? 1.0                          // hold
                : ramanCycle < 0.90
                  ? (0.90 - ramanCycle) / 0.15  // ramp out
                  : 0;

          // Fill new rows at bottom
          const startRow = Math.max(0, bufH - scrollRows);
          for (let r = startRow; r < bufH; r++) {
            const rowT   = t + (r - startRow) * 0.005;
            const base   = r * rowBytes;
            for (let col = 0; col < GRID_W; col++) {
              const ir = irAt(col, rowT);
              const ra = ramanAt(col, rowT) * ramanFade;

              // Map to pixel — boosted brightness for visibility
              const irA  = Math.pow(Math.min(1, ir * 1.9), 0.9);
              const raA  = Math.pow(Math.min(1, ra * 1.6), 1.0);

              // Amber: rgb(201,160,74)  Teal: rgb(78,205,196)
              const R = Math.min(255, 201 * irA + 78  * raA);
              const G = Math.min(255, 160 * irA + 205 * raA);
              const B = Math.min(255,  74 * irA + 196 * raA);
              const A = Math.min(255, Math.max(irA, raA * 0.85) * 240);

              const idx     = base + col * 4;
              d[idx]     = Math.round(R);
              d[idx + 1] = Math.round(G);
              d[idx + 2] = Math.round(B);
              d[idx + 3] = Math.round(A);
            }
          }

          offCtx.putImageData(img, 0, 0);
        }

        ctx!.clearRect(0, 0, cssW, cssH);
        ctx!.save();
        ctx!.imageSmoothingEnabled  = true;
        ctx!.imageSmoothingQuality  = "high";
        ctx!.drawImage(off, 0, 0, cssW, cssH);
        ctx!.restore();
      }
      raf = requestAnimationFrame(loop);
    }

    const visObs = new IntersectionObserver(([e]) => { paused = !e.isIntersecting; });
    visObs.observe(wrap);
    const resObs = new ResizeObserver(resize);
    resObs.observe(wrap);

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
