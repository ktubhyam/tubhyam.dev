'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { modalPanel } from '@/lib/motion';
import { useGameStore } from '@/stores/gameStore';
import { useProgressStore } from '@/stores/progressStore';
import { GameLayout } from '@/components/game/GameLayout';
import { RevealPanel } from '@/components/game/RevealPanel';
import { getNextCorrectOrbital } from '@/lib/chemistry/validation';
import { getRevealExplanation } from '@/lib/education';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import type { OrbitalState, Spin } from '@/types/chemistry';
import Link from 'next/link';

function ChallengeMenu({ onStart }: { onStart: () => void }) {
  const eloRating = useProgressStore(s => s.eloRating.current);
  const leaderboard = useProgressStore(s => s.challengeLeaderboard);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="fixed inset-0 grid-bg opacity-20 pointer-events-none" />

      <motion.div
        variants={modalPanel}
        initial="hidden"
        animate="visible"
        className="term-panel max-w-md w-full relative z-10"
      >
        <div className="term-header">
          challenge // ranked mode
        </div>

        <div className="p-6 text-center font-mono">
          <div className="text-3xl mb-2">⚡</div>
          <h1 className="text-xl font-bold mb-1">Challenge Mode</h1>
          <p className="text-xs text-foreground/40 mb-5">
            Random element. 30-second timer. Build fast and boost your rating.
          </p>

          <div className="border border-border p-3 mb-5 bg-black/20">
            <div className="text-[10px] text-foreground/30 uppercase tracking-wider">current rating</div>
            <div className="text-2xl font-bold text-accent">{eloRating}</div>
          </div>

          <button
            onClick={onStart}
            className="w-full py-3 border border-accent/50 bg-accent/10 text-accent font-bold text-lg hover:bg-accent/20 transition-all mb-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
          >
            [start challenge]
          </button>

          <Link href="/" className="text-xs text-foreground/30 hover:text-foreground/50 transition-colors">
            ← back to menu
          </Link>

          {leaderboard.length > 0 && (
            <div className="mt-5">
              <div className="text-[10px] text-foreground/30 uppercase tracking-wider mb-2">recent sessions</div>
              <div className="space-y-1 text-xs">
                {leaderboard.slice(0, 5).map((entry, i) => (
                  <div key={i} className="flex items-center justify-between border border-border p-2 bg-black/10">
                    <span className="text-foreground/30">#{i + 1}</span>
                    <span className="font-bold text-accent">+{entry.score}</span>
                    <span className="text-foreground/25">{entry.streak} elements</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function ChallengeTimer({ timeLeft, totalTime }: { timeLeft: number; totalTime: number }) {
  const percentage = (timeLeft / totalTime) * 100;
  const isLow = timeLeft <= 10;

  return (
    <div className="fixed top-2 left-1/2 -translate-x-1/2 z-40">
      <motion.div
        className={`px-4 py-2 term-panel font-mono font-bold text-xl ${
          isLow ? 'text-error' : 'text-warning'
        }`}
        animate={isLow ? { scale: [1, 1.03, 1] } : {}}
        transition={{ repeat: Infinity, duration: 0.8 }}
      >
        {Math.ceil(timeLeft)}s
      </motion.div>
      <div className="mt-1 h-0.5 bg-border overflow-hidden">
        <motion.div
          className={`h-full ${isLow ? 'bg-error' : 'bg-warning'}`}
          style={{ width: `${percentage}%` }}
          transition={{ duration: 0.1 }}
        />
      </div>
    </div>
  );
}

interface RevealInfo {
  orbital: OrbitalState;
  spin: Spin;
  explanation: string;
}

export default function ChallengePage() {
  const [started, setStarted] = useState(false);
  const [ticks, setTicks] = useState(300); // 30s × 10 ticks/s
  const [challengeEloGain, setChallengeEloGain] = useState(0);
  const [challengeStreak, setChallengeStreak] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [challengePaused, setChallengePaused] = useState(false);
  const [showRevealPanel, setShowRevealPanel] = useState(false);
  const [revealInfo, setRevealInfo] = useState<RevealInfo | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const timeLeft = ticks / 10;

  const startLevel = useGameStore(s => s.startLevel);
  const setMode = useGameStore(s => s.setMode);
  const isComplete = useGameStore(s => s.isComplete);
  const showViolation = useGameStore(s => s.showViolation);
  const applyEloChange = useProgressStore(s => s.applyEloChange);
  const addChallengeResult = useProgressStore(s => s.addChallengeResult);
  const eloRating = useProgressStore(s => s.eloRating.current);

  const startRandomLevel = useCallback(() => {
    const randomZ = Math.floor(Math.random() * 36) + 1;
    setMode('challenge');
    startLevel(randomZ);
  }, [setMode, startLevel]);

  const handleStart = () => {
    setStarted(true);
    setTicks(300);
    setChallengeEloGain(0);
    setChallengeStreak(0);
    setGameOver(false);
    setChallengePaused(false);
    setShowRevealPanel(false);
    setRevealInfo(null);
    startRandomLevel();
  };

  // Timer — pauses when challengePaused
  useEffect(() => {
    if (!started || gameOver) return;

    timerRef.current = setInterval(() => {
      setTicks(prev => {
        if (challengePaused) return prev;
        if (prev <= 1) {
          setGameOver(true);
          return 0;
        }
        return prev - 1;
      });
    }, 100);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [started, gameOver, challengePaused]);

  // On element complete
  useEffect(() => {
    if (isComplete && started && !gameOver) {
      const state = useGameStore.getState();
      const timeSeconds = Math.round((Date.now() - state.startTime) / 1000);

      const change = applyEloChange(
        state.currentElement,
        state.mistakes,
        state.hintsUsed,
        timeSeconds,
        state.maxStreak,
        state.totalElectrons
      );

      const gain = Math.max(0, change);
      setChallengeEloGain(prev => prev + gain);
      setChallengeStreak(prev => prev + 1);

      setTicks(prev => Math.min(prev + 50, 300)); // +5s bonus
      setTimeout(startRandomLevel, 500);
    }
  }, [isComplete, started, gameOver, applyEloChange, startRandomLevel]);

  // Game over — save result
  useEffect(() => {
    if (gameOver && started) {
      addChallengeResult(challengeEloGain, challengeStreak);
    }
  }, [gameOver, started, challengeEloGain, challengeStreak, addChallengeResult]);

  // Reveal handler
  const handleReveal = useCallback(() => {
    setChallengePaused(true);
    const state = useGameStore.getState();
    const next = getNextCorrectOrbital(state.orbitals);
    if (next) {
      const orbital = state.orbitals.find(o => o.id === next.orbitalId);
      if (orbital) {
        const explanation = getRevealExplanation(state.orbitals, orbital, next.spin);
        setRevealInfo({ orbital, spin: next.spin, explanation });
        setShowRevealPanel(true);
        useGameStore.getState().setHighlightedOrbital(next.orbitalId);
      }
    }
    useGameStore.getState().clearViolation();
  }, []);

  // Continue after reveal — apply -3s penalty
  const handleContinue = useCallback(() => {
    setChallengePaused(false);
    setShowRevealPanel(false);
    setRevealInfo(null);
    setTicks(prev => Math.max(prev - 30, 10)); // -3s penalty
    // Count as hint used for Elo calculation
    useGameStore.setState(state => ({
      hintsUsed: state.hintsUsed + 1,
    }));
  }, []);

  const canReveal = showViolation && !showRevealPanel;

  if (!started) {
    return <ChallengeMenu onStart={handleStart} />;
  }

  if (gameOver) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="fixed inset-0 grid-bg opacity-20 pointer-events-none" />

        <motion.div
          variants={modalPanel}
          initial="hidden"
          animate="visible"
          className="term-panel max-w-md w-full relative z-10 shine-border"
        >
          <div className="term-header">
            challenge // results
          </div>

          <div className="p-6 text-center font-mono">
            <div className="text-3xl mb-2">⏱️</div>
            <h1 className="text-xl font-bold mb-1">Time&apos;s Up!</h1>

            <div className="text-xl font-bold text-accent mb-4">
              {eloRating} elo
            </div>

            <div className="grid grid-cols-2 gap-2 mb-5">
              <div className="border border-border p-3 bg-black/20">
                <div className="text-[10px] text-foreground/30">elo_gained</div>
                <div className="text-xl font-bold text-success">+{challengeEloGain}</div>
              </div>
              <div className="border border-border p-3 bg-black/20">
                <div className="text-[10px] text-foreground/30">elements</div>
                <div className="text-xl font-bold text-accent">{challengeStreak}</div>
              </div>
            </div>

            <div className="flex gap-2 text-sm">
              <button
                onClick={handleStart}
                className="flex-1 py-2.5 border border-accent/50 bg-accent/10 text-accent font-bold hover:bg-accent/20 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
              >
                [retry]
              </button>
              <Link
                href="/"
                className="flex-1 py-2.5 border border-border text-foreground/50 hover:bg-surface-2 transition-all text-center"
              >
                [menu]
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <ErrorBoundary fallback={<div className="h-screen flex items-center justify-center bg-background font-mono text-foreground/40"><div className="term-panel p-6 text-center"><div className="text-error mb-2">rendering error</div><button onClick={() => window.location.reload()} className="text-cyan hover:text-cyan/80">reload page</button></div></div>}>
      <ChallengeTimer timeLeft={timeLeft} totalTime={30} />
      <GameLayout showReveal={canReveal} onReveal={handleReveal} />
      <AnimatePresence>
        {showRevealPanel && revealInfo && (
          <RevealPanel
            correctOrbital={revealInfo.orbital}
            correctSpin={revealInfo.spin}
            explanation={revealInfo.explanation}
            onContinue={handleContinue}
          />
        )}
      </AnimatePresence>
    </ErrorBoundary>
  );
}
