"use client";

import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Color, BufferGeometry, BufferAttribute, LineBasicMaterial, Line, Material } from "three";
import type { Group as GroupType, Line as LineType, BufferAttribute as BufAttrType } from "three";
import { useExplorerStore } from "@/lib/store";
import { CPK_COLORS } from "@/lib/constants";
import type { MoleculeData } from "@/lib/types";

const TRAIL_POINTS = 64;

interface Props {
  molecule: MoleculeData;
  modeIndex: number;
}

export function TrajectoryTrails({ molecule, modeIndex }: Props) {
  const groupRef = useRef<GroupType>(null);
  const linesRef = useRef<LineType[]>([]);

  // Precompute trail data
  const trailData = useMemo(() => {
    const mode = molecule.modes[modeIndex];
    if (!mode) return [];

    return molecule.atoms.map((atom, i) => {
      const disp = mode.displacements[i];
      const magnitude = Math.sqrt(disp[0] ** 2 + disp[1] ** 2 + disp[2] ** 2);
      const color = new Color(CPK_COLORS[atom.element] ?? "#FF69B4");

      // Precompute positions for one full cycle
      const positions = new Float32Array(TRAIL_POINTS * 3);
      const colors = new Float32Array(TRAIL_POINTS * 3);

      for (let t = 0; t < TRAIL_POINTS; t++) {
        const phase = Math.sin((t / TRAIL_POINTS) * 2 * Math.PI);
        const fade = 0.15 + 0.85 * (t / TRAIL_POINTS);

        positions[t * 3] = atom.x + disp[0] * phase;
        positions[t * 3 + 1] = atom.y + disp[1] * phase;
        positions[t * 3 + 2] = atom.z + disp[2] * phase;

        colors[t * 3] = color.r * fade;
        colors[t * 3 + 1] = color.g * fade;
        colors[t * 3 + 2] = color.b * fade;
      }

      return { positions, colors, magnitude, atom, disp };
    }).filter((d) => d.magnitude > 0.02);
  }, [molecule, modeIndex]);

  // Create/recreate line objects when trail data changes
  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;

    // Clear existing
    while (group.children.length > 0) {
      const child = group.children[0];
      group.remove(child);
      if (child instanceof Line) {
        child.geometry.dispose();
        (child.material as Material).dispose();
      }
    }
    linesRef.current = [];

    trailData.forEach((trail) => {
      const geom = new BufferGeometry();
      geom.setAttribute("position", new BufferAttribute(trail.positions.slice(), 3));
      geom.setAttribute("color", new BufferAttribute(trail.colors, 3));

      const mat = new LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.5,
      });

      const line = new Line(geom, mat);
      group.add(line);
      linesRef.current.push(line);
    });

    return () => {
      linesRef.current.forEach((line) => {
        line.geometry.dispose();
        (line.material as Material).dispose();
      });
      linesRef.current = [];
    };
  }, [trailData]);

  useFrame(() => {
    const { showTrails, amplitude } = useExplorerStore.getState();

    trailData.forEach((trail, ti) => {
      const line = linesRef.current[ti];
      if (!line) return;

      line.visible = showTrails;
      if (!showTrails) return;

      const posAttr = line.geometry.getAttribute("position") as BufAttrType;
      const { atom, disp } = trail;

      for (let t = 0; t < TRAIL_POINTS; t++) {
        const phase = Math.sin((t / TRAIL_POINTS) * 2 * Math.PI);
        posAttr.setXYZ(
          t,
          atom.x + amplitude * disp[0] * phase,
          atom.y + amplitude * disp[1] * phase,
          atom.z + amplitude * disp[2] * phase,
        );
      }
      posAttr.needsUpdate = true;
    });
  });

  return <group ref={groupRef} />;
}
