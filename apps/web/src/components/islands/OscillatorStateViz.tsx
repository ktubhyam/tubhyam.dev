import { useRef, useEffect, useState } from "react";

const RATIO = 44 / 100;

export default function OscillatorStateViz() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [omega, setOmega] = useState(2.1);
  const [gamma, setGamma] = useState(0.4);
  const omegaRef = useRef(omega);
  const gammaRef = useRef(gamma);

  useEffect(() => {
    omegaRef.current = omega;
    gammaRef.current = gamma;
  }, [omega, gamma]);

  useEffect(() => {
    const wrap = wrapRef.current!;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let raf = 0;
    let paused = false;
    let cssW = 0;
    let cssH = 0;

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
      if (!cssW || !cssH) {
        raf = requestAnimationFrame(draw);
        return;
      }
      const w = omegaRef.current;
      const g = gammaRef.current;

      ctx.clearRect(0, 0, cssW, cssH);

      // Background
      ctx.fillStyle = "#09090b";
      ctx.fillRect(0, 0, cssW, cssH);

      const splitX = cssW * 0.6;
      const padT = 32;
      const padB = 24;
      const padL = 14;
      const padR = 10;

      // ---- LEFT PANEL: time domain ----
      const lW = splitX - padL - 8;
      const lH = cssH - padT - padB;
      const lX0 = padL;
      const lY0 = padT;
      const lYMid = lY0 + lH / 2;

      // Grid lines
      ctx.strokeStyle = "#1f1f23";
      ctx.lineWidth = 0.5;
      for (let i = 0; i <= 4; i++) {
        const y = lY0 + (i / 4) * lH;
        ctx.beginPath();
        ctx.moveTo(lX0, y);
        ctx.lineTo(lX0 + lW, y);
        ctx.stroke();
      }
      for (let i = 0; i <= 6; i++) {
        const x = lX0 + (i / 6) * lW;
        ctx.beginPath();
        ctx.moveTo(x, lY0);
        ctx.lineTo(x, lY0 + lH);
        ctx.stroke();
      }

      // Axis lines
      ctx.strokeStyle = "#3f3f46";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(lX0, lYMid);
      ctx.lineTo(lX0 + lW, lYMid);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(lX0, lY0);
      ctx.lineTo(lX0, lY0 + lH);
      ctx.stroke();

      // Axis labels
      ctx.fillStyle = "#71717a";
      ctx.font = `${Math.max(9, cssW * 0.014)}px monospace`;
      ctx.textAlign = "left";
      ctx.fillText("amplitude", lX0 + 2, lY0 + 9);
      ctx.textAlign = "right";
      ctx.fillText("time \u2192", lX0 + lW, lY0 + lH - 4);

      // Trajectory: x(t) = cos(omega*t) * exp(-gamma*t), t in [0, T_max]
      const T_MAX = 6.0;
      const N = 300;
      const amp = (lH / 2) * 0.88;

      // Glow effect — draw multiple passes
      const glowPasses = [
        { lw: 5, alpha: 0.08 },
        { lw: 3, alpha: 0.18 },
        { lw: 1.5, alpha: 1.0 },
      ];

      for (const pass of glowPasses) {
        ctx.strokeStyle = `rgba(78,205,196,${pass.alpha})`;
        ctx.lineWidth = pass.lw;
        ctx.beginPath();
        for (let i = 0; i <= N; i++) {
          const t = (i / N) * T_MAX;
          const val = Math.cos(w * t) * Math.exp(-g * t);
          const px = lX0 + (t / T_MAX) * lW;
          const py = lYMid - val * amp;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }

      // ---- RIGHT PANEL: frequency response ----
      const rX0 = splitX + 8;
      const rW = cssW - rX0 - padR;
      const rH = cssH - padT - padB;
      const rY0 = padT;

      // Divider
      ctx.strokeStyle = "#27272a";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(splitX, 4);
      ctx.lineTo(splitX, cssH - 4);
      ctx.stroke();

      // Grid lines (right)
      ctx.strokeStyle = "#1f1f23";
      ctx.lineWidth = 0.5;
      for (let i = 0; i <= 4; i++) {
        const y = rY0 + (i / 4) * rH;
        ctx.beginPath();
        ctx.moveTo(rX0, y);
        ctx.lineTo(rX0 + rW, y);
        ctx.stroke();
      }

      // Axes (right)
      ctx.strokeStyle = "#3f3f46";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(rX0, rY0 + rH);
      ctx.lineTo(rX0 + rW, rY0 + rH);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(rX0, rY0);
      ctx.lineTo(rX0, rY0 + rH);
      ctx.stroke();

      // Axis labels (right)
      ctx.fillStyle = "#71717a";
      ctx.font = `${Math.max(9, cssW * 0.014)}px monospace`;
      ctx.textAlign = "center";
      ctx.fillText("freq response", rX0 + rW / 2, rY0 + 9);
      ctx.fillText("freq \u2192", rX0 + rW / 2, rY0 + rH - 4);

      // Frequency response: Lorentzian peak |X(f)| = 1/sqrt((f-omega)^2 + gamma^2)
      // Normalized to peak = 1, peak width controlled by gamma
      const F_MAX = 5.0;
      const peakWidth = Math.max(0.08, g * 0.5);

      // Fill under curve
      ctx.beginPath();
      for (let i = 0; i <= N; i++) {
        const f = (i / N) * F_MAX;
        const lorentz = 1 / (1 + ((f - w) / peakWidth) ** 2);
        const px = rX0 + (f / F_MAX) * rW;
        const py = rY0 + rH - lorentz * rH * 0.88;
        if (i === 0) ctx.moveTo(px, rY0 + rH);
        ctx.lineTo(px, py);
      }
      ctx.lineTo(rX0 + rW, rY0 + rH);
      ctx.closePath();
      ctx.fillStyle = "rgba(78,205,196,0.08)";
      ctx.fill();

      // Line passes
      for (const pass of glowPasses) {
        ctx.strokeStyle = `rgba(78,205,196,${pass.alpha})`;
        ctx.lineWidth = pass.lw;
        ctx.beginPath();
        for (let i = 0; i <= N; i++) {
          const f = (i / N) * F_MAX;
          const lorentz = 1 / (1 + ((f - w) / peakWidth) ** 2);
          const px = rX0 + (f / F_MAX) * rW;
          const py = rY0 + rH - lorentz * rH * 0.88;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }

      // Peak frequency marker
      const peakFX = rX0 + (w / F_MAX) * rW;
      if (peakFX >= rX0 && peakFX <= rX0 + rW) {
        ctx.strokeStyle = "rgba(201,160,74,0.5)";
        ctx.lineWidth = 0.8;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(peakFX, rY0);
        ctx.lineTo(peakFX, rY0 + rH);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = "#C9A04A";
        ctx.font = `${Math.max(8, cssW * 0.012)}px monospace`;
        ctx.textAlign = "center";
        ctx.fillText("\u03c9", peakFX, rY0 + 12);
      }

      // ---- FORMULA at top ----
      ctx.fillStyle = "#a1a1aa";
      ctx.font = `${Math.max(10, cssW * 0.016)}px monospace`;
      ctx.textAlign = "center";
      const formulaX = (splitX / 2) + padL;
      const wStr = w.toFixed(1);
      const gStr = g.toFixed(2);
      ctx.fillText(
        `x(t) = cos(${wStr}\u00b7t) \u00b7 e^(\u2212${gStr}\u00b7t)`,
        formulaX,
        padT - 6
      );

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
        <span className="text-xs font-mono text-zinc-400">oscillator state viz — D-LinOSS damped oscillator</span>
        <span className="text-xs font-mono text-teal-400">interactive</span>
      </div>
      <div ref={wrapRef} className="relative overflow-hidden" style={{ aspectRatio: "100/44" }}>
        <canvas ref={canvasRef} className="absolute top-0 left-0" style={{ cursor: "crosshair" }} />
      </div>
      <div className="px-4 py-3 border-t border-zinc-800 flex flex-wrap gap-x-6 gap-y-2 items-center">
        <label className="flex items-center gap-2 text-xs font-mono text-zinc-400">
          <span className="text-zinc-300">&omega;</span> (frequency)
          <input
            type="range"
            min={0.5}
            max={4.0}
            step={0.1}
            value={omega}
            onChange={(e) => setOmega(Number(e.target.value))}
            className="w-24 accent-teal-400"
          />
          <span className="text-zinc-300 w-8 text-right">{omega.toFixed(1)}</span>
        </label>
        <label className="flex items-center gap-2 text-xs font-mono text-zinc-400">
          <span className="text-zinc-300">&gamma;</span> (damping)
          <input
            type="range"
            min={0.0}
            max={1.5}
            step={0.05}
            value={gamma}
            onChange={(e) => setGamma(Number(e.target.value))}
            className="w-24 accent-amber-400"
          />
          <span className="text-zinc-300 w-8 text-right">{gamma.toFixed(2)}</span>
        </label>
        <span className="ml-auto text-xs font-mono text-zinc-500">
          {gamma < 0.2 ? "low damping — long memory" : gamma > 1.0 ? "heavy damping — fast decay" : "moderate damping"}
        </span>
      </div>
      <div className="px-4 py-2 border-t border-zinc-800 text-xs font-mono text-zinc-500">
        left: time-domain trajectory &nbsp;|&nbsp; right: frequency response peak. &gamma;=0 → pure oscillation (SSM remembers all); &gamma;=1.5 → fast decay (SSM forgets quickly).
      </div>
    </div>
  );
}
