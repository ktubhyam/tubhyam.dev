/**
 * AtomOrbit3D — Interactive 3D atomic valence shell visualization.
 * Depth cues: per-segment ring shading, depth blur, scaled connections.
 * Hover a node to see its description replace the label with animation.
 * Per-node and per-ring color support for a vibrant palette.
 * Drag to rotate. Auto-rotates when idle.
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
    const y = 1 - (i / (count - 1)) * 2;
    const radiusAtY = Math.sqrt(1 - y * y);
    const theta = goldenAngle * i;
    return {
      x: radius * radiusAtY * Math.cos(theta),
      y: radius * y * 0.7,
      z: radius * radiusAtY * Math.sin(theta),
    };
  });
}

// ─── Ring segments with depth ────────────────────────────

interface RingSegment {
  x1: number; y1: number; x2: number; y2: number; depth: number;
}

function computeRingSegments(
  tilt: number, radius: number, yAngle: number, xAngle: number,
  fov: number, cx: number, cy: number, segments: number
): RingSegment[] {
  const result: RingSegment[] = [];
  for (let j = 0; j < segments; j++) {
    const a1 = (j / segments) * Math.PI * 2;
    const a2 = ((j + 1) / segments) * Math.PI * 2;
    let p1: Vec3 = { x: radius * Math.cos(a1), y: 0, z: radius * Math.sin(a1) };
    p1 = rotateX(p1, tilt); p1 = rotateY(p1, yAngle); p1 = rotateX(p1, xAngle);
    let p2: Vec3 = { x: radius * Math.cos(a2), y: 0, z: radius * Math.sin(a2) };
    p2 = rotateX(p2, tilt); p2 = rotateY(p2, yAngle); p2 = rotateX(p2, xAngle);
    const proj1 = project(p1, fov, cx, cy);
    const proj2 = project(p2, fov, cx, cy);
    const avgZ = (p1.z + p2.z) / 2;
    const depth = Math.max(0, Math.min(1, (avgZ + radius) / (radius * 2)));
    result.push({ x1: proj1.x, y1: proj1.y, x2: proj2.x, y2: proj2.y, depth });
  }
  return result;
}

// ─── Component ───────────────────────────────────────────

export default function AtomOrbit3D({
  centerIcon, nodes, className = "",
}: Props) {
  const showCenter = !!centerIcon;
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 700, h: 600 });
  const [, tick] = useState(0);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const [mounted, setMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const rotRef = useRef({ x: -0.35, y: 0 });
  const autoYRef = useRef(0);
  const dragRef = useRef(false);
  const lastPtrRef = useRef({ x: 0, y: 0 });
  const animIdRef = useRef(0);
  const lastTimeRef = useRef(0);

  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        const r = containerRef.current.getBoundingClientRect();
        setSize({ w: r.width, h: Math.max(r.height, 400) });
      }
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Fade-in after mount
  useEffect(() => { setMounted(true); }, []);

  // Pause rAF when off-screen
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Shared time-advance function — updates rotation angle based on elapsed time
  const advanceTime = useCallback(() => {
    const now = performance.now();
    const dt = (now - lastTimeRef.current) / 1000;
    lastTimeRef.current = now;
    if (!dragRef.current) {
      autoYRef.current += dt * 0.48;
    }
  }, []);

  // Time-based animation loop — pauses when off-screen to save CPU
  useEffect(() => {
    if (!isVisible) return;

    lastTimeRef.current = performance.now();
    const loop = () => {
      advanceTime();
      tick((t) => t + 1);
      animIdRef.current = requestAnimationFrame(loop);
    };
    animIdRef.current = requestAnimationFrame(loop);

    // ALSO force re-renders during scroll — during scrolling the browser
    // deprioritizes rAF-triggered React state updates, so the orbit appears
    // to freeze. This scroll listener ensures renders keep happening.
    const onScroll = () => {
      advanceTime();
      tick((t) => t + 1);
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      cancelAnimationFrame(animIdRef.current);
      window.removeEventListener("scroll", onScroll);
    };
  }, [advanceTime, isVisible]);

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

  // ─── Scene ─────────────────────────────────
  const cx = size.w / 2;
  const cy = size.h / 2;
  const radius = Math.min(size.w, size.h) * 0.65;
  const fov = 500;
  const yAngle = rotRef.current.y + autoYRef.current;
  const xAngle = rotRef.current.x;
  const depthRange = radius * 2;

  const basePositions = fibonacciSphere(nodes.length, radius);
  const nodeData = nodes.map((node, i) => {
    let p = rotateY(basePositions[i], yAngle);
    p = rotateX(p, xAngle);
    const proj = project(p, fov, cx, cy);
    return { node, proj, rawZ: p.z };
  });
  const sorted = [...nodeData].sort((a, b) => a.rawZ - b.rawZ);

  const center3D = rotateX(rotateY({ x: 0, y: 0, z: 0 }, yAngle), xAngle);
  const centerProj = project(center3D, fov, cx, cy);

  // 6 orbital rings at varied tilts
  const ringTilts = [0, Math.PI / 2.8, -Math.PI / 2.8, Math.PI / 5, -Math.PI / 4.5, Math.PI / 3.5];
  const ringSegCount = 60;
  const allRingSegments = ringTilts.map((tilt) =>
    computeRingSegments(tilt, radius, yAngle, xAngle, fov, cx, cy, ringSegCount)
  );

  // 6 electron particles — one per ring, different speeds & offsets
  const electronSpeeds = [0.3, 0.45, 0.22, 0.38, 0.28, 0.35];
  const electronOffsets = [0, 2.1, 4.2, 1.0, 3.5, 5.2];
  const electronData = ringTilts.map((tilt, ri) => {
    const a = (autoYRef.current + rotRef.current.y) * electronSpeeds[ri] * 3 + electronOffsets[ri];
    let p: Vec3 = { x: radius * Math.cos(a), y: 0, z: radius * Math.sin(a) };
    p = rotateX(p, tilt); p = rotateY(p, yAngle); p = rotateX(p, xAngle);
    const depth01 = Math.max(0, Math.min(1, (p.z + radius) / depthRange));
    const proj = project(p, fov, cx, cy);
    return { proj, depth01, ringIdx: ri };
  });

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
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox={`0 0 ${size.w} ${size.h}`}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Depth-shaded orbital ring segments — per-ring color */}
        {allRingSegments.map((segments, ri) => {
          const [r, g, b] = hexToRgb(RING_COLORS[ri % RING_COLORS.length]);
          return segments.map((seg, si) => {
            const opacity = 0.03 + seg.depth * 0.18;
            const width = 0.3 + seg.depth * 1.0;
            return (
              <line
                key={`ring-${ri}-${si}`}
                x1={seg.x1} y1={seg.y1} x2={seg.x2} y2={seg.y2}
                stroke={`rgba(${r}, ${g}, ${b}, ${opacity.toFixed(3)})`}
                strokeWidth={width}
                strokeLinecap="round"
              />
            );
          });
        })}

        {/* Connection lines — per-node color */}
        {sorted.map(({ node, proj, rawZ }, i) => {
          const depth01 = (rawZ + radius) / depthRange;
          const opacity = 0.03 + depth01 * 0.15;
          const width = 0.3 + depth01 * 0.8;
          const [r, g, b] = hexToRgb(node.color || "#C9A04A");
          return (
            <line
              key={`conn-${i}`}
              x1={centerProj.x} y1={centerProj.y} x2={proj.x} y2={proj.y}
              stroke={`rgba(${r}, ${g}, ${b}, ${opacity.toFixed(3)})`}
              strokeWidth={width}
              strokeDasharray="4 4"
            />
          );
        })}

        {/* Electron particles — per-ring color, depth-shaded */}
        {electronData.map(({ proj, depth01, ringIdx }, i) => {
          const [r, g, b] = hexToRgb(RING_COLORS[ringIdx % RING_COLORS.length]);
          const er = 1.5 + depth01 * 2.5;
          const opacity = 0.2 + depth01 * 0.7;
          return (
            <circle
              key={`electron-${i}`}
              cx={proj.x} cy={proj.y} r={er}
              fill={`rgba(${r}, ${g}, ${b}, ${opacity.toFixed(2)})`}
            >
              <animate
                attributeName="r"
                values={`${er};${er + 1.5};${er}`}
                dur="1.5s"
                repeatCount="indefinite"
                begin={`${i * 0.3}s`}
              />
            </circle>
          );
        })}

        {/* Center glow ring — only if centerIcon provided */}
        {showCenter && (
          <>
            <circle
              cx={centerProj.x} cy={centerProj.y} r={radius * 0.06}
              fill="none" stroke="rgba(201, 160, 74, 0.08)" strokeWidth={1}
            >
              <animate attributeName="r" values={`${radius * 0.06};${radius * 0.1};${radius * 0.06}`} dur="3s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.08;0.15;0.08" dur="3s" repeatCount="indefinite" />
            </circle>
            <circle
              cx={centerProj.x} cy={centerProj.y} r={radius * 0.18}
              fill="rgba(201, 160, 74, 0.02)" stroke="none"
            />
          </>
        )}
      </svg>

      {/* Orbiting nodes — depth-sorted */}
      {sorted.map(({ node, proj, rawZ }, sortIdx) => {
        const depth01 = Math.max(0, Math.min(1, (rawZ + radius) / depthRange));
        const s = 0.45 + depth01 * 0.65;
        const o = mounted ? 0.25 + depth01 * 0.75 : 0;
        const isHovered = hoveredNode === node.label;
        const blurAmt = (1 - depth01) * 2.5;
        const nodeColor = node.color || "#C9A04A";
        const [cr, cg, cb] = hexToRgb(nodeColor);

        return (
          <div
            key={node.label}
            className="absolute flex items-center gap-2.5"
            style={{
              left: proj.x,
              top: proj.y,
              transform: `translate(-50%, -50%) scale(${s.toFixed(3)})`,
              opacity: isHovered ? 1 : o,
              zIndex: isHovered ? 300 : sortIdx + 10,
              pointerEvents: "auto",
              filter: isHovered ? "none" : `blur(${blurAmt.toFixed(1)}px)`,
              transition: "filter 150ms ease, opacity 200ms ease",
            }}
            onMouseEnter={() => setHoveredNode(node.label)}
            onMouseLeave={() => setHoveredNode(null)}
          >
            {/* Node circle */}
            <div
              className="flex-shrink-0 flex items-center justify-center w-[72px] h-[72px] md:w-20 md:h-20 rounded-full border transition-all duration-200"
              style={{
                background: isHovered
                  ? `rgba(${cr}, ${cg}, ${cb}, 0.1)`
                  : `rgba(${cr}, ${cg}, ${cb}, ${(0.02 + depth01 * 0.04).toFixed(3)})`,
                borderColor: isHovered
                  ? `rgba(${cr}, ${cg}, ${cb}, 0.35)`
                  : `rgba(${cr}, ${cg}, ${cb}, ${(0.06 + depth01 * 0.1).toFixed(3)})`,
                boxShadow: isHovered
                  ? `0 0 30px rgba(${cr}, ${cg}, ${cb}, 0.2), inset 0 0 20px rgba(${cr}, ${cg}, ${cb}, 0.05)`
                  : `0 4px 12px rgba(0, 0, 0, ${(0.1 + depth01 * 0.15).toFixed(2)})`,
                backdropFilter: "blur(8px)",
                cursor: "pointer",
              }}
            >
              <svg
                width="26" height="26" viewBox="0 0 24 24" fill="none"
                stroke={isHovered ? nodeColor : `rgba(${cr}, ${cg}, ${cb}, ${(0.35 + depth01 * 0.45).toFixed(2)})`}
                strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                style={{ transition: "stroke 200ms ease" }}
              >
                <path d={node.icon} />
              </svg>
            </div>

            {/* Label / Description — description replaces label on hover */}
            <div className="overflow-hidden" style={{ maxWidth: isHovered ? 240 : 160, transition: "max-width 200ms ease" }}>
              {isHovered && node.description ? (
                <p
                  className="text-[11px] md:text-xs leading-snug whitespace-normal font-mono"
                  style={{
                    animation: "descFadeIn 250ms ease-out both",
                  }}
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
                  className="text-[10px] md:text-xs font-mono whitespace-nowrap transition-colors duration-200"
                  style={{
                    color: `rgba(255, 255, 255, ${(0.25 + depth01 * 0.35).toFixed(2)})`,
                  }}
                >
                  {node.label}
                </span>
              )}
            </div>
          </div>
        );
      })}

      {/* Center nucleus — only rendered if centerIcon is provided */}
      {showCenter && centerIcon && (
        <div
          className="absolute flex items-center justify-center pointer-events-none"
          style={{
            left: centerProj.x,
            top: centerProj.y,
            transform: "translate(-50%, -50%)",
            zIndex: 200,
            opacity: mounted ? 1 : 0,
            transition: "opacity 0.6s ease",
          }}
        >
          <div
            className="flex items-center justify-center w-11 h-11 md:w-12 md:h-12 rounded-full bg-[#C9A04A]/10 border border-[#C9A04A]/30"
            style={{ boxShadow: "0 0 30px rgba(201, 160, 74, 0.2), 0 0 60px rgba(201, 160, 74, 0.06)" }}
          >
            <svg
              width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="#C9A04A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
            >
              <path d={centerIcon} />
            </svg>
          </div>
        </div>
      )}

      {/* Drag hint */}
      <div
        className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] font-mono text-white/15 pointer-events-none"
        style={{ opacity: mounted ? 1 : 0, transition: "opacity 0.5s ease" }}
      >
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
