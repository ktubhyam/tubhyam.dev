'use client';

import { useRef, useMemo, useState, useEffect, useCallback, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useDroppable } from '@dnd-kit/core';
import { useGameStore } from '@/stores/gameStore';
import { SUBSHELL_COLORS, getSubshellType } from '@/lib/chemistry';
import { getNextCorrectOrbital } from '@/lib/chemistry/validation';
import { usePlaceWithAudio } from '@/hooks/usePlaceWithAudio';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import type { OrbitalState } from '@/types/chemistry';

// Generate orbital point cloud — OPTIMIZED: fewer points, cached geometry
function generateOrbitalPoints(
  n: number,
  l: number,
  ml: number,
  numPoints: number,
  filled: boolean
): { positions: Float32Array; colors: Float32Array } {
  const positions = new Float32Array(numPoints * 3);
  const colors = new Float32Array(numPoints * 3);
  const type = getSubshellType(l);
  const colorHex = SUBSHELL_COLORS[type];
  const color = new THREE.Color(colorHex);

  const scale = 0.6 + n * 0.4;
  let accepted = 0;
  let attempts = 0;
  const maxAttempts = numPoints * 50;

  while (accepted < numPoints && attempts < maxAttempts) {
    attempts++;
    const r = Math.random() * scale * 2.5;
    const theta = Math.acos(2 * Math.random() - 1);
    const phi = Math.random() * 2 * Math.PI;

    let density = 0;

    if (l === 0) {
      const rNorm = r / scale;
      if (n === 1) density = Math.exp(-2 * rNorm);
      else if (n === 2) density = (2 - rNorm) ** 2 * Math.exp(-rNorm);
      else if (n === 3) density = (27 - 18 * rNorm + 2 * rNorm ** 2) ** 2 * Math.exp(-2 * rNorm / 3) * 0.0001;
      else density = Math.exp(-rNorm / n) * (1 + rNorm) ** 2;
    } else if (l === 1) {
      const rNorm = r / scale;
      const radial = rNorm * Math.exp(-rNorm / (n * 0.7));
      if (ml === 0) density = radial ** 2 * Math.cos(theta) ** 2;
      else if (ml === 1) density = radial ** 2 * Math.sin(theta) ** 2 * Math.cos(phi) ** 2;
      else density = radial ** 2 * Math.sin(theta) ** 2 * Math.sin(phi) ** 2;
    } else if (l === 2) {
      const rNorm = r / scale;
      const radial = rNorm ** 2 * Math.exp(-rNorm / (n * 0.5));
      const st = Math.sin(theta), ct = Math.cos(theta);
      const cp = Math.cos(phi), sp = Math.sin(phi);
      if (ml === 0) density = radial ** 2 * (3 * ct ** 2 - 1) ** 2;
      else if (ml === 1) density = radial ** 2 * (st * ct * cp) ** 2;
      else if (ml === -1) density = radial ** 2 * (st * ct * sp) ** 2;
      else if (ml === 2) density = radial ** 2 * (st ** 2 * Math.cos(2 * phi)) ** 2;
      else density = radial ** 2 * (st ** 2 * Math.sin(2 * phi)) ** 2;
    }

    if (Math.random() < density * 0.5) {
      positions[accepted * 3] = r * Math.sin(theta) * Math.cos(phi);
      positions[accepted * 3 + 1] = r * Math.sin(theta) * Math.sin(phi);
      positions[accepted * 3 + 2] = r * Math.cos(theta);

      const brightness = filled ? 0.8 + Math.random() * 0.2 : 0.15 + Math.random() * 0.1;
      colors[accepted * 3] = color.r * brightness;
      colors[accepted * 3 + 1] = color.g * brightness;
      colors[accepted * 3 + 2] = color.b * brightness;
      accepted++;
    }
  }

  return { positions, colors };
}

function OrbitalCloud({ orbital }: { orbital: OrbitalState }) {
  const pointsRef = useRef<THREE.Points>(null);
  const filled = orbital.electrons.length > 0;
  const numPoints = filled ? 800 : 150;

  const { positions, colors } = useMemo(
    () => generateOrbitalPoints(orbital.n, orbital.l, orbital.ml, numPoints, filled),
    [orbital.n, orbital.l, orbital.ml, numPoints, filled]
  );

  useFrame((_, delta) => {
    if (pointsRef.current && filled) {
      pointsRef.current.rotation.y += delta * 0.08;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={filled ? 0.05 : 0.025}
        vertexColors
        sizeAttenuation
        transparent
        opacity={filled ? 0.9 : 0.15}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

// Nucleus with dynamic glow based on fill percentage
function Nucleus({ fillPercentage }: { fillPercentage: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const showViolation = useGameStore(s => s.showViolation);
  const lastViolation = useGameStore(s => s.lastViolation);
  const hasError = showViolation && lastViolation?.severity === 'error';
  const shakeStartRef = useRef(0);

  useEffect(() => {
    if (hasError) {
      shakeStartRef.current = Date.now();
    }
  }, [hasError]);

  useFrame((state) => {
    if (!meshRef.current) return;

    const pulse = Math.sin(state.clock.elapsedTime * 2) * 0.05;
    meshRef.current.scale.setScalar(1 + pulse);

    // Shake on error
    const shakeElapsed = (Date.now() - shakeStartRef.current) / 1000;
    if (shakeElapsed < 0.3) {
      const intensity = (0.3 - shakeElapsed) * 0.3;
      meshRef.current.position.x = (Math.random() - 0.5) * intensity;
      meshRef.current.position.y = (Math.random() - 0.5) * intensity;
    } else {
      meshRef.current.position.x = 0;
      meshRef.current.position.y = 0;
    }

    // Dynamic emissive intensity: 1.5 → 4.5 based on fill
    const material = meshRef.current.material as THREE.MeshStandardMaterial;
    material.emissiveIntensity = 1.5 + fillPercentage * 3;

    // Red flash on error
    if (shakeElapsed < 0.5) {
      material.emissive.set('#FF4444');
    } else {
      material.emissive.set('#C9A04A');
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.1, 16, 16]} />
      <meshStandardMaterial
        color="#ffffff"
        emissive="#C9A04A"
        emissiveIntensity={1.5 + fillPercentage * 3}
      />
    </mesh>
  );
}

// Stability aura — grows and brightens as atom fills
function StabilityAura({ fillPercentage }: { fillPercentage: number }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current && fillPercentage > 0.1) {
      const breathe = Math.sin(state.clock.elapsedTime * 0.8) * 0.02;
      const scale = 1.5 + fillPercentage * 2 + breathe;
      meshRef.current.scale.setScalar(scale);
    }
  });

  if (fillPercentage < 0.1) return null;

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1, 24, 24]} />
      <meshStandardMaterial
        color="#C9A04A"
        transparent
        opacity={fillPercentage * 0.08}
        side={THREE.BackSide}
        depthWrite={false}
      />
    </mesh>
  );
}

// Particle burst on electron placement
function BurstParticles() {
  const pointsRef = useRef<THREE.Points>(null);
  const startTime = useRef(Date.now());

  const velocities = useRef<Float32Array>(new Float32Array(30 * 3));

  const { positions, colors } = useMemo(() => {
    const count = 30;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const color = new THREE.Color('#C9A04A');

    for (let i = 0; i < count; i++) {
      const theta = Math.acos(2 * Math.random() - 1);
      const phi = Math.random() * Math.PI * 2;
      const r = 0.1;
      pos[i * 3] = r * Math.sin(theta) * Math.cos(phi);
      pos[i * 3 + 1] = r * Math.sin(theta) * Math.sin(phi);
      pos[i * 3 + 2] = r * Math.cos(theta);
      col[i * 3] = color.r;
      col[i * 3 + 1] = color.g;
      col[i * 3 + 2] = color.b;

      const speed = 2 + Math.random() * 3;
      velocities.current[i * 3] = speed * Math.sin(theta) * Math.cos(phi);
      velocities.current[i * 3 + 1] = speed * Math.sin(theta) * Math.sin(phi);
      velocities.current[i * 3 + 2] = speed * Math.cos(theta);
    }
    return { positions: pos, colors: col };
  }, []);

  useFrame(() => {
    if (!pointsRef.current) return;
    const elapsed = (Date.now() - startTime.current) / 1000;
    const posAttr = pointsRef.current.geometry.getAttribute('position') as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;

    for (let i = 0; i < 30; i++) {
      arr[i * 3] += velocities.current[i * 3] * 0.016;
      arr[i * 3 + 1] += velocities.current[i * 3 + 1] * 0.016;
      arr[i * 3 + 2] += velocities.current[i * 3 + 2] * 0.016;
    }
    posAttr.needsUpdate = true;

    const material = pointsRef.current.material as THREE.PointsMaterial;
    material.opacity = Math.max(0, 1 - elapsed);
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        vertexColors
        transparent
        opacity={1}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

function PlacementBursts() {
  const placedElectrons = useGameStore(s => s.placedElectrons);
  const [bursts, setBursts] = useState<number[]>([]);

  useEffect(() => {
    if (placedElectrons > 0) {
      const id = Date.now();
      setBursts(prev => [...prev, id]);
      setTimeout(() => setBursts(prev => prev.filter(b => b !== id)), 1000);
    }
  }, [placedElectrons]);

  return (
    <>
      {bursts.map(id => (
        <BurstParticles key={id} />
      ))}
    </>
  );
}

function Scene({ isDropHovering }: { isDropHovering: boolean }) {
  const orbitals = useGameStore(s => s.orbitals);
  const placedElectrons = useGameStore(s => s.placedElectrons);
  const totalElectrons = useGameStore(s => s.totalElectrons);

  const fillPercentage = totalElectrons > 0 ? placedElectrons / totalElectrons : 0;

  return (
    <>
      <ambientLight intensity={0.1 + fillPercentage * 0.15} />
      <pointLight position={[5, 5, 5]} intensity={0.4 + fillPercentage * 0.3} color="#C9A04A" />
      <pointLight position={[-5, -5, 3]} intensity={0.2} color="#4A90D9" />

      {/* Drop hover highlight */}
      {isDropHovering && (
        <pointLight position={[0, 0, 3]} intensity={0.3} color="#C9A04A" />
      )}

      <group>
        <Nucleus fillPercentage={fillPercentage} />
        {orbitals.map((orbital) => (
          <OrbitalCloud key={orbital.id} orbital={orbital} />
        ))}
        <StabilityAura fillPercentage={fillPercentage} />
        <PlacementBursts />
      </group>

      <OrbitControls
        enablePan={false}
        minDistance={2}
        maxDistance={12 - fillPercentage * 3}
        autoRotate
        autoRotateSpeed={0.3 + fillPercentage * 0.4}
      />
    </>
  );
}

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-full bg-black">
      <div className="text-center font-mono">
        <div className="text-sm text-foreground/40 animate-pulse mb-2">initializing renderer...</div>
        <div className="text-[10px] text-foreground/20">loading WebGL context</div>
      </div>
    </div>
  );
}

function WebGLFallback() {
  return (
    <div className="flex items-center justify-center h-full bg-black">
      <div className="text-center font-mono p-6 max-w-sm">
        <div className="text-2xl mb-3 text-error/60">⚠</div>
        <div className="text-sm text-foreground/50 mb-2">3D viewer unavailable</div>
        <div className="text-[10px] text-foreground/25 leading-relaxed">
          WebGL is not supported in this browser. Use the energy diagram on the right to place electrons by clicking orbital slots.
        </div>
      </div>
    </div>
  );
}

export function OrbitalViewer() {
  const phase = useGameStore(s => s.phase);
  const orbitals = useGameStore(s => s.orbitals);
  const selectedSpin = useGameStore(s => s.selectedSpin);
  const placeWithAudio = usePlaceWithAudio();

  const nextOrbital = getNextCorrectOrbital(orbitals);
  const canReceiveDrop = phase === 'playing' && nextOrbital !== null;

  const { isOver, setNodeRef } = useDroppable({
    id: 'orbital-viewer-drop',
    disabled: !canReceiveDrop,
  });

  // Track pointer movement to distinguish clicks from drags
  const pointerDownPos = useRef<{ x: number; y: number } | null>(null);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    pointerDownPos.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleClick = useCallback((e: React.MouseEvent) => {
    // Only count as click if pointer didn't move much (not an orbit drag)
    if (pointerDownPos.current) {
      const dx = Math.abs(e.clientX - pointerDownPos.current.x);
      const dy = Math.abs(e.clientY - pointerDownPos.current.y);
      if (dx > 5 || dy > 5) return; // Was an orbit rotation, not a click
    }

    if (!canReceiveDrop || !nextOrbital) return;
    placeWithAudio(nextOrbital.orbitalId, selectedSpin);
  }, [canReceiveDrop, nextOrbital, placeWithAudio, selectedSpin]);

  return (
    <div
      ref={setNodeRef}
      onPointerDown={handlePointerDown}
      onClick={handleClick}
      className={`w-full h-full rounded-xl overflow-hidden bg-black relative cursor-pointer transition-all ${
        isOver ? 'ring-2 ring-accent/50 ring-inset' : ''
      }`}
    >
      <ErrorBoundary fallback={<WebGLFallback />}>
        <Suspense fallback={<LoadingFallback />}>
          <Canvas
            camera={{ position: [0, 0, 5], fov: 50 }}
            dpr={[1, 1.5]}
            frameloop="always"
            gl={{ antialias: false, alpha: false, powerPreference: 'high-performance' }}
            onCreated={({ gl }) => {
              gl.setClearColor('#000000');
            }}
          >
            <Scene isDropHovering={isOver} />
          </Canvas>
        </Suspense>
      </ErrorBoundary>

      {/* Drop hint overlay */}
      {isOver && nextOrbital && (
        <div className="absolute inset-0 bg-accent/5 pointer-events-none flex items-end justify-center pb-4">
          <div className="text-accent/60 text-xs font-mono bg-black/50 px-3 py-1 rounded-lg">
            Drop to place in {nextOrbital.orbitalId.replace('_', ' ml=')}
          </div>
        </div>
      )}

      {/* Click hint */}
      {canReceiveDrop && !isOver && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] text-foreground/15 font-mono pointer-events-none">
          click atom to place electron
        </div>
      )}
    </div>
  );
}
