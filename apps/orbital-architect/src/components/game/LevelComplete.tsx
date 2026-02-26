'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { modalBackdrop, modalPanel } from '@/lib/motion';
import { useGameStore, calculateStars } from '@/stores/gameStore';
import { useProgressStore } from '@/stores/progressStore';
import { getElement } from '@/lib/chemistry';
import { ELEMENT_FACTS } from '@/lib/education';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { useRouter } from 'next/navigation';

export function LevelComplete() {
  const router = useRouter();
  const isComplete = useGameStore(s => s.isComplete);
  const currentElement = useGameStore(s => s.currentElement);
  const score = useGameStore(s => s.score);
  const mistakes = useGameStore(s => s.mistakes);
  const hintsUsed = useGameStore(s => s.hintsUsed);
  const maxStreak = useGameStore(s => s.maxStreak);
  const startTime = useGameStore(s => s.startTime);
  const totalElectrons = useGameStore(s => s.totalElectrons);
  const mode = useGameStore(s => s.mode);
  const startLevel = useGameStore(s => s.startLevel);
  const setPhase = useGameStore(s => s.setPhase);
  const completeCampaignLevel = useProgressStore(s => s.completeCampaignLevel);
  const eloRating = useProgressStore(s => s.eloRating.current);
  const hasRecorded = useRef(false);
  const eloChangeRef = useRef(0);
  const primaryButtonRef = useRef<HTMLButtonElement>(null);
  const focusTrapRef = useFocusTrap<HTMLDivElement>(isComplete);

  const element = getElement(currentElement);
  const stars = calculateStars(mistakes, hintsUsed);
  const timeSecondsRef = useRef(0);

  useEffect(() => {
    if (isComplete && !hasRecorded.current) {
      hasRecorded.current = true;
      const timeSeconds = Math.round((Date.now() - startTime) / 1000);
      timeSecondsRef.current = timeSeconds;

      if (mode === 'campaign') {
        const change = completeCampaignLevel(
          currentElement, score, stars, mistakes, hintsUsed, timeSeconds, maxStreak
        );
        eloChangeRef.current = change;
      }

      // Fire confetti (dynamically imported to reduce initial bundle)
      import('canvas-confetti').then((mod) => {
        const confetti = mod.default;
        const duration = stars === 3 ? 3000 : stars === 2 ? 2000 : 1000;
        const end = Date.now() + duration;

        const frame = () => {
          confetti({
            particleCount: stars === 3 ? 5 : 2,
            angle: 60 + Math.random() * 60,
            spread: 60,
            origin: { x: Math.random(), y: Math.random() * 0.4 },
            colors: ['#C9A04A', '#4A90D9', '#E8913A', '#22C55E', '#D4B15E'],
            disableForReducedMotion: true,
          });
          if (Date.now() < end) requestAnimationFrame(frame);
        };
        frame();
      }).catch(() => {
        // Confetti import failed — non-critical, skip silently
      });
    }
  }, [isComplete, currentElement, score, stars, mistakes, hintsUsed, startTime, maxStreak, mode, completeCampaignLevel]);

  useEffect(() => {
    if (!isComplete) {
      hasRecorded.current = false;
      eloChangeRef.current = 0;
    }
  }, [isComplete]);

  // Auto-focus primary action when modal appears
  useEffect(() => {
    if (isComplete) {
      const timer = setTimeout(() => primaryButtonRef.current?.focus(), 300);
      return () => clearTimeout(timer);
    }
  }, [isComplete]);

  const hasNext = currentElement < 36;
  const eloChange = eloChangeRef.current;
  const timeSeconds = timeSecondsRef.current;

  return (
    <AnimatePresence>
      {isComplete && (
    <motion.div
      variants={modalBackdrop}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
    >
      <motion.div
        ref={focusTrapRef}
        variants={modalPanel}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="term-panel max-w-md w-full mx-4 shine-border"
        role="dialog"
        aria-modal="true"
        aria-label={`Level complete: ${element.name}`}
        aria-describedby="level-complete-stats"
      >
        <div className="term-header">
          level complete
        </div>

        <div className="p-6 text-center font-mono">
          {/* Element symbol */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="w-16 h-16 mx-auto border border-accent/50 bg-accent/10 flex items-center justify-center mb-4"
          >
            <div>
              <div className="text-[8px] text-foreground/30">{element.atomicNumber}</div>
              <div className="text-2xl font-bold text-accent">{element.symbol}</div>
            </div>
          </motion.div>

          <h2 className="text-lg font-bold mb-0.5">
            {element.name} <span className="text-success">✓</span>
          </h2>

          <div className="text-xs text-foreground/40 mb-3">
            {element.nobleGasConfig ?? element.electronConfig}
          </div>

          {/* Elo rating */}
          {mode !== 'sandbox' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mb-4"
            >
              <div className="text-xl font-bold text-accent">
                {eloRating} elo
              </div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.6 }}
                className={`text-sm font-bold ${eloChange >= 0 ? 'text-success' : 'text-error'}`}
              >
                {eloChange >= 0 ? '+' : ''}{eloChange}
              </motion.div>
            </motion.div>
          )}

          {/* Stars */}
          <div className="flex justify-center gap-1.5 mb-5">
            {[1, 2, 3].map((star) => (
              <motion.span
                key={star}
                className={`text-2xl ${star <= stars ? 'text-warning animate-star-pop' : 'text-foreground/10'}`}
                style={{ animationDelay: `${star * 0.2}s` }}
              >
                ★
              </motion.span>
            ))}
          </div>

          {/* Stats grid — terminal output style */}
          <div id="level-complete-stats" className="text-left text-xs space-y-1 border border-border p-3 mb-5 bg-black/30">
            <div className="flex justify-between">
              <span className="text-foreground/40">rating_change</span>
              <span className={`font-bold ${eloChange >= 0 ? 'text-success' : 'text-error'}`}>
                {eloChange >= 0 ? '+' : ''}{eloChange}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-foreground/40">time</span>
              <span>{timeSeconds}s</span>
            </div>
            <div className="flex justify-between">
              <span className="text-foreground/40">mistakes</span>
              <span className={mistakes === 0 ? 'text-success' : 'text-error'}>{mistakes}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-foreground/40">best_streak</span>
              <span className="text-warning">{maxStreak}</span>
            </div>
          </div>

          {/* Did You Know? */}
          {ELEMENT_FACTS[currentElement] && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-left text-[11px] border border-border/50 p-3 mb-5 bg-black/20"
            >
              <div className="text-[9px] text-foreground/25 uppercase tracking-wider mb-1">did you know?</div>
              <div className="text-foreground/45 leading-relaxed">
                <span className="text-cyan/40">{'> '}</span>
                {ELEMENT_FACTS[currentElement]}
              </div>
            </motion.div>
          )}

          {/* Buttons */}
          <div className="flex gap-2 text-sm">
            <button
              onClick={() => {
                setPhase('level-select');
                router.push('/campaign');
              }}
              className="flex-1 py-2 border border-border text-foreground/50 hover:bg-surface-2 hover:text-foreground/70 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan/60"
            >
              [levels]
            </button>

            {mode === 'campaign' && hasNext ? (
              <button
                ref={primaryButtonRef}
                onClick={() => startLevel(currentElement + 1)}
                className="flex-1 py-2 border border-accent/50 bg-accent/10 text-accent font-bold hover:bg-accent/20 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
              >
                [next →]
              </button>
            ) : (
              <button
                ref={primaryButtonRef}
                onClick={() => startLevel(currentElement)}
                className="flex-1 py-2 border border-accent/50 bg-accent/10 text-accent font-bold hover:bg-accent/20 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
              >
                [replay]
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
      )}
    </AnimatePresence>
  );
}
