import type { OrbitalState, Spin } from '@/types/chemistry';
import type { RuleViolation } from '@/types/game';
import { MADELUNG_ORDER, getOrbitalId, getOrbitalCount } from './orbitals';

// Check Pauli Exclusion Principle:
// Max 2 electrons per orbital, must have opposite spins
export function checkPauli(
  orbital: OrbitalState,
  spin: Spin
): RuleViolation | null {
  if (orbital.electrons.length >= 2) {
    return {
      type: 'pauli',
      message: 'Pauli Exclusion Principle',
      detail: `This orbital already has 2 electrons. Each orbital can hold at most 2 electrons with opposite spins.`,
      orbitalId: orbital.id,
      severity: 'error',
    };
  }

  if (orbital.electrons.length === 1 && orbital.electrons[0].spin === spin) {
    return {
      type: 'pauli',
      message: 'Pauli Exclusion Principle',
      detail: `This orbital already has a spin-${spin} electron. The second electron must have opposite spin.`,
      orbitalId: orbital.id,
      severity: 'error',
    };
  }

  return null;
}

// Check Aufbau Principle:
// Lower energy orbitals must be filled before higher energy ones
export function checkAufbau(
  orbitals: OrbitalState[],
  targetOrbital: OrbitalState,
): RuleViolation | null {
  // Find all subshells with lower energy than the target
  for (const { n, l } of MADELUNG_ORDER) {
    const subshellEnergy = MADELUNG_ORDER.findIndex(m => m.n === n && m.l === l);
    if (subshellEnergy >= targetOrbital.energy) break;

    // Check if this lower-energy subshell is fully filled
    const orbitalCount = getOrbitalCount(l);
    let totalElectrons = 0;

    for (let ml = -l; ml <= l; ml++) {
      const id = getOrbitalId(n, l, ml);
      const orbital = orbitals.find(o => o.id === id);
      if (orbital) {
        totalElectrons += orbital.electrons.length;
      }
    }

    const maxElectrons = orbitalCount * 2;
    if (totalElectrons < maxElectrons) {
      const subshellLabel = `${n}${['s', 'p', 'd', 'f'][l]}`;
      return {
        type: 'aufbau',
        message: 'Aufbau Principle',
        detail: `Fill the ${subshellLabel} subshell first! Lower energy orbitals must be filled before higher energy ones.`,
        orbitalId: targetOrbital.id,
        severity: 'error',
      };
    }
  }

  return null;
}

// Check Hund's Rule:
// In degenerate orbitals (same subshell), electrons fill singly with
// parallel spins before pairing
export function checkHund(
  orbitals: OrbitalState[],
  targetOrbital: OrbitalState,
  spin: Spin,
): RuleViolation | null {
  // Only relevant for p, d, f subshells (more than 1 orbital)
  if (targetOrbital.l === 0) return null;

  // Get all orbitals in the same subshell
  const siblingOrbitals = orbitals.filter(
    o => o.n === targetOrbital.n && o.l === targetOrbital.l
  );

  // Count electrons across the subshell
  const totalElectronsInSubshell = siblingOrbitals.reduce(
    (sum, o) => sum + o.electrons.length, 0
  );
  const orbitalCount = siblingOrbitals.length;

  // Phase 1: Fill one electron per orbital (should all be spin-up)
  if (totalElectronsInSubshell < orbitalCount) {
    // We're still in Phase 1 — spreading electrons out
    // Check: is the player pairing instead of spreading?
    if (targetOrbital.electrons.length > 0) {
      // Trying to pair an orbital when others are empty
      const emptyOrbitals = siblingOrbitals.filter(o => o.electrons.length === 0);
      if (emptyOrbitals.length > 0) {
        return {
          type: 'hund',
          message: "Hund's Rule",
          detail: `Electrons prefer to spread out! Fill each orbital in the ${targetOrbital.label} subshell with one electron before pairing.`,
          orbitalId: targetOrbital.id,
          severity: 'warning',
        };
      }
    }

    // Check spin direction in Phase 1 (should all be the same — conventionally 'up')
    const existingSpins = siblingOrbitals
      .flatMap(o => o.electrons)
      .map(e => e.spin);

    if (existingSpins.length > 0) {
      const dominantSpin = existingSpins[0];
      if (spin !== dominantSpin) {
        return {
          type: 'hund',
          message: "Hund's Rule",
          detail: `During the first pass, all electrons should have the same spin direction (${dominantSpin}).`,
          orbitalId: targetOrbital.id,
          severity: 'warning',
        };
      }
    }
  } else {
    // Phase 2: Pairing — second electron should have opposite spin
    if (targetOrbital.electrons.length === 1) {
      const existingSpin = targetOrbital.electrons[0].spin;
      if (spin === existingSpin) {
        return {
          type: 'hund',
          message: "Hund's Rule",
          detail: `When pairing, the second electron must have opposite spin.`,
          orbitalId: targetOrbital.id,
          severity: 'warning',
        };
      }
    }
  }

  return null;
}

// Validate a full placement attempt
export function validatePlacement(
  orbitals: OrbitalState[],
  targetOrbitalId: string,
  spin: Spin,
  sandboxMode: boolean = false
): { valid: boolean; violation: RuleViolation | null } {
  const targetOrbital = orbitals.find(o => o.id === targetOrbitalId);
  if (!targetOrbital) {
    return {
      valid: false,
      violation: {
        type: 'pauli',
        message: 'Invalid Orbital',
        detail: 'This orbital does not exist.',
        orbitalId: targetOrbitalId,
        severity: 'error',
      },
    };
  }

  // In sandbox mode, only hard-block Pauli violations (can't have 3 electrons)
  // but allow Aufbau and Hund violations

  // Check Pauli (always enforced)
  const pauliViolation = checkPauli(targetOrbital, spin);
  if (pauliViolation) {
    return { valid: false, violation: pauliViolation };
  }

  if (sandboxMode) {
    // Still show warnings for Aufbau/Hund in sandbox, just allow placement
    const aufbauWarning = checkAufbau(orbitals, targetOrbital);
    if (aufbauWarning) {
      return { valid: true, violation: { ...aufbauWarning, severity: 'warning' } };
    }
    const hundWarning = checkHund(orbitals, targetOrbital, spin);
    if (hundWarning) {
      return { valid: true, violation: hundWarning };
    }
    return { valid: true, violation: null };
  }

  // Check Aufbau (hard block in Campaign/Challenge)
  const aufbauViolation = checkAufbau(orbitals, targetOrbital);
  if (aufbauViolation) {
    return { valid: false, violation: aufbauViolation };
  }

  // Check Hund's Rule (warning, deducts points but doesn't block)
  const hundViolation = checkHund(orbitals, targetOrbital, spin);
  if (hundViolation) {
    return { valid: true, violation: hundViolation };
  }

  return { valid: true, violation: null };
}

// Check if the current configuration matches the ground state
export function isGroundState(
  orbitals: OrbitalState[],
  atomicNumber: number
): boolean {
  let totalElectrons = 0;
  for (const orbital of orbitals) {
    totalElectrons += orbital.electrons.length;
  }
  return totalElectrons === atomicNumber;
}

// Get the next correct orbital to fill (for hints)
export function getNextCorrectOrbital(
  orbitals: OrbitalState[],
): { orbitalId: string; spin: Spin } | null {
  for (const { n, l } of MADELUNG_ORDER) {
    const orbitalCount = getOrbitalCount(l);

    // Phase 1: Fill one electron per orbital (spin up)
    for (let ml = -l; ml <= l; ml++) {
      const id = getOrbitalId(n, l, ml);
      const orbital = orbitals.find(o => o.id === id);
      if (!orbital) continue;
      if (orbital.electrons.length === 0) {
        return { orbitalId: id, spin: 'up' };
      }
    }

    // Phase 2: Pair up (spin down)
    for (let ml = -l; ml <= l; ml++) {
      const id = getOrbitalId(n, l, ml);
      const orbital = orbitals.find(o => o.id === id);
      if (!orbital) continue;
      if (orbital.electrons.length === 1) {
        return { orbitalId: id, spin: 'down' };
      }
    }
  }

  return null;
}
