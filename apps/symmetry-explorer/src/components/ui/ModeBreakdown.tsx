'use client';

import type { CharacterTableData } from '@/types';
import { getModeBreakdown, getTotalModes } from '@/lib/chemistry/vibrations';
import { useExplorerStore } from '@/lib/store';
import { NORMAL_MODES } from '@/lib/data/normalModes';

interface ModeBreakdownProps {
  table: CharacterTableData;
  nAtoms: number;
  linear: boolean;
  moleculeId: string;
}

const ACTIVITY_COLORS: Record<string, string> = {
  ir: 'text-ir',
  raman: 'text-raman',
  both: 'text-both',
  silent: 'text-silent',
};

const ACTIVITY_LABELS: Record<string, string> = {
  ir: 'IR',
  raman: 'Raman',
  both: 'IR + Raman',
  silent: 'Silent',
};

export function ModeBreakdown({ table, nAtoms, linear, moleculeId }: ModeBreakdownProps) {
  const highlightedIrrep = useExplorerStore((s) => s.highlightedIrrep);
  const setHighlightedIrrep = useExplorerStore((s) => s.setHighlightedIrrep);
  const activeMode = useExplorerStore((s) => s.activeMode);
  const playMode = useExplorerStore((s) => s.playMode);
  const stopMode = useExplorerStore((s) => s.stopMode);

  const modes = getModeBreakdown(table, nAtoms, linear);
  const totalModes = getTotalModes(nAtoms, linear);

  // Get available normal modes for this molecule
  const normalModes = NORMAL_MODES[moleculeId] ?? [];
  const hasAnyModes = normalModes.length > 0;

  return (
    <div className="term-panel" role="region" aria-label="Vibrational mode breakdown">
      <div className="term-header">
        <span className="flex-1">mode breakdown</span>
        <div className="flex items-center gap-2">
          {activeMode && (
            <button
              onClick={stopMode}
              className="text-[9px] text-error hover:text-error/80 transition-colors"
            >
              stop
            </button>
          )}
          <span className="text-[9px] text-[#555]">{totalModes} modes</span>
        </div>
      </div>
      <div className="p-3 space-y-1 relative z-10">
        <div className="text-[10px] text-[#555] mb-2">
          3({nAtoms}) - {linear ? '5' : '6'} = {totalModes} vibrational modes
          {hasAnyModes && (
            <span className="text-cyan ml-2">click to animate</span>
          )}
        </div>

        {table.irreps.map((irrep) => {
          const mode = modes.find((m) => m.irrep.label === irrep.label);
          if (!mode) return null;

          const isHighlighted = highlightedIrrep === irrep.label;
          const colorClass = ACTIVITY_COLORS[mode.activity];
          const activityLabel = ACTIVITY_LABELS[mode.activity];

          // Find available normal modes for this irrep
          const irrepModes = normalModes.filter((m) => m.irrep === irrep.label);
          const hasAnimations = irrepModes.length > 0;

          // Mark translation/rotation irreps
          const labels: string[] = [];
          if (mode.isTranslation) labels.push('T');
          if (mode.isRotation) labels.push('R');

          return (
            <div key={irrep.label}>
              <div
                className={`flex items-center gap-2 px-2 py-1 text-xs font-mono transition-colors cursor-pointer ${
                  isHighlighted ? 'bg-accent/10' : 'hover:bg-surface-2'
                }`}
                onMouseEnter={() => setHighlightedIrrep(irrep.label)}
                onMouseLeave={() => setHighlightedIrrep(null)}
              >
                <span className="text-foreground w-12">{irrep.label}</span>
                <span className={`${colorClass} flex-1`}>{activityLabel}</span>
                {labels.length > 0 && (
                  <span className="text-[10px] text-[#555]">
                    [{labels.join(',')}]
                  </span>
                )}
                {irrep.degeneracy > 1 && (
                  <span className="text-[10px] text-cyan">
                    x{irrep.degeneracy}
                  </span>
                )}
                {hasAnimations && (
                  <span className="text-[9px] text-cyan">
                    {irrepModes.length === 1 ? '1 mode' : `${irrepModes.length} modes`}
                  </span>
                )}
              </div>

              {/* Expandable mode list for this irrep */}
              {hasAnimations && (
                <div className="ml-14 space-y-0.5">
                  {irrepModes.map((nm) => {
                    const isPlaying =
                      activeMode?.irrep === nm.irrep &&
                      activeMode?.label === nm.label;

                    return (
                      <button
                        key={`${nm.irrep}-${nm.label}`}
                        onClick={() => {
                          if (isPlaying) {
                            stopMode();
                          } else {
                            playMode(nm.irrep, nm.label);
                          }
                        }}
                        className={`flex items-center gap-2 w-full px-2 py-0.5 text-[10px] font-mono transition-colors text-left ${
                          isPlaying
                            ? 'bg-cyan/10 text-cyan'
                            : 'text-[#666] hover:text-foreground hover:bg-surface-2'
                        }`}
                      >
                        <span>{isPlaying ? '■' : '▶'}</span>
                        <span className="flex-1 truncate">{nm.label}</span>
                        {nm.frequency && (
                          <span className="text-[9px] text-[#555]">
                            {nm.frequency} cm⁻¹
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
