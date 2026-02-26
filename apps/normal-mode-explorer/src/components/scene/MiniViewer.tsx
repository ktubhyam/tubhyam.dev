"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Vector3, Box3, Sphere } from "three";
import { Atoms } from "./Atoms";
import { Bonds } from "./Bonds";
import { DisplacementArrows } from "./DisplacementArrows";
import { TrajectoryTrails } from "./TrajectoryTrails";
import { SymmetryElements } from "./SymmetryElements";
import { GridFloor } from "./GridFloor";

import { SceneEffects } from "./SceneEffects";

/** Delays mounting children until after initial render to reduce TBT */
function DeferredMount({ delay = 1500, children }: { delay?: number; children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setReady(true), delay);
    return () => clearTimeout(id);
  }, [delay]);
  return ready ? <>{children}</> : null;
}
import { MOLECULE_SYMMETRY } from "@/lib/constants";
import { useExplorerStore } from "@/lib/store";
import type { MoleculeData } from "@/lib/types";

function CameraFit({ molecule }: { molecule: MoleculeData }) {
  const { camera } = useThree();
  const prevMolRef = useRef<string>("");

  useEffect(() => {
    if (molecule.name === prevMolRef.current) return;
    prevMolRef.current = molecule.name;

    const points = molecule.atoms.map((a) => new Vector3(a.x, a.y, a.z));
    const box = new Box3().setFromPoints(points);
    const sphere = new Sphere();
    box.getBoundingSphere(sphere);

    const radius = Math.max(sphere.radius, 0.8);
    const dist = radius * 3.2;

    // Straight-on view — no vertical offset so molecule stays centered on mobile
    camera.position.set(
      sphere.center.x,
      sphere.center.y,
      sphere.center.z + dist
    );
    camera.lookAt(sphere.center);
    camera.updateProjectionMatrix();
  }, [molecule, camera]);

  return null;
}

interface Props {
  molecule: MoleculeData;
  modeIndex: number;
  label: "A" | "B";
  accentColor: string;
}

export function MiniViewer({ molecule, modeIndex, label, accentColor }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mode = molecule.modes[modeIndex];
  if (!mode) return null;

  const symmetryData = MOLECULE_SYMMETRY[molecule.name.toLowerCase().replace(/\s+/g, "_")];
  const symmetryLabel = symmetryData?.modeLabels[modeIndex] || mode.symmetry || "—";
  const modeDescription = symmetryData?.modeDescriptions?.[modeIndex] || "";
  const pointGroup = symmetryData?.pointGroup || molecule.pointGroup || "";

  const irActive = mode.ir_intensity > 0.1;
  const ramanActive = mode.raman_activity > 0.1;
  const activityStr = irActive && ramanActive
    ? "IR + Raman"
    : irActive
      ? "IR"
      : ramanActive
        ? "Raman"
        : "Silent";

  // Molecule center for OrbitControls target
  let cx = 0, cy = 0, cz = 0;
  for (const a of molecule.atoms) { cx += a.x; cy += a.y; cz += a.z; }
  const n = molecule.atoms.length;
  const target: [number, number, number] = [cx / n, cy / n, cz / n];

  // Screenshot handler
  const handleScreenshot = useCallback(() => {
    const canvas = containerRef.current?.querySelector("canvas");
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `${molecule.name}-mode${modeIndex + 1}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }, [molecule.name, modeIndex]);

  // Fullscreen handler
  const handleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      el.requestFullscreen();
    }
  }, []);

  return (
    <div ref={containerRef} className="flex-1 flex flex-col min-h-0 relative">
      {/* Mode header — hidden on mobile (MobileModeStrip shows instead) */}
      <div
        className="hidden lg:flex shrink-0 items-center justify-between px-3 py-2 border-b"
        style={{ borderColor: `${accentColor}33` }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded shrink-0"
            style={{ background: `${accentColor}22`, color: accentColor }}
          >
            {label}
          </span>
          <span className="text-sm font-mono text-foreground shrink-0">
            {mode.frequency.toFixed(0)} cm⁻¹
          </span>
          {modeDescription && (
            <span className="text-[9px] font-mono text-foreground/40 truncate">
              {modeDescription}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono shrink-0">
          {symmetryLabel !== "—" && (
            <span className="text-foreground/60">{symmetryLabel}</span>
          )}
          {pointGroup && (
            <span className="text-foreground/40">{pointGroup}</span>
          )}
          <span
            className="px-1.5 py-0.5 rounded"
            style={{ background: `${accentColor}15`, color: `${accentColor}cc` }}
          >
            {activityStr}
          </span>
        </div>
      </div>

      {/* 3D Canvas */}
      <div className="flex-1 min-h-0 relative">
        <Canvas
          camera={{ position: [0, 0, 6], fov: 50, near: 0.1, far: 100 }}
          gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
        >
          <color attach="background" args={["#030308"]} />
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} intensity={0.9} />
          <directionalLight position={[-3, -3, 2]} intensity={0.3} />
          <pointLight position={[0, 3, 0]} intensity={0.2} color="#00D8FF" />

          <CameraFit molecule={molecule} />
          <Atoms molecule={molecule} modeIndex={modeIndex} />
          <Bonds molecule={molecule} modeIndex={modeIndex} />
          <DisplacementArrows molecule={molecule} modeIndex={modeIndex} color={accentColor} />
          <TrajectoryTrails molecule={molecule} modeIndex={modeIndex} />
          <SymmetryElements molecule={molecule} />
          <GridFloor molecule={molecule} />

          {/* Post-processing deferred to reduce initial TBT */}
          <DeferredMount>
            <SceneEffects />
          </DeferredMount>

          <OrbitControls
            enableDamping
            dampingFactor={0.1}
            minDistance={1}
            maxDistance={20}
            target={target}
            autoRotate
            autoRotateSpeed={0.5}
          />
        </Canvas>

        {/* Overlay buttons — screenshot + fullscreen */}
        <div className="absolute bottom-2 right-2 flex gap-1.5 z-10">
          <button
            onClick={handleScreenshot}
            className="w-7 h-7 flex items-center justify-center rounded bg-surface/60 backdrop-blur-sm border border-border/50 text-foreground/40 hover:text-foreground/80 hover:border-border-bright transition-colors"
            title="Screenshot"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
          </button>
          <button
            onClick={handleFullscreen}
            className="w-7 h-7 flex items-center justify-center rounded bg-surface/60 backdrop-blur-sm border border-border/50 text-foreground/40 hover:text-foreground/80 hover:border-border-bright transition-colors"
            title="Fullscreen"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
