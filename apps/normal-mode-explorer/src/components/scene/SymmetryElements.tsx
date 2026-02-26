"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Vector3, DoubleSide } from "three";
import type { Group as GroupType } from "three";
import { useExplorerStore } from "@/lib/store";
import { MOLECULE_SYMMETRY } from "@/lib/constants";
import type { MoleculeData } from "@/lib/types";

interface Props {
  molecule: MoleculeData;
}

export function SymmetryElements({ molecule }: Props) {
  const groupRef = useRef<GroupType>(null);

  const symmetryData = MOLECULE_SYMMETRY[molecule.name.toLowerCase().replace(/\s+/g, "_")];
  const pointGroup = symmetryData?.pointGroup || "";

  const { center, extent } = useMemo(() => {
    const c = new Vector3();
    molecule.atoms.forEach((a) => c.add(new Vector3(a.x, a.y, a.z)));
    c.divideScalar(molecule.atoms.length);

    let maxDist = 0;
    molecule.atoms.forEach((a) => {
      const d = new Vector3(a.x, a.y, a.z).distanceTo(c);
      if (d > maxDist) maxDist = d;
    });

    return { center: c, extent: Math.max(maxDist * 1.5, 1.2) };
  }, [molecule]);

  const hasC2 = pointGroup.includes("C₂") || pointGroup.includes("D");
  const hasSigmaV = pointGroup.includes("ᵥ") || pointGroup.includes("D");
  const hasSigmaH = pointGroup.includes("ₕ");

  useFrame(() => {
    if (!groupRef.current) return;
    groupRef.current.visible = useExplorerStore.getState().showSymmetryElements;
  });

  if (!pointGroup) return null;

  return (
    <group ref={groupRef} visible={false}>
      {hasC2 && (
        <group position={[center.x, center.y, center.z]}>
          <mesh>
            <cylinderGeometry args={[0.015, 0.015, extent * 2, 8]} />
            <meshBasicMaterial color="#00D8FF" transparent opacity={0.6} />
          </mesh>
          <mesh position={[0, extent + 0.15, 0]}>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshBasicMaterial color="#00D8FF" />
          </mesh>
        </group>
      )}

      {hasSigmaV && (
        <mesh position={[center.x, center.y, center.z]}>
          <planeGeometry args={[extent * 2, extent * 2]} />
          <meshBasicMaterial color="#C9A04A" transparent opacity={0.08} side={DoubleSide} depthWrite={false} />
        </mesh>
      )}

      {hasSigmaV && (
        <mesh position={[center.x, center.y, center.z]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[extent * 2, extent * 2]} />
          <meshBasicMaterial color="#C9A04A" transparent opacity={0.08} side={DoubleSide} depthWrite={false} />
        </mesh>
      )}

      {hasSigmaH && (
        <mesh position={[center.x, center.y, center.z]} rotation={[Math.PI / 2, 0, 0]}>
          <planeGeometry args={[extent * 2, extent * 2]} />
          <meshBasicMaterial color="#A78BFA" transparent opacity={0.08} side={DoubleSide} depthWrite={false} />
        </mesh>
      )}
    </group>
  );
}
