/**
 * SymmetryExplorer — Interactive point group analysis for spectral identifiability.
 * Pick a molecule, see its point group, IR/Raman active modes, silent modes,
 * and the Information Completeness Ratio R(G,N).
 */
import { useState, useRef, useMemo } from "react";
import { motion, useInView } from "motion/react";

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
  overlap: number; // modes active in both IR and Raman
  centrosymmetric: boolean;
}

const MOLECULES: MoleculeInfo[] = [
  { name: "Water", formula: "H\u2082O", pointGroup: "C\u2082v", nAtoms: 3, linear: false, irActive: 3, ramanActive: 3, silent: 0, overlap: 3, centrosymmetric: false },
  { name: "Ammonia", formula: "NH\u2083", pointGroup: "C\u2083v", nAtoms: 4, linear: false, irActive: 6, ramanActive: 6, silent: 0, overlap: 6, centrosymmetric: false },
  { name: "Methane", formula: "CH\u2084", pointGroup: "T\u1d48", nAtoms: 5, linear: false, irActive: 2, ramanActive: 4, silent: 3, overlap: 0, centrosymmetric: false },
  { name: "Benzene", formula: "C\u2086H\u2086", pointGroup: "D\u2086h", nAtoms: 12, linear: false, irActive: 7, ramanActive: 12, silent: 11, overlap: 0, centrosymmetric: true },
  { name: "Carbon dioxide", formula: "CO\u2082", pointGroup: "D\u221Eh", nAtoms: 3, linear: true, irActive: 3, ramanActive: 1, silent: 0, overlap: 0, centrosymmetric: true },
  { name: "Acetylene", formula: "C\u2082H\u2082", pointGroup: "D\u221Eh", nAtoms: 4, linear: true, irActive: 3, ramanActive: 3, silent: 1, overlap: 0, centrosymmetric: true },
  { name: "Formaldehyde", formula: "H\u2082CO", pointGroup: "C\u2082v", nAtoms: 4, linear: false, irActive: 6, ramanActive: 6, silent: 0, overlap: 6, centrosymmetric: false },
  { name: "Ethylene", formula: "C\u2082H\u2084", pointGroup: "D\u2082h", nAtoms: 6, linear: false, irActive: 5, ramanActive: 6, silent: 1, overlap: 0, centrosymmetric: true },
  { name: "HCN", formula: "HCN", pointGroup: "C\u221Ev", nAtoms: 3, linear: true, irActive: 3, ramanActive: 3, silent: 0, overlap: 3, centrosymmetric: false },
  { name: "SF\u2086", formula: "SF\u2086", pointGroup: "O\u2095", nAtoms: 7, linear: false, irActive: 6, ramanActive: 3, silent: 6, overlap: 0, centrosymmetric: true },
  { name: "Methanol", formula: "CH\u2083OH", pointGroup: "C\u209B", nAtoms: 6, linear: false, irActive: 12, ramanActive: 12, silent: 0, overlap: 12, centrosymmetric: false },
  { name: "Ethanol", formula: "C\u2082H\u2085OH", pointGroup: "C\u2081", nAtoms: 9, linear: false, irActive: 21, ramanActive: 21, silent: 0, overlap: 21, centrosymmetric: false },
];

export default function SymmetryExplorer({ className = "" }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const [selectedIdx, setSelectedIdx] = useState(0);

  const mol = MOLECULES[selectedIdx];
  const totalModes = mol.linear ? 3 * mol.nAtoms - 5 : 3 * mol.nAtoms - 6;
  const uniqueObservable = mol.irActive + mol.ramanActive - mol.overlap;
  const R = totalModes > 0 ? uniqueObservable / totalModes : 0;

  // SVG bar chart dimensions
  const W = 300;
  const H = 120;
  const barH = 16;
  const barGap = 6;
  const labelW = 60;
  const barW = W - labelW - 10;

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
          symmetry_explorer.py
        </span>
        <span className="ml-auto text-[10px] font-mono text-teal">interactive</span>
      </div>

      <div className="p-4">
        {/* Molecule selector */}
        <div className="flex flex-wrap gap-2 mb-4">
          {MOLECULES.map((m, i) => (
            <button
              key={i}
              onClick={() => setSelectedIdx(i)}
              className={`px-2.5 py-1 text-[11px] font-mono rounded-md border transition-all ${
                i === selectedIdx
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border text-text-muted hover:text-text-secondary hover:border-border"
              }`}
            >
              {m.formula}
            </button>
          ))}
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="bg-surface rounded-lg p-3 border border-border">
            <div className="text-[10px] font-mono text-text-muted mb-1">molecule</div>
            <div className="text-sm font-mono text-text-primary">{mol.name}</div>
          </div>
          <div className="bg-surface rounded-lg p-3 border border-border">
            <div className="text-[10px] font-mono text-text-muted mb-1">point group</div>
            <div className="text-sm font-mono text-text-primary">{mol.pointGroup}</div>
          </div>
          <div className="bg-surface rounded-lg p-3 border border-border">
            <div className="text-[10px] font-mono text-text-muted mb-1">atoms</div>
            <div className="text-sm font-mono text-text-primary">{mol.nAtoms}</div>
          </div>
          <div className="bg-surface rounded-lg p-3 border border-border">
            <div className="text-[10px] font-mono text-text-muted mb-1">vibrational modes</div>
            <div className="text-sm font-mono text-text-primary">{totalModes}</div>
          </div>
        </div>

        {/* Mode breakdown SVG */}
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto mb-3" preserveAspectRatio="xMidYMid meet">
          {/* IR active */}
          <text x={0} y={barH - 3} fill="#FF6B6B" fontSize="9" fontFamily="monospace">IR active</text>
          <rect x={labelW} y={2} width={(mol.irActive / totalModes) * barW} height={barH} rx={3} fill="#FF6B6B" opacity={0.7} />
          <text x={labelW + (mol.irActive / totalModes) * barW + 4} y={barH - 3} fill="#FF6B6B" fontSize="8" fontFamily="monospace">
            {mol.irActive}
          </text>

          {/* Raman active */}
          <g transform={`translate(0, ${barH + barGap})`}>
            <text x={0} y={barH - 3} fill="#4ECDC4" fontSize="9" fontFamily="monospace">Raman</text>
            <rect x={labelW} y={2} width={(mol.ramanActive / totalModes) * barW} height={barH} rx={3} fill="#4ECDC4" opacity={0.7} />
            <text x={labelW + (mol.ramanActive / totalModes) * barW + 4} y={barH - 3} fill="#4ECDC4" fontSize="8" fontFamily="monospace">
              {mol.ramanActive}
            </text>
          </g>

          {/* Silent */}
          <g transform={`translate(0, ${2 * (barH + barGap)})`}>
            <text x={0} y={barH - 3} fill="#555" fontSize="9" fontFamily="monospace">Silent</text>
            <rect x={labelW} y={2} width={mol.silent > 0 ? (mol.silent / totalModes) * barW : 0} height={barH} rx={3} fill="#555" opacity={0.5} />
            {mol.silent > 0 && (
              <text x={labelW + (mol.silent / totalModes) * barW + 4} y={barH - 3} fill="#555" fontSize="8" fontFamily="monospace">
                {mol.silent}
              </text>
            )}
            {mol.silent === 0 && (
              <text x={labelW + 4} y={barH - 3} fill="#34D399" fontSize="8" fontFamily="monospace">
                none
              </text>
            )}
          </g>

          {/* R(G,N) bar */}
          <g transform={`translate(0, ${3 * (barH + barGap) + 4})`}>
            <text x={0} y={barH - 3} fill="#C9A04A" fontSize="9" fontFamily="monospace" fontWeight="bold">R(G,N)</text>
            <rect x={labelW} y={2} width={barW} height={barH} rx={3} fill="#222" />
            <rect x={labelW} y={2} width={R * barW} height={barH} rx={3} fill={R >= 1 ? "#34D399" : R > 0.8 ? "#C9A04A" : "#FF6B6B"} opacity={0.8} />
            <text
              x={labelW + R * barW + 4}
              y={barH - 3}
              fill={R >= 1 ? "#34D399" : R > 0.8 ? "#C9A04A" : "#FF6B6B"}
              fontSize="9"
              fontFamily="monospace"
              fontWeight="bold"
            >
              {R.toFixed(3)}
            </text>
          </g>
        </svg>

        {/* Insight text */}
        <div className="text-[11px] font-mono leading-relaxed space-y-1.5">
          {mol.centrosymmetric && (
            <p className="text-[#A78BFA]">
              Centrosymmetric (has inversion center) — IR and Raman modes are
              completely disjoint. Combined measurement is essential.
            </p>
          )}
          {R >= 1 ? (
            <p className="text-[#34D399]">
              R(G,N) = {R.toFixed(3)} — all {totalModes} vibrational modes are observable.
              Combined IR + Raman can uniquely determine the force constants (generic identifiability).
            </p>
          ) : (
            <p className="text-[#FF6B6B]">
              R(G,N) = {R.toFixed(3)} — {mol.silent} of {totalModes} modes are silent.
              These modes carry structural information that is permanently inaccessible
              to both IR and Raman spectroscopy.
            </p>
          )}
          {!mol.centrosymmetric && mol.overlap > 0 && (
            <p className="text-text-muted">
              {mol.overlap} mode{mol.overlap > 1 ? "s" : ""} active in both IR and Raman
              (non-centrosymmetric — no mutual exclusion rule).
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
