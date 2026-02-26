'use client';

import type { MoleculeData, CharacterTableData } from '@/types';

interface PointGroupInfoProps {
  molecule: MoleculeData;
  table: CharacterTableData;
}

export function PointGroupInfo({ molecule, table }: PointGroupInfoProps) {
  const totalModes = molecule.linear
    ? 3 * molecule.atoms.length - 5
    : 3 * molecule.atoms.length - 6;

  return (
    <div className="term-panel" role="region" aria-label={`Point group ${table.pointGroup}`}>
      <div className="term-header">point group</div>
      <div className="p-3 space-y-2 relative z-10">
        <div className="flex items-baseline gap-3">
          <span className="text-2xl font-mono text-accent font-bold">
            {table.pointGroup}
          </span>
          <span className="text-xs text-[#666]">
            order {table.order}
          </span>
        </div>

        <div className="text-xs text-[#888] space-y-1">
          <div>
            <span className="text-[#555]">molecule:</span>{' '}
            <span className="text-foreground">{molecule.name}</span>{' '}
            <span className="text-accent">({molecule.formula})</span>
          </div>
          <div>
            <span className="text-[#555]">atoms:</span>{' '}
            <span className="text-foreground">{molecule.atoms.length}</span>
            {molecule.linear && (
              <span className="text-cyan ml-2">[linear]</span>
            )}
          </div>
          <div>
            <span className="text-[#555]">vibrational modes:</span>{' '}
            <span className="text-foreground">
              3({molecule.atoms.length}) - {molecule.linear ? '5' : '6'} ={' '}
              {totalModes}
            </span>
          </div>
          <div>
            <span className="text-[#555]">irreps:</span>{' '}
            <span className="text-foreground">{table.irreps.length}</span>
          </div>
          <div>
            <span className="text-[#555]">operations:</span>{' '}
            <span className="text-foreground">
              {table.operations.map((op) =>
                op.count > 1 ? `${op.count}${op.label}` : op.label
              ).join(', ')}
            </span>
          </div>
          {table.hasInversion && (
            <div className="text-accent text-[10px] mt-1">
              centrosymmetric — mutual exclusion applies
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
