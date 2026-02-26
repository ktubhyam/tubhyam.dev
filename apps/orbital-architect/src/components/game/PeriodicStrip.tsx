'use client';

import { motion } from 'framer-motion';
import { useGameStore } from '@/stores/gameStore';
import { getElement, ELEMENTS } from '@/lib/chemistry';
import { SUBSHELL_COLORS } from '@/lib/chemistry/orbitals';

/**
 * Periodic table context strip — shows neighbors of the current element.
 * Gives spatial context (where am I in the periodic table?).
 */
export function PeriodicStrip() {
  const currentElement = useGameStore(s => s.currentElement);
  const placedElectrons = useGameStore(s => s.placedElectrons);
  const totalElectrons = useGameStore(s => s.totalElectrons);
  const isComplete = useGameStore(s => s.isComplete);

  // Show 5 neighbors: 2 before, current, 2 after
  const range: number[] = [];
  for (let z = currentElement - 2; z <= currentElement + 2; z++) {
    if (z >= 1 && z <= 36) range.push(z);
  }

  const getElementColor = (z: number): string => {
    if ([5,6,7,8,9,10,13,14,15,16,17,18,31,32,33,34,35,36].includes(z)) return SUBSHELL_COLORS.p;
    if (z >= 21 && z <= 30) return SUBSHELL_COLORS.d;
    return SUBSHELL_COLORS.s;
  };

  return (
    <div className="term-panel">
      <div className="term-header">
        periodic context
      </div>
      <div className="flex items-center justify-center gap-1 px-3 py-2 font-mono">
        {range.map((z) => {
          const el = getElement(z);
          const isCurrent = z === currentElement;
          const color = getElementColor(z);

          return (
            <motion.div
              key={z}
              className={`text-center px-1.5 py-1 border transition-all ${
                isCurrent
                  ? 'border-accent/60 bg-accent/10 scale-110'
                  : 'border-border/40 bg-transparent opacity-40'
              }`}
              animate={isCurrent && isComplete ? {
                borderColor: ['var(--accent)', 'var(--success)', 'var(--accent)'],
              } : {}}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              style={{ minWidth: 40 }}
            >
              <div className="text-[7px] text-foreground/25">{z}</div>
              <div
                className={`text-sm font-bold leading-tight ${isCurrent ? '' : ''}`}
                style={{ color: isCurrent ? 'var(--accent)' : color }}
              >
                {el.symbol}
              </div>
              {isCurrent && (
                <div className="text-[7px] text-foreground/30 mt-0.5">
                  {placedElectrons}/{totalElectrons}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
