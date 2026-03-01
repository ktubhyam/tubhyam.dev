/**
 * CSTRSimulator — Interactive CSTR phase portrait with parameter sliders.
 * Integrates the CSTR ODEs in real-time and renders concentration vs temperature.
 * Users adjust feed rate, coolant temperature, and activation energy.
 */
import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import { motion, useInView } from "motion/react";

interface Props {
  className?: string;
}

// CSTR parameters (dimensionless)
const DEFAULTS = {
  F_V: 1.0,       // F/V: dilution rate (1/min)
  CA0: 1.0,       // feed concentration (mol/L)
  T0: 350,        // feed temperature (K)
  Tc: 300,        // coolant temperature (K)
  k0: 7.2e10,     // pre-exponential (1/s)
  Ea_R: 8700,     // Ea/R (K)
  dHr: -5e4,      // heat of reaction (J/mol)
  rhoCp: 1000,    // rho * Cp (J/(L·K))
  UA_VrhoCp: 2.0, // UA/(V·rho·Cp) (1/min)
};

function cstrDerivatives(
  CA: number,
  T: number,
  params: typeof DEFAULTS
): [number, number] {
  const k = params.k0 * Math.exp(-params.Ea_R / T);
  const rate = k * CA;
  const dCA = params.F_V * (params.CA0 - CA) - rate;
  const dT =
    params.F_V * (params.T0 - T) +
    (-params.dHr / params.rhoCp) * rate -
    params.UA_VrhoCp * (T - params.Tc);
  return [dCA, dT];
}

function integrateRK4(
  CA0: number,
  T0: number,
  params: typeof DEFAULTS,
  dt: number,
  steps: number
): Array<{ CA: number; T: number }> {
  const traj: Array<{ CA: number; T: number }> = [{ CA: CA0, T: T0 }];
  let CA = CA0;
  let T = T0;
  for (let i = 0; i < steps; i++) {
    const [k1a, k1t] = cstrDerivatives(CA, T, params);
    const [k2a, k2t] = cstrDerivatives(CA + 0.5 * dt * k1a, T + 0.5 * dt * k1t, params);
    const [k3a, k3t] = cstrDerivatives(CA + 0.5 * dt * k2a, T + 0.5 * dt * k2t, params);
    const [k4a, k4t] = cstrDerivatives(CA + dt * k3a, T + dt * k3t, params);
    CA += (dt / 6) * (k1a + 2 * k2a + 2 * k3a + k4a);
    T += (dt / 6) * (k1t + 2 * k2t + 2 * k3t + k4t);
    CA = Math.max(0, Math.min(1.5, CA));
    T = Math.max(250, Math.min(550, T));
    if (i % 3 === 0) traj.push({ CA, T });
  }
  return traj;
}

export default function CSTRSimulator({ className = "" }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const [Tc, setTc] = useState(300);
  const [FV, setFV] = useState(1.0);
  const [EaR, setEaR] = useState(8700);
  const [showNeural, setShowNeural] = useState(false);

  const W = 440;
  const H = 220;
  const PAD = { top: 20, right: 20, bottom: 35, left: 40 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  // Scale: CA [0, 1], T [280, 500]
  const TMin = 280;
  const TMax = 500;

  const toSVG = useCallback(
    (CA: number, T: number) => ({
      x: PAD.left + ((T - TMin) / (TMax - TMin)) * plotW,
      y: PAD.top + plotH - CA * plotH,
    }),
    [plotW, plotH]
  );

  const params = useMemo(
    () => ({ ...DEFAULTS, Tc, F_V: FV, Ea_R: EaR }),
    [Tc, FV, EaR]
  );

  // Main trajectory from feed conditions
  const mainTraj = useMemo(() => {
    return integrateRK4(0.9, 310, params, 0.005, 3000);
  }, [params]);

  // Multiple initial conditions for phase portrait
  const trajectories = useMemo(() => {
    const ics = [
      { CA: 0.1, T: 420 },
      { CA: 0.5, T: 320 },
      { CA: 0.8, T: 460 },
      { CA: 0.3, T: 380 },
      { CA: 0.95, T: 290 },
    ];
    return ics.map((ic) => integrateRK4(ic.CA, ic.T, params, 0.005, 2000));
  }, [params]);

  // Steady state (end of main trajectory)
  const ss = mainTraj[mainTraj.length - 1];
  const ssSVG = toSVG(ss.CA, ss.T);

  function trajToPath(traj: Array<{ CA: number; T: number }>): string {
    return traj
      .map((pt, i) => {
        const { x, y } = toSVG(pt.CA, pt.T);
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`rounded-xl border border-border overflow-hidden bg-bg-secondary ${className}`}
    >
      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-surface border-b border-border">
        <div className="flex items-center gap-1.5">
          <div className="w-[10px] h-[10px] rounded-full bg-[#FF5F57]" />
          <div className="w-[10px] h-[10px] rounded-full bg-[#FEBC2E]" />
          <div className="w-[10px] h-[10px] rounded-full bg-[#28C840]" />
        </div>
        <span className="ml-2 text-[10px] font-mono text-text-muted/60 select-none">
          cstr_phase_portrait.py
        </span>
        <span className="ml-auto text-[10px] font-mono text-teal">interactive</span>
      </div>

      {/* Controls */}
      <div className="px-4 py-3 border-b border-border flex flex-wrap gap-x-5 gap-y-2 items-center">
        <label className="flex items-center gap-2 text-[11px] font-mono text-text-muted">
          T<sub>c</sub>
          <input
            type="range"
            min={250}
            max={380}
            value={Tc}
            onChange={(e) => setTc(Number(e.target.value))}
            className="w-16 accent-[#4ECDC4]"
          />
          <span className="text-text-secondary w-10 text-right">{Tc} K</span>
        </label>
        <label className="flex items-center gap-2 text-[11px] font-mono text-text-muted">
          F/V
          <input
            type="range"
            min={0.1}
            max={3.0}
            step={0.1}
            value={FV}
            onChange={(e) => setFV(Number(e.target.value))}
            className="w-16 accent-[#C9A04A]"
          />
          <span className="text-text-secondary w-10 text-right">{FV.toFixed(1)}</span>
        </label>
        <label className="flex items-center gap-2 text-[11px] font-mono text-text-muted">
          E<sub>a</sub>/R
          <input
            type="range"
            min={5000}
            max={12000}
            step={100}
            value={EaR}
            onChange={(e) => setEaR(Number(e.target.value))}
            className="w-16 accent-[#A78BFA]"
          />
          <span className="text-text-secondary w-10 text-right">{EaR}</span>
        </label>
        <button
          onClick={() => setShowNeural(!showNeural)}
          className={`ml-auto px-3 py-1 text-[11px] font-mono rounded-md border transition-colors ${
            showNeural
              ? "border-[#34D399] bg-[#34D399]/10 text-[#34D399]"
              : "border-border text-text-muted hover:text-text-secondary"
          }`}
        >
          {showNeural ? "neural ODE (illustrative)" : "classical"}
        </button>
      </div>

      {/* Phase portrait */}
      <div className="px-4 pt-3 pb-1">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full h-auto"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Grid */}
          {[0, 0.25, 0.5, 0.75, 1.0].map((v, i) => {
            const y = PAD.top + plotH - v * plotH;
            return (
              <g key={`h${i}`}>
                <line x1={PAD.left} y1={y} x2={PAD.left + plotW} y2={y} stroke="#1a1a1a" strokeWidth="0.5" />
                <text x={PAD.left - 4} y={y + 3} textAnchor="end" fill="#444" fontSize="7" fontFamily="monospace">
                  {v.toFixed(2)}
                </text>
              </g>
            );
          })}
          {[300, 350, 400, 450].map((t, i) => {
            const x = PAD.left + ((t - TMin) / (TMax - TMin)) * plotW;
            return (
              <g key={`v${i}`}>
                <line x1={x} y1={PAD.top} x2={x} y2={PAD.top + plotH} stroke="#1a1a1a" strokeWidth="0.5" />
                <text x={x} y={PAD.top + plotH + 12} textAnchor="middle" fill="#444" fontSize="7" fontFamily="monospace">
                  {t}
                </text>
              </g>
            );
          })}

          {/* Axes */}
          <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={PAD.top + plotH} stroke="#333" strokeWidth="1" />
          <line x1={PAD.left} y1={PAD.top + plotH} x2={PAD.left + plotW} y2={PAD.top + plotH} stroke="#333" strokeWidth="1" />

          {/* Axis labels */}
          <text
            x={PAD.left + plotW / 2}
            y={H - 4}
            textAnchor="middle"
            fill="#555"
            fontSize="7"
            fontFamily="monospace"
          >
            Temperature (K)
          </text>
          <text
            x={8}
            y={PAD.top + plotH / 2}
            textAnchor="middle"
            fill="#555"
            fontSize="7"
            fontFamily="monospace"
            transform={`rotate(-90, 8, ${PAD.top + plotH / 2})`}
          >
            C_A (mol/L)
          </text>

          {/* Phase trajectories (faint) */}
          {trajectories.map((traj, i) => (
            <path
              key={i}
              d={trajToPath(traj)}
              fill="none"
              stroke="#555"
              strokeWidth="0.8"
              opacity={0.3}
            />
          ))}

          {/* Main trajectory */}
          <path
            d={trajToPath(mainTraj)}
            fill="none"
            stroke="#C9A04A"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />

          {/* Neural ODE correction (offset trajectory) */}
          {showNeural && (
            <path
              d={trajToPath(
                mainTraj.map((pt) => ({
                  CA: pt.CA * 0.97 + 0.01,
                  T: pt.T + 3 * Math.sin((pt.T - 300) * 0.03),
                }))
              )}
              fill="none"
              stroke="#34D399"
              strokeWidth="1.5"
              strokeDasharray="4,2"
              strokeLinejoin="round"
            />
          )}

          {/* Steady state marker */}
          <circle cx={ssSVG.x} cy={ssSVG.y} r={4} fill="none" stroke="#C9A04A" strokeWidth="1.5" />
          <circle cx={ssSVG.x} cy={ssSVG.y} r={1.5} fill="#C9A04A" />
          <text
            x={ssSVG.x + 8}
            y={ssSVG.y - 6}
            fill="#C9A04A"
            fontSize="7"
            fontFamily="monospace"
          >
            SS ({ss.T.toFixed(0)} K, {ss.CA.toFixed(2)})
          </text>

          {/* Coolant temp line */}
          {(() => {
            const tcX = PAD.left + ((Tc - TMin) / (TMax - TMin)) * plotW;
            return tcX > PAD.left && tcX < PAD.left + plotW ? (
              <g>
                <line
                  x1={tcX}
                  y1={PAD.top}
                  x2={tcX}
                  y2={PAD.top + plotH}
                  stroke="#4ECDC4"
                  strokeWidth="0.8"
                  strokeDasharray="3,3"
                  opacity={0.5}
                />
                <text x={tcX} y={PAD.top - 3} textAnchor="middle" fill="#4ECDC4" fontSize="6" fontFamily="monospace">
                  T_c
                </text>
              </g>
            ) : null;
          })()}

          {/* Initial condition markers */}
          {trajectories.map((traj, i) => {
            const start = toSVG(traj[0].CA, traj[0].T);
            return (
              <circle
                key={i}
                cx={start.x}
                cy={start.y}
                r={2}
                fill="#555"
                opacity={0.5}
              />
            );
          })}

          {/* Legend */}
          <g transform={`translate(${PAD.left + plotW - 95}, ${PAD.top + 5})`}>
            <line x1={0} y1={0} x2={12} y2={0} stroke="#C9A04A" strokeWidth="1.5" />
            <text x={16} y={3} fill="#888" fontSize="7" fontFamily="monospace">classical</text>
            {showNeural && (
              <>
                <line x1={0} y1={12} x2={12} y2={12} stroke="#34D399" strokeWidth="1.5" strokeDasharray="4,2" />
                <text x={16} y={15} fill="#888" fontSize="7" fontFamily="monospace">neural ODE</text>
              </>
            )}
          </g>
        </svg>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 text-[10px] font-mono text-text-muted border-t border-border">
        {showNeural ? (
          <span>
            <span className="text-[#34D399]">Neural ODE</span> learns residual corrections to the
            classical model, tracking drift from catalyst aging and fouling.
          </span>
        ) : (
          <span>
            Adjust T<sub>c</sub>, F/V, and E<sub>a</sub>/R to explore how operating conditions
            affect the CSTR steady state. Multiple initial conditions show attraction basin.
          </span>
        )}
      </div>
    </motion.div>
  );
}
