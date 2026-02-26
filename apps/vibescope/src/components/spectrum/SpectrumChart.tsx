"use client";

import { useMemo, useCallback } from "react";
import { useVibeStore } from "@/lib/store";
import type { MoleculeData } from "@/lib/types";

interface Props {
  molecule: MoleculeData;
  type: "ir" | "raman";
}

const PADDING = { top: 14, right: 20, bottom: 28, left: 50 };
const WIDTH = 800;
const HEIGHT = 180;

export function SpectrumChart({ molecule, type }: Props) {
  const selectedMode = useVibeStore((s) => s.selectedMode);
  const setSelectedMode = useVibeStore((s) => s.setSelectedMode);

  const spectrum = molecule.spectrum;
  if (!spectrum) return null;

  const data = type === "ir" ? spectrum.ir : spectrum.raman;
  const wavenumbers = spectrum.wavenumbers;

  const maxVal = useMemo(() => Math.max(...data, 1), [data]);
  const wnMin = wavenumbers[0];
  const wnMax = wavenumbers[wavenumbers.length - 1];

  const toX = useCallback(
    (wn: number) => {
      const plotW = WIDTH - PADDING.left - PADDING.right;
      return PADDING.left + plotW * (1 - (wn - wnMin) / (wnMax - wnMin));
    },
    [wnMin, wnMax],
  );

  const toY = useCallback(
    (val: number) => {
      const plotH = HEIGHT - PADDING.top - PADDING.bottom;
      return PADDING.top + plotH * (1 - val / maxVal);
    },
    [maxVal],
  );

  const { linePath, areaPath } = useMemo(() => {
    const points = wavenumbers.map((wn, i) => ({
      x: toX(wn),
      y: toY(data[i]),
    }));

    const line = points
      .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
      .join(" ");

    const baseline = HEIGHT - PADDING.bottom;
    const area =
      line +
      ` L${points[points.length - 1].x.toFixed(1)},${baseline}` +
      ` L${points[0].x.toFixed(1)},${baseline} Z`;

    return { linePath: line, areaPath: area };
  }, [wavenumbers, data, toX, toY]);

  const handleClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const svg = e.currentTarget;
      const rect = svg.getBoundingClientRect();
      const svgWidth = rect.width;
      const clickX = e.clientX - rect.left;

      const plotW = svgWidth - PADDING.left - PADDING.right;
      const frac = 1 - (clickX - PADDING.left) / plotW;
      const clickWn = wnMin + frac * (wnMax - wnMin);

      let nearestIdx = 0;
      let nearestDist = Infinity;
      molecule.modes.forEach((mode, i) => {
        const dist = Math.abs(mode.frequency - clickWn);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestIdx = i;
        }
      });

      if (nearestDist < 100) {
        setSelectedMode(nearestIdx);
      }
    },
    [wnMin, wnMax, molecule.modes, setSelectedMode],
  );

  const gridWavenumbers = [1000, 1500, 2000, 2500, 3000, 3500];
  const plotBottom = HEIGHT - PADDING.bottom;

  return (
    <svg
      className="w-full h-full cursor-crosshair"
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      preserveAspectRatio="none"
      onClick={handleClick}
    >
      <defs>
        <linearGradient id="spectrumFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4ECDC4" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#4ECDC4" stopOpacity="0.02" />
        </linearGradient>
        <linearGradient id="selectedGlow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4ECDC4" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#4ECDC4" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Baseline */}
      <line
        x1={PADDING.left}
        x2={WIDTH - PADDING.right}
        y1={plotBottom}
        y2={plotBottom}
        stroke="#333"
        strokeWidth={0.5}
      />

      {/* Grid lines */}
      {gridWavenumbers.map((wn) => (
        <line
          key={wn}
          x1={toX(wn)}
          x2={toX(wn)}
          y1={PADDING.top}
          y2={plotBottom}
          stroke="#1a1a1a"
          strokeWidth={0.5}
        />
      ))}

      {/* X axis labels */}
      {gridWavenumbers.map((wn) => (
        <text
          key={`lbl-${wn}`}
          x={toX(wn)}
          y={HEIGHT - 6}
          textAnchor="middle"
          fill="#555"
          fontSize={9}
          fontFamily="monospace"
        >
          {wn}
        </text>
      ))}

      {/* X axis title */}
      <text
        x={WIDTH / 2}
        y={HEIGHT - 0}
        textAnchor="middle"
        fill="#444"
        fontSize={8}
        fontFamily="monospace"
      >
        Wavenumber (cm⁻¹)
      </text>

      {/* Y axis label */}
      <text
        x={12}
        y={(PADDING.top + plotBottom) / 2}
        textAnchor="middle"
        fill="#555"
        fontSize={9}
        fontFamily="monospace"
        transform={`rotate(-90, 12, ${(PADDING.top + plotBottom) / 2})`}
      >
        {type === "ir" ? "IR Intensity" : "Raman Activity"}
      </text>

      {/* Filled area under curve */}
      <path d={areaPath} fill="url(#spectrumFill)" />

      {/* Spectrum line */}
      <path
        d={linePath}
        fill="none"
        stroke="#4ECDC4"
        strokeWidth={1.5}
        opacity={0.9}
      />

      {/* Mode markers (unselected) */}
      {molecule.modes.map((mode, i) => {
        if (i === selectedMode) return null;
        if (mode.frequency < wnMin || mode.frequency > wnMax) return null;
        const x = toX(mode.frequency);
        return (
          <line
            key={`mode-${i}`}
            x1={x}
            x2={x}
            y1={PADDING.top}
            y2={plotBottom}
            stroke="#555"
            strokeWidth={0.5}
            opacity={0.3}
            strokeDasharray="2,3"
          />
        );
      })}

      {/* Selected mode marker with glow */}
      {molecule.modes[selectedMode] &&
        molecule.modes[selectedMode].frequency >= wnMin &&
        molecule.modes[selectedMode].frequency <= wnMax && (
          <>
            {/* Glow band */}
            <rect
              x={toX(molecule.modes[selectedMode].frequency) - 8}
              y={PADDING.top}
              width={16}
              height={plotBottom - PADDING.top}
              fill="url(#selectedGlow)"
            />
            {/* Line */}
            <line
              x1={toX(molecule.modes[selectedMode].frequency)}
              x2={toX(molecule.modes[selectedMode].frequency)}
              y1={PADDING.top}
              y2={plotBottom}
              stroke="#4ECDC4"
              strokeWidth={1.5}
              opacity={0.9}
            />
            {/* Label */}
            <text
              x={toX(molecule.modes[selectedMode].frequency)}
              y={PADDING.top - 3}
              textAnchor="middle"
              fill="#4ECDC4"
              fontSize={10}
              fontFamily="monospace"
              fontWeight="bold"
            >
              {molecule.modes[selectedMode].frequency.toFixed(0)} cm⁻¹
            </text>
          </>
        )}
    </svg>
  );
}
