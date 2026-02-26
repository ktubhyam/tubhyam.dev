'use client';

import { create } from 'zustand';

interface ActiveMode {
  irrep: string;
  label: string;
}

interface ExplorerStore {
  // Molecule selection
  selectedMoleculeId: string;
  setMolecule: (id: string) => void;

  // Symmetry element visibility
  visibleElements: Set<string>;
  toggleElement: (label: string) => void;
  showAllElements: () => void;
  hideAllElements: () => void;

  // Symmetry operation animation state
  activeOperation: string | null;
  isAnimating: boolean;
  playOperation: (label: string) => void;
  stopAnimation: () => void;

  // Vibrational mode animation
  activeMode: ActiveMode | null;
  playMode: (irrep: string, label: string) => void;
  stopMode: () => void;

  // Character table highlight
  highlightedIrrep: string | null;
  setHighlightedIrrep: (label: string | null) => void;

  // UI state
  sidebarTab: string;
  setSidebarTab: (tab: string) => void;
}

export const useExplorerStore = create<ExplorerStore>((set) => ({
  // Default to water
  selectedMoleculeId: 'water',
  setMolecule: (id) =>
    set({
      selectedMoleculeId: id,
      visibleElements: new Set<string>(),
      activeOperation: null,
      isAnimating: false,
      activeMode: null,
      highlightedIrrep: null,
    }),

  visibleElements: new Set<string>(),
  toggleElement: (label) =>
    set((state) => {
      const next = new Set(state.visibleElements);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return { visibleElements: next };
    }),
  showAllElements: () =>
    set({ visibleElements: new Set<string>(['__all__']) }),
  hideAllElements: () =>
    set({ visibleElements: new Set<string>() }),

  activeOperation: null,
  isAnimating: false,
  playOperation: (label) =>
    set({ activeOperation: label, isAnimating: true, activeMode: null }),
  stopAnimation: () =>
    set({ activeOperation: null, isAnimating: false }),

  activeMode: null,
  playMode: (irrep, label) =>
    set({ activeMode: { irrep, label }, activeOperation: null, isAnimating: false }),
  stopMode: () =>
    set({ activeMode: null }),

  highlightedIrrep: null,
  setHighlightedIrrep: (label) =>
    set({ highlightedIrrep: label }),

  sidebarTab: 'molecules',
  setSidebarTab: (tab) =>
    set({ sidebarTab: tab }),
}));
