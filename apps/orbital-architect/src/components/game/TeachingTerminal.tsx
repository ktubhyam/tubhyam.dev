'use client';

import { useEffect, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEducationStore, type TerminalLogEntry } from '@/stores/educationStore';

const CATEGORY_CONFIG: Record<string, { label: string; color: string }> = {
  concept: { label: 'CONCEPT', color: 'var(--cyan)' },
  fact:    { label: 'FACT',    color: 'var(--accent)' },
  tip:     { label: 'TIP',    color: 'var(--success)' },
  history: { label: 'HISTORY', color: 'var(--warning)' },
};

const TerminalEntry = memo(function TerminalEntry({ entry }: { entry: TerminalLogEntry }) {
  const config = CATEGORY_CONFIG[entry.category] ?? CATEGORY_CONFIG.fact;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="border-l-2 pl-2 py-1"
      style={{ borderColor: config.color }}
    >
      <div className="flex items-center gap-1.5 mb-0.5">
        <span
          className="text-[9px] font-bold"
          style={{ color: config.color }}
        >
          [{config.label}]
        </span>
        <span className="text-foreground/50 text-[10px]">{entry.title}</span>
      </div>
      <div className="text-foreground/40 leading-relaxed">
        {entry.body}
      </div>
      {entry.detail && (
        <div className="text-foreground/25 text-[10px] mt-0.5 border-t border-border/30 pt-0.5">
          <span className="text-cyan/30">{'> '}</span>{entry.detail}
        </div>
      )}
    </motion.div>
  );
});

export function TeachingTerminal() {
  const terminalLog = useEducationStore(s => s.terminalLog);
  const contentMinimized = useEducationStore(s => s.contentMinimized);
  const toggleMinimized = useEducationStore(s => s.toggleMinimized);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new entries arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [terminalLog.length]);

  return (
    <div className="term-panel flex flex-col min-h-[80px]">
      <div className="term-header flex items-center">
        <span className="flex-1">teaching log</span>
        <button
          onClick={toggleMinimized}
          className="text-[9px] text-foreground/30 hover:text-foreground/50 transition-colors ml-2"
        >
          {contentMinimized ? '[expand]' : '[minimize]'}
        </button>
      </div>
      <AnimatePresence>
        {!contentMinimized && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div
              ref={scrollRef}
              className="overflow-y-auto p-2 space-y-2 font-mono text-[11px]"
              style={{ maxHeight: '250px' }}
            >
              {terminalLog.length === 0 ? (
                <div className="text-foreground/15 py-2">
                  <span className="text-cyan/30">{'>'}</span> waiting for events...
                </div>
              ) : (
                terminalLog.map((entry) => (
                  <TerminalEntry key={entry.id + entry.timestamp} entry={entry} />
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
