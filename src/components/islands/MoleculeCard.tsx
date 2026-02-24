/**
 * MoleculeCard — Animated 2D molecular structure with rotating bonds.
 * Draws atoms as colored circles and bonds as lines, with a subtle
 * breathing/pulsing animation. Rendered as SVG.
 */
import { useState, useEffect, useRef, useMemo } from "react";
import { motion, useInView } from "motion/react";

interface Atom {
  x: number;
  y: number;
  element: string;
  color: string;
}

interface Bond {
  from: number;
  to: number;
  order?: number; // 1 = single, 2 = double
}

interface Props {
  atoms?: Atom[];
  bonds?: Bond[];
  label?: string;
  formula?: string;
  title?: string;
  className?: string;
}

// Benzene ring
const DEFAULT_ATOMS: Atom[] = [
  { x: 200, y: 80, element: "C", color: "#888" },
  { x: 268, y: 120, element: "C", color: "#888" },
  { x: 268, y: 200, element: "C", color: "#888" },
  { x: 200, y: 240, element: "C", color: "#888" },
  { x: 132, y: 200, element: "C", color: "#888" },
  { x: 132, y: 120, element: "C", color: "#888" },
  // Hydrogens
  { x: 200, y: 30, element: "H", color: "#4ECDC4" },
  { x: 318, y: 95, element: "H", color: "#4ECDC4" },
  { x: 318, y: 225, element: "H", color: "#4ECDC4" },
  { x: 200, y: 290, element: "H", color: "#4ECDC4" },
  { x: 82, y: 225, element: "H", color: "#4ECDC4" },
  { x: 82, y: 95, element: "H", color: "#4ECDC4" },
];

const DEFAULT_BONDS: Bond[] = [
  { from: 0, to: 1, order: 2 },
  { from: 1, to: 2, order: 1 },
  { from: 2, to: 3, order: 2 },
  { from: 3, to: 4, order: 1 },
  { from: 4, to: 5, order: 2 },
  { from: 5, to: 0, order: 1 },
  // C-H bonds
  { from: 0, to: 6 },
  { from: 1, to: 7 },
  { from: 2, to: 8 },
  { from: 3, to: 9 },
  { from: 4, to: 10 },
  { from: 5, to: 11 },
];

export default function MoleculeCard({
  atoms = DEFAULT_ATOMS,
  bonds = DEFAULT_BONDS,
  label = "Benzene",
  formula = "C₆H₆",
  title = "molecule — structure viewer",
  className = "",
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const [drawProgress, setDrawProgress] = useState(0);
  const [showLabels, setShowLabels] = useState(false);

  useEffect(() => {
    if (!isInView) return;
    let frame: number;
    let start: number | null = null;
    const duration = 1500;

    function animate(timestamp: number) {
      if (!start) start = timestamp;
      const p = Math.min((timestamp - start) / duration, 1);
      setDrawProgress(p);
      if (p >= 1) {
        setTimeout(() => setShowLabels(true), 200);
      } else {
        frame = requestAnimationFrame(animate);
      }
    }

    const delay = setTimeout(() => {
      frame = requestAnimationFrame(animate);
    }, 300);

    return () => {
      clearTimeout(delay);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [isInView]);

  // How many bonds to show
  const visibleBonds = Math.floor(drawProgress * bonds.length);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`rounded-xl border border-[#1a1a1a] overflow-hidden bg-[#0a0a0a] ${className}`}
    >
      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-[#0f0f0f] border-b border-[#1a1a1a]">
        <div className="flex items-center gap-1.5">
          <div className="w-[10px] h-[10px] rounded-full bg-[#FF5F57]" />
          <div className="w-[10px] h-[10px] rounded-full bg-[#FEBC2E]" />
          <div className="w-[10px] h-[10px] rounded-full bg-[#28C840]" />
        </div>
        <span className="ml-2 text-[10px] font-mono text-[#444] select-none">{title}</span>
      </div>

      {/* Molecule SVG */}
      <div className="p-4">
        <svg viewBox="60 10 280 300" className="w-full h-auto max-h-[200px]" preserveAspectRatio="xMidYMid meet">
          {/* Bonds */}
          {bonds.slice(0, visibleBonds).map((bond, i) => {
            const a1 = atoms[bond.from];
            const a2 = atoms[bond.to];
            const isDouble = bond.order === 2;

            if (isDouble) {
              // Offset for double bond
              const dx = a2.x - a1.x;
              const dy = a2.y - a1.y;
              const len = Math.sqrt(dx * dx + dy * dy);
              const nx = (-dy / len) * 3;
              const ny = (dx / len) * 3;

              return (
                <g key={i}>
                  <motion.line
                    x1={a1.x + nx} y1={a1.y + ny}
                    x2={a2.x + nx} y2={a2.y + ny}
                    stroke="#444" strokeWidth="1.5"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.2 }}
                  />
                  <motion.line
                    x1={a1.x - nx} y1={a1.y - ny}
                    x2={a2.x - nx} y2={a2.y - ny}
                    stroke="#444" strokeWidth="1.5"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.2, delay: 0.05 }}
                  />
                </g>
              );
            }

            return (
              <motion.line
                key={i}
                x1={a1.x} y1={a1.y}
                x2={a2.x} y2={a2.y}
                stroke="#333" strokeWidth="1.5"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.2 }}
              />
            );
          })}

          {/* Atoms */}
          {atoms.map((atom, i) => {
            // Show atom when any connected bond is visible
            const isConnected = bonds.slice(0, visibleBonds).some(
              (b) => b.from === i || b.to === i
            );
            if (!isConnected && drawProgress < 1) return null;

            const isHydrogen = atom.element === "H";
            const radius = isHydrogen ? 6 : 10;

            return (
              <motion.g key={i}>
                {/* Glow */}
                <motion.circle
                  cx={atom.x} cy={atom.y} r={radius + 4}
                  fill={atom.color}
                  opacity={0}
                  animate={{ opacity: [0, 0.15, 0] }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    delay: i * 0.3,
                    ease: "easeInOut",
                  }}
                />
                {/* Atom circle */}
                <motion.circle
                  cx={atom.x} cy={atom.y} r={radius}
                  fill="#0a0a0a"
                  stroke={atom.color}
                  strokeWidth="1.5"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.2, type: "spring" }}
                />
                {/* Element label */}
                {!isHydrogen && (
                  <text
                    x={atom.x} y={atom.y + 3.5}
                    textAnchor="middle"
                    fill={atom.color}
                    fontSize="10"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    {atom.element}
                  </text>
                )}
                {isHydrogen && (
                  <text
                    x={atom.x} y={atom.y + 3}
                    textAnchor="middle"
                    fill={atom.color}
                    fontSize="8"
                    fontFamily="monospace"
                  >
                    {atom.element}
                  </text>
                )}
              </motion.g>
            );
          })}
        </svg>

        {/* Label */}
        <motion.div
          className="flex items-center justify-between mt-2 px-1"
          initial={{ opacity: 0 }}
          animate={showLabels ? { opacity: 1 } : {}}
          transition={{ duration: 0.3 }}
        >
          <span className="text-[11px] font-mono text-[#e0e0e0]">{label}</span>
          <span className="text-[11px] font-mono text-[#C9A04A]">{formula}</span>
        </motion.div>
      </div>
    </motion.div>
  );
}
