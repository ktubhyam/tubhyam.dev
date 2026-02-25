/**
 * SymmetryExplorer — Animated preview card for the simulations page.
 * Shows a rotating 2D molecule with symmetry element overlays,
 * animated bar chart of mode activity, and auto-cycling molecules.
 */
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, useInView, AnimatePresence } from "motion/react";

interface Props {
  className?: string;
}

interface MoleculeInfo {
  name: string;
  formula: string;
  pointGroup: string;
  nAtoms: number;
  linear: boolean;
  irActive: number;
  ramanActive: number;
  silent: number;
  overlap: number;
  centrosymmetric: boolean;
  /** 2D atom positions for the preview SVG: [element, x, y][] */
  atoms: [string, number, number][];
  /** Bond pairs: [atomIdx, atomIdx][] */
  bonds: [number, number][];
  /** Symmetry elements to draw: { type, params }[] */
  symmetry: SymmetryViz[];
}

interface SymmetryViz {
  type: "axis" | "plane" | "center";
  label: string;
  /** For axis: [x1, y1, x2, y2], for plane: [x1, y1, x2, y2] */
  coords?: [number, number, number, number];
}

// Element colors (CPK)
const ELEM_COLORS: Record<string, string> = {
  H: "#dddddd", C: "#555", N: "#3050F8", O: "#FF4444",
  F: "#90E050", Cl: "#33DD33", S: "#FFDD00", Br: "#A62929",
  B: "#FFB5B5", Xe: "#66BBCC", P: "#FF8800", Fe: "#E06633",
};
const ELEM_RADII: Record<string, number> = {
  H: 4, C: 6, N: 5.5, O: 5, F: 4.5, Cl: 7, S: 7.5, Br: 8,
  B: 5.5, Xe: 9, P: 7, Fe: 7,
};

const CX = 80;
const CY = 60;
const SCALE = 28;

const MOLECULES: MoleculeInfo[] = [
  {
    name: "Water", formula: "H\u2082O", pointGroup: "C\u2082v",
    nAtoms: 3, linear: false, irActive: 3, ramanActive: 3, silent: 0, overlap: 3, centrosymmetric: false,
    atoms: [["O", 0, -0.15], ["H", -0.76, 0.46], ["H", 0.76, 0.46]],
    bonds: [[0, 1], [0, 2]],
    symmetry: [
      { type: "axis", label: "C\u2082", coords: [CX, CY - 38, CX, CY + 38] },
      { type: "plane", label: "\u03C3v", coords: [CX, CY - 36, CX, CY + 36] },
    ],
  },
  {
    name: "Ammonia", formula: "NH\u2083", pointGroup: "C\u2083v",
    nAtoms: 4, linear: false, irActive: 6, ramanActive: 6, silent: 0, overlap: 6, centrosymmetric: false,
    atoms: [["N", 0, -0.45], ["H", -0.82, 0.35], ["H", 0.82, 0.35], ["H", 0, 0.7]],
    bonds: [[0, 1], [0, 2], [0, 3]],
    symmetry: [
      { type: "axis", label: "C\u2083", coords: [CX, CY - 38, CX, CY + 38] },
    ],
  },
  {
    name: "CO\u2082", formula: "CO\u2082", pointGroup: "D\u221Eh",
    nAtoms: 3, linear: true, irActive: 3, ramanActive: 1, silent: 0, overlap: 0, centrosymmetric: true,
    atoms: [["C", 0, 0], ["O", -1.16, 0], ["O", 1.16, 0]],
    bonds: [[0, 1], [0, 2]],
    symmetry: [
      { type: "axis", label: "C\u221E", coords: [CX - 48, CY, CX + 48, CY] },
      { type: "center", label: "i" },
    ],
  },
  {
    name: "Benzene", formula: "C\u2086H\u2086", pointGroup: "D\u2086h",
    nAtoms: 12, linear: false, irActive: 7, ramanActive: 12, silent: 11, overlap: 0, centrosymmetric: true,
    atoms: [
      ["C", 0, -1.0], ["C", 0.866, -0.5], ["C", 0.866, 0.5],
      ["C", 0, 1.0], ["C", -0.866, 0.5], ["C", -0.866, -0.5],
      ["H", 0, -1.72], ["H", 1.49, -0.86], ["H", 1.49, 0.86],
      ["H", 0, 1.72], ["H", -1.49, 0.86], ["H", -1.49, -0.86],
    ],
    bonds: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,0],[0,6],[1,7],[2,8],[3,9],[4,10],[5,11]],
    symmetry: [
      { type: "axis", label: "C\u2086", coords: [CX, CY - 40, CX, CY + 40] },
      { type: "center", label: "i" },
    ],
  },
  {
    name: "Methane", formula: "CH\u2084", pointGroup: "T\u1D48",
    nAtoms: 5, linear: false, irActive: 2, ramanActive: 4, silent: 3, overlap: 0, centrosymmetric: false,
    atoms: [
      ["C", 0, 0], ["H", 0, -0.95], ["H", -0.9, 0.45],
      ["H", 0.9, 0.45], ["H", 0, 0.8],
    ],
    bonds: [[0,1],[0,2],[0,3],[0,4]],
    symmetry: [
      { type: "axis", label: "C\u2083", coords: [CX, CY - 38, CX, CY + 38] },
    ],
  },
  {
    name: "SF\u2086", formula: "SF\u2086", pointGroup: "O\u2095",
    nAtoms: 7, linear: false, irActive: 6, ramanActive: 3, silent: 6, overlap: 0, centrosymmetric: true,
    atoms: [
      ["S", 0, 0], ["F", 0, -1.1], ["F", 0, 1.1],
      ["F", -1.1, 0], ["F", 1.1, 0], ["F", -0.6, -0.6], ["F", 0.6, 0.6],
    ],
    bonds: [[0,1],[0,2],[0,3],[0,4],[0,5],[0,6]],
    symmetry: [
      { type: "axis", label: "C\u2084", coords: [CX, CY - 40, CX, CY + 40] },
      { type: "center", label: "i" },
    ],
  },
];

const CYCLE_MS = 4000;

export default function SymmetryExplorer({ className = "" }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const [idx, setIdx] = useState(0);
  const [animPhase, setAnimPhase] = useState(0); // 0 = bars grow, 1 = symmetry appear, 2 = hold

  const mol = MOLECULES[idx];
  const totalModes = mol.linear ? 3 * mol.nAtoms - 5 : 3 * mol.nAtoms - 6;
  const uniqueObservable = mol.irActive + mol.ramanActive - mol.overlap;
  const R = totalModes > 0 ? uniqueObservable / totalModes : 0;

  // Auto-cycle molecules
  useEffect(() => {
    if (!isInView) return;
    const id = setInterval(() => {
      setIdx((prev) => (prev + 1) % MOLECULES.length);
      setAnimPhase(0);
    }, CYCLE_MS);
    return () => clearInterval(id);
  }, [isInView]);

  // Animation phases: bars → symmetry elements → hold
  useEffect(() => {
    if (!isInView) return;
    const t1 = setTimeout(() => setAnimPhase(1), 600);
    const t2 = setTimeout(() => setAnimPhase(2), 1200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [idx, isInView]);

  // Bar chart dimensions
  const barW = 130;
  const barH = 10;
  const maxModes = Math.max(totalModes, 1);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`rounded-xl border border-border overflow-hidden bg-bg-secondary ${className}`}
    >
      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 py-2 bg-surface border-b border-border">
        <div className="flex items-center gap-1.5">
          <div className="w-[10px] h-[10px] rounded-full bg-[#FF5F57]" />
          <div className="w-[10px] h-[10px] rounded-full bg-[#FEBC2E]" />
          <div className="w-[10px] h-[10px] rounded-full bg-[#28C840]" />
        </div>
        <span className="ml-2 text-[10px] font-mono text-text-muted/60 select-none">
          symmetry_explorer
        </span>
        <span className="ml-auto flex items-center gap-1 text-[10px] font-mono text-teal">
          <span className="w-1.5 h-1.5 rounded-full bg-teal animate-pulse" />
          live
        </span>
      </div>

      <div className="p-4">
        <div className="flex gap-4">
          {/* Left: molecule SVG */}
          <div className="w-[160px] h-[120px] shrink-0 relative">
            <AnimatePresence mode="wait">
              <motion.svg
                key={idx}
                viewBox="0 0 160 120"
                className="w-full h-full"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
              >
                {/* Background grid */}
                <defs>
                  <pattern id="sym-grid" width="16" height="16" patternUnits="userSpaceOnUse">
                    <path d="M16 0H0V16" fill="none" stroke="#1a1a1a" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="160" height="120" fill="url(#sym-grid)" rx="6" />

                {/* Symmetry elements (fade in at phase 1) */}
                {animPhase >= 1 && mol.symmetry.map((sym, i) => {
                  if (sym.type === "axis" && sym.coords) {
                    const [x1, y1, x2, y2] = sym.coords;
                    return (
                      <motion.g key={`sym-${i}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.4, delay: i * 0.15 }}
                      >
                        <line
                          x1={x1} y1={y1} x2={x2} y2={y2}
                          stroke="#00D8FF" strokeWidth="1" strokeDasharray="4 3"
                          opacity={0.6}
                        />
                        <text
                          x={x2 + 4} y={y2 - 2}
                          fill="#00D8FF" fontSize="7" fontFamily="monospace" opacity={0.8}
                        >
                          {sym.label}
                        </text>
                      </motion.g>
                    );
                  }
                  if (sym.type === "plane" && sym.coords) {
                    const [x1, y1, x2, y2] = sym.coords;
                    return (
                      <motion.line key={`sym-${i}`}
                        x1={x1} y1={y1} x2={x2} y2={y2}
                        stroke="#C9A04A" strokeWidth="1.5" opacity={0.4}
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 0.4 }}
                        transition={{ duration: 0.5, delay: i * 0.15 }}
                      />
                    );
                  }
                  if (sym.type === "center") {
                    return (
                      <motion.circle key={`sym-${i}`}
                        cx={CX} cy={CY} r={3}
                        fill="none" stroke="#A78BFA" strokeWidth="1"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 0.8 }}
                        transition={{ duration: 0.3, delay: i * 0.15 }}
                      />
                    );
                  }
                  return null;
                })}

                {/* Bonds */}
                {mol.bonds.map(([a, b], i) => {
                  const [, ax, ay] = mol.atoms[a];
                  const [, bx, by] = mol.atoms[b];
                  return (
                    <motion.line key={`b-${i}`}
                      x1={CX + ax * SCALE} y1={CY + ay * SCALE}
                      x2={CX + bx * SCALE} y2={CY + by * SCALE}
                      stroke="#444" strokeWidth="2" strokeLinecap="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.3, delay: 0.05 * i }}
                    />
                  );
                })}

                {/* Atoms */}
                {mol.atoms.map(([elem, x, y], i) => (
                  <motion.g key={`a-${i}`}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.25, delay: 0.05 * i + 0.1, type: "spring", stiffness: 300 }}
                  >
                    <circle
                      cx={CX + x * SCALE}
                      cy={CY + y * SCALE}
                      r={ELEM_RADII[elem] ?? 5}
                      fill={ELEM_COLORS[elem] ?? "#888"}
                      opacity={0.9}
                    />
                    <text
                      x={CX + x * SCALE}
                      y={CY + y * SCALE + 3}
                      textAnchor="middle"
                      fill={elem === "C" || elem === "Br" ? "#ccc" : "#111"}
                      fontSize="7"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      {elem}
                    </text>
                  </motion.g>
                ))}
              </motion.svg>
            </AnimatePresence>
          </div>

          {/* Right: info + bars */}
          <div className="flex-1 min-w-0">
            {/* Molecule name + point group */}
            <AnimatePresence mode="wait">
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.2 }}
                className="mb-3"
              >
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-mono text-text-primary font-medium">
                    {mol.formula}
                  </span>
                  <span className="text-[10px] font-mono text-accent px-1.5 py-0.5 bg-accent/10 rounded">
                    {mol.pointGroup}
                  </span>
                </div>
                <div className="text-[10px] font-mono text-text-muted mt-0.5">
                  {mol.name} &middot; {totalModes} modes
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Animated bars */}
            <div className="space-y-1.5">
              <BarRow label="IR" count={mol.irActive} max={maxModes} color="#FF6B6B" delay={0} active={isInView} />
              <BarRow label="Raman" count={mol.ramanActive} max={maxModes} color="#4ECDC4" delay={0.1} active={isInView} />
              <BarRow label="Silent" count={mol.silent} max={maxModes} color="#555" delay={0.2} active={isInView} />
            </div>

            {/* R(G,N) */}
            <div className="mt-2.5">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[9px] font-mono text-text-muted">R(G,N)</span>
                <motion.span
                  key={`r-${idx}`}
                  className="text-[10px] font-mono font-bold"
                  style={{ color: R >= 1 ? "#34D399" : R > 0.8 ? "#C9A04A" : "#FF6B6B" }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  {R.toFixed(3)}
                </motion.span>
              </div>
              <div className="h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                <motion.div
                  key={`rbar-${idx}`}
                  className="h-full rounded-full"
                  style={{
                    backgroundColor: R >= 1 ? "#34D399" : R > 0.8 ? "#C9A04A" : "#FF6B6B",
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${R * 100}%` }}
                  transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom insight + mutual exclusion */}
        <AnimatePresence mode="wait">
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, delay: 0.5 }}
            className="mt-3 text-[10px] font-mono leading-relaxed"
          >
            {mol.centrosymmetric ? (
              <span className="text-[#A78BFA]">
                Centrosymmetric — mutual exclusion: IR and Raman modes are disjoint
              </span>
            ) : R >= 1 ? (
              <span className="text-[#34D399]">
                All {totalModes} modes observable — full spectral information
              </span>
            ) : (
              <span className="text-text-muted">
                {mol.silent} silent mode{mol.silent !== 1 ? "s" : ""} — information
                inaccessible to IR + Raman
              </span>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Molecule dots indicator */}
        <div className="flex items-center justify-center gap-1.5 mt-3">
          {MOLECULES.map((_, i) => (
            <button
              key={i}
              onClick={() => { setIdx(i); setAnimPhase(0); }}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                i === idx ? "bg-accent w-4" : "bg-[#333] hover:bg-[#555]"
              }`}
              aria-label={`Show ${MOLECULES[i].name}`}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/** Animated bar row */
function BarRow({
  label,
  count,
  max,
  color,
  delay,
  active,
}: {
  label: string;
  count: number;
  max: number;
  color: string;
  delay: number;
  active: boolean;
}) {
  const pct = max > 0 ? (count / max) * 100 : 0;

  return (
    <div className="flex items-center gap-2">
      <span className="text-[9px] font-mono w-10 text-right" style={{ color }}>
        {label}
      </span>
      <div className="flex-1 h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0, opacity: 0.5 }}
          animate={active ? { width: `${pct}%`, opacity: 0.8 } : {}}
          transition={{ duration: 0.5, delay, ease: "easeOut" }}
        />
      </div>
      <motion.span
        className="text-[9px] font-mono w-4 text-right"
        style={{ color }}
        initial={{ opacity: 0 }}
        animate={active ? { opacity: 1 } : {}}
        transition={{ delay: delay + 0.3 }}
      >
        {count}
      </motion.span>
    </div>
  );
}
