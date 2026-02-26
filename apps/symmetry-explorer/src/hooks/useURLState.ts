'use client';

import { useEffect, useRef } from 'react';
import { MOLECULES } from '@/lib/data/molecules';
import { useExplorerStore } from '@/lib/store';

/**
 * Sync selected molecule with URL query parameter (?mol=benzene).
 * Allows sharing links to specific molecules.
 */
export function useURLState() {
  const selectedId = useExplorerStore((s) => s.selectedMoleculeId);
  const setMolecule = useExplorerStore((s) => s.setMolecule);
  const initialized = useRef(false);

  // On mount: read from URL
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const params = new URLSearchParams(window.location.search);
    const mol = params.get('mol');
    if (mol && MOLECULES.some((m) => m.id === mol)) {
      setMolecule(mol);
    }
  }, [setMolecule]);

  // On change: update URL
  useEffect(() => {
    if (!initialized.current) return;

    const url = new URL(window.location.href);
    if (selectedId === 'water') {
      url.searchParams.delete('mol');
    } else {
      url.searchParams.set('mol', selectedId);
    }
    window.history.replaceState({}, '', url.toString());
  }, [selectedId]);
}
