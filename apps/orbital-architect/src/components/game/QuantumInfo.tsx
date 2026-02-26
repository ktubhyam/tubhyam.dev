'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/stores/gameStore';
import { SUBSHELL_COLORS, getSubshellType } from '@/lib/chemistry';

const SUBSHELL_NAMES: Record<number, string> = {
  0: 's (sharp)',
  1: 'p (principal)',
  2: 'd (diffuse)',
  3: 'f (fundamental)',
};

const SUBSHELL_SHAPES: Record<number, string> = {
  0: 'spherical',
  1: 'dumbbell',
  2: 'cloverleaf',
  3: 'complex',
};

function getShellDescription(n: number): string {
  return `avg distance ~n\u00B2`;
}

function getMlDescription(l: number, ml: number): string {
  if (l === 0) return 'single orientation';
  if (l === 1) {
    const labels: Record<string, string> = { '-1': 'y-axis', '0': 'z-axis', '1': 'x-axis' };
    return labels[String(ml)] ?? 'spatial orientation';
  }
  return `orientation ${ml >= 0 ? '+' : ''}${ml} of ${2 * l + 1}`;
}

export function QuantumInfo() {
  const highlightedOrbitalId = useGameStore(s => s.highlightedOrbitalId);
  const orbitals = useGameStore(s => s.orbitals);

  const orbital = orbitals.find(o => o.id === highlightedOrbitalId);

  return (
    <AnimatePresence>
      {orbital && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          transition={{ duration: 0.15 }}
          className="term-panel"
        >
          <div className="term-header">
            quantum numbers
            <span
              className="ml-auto font-bold normal-case tracking-normal"
              style={{ color: SUBSHELL_COLORS[getSubshellType(orbital.l)] }}
            >
              {orbital.subshellLabel}
            </span>
          </div>

          <div className="p-2.5 font-mono text-[11px] space-y-1">
            <div className="flex justify-between">
              <span className="text-foreground/40">n =</span>
              <span className="font-bold">{orbital.n}</span>
              <span className="text-foreground/25 w-28 text-right truncate">shell {orbital.n}: {getShellDescription(orbital.n)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-foreground/40">l =</span>
              <span className="font-bold">{orbital.l}</span>
              <span className="text-foreground/25 w-28 text-right truncate">{SUBSHELL_SHAPES[orbital.l]} shape</span>
            </div>
            <div className="flex justify-between">
              <span className="text-foreground/40">ml =</span>
              <span className="font-bold">{orbital.ml >= 0 ? `+${orbital.ml}` : orbital.ml}</span>
              <span className="text-foreground/25 w-28 text-right truncate">{getMlDescription(orbital.l, orbital.ml)}</span>
            </div>
            <div className="border-t border-border my-1" />
            <div className="flex justify-between">
              <span className="text-foreground/40">e⁻</span>
              <span className="font-bold">{orbital.electrons.length}/2</span>
              <span className="text-foreground/25 w-24 text-right font-mono">
                {orbital.electrons.map(e => e.spin === 'up' ? '↑' : '↓').join(' ') || '—'}
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
