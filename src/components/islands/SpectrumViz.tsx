/**
 * SpectrumViz — Animated SVG spectrum with continuous peak breathing + scanning line.
 * Draws peaks left-to-right on first view, then adds subtle ongoing animation:
 * peaks gently breathe, a scanning line sweeps across, and noise floor shifts.
 */
import { useState, useEffect, useRef, useMemo } from "react";
import { motion, useInView } from "motion/react";

interface Peak {
  position: number;
  height: number;
  width: number;
  color: string;
  label?: string;
}

interface Props {
  peaks?: Peak[];
  title?: string;
  className?: string;
  xLabel?: string;
  yLabel?: string;
}

const DEFAULT_PEAKS: Peak[] = [
  { position: 0.12, height: 0.45, width: 0.02, color: "#4ECDC4", label: "O-H" },
  { position: 0.22, height: 0.85, width: 0.015, color: "#C9A04A", label: "C-H" },
  { position: 0.28, height: 0.6, width: 0.018, color: "#C9A04A" },
  { position: 0.42, height: 0.95, width: 0.02, color: "#FF6B6B", label: "C=O" },
  { position: 0.52, height: 0.3, width: 0.025, color: "#A78BFA" },
  { position: 0.58, height: 0.55, width: 0.015, color: "#A78BFA", label: "C-N" },
  { position: 0.68, height: 0.7, width: 0.02, color: "#34D399", label: "C=C" },
  { position: 0.78, height: 0.4, width: 0.018, color: "#34D399" },
  { position: 0.85, height: 0.5, width: 0.022, color: "#60A5FA", label: "C-O" },
  { position: 0.92, height: 0.35, width: 0.015, color: "#60A5FA" },
];

function gaussian(x: number, center: number, width: number, height: number): number {
  return height * Math.exp(-((x - center) ** 2) / (2 * width ** 2));
}

export default function SpectrumViz({
  peaks = DEFAULT_PEAKS,
  title = "IR Spectrum — Benzaldehyde",
  className = "",
  xLabel = "Wavenumber (cm⁻¹)",
  yLabel = "Absorbance",
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const [progress, setProgress] = useState(0); // 0-1 for initial draw
  const [time, setTime] = useState(0); // continuous time for breathing
  const animRef = useRef(0);
  const idRef = useRef(Math.random().toString(36).slice(2, 8));

  // Track if component is currently visible (not just once)
  const containerRef = useRef<HTMLDivElement>(null);
  const [isCurrentlyVisible, setIsCurrentlyVisible] = useState(false);
  const startTimeRef = useRef<number | null>(null);
  const elapsedRef = useRef(0);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsCurrentlyVisible(entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Initial draw + continuous animation — pauses when off-screen
  useEffect(() => {
    if (!isInView || !isCurrentlyVisible) return;

    const drawDuration = 2000;

    function loop(timestamp: number) {
      if (!startTimeRef.current) startTimeRef.current = timestamp - elapsedRef.current;
      const elapsed = timestamp - startTimeRef.current;
      elapsedRef.current = elapsed;
      const p = Math.min(elapsed / drawDuration, 1);
      setProgress(p);
      setTime(elapsed / 1000);
      // Stop rAF after draw completes — breathing uses CSS animation instead
      if (p < 1) {
        animRef.current = requestAnimationFrame(loop);
      }
    }

    const delay = setTimeout(() => {
      animRef.current = requestAnimationFrame(loop);
    }, startTimeRef.current ? 0 : 200);

    return () => {
      clearTimeout(delay);
      cancelAnimationFrame(animRef.current);
      startTimeRef.current = null;
    };
  }, [isInView, isCurrentlyVisible]);

  const W = 400;
  const H = 160;
  const PADDING = { top: 20, right: 20, bottom: 30, left: 35 };
  const plotW = W - PADDING.left - PADDING.right;
  const plotH = H - PADDING.top - PADDING.bottom;

  // Generate spectrum with breathing peaks
  const { pathData, fillPath } = useMemo(() => {
    const points: string[] = [];
    const fillPoints: string[] = [`M${PADDING.left},${PADDING.top + plotH}`];
    const numPoints = 200;

    for (let i = 0; i <= numPoints; i++) {
      const x = i / numPoints;
      let y = 0;
      for (let pi = 0; pi < peaks.length; pi++) {
        const peak = peaks[pi];
        // Add subtle breathing: each peak oscillates slightly at different phases
        const breathe = progress >= 1
          ? 1 + 0.04 * Math.sin(time * 1.5 + pi * 1.7)
          : 1;
        y += gaussian(x, peak.position, peak.width, peak.height * breathe);
      }
      // Add subtle noise floor
      if (progress >= 1) {
        y += 0.01 * Math.sin(x * 60 + time * 3);
      }
      y = Math.min(y, 1);
      const px = PADDING.left + x * plotW;
      const py = PADDING.top + plotH - y * plotH;
      points.push(`${i === 0 ? "M" : "L"}${px.toFixed(1)},${py.toFixed(1)}`);
      fillPoints.push(`L${px.toFixed(1)},${py.toFixed(1)}`);
    }
    fillPoints.push(`L${PADDING.left + plotW},${PADDING.top + plotH}Z`);

    return { pathData: points.join(" "), fillPath: fillPoints.join(" ") };
  }, [peaks, plotW, plotH, progress, time]);

  // Grid lines
  const gridLines = useMemo(() => {
    const lines: { x1: number; y1: number; x2: number; y2: number }[] = [];
    for (let i = 0; i <= 4; i++) {
      const y = PADDING.top + (plotH / 4) * i;
      lines.push({ x1: PADDING.left, y1: y, x2: PADDING.left + plotW, y2: y });
    }
    return lines;
  }, [plotW, plotH]);

  // Scanning line position (loops after initial draw completes)
  const scanX = progress >= 1
    ? PADDING.left + ((time * 0.15) % 1) * plotW
    : PADDING.left + progress * plotW;

  const uid = idRef.current;

  return (
    <motion.div
      ref={(node: HTMLDivElement | null) => {
        (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
        containerRef.current = node;
      }}
      initial={{ opacity: 0, y: 16 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`rounded-xl border border-[#1a1a1a] overflow-hidden bg-[#0a0a0a] ${className}`}
    >
      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-[#0f0f0f] border-b border-[#1a1a1a]">
        <div className="flex items-center gap-1.5">
          <div className="w-[10px] h-[10px] rounded-full bg-[#FF5F57]" />
          <div className="w-[10px] h-[10px] rounded-full bg-[#FEBC2E]" />
          <div className="w-[10px] h-[10px] rounded-full bg-[#28C840]" />
        </div>
        <span className="ml-2 text-[10px] font-mono text-[#444] select-none">{title}</span>
        {progress >= 1 && (
          <span className="ml-auto flex items-center gap-1.5 text-[10px] font-mono text-[#34D399]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#34D399] animate-pulse" />
            live
          </span>
        )}
      </div>

      {/* Chart */}
      <div className="p-4">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
          {/* Grid */}
          {gridLines.map((line, i) => (
            <line key={i} x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} stroke="#1a1a1a" strokeWidth="0.5" />
          ))}

          {/* Axes */}
          <line x1={PADDING.left} y1={PADDING.top} x2={PADDING.left} y2={PADDING.top + plotH} stroke="#333" strokeWidth="1" />
          <line x1={PADDING.left} y1={PADDING.top + plotH} x2={PADDING.left + plotW} y2={PADDING.top + plotH} stroke="#333" strokeWidth="1" />

          {/* Labels */}
          <text x={PADDING.left + plotW / 2} y={H - 4} textAnchor="middle" fill="#444" fontSize="7" fontFamily="monospace">{xLabel}</text>
          <text x={8} y={PADDING.top + plotH / 2} textAnchor="middle" fill="#444" fontSize="7" fontFamily="monospace" transform={`rotate(-90, 8, ${PADDING.top + plotH / 2})`}>{yLabel}</text>

          <defs>
            <linearGradient id={`specFill-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#C9A04A" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#C9A04A" stopOpacity="0" />
            </linearGradient>
            <clipPath id={`progClip-${uid}`}>
              <rect x={PADDING.left} y={PADDING.top} width={plotW * Math.min(progress, 1)} height={plotH} />
            </clipPath>
            {/* Scanning line glow gradient */}
            <linearGradient id={`scanGlow-${uid}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#C9A04A" stopOpacity="0" />
              <stop offset="50%" stopColor="#C9A04A" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#C9A04A" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Fill area */}
          <path d={fillPath} fill={`url(#specFill-${uid})`} clipPath={`url(#progClip-${uid})`} />

          {/* Spectrum line */}
          <path d={pathData} fill="none" stroke="#C9A04A" strokeWidth="1.5" clipPath={`url(#progClip-${uid})`} strokeLinejoin="round" />

          {/* Scanning line */}
          {progress > 0 && (
            <rect
              x={scanX - 8}
              y={PADDING.top}
              width={16}
              height={plotH}
              fill={`url(#scanGlow-${uid})`}
              opacity={0.6}
            />
          )}

          {/* Peak labels */}
          {peaks.filter(p => p.label).map((peak, i) => {
            const px = PADDING.left + peak.position * plotW;
            const breathe = progress >= 1 ? 1 + 0.04 * Math.sin(time * 1.5 + i * 1.7) : 1;
            const py = PADDING.top + plotH - peak.height * breathe * plotH - 8;
            const peakProgress = Math.max(0, Math.min(1, (progress - peak.position * 0.6) / 0.3));
            return (
              <text key={i} x={px} y={py} textAnchor="middle" fill={peak.color} fontSize="7" fontFamily="monospace" opacity={peakProgress}>
                {peak.label}
              </text>
            );
          })}
        </svg>
      </div>
    </motion.div>
  );
}
