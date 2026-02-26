'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TutorialStep {
  title: string;
  body: string;
  detail: string;
  highlight?: string;
  icon: string;
}

const STEPS: TutorialStep[] = [
  {
    title: 'Welcome, Architect',
    body: 'You build atoms by placing electrons into orbitals — the quantum slots that surround every nucleus.',
    detail: 'Each element needs a specific number of electrons. Your job is to place them in the right order.',
    icon: '⚛',
  },
  {
    title: 'Rule 1: Aufbau Principle',
    body: 'Fill lower-energy orbitals first. The fill order follows the Madelung rule:',
    detail: '1s → 2s → 2p → 3s → 3p → 4s → 3d → 4p\n\nThe energy diagram on the right shows this order. Start from the bottom.',
    highlight: 'energy-diagram',
    icon: '↑',
  },
  {
    title: 'Rule 2: Pauli Exclusion',
    body: 'Each orbital holds at most 2 electrons, and they must have opposite spins.',
    detail: 'First electron goes ↑ (spin up), second goes ↓ (spin down). You can never put two same-spin electrons in one box.',
    highlight: 'electron-tray',
    icon: '↑↓',
  },
  {
    title: "Rule 3: Hund's Rule",
    body: 'In a subshell with multiple orbitals (p, d), spread out before pairing up.',
    detail: 'Fill each orbital with one ↑ electron first. Only after all orbitals in that subshell have one, go back and add ↓ electrons.',
    highlight: 'energy-diagram',
    icon: '↑ ↑ ↑',
  },
  {
    title: 'How to Play',
    body: 'Drag electrons from the tray into the 3D atom, or click orbital slots in the energy diagram.',
    detail: 'Use [U]/[D] keys to toggle spin. [Ctrl+Z] to undo. The atom glows brighter as you fill it correctly.',
    highlight: '3d-viewer',
    icon: '🎯',
  },
  {
    title: 'Ready to Build',
    body: "Start with Hydrogen — just one electron. You'll master all 36 elements by Krypton.",
    detail: 'Your Elo rating tracks your skill. Fewer mistakes and faster times mean higher ratings. Good luck, Architect.',
    icon: '🚀',
  },
];

const TUTORIAL_STORAGE_KEY = 'orbital-architect-tutorial-seen';

export function Tutorial({ onDismiss }: { onDismiss: () => void }) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const markSeen = () => {
    try { localStorage.setItem(TUTORIAL_STORAGE_KEY, 'true'); } catch {}
  };

  const handleNext = () => {
    if (isLast) {
      markSeen();
      onDismiss();
    } else {
      setStep(s => s + 1);
    }
  };

  const handleSkip = () => {
    markSeen();
    onDismiss();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm"
    >
      <motion.div
        key={step}
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="term-panel max-w-lg w-full mx-4 shine-border"
        role="dialog"
        aria-modal="true"
        aria-label={`Tutorial step ${step + 1} of ${STEPS.length}: ${current.title}`}
      >
        <div className="term-header">
          tutorial // step {step + 1} of {STEPS.length}
        </div>

        <div className="p-6 font-mono">
          {/* Icon */}
          <div className="text-3xl mb-3 text-center">{current.icon}</div>

          {/* Title */}
          <h2 className="text-lg font-bold text-accent text-center mb-3">
            {current.title}
          </h2>

          {/* Body */}
          <p className="text-sm text-foreground/70 text-center mb-3 leading-relaxed">
            {current.body}
          </p>

          {/* Detail block */}
          <div className="border border-border bg-black/30 p-3 text-xs text-foreground/50 leading-relaxed whitespace-pre-line mb-5">
            <span className="text-cyan/50">{'>'} </span>
            {current.detail}
          </div>

          {/* Step indicators */}
          <div className="flex justify-center gap-1.5 mb-5">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 transition-all ${
                  i === step
                    ? 'bg-accent scale-125'
                    : i < step
                      ? 'bg-accent/40'
                      : 'bg-border'
                }`}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="flex gap-2 text-sm">
            <button
              onClick={handleSkip}
              className="flex-1 py-2 border border-border text-foreground/30 hover:text-foreground/50 hover:bg-surface-2 transition-all"
            >
              [skip]
            </button>
            <button
              onClick={handleNext}
              className="flex-1 py-2 border border-accent/50 bg-accent/10 text-accent font-bold hover:bg-accent/20 transition-all"
            >
              {isLast ? '[begin]' : '[next →]'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/** Hook: returns true if the tutorial has been completed before */
export function useTutorialSeen(): boolean {
  const [seen, setSeen] = useState(true); // default true to avoid flash
  useEffect(() => {
    try { setSeen(localStorage.getItem(TUTORIAL_STORAGE_KEY) === 'true'); } catch { setSeen(true); }
  }, []);
  return seen;
}
