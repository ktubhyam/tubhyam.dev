'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import { Billboard, Text } from '@react-three/drei';

interface SymmetryPlaneProps {
  normal: [number, number, number];
  label: string;
  size?: number;
  color?: string;
}

export function SymmetryPlane({
  normal,
  label,
  size = 3,
  color = '#C9A04A',
}: SymmetryPlaneProps) {
  const rotation = useMemo(() => {
    const n = new THREE.Vector3(...normal).normalize();
    const quaternion = new THREE.Quaternion();
    // PlaneGeometry lies in XY plane by default, normal is +Z
    quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), n);
    return new THREE.Euler().setFromQuaternion(quaternion);
  }, [normal]);

  const labelPosition = useMemo(() => {
    const n = new THREE.Vector3(...normal).normalize();
    return [n.x * 0.1, n.y * 0.1 + size / 2 + 0.3, n.z * 0.1] as [number, number, number];
  }, [normal, size]);

  return (
    <group>
      <mesh rotation={rotation}>
        <planeGeometry args={[size, size]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.12}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Wireframe outline */}
      <mesh rotation={rotation}>
        <planeGeometry args={[size, size]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.4}
          wireframe
          side={THREE.DoubleSide}
        />
      </mesh>

      <Billboard position={labelPosition}>
        <Text fontSize={0.18} color={color} anchorX="center" anchorY="bottom">
          {label}
        </Text>
      </Billboard>
    </group>
  );
}
