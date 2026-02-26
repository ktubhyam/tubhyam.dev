'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import type { OrbitalState, Spin } from '@/types/chemistry';

interface RevealPanelProps {
  correctOrbital: OrbitalState;
  correctSpin: Spin;
  explanation: string;
  onContinue: () => void;
}

export function RevealPanel({
  correctOrbital,
  correctSpin,
  explanation,
  onContinue,
}: RevealPanelProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const focusTrapRef = useFocusTrap<HTMLDivElement>(true);

  useEffect(() => {
    buttonRef.current?.focus();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Answer revealed"
      aria-describedby="reveal-explanation"
    >
      <motion.div
        ref={focusTrapRef}
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="term-panel max-w-sm w-full mx-4 shine-border"
      >
        <div className="term-header" style={{ color: 'var(--cyan)' }}>
          answer revealed
        </div>

        <div className="p-5 font-mono text-center">
          <div className="text-[10px] text-foreground/30 uppercase tracking-wider mb-2">
            correct placement
          </div>

          <div className="text-2xl font-bold text-cyan mb-1">
            {correctOrbital.subshellLabel} {correctSpin === 'up' ? '↑' : '↓'}
          </div>

          <div className="text-xs text-foreground/40 mb-4">
            n={correctOrbital.n}, l={correctOrbital.l}, m
            <sub>l</sub>={correctOrbital.ml >= 0 ? `+${correctOrbital.ml}` : correctOrbital.ml}, m
            <sub>s</sub>={correctSpin === 'up' ? '+1/2' : '-1/2'}
          </div>

          <div id="reveal-explanation" className="border border-border bg-black/30 p-3 text-[11px] text-foreground/50 text-left mb-4">
            <span className="text-cyan/50">{'> '}</span>
            {explanation}
          </div>

          <button
            ref={buttonRef}
            onClick={onContinue}
            className="w-full py-2 border border-cyan/50 bg-cyan/10 text-cyan font-bold hover:bg-cyan/20 transition-all text-sm"
          >
            [continue] (-3s)
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
