'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore, calculateStars } from '@/stores/gameStore';
import { useProgressStore } from '@/stores/progressStore';
import { getElement } from '@/lib/chemistry';
import {
  getElementDifficulty,
  calculatePerformanceScore,
  calculateEloChange,
} from '@/lib/game/elo';
import { audio } from '@/lib/game/audio';
import { AnimatedCounter, ProgressPulse } from '@/components/ui/TerminalEffects';
import { ElementTooltip } from './ElementTooltip';

function StarRating({ stars, max = 3 }: { stars: number; max?: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <motion.span
          key={i}
          className={`text-sm ${i < stars ? 'text-warning' : 'text-foreground/15'}`}
          initial={false}
          animate={i < stars ? { scale: [1, 1.3, 1] } : {}}
          transition={{ delay: i * 0.1, duration: 0.3 }}
        >
          ★
        </motion.span>
      ))}
    </div>
  );
}

export function GameHUD() {
  const currentElement = useGameStore(s => s.currentElement);
  const placedElectrons = useGameStore(s => s.placedElectrons);
  const totalElectrons = useGameStore(s => s.totalElectrons);
  const mistakes = useGameStore(s => s.mistakes);
  const hintsUsed = useGameStore(s => s.hintsUsed);
  const streak = useGameStore(s => s.streak);
  const maxStreak = useGameStore(s => s.maxStreak);
  const mode = useGameStore(s => s.mode);
  const startTime = useGameStore(s => s.startTime);
  const undoLastPlacement = useGameStore(s => s.undoLastPlacement);
  const resetLevel = useGameStore(s => s.resetLevel);
  const useHint = useGameStore(s => s.useHint);
  const history = useGameStore(s => s.history);
  const eloRating = useProgressStore(s => s.eloRating.current);

  const [isMuted, setIsMuted] = useState(false);
  const toggleSound = useCallback(() => {
    const nowMuted = audio.toggleMuted();
    setIsMuted(nowMuted);
  }, []);
  const handleHint = useCallback(() => useHint(), [useHint]);

  const element = getElement(currentElement);
  const previewStars = calculateStars(mistakes, hintsUsed);
  const streakMultiplier = streak >= 15 ? 3.0 : streak >= 10 ? 2.5 : streak >= 5 ? 2.0 : streak >= 3 ? 1.5 : 1.0;
  const fillProgress = totalElectrons > 0 ? placedElectrons / totalElectrons : 0;

  // Live Elo preview
  const [eloPreview, setEloPreview] = useState(0);
  useEffect(() => {
    const calc = () => {
      const timeSeconds = (Date.now() - startTime) / 1000;
      const difficulty = getElementDifficulty(currentElement, element.isAufbauException);
      const perfScore = calculatePerformanceScore({
        mistakes, hintsUsed, timeSeconds, totalElectrons, maxStreak,
      });
      setEloPreview(calculateEloChange(eloRating, difficulty, perfScore));
    };
    calc();
    const interval = setInterval(calc, 2000);
    return () => clearInterval(interval);
  }, [mistakes, hintsUsed, maxStreak, totalElectrons, startTime, currentElement, element.isAufbauException, eloRating]);

  return (
    <div className="term-panel relative">
      <div className="term-header">
        <span className="flex-1">
          {mode === 'campaign' ? `campaign // level ${currentElement}` : mode === 'challenge' ? 'challenge // ranked' : 'sandbox // free'}
        </span>
        {mode !== 'sandbox' && <StarRating stars={previewStars} />}
      </div>

      <div className="flex items-center gap-2 sm:gap-4 px-2 sm:px-3 py-2 text-xs font-mono flex-wrap">
        {/* Element badge with tooltip */}
        <ElementTooltip atomicNumber={currentElement}>
        <div className="flex items-center gap-2">
          <motion.div
            className="w-10 h-10 border border-accent/40 bg-accent/5 flex items-center justify-center relative"
            animate={{
              boxShadow: fillProgress > 0.5
                ? ['0 0 0px var(--accent)', '0 0 12px var(--accent)', '0 0 0px var(--accent)']
                : 'none',
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="text-center leading-none">
              <div className="text-[8px] text-foreground/30">{element.atomicNumber}</div>
              <div className="text-lg font-bold text-accent">{element.symbol}</div>
            </div>
          </motion.div>
          <div>
            <div className="text-sm font-bold text-foreground/80">{element.name}</div>
            <div className="text-foreground/30 text-[10px]">{element.electronConfig}</div>
          </div>
        </div>
        </ElementTooltip>

        <div className="h-8 w-px bg-border hidden sm:block" />

        {/* Elo rating */}
        <div className="text-center">
          <div className="text-[10px] text-foreground/30 uppercase tracking-wider">elo</div>
          <div className="text-lg font-bold text-accent glow-accent">
            <AnimatedCounter value={eloRating} />
          </div>
          {mode !== 'sandbox' && (
            <motion.div
              className={`text-[10px] font-bold ${eloPreview >= 0 ? 'text-success' : 'text-error'}`}
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              {eloPreview >= 0 ? '+' : ''}{eloPreview}
            </motion.div>
          )}
        </div>

        {/* Streak */}
        <AnimatePresence>
          {streak >= 3 && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="text-center px-2 py-1 border border-warning/30 bg-warning/5 relative overflow-hidden"
            >
              <motion.div
                className="absolute inset-0 bg-warning/5"
                animate={{ opacity: [0, 0.15, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
              <div className="text-warning font-bold relative">{'\u00d7'}{streakMultiplier}</div>
              <div className="text-[10px] text-warning/50 relative">{streak} streak</div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Electrons progress */}
        <div className="text-center min-w-[70px]">
          <div className="text-[10px] text-foreground/30 uppercase tracking-wider">electrons</div>
          <div>
            <span className="text-cyan font-bold text-sm glow-cyan">
              <AnimatedCounter value={placedElectrons} />
            </span>
            <span className="text-foreground/20"> / </span>
            <span className="text-foreground/50">{totalElectrons}</span>
          </div>
          <div className="mt-1">
            <ProgressPulse
              progress={fillProgress}
              color={fillProgress >= 1 ? 'var(--success)' : 'var(--cyan)'}
              height={2}
            />
          </div>
        </div>

        <div className="flex-1" />

        {/* Action buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={toggleSound}
            aria-label={isMuted ? 'Unmute sound effects' : 'Mute sound effects'}
            aria-pressed={!isMuted}
            className={`px-2 py-1 text-[11px] border transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan/60 ${
              isMuted
                ? 'border-foreground/20 text-foreground/30 hover:text-foreground/50'
                : 'border-cyan-dim/40 text-cyan-dim hover:bg-cyan/10'
            }`}
            title={isMuted ? 'Unmute sound' : 'Mute sound'}
          >
            {isMuted ? '[muted]' : '[sound]'}
          </button>
          <button
            onClick={handleHint}
            aria-label="Show hint for next correct placement"
            className="px-2 py-1 text-[11px] border border-cyan-dim/40 text-cyan-dim hover:bg-cyan/10 hover:text-cyan transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan/60"
            title="Show hint (affects rating)"
          >
            [hint]
          </button>
          <button
            onClick={undoLastPlacement}
            disabled={history.length === 0}
            aria-label="Undo last electron placement"
            className="px-2 py-1 text-[11px] border border-border text-foreground/40 hover:bg-surface-2 hover:text-foreground/60 transition-all disabled:opacity-20 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan/60"
            title="Undo last placement"
          >
            [undo]
          </button>
          <button
            onClick={resetLevel}
            aria-label="Reset current level"
            className="px-2 py-1 text-[11px] border border-error/30 text-error/70 hover:bg-error/10 hover:text-error transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan/60"
            title="Reset level"
          >
            [reset]
          </button>
        </div>
      </div>
    </div>
  );
}
