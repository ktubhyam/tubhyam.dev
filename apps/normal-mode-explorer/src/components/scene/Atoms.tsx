"use client";

import { useRef, useState, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { Color, Mesh, MeshStandardMaterial } from "three";
import type { Mesh as MeshType, MeshStandardMaterial as MatType } from "three";
import { useExplorerStore } from "@/lib/store";
import { CPK_COLORS, COVALENT_RADII, ATOM_SCALE, VISUAL_FREQ } from "@/lib/constants";
import type { MoleculeData } from "@/lib/types";

const DISP_COLOR_LOW = new Color("#555555");
const DISP_COLOR_MID = new Color("#00D8FF");
const DISP_COLOR_HIGH = new Color("#FFFFFF");
const tmpColor = new Color();

function getDispColor(t: number): Color {
  if (t < 0.5) {
    return tmpColor.copy(DISP_COLOR_LOW).lerp(DISP_COLOR_MID, t * 2);
  }
  return tmpColor.copy(DISP_COLOR_MID).lerp(DISP_COLOR_HIGH, (t - 0.5) * 2);
}

interface Props {
  molecule: MoleculeData;
  modeIndex: number;
}

export function Atoms({ molecule, modeIndex }: Props) {
  const meshRefs = useRef<(MeshType | null)[]>([]);
  const matRefs = useRef<(MatType | null)[]>([]);
  const [hoveredAtom, setHoveredAtom] = useState<number | null>(null);
  const showLabels = useExplorerStore((s) => s.showLabels);

  const pointerHandlers = useMemo(
    () =>
      molecule.atoms.map((_, i) => ({
        onPointerOver: () => setHoveredAtom(i),
        onPointerOut: () => setHoveredAtom(null),
      })),
    [molecule.atoms],
  );

  const dispMagnitudes = useMemo(() => {
    const mode = molecule.modes[modeIndex];
    if (!mode) return [];
    const mags = mode.displacements.map(
      (d) => Math.sqrt(d[0] ** 2 + d[1] ** 2 + d[2] ** 2)
    );
    const maxMag = Math.max(...mags, 1e-10);
    return mags.map((m) => m / maxMag);
  }, [molecule, modeIndex]);

  useFrame(({ clock }) => {
    if (!molecule.modes.length) return;

    const { isPlaying, speed, amplitude, superpositionEnabled, superpositionModes } =
      useExplorerStore.getState();
    const mode = molecule.modes[modeIndex];
    if (!mode) return;

    const t = clock.getElapsedTime();
    const phase = isPlaying ? Math.sin(2 * Math.PI * VISUAL_FREQ * speed * t) : 0;
    const absPhase = Math.abs(phase);

    // Determine which modes to sum
    const activeModes = superpositionEnabled && superpositionModes.size > 0
      ? Array.from(superpositionModes)
      : [modeIndex];

    for (let i = 0; i < molecule.atoms.length; i++) {
      const mesh = meshRefs.current[i];
      if (!mesh) continue;

      const atom = molecule.atoms[i];

      // Sum displacements from all active modes
      let dx = 0, dy = 0, dz = 0;
      for (const mi of activeModes) {
        const m = molecule.modes[mi];
        if (!m) continue;
        const d = m.displacements[i];
        // Each mode gets a slightly different phase for realism
        const modePhase = isPlaying
          ? Math.sin(2 * Math.PI * VISUAL_FREQ * speed * t + mi * 0.7)
          : 0;
        dx += amplitude * d[0] * modePhase;
        dy += amplitude * d[1] * modePhase;
        dz += amplitude * d[2] * modePhase;
      }

      mesh.position.set(atom.x + dx, atom.y + dy, atom.z + dz);

      const mat = matRefs.current[i];
      if (mat && dispMagnitudes[i] !== undefined) {
        const intensity = dispMagnitudes[i] * absPhase;
        const dispColor = getDispColor(intensity);
        mat.emissive.copy(dispColor);
        mat.emissiveIntensity = intensity * 0.5;
      }
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
            ref={(el) => { meshRefs.current[i] = el; }}
            position={[atom.x, atom.y, atom.z]}
            onPointerOver={pointerHandlers[i].onPointerOver}
            onPointerOut={pointerHandlers[i].onPointerOut}
          >
            <sphereGeometry args={[radius, 16, 16]} />
            <meshStandardMaterial
              ref={(el) => { matRefs.current[i] = el; }}
              color={color}
              roughness={0.25}
              metalness={0.15}
              emissive="#000000"
              emissiveIntensity={0}
            />
            {showLabels && (
              <Html
                center
                style={{ pointerEvents: "none", userSelect: "none" }}
                distanceFactor={8}
                occlude={false}
              >
                <div className={`transition-opacity ${isHovered ? "opacity-100" : "opacity-60"}`}>
                  <span className="text-[8px] font-mono font-bold text-white drop-shadow-[0_0_4px_rgba(0,0,0,0.8)]">
                    {atom.element}
                  </span>
                </div>
              </Html>
            )}
            {isHovered && (
              <Html center style={{ pointerEvents: "none" }} distanceFactor={8}>
                <div className="bg-surface/90 backdrop-blur-sm border border-border rounded px-2 py-0.5 whitespace-nowrap -translate-y-5">
                  <span className="text-[10px] font-mono text-foreground">
                    {atom.element}
                    <span className="text-foreground/50 ml-1">#{i + 1}</span>
                    <span className="text-cyan/60 ml-1">{atom.mass.toFixed(1)} amu</span>
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
