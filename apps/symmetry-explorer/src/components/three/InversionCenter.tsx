'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, Text } from '@react-three/drei';
import type { Mesh } from 'three';

interface InversionCenterProps {
  color?: string;
}

export function InversionCenter({ color = '#A78BFA' }: InversionCenterProps) {
  const meshRef = useRef<Mesh>(null);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      const s = 1 + 0.15 * Math.sin(clock.getElapsedTime() * 2);
      meshRef.current.scale.set(s, s, s);
    }
  });

  return (
    <group>
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.8} />
      </mesh>
      <Billboard>
        <Text
          position={[0.2, 0.2, 0]}
          fontSize={0.2}
          color={color}
          anchorX="left"
          anchorY="bottom"
        >
          i
        </Text>
      </Billboard>
    </group>
  );
}
