/**
 * VibeScopePreview — Animated SVG molecular vibration preview.
 * Supports H2O, CO2, NH3 with props-based molecule selection.
 * Shows atoms oscillating along normal mode vectors, auto-cycles through modes.
 */
import { useRef, useEffect, useState } from "react";
import { motion, useInView } from "motion/react";

export type MoleculeKey = "H2O" | "CO2" | "NH3";

interface Props {
  className?: string;
  molecule?: MoleculeKey;
}

interface Atom {
  x: number; y: number; r: number; color: string; label: string;
}
interface Mode {
  name: string; freq: string; displacements: [number, number][];
}
interface MoleculeData {
  label: string; atoms: Atom[]; bonds: [number, number][]; modes: Mode[];
}

const MOLECULES: Record<MoleculeKey, MoleculeData> = {
  H2O: {
    label: "H₂O",
    atoms: [
      { x: 200, y: 75,  r: 14, color: "#FF6B6B", label: "O" },
      { x: 140, y: 140, r: 10, color: "#dadada", label: "H" },
      { x: 260, y: 140, r: 10, color: "#dadada", label: "H" },
    ],
    bonds: [[0, 1], [0, 2]],
    modes: [
      { name: "symmetric stretch", freq: "3657 cm⁻¹", displacements: [[0,4],[-12,-8],[12,-8]] },
      { name: "scissor bend",      freq: "1595 cm⁻¹", displacements: [[0,-6],[-10,8],[10,8]]  },
      { name: "asymmetric stretch",freq: "3756 cm⁻¹", displacements: [[6,0],[-14,-8],[8,10]]  },
    ],
  },
  CO2: {
    label: "CO₂",
    atoms: [
      { x: 110, y: 100, r: 13, color: "#FF6B6B", label: "O" },
      { x: 200, y: 100, r: 12, color: "#888",    label: "C" },
      { x: 290, y: 100, r: 13, color: "#FF6B6B", label: "O" },
    ],
    bonds: [[0, 1], [1, 2]],
    modes: [
      { name: "asymmetric stretch", freq: "2349 cm⁻¹", displacements: [[14,0],[-5,0],[-14,0]] },
      { name: "bending",            freq: "667 cm⁻¹",  displacements: [[0,-10],[0,10],[0,-10]] },
      { name: "sym stretch",        freq: "1388 cm⁻¹", displacements: [[-12,0],[0,0],[12,0]]  },
    ],
  },
  NH3: {
    label: "NH₃",
    atoms: [
      { x: 200, y: 72,  r: 13, color: "#60A5FA", label: "N" },
      { x: 138, y: 148, r: 10, color: "#dadada", label: "H" },
      { x: 200, y: 168, r: 10, color: "#dadada", label: "H" },
      { x: 262, y: 148, r: 10, color: "#dadada", label: "H" },
    ],
    bonds: [[0, 1], [0, 2], [0, 3]],
    modes: [
      { name: "sym N-H stretch", freq: "3336 cm⁻¹", displacements: [[0,5],[-10,-8],[0,10],[10,-8]] },
      { name: "umbrella mode",   freq: "950 cm⁻¹",  displacements: [[0,-10],[5,8],[0,12],[-5,8]]   },
      { name: "asym N-H stretch",freq: "3414 cm⁻¹", displacements: [[4,2],[-14,-6],[12,8],[4,-8]] },
    ],
  },
};

const MODE_DURATION = 3000;
const MOLECULES_LIST: MoleculeKey[] = ["H2O", "CO2", "NH3"];

export default function VibeScopePreview({ className = "", molecule: moleculeProp }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: false, margin: "-40px" });

  const [selectedMol, setSelectedMol] = useState<MoleculeKey>(moleculeProp ?? "H2O");
  const [modeIdx, setModeIdx] = useState(0);
  const animRef = useRef<number>(0);
  const startRef = useRef<number>(0);

  const molData = MOLECULES[selectedMol];
  const [positions, setPositions] = useState(molData.atoms.map((a) => ({ x: a.x, y: a.y })));

  // Reset positions when molecule changes
  useEffect(() => {
    const data = MOLECULES[selectedMol];
    setPositions(data.atoms.map((a) => ({ x: a.x, y: a.y })));
    setModeIdx(0);
  }, [selectedMol]);

  useEffect(() => {
    if (!isInView) return;

    const data = MOLECULES[selectedMol];
    let currentMode = 0;
    setModeIdx(0);
    startRef.current = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startRef.current;
      if (elapsed > MODE_DURATION) {
        currentMode = (currentMode + 1) % data.modes.length;
        setModeIdx(currentMode);
        startRef.current = now;
      }
      const mode = data.modes[currentMode];
      const phase = ((elapsed % MODE_DURATION) / MODE_DURATION) * Math.PI * 4;
      const amplitude = Math.sin(phase);
      setPositions(
        data.atoms.map((atom, i) => ({
          x: atom.x + mode.displacements[i][0] * amplitude,
          y: atom.y + mode.displacements[i][1] * amplitude,
        }))
      );
      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [isInView, selectedMol]);

  const mode = molData.modes[modeIdx];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`rounded-xl border border-border overflow-hidden bg-bg-secondary ${className}`}
    >
      {/* Molecule selector */}
      <div className="flex items-center gap-1.5 px-3 py-2 bg-surface border-b border-border">
        <div className="flex items-center gap-1.5">
          <div className="w-[10px] h-[10px] rounded-full bg-[#FF5F57]" />
          <div className="w-[10px] h-[10px] rounded-full bg-[#FEBC2E]" />
          <div className="w-[10px] h-[10px] rounded-full bg-[#28C840]" />
        </div>
        <span className="ml-2 text-[10px] font-mono text-text-muted/60 mr-auto">vibescope — normal modes</span>
        <div className="flex gap-1">
          {MOLECULES_LIST.map((key) => (
            <button
              key={key}
              onClick={() => setSelectedMol(key)}
              className="text-[9px] font-mono px-2 py-0.5 rounded transition-all duration-150"
              style={{
                color: selectedMol === key ? "#C9A04A" : "#555",
                background: selectedMol === key ? "rgba(201,160,74,0.08)" : "transparent",
                border: `1px solid ${selectedMol === key ? "rgba(201,160,74,0.25)" : "#2a2a2a"}`,
              }}
            >
              {MOLECULES[key].label}
            </button>
          ))}
        </div>
      </div>

      <svg viewBox="0 0 400 200" className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
        {/* Background grid */}
        {[100, 200, 300].map((x) => (
          <line key={`gv${x}`} x1={x} y1={0} x2={x} y2={200} stroke="#1a1a1a" strokeWidth="0.5" />
        ))}
        {[50, 100, 150].map((y) => (
          <line key={`gh${y}`} x1={0} y1={y} x2={400} y2={y} stroke="#1a1a1a" strokeWidth="0.5" />
        ))}

        {/* Bonds */}
        {molData.bonds.map(([a, b], i) => (
          <line
            key={`bond${i}`}
            x1={positions[a].x} y1={positions[a].y}
            x2={positions[b].x} y2={positions[b].y}
            stroke="#3a3a3a"
            strokeWidth={selectedMol === "CO2" ? 4 : 3}
            strokeLinecap="round"
          />
        ))}
        {/* Double-bond visual for CO2 */}
        {selectedMol === "CO2" && molData.bonds.map(([a, b], i) => (
          <line
            key={`bond2${i}`}
            x1={positions[a].x}
            y1={positions[a].y + 5}
            x2={positions[b].x}
            y2={positions[b].y + 5}
            stroke="#2a2a2a"
            strokeWidth={1.5}
            strokeLinecap="round"
          />
        ))}

        {/* Atoms */}
        {molData.atoms.map((atom, i) => (
          <g key={`atom${i}`}>
            <circle
              cx={positions[i].x}
              cy={positions[i].y}
              r={atom.r}
              fill={atom.color}
              opacity={0.88}
            />
            <text
              x={positions[i].x}
              y={positions[i].y + 4}
              textAnchor="middle"
              fill={atom.color === "#dadada" ? "#111" : "#fff"}
              fontSize={atom.r > 12 ? "9" : "7"}
              fontFamily="monospace"
              fontWeight="bold"
            >
              {atom.label}
            </text>
          </g>
        ))}

        {/* Mode info */}
        <text x={12} y={192} fill="#C9A04A" fontSize="10" fontFamily="monospace">
          ν = {mode.freq}
        </text>
        <text x={388} y={192} textAnchor="end" fill="#555" fontSize="9" fontFamily="monospace">
          {mode.name}
        </text>

        {/* Mode indicator dots */}
        {molData.modes.map((_, i) => (
          <circle
            key={`dot${i}`}
            cx={194 + i * 14}
            cy={192}
            r={3}
            fill={i === modeIdx ? "#C9A04A" : "#2a2a2a"}
          />
        ))}
      </svg>
    </motion.div>
  );
}
