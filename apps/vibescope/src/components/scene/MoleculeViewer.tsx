"use client";

import { useRef, useEffect, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { useVibeStore } from "@/lib/store";
import { Atoms } from "./Atoms";
import { Bonds } from "./Bonds";
import type { MoleculeData } from "@/lib/types";

/** Automatically resets camera to fit the molecule's bounding sphere. */
function CameraFit({ molecule }: { molecule: MoleculeData }) {
  const { camera } = useThree();
  const prevMolRef = useRef<string>("");

  useEffect(() => {
    if (molecule.name === prevMolRef.current) return;
    prevMolRef.current = molecule.name;

    const points = molecule.atoms.map(
      (a) => new THREE.Vector3(a.x, a.y, a.z),
    );
    const box = new THREE.Box3().setFromPoints(points);
    const sphere = new THREE.Sphere();
    box.getBoundingSphere(sphere);

    const radius = Math.max(sphere.radius, 1.5);
    const dist = radius * 3.2;

    camera.position.set(dist * 0.6, dist * 0.4, dist);
    camera.lookAt(sphere.center);
    camera.updateProjectionMatrix();
  }, [molecule, camera]);

  return null;
}

export function MoleculeViewer() {
  const molecule = useVibeStore((s) => s.molecule);
  const loading = useVibeStore((s) => s.loading);
  const [visible, setVisible] = useState(false);

  // Fade in when molecule loads
  useEffect(() => {
    if (molecule && !loading) {
      setVisible(false);
      const raf = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(raf);
    }
    setVisible(false);
  }, [molecule, loading]);

  return (
    <div className="w-full h-full relative">
      {/* Loading overlay with fade */}
      <div
        className={`absolute inset-0 flex items-center justify-center z-10 pointer-events-none transition-opacity duration-300 ${
          loading ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="bg-surface/80 backdrop-blur-sm rounded-lg px-4 py-2.5 border border-border">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            <span className="text-text-muted font-mono text-sm">
              Loading molecule...
            </span>
          </div>
        </div>
      </div>

      {/* Molecule name overlay */}
      {molecule && (
        <div
          className={`absolute top-3 left-3 z-10 pointer-events-none transition-opacity duration-500 ${
            visible ? "opacity-100" : "opacity-0"
          }`}
        >
          <span className="text-[11px] font-mono text-text-muted/40 capitalize">
            {molecule.name} · {molecule.formula}
          </span>
        </div>
      )}

      <Canvas
        camera={{ position: [0, 0, 6], fov: 50, near: 0.1, far: 100 }}
        gl={{ antialias: true, alpha: true }}
      >
        <color attach="background" args={["#000000"]} />
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />
        <directionalLight position={[-3, -3, 2]} intensity={0.3} />

        {molecule && (
          <>
            <CameraFit molecule={molecule} />
            <Atoms molecule={molecule} />
            <Bonds molecule={molecule} />
          </>
        )}

        <OrbitControls
          enableDamping
          dampingFactor={0.1}
          minDistance={2}
          maxDistance={20}
        />
      </Canvas>
    </div>
  );
}
