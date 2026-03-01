/**
 * AtomOrbit3D — Interactive 3D atomic valence shell visualization.
 * Canvas 2D for rings/connections/electrons + DOM overlays for node labels.
 * All animation via rAF + direct DOM updates — zero React re-renders at 60fps.
 * Hover a node to see its description replace the label with animation.
 * Drag to rotate. Auto-rotates when idle. Pauses when off-screen.
 */
import { useRef, useState, useEffect, useCallback } from "react";

interface OrbitalNode {
  label: string;
  icon: string;
  description?: string;
  color?: string;
}

interface Props {
  centerLabel?: string;
  centerIcon?: string;
  nodes: OrbitalNode[];
  className?: string;
}

// ─── Color helpers ────────────────────────────────────────

const RING_COLORS = ["#C9A04A", "#4ECDC4", "#FF6B6B", "#A78BFA", "#34D399", "#F59E0B"];

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

// Pre-compute RGB values
const RING_RGBS = RING_COLORS.map(hexToRgb);

// ─── 3D Math ─────────────────────────────────────────────

interface Vec3 { x: number; y: number; z: number }

function rotateY(p: Vec3, a: number): Vec3 {
  const c = Math.cos(a), s = Math.sin(a);
  return { x: p.x * c + p.z * s, y: p.y, z: -p.x * s + p.z * c };
}

function rotateX(p: Vec3, a: number): Vec3 {
  const c = Math.cos(a), s = Math.sin(a);
  return { x: p.x, y: p.y * c - p.z * s, z: p.y * s + p.z * c };
}

function project(p: Vec3, fov: number, cx: number, cy: number) {
  const perspective = fov / (p.z + fov + 250);
  return { x: p.x * perspective + cx, y: p.y * perspective + cy, scale: perspective, z: p.z };
}

function fibonacciSphere(count: number, radius: number): Vec3[] {
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  return Array.from({ length: count }, (_, i) => {
    const y = 1 - ((i + 0.5) / count) * 2;
    const radiusAtY = Math.sqrt(1 - y * y);
    const theta = goldenAngle * i;
    return {
      x: radius * radiusAtY * Math.cos(theta),
      y: radius * y * 0.7,
      z: radius * radiusAtY * Math.sin(theta),
    };
  });
}

// ─── Constants ────────────────────────────────────────────

const FOV = 500;
const RING_TILTS = [0, Math.PI / 2.8, -Math.PI / 2.8, Math.PI / 5, -Math.PI / 4.5, Math.PI / 3.5];
const RING_SEG_COUNT = 60;
const ELECTRON_SPEEDS = [0.3, 0.45, 0.22, 0.38, 0.28, 0.35];
const ELECTRON_OFFSETS = [0, 2.1, 4.2, 1.0, 3.5, 5.2];

// ─── Component ───────────────────────────────────────────

export default function AtomOrbit3D({
  centerLabel, centerIcon, nodes, className = "",
}: Props) {
  const showCenter = !!centerIcon;
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const centerRef = useRef<HTMLDivElement>(null);

  // Only hoveredNode triggers React re-render (event-driven, not 60fps)
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const hoveredRef = useRef<string | null>(null);

  // All animation state in refs — no React re-renders
  const sizeRef = useRef({ w: 700, h: 600 });
  const rotRef = useRef({ x: -0.35, y: 0 });
  const autoYRef = useRef(0);
  const dragRef = useRef(false);
  const lastPtrRef = useRef({ x: 0, y: 0 });
  const animIdRef = useRef(0);
  const lastTimeRef = useRef(0);
  const isVisibleRef = useRef(false);
  const mountedRef = useRef(false);
  const basePositions = useRef<Vec3[]>(fibonacciSphere(nodes.length, 1));
  const nodeColorsRgb = useRef(nodes.map(n => hexToRgb(n.color || "#C9A04A")));

  // Sync hoveredNode state with ref
  const handleHover = useCallback((label: string | null) => {
    hoveredRef.current = label;
    setHoveredNode(label);
  }, []);

  // ─── Canvas draw + DOM position update (called every frame) ───
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { w, h } = sizeRef.current;
    const dpr = window.devicePixelRatio || 1;

    // Resize canvas if needed
    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    ctx.clearRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2;
    const radius = Math.min(w, h) * 0.65;
    const depthRange = radius * 2;
    const yAngle = rotRef.current.y + autoYRef.current;
    const xAngle = rotRef.current.x;

    const ringCount = Math.min(nodes.length, RING_TILTS.length);

    // ─── Draw orbital rings ───
    for (let ri = 0; ri < ringCount; ri++) {
      const tilt = RING_TILTS[ri];
      const [r, g, b] = RING_RGBS[ri % RING_RGBS.length];

      for (let j = 0; j < RING_SEG_COUNT; j++) {
        const a1 = (j / RING_SEG_COUNT) * Math.PI * 2;
        const a2 = ((j + 1) / RING_SEG_COUNT) * Math.PI * 2;

        let p1: Vec3 = { x: radius * Math.cos(a1), y: 0, z: radius * Math.sin(a1) };
        p1 = rotateX(p1, tilt); p1 = rotateY(p1, yAngle); p1 = rotateX(p1, xAngle);
        let p2: Vec3 = { x: radius * Math.cos(a2), y: 0, z: radius * Math.sin(a2) };
        p2 = rotateX(p2, tilt); p2 = rotateY(p2, yAngle); p2 = rotateX(p2, xAngle);

        const proj1 = project(p1, FOV, cx, cy);
        const proj2 = project(p2, FOV, cx, cy);
        const avgZ = (p1.z + p2.z) / 2;
        const depth = Math.max(0, Math.min(1, (avgZ + radius) / depthRange));
        const opacity = 0.03 + depth * 0.18;
        const lineWidth = 0.3 + depth * 1.0;

        ctx.beginPath();
        ctx.moveTo(proj1.x, proj1.y);
        ctx.lineTo(proj2.x, proj2.y);
        ctx.strokeStyle = `rgba(${r},${g},${b},${opacity})`;
        ctx.lineWidth = lineWidth;
        ctx.lineCap = "round";
        ctx.stroke();
      }
    }

    // ─── Draw connection lines ───
    const center3D = rotateX(rotateY({ x: 0, y: 0, z: 0 }, yAngle), xAngle);
    const centerProj = project(center3D, FOV, cx, cy);

    const positions = basePositions.current;
    for (let i = 0; i < nodes.length; i++) {
      let p = rotateY({ x: positions[i].x * radius, y: positions[i].y * radius, z: positions[i].z * radius }, yAngle);
      p = rotateX(p, xAngle);
      const proj = project(p, FOV, cx, cy);
      const depth01 = (p.z + radius) / depthRange;
      const opacity = 0.03 + depth01 * 0.15;
      const lineWidth = 0.3 + depth01 * 0.8;
      const [r, g, b] = nodeColorsRgb.current[i];

      ctx.beginPath();
      ctx.setLineDash([4, 4]);
      ctx.moveTo(centerProj.x, centerProj.y);
      ctx.lineTo(proj.x, proj.y);
      ctx.strokeStyle = `rgba(${r},${g},${b},${opacity})`;
      ctx.lineWidth = lineWidth;
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // ─── Draw electrons ───
    for (let ri = 0; ri < ringCount; ri++) {
      const tilt = RING_TILTS[ri];
      const a = (autoYRef.current + rotRef.current.y) * ELECTRON_SPEEDS[ri] * 3 + ELECTRON_OFFSETS[ri];
      let p: Vec3 = { x: radius * Math.cos(a), y: 0, z: radius * Math.sin(a) };
      p = rotateX(p, tilt); p = rotateY(p, yAngle); p = rotateX(p, xAngle);
      const depth01 = Math.max(0, Math.min(1, (p.z + radius) / depthRange));
      const proj = project(p, FOV, cx, cy);
      const [r, g, b] = RING_RGBS[ri % RING_RGBS.length];
      const er = 1.5 + depth01 * 2.5;
      const opacity = 0.2 + depth01 * 0.7;

      ctx.beginPath();
      ctx.arc(proj.x, proj.y, er, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r},${g},${b},${opacity})`;
      ctx.fill();
    }

    // ─── Draw center glow ───
    if (showCenter) {
      ctx.beginPath();
      ctx.arc(centerProj.x, centerProj.y, radius * 0.18, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(201,160,74,0.02)";
      ctx.fill();

      ctx.beginPath();
      ctx.arc(centerProj.x, centerProj.y, radius * 0.08, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(201,160,74,0.1)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // ─── Position DOM node overlays ───
    const nodeData: { idx: number; projX: number; projY: number; rawZ: number; depth01: number }[] = [];
    const normalizedPositions = basePositions.current;
    for (let i = 0; i < nodes.length; i++) {
      let p = rotateY(
        { x: normalizedPositions[i].x * radius, y: normalizedPositions[i].y * radius, z: normalizedPositions[i].z * radius },
        yAngle,
      );
      p = rotateX(p, xAngle);
      const proj = project(p, FOV, cx, cy);
      const depth01 = Math.max(0, Math.min(1, (p.z + radius) / depthRange));
      nodeData.push({ idx: i, projX: proj.x, projY: proj.y, rawZ: p.z, depth01 });
    }

    // Sort by depth for z-index
    nodeData.sort((a, b) => a.rawZ - b.rawZ);

    for (let sortIdx = 0; sortIdx < nodeData.length; sortIdx++) {
      const { idx, projX, projY, depth01 } = nodeData[sortIdx];
      const el = nodeRefs.current[idx];
      if (!el) continue;

      const s = 0.45 + depth01 * 0.65;
      const isHovered = hoveredRef.current === nodes[idx].label;
      const o = mountedRef.current ? (isHovered ? 1 : 0.25 + depth01 * 0.75) : 0;
      const blurAmt = isHovered ? 0 : (1 - depth01) * 2.5;

      el.style.left = `${projX}px`;
      el.style.top = `${projY}px`;
      el.style.transform = `translate(-50%, -50%) scale(${s.toFixed(3)})`;
      el.style.opacity = `${o}`;
      el.style.zIndex = `${isHovered ? 300 : sortIdx + 10}`;
      el.style.filter = blurAmt > 0.01 ? `blur(${blurAmt.toFixed(1)}px)` : "none";
    }

    // Position center
    if (centerRef.current && showCenter) {
      centerRef.current.style.left = `${centerProj.x}px`;
      centerRef.current.style.top = `${centerProj.y}px`;
      centerRef.current.style.opacity = mountedRef.current ? "1" : "0";
    }
  }, [nodes, showCenter]);

  // ─── Resize observer ───
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const update = () => {
      const r = container.getBoundingClientRect();
      sizeRef.current = { w: r.width, h: Math.max(r.height, 400) };
    };
    update();

    const ro = new ResizeObserver(update);
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  // ─── Intersection observer (pause when off-screen) ───
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new IntersectionObserver(
      ([entry]) => { isVisibleRef.current = entry.isIntersecting; },
      { threshold: 0 },
    );
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // ─── Animation loop ───
  useEffect(() => {
    mountedRef.current = true;
    lastTimeRef.current = performance.now();

    // Normalize base positions to unit sphere (multiply by radius at draw time)
    const count = nodes.length;
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    const positions: Vec3[] = [];
    for (let i = 0; i < count; i++) {
      const y = 1 - ((i + 0.5) / count) * 2;
      const radiusAtY = Math.sqrt(1 - y * y);
      const theta = goldenAngle * i;
      positions.push({ x: radiusAtY * Math.cos(theta), y: y * 0.7, z: radiusAtY * Math.sin(theta) });
    }
    basePositions.current = positions;

    const loop = () => {
      if (isVisibleRef.current) {
        const now = performance.now();
        const dt = (now - lastTimeRef.current) / 1000;
        lastTimeRef.current = now;
        if (!dragRef.current) {
          autoYRef.current += dt * 0.48;
        }
        draw();
      } else {
        lastTimeRef.current = performance.now();
      }
      animIdRef.current = requestAnimationFrame(loop);
    };

    animIdRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animIdRef.current);
  }, [draw, nodes.length]);

  // ─── Pointer handlers ───
  const onDown = useCallback((e: React.PointerEvent) => {
    dragRef.current = true;
    lastPtrRef.current = { x: e.clientX, y: e.clientY };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const onMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - lastPtrRef.current.x;
    const dy = e.clientY - lastPtrRef.current.y;
    rotRef.current = {
      y: rotRef.current.y + dx * 0.006,
      x: Math.max(-1.3, Math.min(1.3, rotRef.current.x + dy * 0.006)),
    };
    lastPtrRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  const onUp = useCallback(() => { dragRef.current = false; }, []);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-[640px] md:h-[720px] select-none ${className}`}
      style={{ cursor: dragRef.current ? "grabbing" : "grab", touchAction: "pan-y" }}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    >
      {/* Canvas for rings, connections, electrons */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      {/* DOM node overlays — positioned via refs, not React state */}
      {nodes.map((node, i) => {
        const nodeColor = node.color || "#C9A04A";
        const [cr, cg, cb] = hexToRgb(nodeColor);
        const isHovered = hoveredNode === node.label;

        return (
          <div
            key={node.label}
            ref={(el) => { nodeRefs.current[i] = el; }}
            className="absolute flex items-center gap-2.5"
            style={{
              pointerEvents: "auto",
              transition: "filter 150ms ease, opacity 200ms ease",
            }}
            onMouseEnter={() => handleHover(node.label)}
            onMouseLeave={() => handleHover(null)}
          >
            {/* Node circle */}
            <div
              className="flex-shrink-0 flex items-center justify-center w-[72px] h-[72px] md:w-20 md:h-20 rounded-full border transition-all duration-200"
              style={{
                background: isHovered
                  ? `rgba(${cr},${cg},${cb},0.1)`
                  : `rgba(${cr},${cg},${cb},0.04)`,
                borderColor: isHovered
                  ? `rgba(${cr},${cg},${cb},0.35)`
                  : `rgba(${cr},${cg},${cb},0.1)`,
                boxShadow: isHovered
                  ? `0 0 30px rgba(${cr},${cg},${cb},0.2), inset 0 0 20px rgba(${cr},${cg},${cb},0.05)`
                  : `0 4px 12px rgba(0,0,0,0.15)`,
                backdropFilter: "blur(8px)",
                cursor: "pointer",
              }}
            >
              <svg
                width="26" height="26" viewBox="0 0 24 24" fill="none"
                stroke={isHovered ? nodeColor : `rgba(${cr},${cg},${cb},0.55)`}
                strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                style={{ transition: "stroke 200ms ease" }}
              >
                <path d={node.icon} />
              </svg>
            </div>

            {/* Label / Description */}
            <div className="overflow-hidden" style={{ maxWidth: isHovered ? 240 : 160, transition: "max-width 200ms ease" }}>
              {isHovered && node.description ? (
                <p
                  className="text-[11px] md:text-xs leading-snug whitespace-normal font-body"
                  style={{ animation: "descFadeIn 250ms ease-out both" }}
                >
                  {node.description.split(/(\*[^*]+\*)/).map((part, pi) =>
                    part.startsWith("*") && part.endsWith("*") ? (
                      <span key={pi} style={{ color: nodeColor, fontWeight: 500 }}>
                        {part.slice(1, -1)}
                      </span>
                    ) : (
                      <span key={pi} className="text-white/70">{part}</span>
                    )
                  )}
                </p>
              ) : (
                <span
                  className="text-[10px] md:text-xs font-body whitespace-nowrap transition-colors duration-200"
                  style={{ color: "rgba(255,255,255,0.45)" }}
                >
                  {node.label}
                </span>
              )}
            </div>
          </div>
        );
      })}

      {/* Center nucleus */}
      {showCenter && centerIcon && (
        <div
          ref={centerRef}
          className="absolute flex flex-col items-center gap-1 pointer-events-none"
          style={{ transform: "translate(-50%, -50%)", zIndex: 200, opacity: 0, transition: "opacity 0.6s ease" }}
        >
          <div
            className="flex items-center justify-center w-11 h-11 md:w-12 md:h-12 rounded-full bg-[#C9A04A]/10 border border-[#C9A04A]/30"
            style={{ boxShadow: "0 0 30px rgba(201,160,74,0.2), 0 0 60px rgba(201,160,74,0.06)" }}
          >
            <svg
              width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="#C9A04A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
            >
              <path d={centerIcon} />
            </svg>
          </div>
          {centerLabel && (
            <span className="text-[9px] font-mono text-[#C9A04A]/70 whitespace-nowrap">{centerLabel}</span>
          )}
        </div>
      )}

      {/* Drag hint */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] font-mono text-white/15 pointer-events-none">
        drag to rotate
      </div>

      {/* Scoped keyframes */}
      <style>{`
        @keyframes descFadeIn {
          from { opacity: 0; transform: translateX(-6px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
