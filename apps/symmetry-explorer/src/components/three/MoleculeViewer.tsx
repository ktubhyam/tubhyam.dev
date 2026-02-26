'use client';

import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Billboard, Text } from '@react-three/drei';
import type { Group, Mesh } from 'three';

import type { MoleculeData, CharacterTableData } from '@/types';
import { useExplorerStore } from '@/lib/store';
import { useSymmetryAnimation } from '@/hooks/useSymmetryAnimation';
import { NORMAL_MODES } from '@/lib/data/normalModes';
import { getElementColor, getElementRadius } from '@/lib/data/elementStyles';
import { Atom3D } from './Atom3D';
import { Bond3D } from './Bond3D';
import { SymmetryAxis } from './SymmetryAxis';
import { SymmetryPlane } from './SymmetryPlane';
import { InversionCenter } from './InversionCenter';

const MODE_FREQUENCY = 2.0;
const MAX_AMPLITUDE = 0.4;
const ATOM_SCALE = 0.3;
const BOND_RADIUS = 0.06;

interface MoleculeSceneProps {
  molecule: MoleculeData;
  table: CharacterTableData;
}

// Reusable vectors to avoid GC pressure
const _v3Start = new THREE.Vector3();
const _v3End = new THREE.Vector3();
const _v3Dir = new THREE.Vector3();
const _v3Mid = new THREE.Vector3();
const _quat = new THREE.Quaternion();
const _up = new THREE.Vector3(0, 1, 0);

/** Molecule renderer with per-frame vibrational mode animation using raw refs */
function AnimatedMolecule({ molecule, basePositions }: {
  molecule: MoleculeData;
  basePositions: [number, number, number][];
}) {
  const activeMode = useExplorerStore((s) => s.activeMode);
  const atomMeshRefs = useRef<(Mesh | null)[]>([]);
  const bondMeshRefs = useRef<(Mesh | null)[]>([]);

  // Compute displaced positions each frame
  const displaced = useRef<[number, number, number][]>(
    basePositions.map((p) => [...p] as [number, number, number])
  );

  useFrame(({ clock }) => {
    const modes = NORMAL_MODES[molecule.id];
    const mode = activeMode && modes
      ? modes.find((m) => m.irrep === activeMode.irrep && m.label === activeMode.label)
      : null;

    if (mode && mode.displacements.length === basePositions.length) {
      const t = clock.getElapsedTime();
      const phase = Math.sin(2 * Math.PI * MODE_FREQUENCY * t);
      const amp = MAX_AMPLITUDE * phase;

      for (let i = 0; i < basePositions.length; i++) {
        const [bx, by, bz] = basePositions[i];
        const [dx, dy, dz] = mode.displacements[i];
        displaced.current[i] = [bx + amp * dx, by + amp * dy, bz + amp * dz];
      }
    } else {
      for (let i = 0; i < basePositions.length; i++) {
        displaced.current[i] = [...basePositions[i]] as [number, number, number];
      }
    }

    // Update atom mesh positions
    for (let i = 0; i < basePositions.length; i++) {
      const mesh = atomMeshRefs.current[i];
      if (mesh) {
        const [x, y, z] = displaced.current[i];
        mesh.position.set(x, y, z);
      }
    }

    // Update bond mesh positions + orientations
    molecule.bonds.forEach(([a, b], i) => {
      const mesh = bondMeshRefs.current[i];
      if (!mesh) return;

      const [sx, sy, sz] = displaced.current[a];
      const [ex, ey, ez] = displaced.current[b];

      _v3Start.set(sx, sy, sz);
      _v3End.set(ex, ey, ez);
      _v3Mid.copy(_v3Start).add(_v3End).multiplyScalar(0.5);
      _v3Dir.copy(_v3End).sub(_v3Start);
      const len = _v3Dir.length();
      _v3Dir.normalize();

      mesh.position.copy(_v3Mid);
      _quat.setFromUnitVectors(_up, _v3Dir);
      mesh.quaternion.copy(_quat);
      mesh.scale.set(1, len / 1, 1); // cylinderGeometry height = 1
    });
  });

  return (
    <>
      {/* Bonds — cylinder with height=1, scaled by length in useFrame */}
      {molecule.bonds.map((_bond, i) => (
        <mesh
          key={`abond-${i}`}
          ref={(el) => { bondMeshRefs.current[i] = el; }}
        >
          <cylinderGeometry args={[BOND_RADIUS, BOND_RADIUS, 1, 8]} />
          <meshStandardMaterial color="#555555" roughness={0.6} metalness={0.1} />
        </mesh>
      ))}

      {/* Atoms — spheres with element-specific color and radius */}
      {molecule.atoms.map((atom, i) => {
        const color = getElementColor(atom.element);
        const radius = getElementRadius(atom.element) * ATOM_SCALE;
        return (
          <group key={`aatom-${i}`}>
            <mesh
              ref={(el) => { atomMeshRefs.current[i] = el; }}
              position={basePositions[i]}
            >
              <sphereGeometry args={[radius, 24, 24]} />
              <meshStandardMaterial color={color} roughness={0.3} metalness={0.1} />
            </mesh>
            {/* Labels follow atoms via parent mesh position */}
          </group>
        );
      })}
    </>
  );
}

function MoleculeScene({ molecule, table }: MoleculeSceneProps) {
  const groupRef = useRef<Group>(null);
  const visibleElements = useExplorerStore((s) => s.visibleElements);
  const activeMode = useExplorerStore((s) => s.activeMode);

  useSymmetryAnimation(groupRef, table.symmetryElements);

  const atomPositions = useMemo(
    () =>
      molecule.atoms.map(
        (a) => [a.x, a.y, a.z] as [number, number, number]
      ),
    [molecule]
  );

  // Check which symmetry elements to show
  const showAll = visibleElements.has('__all__');
  const isVisible = (label: string) => showAll || visibleElements.has(label);

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <pointLight position={[5, 5, 5]} intensity={0.6} color="#C9A04A" />
      <pointLight position={[-5, -3, 3]} intensity={0.3} color="#00D8FF" />

      {/* Molecule group (animated by symmetry operations) */}
      <group ref={groupRef}>
        {activeMode ? (
          <AnimatedMolecule
            molecule={molecule}
            basePositions={atomPositions}
          />
        ) : (
          <>
            {/* Bonds */}
            {molecule.bonds.map(([a, b], i) => (
              <Bond3D
                key={`bond-${i}`}
                start={atomPositions[a]}
                end={atomPositions[b]}
              />
            ))}

            {/* Atoms */}
            {molecule.atoms.map((atom, i) => (
              <Atom3D
                key={`atom-${i}`}
                element={atom.element}
                position={atomPositions[i]}
              />
            ))}
          </>
        )}
      </group>

      {/* Symmetry element overlays (not animated with molecule) */}
      {table.symmetryElements.map((el, i) => {
        if (!isVisible(el.label)) return null;

        switch (el.type) {
          case 'axis':
            return (
              <SymmetryAxis
                key={`${el.label}-${i}`}
                direction={el.direction ?? [0, 1, 0]}
                label={el.label}
                order={el.order}
              />
            );
          case 'plane':
            return (
              <SymmetryPlane
                key={`${el.label}-${i}`}
                normal={el.normal ?? [0, 0, 1]}
                label={el.label}
              />
            );
          case 'center':
            return <InversionCenter key={`${el.label}-${i}`} />;
          case 'improper':
            return (
              <SymmetryAxis
                key={`${el.label}-${i}`}
                direction={el.direction ?? [0, 1, 0]}
                label={el.label}
                order={el.order}
                color="#A78BFA"
              />
            );
          default:
            return null;
        }
      })}

      {/* Controls */}
      <OrbitControls
        enablePan={false}
        minDistance={2}
        maxDistance={12}
        autoRotate
        autoRotateSpeed={0.3}
      />
    </>
  );
}

interface MoleculeViewerProps {
  molecule: MoleculeData;
  table: CharacterTableData;
}

export default function MoleculeViewer({ molecule, table }: MoleculeViewerProps) {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 50 }}
      dpr={[1, 1.5]}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
      }}
      style={{ background: '#000000' }}
    >
      <MoleculeScene molecule={molecule} table={table} />
    </Canvas>
  );
}
