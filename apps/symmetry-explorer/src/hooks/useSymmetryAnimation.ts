'use client';

import { useRef, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import type { SymmetryElement } from '@/types';
import { getTransformMatrix } from '@/lib/chemistry/symmetryOps';
import { useExplorerStore } from '@/lib/store';

const ANIMATION_DURATION = 1.5; // seconds for full operation

export function useSymmetryAnimation(
  groupRef: React.RefObject<Group | null>,
  symmetryElements: SymmetryElement[]
) {
  const startTime = useRef<number | null>(null);
  const activeOperation = useExplorerStore((s) => s.activeOperation);
  const stopAnimation = useExplorerStore((s) => s.stopAnimation);

  useFrame(({ clock }) => {
    if (!groupRef.current || !activeOperation) return;

    const element = symmetryElements.find((e) => e.label === activeOperation);
    if (!element) return;

    if (startTime.current === null) {
      startTime.current = clock.getElapsedTime();
    }

    const elapsed = clock.getElapsedTime() - startTime.current;
    const progress = Math.min(elapsed / ANIMATION_DURATION, 1);

    // Ease in-out: go to full transform and back
    // 0→0.5: apply transform (t: 0→1)
    // 0.5→1: reverse transform (t: 1→0)
    let t: number;
    if (progress < 0.5) {
      t = progress * 2; // 0 → 1
    } else {
      t = (1 - progress) * 2; // 1 → 0
    }

    // Apply smooth easing
    t = t * t * (3 - 2 * t); // smoothstep

    const matrix = getTransformMatrix(element, t);
    groupRef.current.matrix.copy(matrix);
    groupRef.current.matrixAutoUpdate = false;

    if (progress >= 1) {
      // Reset
      groupRef.current.matrix.identity();
      groupRef.current.matrixAutoUpdate = true;
      startTime.current = null;
      stopAnimation();
    }
  });

  const resetAnimation = useCallback(() => {
    startTime.current = null;
    if (groupRef.current) {
      groupRef.current.matrix.identity();
      groupRef.current.matrixAutoUpdate = true;
    }
  }, [groupRef]);

  return { resetAnimation };
}
