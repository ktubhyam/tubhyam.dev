'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/stores/gameStore';

interface ViolationToastProps {
  showReveal?: boolean;
  onReveal?: () => void;
}

export function ViolationToast({ showReveal, onReveal }: ViolationToastProps) {
  const lastViolation = useGameStore(s => s.lastViolation);
  const showViolation = useGameStore(s => s.showViolation);
  const clearViolation = useGameStore(s => s.clearViolation);

  useEffect(() => {
    if (showViolation) {
      // Don't auto-dismiss if reveal button is shown — let the user decide
      const timeout = showReveal ? 10000 : 3000;
      const timer = setTimeout(clearViolation, timeout);
      return () => clearTimeout(timer);
    }
  }, [showViolation, clearViolation, showReveal]);

  return (
    <AnimatePresence>
      {showViolation && lastViolation && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          role="alert"
          aria-live="assertive"
          className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-50 max-w-md font-mono ${
            lastViolation.severity === 'error'
              ? 'term-panel border-error/40'
              : 'term-panel border-warning/40'
          }`}
          style={{
            borderColor: lastViolation.severity === 'error'
              ? 'var(--error)' : 'var(--warning)',
          }}
          onClick={() => {
            if (!showReveal) clearViolation();
          }}
        >
          <div
            className="term-header"
            style={{
              color: lastViolation.severity === 'error'
                ? 'var(--error)' : 'var(--warning)',
            }}
          >
            {lastViolation.severity === 'error' ? (
              <><span aria-hidden="true">✕ </span>ERROR</>
            ) : (
              <><span aria-hidden="true">⚡ </span>WARNING</>
            )}
          </div>
          <div className="px-4 py-3">
            <div className={`text-sm font-bold ${
              lastViolation.severity === 'error' ? 'text-error' : 'text-warning'
            }`}>
              {lastViolation.message}
            </div>
            <div className="text-xs text-foreground/50 mt-0.5">
              {lastViolation.detail}
            </div>
            {showReveal && onReveal && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onReveal();
                }}
                className="mt-2 w-full py-1.5 border border-cyan/30 text-cyan text-[11px] hover:bg-cyan/10 transition-all font-mono focus-visible:ring-2 focus-visible:ring-cyan/60"
              >
                [reveal answer] (-3s penalty)
              </motion.button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
