/**
 * OrbitalDiagram — Animated energy level diagram that fills electrons
 * into orbitals following aufbau order. Shows the core mechanic of
 * Orbital Architect: electrons dropping into slots one by one.
 */
import { useState, useEffect, useRef, useMemo } from "react";
import { motion, useInView } from "motion/react";

interface Props {
  element?: string;
  atomicNumber?: number;
  className?: string;
}

interface OrbitalSlot {
  shell: number;
  subshell: string;
  ml: number;
  capacity: 2;
  label: string;
  energy: number; // y-position ranking (lower = higher energy)
}

// Aufbau filling order
const AUFBAU_ORDER: { shell: number; subshell: string; count: number }[] = [
  { shell: 1, subshell: "s", count: 1 },
  { shell: 2, subshell: "s", count: 1 },
  { shell: 2, subshell: "p", count: 3 },
  { shell: 3, subshell: "s", count: 1 },
  { shell: 3, subshell: "p", count: 3 },
  { shell: 4, subshell: "s", count: 1 },
  { shell: 3, subshell: "d", count: 5 },
  { shell: 4, subshell: "p", count: 3 },
];

const SUBSHELL_COLORS: Record<string, string> = {
  s: "#C9A04A",
  p: "#4ECDC4",
  d: "#A78BFA",
};

function buildOrbitals(): OrbitalSlot[] {
  const orbitals: OrbitalSlot[] = [];
  let energy = 0;
  for (const level of AUFBAU_ORDER) {
    for (let ml = 0; ml < level.count; ml++) {
      orbitals.push({
        shell: level.shell,
        subshell: level.subshell,
        ml,
        capacity: 2,
        label: `${level.shell}${level.subshell}`,
        energy: energy,
      });
    }
    energy++;
  }
  return orbitals;
}

// Fill electrons following aufbau + Hund's rule
function fillElectrons(orbitals: OrbitalSlot[], Z: number): { orbIdx: number; spin: "up" | "down" }[] {
  const electrons: { orbIdx: number; spin: "up" | "down" }[] = [];
  const orbElectrons: number[] = new Array(orbitals.length).fill(0);

  let remaining = Z;

  // Group orbitals by energy level for Hund's rule
  const energyGroups: Map<number, number[]> = new Map();
  orbitals.forEach((orb, i) => {
    if (!energyGroups.has(orb.energy)) energyGroups.set(orb.energy, []);
    energyGroups.get(orb.energy)!.push(i);
  });

  const sortedEnergies = Array.from(energyGroups.keys()).sort((a, b) => a - b);

  for (const energy of sortedEnergies) {
    if (remaining <= 0) break;
    const group = energyGroups.get(energy)!;

    // First pass: one spin-up per orbital (Hund's rule)
    for (const idx of group) {
      if (remaining <= 0) break;
      electrons.push({ orbIdx: idx, spin: "up" });
      orbElectrons[idx]++;
      remaining--;
    }
    // Second pass: spin-down to pair
    for (const idx of group) {
      if (remaining <= 0) break;
      if (orbElectrons[idx] < 2) {
        electrons.push({ orbIdx: idx, spin: "down" });
        orbElectrons[idx]++;
        remaining--;
      }
    }
  }

  return electrons;
}

export default function OrbitalDiagram({
  element = "Fe",
  atomicNumber = 26,
  className = "",
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });
  const [filledCount, setFilledCount] = useState(0);
  const [showLabel, setShowLabel] = useState(false);

  const orbitals = useMemo(() => buildOrbitals(), []);
  const allElectrons = useMemo(() => fillElectrons(orbitals, atomicNumber), [orbitals, atomicNumber]);

  useEffect(() => {
    if (!isInView) return;
    let i = 0;
    const delay = setTimeout(() => {
      const id = setInterval(() => {
        i++;
        setFilledCount(i);
        if (i >= allElectrons.length) {
          clearInterval(id);
          setTimeout(() => setShowLabel(true), 300);
        }
      }, 60);
      return () => clearInterval(id);
    }, 400);
    return () => clearTimeout(delay);
  }, [isInView, allElectrons.length]);

  // Layout
  const W = 260;
  const H = 160;
  const levels = Array.from(new Set(orbitals.map((o) => o.energy))).sort((a, b) => a - b);
  const levelY = (energy: number) => H - 18 - (energy / (levels.length - 1)) * (H - 36);

  // Group orbitals by energy for layout
  const energyGroups: Map<number, number[]> = new Map();
  orbitals.forEach((orb, i) => {
    if (!energyGroups.has(orb.energy)) energyGroups.set(orb.energy, []);
    energyGroups.get(orb.energy)!.push(i);
  });

  // Build electron map for rendering
  const orbitalElectrons: Map<number, ("up" | "down")[]> = new Map();
  for (let i = 0; i < Math.min(filledCount, allElectrons.length); i++) {
    const e = allElectrons[i];
    if (!orbitalElectrons.has(e.orbIdx)) orbitalElectrons.set(e.orbIdx, []);
    orbitalElectrons.get(e.orbIdx)!.push(e.spin);
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 12 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={`rounded-lg bg-bg-secondary/50 border border-border overflow-hidden ${className}`}
    >
      <div className="px-3 py-1.5 flex items-center justify-between border-b border-border/50">
        <span className="text-[9px] font-mono text-text-muted/50 uppercase tracking-wider">Energy Level Diagram</span>
        {filledCount > 0 && filledCount < allElectrons.length && (
          <span className="flex items-center gap-1 text-[9px] font-mono text-accent/70">
            <span className="w-1 h-1 rounded-full bg-accent animate-pulse" />
            filling
          </span>
        )}
        {filledCount >= allElectrons.length && (
          <span className="text-[9px] font-mono text-[#34D399]/70">{atomicNumber}e⁻</span>
        )}
      </div>
      <div className="p-2">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
          {/* Energy axis */}
          <line x1="16" y1="10" x2="16" y2={H - 10} stroke="#222" strokeWidth="0.5" />
          <text x="8" y="14" fill="#333" fontSize="6" fontFamily="monospace" textAnchor="middle">E</text>
          {/* Arrow head */}
          <path d="M16 10 L14 16 L18 16 Z" fill="#333" />

          {/* Orbitals and electrons */}
          {levels.map((energy) => {
            const group = energyGroups.get(energy) ?? [];
            const y = levelY(energy);
            const totalWidth = group.length * 28;
            const startX = (W + 20) / 2 - totalWidth / 2;
            const label = orbitals[group[0]].label;
            const color = SUBSHELL_COLORS[orbitals[group[0]].subshell] ?? "#888";

            return (
              <g key={energy}>
                {/* Label */}
                <text x={startX - 8} y={y + 3} fill="#444" fontSize="7" fontFamily="monospace" textAnchor="end">
                  {label}
                </text>

                {/* Orbital slots */}
                {group.map((orbIdx, slotIdx) => {
                  const x = startX + slotIdx * 28;
                  const electrons = orbitalElectrons.get(orbIdx) ?? [];

                  return (
                    <g key={orbIdx}>
                      {/* Slot line */}
                      <line
                        x1={x} y1={y} x2={x + 20} y2={y}
                        stroke={electrons.length > 0 ? color : "#2a2a2a"}
                        strokeWidth="1.5"
                        opacity={electrons.length > 0 ? 0.8 : 0.4}
                      />

                      {/* Spin-up arrow */}
                      {electrons.includes("up") && (
                        <motion.g
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.25, ease: "easeOut" }}
                        >
                          <line
                            x1={x + 7} y1={y - 3} x2={x + 7} y2={y - 13}
                            stroke={color} strokeWidth="1.5" strokeLinecap="round"
                          />
                          <path
                            d={`M${x + 7} ${y - 14} L${x + 5} ${y - 10} L${x + 9} ${y - 10} Z`}
                            fill={color}
                          />
                        </motion.g>
                      )}

                      {/* Spin-down arrow */}
                      {electrons.includes("down") && (
                        <motion.g
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.25, ease: "easeOut" }}
                        >
                          <line
                            x1={x + 13} y1={y - 13} x2={x + 13} y2={y - 3}
                            stroke={color} strokeWidth="1.5" strokeLinecap="round"
                          />
                          <path
                            d={`M${x + 13} ${y - 2} L${x + 11} ${y - 6} L${x + 15} ${y - 6} Z`}
                            fill={color}
                          />
                        </motion.g>
                      )}
                    </g>
                  );
                })}
              </g>
            );
          })}
        </svg>

        {/* Element label */}
        <motion.div
          className="flex items-center justify-between px-1 mt-1"
          initial={{ opacity: 0 }}
          animate={showLabel ? { opacity: 1 } : {}}
          transition={{ duration: 0.3 }}
        >
          <span className="text-[10px] font-mono text-text-primary">
            {element}
            <span className="text-text-muted/40 ml-1">Z={atomicNumber}</span>
          </span>
          <span className="text-[10px] font-mono text-accent/60">
            [Ar] 3d⁶ 4s²
          </span>
        </motion.div>
      </div>
    </motion.div>
  );
}
