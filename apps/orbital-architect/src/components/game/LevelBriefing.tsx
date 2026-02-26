'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { modalPanel } from '@/lib/motion';
import { getElement } from '@/lib/chemistry';
import { ELEMENT_FACTS } from '@/lib/education';

interface LevelBriefingProps {
  atomicNumber: number;
  onDismiss: () => void;
}

export function LevelBriefing({ atomicNumber, onDismiss }: LevelBriefingProps) {
  const element = getElement(atomicNumber);
  const fact = ELEMENT_FACTS[atomicNumber];
  const [lines, setLines] = useState<string[]>([]);
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  const allLines = useMemo(() => [
    `$ loading element: ${element.name} (${element.symbol}, Z=${element.atomicNumber})`,
    `$ config target: ${element.nobleGasConfig ?? element.electronConfig}`,
    fact ? `> ${fact}` : null,
    '$ ready. begin placement.',
  ].filter((line): line is string => line !== null), [element, fact]);

  // Type out lines one by one
  useEffect(() => {
    setLines([]);
    const timers: ReturnType<typeof setTimeout>[] = [];

    allLines.forEach((line, i) => {
      timers.push(setTimeout(() => {
        setLines(prev => [...prev, line]);
      }, (i + 1) * 400));
    });

    // Auto-dismiss after all lines typed + 1.5s pause
    timers.push(setTimeout(() => onDismissRef.current(), allLines.length * 400 + 1500));

    return () => timers.forEach(t => clearTimeout(t));
  }, [allLines]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm cursor-pointer"
      onClick={onDismiss}
      onKeyDown={(e) => {
        if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
          onDismiss();
        }
      }}
      tabIndex={0}
      role="dialog"
      aria-label="Level briefing"
    >
      <motion.div
        variants={modalPanel}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="term-panel max-w-lg w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="term-header">
          briefing // {element.symbol.toLowerCase()}
        </div>

        <div className="p-4 font-mono text-[12px] space-y-1.5 min-h-[100px]">
          {lines.map((line, i) => line ? (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.15 }}
              className={
                line.startsWith('$')
                  ? 'text-cyan/70'
                  : 'text-foreground/40'
              }
            >
              {line}
            </motion.div>
          ) : null)}
          {lines.length < allLines.length && (
            <span className="inline-block w-2 h-4 bg-cyan/50 animate-pulse" />
          )}
        </div>

        <div className="px-4 pb-3 text-[9px] text-foreground/20 font-mono">
          click or press any key to skip
        </div>
      </motion.div>
    </motion.div>
  );
}
