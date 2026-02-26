import type { CharacterTableData, Irrep } from '@/types';

export function getTotalModes(nAtoms: number, linear: boolean): number {
  return linear ? 3 * nAtoms - 5 : 3 * nAtoms - 6;
}

export function getTranslationModes(linear: boolean): number {
  return 3;
}

export function getRotationModes(linear: boolean): number {
  return linear ? 2 : 3;
}

export interface ModeDecomposition {
  irrep: Irrep;
  count: number;
  isTranslation: boolean;
  isRotation: boolean;
  activity: 'ir' | 'raman' | 'both' | 'silent';
}

/**
 * For a given character table and molecule, determine vibrational mode activity.
 * Returns mode breakdown per irreducible representation.
 *
 * Note: Without the full reducible representation (which requires knowing
 * the specific symmetry-adapted coordinates), we use the linear/quadratic
 * function assignments to determine which irreps carry translations and rotations.
 * The remaining irreps carry vibrational modes.
 */
export function getModeBreakdown(
  table: CharacterTableData,
  nAtoms: number,
  linear: boolean
): ModeDecomposition[] {
  const TRANSLATIONS = new Set(['x', 'y', 'z']);
  const ROTATIONS = new Set(['Rx', 'Ry', 'Rz']);

  return table.irreps.map((irrep) => {
    const hasTranslation = irrep.linearFunctions.some((f) => TRANSLATIONS.has(f));
    const hasRotation = irrep.linearFunctions.some((f) => ROTATIONS.has(f));

    const ir = hasTranslation;
    const raman = irrep.quadraticFunctions.length > 0;

    let activity: 'ir' | 'raman' | 'both' | 'silent';
    if (ir && raman) activity = 'both';
    else if (ir) activity = 'ir';
    else if (raman) activity = 'raman';
    else activity = 'silent';

    return {
      irrep,
      count: irrep.degeneracy,
      isTranslation: hasTranslation,
      isRotation: hasRotation,
      activity,
    };
  });
}

/**
 * Information Completeness Ratio R(G,N).
 * Fraction of vibrational modes observable by combined IR + Raman spectroscopy.
 */
export function getCompletenessRatio(
  table: CharacterTableData,
  nAtoms: number,
  linear: boolean
): number {
  const totalModes = getTotalModes(nAtoms, linear);
  if (totalModes <= 0) return 0;

  const TRANSLATIONS = new Set(['x', 'y', 'z']);

  let observableCount = 0;

  for (const irrep of table.irreps) {
    const hasTranslation = irrep.linearFunctions.some((f) => TRANSLATIONS.has(f));
    const hasQuadratic = irrep.quadraticFunctions.length > 0;

    if (hasTranslation || hasQuadratic) {
      observableCount += irrep.degeneracy;
    }
  }

  return Math.min(observableCount / totalModes, 1);
}
