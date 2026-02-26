import type { OrbitalState, SubshellGroup, SubshellType, SubshellOccupancy } from '@/types/chemistry';

const SUBSHELL_NAMES: SubshellType[] = ['s', 'p', 'd', 'f'];

const ML_SUBSCRIPTS: Record<number, string> = {
  '-3': '₋₃', '-2': '₋₂', '-1': '₋₁', '0': '₀',
  '1': '₊₁', '2': '₊₂', '3': '₊₃',
};

// Madelung rule ordering: n+l, then lower n first
// This covers 1s through 4p (sufficient for Z=1 to Z=36)
export const MADELUNG_ORDER: Array<{ n: number; l: number }> = [
  { n: 1, l: 0 }, // 1s  (n+l=1)
  { n: 2, l: 0 }, // 2s  (n+l=2)
  { n: 2, l: 1 }, // 2p  (n+l=3)
  { n: 3, l: 0 }, // 3s  (n+l=3)
  { n: 3, l: 1 }, // 3p  (n+l=4)
  { n: 4, l: 0 }, // 4s  (n+l=4)
  { n: 3, l: 2 }, // 3d  (n+l=5)
  { n: 4, l: 1 }, // 4p  (n+l=5)
];

export function getSubshellLabel(n: number, l: number): string {
  return `${n}${SUBSHELL_NAMES[l]}`;
}

export function getOrbitalId(n: number, l: number, ml: number): string {
  return `${n}${SUBSHELL_NAMES[l]}_${ml}`;
}

export function getOrbitalSubshellLabel(n: number, l: number, ml: number): string {
  if (l === 0) return `${n}s`;
  return `${n}${SUBSHELL_NAMES[l]}${ML_SUBSCRIPTS[ml] ?? ml}`;
}

export function getSubshellType(l: number): SubshellType {
  return SUBSHELL_NAMES[l];
}

export function getOrbitalCount(l: number): number {
  return 2 * l + 1;
}

export function getMaxElectrons(l: number): number {
  return 2 * (2 * l + 1);
}

// Generate energy value for sorting (Madelung order)
function getEnergy(n: number, l: number): number {
  const madelungIndex = MADELUNG_ORDER.findIndex(m => m.n === n && m.l === l);
  return madelungIndex >= 0 ? madelungIndex : (n + l) * 10 + n;
}

// Create empty orbital states for all subshells needed for a given element
export function createOrbitalStates(atomicNumber: number): OrbitalState[] {
  const orbitals: OrbitalState[] = [];
  let electronCapacity = 0;

  for (const { n, l } of MADELUNG_ORDER) {
    const orbitalCount = getOrbitalCount(l);
    const energy = getEnergy(n, l);

    for (let ml = -l; ml <= l; ml++) {
      orbitals.push({
        id: getOrbitalId(n, l, ml),
        n,
        l,
        ml,
        label: getSubshellLabel(n, l),
        subshellLabel: getOrbitalSubshellLabel(n, l, ml),
        energy,
        electrons: [],
        maxElectrons: 2,
      });
    }

    electronCapacity += orbitalCount * 2;
    if (electronCapacity >= atomicNumber) break;
  }

  return orbitals;
}

// Create subshell groups for the energy diagram display
export function createSubshellGroups(atomicNumber: number): SubshellGroup[] {
  const groups: SubshellGroup[] = [];
  let electronCapacity = 0;

  for (const { n, l } of MADELUNG_ORDER) {
    const orbitalCount = getOrbitalCount(l);
    const energy = getEnergy(n, l);
    const type = getSubshellType(l);
    const label = getSubshellLabel(n, l);

    const orbitals: OrbitalState[] = [];
    for (let ml = -l; ml <= l; ml++) {
      orbitals.push({
        id: getOrbitalId(n, l, ml),
        n,
        l,
        ml,
        label,
        subshellLabel: getOrbitalSubshellLabel(n, l, ml),
        energy,
        electrons: [],
        maxElectrons: 2,
      });
    }

    groups.push({
      n,
      l,
      label,
      type,
      energy,
      orbitalCount,
      orbitals,
    });

    electronCapacity += orbitalCount * 2;
    if (electronCapacity >= atomicNumber) break;
  }

  return groups;
}

// Get the correct ground-state config as a flat list of orbital fills
export function getGroundStateConfig(config: SubshellOccupancy[]): Map<string, number> {
  const fills = new Map<string, number>();

  for (const { n, l, electrons } of config) {
    const orbitalCount = getOrbitalCount(l);

    // Distribute electrons following Hund's rule:
    // First, fill one electron per orbital (all spin-up)
    // Then, pair up remaining electrons (spin-down)
    let remaining = electrons;
    const perOrbital: number[] = new Array(orbitalCount).fill(0);

    // Phase 1: one per orbital
    for (let i = 0; i < orbitalCount && remaining > 0; i++) {
      perOrbital[i] = 1;
      remaining--;
    }

    // Phase 2: pair up
    for (let i = 0; i < orbitalCount && remaining > 0; i++) {
      perOrbital[i] = 2;
      remaining--;
    }

    for (let i = 0; i < orbitalCount; i++) {
      const ml = i - l;
      const id = getOrbitalId(n, l, ml);
      fills.set(id, perOrbital[i]);
    }
  }

  return fills;
}

// Subshell colors
export const SUBSHELL_COLORS: Record<SubshellType, string> = {
  s: '#4A90D9', // Blue
  p: '#E8913A', // Amber
  d: '#A78BFA', // Violet
  f: '#F472B6', // Pink
};

export const SUBSHELL_GLOW_COLORS: Record<SubshellType, string> = {
  s: '#6BB3FF',
  p: '#FFB366',
  d: '#C4B5FD',
  f: '#F9A8D4',
};
