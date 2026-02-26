'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { LevelProgress, LeaderboardEntry, EloRating, EloChange } from '@/types/game';
import {
  getElementDifficulty,
  calculatePerformanceScore,
  calculateEloChange,
  calculateNewRating,
  INITIAL_RATING,
} from '@/lib/game/elo';
import { getElement } from '@/lib/chemistry';

interface ProgressStore {
  campaignLevels: Record<number, LevelProgress>;
  eloRating: EloRating;
  challengeHighScore: number;
  challengeLeaderboard: LeaderboardEntry[];
  totalScore: number;
  achievements: string[];

  // Actions
  completeCampaignLevel: (
    atomicNumber: number,
    score: number,
    stars: 0 | 1 | 2 | 3,
    mistakes: number,
    hintsUsed: number,
    timeSeconds: number,
    maxStreak: number
  ) => number; // returns Elo change
  applyEloChange: (atomicNumber: number, mistakes: number, hintsUsed: number, timeSeconds: number, maxStreak: number, totalElectrons: number) => number;
  unlockNextLevel: (atomicNumber: number) => void;
  addChallengeResult: (score: number, streak: number, name?: string) => void;
  addAchievement: (id: string) => void;
  isLevelUnlocked: (atomicNumber: number) => boolean;
  getLevelProgress: (atomicNumber: number) => LevelProgress | undefined;
  resetProgress: () => void;
}

const initialLevels: Record<number, LevelProgress> = {
  1: { unlocked: true, completed: false, bestScore: 0, bestStars: 0, attempts: 0 },
};

export const useProgressStore = create<ProgressStore>()(
  devtools(persist(
    (set, get) => ({
      campaignLevels: initialLevels,
      eloRating: { current: INITIAL_RATING, peak: INITIAL_RATING, history: [] },
      challengeHighScore: 0,
      challengeLeaderboard: [],
      totalScore: 0,
      achievements: [],

      applyEloChange: (atomicNumber, mistakes, hintsUsed, timeSeconds, maxStreak, totalElectrons) => {
        const state = get();
        const element = getElement(atomicNumber);
        const difficulty = getElementDifficulty(atomicNumber, element.isAufbauException);
        const perfScore = calculatePerformanceScore({
          mistakes, hintsUsed, timeSeconds, totalElectrons, maxStreak,
        });
        const change = calculateEloChange(state.eloRating.current, difficulty, perfScore);
        const newRating = calculateNewRating(state.eloRating.current, change);

        const eloEntry: EloChange = {
          elementNumber: atomicNumber,
          previousRating: state.eloRating.current,
          newRating,
          performanceScore: perfScore,
          timestamp: Date.now(),
        };

        set({
          eloRating: {
            current: newRating,
            peak: Math.max(state.eloRating.peak, newRating),
            history: [...state.eloRating.history, eloEntry].slice(-50),
          },
        });

        return change;
      },

      completeCampaignLevel: (atomicNumber, score, stars, mistakes, hintsUsed, timeSeconds, maxStreak) => {
        const state = get();
        const existing = state.campaignLevels[atomicNumber];
        const newBestScore = Math.max(existing?.bestScore ?? 0, score);
        const newBestStars = Math.max(existing?.bestStars ?? 0, stars) as 0 | 1 | 2 | 3;

        const updatedLevels = {
          ...state.campaignLevels,
          [atomicNumber]: {
            unlocked: true,
            completed: true,
            bestScore: newBestScore,
            bestStars: newBestStars,
            attempts: (existing?.attempts ?? 0) + 1,
          },
        };

        // Unlock next level
        const nextLevel = atomicNumber + 1;
        if (nextLevel <= 36 && !updatedLevels[nextLevel]) {
          updatedLevels[nextLevel] = {
            unlocked: true,
            completed: false,
            bestScore: 0,
            bestStars: 0,
            attempts: 0,
          };
        }

        // Check for achievements
        const newAchievements = [...state.achievements];
        if (stars === 3 && !newAchievements.includes('perfect_config')) {
          newAchievements.push('perfect_config');
        }
        if (mistakes === 0 && hintsUsed === 0 && !newAchievements.includes('no_mistakes')) {
          newAchievements.push('no_mistakes');
        }
        if (atomicNumber === 36 && !newAchievements.includes('all_36')) {
          newAchievements.push('all_36');
        }
        // Noble gas achievements
        if ([2, 10, 18, 36].includes(atomicNumber) && stars === 3) {
          const nobleBadge = `noble_${atomicNumber}`;
          if (!newAchievements.includes(nobleBadge)) {
            newAchievements.push(nobleBadge);
          }
        }
        // Exception hunter
        if ([24, 29].includes(atomicNumber) && mistakes === 0 && hintsUsed === 0) {
          if (!newAchievements.includes('exception_hunter')) {
            newAchievements.push('exception_hunter');
          }
        }

        // Compute Elo change
        const element = getElement(atomicNumber);
        const difficulty = getElementDifficulty(atomicNumber, element.isAufbauException);
        const perfScore = calculatePerformanceScore({
          mistakes, hintsUsed, timeSeconds, totalElectrons: atomicNumber, maxStreak,
        });
        const eloChange = calculateEloChange(state.eloRating.current, difficulty, perfScore);
        const newRating = calculateNewRating(state.eloRating.current, eloChange);

        const eloEntry: EloChange = {
          elementNumber: atomicNumber,
          previousRating: state.eloRating.current,
          newRating,
          performanceScore: perfScore,
          timestamp: Date.now(),
        };

        set({
          campaignLevels: updatedLevels,
          totalScore: state.totalScore + score,
          achievements: newAchievements,
          eloRating: {
            current: newRating,
            peak: Math.max(state.eloRating.peak, newRating),
            history: [...state.eloRating.history, eloEntry].slice(-50),
          },
        });

        return eloChange;
      },

      unlockNextLevel: (atomicNumber) => {
        const state = get();
        const nextLevel = atomicNumber + 1;
        if (nextLevel <= 36 && !state.campaignLevels[nextLevel]?.unlocked) {
          set({
            campaignLevels: {
              ...state.campaignLevels,
              [nextLevel]: {
                unlocked: true,
                completed: false,
                bestScore: 0,
                bestStars: 0,
                attempts: 0,
              },
            },
          });
        }
      },

      addChallengeResult: (score, streak, name = 'Player') => {
        const state = get();
        const entry: LeaderboardEntry = {
          name,
          score,
          streak,
          date: new Date().toISOString(),
        };

        const newLeaderboard = [...state.challengeLeaderboard, entry]
          .sort((a, b) => b.score - a.score)
          .slice(0, 10); // Keep top 10

        set({
          challengeHighScore: Math.max(state.challengeHighScore, score),
          challengeLeaderboard: newLeaderboard,
        });
      },

      addAchievement: (id) => {
        const state = get();
        if (!state.achievements.includes(id)) {
          set({ achievements: [...state.achievements, id] });
        }
      },

      isLevelUnlocked: (atomicNumber) => {
        return get().campaignLevels[atomicNumber]?.unlocked ?? false;
      },

      getLevelProgress: (atomicNumber) => {
        return get().campaignLevels[atomicNumber];
      },

      resetProgress: () => {
        set({
          campaignLevels: initialLevels,
          eloRating: { current: INITIAL_RATING, peak: INITIAL_RATING, history: [] },
          challengeHighScore: 0,
          challengeLeaderboard: [],
          totalScore: 0,
          achievements: [],
        });
      },
    }),
    {
      name: 'orbital-architect-progress',
    }
  ), { name: 'ProgressStore' })
);
