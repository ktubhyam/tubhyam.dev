"use client";

import { Grid } from "@react-three/drei";
import { useExplorerStore } from "@/lib/store";
import type { MoleculeData } from "@/lib/types";

interface Props {
  molecule: MoleculeData;
}

/** Subtle reference grid floor below the molecule */
export function GridFloor({ molecule }: Props) {
  const showGrid = useExplorerStore((s) => s.showGrid);

  if (!showGrid) return null;

  // Place grid below the lowest atom
  let minY = Infinity;
  for (const a of molecule.atoms) {
    if (a.y < minY) minY = a.y;
  }
  const gridY = minY - 1.5;

  return (
    <Grid
      position={[0, gridY, 0]}
      args={[20, 20]}
      cellSize={0.5}
      cellThickness={0.3}
      cellColor="#1a1a1a"
      sectionSize={2}
      sectionThickness={0.6}
      sectionColor="#222222"
      fadeDistance={12}
      fadeStrength={2}
      infiniteGrid
    />
  );
}
