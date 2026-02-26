'use client';

import type { CharacterTableData } from '@/types';
import { useExplorerStore } from '@/lib/store';

interface OperationPlayerProps {
  table: CharacterTableData;
}

export function OperationPlayer({ table }: OperationPlayerProps) {
  const activeOperation = useExplorerStore((s) => s.activeOperation);
  const isAnimating = useExplorerStore((s) => s.isAnimating);
  const playOperation = useExplorerStore((s) => s.playOperation);
  const stopAnimation = useExplorerStore((s) => s.stopAnimation);

  return (
    <div className="term-panel" role="region" aria-label="Symmetry operations">
      <div className="term-header">
        <span className="flex-1">operations</span>
        {isAnimating && (
          <span className="text-[9px] text-cyan animate-pulse-glow">
            animating
          </span>
        )}
      </div>
      <div className="p-3 relative z-10">
        <div className="flex flex-wrap gap-1">
          {table.symmetryElements.map((el) => {
            const isActive = activeOperation === el.label;

            return (
              <button
                key={el.label}
                onClick={() => {
                  if (isActive) {
                    stopAnimation();
                  } else {
                    playOperation(el.label);
                  }
                }}
                className={`px-2 py-1 text-xs font-mono border transition-colors ${
                  isActive
                    ? 'border-cyan bg-cyan/10 text-cyan'
                    : 'border-border text-[#888] hover:border-border-bright hover:text-foreground'
                }`}
              >
                {isActive ? '■' : '▶'} {el.label}
              </button>
            );
          })}
        </div>
        {table.symmetryElements.length === 0 && (
          <p className="text-[11px] text-[#555]">
            No symmetry operations (C₁ — identity only)
          </p>
        )}
        {isAnimating && (
          <div className="mt-2 flex items-center gap-2">
            <button
              onClick={stopAnimation}
              className="px-2 py-1 text-[10px] font-mono border border-error/30 text-error hover:bg-error/10 transition-colors"
            >
              stop
            </button>
            <span className="text-[10px] text-[#555]">
              Playing: {activeOperation}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
