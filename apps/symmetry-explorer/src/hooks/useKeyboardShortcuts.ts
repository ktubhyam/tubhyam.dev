'use client';

import { useEffect } from 'react';
import { MOLECULES } from '@/lib/data/molecules';
import { useExplorerStore } from '@/lib/store';

export function useKeyboardShortcuts() {
  const selectedId = useExplorerStore((s) => s.selectedMoleculeId);
  const setMolecule = useExplorerStore((s) => s.setMolecule);
  const showAllElements = useExplorerStore((s) => s.showAllElements);
  const hideAllElements = useExplorerStore((s) => s.hideAllElements);
  const visibleElements = useExplorerStore((s) => s.visibleElements);
  const stopAnimation = useExplorerStore((s) => s.stopAnimation);
  const isAnimating = useExplorerStore((s) => s.isAnimating);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't capture when typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const currentIndex = MOLECULES.findIndex((m) => m.id === selectedId);

      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown': {
          e.preventDefault();
          const nextIndex = (currentIndex + 1) % MOLECULES.length;
          setMolecule(MOLECULES[nextIndex].id);
          break;
        }
        case 'ArrowLeft':
        case 'ArrowUp': {
          e.preventDefault();
          const prevIndex =
            (currentIndex - 1 + MOLECULES.length) % MOLECULES.length;
          setMolecule(MOLECULES[prevIndex].id);
          break;
        }
        case ' ': {
          e.preventDefault();
          if (visibleElements.size > 0) {
            hideAllElements();
          } else {
            showAllElements();
          }
          break;
        }
        case 'Escape': {
          if (isAnimating) {
            e.preventDefault();
            stopAnimation();
          }
          break;
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    selectedId,
    setMolecule,
    showAllElements,
    hideAllElements,
    visibleElements,
    stopAnimation,
    isAnimating,
  ]);
}
