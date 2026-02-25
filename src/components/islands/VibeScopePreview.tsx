/**
 * VibeScopePreview — Animated SVG molecular vibration preview.
 * Shows a simple molecule (H2O) with atoms oscillating along normal mode vectors.
 * Auto-cycles through modes. No controls — pure visual preview.
 */
import { useRef, useEffect, useState } from "react";
import { motion, useInView } from "motion/react";

interface Props {
  className?: string;
}

interface Atom {
  x: number;
  y: number;
  r: number;
  color: string;
  label: string;
}

interface Mode {
  name: string;
  freq: string;
  // Displacement vectors [dx, dy] for each atom
  displacements: [number, number][];
}

// H2O molecule geometry (centered)
const ATOMS: Atom[] = [
  { x: 200, y: 80, r: 14, color: "#FF6B6B", label: "O" },
  { x: 140, y: 140, r: 10, color: "#fafafa", label: "H" },
  { x: 260, y: 140, r: 10, color: "#fafafa", label: "H" },
];

const BONDS: [number, number][] = [
  [0, 1],
  [0, 2],
];

// Three normal modes of H2O
const MODES: Mode[] = [
  {
    name: "symmetric stretch",
    freq: "3657 cm⁻¹",
    displacements: [
      [0, 4],
      [-12, -8],
      [12, -8],
    ],
  },
  {
    name: "bending",
    freq: "1595 cm⁻¹",
    displacements: [
      [0, -6],
      [-10, 8],
      [10, 8],
    ],
  },
  {
    name: "asymmetric stretch",
    freq: "3756 cm⁻¹",
    displacements: [
      [6, 0],
      [-14, -8],
      [8, 10],
    ],
  },
];

const MODE_DURATION = 3000; // ms per mode

export default function VibeScopePreview({ className = "" }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: false, margin: "-40px" });
  const [modeIdx, setModeIdx] = useState(0);
  const animRef = useRef<number>(0);
  const startRef = useRef<number>(0);
  const [positions, setPositions] = useState(ATOMS.map((a) => ({ x: a.x, y: a.y })));

  useEffect(() => {
    if (!isInView) return;

    let currentMode = modeIdx;
    startRef.current = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startRef.current;

      // Cycle mode every MODE_DURATION ms
      if (elapsed > MODE_DURATION) {
        currentMode = (currentMode + 1) % MODES.length;
        setModeIdx(currentMode);
        startRef.current = now;
      }

      const mode = MODES[currentMode];
      const phase = ((elapsed % MODE_DURATION) / MODE_DURATION) * Math.PI * 4;
      const amplitude = Math.sin(phase);

      setPositions(
        ATOMS.map((atom, i) => ({
          x: atom.x + mode.displacements[i][0] * amplitude,
          y: atom.y + mode.displacements[i][1] * amplitude,
        }))
      );

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [isInView, modeIdx]);

  const mode = MODES[modeIdx];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`rounded-xl border border-border overflow-hidden bg-bg-secondary ${className}`}
    >
      <svg
        viewBox="0 0 400 200"
        className="w-full h-auto"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Background grid (subtle) */}
        {[100, 200, 300].map((x) => (
          <line key={`gv${x}`} x1={x} y1={0} x2={x} y2={200} stroke="#1a1a1a" strokeWidth="0.5" />
        ))}
        {[50, 100, 150].map((y) => (
          <line key={`gh${y}`} x1={0} y1={y} x2={400} y2={y} stroke="#1a1a1a" strokeWidth="0.5" />
        ))}

        {/* Bonds */}
        {BONDS.map(([a, b], i) => (
          <line
            key={`bond${i}`}
            x1={positions[a].x}
            y1={positions[a].y}
            x2={positions[b].x}
            y2={positions[b].y}
            stroke="#555"
            strokeWidth={3}
            strokeLinecap="round"
          />
        ))}

        {/* Atoms */}
        {ATOMS.map((atom, i) => (
          <g key={`atom${i}`}>
            <circle
              cx={positions[i].x}
              cy={positions[i].y}
              r={atom.r}
              fill={atom.color}
              opacity={0.9}
            />
            <text
              x={positions[i].x}
              y={positions[i].y + 4}
              textAnchor="middle"
              fill={atom.label === "O" ? "#fff" : "#111"}
              fontSize="10"
              fontFamily="monospace"
              fontWeight="bold"
            >
              {atom.label}
            </text>
          </g>
        ))}

        {/* Mode info */}
        <text x={12} y={190} fill="#C9A04A" fontSize="10" fontFamily="monospace">
          ν = {mode.freq}
        </text>
        <text x={388} y={190} textAnchor="end" fill="#666" fontSize="9" fontFamily="monospace">
          {mode.name}
        </text>

        {/* Mode indicator dots */}
        {MODES.map((_, i) => (
          <circle
            key={`dot${i}`}
            cx={192 + i * 16}
            cy={190}
            r={3}
            fill={i === modeIdx ? "#C9A04A" : "#333"}
          />
        ))}
      </svg>
    </motion.div>
  );
}
