import type { OrbitalState, Spin } from './chemistry';

export type GameMode = 'campaign' | 'challenge' | 'sandbox';

export type GamePhase = 'menu' | 'level-select' | 'playing' | 'complete' | 'review';

export interface RuleViolation {
  type: 'aufbau' | 'pauli' | 'hund';
  message: string;
  detail: string;
  orbitalId: string;
  severity: 'error' | 'warning'; // error = hard block, warning = point deduction
}

export interface PlacementAction {
  orbitalId: string;
  spin: Spin;
  timestamp: number;
}

export interface LevelResult {
  elementNumber: number;
  score: number;
  stars: 0 | 1 | 2 | 3;
  mistakes: number;
  hintsUsed: number;
  timeSeconds: number;
  perfect: boolean;
}

export interface LevelProgress {
  unlocked: boolean;
  completed: boolean;
  bestScore: number;
  bestStars: 0 | 1 | 2 | 3;
  attempts: number;
}

export interface ChallengeResult {
  element: string;
  score: number;
  timeRemaining: number;
  streak: number;
  correct: boolean;
}

export interface LeaderboardEntry {
  name: string;
  score: number;
  streak: number;
  date: string;
}

export interface GameState {
  mode: GameMode;
  phase: GamePhase;
  currentElement: number;         // atomic number
  orbitals: OrbitalState[];
  placedElectrons: number;
  totalElectrons: number;
  score: number;
  mistakes: number;
  hintsUsed: number;
  streak: number;
  history: PlacementAction[];     // for undo
  startTime: number;
  selectedSpin: Spin;
  highlightedOrbitalId: string | null;
  lastViolation: RuleViolation | null;
}

export interface EloChange {
  elementNumber: number;
  previousRating: number;
  newRating: number;
  performanceScore: number;
  timestamp: number;
}

export interface EloRating {
  current: number;
  peak: number;
  history: EloChange[];
}

export interface ProgressState {
  campaignLevels: Record<number, LevelProgress>;
  eloRating: EloRating;
  challengeHighScore: number;
  challengeLeaderboard: LeaderboardEntry[];
  totalScore: number;
  achievements: string[];
}
