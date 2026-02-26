'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import { Billboard, Text } from '@react-three/drei';

interface SymmetryAxisProps {
  direction: [number, number, number];
  label: string;
  order?: number;
  length?: number;
  color?: string;
}

export function SymmetryAxis({
  direction,
  label,
  length = 3.5,
  color = '#00D8FF',
}: SymmetryAxisProps) {
  const { rotation, tipPosition } = useMemo(() => {
    const dir = new THREE.Vector3(...direction).normalize();
    const quaternion = new THREE.Quaternion();
    quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    const euler = new THREE.Euler().setFromQuaternion(quaternion);
    const tip = dir.clone().multiplyScalar(length / 2 + 0.2);
    return { rotation: euler, tipPosition: [tip.x, tip.y, tip.z] as [number, number, number] };
  }, [direction, length]);

  return (
    <group>
      {/* Axis line */}
      <mesh rotation={rotation}>
        <cylinderGeometry args={[0.02, 0.02, length, 8]} />
        <meshBasicMaterial color={color} transparent opacity={0.7} />
      </mesh>

      {/* Arrow tip */}
      <mesh position={tipPosition} rotation={rotation}>
        <coneGeometry args={[0.06, 0.2, 8]} />
        <meshBasicMaterial color={color} />
      </mesh>

      {/* Label */}
      <Billboard position={tipPosition}>
        <Text
          fontSize={0.2}
          color={color}
          anchorX="left"
          anchorY="middle"
          position={[0.15, 0, 0]}
        >
          {label}
        </Text>
      </Billboard>
    </group>
  );
}
