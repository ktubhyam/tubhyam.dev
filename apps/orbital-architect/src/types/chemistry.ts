export type Spin = 'up' | 'down';

export type SubshellType = 's' | 'p' | 'd' | 'f';

export interface QuantumNumbers {
  n: number;       // principal quantum number (1, 2, 3, ...)
  l: number;       // angular momentum (0=s, 1=p, 2=d, 3=f)
  ml: number;      // magnetic quantum number (-l to +l)
  ms?: Spin;       // spin (+1/2 = up, -1/2 = down)
}

export interface ElectronSlot {
  spin: Spin;
  placedAt: number; // timestamp for ordering
}

export interface OrbitalState {
  id: string;            // e.g., "1s_0", "2p_-1", "3d_2"
  n: number;
  l: number;
  ml: number;
  label: string;         // e.g., "1s", "2p", "3d"
  subshellLabel: string; // e.g., "2p₋₁", "3d₊₂"
  energy: number;        // relative energy for Aufbau ordering
  electrons: ElectronSlot[];
  maxElectrons: 2;
}

export interface SubshellGroup {
  n: number;
  l: number;
  label: string;         // "1s", "2p", "3d", etc.
  type: SubshellType;
  energy: number;
  orbitalCount: number;  // 1 for s, 3 for p, 5 for d, 7 for f
  orbitals: OrbitalState[];
}

export interface Element {
  atomicNumber: number;
  symbol: string;
  name: string;
  electronConfig: string;       // display string: "1s² 2s² 2p⁶ ..."
  nobleGasConfig?: string;      // short notation: "[Ar] 3d⁶ 4s²"
  period: number;
  group: number;
  category: ElementCategory;
  isAufbauException: boolean;
  exceptionNote?: string;
}

export type ElementCategory =
  | 'nonmetal'
  | 'noble-gas'
  | 'alkali-metal'
  | 'alkaline-earth'
  | 'metalloid'
  | 'halogen'
  | 'transition-metal'
  | 'post-transition-metal';

export interface SubshellOccupancy {
  n: number;
  l: number;
  electrons: number;
}
