import type { CharacterTableData, Irrep, SelectionResult } from '@/types';

const TRANSLATION_FUNCTIONS = new Set(['x', 'y', 'z']);
const ROTATION_FUNCTIONS = new Set(['Rx', 'Ry', 'Rz']);

function isIRActive(irrep: Irrep): boolean {
  return irrep.linearFunctions.some((f) => TRANSLATION_FUNCTIONS.has(f));
}

function isRamanActive(irrep: Irrep): boolean {
  return irrep.quadraticFunctions.length > 0;
}

export function getSelectionRules(
  table: CharacterTableData,
  nAtoms: number,
  linear: boolean
): SelectionResult {
  const totalModes = linear ? 3 * nAtoms - 5 : 3 * nAtoms - 6;

  const irActive: Irrep[] = [];
  const ramanActive: Irrep[] = [];
  const bothActive: Irrep[] = [];
  const silent: Irrep[] = [];

  // Filter out translation and rotation irreps — we only want vibrational modes.
  // For the summary counts, we count irreps that carry vibrational modes.
  // But for display purposes, we show ALL irreps and mark which are IR/Raman active.
  for (const irrep of table.irreps) {
    const ir = isIRActive(irrep);
    const raman = isRamanActive(irrep);

    if (ir && raman) {
      bothActive.push(irrep);
    } else if (ir) {
      irActive.push(irrep);
    } else if (raman) {
      ramanActive.push(irrep);
    } else {
      silent.push(irrep);
    }
  }

  // Count modes by activity type
  // Note: for degenerate modes (E=2, T=3), each irrep contributes `degeneracy` modes
  // But for the count of active TYPES (not modes), we just count irreps
  const irOnlyCount = irActive.reduce((sum, ir) => sum + ir.degeneracy, 0);
  const ramanOnlyCount = ramanActive.reduce((sum, ir) => sum + ir.degeneracy, 0);
  const bothCount = bothActive.reduce((sum, ir) => sum + ir.degeneracy, 0);
  const silentCount = silent.reduce((sum, ir) => sum + ir.degeneracy, 0);

  // Total IR-active = IR-only + both
  const totalIR = irOnlyCount + bothCount;
  // Total Raman-active = Raman-only + both
  const totalRaman = ramanOnlyCount + bothCount;
  // Unique observable = IR-only + Raman-only + both
  const uniqueObservable = irOnlyCount + ramanOnlyCount + bothCount;

  const ratio = totalModes > 0 ? uniqueObservable / totalModes : 0;

  return {
    irActive: [...irActive, ...bothActive],
    ramanActive: [...ramanActive, ...bothActive],
    bothActive,
    silent,
    irCount: totalIR,
    ramanCount: totalRaman,
    bothCount,
    silentCount,
    totalModes,
    uniqueObservable,
    ratio: Math.min(ratio, 1),
  };
}

export function getActivityLabel(irrep: Irrep): string {
  const ir = isIRActive(irrep);
  const raman = isRamanActive(irrep);

  if (ir && raman) return 'IR + Raman';
  if (ir) return 'IR';
  if (raman) return 'Raman';
  return 'Silent';
}

export function getActivityColor(irrep: Irrep): string {
  const ir = isIRActive(irrep);
  const raman = isRamanActive(irrep);

  if (ir && raman) return 'var(--both-color)';
  if (ir) return 'var(--ir-color)';
  if (raman) return 'var(--raman-color)';
  return 'var(--silent-color)';
}
