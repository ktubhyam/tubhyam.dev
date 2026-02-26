'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FLOWCHART_NODES, POINT_GROUP_EXAMPLES, type FlowchartNode } from '@/lib/data/flowchart';
import { MOLECULES } from '@/lib/data/molecules';
import { useExplorerStore } from '@/lib/store';

function getNode(id: string): FlowchartNode | undefined {
  return FLOWCHART_NODES.find((n) => n.id === id);
}

function isResult(value: string): boolean {
  return value.startsWith('result:');
}

function getResult(value: string): string {
  return value.replace('result:', '');
}

export function PointGroupFlowchart() {
  const [history, setHistory] = useState<string[]>(['start']);
  const [result, setResult] = useState<string | null>(null);
  const setMolecule = useExplorerStore((s) => s.setMolecule);

  const currentId = history[history.length - 1];
  const currentNode = getNode(currentId);

  const handleAnswer = useCallback(
    (answer: 'yes' | 'no') => {
      if (!currentNode) return;
      const next = answer === 'yes' ? currentNode.yes : currentNode.no;

      if (isResult(next)) {
        setResult(getResult(next));
      } else {
        setHistory((prev) => [...prev, next]);
      }
    },
    [currentNode]
  );

  const handleBack = useCallback(() => {
    if (result) {
      setResult(null);
      return;
    }
    if (history.length > 1) {
      setHistory((prev) => prev.slice(0, -1));
    }
  }, [history, result]);

  const handleReset = useCallback(() => {
    setHistory(['start']);
    setResult(null);
  }, []);

  const handleSelectMolecule = useCallback(
    (id: string) => {
      setMolecule(id);
    },
    [setMolecule]
  );

  const progress = history.length;

  return (
    <div className="term-panel" role="region" aria-label="Point group identification flowchart">
      <div className="term-header">
        <span className="flex-1">point group flowchart</span>
        <span className="text-[9px] text-[#555]">
          step {progress}
        </span>
      </div>
      <div className="p-3 space-y-3 relative z-10">
        {/* Progress breadcrumbs */}
        <div className="flex items-center gap-1 flex-wrap">
          {history.map((id, i) => (
            <span key={id} className="flex items-center gap-1">
              {i > 0 && <span className="text-[9px] text-[#333]">→</span>}
              <span
                className={`text-[9px] font-mono ${
                  i === history.length - 1 && !result
                    ? 'text-accent'
                    : 'text-[#555]'
                }`}
              >
                {id}
              </span>
            </span>
          ))}
          {result && (
            <>
              <span className="text-[9px] text-[#333]">→</span>
              <span className="text-[9px] font-mono text-cyan font-bold">
                {result}
              </span>
            </>
          )}
        </div>

        <AnimatePresence mode="wait">
          {result ? (
            /* ─── Result view ─── */
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="space-y-3"
            >
              <div className="text-center py-2">
                <div className="text-3xl font-mono text-accent font-bold">
                  {result}
                </div>
                <div className="text-[10px] text-[#666] mt-1">
                  identified point group
                </div>
              </div>

              {/* Example molecules */}
              {POINT_GROUP_EXAMPLES[result] && (
                <div className="space-y-1">
                  <div className="text-[10px] text-[#555] uppercase tracking-wider">
                    examples in database
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {POINT_GROUP_EXAMPLES[result].map((molId) => {
                      const mol = MOLECULES.find((m) => m.id === molId);
                      if (!mol) return null;
                      return (
                        <button
                          key={molId}
                          onClick={() => handleSelectMolecule(molId)}
                          className="px-2 py-1 text-[10px] font-mono border border-border text-[#888] hover:border-accent hover:text-accent transition-colors"
                        >
                          {mol.formula}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {!POINT_GROUP_EXAMPLES[result] && (
                <div className="text-[10px] text-[#555] text-center">
                  No example molecules for this group in the database
                </div>
              )}
            </motion.div>
          ) : currentNode ? (
            /* ─── Question view ─── */
            <motion.div
              key={currentId}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="space-y-3"
            >
              {/* Question */}
              <div className="text-sm text-foreground font-mono leading-relaxed">
                {currentNode.question}
              </div>

              {/* Description */}
              <div className="text-[10px] text-[#666] leading-relaxed">
                {currentNode.description}
              </div>

              {/* Yes / No buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleAnswer('yes')}
                  className="flex-1 py-2 text-xs font-mono border border-accent/30 text-accent hover:bg-accent/10 transition-colors"
                >
                  Yes
                </button>
                <button
                  onClick={() => handleAnswer('no')}
                  className="flex-1 py-2 text-xs font-mono border border-border text-[#888] hover:border-border-bright hover:text-foreground transition-colors"
                >
                  No
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="text-[10px] text-error">
              Error: unknown flowchart node &quot;{currentId}&quot;
            </div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-1 border-t border-border">
          <button
            onClick={handleBack}
            disabled={history.length <= 1 && !result}
            className="text-[10px] font-mono text-[#555] hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ← back
          </button>
          <button
            onClick={handleReset}
            className="text-[10px] font-mono text-[#555] hover:text-accent transition-colors"
          >
            restart
          </button>
        </div>
      </div>
    </div>
  );
}
