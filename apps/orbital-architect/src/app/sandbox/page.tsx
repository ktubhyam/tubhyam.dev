'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/stores/gameStore';
import { ELEMENTS } from '@/lib/chemistry';
import { SUBSHELL_COLORS } from '@/lib/chemistry/orbitals';
import { GameLayout } from '@/components/game/GameLayout';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import Link from 'next/link';

function ElementPicker({ onSelect }: { onSelect: (z: number) => void }) {
  const [search, setSearch] = useState('');

  const filtered = ELEMENTS.filter(
    (el) =>
      el.name.toLowerCase().includes(search.toLowerCase()) ||
      el.symbol.toLowerCase().includes(search.toLowerCase()) ||
      String(el.atomicNumber).includes(search)
  );

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="fixed inset-0 dot-bg opacity-20 pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto">
        <div className="term-panel mb-6">
          <div className="term-header">
            sandbox // free play
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <Link href="/" className="text-xs text-foreground/30 hover:text-foreground/50 transition-colors font-mono">
              ← back
            </Link>
            <div>
              <h1 className="text-xl font-bold">Sandbox</h1>
              <p className="text-xs text-foreground/40">Choose any element to explore</p>
            </div>
            <div className="w-12" />
          </div>
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="$ search elements..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full mb-4 px-4 py-2 bg-surface border border-border text-foreground font-mono text-sm placeholder:text-foreground/25 focus:outline-none focus:border-accent/40"
        />

        {/* Element grid */}
        <div className="grid grid-cols-6 sm:grid-cols-9 gap-1.5">
          {filtered.map((element) => {
            let color = SUBSHELL_COLORS.s;
            if ([5,6,7,8,9,10,13,14,15,16,17,18,31,32,33,34,35,36].includes(element.atomicNumber)) color = SUBSHELL_COLORS.p;
            else if (element.atomicNumber >= 21 && element.atomicNumber <= 30) color = SUBSHELL_COLORS.d;

            return (
              <motion.button
                key={element.atomicNumber}
                whileHover={{ scale: 1.05, y: -1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onSelect(element.atomicNumber)}
                className="p-2 border border-border bg-surface hover:border-accent/40 transition-all text-center cursor-pointer font-mono"
              >
                <div className="text-[9px] text-foreground/25">{element.atomicNumber}</div>
                <div className="text-lg font-bold leading-tight" style={{ color }}>
                  {element.symbol}
                </div>
                <div className="text-[8px] text-foreground/30 truncate">{element.name}</div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function SandboxPage() {
  const [selectedElement, setSelectedElement] = useState<number | null>(null);
  const startLevel = useGameStore(s => s.startLevel);
  const setMode = useGameStore(s => s.setMode);

  const handleSelect = (z: number) => {
    setMode('sandbox');
    startLevel(z);
    setSelectedElement(z);
  };

  if (selectedElement === null) {
    return <ElementPicker onSelect={handleSelect} />;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setSelectedElement(null)}
        className="fixed top-3 left-3 z-50 px-3 py-1.5 term-panel text-xs text-foreground/50 hover:text-foreground/70 transition-colors font-mono"
      >
        ← pick element
      </button>
      <ErrorBoundary fallback={<div className="h-screen flex items-center justify-center bg-background font-mono text-foreground/40"><div className="term-panel p-6 text-center"><div className="text-error mb-2">rendering error</div><button onClick={() => window.location.reload()} className="text-cyan hover:text-cyan/80">reload page</button></div></div>}>
        <GameLayout />
      </ErrorBoundary>
    </div>
  );
}
