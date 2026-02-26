import { useCallback } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { audio } from '@/lib/game/audio';
import type { Spin } from '@/types/chemistry';

/**
 * Encapsulates placeElectron + audio feedback into a single function.
 * Used by GameLayout (drag-and-drop), EnergyDiagram (click), and OrbitalViewer (click).
 */
export function usePlaceWithAudio() {
  const placeElectron = useGameStore(s => s.placeElectron);

  const placeWithAudio = useCallback((orbitalId: string, spin: Spin): boolean => {
    const success = placeElectron(orbitalId, spin);
    if (success) {
      const state = useGameStore.getState();
      const orbital = state.orbitals.find(o => o.id === orbitalId);
      if (orbital) {
        audio.playPlacement(orbital.n, orbital.l, orbital.ml);
        const siblings = state.orbitals.filter(o => o.n === orbital.n && o.l === orbital.l);
        const subshellFull = siblings.every(o => o.electrons.length >= 2);
        if (subshellFull) {
          audio.playSubshellComplete(orbital.n);
        }
        audio.playStreak(state.streak);
        if (state.isComplete) {
          setTimeout(() => audio.playLevelComplete(), 200);
        }
      }
    } else {
      const state = useGameStore.getState();
      if (state.lastViolation?.severity === 'error') {
        audio.playError();
      } else {
        audio.playWarning();
      }
    }
    return success;
  }, [placeElectron]);

  return placeWithAudio;
}
