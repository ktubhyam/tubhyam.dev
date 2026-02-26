'use client';

import { useMemo } from 'react';
import { MOLECULES } from '@/lib/data/molecules';
import { useExplorerStore } from '@/lib/store';

export function MoleculePicker() {
  const selectedId = useExplorerStore((s) => s.selectedMoleculeId);
  const setMolecule = useExplorerStore((s) => s.setMolecule);

  const grouped = useMemo(() => {
    const groups: Record<string, typeof MOLECULES> = {};
    for (const mol of MOLECULES) {
      const pg = mol.pointGroup;
      if (!groups[pg]) groups[pg] = [];
      groups[pg].push(mol);
    }
    return groups;
  }, []);

  return (
    <div className="term-panel" role="region" aria-label="Molecule library">
      <div className="term-header">molecules</div>
      <div className="p-3 space-y-3 relative z-10">
        {Object.entries(grouped).map(([pg, mols]) => (
          <div key={pg}>
            <div className="text-[10px] text-accent-dim uppercase tracking-wider mb-1">
              {pg}
            </div>
            <div className="flex flex-wrap gap-1">
              {mols.map((mol) => (
                <button
                  key={mol.id}
                  onClick={() => setMolecule(mol.id)}
                  className={`px-2 py-1 text-xs font-mono border transition-colors ${
                    selectedId === mol.id
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-border text-[#888] hover:border-border-bright hover:text-foreground'
                  }`}
                >
                  {mol.formula}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
