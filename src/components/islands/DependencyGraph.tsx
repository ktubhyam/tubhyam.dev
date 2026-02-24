/**
 * DependencyGraph — Animated node-link diagram showing package dependencies.
 * Nodes pulse and links draw in sequentially. Shows the interconnected nature
 * of the projects.
 */
import { useState, useEffect, useRef } from "react";
import { motion, useInView } from "motion/react";

interface GraphNode {
  id: string;
  x: number;
  y: number;
  color: string;
  size?: number;
}

interface GraphEdge {
  from: string;
  to: string;
}

interface Props {
  title?: string;
  className?: string;
}

const NODES: GraphNode[] = [
  { id: "SpectralFM", x: 200, y: 60, color: "#C9A04A", size: 18 },
  { id: "SpectraKit", x: 80, y: 140, color: "#4ECDC4", size: 14 },
  { id: "VibeScope", x: 320, y: 140, color: "#34D399", size: 14 },
  { id: "PyTorch", x: 120, y: 230, color: "#FF6B6B", size: 11 },
  { id: "RDKit", x: 200, y: 200, color: "#A78BFA", size: 11 },
  { id: "Three.js", x: 340, y: 230, color: "#60A5FA", size: 11 },
  { id: "NumPy", x: 50, y: 230, color: "#F59E0B", size: 10 },
  { id: "POT", x: 260, y: 240, color: "#FB7185", size: 10 },
];

const EDGES: GraphEdge[] = [
  { from: "SpectralFM", to: "SpectraKit" },
  { from: "SpectralFM", to: "PyTorch" },
  { from: "SpectralFM", to: "RDKit" },
  { from: "SpectralFM", to: "POT" },
  { from: "SpectraKit", to: "NumPy" },
  { from: "SpectraKit", to: "RDKit" },
  { from: "VibeScope", to: "Three.js" },
  { from: "VibeScope", to: "SpectralFM" },
  { from: "SpectralFM", to: "VibeScope" },
];

export default function DependencyGraph({
  title = "dependencies — project graph",
  className = "",
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const [visibleEdges, setVisibleEdges] = useState(0);
  const [showNodes, setShowNodes] = useState(false);

  useEffect(() => {
    if (!isInView) return;
    const timer = setTimeout(() => {
      setShowNodes(true);
      let count = 0;
      const interval = setInterval(() => {
        count++;
        setVisibleEdges(count);
        if (count >= EDGES.length) clearInterval(interval);
      }, 200);
      return () => clearInterval(interval);
    }, 300);
    return () => clearTimeout(timer);
  }, [isInView]);

  const nodeMap = new Map(NODES.map((n) => [n.id, n]));

  return (
    <motion.div
      ref={ref}
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
      </div>

      <div className="p-4">
        <svg viewBox="0 0 400 270" className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
          {/* Edges */}
          {EDGES.slice(0, visibleEdges).map((edge, i) => {
            const from = nodeMap.get(edge.from);
            const to = nodeMap.get(edge.to);
            if (!from || !to) return null;
            return (
              <motion.line
                key={i}
                x1={from.x} y1={from.y}
                x2={to.x} y2={to.y}
                stroke="#333"
                strokeWidth="1"
                strokeDasharray="4 3"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.6 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            );
          })}

          {/* Nodes */}
          {NODES.map((node) => {
            const r = node.size ?? 12;
            return (
              <motion.g key={node.id}>
                {/* Glow */}
                <motion.circle
                  cx={node.x} cy={node.y} r={r + 6}
                  fill={node.color}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={showNodes
                    ? { opacity: [0, 0.12, 0], scale: 1 }
                    : { opacity: 0, scale: 0 }}
                  transition={{
                    opacity: { duration: 3, repeat: Infinity, ease: "easeInOut" },
                    scale: { duration: 0.3, type: "spring" },
                  }}
                />
                {/* Circle */}
                <motion.circle
                  cx={node.x} cy={node.y} r={r}
                  fill="#0a0a0a"
                  stroke={node.color}
                  strokeWidth="1.5"
                  initial={{ scale: 0 }}
                  animate={showNodes ? { scale: 1 } : { scale: 0 }}
                  transition={{ duration: 0.3, type: "spring", delay: 0.1 }}
                />
                {/* Label */}
                <motion.text
                  x={node.x} y={node.y + r + 14}
                  textAnchor="middle"
                  fill={node.color}
                  fontSize="8"
                  fontFamily="monospace"
                  initial={{ opacity: 0 }}
                  animate={showNodes ? { opacity: 0.8 } : { opacity: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 }}
                >
                  {node.id}
                </motion.text>
              </motion.g>
            );
          })}
        </svg>
      </div>
    </motion.div>
  );
}
