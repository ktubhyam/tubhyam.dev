/**
 * Elo Rating System for Orbital Architect
 *
 * Each element has a difficulty rating based on atomic number and complexity.
 * Player performance (mistakes, hints, time) determines S score (0.1–1.0).
 * Standard Elo formula adjusts player rating per level completion.
 */

export const INITIAL_RATING = 1000;
const K_FACTOR = 32;

// --- Element Difficulty Ratings ---
// Scale: ~400 (Hydrogen) to ~2000 (Kr d-block)
// Aufbau exceptions (Cr Z=24, Cu Z=29) get +200 bonus
export function getElementDifficulty(
  atomicNumber: number,
  isAufbauException: boolean
): number {
  let rating: number;

  if (atomicNumber <= 2) {
    // Period 1: H, He — trivial
    rating = 400 + (atomicNumber - 1) * 50;
  } else if (atomicNumber <= 10) {
    // Period 2: Li–Ne — introduces p orbitals, Hund's rule
    rating = 500 + (atomicNumber - 3) * 60;
  } else if (atomicNumber <= 18) {
    // Period 3: Na–Ar — same patterns, longer sequences
    rating = 700 + (atomicNumber - 11) * 55;
  } else if (atomicNumber <= 20) {
    // K, Ca — 4s before 3d, tests Aufbau awareness
    rating = 1000 + (atomicNumber - 19) * 80;
  } else if (atomicNumber <= 30) {
    // Sc–Zn — d-block transition metals
    rating = 1200 + (atomicNumber - 21) * 70;
  } else {
    // Ga–Kr — post-d p-block
    rating = 1400 + (atomicNumber - 31) * 80;
  }

  if (isAufbauException) {
    rating += 200;
  }

  return rating;
}

// --- Performance Score S (0.1 to 1.0) ---
export interface PerformanceInput {
  mistakes: number;
  hintsUsed: number;
  timeSeconds: number;
  totalElectrons: number;
  maxStreak: number;
}

export function calculatePerformanceScore(input: PerformanceInput): number {
  let S = 1.0;

  // -0.15 per mistake
  S -= input.mistakes * 0.15;

  // -0.1 per hint
  S -= input.hintsUsed * 0.1;

  // Time penalty: slow = more than 5 seconds per electron
  const expectedTime = input.totalElectrons * 5;
  if (input.timeSeconds > expectedTime) {
    S -= 0.1;
  }

  // Streak bonus
  if (input.maxStreak >= 10) {
    S += 0.05;
  } else if (input.maxStreak >= 5) {
    S += 0.02;
  }

  return Math.max(0.1, Math.min(1.0, S));
}

// --- Elo Calculation ---
export function calculateExpectedScore(
  playerRating: number,
  elementDifficulty: number
): number {
  return 1 / (1 + Math.pow(10, (elementDifficulty - playerRating) / 400));
}

export function calculateEloChange(
  playerRating: number,
  elementDifficulty: number,
  performanceScore: number
): number {
  const expected = calculateExpectedScore(playerRating, elementDifficulty);
  return Math.round(K_FACTOR * (performanceScore - expected));
}

export function calculateNewRating(
  currentRating: number,
  change: number
): number {
  return Math.max(100, currentRating + change);
}
