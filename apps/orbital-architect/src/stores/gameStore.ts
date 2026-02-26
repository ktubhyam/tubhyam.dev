'use client';

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Spin, OrbitalState } from '@/types/chemistry';
import type { GameMode, GamePhase, RuleViolation, PlacementAction } from '@/types/game';
import { createOrbitalStates, validatePlacement, getNextCorrectOrbital, getElement } from '@/lib/chemistry';

interface GameStore {
  // State
  mode: GameMode;
  phase: GamePhase;
  currentElement: number;
  orbitals: OrbitalState[];
  placedElectrons: number;
  totalElectrons: number;
  score: number;
  mistakes: number;
  hintsUsed: number;
  streak: number;
  maxStreak: number;
  history: PlacementAction[];
  startTime: number;
  selectedSpin: Spin;
  highlightedOrbitalId: string | null;
  lastViolation: RuleViolation | null;
  showViolation: boolean;
  isComplete: boolean;

  // Actions
  setMode: (mode: GameMode) => void;
  setPhase: (phase: GamePhase) => void;
  startLevel: (atomicNumber: number) => void;
  placeElectron: (orbitalId: string, spin: Spin) => boolean;
  undoLastPlacement: () => void;
  resetLevel: () => void;
  useHint: () => { orbitalId: string; spin: Spin } | null;
  setSelectedSpin: (spin: Spin) => void;
  setHighlightedOrbital: (id: string | null) => void;
  clearViolation: () => void;
  getStreakMultiplier: () => number;
}

export const useGameStore = create<GameStore>()(devtools((set, get) => ({
  mode: 'campaign',
  phase: 'menu',
  currentElement: 1,
  orbitals: [],
  placedElectrons: 0,
  totalElectrons: 0,
  score: 0,
  mistakes: 0,
  hintsUsed: 0,
  streak: 0,
  maxStreak: 0,
  history: [],
  startTime: 0,
  selectedSpin: 'up',
  highlightedOrbitalId: null,
  lastViolation: null,
  showViolation: false,
  isComplete: false,

  setMode: (mode) => set({ mode }),
  setPhase: (phase) => set({ phase }),

  startLevel: (atomicNumber) => {
    const orbitals = createOrbitalStates(atomicNumber);
    set({
      currentElement: atomicNumber,
      orbitals,
      placedElectrons: 0,
      totalElectrons: atomicNumber,
      score: 0,
      mistakes: 0,
      hintsUsed: 0,
      streak: 0,
      maxStreak: 0,
      history: [],
      startTime: Date.now(),
      selectedSpin: 'up',
      highlightedOrbitalId: null,
      lastViolation: null,
      showViolation: false,
      isComplete: false,
      phase: 'playing',
    });
  },

  placeElectron: (orbitalId, spin) => {
    const state = get();
    const isSandbox = state.mode === 'sandbox';

    const { valid, violation } = validatePlacement(
      state.orbitals,
      orbitalId,
      spin,
      isSandbox
    );

    if (!valid) {
      set({
        lastViolation: violation,
        showViolation: true,
        mistakes: state.mistakes + 1,
        streak: 0,
      });
      return false;
    }

    // Place the electron
    const newOrbitals = state.orbitals.map(orbital => {
      if (orbital.id === orbitalId) {
        return {
          ...orbital,
          electrons: [
            ...orbital.electrons,
            { spin, placedAt: Date.now() },
          ],
        };
      }
      return orbital;
    });

    const newPlaced = state.placedElectrons + 1;
    const isComplete = newPlaced >= state.totalElectrons;

    // Scoring
    let scoreGain = 100; // base points
    const newStreak = violation ? 0 : state.streak + 1; // Hund violation resets streak
    const multiplier = getStreakMultiplier(newStreak);
    scoreGain = Math.round(scoreGain * multiplier);

    if (violation) {
      // Hund's rule warning — still valid but lose points
      scoreGain = Math.max(scoreGain - 50, 10);
    }

    const newHistory: PlacementAction = {
      orbitalId,
      spin,
      timestamp: Date.now(),
    };

    set({
      orbitals: newOrbitals,
      placedElectrons: newPlaced,
      score: state.score + scoreGain,
      streak: newStreak,
      maxStreak: Math.max(state.maxStreak, newStreak),
      mistakes: violation ? state.mistakes + 1 : state.mistakes,
      history: [...state.history, newHistory],
      lastViolation: violation,
      showViolation: !!violation,
      isComplete,
      phase: isComplete ? 'complete' : 'playing',
    });

    return true;
  },

  undoLastPlacement: () => {
    const state = get();
    if (state.history.length === 0) return;

    const lastAction = state.history[state.history.length - 1];
    const newOrbitals = state.orbitals.map(orbital => {
      if (orbital.id === lastAction.orbitalId) {
        return {
          ...orbital,
          electrons: orbital.electrons.slice(0, -1),
        };
      }
      return orbital;
    });

    set({
      orbitals: newOrbitals,
      placedElectrons: state.placedElectrons - 1,
      history: state.history.slice(0, -1),
      isComplete: false,
      phase: 'playing',
    });
  },

  resetLevel: () => {
    const state = get();
    const orbitals = createOrbitalStates(state.currentElement);
    set({
      orbitals,
      placedElectrons: 0,
      score: 0,
      mistakes: 0,
      streak: 0,
      maxStreak: 0,
      history: [],
      startTime: Date.now(),
      lastViolation: null,
      showViolation: false,
      isComplete: false,
      phase: 'playing',
    });
  },

  useHint: () => {
    const state = get();
    const hint = getNextCorrectOrbital(state.orbitals);
    if (hint) {
      set({
        hintsUsed: state.hintsUsed + 1,
        highlightedOrbitalId: hint.orbitalId,
        // Hints now affect Elo performance score, no direct point deduction
      });
    }
    return hint;
  },

  setSelectedSpin: (spin) => set({ selectedSpin: spin }),
  setHighlightedOrbital: (id) => set({ highlightedOrbitalId: id }),
  clearViolation: () => set({ showViolation: false, lastViolation: null }),

  getStreakMultiplier: () => {
    return getStreakMultiplier(get().streak);
  },
}), { name: 'GameStore' }));

function getStreakMultiplier(streak: number): number {
  if (streak >= 15) return 3.0;
  if (streak >= 10) return 2.5;
  if (streak >= 5) return 2.0;
  if (streak >= 3) return 1.5;
  return 1.0;
}

// Helper to calculate star rating
export function calculateStars(mistakes: number, hintsUsed: number): 0 | 1 | 2 | 3 {
  if (mistakes === 0 && hintsUsed === 0) return 3;
  if (mistakes <= 2 && hintsUsed <= 1) return 2;
  return 1;
}
