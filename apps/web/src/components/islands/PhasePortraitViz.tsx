import { useRef, useEffect, useState, useCallback } from "react";

const RATIO = 80 / 100;

// Dimensionless CSTR model
// dC/dt = (1-C)/tau - k0*exp(-E/T)*C
// dT/dt = (Tf-T)/tau + dH*k0*exp(-E/T)*C - UA*(T-Tc)
// Parameters are nondimensional
const K0 = 300.0;
const E = 5.0;    // dimensionless activation energy
const DH = 8.0;   // dimensionless heat of reaction
const TF = 0.7;   // dimensionless feed temperature

function cstrDimless(
  C: number,
  T: number,
  tau: number,
  Tc: number
): [number, number] {
  const rate = K0 * Math.exp(-E / (T + 1e-9)) * C;
  const dC = (1 - C) / tau - rate;
  const dT = (TF - T) / tau + DH * rate - 3.0 * (T - Tc);
  return [dC, dT];
}

interface TrailPoint {
  C: number;
  T: number;
  age: number; // 0=newest, increases
}

export default function PhasePortraitViz() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tau, setTau] = useState(1.2);
  const [Tc, setTc] = useState(0.3);
  const tauRef = useRef(tau);
  const TcRef = useRef(Tc);

  // Trail state (user-clicked trajectory)
  const trailRef = useRef<TrailPoint[]>([]);
  const trailActiveRef = useRef(false);

  useEffect(() => {
    tauRef.current = tau;
    TcRef.current = Tc;
    // Clear trail when params change
    trailRef.current = [];
    trailActiveRef.current = false;
  }, [tau, Tc]);

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const wrap = wrapRef.current;
      if (!wrap) return;
      const rect = wrap.getBoundingClientRect();
      const relX = (e.clientX - rect.left) / rect.width;
      const relY = (e.clientY - rect.top) / rect.height;

      const padT = 0.06;
      const padB = 0.08;
      const padL = 0.10;
      const padR = 0.04;
      const plotFracX = (relX - padL) / (1 - padL - padR);
      const plotFracY = (relY - padT) / (1 - padT - padB);

      if (plotFracX < 0 || plotFracX > 1 || plotFracY < 0 || plotFracY > 1) return;

      // C = plotFracX (0→1), T = 1 - plotFracY (flipped y)
      const C0 = plotFracX;
      const T0 = 1 - plotFracY;

      // Integrate forward with Euler, 200 steps
      const DT = 0.04;
      const trail: TrailPoint[] = [];
      let C = C0;
      let T = T0;
      for (let i = 0; i < 200; i++) {
        trail.push({ C, T, age: i });
        const [dC, dT] = cstrDimless(C, T, tauRef.current, TcRef.current);
        C = Math.max(0, Math.min(1.5, C + dC * DT));
        T = Math.max(0, Math.min(1.5, T + dT * DT));
      }
      trailRef.current = trail;
      trailActiveRef.current = true;
    },
    []
  );

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
      cssW = r.width || 500;
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

      const tau = tauRef.current;
      const Tc = TcRef.current;

      ctx.clearRect(0, 0, cssW, cssH);
      ctx.fillStyle = "#09090b";
      ctx.fillRect(0, 0, cssW, cssH);

      const padT = Math.round(cssH * 0.06);
      const padB = Math.round(cssH * 0.08);
      const padL = Math.round(cssW * 0.10);
      const padR = Math.round(cssW * 0.04);
      const plotW = cssW - padL - padR;
      const plotH = cssH - padT - padB;

      function toCanvas(C: number, T: number): [number, number] {
        const x = padL + C * plotW;
        const y = padT + (1 - T) * plotH;
        return [x, y];
      }

      // ---- Grid ----
      ctx.strokeStyle = "#18181b";
      ctx.lineWidth = 0.5;
      for (let i = 0; i <= 4; i++) {
        const x = padL + (i / 4) * plotW;
        const y = padT + (i / 4) * plotH;
        ctx.beginPath();
        ctx.moveTo(x, padT);
        ctx.lineTo(x, padT + plotH);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(padL, y);
        ctx.lineTo(padL + plotW, y);
        ctx.stroke();
      }

      // ---- Axes ----
      ctx.strokeStyle = "#3f3f46";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padL, padT);
      ctx.lineTo(padL, padT + plotH);
      ctx.lineTo(padL + plotW, padT + plotH);
      ctx.stroke();

      // Axis labels
      ctx.fillStyle = "#71717a";
      const fs = Math.max(9, cssW * 0.014);
      ctx.font = `${fs}px monospace`;
      ctx.textAlign = "center";
      ctx.fillText("concentration C \u2192", padL + plotW / 2, padT + plotH + padB - 4);

      // Y-axis label (rotated)
      ctx.save();
      ctx.translate(padL - 28, padT + plotH / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = "center";
      ctx.fillText("temperature T \u2192", 0, 0);
      ctx.restore();

      // Tick labels
      ctx.textAlign = "center";
      ctx.fillStyle = "#52525b";
      const tickFs = Math.max(8, cssW * 0.012);
      ctx.font = `${tickFs}px monospace`;
      for (let i = 0; i <= 4; i++) {
        const v = i / 4;
        const x = padL + v * plotW;
        ctx.fillText(v.toFixed(2), x, padT + plotH + 12);
        const y = padT + (1 - v) * plotH;
        ctx.textAlign = "right";
        ctx.fillText(v.toFixed(2), padL - 4, y + 3);
        ctx.textAlign = "center";
      }

      // ---- Vector field (20×20 grid) ----
      const GRID = 20;
      for (let gi = 0; gi < GRID; gi++) {
        for (let gj = 0; gj < GRID; gj++) {
          const C = (gi + 0.5) / GRID;
          const T = (gj + 0.5) / GRID;
          const [dC, dT] = cstrDimless(C, T, tau, Tc);
          const mag = Math.sqrt(dC * dC + dT * dT);
          const arrowLen = Math.min(mag * 0.25, 0.04);
          const normC = mag > 1e-9 ? dC / mag : 0;
          const normT = mag > 1e-9 ? dT / mag : 0;

          const [cx, cy] = toCanvas(C, T);
          const [ex, ey] = toCanvas(C + normC * arrowLen, T + normT * arrowLen);

          // Color by magnitude: low=zinc, high=amber/teal
          const colorFrac = Math.min(mag / 3.0, 1.0);
          const r = Math.round(71 + (201 - 71) * colorFrac);
          const g2 = Math.round(71 + (160 - 71) * colorFrac);
          const b = Math.round(82 + (74 - 82) * colorFrac);
          const alpha = 0.35 + colorFrac * 0.4;

          ctx.strokeStyle = `rgba(${r},${g2},${b},${alpha})`;
          ctx.lineWidth = 0.7;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(ex, ey);
          ctx.stroke();

          // Arrowhead
          if (arrowLen > 0.005) {
            const angle = Math.atan2(ey - cy, ex - cx);
            const hs = 2.5;
            ctx.beginPath();
            ctx.moveTo(ex, ey);
            ctx.lineTo(
              ex - hs * Math.cos(angle - 0.4),
              ey - hs * Math.sin(angle - 0.4)
            );
            ctx.lineTo(
              ex - hs * Math.cos(angle + 0.4),
              ey - hs * Math.sin(angle + 0.4)
            );
            ctx.closePath();
            ctx.fillStyle = `rgba(${r},${g2},${b},${alpha})`;
            ctx.fill();
          }
        }
      }

      // ---- Nullclines ----
      // dC/dt = 0: (1-C)/tau = k0*exp(-E/T)*C
      // Solve numerically by scanning T
      const NC_STEPS = 200;

      // dC/dt = 0 nullcline (teal)
      ctx.strokeStyle = "#4ECDC4";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([]);
      ctx.beginPath();
      let startedC = false;
      for (let si = 0; si <= NC_STEPS; si++) {
        const T = si / NC_STEPS;
        // (1-C)/tau = k0*exp(-E/T)*C  =>  C = 1/(1 + tau*k0*exp(-E/T))
        const rate_k = K0 * Math.exp(-E / (T + 1e-9));
        const C_nc = 1 / (1 + tau * rate_k);
        if (C_nc >= 0 && C_nc <= 1) {
          const [x, y] = toCanvas(C_nc, T);
          if (!startedC) { ctx.moveTo(x, y); startedC = true; }
          else ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      // dT/dt = 0 nullcline (amber)
      ctx.strokeStyle = "#C9A04A";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      let startedT = false;
      for (let si = 0; si <= NC_STEPS; si++) {
        const C = si / NC_STEPS;
        // (TF-T)/tau + DH*k0*exp(-E/T)*C - 3*(T-Tc) = 0
        // Scan T and find zero crossing
        let prevVal = null as number | null;
        let prevT = 0;
        for (let ti = 1; ti <= 100; ti++) {
          const T = ti / 100;
          const rate_k = K0 * Math.exp(-E / (T + 1e-9));
          const val = (TF - T) / tau + DH * rate_k * C - 3.0 * (T - Tc);
          if (prevVal !== null && prevVal * val < 0) {
            const Tcross = prevT + (T - prevT) * Math.abs(prevVal) / (Math.abs(prevVal) + Math.abs(val));
            if (Tcross >= 0 && Tcross <= 1) {
              const [x, y] = toCanvas(C, Tcross);
              if (!startedT) { ctx.moveTo(x, y); startedT = true; }
              else ctx.lineTo(x, y);
            }
          }
          prevVal = val;
          prevT = T;
        }
      }
      ctx.stroke();

      // ---- Fixed points (intersections) ----
      // Find fixed points by searching for where both derivatives are ~0
      const FP_GRID = 60;
      const fixedPoints: Array<{ C: number; T: number; stable: boolean }> = [];
      for (let fi = 0; fi < FP_GRID; fi++) {
        for (let fj = 0; fj < FP_GRID; fj++) {
          const C = (fi + 0.5) / FP_GRID;
          const T = (fj + 0.5) / FP_GRID;
          const [dC, dT] = cstrDimless(C, T, tau, Tc);
          const mag = Math.sqrt(dC * dC + dT * dT);
          if (mag < 0.15) {
            // Refine with simple gradient descent
            let fc = C, ft = T;
            for (let k = 0; k < 30; k++) {
              const [dc2, dt2] = cstrDimless(fc, ft, tau, Tc);
              fc -= dc2 * 0.05;
              ft -= dt2 * 0.05;
              fc = Math.max(0.01, Math.min(0.99, fc));
              ft = Math.max(0.01, Math.min(0.99, ft));
            }
            const [dcf, dtf] = cstrDimless(fc, ft, tau, Tc);
            if (Math.sqrt(dcf * dcf + dtf * dtf) < 0.02) {
              // Check if this is a duplicate
              const dup = fixedPoints.some(
                (p) => Math.abs(p.C - fc) < 0.04 && Math.abs(p.T - ft) < 0.04
              );
              if (!dup) {
                // Stability: trace of Jacobian (approximate)
                const eps = 0.001;
                const [dCp, _1] = cstrDimless(fc + eps, ft, tau, Tc);
                const [dCm, _2] = cstrDimless(fc - eps, ft, tau, Tc);
                const [_3, dTp] = cstrDimless(fc, ft + eps, tau, Tc);
                const [_4, dTm] = cstrDimless(fc, ft - eps, tau, Tc);
                const traceJ = (dCp - dCm) / (2 * eps) + (dTp - dTm) / (2 * eps);
                fixedPoints.push({ C: fc, T: ft, stable: traceJ < 0 });
              }
            }
          }
        }
      }

      for (const fp of fixedPoints) {
        const [fx, fy] = toCanvas(fp.C, fp.T);
        const color = fp.stable ? "#34D399" : "#F87171";
        // Glow
        ctx.beginPath();
        ctx.arc(fx, fy, 7, 0, Math.PI * 2);
        ctx.fillStyle = fp.stable ? "rgba(52,211,153,0.15)" : "rgba(248,113,113,0.15)";
        ctx.fill();
        ctx.beginPath();
        ctx.arc(fx, fy, 4, 0, Math.PI * 2);
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(fx, fy, 2, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
      }

      // ---- User trajectory trail ----
      const trail = trailRef.current;
      if (trail.length > 1) {
        const MAX_AGE = trail.length - 1;
        for (let ti = 1; ti < trail.length; ti++) {
          const p0 = trail[ti - 1];
          const p1 = trail[ti];
          const alpha = 1.0 - p0.age / MAX_AGE;
          const [x0, y0] = toCanvas(p0.C, p0.T);
          const [x1, y1] = toCanvas(p1.C, p1.T);
          ctx.strokeStyle = `rgba(78,205,196,${alpha * 0.8})`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(x0, y0);
          ctx.lineTo(x1, y1);
          ctx.stroke();
        }
        // Arrow at end
        if (trail.length >= 3) {
          const last = trail[trail.length - 1];
          const prev = trail[trail.length - 3];
          const [lx, ly] = toCanvas(last.C, last.T);
          const [px2, py2] = toCanvas(prev.C, prev.T);
          const angle = Math.atan2(ly - py2, lx - px2);
          const hs = 5;
          ctx.fillStyle = "#4ECDC4";
          ctx.beginPath();
          ctx.moveTo(lx, ly);
          ctx.lineTo(lx - hs * Math.cos(angle - 0.4), ly - hs * Math.sin(angle - 0.4));
          ctx.lineTo(lx - hs * Math.cos(angle + 0.4), ly - hs * Math.sin(angle + 0.4));
          ctx.closePath();
          ctx.fill();
        }
        // IC dot
        const ic = trail[0];
        const [icx, icy] = toCanvas(ic.C, ic.T);
        ctx.beginPath();
        ctx.arc(icx, icy, 3, 0, Math.PI * 2);
        ctx.fillStyle = "#4ECDC4";
        ctx.fill();
      }

      // ---- Legend ----
      const legX = padL + plotW - 5;
      const legY = padT + 10;
      const legFs = Math.max(8, cssW * 0.012);
      ctx.font = `${legFs}px monospace`;

      ctx.strokeStyle = "#4ECDC4";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(legX - 60, legY);
      ctx.lineTo(legX - 44, legY);
      ctx.stroke();
      ctx.fillStyle = "#71717a";
      ctx.textAlign = "left";
      ctx.fillText("dC/dt=0", legX - 42, legY + 3);

      ctx.strokeStyle = "#C9A04A";
      ctx.beginPath();
      ctx.moveTo(legX - 60, legY + 12);
      ctx.lineTo(legX - 44, legY + 12);
      ctx.stroke();
      ctx.fillText("dT/dt=0", legX - 42, legY + 15);

      // Stable/unstable legend
      ctx.beginPath();
      ctx.arc(legX - 53, legY + 27, 3, 0, Math.PI * 2);
      ctx.fillStyle = "#34D399";
      ctx.fill();
      ctx.fillStyle = "#71717a";
      ctx.fillText("stable", legX - 42, legY + 30);

      ctx.beginPath();
      ctx.arc(legX - 53, legY + 39, 3, 0, Math.PI * 2);
      ctx.fillStyle = "#F87171";
      ctx.fill();
      ctx.fillStyle = "#71717a";
      ctx.fillText("unstable", legX - 42, legY + 42);

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
        <span className="text-xs font-mono text-zinc-400">CSTR phase portrait — nullclines &amp; vector field</span>
        <span className="text-xs font-mono text-teal-400">click to place IC</span>
      </div>
      <div
        ref={wrapRef}
        className="relative overflow-hidden"
        style={{ aspectRatio: "100/80", cursor: "crosshair" }}
        onClick={handleCanvasClick}
      >
        <canvas ref={canvasRef} className="absolute top-0 left-0" />
      </div>
      <div className="px-4 py-3 border-t border-zinc-800 flex flex-wrap gap-x-6 gap-y-2 items-center">
        <label className="flex items-center gap-2 text-xs font-mono text-zinc-400">
          <span className="text-zinc-300">&tau;</span> (residence time)
          <input
            type="range"
            min={0.5}
            max={3.0}
            step={0.05}
            value={tau}
            onChange={(e) => setTau(Number(e.target.value))}
            className="w-24 accent-teal-400"
          />
          <span className="text-zinc-300 w-8 text-right">{tau.toFixed(2)}</span>
        </label>
        <label className="flex items-center gap-2 text-xs font-mono text-zinc-400">
          <span className="text-zinc-300">T<sub>c</sub></span> (coolant)
          <input
            type="range"
            min={0.1}
            max={0.5}
            step={0.01}
            value={Tc}
            onChange={(e) => setTc(Number(e.target.value))}
            className="w-24 accent-amber-400"
          />
          <span className="text-zinc-300 w-8 text-right">{Tc.toFixed(2)}</span>
        </label>
      </div>
      <div className="px-4 py-2 border-t border-zinc-800 text-xs font-mono text-zinc-500">
        teal nullcline: dC/dt=0 &nbsp;|&nbsp; amber nullcline: dT/dt=0 &nbsp;|&nbsp; intersections are fixed points. Click the phase plane to integrate a trajectory.
      </div>
    </div>
  );
}
