/**
 * StatusBoard — A CI/CD-style project status dashboard.
 * Shows project health with pulsing status indicators, version numbers,
 * and last updated timestamps. Animates in row by row.
 */
import { useState, useEffect, useRef } from "react";
import { motion, useInView } from "motion/react";

interface StatusRow {
  name: string;
  status: "passing" | "building" | "failing";
  version: string;
  coverage?: number;
  tests?: number;
}

interface Props {
  rows?: StatusRow[];
  title?: string;
  className?: string;
}

const DEFAULT_ROWS: StatusRow[] = [
  { name: "spectrakit", status: "passing", version: "v0.3.1", coverage: 94, tests: 142 },
  { name: "spectral-fm", status: "building", version: "v0.1.0", coverage: 67, tests: 58 },
  { name: "vibescope", status: "passing", version: "v1.2.0", coverage: 88, tests: 95 },
  { name: "modal-theory", status: "passing", version: "v0.5.2", coverage: 91, tests: 73 },
  { name: "qm9s-loader", status: "passing", version: "v2.0.0", coverage: 96, tests: 201 },
];

const STATUS_CONFIG = {
  passing: { color: "#34D399", label: "passing", glow: "rgba(52, 211, 153, 0.3)" },
  building: { color: "#C9A04A", label: "building", glow: "rgba(201, 160, 74, 0.3)" },
  failing: { color: "#FF6B6B", label: "failing", glow: "rgba(255, 107, 107, 0.3)" },
};

export default function StatusBoard({
  rows = DEFAULT_ROWS,
  title = "ci/cd — project health",
  className = "",
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const [visibleRows, setVisibleRows] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    let current = 0;
    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        current++;
        setVisibleRows(current);
        if (current >= rows.length) clearInterval(interval);
      }, 200);
      return () => clearInterval(interval);
    }, 400);
    return () => clearTimeout(timer);
  }, [isInView, rows.length]);

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

      {/* Table */}
      <div className="p-3">
        {/* Header */}
        <div className="grid grid-cols-[1fr_80px_60px_60px_50px] gap-2 px-3 py-1.5 text-[9px] font-mono text-[#555] uppercase tracking-wider">
          <span>Package</span>
          <span>Status</span>
          <span>Version</span>
          <span>Coverage</span>
          <span>Tests</span>
        </div>

        {/* Rows */}
        {rows.slice(0, visibleRows).map((row, i) => {
          const cfg = STATUS_CONFIG[row.status];
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="grid grid-cols-[1fr_80px_60px_60px_50px] gap-2 px-3 py-2 rounded-lg hover:bg-white/[0.02] transition-colors"
            >
              <span className="text-[11px] font-mono text-[#e0e0e0] flex items-center gap-2">
                <span
                  className={`w-[6px] h-[6px] rounded-full flex-shrink-0 ${row.status === "building" ? "animate-pulse" : ""}`}
                  style={{
                    backgroundColor: cfg.color,
                    boxShadow: `0 0 6px ${cfg.glow}`,
                  }}
                />
                {row.name}
              </span>
              <span className="text-[10px] font-mono" style={{ color: cfg.color }}>
                {cfg.label}
              </span>
              <span className="text-[10px] font-mono text-[#888]">
                {row.version}
              </span>
              <span className="text-[10px] font-mono">
                {row.coverage != null && (
                  <span className="flex items-center gap-1.5">
                    <span className="w-8 h-1 rounded-full bg-[#1a1a1a] overflow-hidden">
                      <motion.span
                        className="block h-full rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${row.coverage}%` }}
                        transition={{ duration: 0.8, delay: i * 0.1 }}
                        style={{ backgroundColor: row.coverage > 85 ? "#34D399" : row.coverage > 60 ? "#C9A04A" : "#FF6B6B" }}
                      />
                    </span>
                    <span style={{ color: row.coverage > 85 ? "#34D399" : row.coverage > 60 ? "#C9A04A" : "#FF6B6B" }}>
                      {row.coverage}%
                    </span>
                  </span>
                )}
              </span>
              <span className="text-[10px] font-mono text-[#4ECDC4]">
                {row.tests}
              </span>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
