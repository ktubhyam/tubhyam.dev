'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getElement } from '@/lib/chemistry';

interface Props {
  atomicNumber: number;
  children: React.ReactNode;
}

export function ElementTooltip({ atomicNumber, children }: Props) {
  const [show, setShow] = useState(false);
  const element = getElement(atomicNumber);

  return (
    <div
      className="relative"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.12 }}
            className="absolute top-full left-0 mt-1 z-50 term-panel w-56 pointer-events-none"
          >
            <div className="term-header text-[10px]">
              element info
            </div>
            <div className="p-2.5 font-mono text-[10px] space-y-1">
              <div className="flex justify-between">
                <span className="text-foreground/35">name</span>
                <span className="text-foreground/70 font-bold">{element.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground/35">symbol</span>
                <span className="text-accent font-bold">{element.symbol}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground/35">Z</span>
                <span>{element.atomicNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground/35">period</span>
                <span>{element.period}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground/35">group</span>
                <span>{element.group ?? '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground/35">category</span>
                <span className="text-cyan">{element.category}</span>
              </div>
              <div className="border-t border-border pt-1 mt-1">
                <div className="text-foreground/35 mb-0.5">config</div>
                <div className="text-foreground/50 break-all">{element.electronConfig}</div>
              </div>
              {element.isAufbauException && (
                <div className="text-warning/70 text-[9px] border border-warning/20 bg-warning/5 px-1.5 py-0.5 mt-1">
                  Aufbau exception
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
