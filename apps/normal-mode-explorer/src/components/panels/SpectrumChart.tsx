"use client";

import { useMemo } from "react";
import { useExplorerStore } from "@/lib/store";
import { TerminalPanel } from "../ui/TerminalPanel";

export function SpectrumChart() {
  const molecule = useExplorerStore((s) => s.molecule);
  const modeA = useExplorerStore((s) => s.modeA);
  const modeB = useExplorerStore((s) => s.modeB);
  const setModeA = useExplorerStore((s) => s.setModeA);

  const spectrumType = useExplorerStore((s) => s.spectrumType);
  const setSpectrumType = useExplorerStore((s) => s.setSpectrumType);

  const chartData = useMemo(() => {
    if (!molecule?.spectrum) return null;

    const { wavenumbers } = molecule.spectrum;
    const values = spectrumType === "ir" ? molecule.spectrum.ir : molecule.spectrum.raman;
    if (!wavenumbers || !values) return null;

    const maxVal = Math.max(...values);
    const minWn = wavenumbers[0];
    const maxWn = wavenumbers[wavenumbers.length - 1];

    return { wavenumbers, values, maxVal, minWn, maxWn };
  }, [molecule, spectrumType]);

  if (!molecule || !chartData) return null;

  const { wavenumbers, values, maxVal, minWn, maxWn } = chartData;

  const W = 600;
  const H = 120;
  const padL = 40;
  const padR = 10;
  const padT = 8;
  const padB = 22;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const xScale = (wn: number) => padL + ((wn - minWn) / (maxWn - minWn)) * plotW;
  const yScale = (v: number) => padT + plotH - (v / maxVal) * plotH;

  // Build path
  const pathD = wavenumbers
    .map((wn, i) => `${i === 0 ? "M" : "L"}${xScale(wn).toFixed(1)},${yScale(values[i]).toFixed(1)}`)
    .join(" ");

  // Fill area
  const fillD = `${pathD} L${xScale(wavenumbers[wavenumbers.length - 1]).toFixed(1)},${padT + plotH} L${xScale(wavenumbers[0]).toFixed(1)},${padT + plotH} Z`;

  // Grid lines at 1000, 2000, 3000, 4000
  const gridWns = [1000, 1500, 2000, 2500, 3000, 3500, 4000].filter(
    (wn) => wn >= minWn && wn <= maxWn,
  );

  // Find nearest mode for click — scale click position to viewBox coordinates
  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const clickWn = minWn + ((x - padL) / plotW) * (maxWn - minWn);

    let bestIdx = 0;
    let bestDist = Infinity;
    molecule.modes.forEach((mode, i) => {
      const dist = Math.abs(mode.frequency - clickWn);
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = i;
      }
    });
    setModeA(bestIdx);
  };

  const specColor = spectrumType === "ir" ? "var(--ir-color)" : "var(--raman-color)";

  return (
    <TerminalPanel title="Spectrum">
      <div className="px-2 pt-1 pb-0">
        {/* IR / Raman tabs */}
        <div className="flex gap-1 mb-1">
          {(["ir", "raman"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setSpectrumType(t)}
              className={`text-[10px] font-mono px-2 py-0.5 rounded transition-colors ${
                spectrumType === t
                  ? t === "ir"
                    ? "bg-ir/15 text-ir"
                    : "bg-raman/15 text-raman"
                  : "text-foreground/30 hover:text-foreground/50"
              }`}
            >
              {t.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="px-1 pb-2">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full font-mono cursor-crosshair"
          preserveAspectRatio="xMidYMid meet"
          onClick={handleClick}
        >
          {/* Grid */}
          {gridWns.map((wn) => (
            <g key={wn}>
              <line
                x1={xScale(wn)}
                y1={padT}
                x2={xScale(wn)}
                y2={padT + plotH}
                stroke="var(--border)"
                strokeWidth={0.5}
              />
              <text
                x={xScale(wn)}
                y={H - 4}
                textAnchor="middle"
                fill="var(--foreground)"
                opacity={0.2}
                fontSize={8}
              >
                {wn}
              </text>
            </g>
          ))}

          {/* Fill */}
          <path d={fillD} fill={specColor} opacity={0.1} />

          {/* Line */}
          <path d={pathD} fill="none" stroke={specColor} strokeWidth={1.2} opacity={0.7} />

          {/* Mode markers */}
          {molecule.modes.map((mode, i) => {
            const isA = i === modeA;
            const isB = i === modeB;
            const x = xScale(mode.frequency);
            if (x < padL || x > padL + plotW) return null;

            return (
              <g key={i}>
                <line
                  x1={x}
                  y1={padT}
                  x2={x}
                  y2={padT + plotH}
                  stroke={isA ? "var(--cyan)" : isB ? "var(--accent)" : "var(--foreground)"}
                  strokeWidth={isA || isB ? 1.5 : 0.5}
                  opacity={isA || isB ? 0.8 : 0.15}
                  strokeDasharray={isA || isB ? "none" : "2,3"}
                />
                {(isA || isB) && (
                  <text
                    x={x}
                    y={padT - 2}
                    textAnchor="middle"
                    fill={isA ? "var(--cyan)" : "var(--accent)"}
                    fontSize={8}
                    fontWeight="bold"
                  >
                    {isA ? "A" : "B"}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </TerminalPanel>
  );
}
