'use client';

import { Billboard, Text } from '@react-three/drei';
import { getElementColor, getElementRadius } from '@/lib/data/elementStyles';

interface Atom3DProps {
  element: string;
  position: [number, number, number];
  showLabel?: boolean;
}

const SCALE = 0.3; // scale covalent radii for visual clarity

export function Atom3D({ element, position, showLabel = true }: Atom3DProps) {
  const color = getElementColor(element);
  const radius = getElementRadius(element) * SCALE;

  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[radius, 24, 24]} />
        <meshStandardMaterial
          color={color}
          roughness={0.3}
          metalness={0.1}
        />
      </mesh>
      {showLabel && (
        <Billboard follow lockX={false} lockY={false} lockZ={false}>
          <Text
            position={[0, radius + 0.15, 0]}
            fontSize={0.18}
            color="#e8e8e8"
            anchorX="center"
            anchorY="bottom"
            outlineWidth={0.02}
            outlineColor="#000000"
          >
            {element}
          </Text>
        </Billboard>
      )}
    </group>
  );
}
