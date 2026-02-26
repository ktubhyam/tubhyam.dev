"use client";

import { useRef, useState, useCallback, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { useVibeStore } from "@/lib/store";
import { CPK_COLORS, COVALENT_RADII, ATOM_SCALE, VISUAL_FREQ } from "@/lib/constants";
import type { MoleculeData } from "@/lib/types";

interface Props {
  molecule: MoleculeData;
}

export function Atoms({ molecule }: Props) {
  const meshRefs = useRef<(THREE.Mesh | null)[]>([]);
  const [hoveredAtom, setHoveredAtom] = useState<number | null>(null);

  // Memoize per-atom pointer handlers to avoid recreating on every render
  const pointerHandlers = useMemo(
    () =>
      molecule.atoms.map((_, i) => ({
        onPointerOver: () => setHoveredAtom(i),
        onPointerOut: () => setHoveredAtom(null),
      })),
    [molecule.atoms],
  );

  // Read store imperatively in the animation loop — no reactive subscriptions
  useFrame(({ clock }) => {
    if (!molecule.modes.length) return;

    const { selectedMode, isPlaying, speed, amplitude } = useVibeStore.getState();
    const mode = molecule.modes[selectedMode];
    if (!mode) return;

    const t = clock.getElapsedTime();
    const phase = isPlaying ? Math.sin(2 * Math.PI * VISUAL_FREQ * speed * t) : 0;

    for (let i = 0; i < molecule.atoms.length; i++) {
      const mesh = meshRefs.current[i];
      if (!mesh) continue;

      const atom = molecule.atoms[i];
      const disp = mode.displacements[i];

      mesh.position.set(
        atom.x + amplitude * disp[0] * phase,
        atom.y + amplitude * disp[1] * phase,
        atom.z + amplitude * disp[2] * phase,
      );
    }
  });

  return (
    <>
      {molecule.atoms.map((atom, i) => {
        const color = CPK_COLORS[atom.element] ?? "#FF69B4";
        const radius = (COVALENT_RADII[atom.element] ?? 0.7) * ATOM_SCALE;
        const isHovered = hoveredAtom === i;

        return (
          <mesh
            key={i}
            ref={(el) => {
              meshRefs.current[i] = el;
            }}
            position={[atom.x, atom.y, atom.z]}
            onPointerOver={pointerHandlers[i].onPointerOver}
            onPointerOut={pointerHandlers[i].onPointerOut}
          >
            <sphereGeometry args={[radius, 24, 24]} />
            <meshStandardMaterial
              color={color}
              roughness={0.3}
              metalness={0.1}
              emissive={isHovered ? color : "#000000"}
              emissiveIntensity={isHovered ? 0.3 : 0}
            />
            {isHovered && (
              <Html
                center
                style={{ pointerEvents: "none" }}
                distanceFactor={8}
              >
                <div className="bg-surface/90 backdrop-blur-sm border border-border rounded px-2 py-0.5 whitespace-nowrap">
                  <span className="text-[10px] font-mono text-text">
                    {atom.element}
                    <span className="text-text-muted ml-1">#{i + 1}</span>
                  </span>
                </div>
              </Html>
            )}
          </mesh>
        );
      })}
    </>
  );
}
