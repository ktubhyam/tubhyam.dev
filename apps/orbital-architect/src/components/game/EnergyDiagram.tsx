'use client';

import { useMemo, memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/stores/gameStore';
import { createSubshellGroups, SUBSHELL_COLORS } from '@/lib/chemistry';
import { usePlaceWithAudio } from '@/hooks/usePlaceWithAudio';
import type { OrbitalState, SubshellType, Spin } from '@/types/chemistry';

type PlaceWithAudioFn = (orbitalId: string, spin: Spin) => boolean;

const OrbitalSlot = memo(function OrbitalSlot({ orbital, subshellType, placeWithAudio }: { orbital: OrbitalState; subshellType: SubshellType; placeWithAudio: PlaceWithAudioFn }) {
  const highlightedOrbitalId = useGameStore(s => s.highlightedOrbitalId);
  const setHighlightedOrbital = useGameStore(s => s.setHighlightedOrbital);
  const selectedSpin = useGameStore(s => s.selectedSpin);
  const phase = useGameStore(s => s.phase);
  const color = SUBSHELL_COLORS[subshellType];
  const isHighlighted = highlightedOrbitalId === orbital.id;
  const isFilled = orbital.electrons.length > 0;
  const isFull = orbital.electrons.length >= 2;

  const handleClick = useCallback(() => {
    if (phase !== 'playing' || isFull) return;
    placeWithAudio(orbital.id, selectedSpin);
  }, [phase, isFull, orbital.id, selectedSpin, placeWithAudio]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }, [handleClick]);

  return (
    <motion.div
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={isFull ? -1 : 0}
      className={`orbital-slot relative flex items-center justify-center gap-0.5 border px-2 py-1.5 min-w-[52px] h-[42px] transition-all duration-200 cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan/60 ${
        isFull
          ? 'border-solid opacity-70 cursor-default'
          : 'border-dashed hover:border-solid'
      } ${isHighlighted ? 'ring-1 ring-cyan/50 ring-offset-1 ring-offset-background' : ''}`}
      style={{
        borderColor: isFilled ? color : `${color}40`,
        backgroundColor: isFilled ? `${color}08` : 'transparent',
        boxShadow: isHighlighted ? `0 0 8px ${color}30` : 'none',
      }}
      whileHover={!isFull ? { scale: 1.08 } : {}}
      whileTap={!isFull ? { scale: 0.95 } : {}}
      onMouseEnter={() => setHighlightedOrbital(orbital.id)}
      onMouseLeave={() => setHighlightedOrbital(null)}
      role="button"
      aria-label={`${orbital.subshellLabel} orbital, ${orbital.electrons.length} of 2 electrons${isFull ? ', full' : ''}`}
      aria-disabled={isFull}
      title={`${orbital.subshellLabel} — Click to place electron\n(n=${orbital.n}, l=${orbital.l}, ml=${orbital.ml})`}
    >
      <div className="flex items-center gap-0.5">
        <AnimatePresence>
          {orbital.electrons.map((electron, idx) => (
            <motion.span
              key={`${orbital.id}-${idx}`}
              initial={{ scale: 0, opacity: 0, y: -8 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
              className="text-lg font-bold leading-none"
              style={{ color, textShadow: `0 0 6px ${color}` }}
            >
              {electron.spin === 'up' ? '↑' : '↓'}
            </motion.span>
          ))}
        </AnimatePresence>

        {orbital.electrons.length < 2 && !isFull && (
          <motion.span
            className="text-lg leading-none opacity-15"
            style={{ color }}
            animate={{ opacity: [0.1, 0.2, 0.1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {orbital.electrons.length === 0 ? '_ _' : '_'}
          </motion.span>
        )}
      </div>
    </motion.div>
  );
});

export function EnergyDiagram() {
  const currentElement = useGameStore(s => s.currentElement);
  const orbitals = useGameStore(s => s.orbitals);
  const placeWithAudio = usePlaceWithAudio();

  const groups = useMemo(() => createSubshellGroups(currentElement), [currentElement]);

  const mergedGroups = useMemo(() => groups.map(group => ({
    ...group,
    orbitals: group.orbitals.map(groupOrbital => {
      const stateOrbital = orbitals.find(o => o.id === groupOrbital.id);
      return stateOrbital ?? groupOrbital;
    }),
  })), [groups, orbitals]);

  const displayGroups = useMemo(() => [...mergedGroups].reverse(), [mergedGroups]);

  // Find the next group to fill (first non-full from bottom in fill order)
  const fillOrderGroups = mergedGroups;
  const nextGroupLabel = fillOrderGroups.find(g => {
    const total = g.orbitals.reduce((sum, o) => sum + o.electrons.length, 0);
    return total < g.orbitalCount * 2;
  })?.label;

  return (
    <div className="term-panel h-full flex flex-col">
      <div className="term-header">
        energy levels
        <span className="ml-auto text-foreground/15 normal-case tracking-normal">click to place</span>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <div className="text-[10px] text-foreground/25 font-mono mb-2">
          ↑ higher energy
        </div>

        <div className="flex flex-col gap-2.5">
          {displayGroups.map((group, groupIdx) => {
            const color = SUBSHELL_COLORS[group.type];
            const totalElectrons = group.orbitals.reduce(
              (sum, o) => sum + o.electrons.length, 0
            );
            const maxElectrons = group.orbitalCount * 2;
            const isFull = totalElectrons >= maxElectrons;
            const isNextToFill = group.label === nextGroupLabel;

            return (
              <motion.div
                key={group.label}
                className={`flex items-center gap-2.5 pl-1 border-l-2 transition-colors ${
                  isNextToFill ? 'border-l-cyan/60' : isFull ? 'border-l-success/20' : 'border-l-transparent'
                }`}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: groupIdx * 0.03 }}
              >
                {/* Active indicator */}
                {isNextToFill && (
                  <motion.div
                    className="w-1 h-1 rounded-full bg-cyan shrink-0"
                    animate={{
                      boxShadow: ['0 0 2px var(--cyan)', '0 0 8px var(--cyan)', '0 0 2px var(--cyan)'],
                    }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}

                {/* Subshell label */}
                <div className={`${isNextToFill ? 'w-6' : 'w-8'} text-right`}>
                  <span
                    className={`text-xs font-mono font-bold transition-opacity ${isFull ? 'opacity-40' : ''}`}
                    style={{ color }}
                  >
                    {group.label}
                  </span>
                </div>

                {/* Orbital boxes */}
                <div className="flex items-center gap-1">
                  {group.orbitals.map((orbital) => (
                    <OrbitalSlot
                      key={orbital.id}
                      orbital={orbital}
                      subshellType={group.type}
                      placeWithAudio={placeWithAudio}
                    />
                  ))}
                </div>

                {/* Fill indicator */}
                <div className={`text-[10px] font-mono ml-1 ${
                  isFull ? 'text-success/50' : isNextToFill ? 'text-cyan/60' : 'text-foreground/20'
                }`}>
                  {totalElectrons}/{maxElectrons}
                  {isFull && ' ✓'}
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="text-[10px] text-foreground/25 font-mono mt-2">
          ↓ lower energy
        </div>
      </div>
    </div>
  );
}
