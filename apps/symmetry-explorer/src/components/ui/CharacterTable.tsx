'use client';

import type { CharacterTableData } from '@/types';
import { useExplorerStore } from '@/lib/store';
import { getActivityLabel } from '@/lib/chemistry/selectionRules';

interface CharacterTableProps {
  table: CharacterTableData;
}

export function CharacterTable({ table }: CharacterTableProps) {
  const highlightedIrrep = useExplorerStore((s) => s.highlightedIrrep);
  const setHighlightedIrrep = useExplorerStore((s) => s.setHighlightedIrrep);

  return (
    <div className="term-panel" role="region" aria-label={`Character table for ${table.pointGroup}`}>
      <div className="term-header">
        <span className="flex-1">character table</span>
        <span className="text-[9px] text-[#555]">{table.pointGroup}</span>
      </div>
      <div className="p-3 overflow-x-auto relative z-10">
        <table className="char-table w-full border-collapse">
          <thead>
            <tr>
              <th className="text-left !text-accent">{table.pointGroup}</th>
              {table.operations.map((op) => (
                <th key={op.label}>
                  {op.count > 1 ? `${op.count}${op.label}` : op.label}
                </th>
              ))}
              <th className="!text-left !text-[#666]">linear</th>
              <th className="!text-left !text-[#666]">quadratic</th>
            </tr>
          </thead>
          <tbody>
            {table.irreps.map((irrep) => {
              const activity = getActivityLabel(irrep);
              const isHighlighted = highlightedIrrep === irrep.label;

              let rowClass = '';
              if (activity === 'IR + Raman') rowClass = 'both-active';
              else if (activity === 'IR') rowClass = 'ir-active';
              else if (activity === 'Raman') rowClass = 'raman-active';

              return (
                <tr
                  key={irrep.label}
                  className={`${rowClass} cursor-pointer transition-colors ${
                    isHighlighted ? 'bg-accent/10' : ''
                  }`}
                  onMouseEnter={() => setHighlightedIrrep(irrep.label)}
                  onMouseLeave={() => setHighlightedIrrep(null)}
                >
                  <td className="!text-left font-semibold text-foreground">
                    {irrep.label}
                  </td>
                  {irrep.characters.map((c, i) => (
                    <td key={i} className="text-[#aaa]">
                      {c}
                    </td>
                  ))}
                  <td className="!text-left text-[11px] text-[#777]">
                    {irrep.linearFunctions.join(', ') || '—'}
                  </td>
                  <td className="!text-left text-[11px] text-[#777]">
                    {irrep.quadraticFunctions.join(', ') || '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
