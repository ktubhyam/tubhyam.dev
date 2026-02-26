'use client';

import { useCallback } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { useGameStore } from '@/stores/gameStore';
import { ProgressPulse } from '@/components/ui/TerminalEffects';
import type { Spin } from '@/types/chemistry';

function DraggableElectron({ id, spin, index }: { id: string; spin: Spin; index: number }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
    data: { spin },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: index * 0.03, type: 'spring', stiffness: 400, damping: 20 }}
      className={`electron flex items-center justify-center w-9 h-9 border border-accent/50 bg-accent/5 text-accent font-bold text-lg select-none transition-all ${
        isDragging ? 'dragging opacity-40 scale-110 z-50' : 'hover:bg-accent/15 hover:border-accent'
      }`}
    >
      {spin === 'up' ? '↑' : '↓'}
    </motion.div>
  );
}

export function ElectronTray() {
  const placedElectrons = useGameStore(s => s.placedElectrons);
  const totalElectrons = useGameStore(s => s.totalElectrons);
  const selectedSpin = useGameStore(s => s.selectedSpin);
  const setSelectedSpin = useGameStore(s => s.setSelectedSpin);

  const selectSpinUp = useCallback(() => setSelectedSpin('up'), [setSelectedSpin]);
  const selectSpinDown = useCallback(() => setSelectedSpin('down'), [setSelectedSpin]);

  const remaining = totalElectrons - placedElectrons;
  const fillProgress = totalElectrons > 0 ? placedElectrons / totalElectrons : 0;

  return (
    <div className="term-panel">
      <div className="term-header">
        electron supply
        <span className="ml-auto text-foreground/20 normal-case tracking-normal hidden sm:inline">
          drag into atom or click orbital
        </span>
        <span className="ml-auto text-foreground/20 normal-case tracking-normal sm:hidden">
          tap atom or orbital
        </span>
      </div>

      {/* Progress bar across full width */}
      <ProgressPulse
        progress={fillProgress}
        color={fillProgress >= 1 ? 'var(--success)' : 'var(--cyan)'}
        height={1}
      />

      <div className="flex items-center gap-3 px-3 py-2 font-mono text-xs">
        {/* Spin selector */}
        <div className="flex items-center gap-1">
          <span className="text-foreground/30 mr-1">spin:</span>
          <motion.button
            onClick={selectSpinUp}
            whileTap={{ scale: 0.9 }}
            aria-label="Select spin up"
            aria-pressed={selectedSpin === 'up'}
            className={`w-8 h-8 flex items-center justify-center text-base font-bold transition-all border focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan/60 ${
              selectedSpin === 'up'
                ? 'bg-accent/15 text-accent border-accent/60'
                : 'bg-transparent text-foreground/30 border-border hover:border-foreground/20'
            }`}
            style={selectedSpin === 'up' ? { boxShadow: '0 0 8px var(--accent-dim)' } : {}}
          >
            ↑
          </motion.button>
          <motion.button
            onClick={selectSpinDown}
            whileTap={{ scale: 0.9 }}
            aria-label="Select spin down"
            aria-pressed={selectedSpin === 'down'}
            className={`w-8 h-8 flex items-center justify-center text-base font-bold transition-all border focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan/60 ${
              selectedSpin === 'down'
                ? 'bg-accent/15 text-accent border-accent/60'
                : 'bg-transparent text-foreground/30 border-border hover:border-foreground/20'
            }`}
            style={selectedSpin === 'down' ? { boxShadow: '0 0 8px var(--accent-dim)' } : {}}
          >
            ↓
          </motion.button>
        </div>

        <div className="h-6 w-px bg-border" />

        {/* Electron supply — draggable on desktop, tap hint on mobile */}
        <div className="flex items-center gap-1.5 flex-1 overflow-x-auto py-1">
          {remaining > 0 ? (
            <>
              {/* Draggable electrons — hidden on small screens */}
              <div className="hidden sm:flex items-center gap-1.5">
                {Array.from({ length: Math.min(remaining, 8) }).map((_, i) => (
                  <DraggableElectron
                    key={`e-${i}-${selectedSpin}`}
                    id={`electron-${i}`}
                    spin={selectedSpin}
                    index={i}
                  />
                ))}
                {remaining > 8 && (
                  <span className="text-foreground/30 ml-1">
                    +{remaining - 8}
                  </span>
                )}
              </div>
              {/* Mobile: compact remaining count + tap hint */}
              <div className="flex sm:hidden items-center gap-2 text-foreground/40">
                <span className="text-accent font-bold text-lg">{remaining}</span>
                <span className="text-[10px]">remaining — tap atom or orbital slot</span>
              </div>
            </>
          ) : (
            <motion.span
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              className="text-success/80"
              style={{ textShadow: '0 0 8px var(--success)' }}
            >
              ✓ all electrons placed
            </motion.span>
          )}
        </div>

        {/* Counter */}
        <div className="text-foreground/40 shrink-0">
          <span className="text-accent font-bold">{placedElectrons}</span>
          <span className="text-foreground/20"> / </span>
          <span>{totalElectrons}</span>
        </div>
      </div>
    </div>
  );
}
