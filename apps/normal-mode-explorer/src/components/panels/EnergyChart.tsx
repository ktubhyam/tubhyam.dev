"use client";

import { useMemo } from "react";
import { useExplorerStore } from "@/lib/store";
import { TerminalPanel } from "../ui/TerminalPanel";

export function EnergyChart() {
  const molecule = useExplorerStore((s) => s.molecule);
  const modeA = useExplorerStore((s) => s.modeA);
  const modeB = useExplorerStore((s) => s.modeB);
  const setModeA = useExplorerStore((s) => s.setModeA);

  const maxFreq = useMemo(
    () => (molecule ? Math.max(...molecule.modes.map((m) => m.frequency)) : 0),
    [molecule],
  );

  if (!molecule || molecule.modes.length === 0) return null;
  const barHeight = 16;
  const gap = 3;
  const svgHeight = molecule.modes.length * (barHeight + gap) + 8;
  const labelWidth = 55;
  const chartWidth = 220;
  const svgWidth = labelWidth + chartWidth + 60;

  return (
    <TerminalPanel title="Energy Distribution">
      <div className="p-2">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full font-mono"
          preserveAspectRatio="xMidYMid meet"
        >
          {molecule.modes.map((mode, i) => {
            const isA = i === modeA;
            const isB = i === modeB;
            const y = i * (barHeight + gap) + 4;
            const barW = (mode.frequency / maxFreq) * chartWidth;

            const fill = isA
              ? "var(--cyan)"
              : isB
                ? "var(--accent)"
                : "var(--border-bright)";
            const opacity = isA || isB ? 0.8 : 0.35;

            return (
              <g
                key={i}
                onClick={() => setModeA(i)}
                style={{ cursor: "pointer" }}
              >
                {/* Frequency label */}
                <text
                  x={labelWidth - 4}
                  y={y + barHeight / 2 + 1}
                  textAnchor="end"
                  fill={isA ? "var(--cyan)" : isB ? "var(--accent)" : "var(--foreground)"}
                  opacity={isA || isB ? 1 : 0.35}
                  fontSize={9}
                >
                  {mode.frequency.toFixed(0)}
                </text>

                {/* Bar */}
                <rect
                  x={labelWidth}
                  y={y}
                  width={Math.max(barW, 2)}
                  height={barHeight}
                  rx={2}
                  fill={fill}
                  opacity={opacity}
                />

                {/* Mode number */}
                <text
                  x={labelWidth + Math.max(barW, 2) + 6}
                  y={y + barHeight / 2 + 1}
                  textAnchor="start"
                  fill="var(--foreground)"
                  opacity={0.25}
                  fontSize={8}
                >
                  ν{i + 1}
                </text>

                {/* A/B label */}
                {isA && (
                  <text
                    x={labelWidth + Math.max(barW, 2) + 28}
                    y={y + barHeight / 2 + 1}
                    textAnchor="start"
                    fill="var(--cyan)"
                    fontSize={8}
                    fontWeight="bold"
                  >
                    A
                  </text>
                )}
                {isB && (
                  <text
                    x={labelWidth + Math.max(barW, 2) + 28}
                    y={y + barHeight / 2 + 1}
                    textAnchor="start"
                    fill="var(--accent)"
                    fontSize={8}
                    fontWeight="bold"
                  >
                    B
                  </text>
                )}

                {/* Hover region */}
                <rect
                  x={0}
                  y={y - 1}
                  width={labelWidth + chartWidth + 60}
                  height={barHeight + 2}
                  fill="transparent"
                />
              </g>
            );
          })}
        </svg>
      </div>
    </TerminalPanel>
  );
}
