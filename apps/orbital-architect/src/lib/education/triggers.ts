import type { ContentTrigger, EducationalEntry } from './content';
import type { OrbitalState, Spin } from '@/types/chemistry';
import { EDUCATION_CONTENT } from './content';
import { getSubshellLabel } from '@/lib/chemistry/orbitals';

// Match a trigger event to content entries, filtered by what's already been seen
export function getTriggeredContent(
  trigger: ContentTrigger,
  seenIds: Set<string>,
): EducationalEntry[] {
  return EDUCATION_CONTENT
    .filter(entry => {
      // Match trigger type and value
      if (entry.trigger.type !== trigger.type) return false;
      if (String(entry.trigger.value) !== String(trigger.value)) return false;
      // Skip if already seen and showOnce
      if (entry.showOnce && seenIds.has(entry.id)) return false;
      return true;
    })
    .sort((a, b) => {
      const p = { high: 0, medium: 1, low: 2 };
      return p[a.priority] - p[b.priority];
    });
}

// Generate contextual explanation for the reveal hint in challenge mode
export function getRevealExplanation(
  orbitals: OrbitalState[],
  correctOrbital: OrbitalState,
  correctSpin: Spin,
): string {
  const subshell = getSubshellLabel(correctOrbital.n, correctOrbital.l);

  // Check which phase we're in for this subshell
  const siblings = orbitals.filter(
    o => o.n === correctOrbital.n && o.l === correctOrbital.l
  );
  const totalInSubshell = siblings.reduce((s, o) => s + o.electrons.length, 0);
  const orbitalCount = siblings.length;

  if (correctOrbital.electrons.length === 0 && totalInSubshell < orbitalCount) {
    return `The ${subshell} subshell has empty orbitals. Hund's rule: fill each orbital singly with spin-${correctSpin} before pairing.`;
  }

  if (correctOrbital.electrons.length === 1) {
    return `All ${subshell} orbitals have one electron. Now pair up with opposite spin (${correctSpin}).`;
  }

  if (correctOrbital.l === 0) {
    if (correctOrbital.electrons.length === 0) {
      return `The ${subshell} orbital is empty. Place the first electron with spin-${correctSpin}.`;
    }
    return `The ${subshell} orbital has one electron. Add the second with opposite spin (${correctSpin}).`;
  }

  // Generic fallback
  return `Next correct placement: ${correctOrbital.subshellLabel} with spin-${correctSpin}. Follow Aufbau order and Hund's rule.`;
}
