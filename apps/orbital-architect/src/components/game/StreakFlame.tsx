'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/stores/gameStore';

const STREAK_MESSAGES = [
  { min: 3, label: 'Nice!', color: 'var(--warning)' },
  { min: 5, label: 'Hot Streak!', color: 'var(--warning)' },
  { min: 10, label: 'On Fire!', color: 'var(--error)' },
  { min: 15, label: 'UNSTOPPABLE', color: 'var(--error)' },
  { min: 20, label: 'QUANTUM MASTER', color: 'var(--accent)' },
];

export function StreakFlame() {
  const streak = useGameStore(s => s.streak);
  const [showFlash, setShowFlash] = useState(false);
  const [flashMessage, setFlashMessage] = useState('');
  const [flashColor, setFlashColor] = useState('');

  useEffect(() => {
    const msg = [...STREAK_MESSAGES].reverse().find(m => streak >= m.min);
    if (msg && streak === msg.min) {
      setFlashMessage(msg.label);
      setFlashColor(msg.color);
      setShowFlash(true);
      const timer = setTimeout(() => setShowFlash(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [streak]);

  return (
    <AnimatePresence>
      {showFlash && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 1.5, y: -30 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          className="fixed top-1/3 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
        >
          <div
            className="font-mono font-bold text-2xl tracking-widest text-center"
            style={{
              color: flashColor,
              textShadow: `0 0 20px ${flashColor}, 0 0 40px ${flashColor}`,
            }}
          >
            {flashMessage}
          </div>
          <div
            className="text-center text-sm font-mono mt-1"
            style={{ color: flashColor, opacity: 0.6 }}
          >
            {streak} streak
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
