"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Vector3, Quaternion, Color, Group, Mesh, MeshStandardMaterial } from "three";
import type { Group as GroupType, Mesh as MeshType, MeshStandardMaterial as MatType } from "three";
import { useExplorerStore } from "@/lib/store";
import { BOND_RADIUS, VISUAL_FREQ } from "@/lib/constants";
import type { MoleculeData } from "@/lib/types";

interface Props {
  molecule: MoleculeData;
  modeIndex: number;
}

const UP = new Vector3(0, 1, 0);

const STRAIN_COMPRESSED = new Color("#FF4444");
const STRAIN_NEUTRAL = new Color("#555555");
const STRAIN_STRETCHED = new Color("#4488FF");
const tmpStrainColor = new Color();

export function Bonds({ molecule, modeIndex }: Props) {
  const groupRef = useRef<GroupType>(null);
  const meshRefs = useRef<(MeshType | null)[]>([]);
  const matRefs = useRef<(MatType | null)[]>([]);

  const tmpA = useMemo(() => new Vector3(), []);
  const tmpB = useMemo(() => new Vector3(), []);
  const tmpDir = useMemo(() => new Vector3(), []);
  const tmpQuat = useMemo(() => new Quaternion(), []);

  const restLengths = useMemo(() => {
    return molecule.bonds.map((bond) => {
      const a = molecule.atoms[bond.atom1];
      const b = molecule.atoms[bond.atom2];
      return Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2 + (b.z - a.z) ** 2);
    });
  }, [molecule]);

  useFrame(({ clock }) => {
    if (!molecule.modes.length || !molecule.bonds.length) return;

    const { isPlaying, speed, amplitude, superpositionEnabled, superpositionModes } =
      useExplorerStore.getState();
    const mode = molecule.modes[modeIndex];
    if (!mode) return;

    const t = clock.getElapsedTime();

    const activeModes = superpositionEnabled && superpositionModes.size > 0
      ? Array.from(superpositionModes)
      : [modeIndex];

    molecule.bonds.forEach((bond, bi) => {
      const mesh = meshRefs.current[bi];
      if (!mesh) return;

      const atomA = molecule.atoms[bond.atom1];
      const atomB = molecule.atoms[bond.atom2];

      // Sum displacements from all active modes
      let dxA = 0, dyA = 0, dzA = 0;
      let dxB = 0, dyB = 0, dzB = 0;
      for (const mi of activeModes) {
        const m = molecule.modes[mi];
        if (!m) continue;
        const dA = m.displacements[bond.atom1];
        const dB = m.displacements[bond.atom2];
        const modePhase = isPlaying
          ? Math.sin(2 * Math.PI * VISUAL_FREQ * speed * t + mi * 0.7)
          : 0;
        dxA += amplitude * dA[0] * modePhase;
        dyA += amplitude * dA[1] * modePhase;
        dzA += amplitude * dA[2] * modePhase;
        dxB += amplitude * dB[0] * modePhase;
        dyB += amplitude * dB[1] * modePhase;
        dzB += amplitude * dB[2] * modePhase;
      }

      tmpA.set(atomA.x + dxA, atomA.y + dyA, atomA.z + dzA);
      tmpB.set(atomB.x + dxB, atomB.y + dyB, atomB.z + dzB);

      mesh.position.lerpVectors(tmpA, tmpB, 0.5);

      tmpDir.subVectors(tmpB, tmpA);
      const length = tmpDir.length();
      tmpDir.normalize();
      tmpQuat.setFromUnitVectors(UP, tmpDir);
      mesh.quaternion.copy(tmpQuat);
      mesh.scale.set(1, length, 1);

      const mat = matRefs.current[bi];
      if (mat && restLengths[bi]) {
        const strain = (length - restLengths[bi]) / restLengths[bi];
        const clampedStrain = Math.max(-1, Math.min(1, strain * 8));

        if (clampedStrain < 0) {
          tmpStrainColor.copy(STRAIN_NEUTRAL).lerp(STRAIN_COMPRESSED, -clampedStrain);
        } else {
          tmpStrainColor.copy(STRAIN_NEUTRAL).lerp(STRAIN_STRETCHED, clampedStrain);
        }
        mat.color.copy(tmpStrainColor);
        mat.emissive.copy(tmpStrainColor);
        mat.emissiveIntensity = Math.abs(clampedStrain) * 0.2;
      }
    });
  });

  return (
    <group ref={groupRef}>
      {molecule.bonds.map((_, i) => (
        <mesh
          key={i}
          ref={(el) => { meshRefs.current[i] = el; }}
        >
          <cylinderGeometry args={[BOND_RADIUS, BOND_RADIUS, 1, 8]} />
          <meshStandardMaterial
            ref={(el) => { matRefs.current[i] = el; }}
            color="#555555"
            roughness={0.4}
            metalness={0.1}
          />
        </mesh>
      ))}
    </group>
  );
}
