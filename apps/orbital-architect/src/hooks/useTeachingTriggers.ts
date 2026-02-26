'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { useEducationStore } from '@/stores/educationStore';
import { getTriggeredContent } from '@/lib/education';
import type { ContentTrigger } from '@/lib/education';
import { getElement } from '@/lib/chemistry';
import { getSubshellLabel } from '@/lib/chemistry/orbitals';

// Noble gas atomic numbers
const NOBLE_GASES = new Set([2, 10, 18, 36]);
// Period starting elements
const PERIOD_STARTS: Record<number, number> = { 1: 1, 2: 3, 3: 11, 4: 19 };

export function useTeachingTriggers() {
  const mode = useGameStore(s => s.mode);
  const currentElement = useGameStore(s => s.currentElement);
  const placedElectrons = useGameStore(s => s.placedElectrons);
  const orbitals = useGameStore(s => s.orbitals);
  const lastViolation = useGameStore(s => s.lastViolation);
  const showViolation = useGameStore(s => s.showViolation);
  const isComplete = useGameStore(s => s.isComplete);

  const pushContent = useEducationStore(s => s.pushContent);
  const getSeenSet = useEducationStore(s => s.getSeenSet);
  const clearTerminalLog = useEducationStore(s => s.clearTerminalLog);

  const prevElement = useRef(currentElement);
  const prevPlaced = useRef(placedElectrons);
  const prevComplete = useRef(isComplete);
  const firedSubshells = useRef<Set<string>>(new Set());
  const firedHundTransitions = useRef<Set<string>>(new Set());

  // Stable fire callback — Zustand selectors are stable references
  const fire = useCallback((trigger: ContentTrigger) => {
    const seenSet = getSeenSet();
    const entries = getTriggeredContent(trigger, seenSet);
    if (entries.length > 0) {
      pushContent(entries);
    }
  }, [getSeenSet, pushContent]);

  // On level change — reset tracking and fire level_start triggers
  useEffect(() => {
    if (mode !== 'campaign') return;
    if (currentElement === prevElement.current && prevPlaced.current > 0) return;

    // New level started
    clearTerminalLog();
    firedSubshells.current.clear();
    firedHundTransitions.current.clear();
    prevPlaced.current = 0;
    prevComplete.current = false;
    prevElement.current = currentElement;

    const element = getElement(currentElement);

    // Period start
    const periodStart = Object.entries(PERIOD_STARTS).find(
      ([, z]) => z === currentElement
    );
    if (periodStart) {
      fire({ type: 'period_start', value: Number(periodStart[0]) });
    }

    // Level start
    fire({ type: 'level_start', value: currentElement });

    // Aufbau exception
    if (element.isAufbauException) {
      fire({ type: 'aufbau_exception', value: currentElement });
    }
  }, [currentElement, mode, fire, clearTerminalLog]);

  // On electron placed — check subshell events
  useEffect(() => {
    if (mode !== 'campaign') return;
    if (placedElectrons <= prevPlaced.current) {
      prevPlaced.current = placedElectrons;
      return;
    }

    prevPlaced.current = placedElectrons;

    // Check for first_subshell and subshell_complete
    for (const orbital of orbitals) {
      const subshell = getSubshellLabel(orbital.n, orbital.l);

      // First subshell encounter: when the first electron is placed in this subshell type
      if (orbital.electrons.length > 0 && !firedSubshells.current.has(subshell)) {
        firedSubshells.current.add(subshell);
        fire({ type: 'first_subshell', value: subshell });
      }
    }

    // Check subshell completions
    const subshellMap = new Map<string, { total: number; max: number }>();
    for (const orbital of orbitals) {
      const subshell = getSubshellLabel(orbital.n, orbital.l);
      const existing = subshellMap.get(subshell) ?? { total: 0, max: 0 };
      existing.total += orbital.electrons.length;
      existing.max += 2;
      subshellMap.set(subshell, existing);
    }

    for (const [subshell, { total, max }] of subshellMap) {
      if (total === max) {
        fire({ type: 'subshell_complete', value: subshell });
      }
    }

    // Check Hund phase transitions (all orbitals in subshell have 1 electron)
    const subshellGroups = new Map<string, { n: number; l: number; orbitals: typeof orbitals }>();
    for (const orbital of orbitals) {
      const subshell = getSubshellLabel(orbital.n, orbital.l);
      if (!subshellGroups.has(subshell)) {
        subshellGroups.set(subshell, { n: orbital.n, l: orbital.l, orbitals: [] });
      }
      subshellGroups.get(subshell)!.orbitals.push(orbital);
    }

    for (const [subshell, group] of subshellGroups) {
      if (group.l === 0) continue; // s orbitals don't have Hund transitions
      if (firedHundTransitions.current.has(subshell)) continue;

      const allHaveOne = group.orbitals.every(o => o.electrons.length >= 1);
      const noneHaveTwo = group.orbitals.some(o => o.electrons.length === 1);
      if (allHaveOne && noneHaveTwo) {
        firedHundTransitions.current.add(subshell);
        fire({ type: 'hund_phase_transition', value: subshell });
      }
    }

    // Electron milestones
    if ([10, 18, 36].includes(placedElectrons)) {
      fire({ type: 'electron_milestone', value: placedElectrons });
    }
  }, [placedElectrons, mode, orbitals, fire]);

  // On violation — fire violation trigger
  useEffect(() => {
    if (mode !== 'campaign') return;
    if (showViolation && lastViolation) {
      fire({ type: 'violation', value: lastViolation.type });
    }
  }, [showViolation, lastViolation, mode, fire]);

  // On level complete
  useEffect(() => {
    if (mode !== 'campaign') return;
    if (isComplete && !prevComplete.current) {
      prevComplete.current = true;
      fire({ type: 'level_complete', value: currentElement });
      if (NOBLE_GASES.has(currentElement)) {
        fire({ type: 'noble_gas', value: currentElement });
      }
    }
  }, [isComplete, mode, currentElement, fire]);
}
