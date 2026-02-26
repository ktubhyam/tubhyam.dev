"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Vector3, Color, ArrowHelper } from "three";
import type { Group as GroupType, ArrowHelper as ArrowHelperType } from "three";
import { useExplorerStore } from "@/lib/store";
import { VISUAL_FREQ } from "@/lib/constants";
import type { MoleculeData } from "@/lib/types";

interface Props {
  molecule: MoleculeData;
  modeIndex: number;
  color?: string;
}

export function DisplacementArrows({ molecule, modeIndex, color = "#00D8FF" }: Props) {
  const groupRef = useRef<GroupType>(null);

  // Create arrow helpers — one per atom
  const arrows = useMemo(() => {
    const mode = molecule.modes[modeIndex];
    if (!mode) return [];

    return molecule.atoms.map((atom, i) => {
      const disp = mode.displacements[i];
      const magnitude = Math.sqrt(disp[0] ** 2 + disp[1] ** 2 + disp[2] ** 2);
      return { atom, disp, magnitude, index: i };
    }).filter((a) => a.magnitude > 0.01); // Skip negligible displacements
  }, [molecule, modeIndex]);

  // Reusable vectors
  const tmpOrigin = useMemo(() => new Vector3(), []);
  const tmpDir = useMemo(() => new Vector3(), []);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;

    const { isPlaying, speed, amplitude, showArrows } = useExplorerStore.getState();
    groupRef.current.visible = showArrows;
    if (!showArrows) return;

    const mode = molecule.modes[modeIndex];
    if (!mode) return;

    const t = clock.getElapsedTime();
    const phase = isPlaying ? Math.sin(2 * Math.PI * VISUAL_FREQ * speed * t) : 0;

    const children = groupRef.current.children;
    arrows.forEach((arrow, ci) => {
      const arrowHelper = children[ci] as ArrowHelperType;
      if (!arrowHelper) return;

      const { atom, disp } = arrow;

      // Origin: current animated position
      tmpOrigin.set(
        atom.x + amplitude * disp[0] * phase,
        atom.y + amplitude * disp[1] * phase,
        atom.z + amplitude * disp[2] * phase,
      );

      // Direction: displacement vector (scaled for visibility)
      tmpDir.set(disp[0], disp[1], disp[2]).normalize();

      arrowHelper.position.copy(tmpOrigin);
      arrowHelper.setDirection(tmpDir);
      arrowHelper.setLength(arrow.magnitude * amplitude * 2, 0.08, 0.04);
    });
  });

  return (
    <group ref={groupRef}>
      {arrows.map((arrow, i) => (
        <arrowHelper
          key={`${modeIndex}-${i}`}
          args={[
            new Vector3(arrow.disp[0], arrow.disp[1], arrow.disp[2]).normalize(),
            new Vector3(arrow.atom.x, arrow.atom.y, arrow.atom.z),
            arrow.magnitude * 0.5,
            new Color(color).getHex(),
            0.08,
            0.04,
          ]}
        />
      ))}
    </group>
  );
}
