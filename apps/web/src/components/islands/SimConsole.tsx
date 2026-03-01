/**
 * SimConsole — Terminal-style simulation browser for the Explore section.
 * Left panel lists available simulations as ls -la rows with hover selection.
 * Right panel shows a rich detail view: animated canvas preview, description,
 * stats, and a launch button. VibScope gets a full VibeScopePreview component.
 * Rows animate in with staggered opacity on mount.
 */
import { useState, useEffect, useRef } from "react";
import VibeScopePreview from "./VibeScopePreview";

// ── Types ─────────────────────────────────────────────────────────────────────

type MiniVizKind =
  | "normal-modes"
  | "orbital-arch"
  | "symmetry"
  | "spec-to-struct";

interface Sim {
  name: string;
  description: string;
  stats: string;
  href: string;
  external?: boolean;
  featured?: boolean;
  vizKind?: MiniVizKind;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const AMBER = "rgba(201,160,74,";
const TEAL  = "rgba(78,205,196,";
const MUTED = "rgba(136,136,136,";

const MINI_CANVAS_H = 56;

const SIMS: Sim[] = [
  {
    name: "VibScope",
    description:
      "Physics-accurate vibrational mode simulation. Three.js + WebGL, 17 molecules, GIF export.",
    stats: "17 molecules \u00b7 3D \u00b7 60fps",
    href: "/simulations/vibescope",
    featured: true,
  },
  {
    name: "Normal Mode Explorer",
    description:
      "Interactive visualization of molecular vibrational modes. 45 molecules, 583 normal modes.",
    stats: "45 molecules \u00b7 583 modes",
    href: "/simulations/normal-mode-explorer",
    vizKind: "normal-modes",
  },
  {
    name: "Orbital Architect",
    description:
      "Visualize electron configuration using Aufbau principle, Pauli exclusion, and Hund\u2019s rules.",
    stats: "Aufbau \u00b7 Pauli \u00b7 Hund\u2019s rules",
    href: "https://orbital.tubhyam.dev",
    external: true,
    vizKind: "orbital-arch",
  },
  {
    name: "Symmetry Explorer",
    description:
      "Explore molecular point group symmetry. 15 point groups with character tables and basis functions.",
    stats: "15 point groups \u00b7 character tables",
    href: "/simulations/symmetry-explorer",
    vizKind: "symmetry",
  },
  {
    name: "Spectrum-to-Structure",
    description:
      "ML-powered spectral inversion demo. Submit an IR spectrum, get a predicted molecular structure.",
    stats: "ML-powered \u00b7 neural ODE backend",
    href: "/simulations/spectrum-to-structure",
    vizKind: "spec-to-struct",
  },
];

// ── Mini canvas draw functions ────────────────────────────────────────────────

function lorentz(x: number, c: number, w: number): number {
  return 1 / (1 + ((x - c) / w) ** 2);
}

/**
 * drawNormalModes — Three atoms oscillating perpendicular to bond axis.
 */
function drawNormalModes(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  t: number,
): void {
  const cx = W / 2;
  const cy = H / 2;
  const spacing = W * 0.22;
  const amp     = H * 0.22;
  const phase   = t * 0.002;

  const atomX = [cx - spacing, cx, cx + spacing];
  const disps  = [
    Math.sin(phase) * amp,
    -Math.sin(phase) * amp * 0.5,
    Math.sin(phase) * amp,
  ];

  // Bonds
  ctx.strokeStyle = MUTED + "0.35)";
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 2; i++) {
    ctx.beginPath();
    ctx.moveTo(atomX[i], cy + disps[i]);
    ctx.lineTo(atomX[i + 1], cy + disps[i + 1]);
    ctx.stroke();
  }

  // Atoms
  const radii = [7, 9, 7];
  const colors = [MUTED + "0.6)", AMBER + "0.75)", MUTED + "0.6)"];
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(atomX[i], cy + disps[i], radii[i], 0, Math.PI * 2);
    ctx.fillStyle = colors[i];
    ctx.fill();
  }

  // Displacement arrows (small ticks)
  ctx.strokeStyle = AMBER + "0.35)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    const dy = disps[i];
    if (Math.abs(dy) > 2) {
      ctx.beginPath();
      ctx.moveTo(atomX[i], cy);
      ctx.lineTo(atomX[i], cy + dy);
      ctx.stroke();
    }
  }
}

/**
 * drawOrbitalFill — Four orbital boxes, animate electrons filling one at a time.
 */
function drawOrbitalFill(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  t: number,
): void {
  const boxW  = 24;
  const boxH  = 18;
  const gap   = 8;
  const total = 4 * boxW + 3 * gap;
  const startX = (W - total) / 2;
  const startY = (H - boxH) / 2;

  // Cycle: fill 0 → 1 → 2 → 3 → 4 electrons, each holds for 600ms
  const state = Math.floor(t / 600) % 5;

  for (let i = 0; i < 4; i++) {
    const bx = startX + i * (boxW + gap);
    ctx.strokeStyle = MUTED + "0.35)";
    ctx.lineWidth = 1;
    ctx.strokeRect(bx, startY, boxW, boxH);

    if (i < state) {
      // filled electron dot
      ctx.beginPath();
      ctx.arc(bx + boxW / 2, startY + boxH / 2, 4, 0, Math.PI * 2);
      ctx.fillStyle = AMBER + "0.75)";
      ctx.fill();
    }
  }

  // Label
  ctx.font = `8px "JetBrains Mono", monospace`;
  ctx.fillStyle = MUTED + "0.4)";
  ctx.textAlign = "center";
  ctx.fillText("2s", W / 2, H - 4);
  ctx.textAlign = "left";
}

/**
 * drawSymmetry — Rotating equilateral triangle with C3 symmetry axes.
 */
function drawSymmetry(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  t: number,
): void {
  const cx    = W / 2;
  const cy    = H / 2;
  const r     = Math.min(W, H) * 0.32;
  const angle = t * 0.0005; // slow rotation

  const pts: [number, number][] = [];
  for (let i = 0; i < 3; i++) {
    const a = angle + (i * Math.PI * 2) / 3 - Math.PI / 2;
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }

  // Symmetry axes (dashed, from center to each vertex)
  ctx.setLineDash([3, 3]);
  ctx.strokeStyle = MUTED + "0.30)";
  ctx.lineWidth = 1;
  for (const [px, py] of pts) {
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(px, py);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // Triangle
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  ctx.lineTo(pts[1][0], pts[1][1]);
  ctx.lineTo(pts[2][0], pts[2][1]);
  ctx.closePath();
  ctx.strokeStyle = TEAL + "0.55)";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = TEAL + "0.06)";
  ctx.fill();

  // C3 label
  ctx.font = `8px "JetBrains Mono", monospace`;
  ctx.fillStyle = TEAL + "0.45)";
  ctx.textAlign = "center";
  ctx.fillText("C\u2083v", cx, cy + 3);
  ctx.textAlign = "left";
}

/**
 * drawSpecToStruct — Lorentzian spectrum on left, animated arrow, formula on right.
 */
function drawSpecToStruct(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  t: number,
): void {
  const halfW  = W * 0.42;
  const base   = H * 0.80;
  const amp    = H * 0.62;
  const peaks: [number, number][] = [[0.25, 0.7], [0.55, 1.0], [0.80, 0.55]];
  const N = Math.floor(halfW) * 2;

  // Spectrum (left half)
  ctx.beginPath();
  for (let i = 0; i <= N; i++) {
    const x = i / N;
    let y = 0;
    for (const [c, h] of peaks) y += lorentz(x, c, 0.06) * h;
    const sx = (x * halfW);
    const sy = base - Math.min(y, 1) * amp;
    i === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy);
  }
  ctx.strokeStyle = AMBER + "0.60)";
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Base axis for spectrum
  ctx.beginPath();
  ctx.moveTo(0, base);
  ctx.lineTo(halfW, base);
  ctx.strokeStyle = MUTED + "0.15)";
  ctx.lineWidth = 1;
  ctx.stroke();

  // Animated arrow in center
  const arrowCx   = W * 0.50;
  const arrowY    = H * 0.44;
  const arrowPulse = 0.5 + 0.5 * Math.sin(t * 0.004);
  ctx.font = `14px "JetBrains Mono", monospace`;
  ctx.fillStyle = `rgba(201,160,74,${0.3 + arrowPulse * 0.5})`;
  ctx.textAlign = "center";
  ctx.fillText("\u2192", arrowCx, arrowY + 5);
  ctx.textAlign = "left";

  // Formula (right half)
  const textX = W * 0.60;
  const textY = H * 0.50;
  ctx.font = `10px "JetBrains Mono", monospace`;
  ctx.fillStyle = TEAL + "0.70)";
  ctx.fillText("CH\u2083\u2013CO", textX, textY - 4);
  ctx.fillText("\u2013CH\u2083", textX + 6, textY + 10);
}

// ── Mini canvas component ─────────────────────────────────────────────────────

interface MiniCanvasProps {
  vizKind: MiniVizKind;
  reduced: boolean;
}

function MiniCanvas({ vizKind, reduced }: MiniCanvasProps) {
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
        case "normal-modes":   drawNormalModes(ctx, W, H, t);   break;
        case "orbital-arch":   drawOrbitalFill(ctx, W, H, t);   break;
        case "symmetry":       drawSymmetry(ctx, W, H, t);       break;
        case "spec-to-struct": drawSpecToStruct(ctx, W, H, t);  break;
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
      className="w-full block rounded"
      style={{ height: MINI_CANVAS_H }}
      aria-hidden="true"
    />
  );
}

// ── Right panel: detail view for non-VibScope sims ───────────────────────────

interface SimDetailProps {
  sim: Sim;
  reduced: boolean;
  visible: boolean;
}

function SimDetail({ sim, reduced, visible }: SimDetailProps) {
  const handleLaunch = () => {
    if (sim.external) {
      window.open(sim.href, "_blank", "noopener,noreferrer");
    } else {
      window.location.href = sim.href;
    }
  };

  return (
    <div
      className="flex flex-col gap-3 h-full transition-opacity duration-150"
      style={{ opacity: visible ? 1 : 0 }}
    >
      <div>
        <h3 className="text-base font-heading font-semibold text-text-primary mb-1">
          {sim.name}
        </h3>
        <p className="text-[12px] text-text-secondary leading-relaxed">
          {sim.description}
        </p>
      </div>

      {/* Stats tags */}
      <div className="flex flex-wrap gap-1.5">
        {sim.stats.split(" \u00b7 ").map((tag) => (
          <span
            key={tag}
            className="text-[10px] font-mono text-text-muted border border-border rounded-full px-2.5 py-0.5"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Mini canvas */}
      {sim.vizKind && (
        <div className="rounded border border-border bg-[#080808] overflow-hidden">
          <MiniCanvas vizKind={sim.vizKind} reduced={reduced} />
        </div>
      )}

      {/* Launch button */}
      <div className="mt-auto">
        <button
          onClick={handleLaunch}
          className="text-[11px] font-mono text-accent hover:text-accent-bright transition-colors flex items-center gap-1"
        >
          Launch simulation →
          {sim.external && (
            <span className="text-[9px] text-text-muted ml-1">(external)</span>
          )}
        </button>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function SimConsole() {
  const [activeSim, setActiveSim] = useState<number>(0);
  const [rowVisible, setRowVisible] = useState<boolean[]>(
    SIMS.map(() => false),
  );
  const [panelVisible, setPanelVisible] = useState<boolean>(true);
  const reducedRef  = useRef<boolean>(false);
  const pendingRef  = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    reducedRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reducedRef.current) {
      setRowVisible(SIMS.map(() => true));
      return;
    }

    const timers: ReturnType<typeof setTimeout>[] = [];
    SIMS.forEach((_, i) => {
      const t = setTimeout(() => {
        setRowVisible((prev) => {
          const next = [...prev];
          next[i] = true;
          return next;
        });
      }, i * 50);
      timers.push(t);
    });
    return () => timers.forEach(clearTimeout);
  }, []);

  const handleSimChange = (idx: number) => {
    if (idx === activeSim) return;
    // Cancel any in-flight transition before starting a new one
    if (pendingRef.current !== null) {
      clearTimeout(pendingRef.current);
      pendingRef.current = null;
      setPanelVisible(true);
    }
    if (reducedRef.current) {
      setActiveSim(idx);
      return;
    }
    setPanelVisible(false);
    pendingRef.current = setTimeout(() => {
      setActiveSim(idx);
      setPanelVisible(true);
      pendingRef.current = null;
    }, 130);
  };

  const sim = SIMS[activeSim];
  const reduced = reducedRef.current;

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-[#0c0c0c] w-full">
      {/* Terminal chrome header */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-[#090909] border-b border-border">
        <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F56]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#27C93F]" />
        <span className="text-[11px] font-mono text-text-muted ml-3">
          simulation-console
        </span>
        <span className="ml-auto text-[10px] font-mono text-text-muted/40">
          ~/simulations
        </span>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr]">
        {/* Left panel */}
        <div className="border-r border-border p-4 bg-[#0a0a0a]">
          {/* ls command */}
          <div className="font-mono text-[11px] text-text-muted mb-3">
            $ ls -la
          </div>

          {/* Sim rows */}
          <div className="flex flex-col gap-0.5">
            {SIMS.map((s, i) => {
              const isActive = activeSim === i;
              return (
                <div
                  key={s.name}
                  className="flex items-center justify-between rounded px-2 py-1.5 cursor-pointer transition-all duration-100"
                  style={{
                    opacity: rowVisible[i] ? 1 : 0,
                    transition: rowVisible[i]
                      ? "opacity 200ms ease, background-color 100ms"
                      : "none",
                    backgroundColor: isActive
                      ? "rgba(201,160,74,0.07)"
                      : "transparent",
                    borderLeft: isActive
                      ? "2px solid rgba(201,160,74,0.5)"
                      : "2px solid transparent",
                  }}
                  onMouseEnter={() => handleSimChange(i)}
                  onClick={() => {
                    if (s.external) {
                      window.open(s.href, "_blank", "noopener,noreferrer");
                    } else {
                      window.location.href = s.href;
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      if (s.external) {
                        window.open(s.href, "_blank", "noopener,noreferrer");
                      } else {
                        window.location.href = s.href;
                      }
                    }
                  }}
                  aria-current={isActive ? "page" : undefined}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="text-[11px] font-mono shrink-0"
                      style={{
                        color: isActive
                          ? "rgba(201,160,74,0.9)"
                          : "rgba(136,136,136,0.5)",
                      }}
                    >
                      {isActive ? "\u25b6" : "\u00b7"}
                    </span>
                    <span
                      className="text-[12px] font-mono truncate"
                      style={{
                        color: isActive ? "#F5F5F5" : "#888888",
                      }}
                    >
                      {s.name}
                    </span>
                  </div>
                  <div className="shrink-0 ml-2">
                    {s.featured ? (
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-[rgba(201,160,74,0.3)] text-[rgba(201,160,74,0.7)]">
                        feat
                      </span>
                    ) : (
                      <span className="text-[11px] font-mono text-text-muted/40">
                        →
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer count */}
          <div className="mt-4 font-mono text-[10px] text-text-muted/40">
            {SIMS.length} simulations
          </div>
        </div>

        {/* Right panel */}
        <div className="p-4 flex flex-col min-h-[280px]">
          {sim.featured ? (
            <div
              className="flex-1 min-h-0 overflow-hidden transition-opacity duration-150"
              style={{ opacity: panelVisible ? 1 : 0 }}
            >
              <VibeScopePreview />
            </div>
          ) : (
            <SimDetail
              key={activeSim}
              sim={sim}
              reduced={reduced}
              visible={panelVisible}
            />
          )}
        </div>
      </div>
    </div>
  );
}
