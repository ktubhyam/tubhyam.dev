'use client';

import { motion } from 'framer-motion';
import { useGameStore } from '@/stores/gameStore';
import { SUBSHELL_COLORS, getSubshellType, getSubshellLabel } from '@/lib/chemistry';

/**
 * Live electron configuration display.
 * Shows the building notation (1s² 2s² 2p⁶...) as electrons are placed.
 */
export function ElectronConfig() {
  const orbitals = useGameStore(s => s.orbitals);
  const placedElectrons = useGameStore(s => s.placedElectrons);

  if (placedElectrons === 0) {
    return (
      <div className="text-[10px] text-foreground/20 font-mono px-2 py-1">
        <span className="text-cyan/30">config:</span> —
      </div>
    );
  }

  // Build subshell electron counts from placed electrons
  const subshellCounts = new Map<string, { n: number; l: number; count: number }>();

  for (const orbital of orbitals) {
    if (orbital.electrons.length === 0) continue;
    const label = getSubshellLabel(orbital.n, orbital.l);
    const existing = subshellCounts.get(label);
    if (existing) {
      existing.count += orbital.electrons.length;
    } else {
      subshellCounts.set(label, {
        n: orbital.n,
        l: orbital.l,
        count: orbital.electrons.length,
      });
    }
  }

  const entries = Array.from(subshellCounts.entries());

  // Superscript map
  const superscripts: Record<string, string> = {
    '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
    '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
    '10': '¹⁰',
  };

  const toSuperscript = (n: number): string => {
    if (n <= 10) return superscripts[String(n)] ?? String(n);
    return String(n).split('').map(d => superscripts[d] ?? d).join('');
  };

  return (
    <div className="flex items-center gap-0.5 flex-wrap text-[11px] font-mono px-2 py-1 overflow-hidden">
      <span className="text-cyan/40 mr-1 shrink-0">config:</span>
      {entries.map(([label, { l, count }], i) => {
        const color = SUBSHELL_COLORS[getSubshellType(l)];
        return (
          <motion.span
            key={label}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="shrink-0"
          >
            <span style={{ color }} className="font-bold">
              {label}
            </span>
            <span className="text-foreground/50">
              {toSuperscript(count)}
            </span>
            {i < entries.length - 1 && (
              <span className="text-foreground/15 mx-px"> </span>
            )}
          </motion.span>
        );
      })}
    </div>
  );
}
