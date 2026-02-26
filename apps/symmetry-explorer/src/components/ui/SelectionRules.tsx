'use client';

import type { SelectionResult } from '@/types';

interface SelectionRulesProps {
  result: SelectionResult;
  pointGroup: string;
  hasInversion: boolean;
}

export function SelectionRules({
  result,
  pointGroup,
  hasInversion,
}: SelectionRulesProps) {
  const ratioPercent = Math.round(result.ratio * 100);

  return (
    <div className="term-panel" role="region" aria-label="Selection rules">
      <div className="term-header">selection rules</div>
      <div className="p-3 space-y-3 relative z-10">
        {/* Mode counts */}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center">
            <div className="text-lg font-mono text-ir font-bold">
              {result.irCount}
            </div>
            <div className="text-[10px] text-ir/70 uppercase tracking-wider">
              IR
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-mono text-raman font-bold">
              {result.ramanCount}
            </div>
            <div className="text-[10px] text-raman/70 uppercase tracking-wider">
              Raman
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-mono text-silent font-bold">
              {result.silentCount}
            </div>
            <div className="text-[10px] text-[#555] uppercase tracking-wider">
              Silent
            </div>
          </div>
        </div>

        {/* Mutual exclusion note */}
        {hasInversion && (
          <div className="text-[10px] text-accent border border-accent/20 bg-accent/5 px-2 py-1">
            Mutual exclusion: IR and Raman modes are disjoint
          </div>
        )}

        {/* R(G,N) bar */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-[#666] uppercase tracking-wider">
              R({pointGroup}, N)
            </span>
            <span className="text-xs font-mono text-accent">
              {result.ratio.toFixed(3)}
            </span>
          </div>
          <div className="h-2 bg-surface-2 border border-border overflow-hidden">
            <div
              className="h-full bg-accent transition-all duration-500"
              style={{ width: `${ratioPercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[10px] text-[#555]">
              {result.uniqueObservable} / {result.totalModes} modes observable
            </span>
            <span className="text-[10px] text-[#555]">{ratioPercent}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
