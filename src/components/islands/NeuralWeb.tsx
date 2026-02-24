/**
 * NeuralWeb — Interactive neural network / mind map visualization.
 * Nodes with icons connected by animated pathways that pulse with energy.
 * Nodes float gently. Connections draw in on scroll, then pulse continuously.
 */
import { useRef, useEffect, useState, useCallback } from "react";
import { motion, useInView } from "motion/react";

interface Node {
  label: string;
  icon: string; // SVG path data
  x: number; // percentage position
  y: number;
}

interface Props {
  nodes: Node[];
  className?: string;
}

// Connections: center radiates to all + outer ring loop + select diagonals
function getConnections(count: number): [number, number][] {
  if (count <= 1) return [];
  const edges: [number, number][] = [];
  // Center (0) → all outer nodes
  for (let i = 1; i < count; i++) {
    edges.push([0, i]);
  }
  // Outer ring: adjacent nodes form a closed loop
  for (let i = 1; i < count - 1; i++) {
    edges.push([i, i + 1]);
  }
  if (count > 2) edges.push([count - 1, 1]); // close the ring
  return edges;
}

export default function NeuralWeb({ nodes, className = "" }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });
  const connections = getConnections(nodes.length);

  const updateDimensions = useCallback(() => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setDimensions({ width: rect.width, height: rect.height });
    }
  }, []);

  useEffect(() => {
    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, [updateDimensions]);

  return (
    <div ref={ref} className={`relative w-full h-[400px] md:h-[450px] ${className}`}>
      {/* SVG connections layer */}
      <svg
        ref={svgRef}
        className="absolute inset-0 w-full h-full"
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="pathGlow" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(201, 160, 74, 0.0)" />
            <stop offset="50%" stopColor="rgba(201, 160, 74, 0.4)" />
            <stop offset="100%" stopColor="rgba(201, 160, 74, 0.0)" />
          </linearGradient>
        </defs>

        {connections.map(([from, to], i) => {
          const x1 = (nodes[from].x / 100) * dimensions.width;
          const y1 = (nodes[from].y / 100) * dimensions.height;
          const x2 = (nodes[to].x / 100) * dimensions.width;
          const y2 = (nodes[to].y / 100) * dimensions.height;
          const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

          return (
            <g key={`conn-${i}`}>
              {/* Base line */}
              <motion.line
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke="rgba(201, 160, 74, 0.12)"
                strokeWidth={1}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={isInView ? { pathLength: 1, opacity: 1 } : {}}
                transition={{ duration: 1, delay: 0.3 + i * 0.12, ease: "easeOut" }}
              />
              {/* Animated pulse traveling along the path */}
              {isInView && (
                <circle r="2" fill="rgba(201, 160, 74, 0.6)">
                  <animateMotion
                    dur={`${2 + i * 0.4}s`}
                    repeatCount="indefinite"
                    begin={`${1.5 + i * 0.2}s`}
                    path={`M${x1},${y1} L${x2},${y2}`}
                  />
                  <animate
                    attributeName="opacity"
                    values="0;0.8;0"
                    dur={`${2 + i * 0.4}s`}
                    repeatCount="indefinite"
                    begin={`${1.5 + i * 0.2}s`}
                  />
                </circle>
              )}
            </g>
          );
        })}
      </svg>

      {/* Nodes */}
      {nodes.map((node, i) => (
        <motion.div
          key={i}
          className="absolute flex flex-col items-center gap-2"
          style={{
            left: `${node.x}%`,
            top: `${node.y}%`,
            transform: "translate(-50%, -50%)",
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={isInView ? { scale: 1, opacity: 1 } : {}}
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 15,
            delay: i * 0.15,
          }}
        >
          {/* Node circle with icon */}
          <motion.div
            className={`relative flex items-center justify-center rounded-full border ${
              i === 0
                ? "w-16 h-16 md:w-20 md:h-20 bg-[#C9A04A]/10 border-[#C9A04A]/30"
                : "w-12 h-12 md:w-14 md:h-14 bg-white/[0.04] border-white/10"
            }`}
            animate={isInView ? {
              y: [0, -4, 0, 3, 0],
            } : {}}
            transition={{
              duration: 4 + i * 0.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.3,
            }}
            whileHover={{
              scale: 1.15,
              borderColor: "rgba(201, 160, 74, 0.5)",
              boxShadow: "0 0 20px rgba(201, 160, 74, 0.2)",
            }}
          >
            <svg
              width={i === 0 ? 24 : 18}
              height={i === 0 ? 24 : 18}
              viewBox="0 0 24 24"
              fill="none"
              stroke={i === 0 ? "#C9A04A" : "#888"}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d={node.icon} />
            </svg>
          </motion.div>

          {/* Label */}
          <motion.span
            className={`text-[10px] md:text-xs font-mono whitespace-nowrap ${
              i === 0 ? "text-[#C9A04A]/80" : "text-white/40"
            }`}
            initial={{ opacity: 0, y: 5 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.5 + i * 0.15, duration: 0.4 }}
          >
            {node.label}
          </motion.span>
        </motion.div>
      ))}
    </div>
  );
}
