/**
 * SpectralRibbonBg — S1 Research background.
 * 8 horizontal sine waves at different vertical bands, scrolling slowly
 * left-to-right. Each wave represents a vibrational mode. Every ~12s one
 * wave "activates": brightens, amplitude surges, color shifts to amber — the
 * forward problem, a mode activating. A faint scan line sweeps periodically.
 */
import { useRef, useEffect } from "react";

const N_WAVES = 8;

// gold / gold / cyan / cyan / purple / purple / green / green
const WAVE_COLORS: [number, number, number][] = [
  [201, 160,  74],
  [201, 160,  74],
  [ 78, 205, 196],
  [ 78, 205, 196],
  [167, 139, 250],
  [167, 139, 250],
  [ 52, 211, 153],
  [ 52, 211, 153],
];

const BASE_AMPS  = [18, 24, 20, 28, 16, 22, 19, 26];
const WAVENUMS   = [0.0068, 0.0082, 0.0095, 0.0110, 0.0125, 0.0138, 0.0152, 0.0167];
const OMEGAS     = [0.24, 0.29, 0.34, 0.39, 0.44, 0.49, 0.54, 0.58];
const PHASE_OFFS = [0.0, 1.1, 2.3, 0.7, 1.9, 3.2, 2.5, 0.5];
const BREATH_PH  = [0.0, 2.1, 1.3, 3.5, 0.8, 4.2, 2.8, 1.6];

// Activation: one wave brightens fully over 0.8s, holds 1.5s, dims over 0.8s
const ACT_RAMP   = 800;
const ACT_HOLD   = 1500;
const ACT_TOTAL  = ACT_RAMP * 2 + ACT_HOLD;  // 3100 ms
const ACT_EVERY  = 12000; // ms between activations

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

function activationIntensity(elapsed: number): number {
  if (elapsed <= 0 || elapsed >= ACT_TOTAL) return 0;
  if (elapsed < ACT_RAMP) return smoothstep(elapsed / ACT_RAMP);
  if (elapsed < ACT_RAMP + ACT_HOLD) return 1.0;
  return smoothstep(1 - (elapsed - ACT_RAMP - ACT_HOLD) / ACT_RAMP);
}

export default function SpectralRibbonBg() {
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

    let lastActivation = -ACT_EVERY; // fire first activation quickly
    let activeWave: { idx: number; startT: number } | null = null;
    let nextWaveIdx = 4; // start with a violet wave for visual interest

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
    }

    function loop(ts: number) {
      if (!paused && cssW > 0) {
        const t = ts; // ms

        // Schedule activation
        if (!activeWave && t - lastActivation > ACT_EVERY) {
          activeWave    = { idx: nextWaveIdx, startT: t };
          lastActivation = t;
          // Next wave: jump 2-5 indices to ensure visual variety
          nextWaveIdx = (nextWaveIdx + 2 + Math.floor(Math.abs(Math.sin(t)) * 3)) % N_WAVES;
        }
        // Expire activation
        if (activeWave && t - activeWave.startT > ACT_TOTAL) {
          activeWave = null;
        }

        ctx!.clearRect(0, 0, cssW, cssH);

        // Faint scan line — sweeps right→left, 28s period
        const scanX = cssW * (1 - (t % 28000) / 28000);
        ctx!.beginPath();
        ctx!.moveTo(scanX, 0); ctx!.lineTo(scanX, cssH);
        ctx!.strokeStyle = "rgba(255,255,255,0.035)";
        ctx!.lineWidth = 1;
        ctx!.stroke();

        // Waves
        const tSec = t * 0.001;
        for (let i = 0; i < N_WAVES; i++) {
          const [r2, g2, b2] = WAVE_COLORS[i];
          const centerY  = (i + 0.5) / N_WAVES * cssH;
          const breathAmp = BASE_AMPS[i] * (0.68 + 0.32 * Math.sin(tSec * 0.28 + BREATH_PH[i]));

          let actT = 0;
          if (activeWave?.idx === i) {
            actT = activationIntensity(t - activeWave.startT);
          }

          const opacity   = 0.09 + actT * 0.36;
          const lineWidth = 0.8 + actT * 1.8;
          const amp       = breathAmp * (1 + actT * 0.85);

          // Path across full canvas width — step every 3px
          ctx!.beginPath();
          const steps = Math.ceil(cssW / 3);
          for (let px = 0; px <= steps; px++) {
            const x = (px / steps) * cssW;
            const y = centerY + amp * Math.sin(WAVENUMS[i] * x - OMEGAS[i] * tSec + PHASE_OFFS[i]);
            px === 0 ? ctx!.moveTo(x, y) : ctx!.lineTo(x, y);
          }
          ctx!.strokeStyle = `rgba(${r2},${g2},${b2},${opacity})`;
          ctx!.lineWidth   = lineWidth;
          ctx!.lineCap     = "round";
          ctx!.stroke();

          // Activation glow at wave centre
          if (actT > 0.05) {
            const glowX = cssW * 0.48;
            const glowY = centerY + amp * Math.sin(WAVENUMS[i] * glowX - OMEGAS[i] * tSec + PHASE_OFFS[i]);
            const gR = 90 * actT;
            const glow = ctx!.createRadialGradient(glowX, glowY, 0, glowX, glowY, gR);
            glow.addColorStop(0, `rgba(${r2},${g2},${b2},${actT * 0.18})`);
            glow.addColorStop(1, `rgba(${r2},${g2},${b2},0)`);
            ctx!.beginPath();
            ctx!.arc(glowX, glowY, gR, 0, Math.PI * 2);
            ctx!.fillStyle = glow;
            ctx!.fill();
          }
        }
      }

      raf = requestAnimationFrame(loop);
    }

    const visObs = new IntersectionObserver(([e]) => { paused = !e.isIntersecting; });
    visObs.observe(wrap);
    const resObs = new ResizeObserver(resize);
    resObs.observe(wrap);

    resize();
    raf = requestAnimationFrame(loop);

    return () => { cancelAnimationFrame(raf); visObs.disconnect(); resObs.disconnect(); };
  }, []);

  return (
    <div ref={wrapRef} aria-hidden="true" className="absolute inset-0 pointer-events-none" style={{ opacity: 0.85 }}>
      <canvas ref={canvasRef} className="absolute inset-0" />
    </div>
  );
}
