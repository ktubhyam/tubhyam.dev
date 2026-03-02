import { useRef, useEffect, useState } from "react";

function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s |= 0; s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const RATIO = 58 / 100;
const TEAL = "#4ECDC4";
const GREEN = "#34D399";
const RED = "#F87171";

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  life: number; maxLife: number;
  size: number;
}

const AUGMENTATIONS = [
  {
    label: "Horizontal Flip",
    valid: false,
    reason: "reverses wavenumber axis",
    detail: "C-H @ 2900 → fingerprint region",
  },
  {
    label: "Random Crop",
    valid: false,
    reason: "removes functional groups",
    detail: "deletes C=O @ 1700 cm⁻¹",
  },
  {
    label: "Additive Noise",
    valid: true,
    reason: "simulates detector noise",
    detail: "physically motivated — safe",
  },
  {
    label: "Wavenumber Shift ±2",
    valid: true,
    reason: "simulates calibration drift",
    detail: "instrument variation — safe",
  },
];

// Hardcoded simple peak positions (normalized 0-1)
const BASE_PEAKS = [
  { pos: 0.08, h: 0.55, w: 0.025 },
  { pos: 0.18, h: 0.80, w: 0.018 },
  { pos: 0.40, h: 0.95, w: 0.020 },
  { pos: 0.58, h: 0.45, w: 0.016 },
  { pos: 0.72, h: 0.60, w: 0.015 },
  { pos: 0.88, h: 0.40, w: 0.012 },
];

export default function AugmentationConstraintViz() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [playing, setPlaying] = useState(true);
  const playingRef = useRef(playing);
  useEffect(() => { playingRef.current = playing; }, [playing]);

  useEffect(() => {
    const wrap = wrapRef.current!;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let raf = 0, paused = false, cssW = 0, cssH = 0;

    let activeRow = 0;
    let rowTimer = 0;
    let particles: Particle[] = [];
    const ROW_INTERVAL = 2000; // ms

    function spawnParticles(cx: number, cy: number) {
      for (let i = 0; i < 7; i++) {
        const rng = mulberry32(Date.now() + i);
        const angle = rng() * Math.PI * 2;
        const speed = 1.5 + rng() * 2.5;
        particles.push({
          x: cx, y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1, maxLife: 1,
          size: 2 + rng() * 3,
        });
      }
    }

    function drawSpectrum(
      x0: number, y0: number, w: number, h: number,
      peaks: typeof BASE_PEAKS,
      color: string,
      noiseLevel = 0
    ) {
      const rng = mulberry32(7);
      const pts: [number, number][] = [];
      for (let i = 0; i < w; i++) {
        const t = i / (w - 1);
        let v = 0;
        for (const p of peaks) {
          v += p.h * Math.exp(-((t - p.pos) ** 2) / (2 * (p.w ** 2)));
        }
        const noise = noiseLevel * (rng() - 0.5) * 0.4;
        v = Math.max(0, Math.min(1, v + noise));
        pts.push([x0 + i, y0 + h - v * h * 0.85]);
      }

      // Baseline
      ctx.strokeStyle = "#3f3f46";
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(x0, y0 + h); ctx.lineTo(x0 + w, y0 + h);
      ctx.stroke();

      // Fill
      ctx.beginPath();
      ctx.moveTo(pts[0][0], y0 + h);
      for (const [px, py] of pts) ctx.lineTo(px, py);
      ctx.lineTo(pts[pts.length - 1][0], y0 + h);
      ctx.closePath();
      ctx.fillStyle = color + "20";
      ctx.fill();

      // Line
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (const [px, py] of pts) ctx.lineTo(px, py);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }

    function transformedPeaks(augIdx: number): typeof BASE_PEAKS {
      if (augIdx === 0) {
        // Flip
        return BASE_PEAKS.map(p => ({ ...p, pos: 1 - p.pos }));
      }
      if (augIdx === 1) {
        // Crop: remove peaks beyond 0.5
        return BASE_PEAKS.filter(p => p.pos < 0.5);
      }
      if (augIdx === 2) {
        // Noise: handled separately
        return BASE_PEAKS;
      }
      if (augIdx === 3) {
        // Small shift
        return BASE_PEAKS.map(p => ({ ...p, pos: p.pos + 0.02 }));
      }
      return BASE_PEAKS;
    }

    let lastTime = 0;

    function draw(now: number) {
      if (!paused) {
        const dt = now - lastTime;
        lastTime = now;

        ctx.clearRect(0, 0, cssW, cssH);
        ctx.fillStyle = "#09090b";
        ctx.fillRect(0, 0, cssW, cssH);

        const n = AUGMENTATIONS.length;
        const rowH = cssH / n;
        const specW = Math.floor(cssW * 0.38);
        const specH = Math.floor(rowH * 0.55);
        const padX = Math.floor(cssW * 0.04);
        const rightX = Math.floor(cssW * 0.54);

        if (playingRef.current) {
          rowTimer += dt;
          if (rowTimer > ROW_INTERVAL) {
            const prev = activeRow;
            activeRow = (activeRow + 1) % n;
            rowTimer = 0;
            // Spawn particles for invalid augmentations
            if (!AUGMENTATIONS[activeRow].valid) {
              const rowY = activeRow * rowH + rowH / 2;
              const specCx = rightX + specW / 2;
              spawnParticles(specCx, rowY);
            }
          }
        }

        // Update particles
        particles = particles.filter(p => p.life > 0);
        for (const p of particles) {
          p.x += p.vx; p.y += p.vy;
          p.vy += 0.08; // gravity
          p.life -= 0.03;
        }

        for (let i = 0; i < n; i++) {
          const aug = AUGMENTATIONS[i];
          const y0 = i * rowH;
          const isActive = i === activeRow;

          // Row background
          if (isActive) {
            ctx.fillStyle = aug.valid ? "#34D39910" : "#F8717110";
            ctx.fillRect(0, y0, cssW, rowH);
          }

          // Row separator
          ctx.strokeStyle = "#1f1f23";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(0, y0 + rowH); ctx.lineTo(cssW, y0 + rowH);
          ctx.stroke();

          // Label area
          ctx.fillStyle = isActive ? (aug.valid ? GREEN : RED) : "#52525b";
          ctx.font = `bold ${Math.floor(rowH * 0.16)}px monospace`;
          ctx.textAlign = "left";
          const labelY = y0 + rowH * 0.35;
          ctx.fillText(aug.label, padX, labelY);

          ctx.fillStyle = "#52525b";
          ctx.font = `${Math.floor(rowH * 0.13)}px monospace`;
          ctx.fillText(aug.reason, padX, y0 + rowH * 0.55);
          ctx.fillText(aug.detail, padX, y0 + rowH * 0.7);

          // Valid/invalid badge
          const badgeX = padX;
          const badgeY = y0 + rowH * 0.78;
          ctx.fillStyle = aug.valid ? GREEN + "30" : RED + "30";
          ctx.strokeStyle = aug.valid ? GREEN : RED;
          ctx.lineWidth = 1;
          if ((ctx as any).roundRect) (ctx as any).roundRect(badgeX, badgeY, 36, 12, 3);
          else ctx.rect(badgeX, badgeY, 36, 12);
          ctx.fill(); ctx.stroke();
          ctx.fillStyle = aug.valid ? GREEN : RED;
          ctx.font = "8px monospace";
          ctx.textAlign = "center";
          ctx.fillText(aug.valid ? "VALID" : "INVALID", badgeX + 18, badgeY + 8.5);

          // Spectra
          const specY = y0 + (rowH - specH) / 2;
          const beforeX = Math.floor(cssW * 0.3);
          const color = isActive ? (aug.valid ? GREEN : RED) : "#52525b";

          // Before spectrum (original)
          const noisePre = aug.label === "Additive Noise" && isActive ? 0.3 : 0;
          drawSpectrum(beforeX, specY, specW, specH, BASE_PEAKS, "#52525b", noisePre);
          ctx.fillStyle = "#3f3f46";
          ctx.font = "8px monospace";
          ctx.textAlign = "center";
          ctx.fillText("before", beforeX + specW / 2, specY - 3);

          // Arrow
          const arrowX = rightX - 16;
          ctx.strokeStyle = "#3f3f46";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(arrowX - 6, specY + specH / 2);
          ctx.lineTo(arrowX + 6, specY + specH / 2);
          ctx.stroke();
          ctx.fillStyle = "#3f3f46";
          ctx.beginPath();
          ctx.moveTo(arrowX + 4, specY + specH / 2 - 3);
          ctx.lineTo(arrowX + 10, specY + specH / 2);
          ctx.lineTo(arrowX + 4, specY + specH / 2 + 3);
          ctx.fill();

          // After spectrum (augmented)
          const noisePost = aug.label === "Additive Noise" ? 0.5 : 0;
          drawSpectrum(rightX, specY, specW, specH, transformedPeaks(i), color, noisePost);
          ctx.fillStyle = "#3f3f46";
          ctx.font = "8px monospace";
          ctx.textAlign = "center";
          ctx.fillText("after", rightX + specW / 2, specY - 3);

          // Overlay ✗ or ✓ for active row
          if (isActive) {
            ctx.font = `bold ${Math.floor(specH * 0.7)}px monospace`;
            ctx.textAlign = "center";
            ctx.globalAlpha = 0.25;
            ctx.fillStyle = aug.valid ? GREEN : RED;
            ctx.fillText(aug.valid ? "✓" : "✗", rightX + specW / 2, specY + specH * 0.75);
            ctx.globalAlpha = 1;
          }
        }

        // Draw particles
        for (const p of particles) {
          ctx.globalAlpha = p.life;
          ctx.fillStyle = RED;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        }

        // Row indicator stripe
        const indicatorX = cssW - 6;
        const indY = activeRow * rowH + rowH * 0.2;
        ctx.fillStyle = AUGMENTATIONS[activeRow].valid ? GREEN : RED;
        ctx.fillRect(indicatorX, indY, 4, rowH * 0.6);
      }
      raf = requestAnimationFrame(draw);
    }

    const visObs = new IntersectionObserver(([e]) => { paused = !e.isIntersecting; });
    visObs.observe(wrap);
    const resObs = new ResizeObserver(resize);
    resObs.observe(wrap);

    function resize() {
      const r = wrap.getBoundingClientRect();
      cssW = r.width || 600; cssH = Math.round(cssW * RATIO);
      const dpr = devicePixelRatio || 1;
      canvas.width = cssW * dpr; canvas.height = cssH * dpr;
      canvas.style.width = cssW + "px"; canvas.style.height = cssH + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    resize();
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); visObs.disconnect(); resObs.disconnect(); };
  }, []);

  return (
    <div className="my-8 rounded-lg border border-zinc-800 bg-zinc-950 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800">
        <span className="text-xs font-mono text-zinc-400">augmentation constraints — what breaks spectra</span>
        <button
          onClick={() => setPlaying(p => !p)}
          className="text-xs font-mono text-zinc-500 hover:text-zinc-300 transition-colors px-2 py-0.5 border border-zinc-700 rounded"
        >
          {playing ? "pause" : "play"}
        </button>
      </div>
      <div ref={wrapRef} className="relative overflow-hidden" style={{ aspectRatio: "100/58" }}>
        <canvas ref={canvasRef} className="absolute top-0 left-0" />
      </div>
      <div className="px-4 py-2 border-t border-zinc-800 text-xs font-mono text-zinc-500">
        Cycles every 2s. Red = destroys spectral information. Green = physically valid. Particles = information damage.
      </div>
    </div>
  );
}
