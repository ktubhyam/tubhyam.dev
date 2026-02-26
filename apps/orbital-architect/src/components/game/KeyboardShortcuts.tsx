'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SHORTCUTS = [
  { key: 'U', desc: 'Set spin to up (↑)', group: 'placement' },
  { key: 'D', desc: 'Set spin to down (↓)', group: 'placement' },
  { key: 'Click atom', desc: 'Place electron in next correct orbital', group: 'placement' },
  { key: 'Drag', desc: 'Drag electron from tray to atom or orbital slot', group: 'placement' },
  { key: '⌘Z', desc: 'Undo last placement', group: 'actions' },
  { key: '?', desc: 'Toggle this shortcuts panel', group: 'actions' },
] as const;

export function KeyboardShortcuts() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
        e.preventDefault();
        setShow(s => !s);
      }
      if (e.key === 'Escape' && show) {
        setShow(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          className="fixed bottom-10 right-3 z-40 term-panel w-72"
        >
          <div className="term-header">
            keyboard shortcuts
            <button
              onClick={() => setShow(false)}
              className="ml-auto text-foreground/30 hover:text-foreground/60 normal-case tracking-normal"
              aria-label="Close shortcuts panel"
            >
              [esc]
            </button>
          </div>
          <div className="p-3 font-mono text-[11px] space-y-2">
            {/* Placement group */}
            <div>
              <div className="text-[9px] text-foreground/25 uppercase tracking-widest mb-1">placement</div>
              {SHORTCUTS.filter(s => s.group === 'placement').map(s => (
                <div key={s.key} className="flex items-center justify-between py-0.5">
                  <kbd className="px-1.5 py-0.5 border border-border bg-surface text-cyan text-[10px] min-w-[32px] text-center">
                    {s.key}
                  </kbd>
                  <span className="text-foreground/40 ml-2 text-right flex-1">{s.desc}</span>
                </div>
              ))}
            </div>
            {/* Actions group */}
            <div>
              <div className="text-[9px] text-foreground/25 uppercase tracking-widest mb-1">actions</div>
              {SHORTCUTS.filter(s => s.group === 'actions').map(s => (
                <div key={s.key} className="flex items-center justify-between py-0.5">
                  <kbd className="px-1.5 py-0.5 border border-border bg-surface text-cyan text-[10px] min-w-[32px] text-center">
                    {s.key}
                  </kbd>
                  <span className="text-foreground/40 ml-2 text-right flex-1">{s.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
