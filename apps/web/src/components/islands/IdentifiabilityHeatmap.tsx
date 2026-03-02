import { useRef, useEffect, useState } from "react";

const RATIO = 56 / 100;
const GREEN = "#34D399";
const AMBER = "#C9A04A";
const RED = "#F87171";

// 8 point groups × 13 N values (N=3..15)
// Rows: C1, Cs, C2v, C3v, C2h, D2h, D6h, Oh
// R values: C1 always 1.0 (no symmetry), Oh ~0.3-0.5 (high symmetry)
// Small N = fewer modes, so R is also slightly lower for small N due to fewer independent measurements
const POINT_GROUPS = ["C1", "Cs", "C2v", "C3v", "C2h", "D2h", "D6h", "Oh"];
const N_VALUES = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

// Plausible R(G,N) values — internally consistent:
// - C1: always 1.0 (no symmetry, all modes observable)
// - Cs: always 1.0 (only mirror plane, both A' and A'' active in IR+Raman)
// - C2v: 1.0 (all modes IR or Raman active)
// - C3v: 0.95–1.0 (very few silent modes possible)
// - C2h: ~0.85–0.95 (inversion creates some silent modes for larger molecules)
// - D2h: ~0.75–0.88 (multiple symmetry elements, some modes silent)
// - D6h: ~0.60–0.75 (high symmetry, like benzene R=0.85 at N=12, lower for larger)
// - Oh: ~0.30–0.55 (octahedral, many silent modes like SF6, cubane)
const R_VALUES: number[][] = [
  // C1
  [1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00],
  // Cs
  [1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00],
  // C2v
  [1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00],
  // C3v
  [1.00, 1.00, 0.98, 0.97, 0.97, 0.96, 0.95, 0.94, 0.94, 0.93, 0.93, 0.92, 0.91],
  // C2h
  [0.93, 0.90, 0.88, 0.87, 0.86, 0.85, 0.85, 0.84, 0.83, 0.83, 0.82, 0.81, 0.80],
  // D2h
  [0.85, 0.82, 0.80, 0.79, 0.78, 0.77, 0.76, 0.75, 0.74, 0.73, 0.73, 0.72, 0.71],
  // D6h
  [0.75, 0.73, 0.71, 0.70, 0.69, 0.68, 0.67, 0.66, 0.65, 0.64, 0.63, 0.62, 0.60],
  // Oh
  [0.52, 0.49, 0.47, 0.45, 0.44, 0.43, 0.42, 0.41, 0.40, 0.39, 0.38, 0.36, 0.34],
];

// Example molecules for tooltip
const EXAMPLES: Record<string, string> = {
  "C1-3": "CHFClBr",    "C1-6": "ethanol",      "C1-9": "alanine",
  "Cs-4": "H2CO",       "Cs-6": "formic acid",   "Cs-9": "toluene",
  "C2v-3": "H2O",       "C2v-5": "SO2",          "C2v-8": "H2O3",
  "C3v-4": "NH3",       "C3v-7": "PCl3",
  "C2h-6": "1,2-C2H2Cl2", "C2h-10": "azobenzene fragment",
  "D2h-6": "allene",    "D2h-10": "naphthalene",
  "D6h-12": "benzene",  "D6h-14": "coronene fragment",
  "Oh-7": "SF6",        "Oh-9": "cubane fragment",
};

function rToColor(r: number): string {
  if (r >= 0.95) return GREEN;
  if (r >= 0.80) {
    // Interpolate green → amber
    const t = (r - 0.80) / 0.15;
    const g = [52, 211, 153];
    const a = [201, 160, 74];
    const mix = (c1: number, c2: number) => Math.round(c1 * t + c2 * (1 - t));
    return `rgb(${mix(g[0], a[0])},${mix(g[1], a[1])},${mix(g[2], a[2])})`;
  }
  if (r >= 0.60) {
    // Interpolate amber → red
    const t = (r - 0.60) / 0.20;
    const a = [201, 160, 74];
    const rd = [248, 113, 113];
    const mix = (c1: number, c2: number) => Math.round(c1 * t + c2 * (1 - t));
    return `rgb(${mix(a[0], rd[0])},${mix(a[1], rd[1])},${mix(a[2], rd[2])})`;
  }
  return RED;
}

export default function IdentifiabilityHeatmap() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hovered, setHovered] = useState<{ group: string; n: number; r: number; ex: string } | null>(null);
  const hoveredRef = useRef(hovered);
  useEffect(() => { hoveredRef.current = hovered; }, [hovered]);

  // Animate cells filling in
  const filledRef = useRef(0);
  const totalCells = POINT_GROUPS.length * N_VALUES.length;

  useEffect(() => {
    const wrap = wrapRef.current!;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let raf = 0, paused = false, cssW = 0, cssH = 0;
    let lastFillTime = 0;

    const FILL_INTERVAL = 30; // ms per cell

    function resize() {
      const r = wrap.getBoundingClientRect();
      cssW = r.width || 600; cssH = Math.round(cssW * RATIO);
      const dpr = devicePixelRatio || 1;
      canvas.width = cssW * dpr; canvas.height = cssH * dpr;
      canvas.style.width = cssW + "px"; canvas.style.height = cssH + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function draw(now: number) {
      if (!paused) {
        // Increment filled cells
        if (filledRef.current < totalCells && now - lastFillTime > FILL_INTERVAL) {
          filledRef.current = Math.min(totalCells, filledRef.current + 1);
          lastFillTime = now;
        }

        ctx.clearRect(0, 0, cssW, cssH);
        ctx.fillStyle = "#09090b";
        ctx.fillRect(0, 0, cssW, cssH);

        const nRows = POINT_GROUPS.length;
        const nCols = N_VALUES.length;

        const legendW = 28;
        const labelLeft = 36;
        const labelTop = 20;
        const gridX = labelLeft;
        const gridY = labelTop;
        const availW = cssW - labelLeft - legendW - 16;
        const availH = cssH - labelTop - 20;
        const cellW = availW / nCols;
        const cellH = availH / nRows;
        const h = hoveredRef.current;

        // Draw column headers (N values)
        ctx.fillStyle = "#52525b";
        ctx.font = `${Math.max(7, Math.floor(cellW * 0.45))}px monospace`;
        ctx.textAlign = "center";
        for (let c = 0; c < nCols; c++) {
          ctx.fillText(
            String(N_VALUES[c]),
            gridX + c * cellW + cellW / 2,
            gridY - 6
          );
        }

        // Draw row headers (point groups)
        ctx.textAlign = "right";
        for (let r = 0; r < nRows; r++) {
          ctx.fillStyle = "#71717a";
          ctx.font = `${Math.max(7, Math.floor(cellH * 0.35))}px monospace`;
          ctx.fillText(
            POINT_GROUPS[r],
            gridX - 4,
            gridY + r * cellH + cellH * 0.62
          );
        }

        // Draw cells
        for (let r = 0; r < nRows; r++) {
          for (let c = 0; c < nCols; c++) {
            const cellIdx = r * nCols + c;
            const rVal = R_VALUES[r][c];
            const cx = gridX + c * cellW;
            const cy = gridY + r * cellH;
            const isHov = h && h.group === POINT_GROUPS[r] && h.n === N_VALUES[c];
            const isFilled = cellIdx < filledRef.current;
            const isNew = cellIdx === filledRef.current - 1;

            if (!isFilled) {
              // Unfilled cell — faint placeholder
              ctx.fillStyle = "#18181b";
              ctx.fillRect(cx + 1, cy + 1, cellW - 2, cellH - 2);
              continue;
            }

            const color = rToColor(rVal);
            ctx.fillStyle = color + (isHov ? "cc" : "55");
            ctx.fillRect(cx + 1, cy + 1, cellW - 2, cellH - 2);

            // Glow on newly-filled cell
            if (isNew) {
              ctx.fillStyle = color + "aa";
              ctx.fillRect(cx + 1, cy + 1, cellW - 2, cellH - 2);
            }

            // Border
            ctx.strokeStyle = isHov ? color : "#27272a";
            ctx.lineWidth = isHov ? 1.5 : 0.5;
            ctx.strokeRect(cx + 1, cy + 1, cellW - 2, cellH - 2);

            // R value text if cell is large enough
            if (cellW > 28 && cellH > 14) {
              ctx.fillStyle = color;
              ctx.font = `${Math.max(6, Math.floor(cellH * 0.3))}px monospace`;
              ctx.textAlign = "center";
              ctx.fillText(rVal.toFixed(2), cx + cellW / 2, cy + cellH * 0.65);
            }
          }
        }

        // Legend bar (right side)
        const legX = cssW - legendW + 4;
        const legY = gridY;
        const legH = availH;
        const grad = ctx.createLinearGradient(0, legY, 0, legY + legH);
        grad.addColorStop(0, GREEN);
        grad.addColorStop(0.3, AMBER);
        grad.addColorStop(1, RED);
        ctx.fillStyle = grad;
        ctx.fillRect(legX, legY, 10, legH);

        ctx.fillStyle = "#52525b";
        ctx.font = "8px monospace";
        ctx.textAlign = "left";
        ctx.fillText("1.0", legX + 13, legY + 6);
        ctx.fillText("0.5", legX + 13, legY + legH / 2 + 4);
        ctx.fillText("0.0", legX + 13, legY + legH);

        // Hover tooltip
        if (h) {
          const tipW = 160; const tipH = 52;
          let tipX = gridX + (N_VALUES.indexOf(h.n)) * cellW + cellW / 2 - tipW / 2;
          let tipY = gridY + (POINT_GROUPS.indexOf(h.group)) * cellH - tipH - 6;
          tipX = Math.max(4, Math.min(cssW - tipW - 4, tipX));
          tipY = Math.max(4, tipY);

          ctx.fillStyle = "#18181b";
          ctx.strokeStyle = rToColor(h.r);
          ctx.lineWidth = 1;
          if ((ctx as any).roundRect) (ctx as any).roundRect(tipX, tipY, tipW, tipH, 4);
          else ctx.rect(tipX, tipY, tipW, tipH);
          ctx.fill(); ctx.stroke();

          ctx.fillStyle = "#e4e4e7";
          ctx.font = "bold 9px monospace";
          ctx.textAlign = "left";
          ctx.fillText(`${h.group}, N=${h.n}`, tipX + 7, tipY + 13);
          ctx.fillStyle = rToColor(h.r);
          ctx.fillText(`R = ${h.r.toFixed(3)}`, tipX + 7, tipY + 26);
          if (h.ex) {
            ctx.fillStyle = "#71717a";
            ctx.font = "8px monospace";
            ctx.fillText(`e.g. ${h.ex}`, tipX + 7, tipY + 39);
          }
        }

        // Axis labels
        ctx.fillStyle = "#52525b";
        ctx.font = "9px monospace";
        ctx.textAlign = "center";
        ctx.fillText("atoms N", gridX + availW / 2, cssH - 4);
      }
      raf = requestAnimationFrame(draw);
    }

    // Mouse move for hover
    function onMouseMove(e: MouseEvent) {
      const rect = canvas.getBoundingClientRect();
      const mx = (e.clientX - rect.left) * (cssW / rect.width);
      const my = (e.clientY - rect.top) * (cssH / rect.height);

      const labelLeft = 36;
      const labelTop = 20;
      const nCols = N_VALUES.length;
      const nRows = POINT_GROUPS.length;
      const availW = cssW - labelLeft - 28 - 16;
      const availH = cssH - labelTop - 20;
      const cellW = availW / nCols;
      const cellH = availH / nRows;

      const col = Math.floor((mx - labelLeft) / cellW);
      const row = Math.floor((my - labelTop) / cellH);

      if (col >= 0 && col < nCols && row >= 0 && row < nRows) {
        const n = N_VALUES[col];
        const group = POINT_GROUPS[row];
        const r = R_VALUES[row][col];
        const ex = EXAMPLES[`${group}-${n}`] ?? "";
        setHovered({ group, n, r, ex });
      } else {
        setHovered(null);
      }
    }

    function onMouseLeave() { setHovered(null); }

    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseleave", onMouseLeave);

    const visObs = new IntersectionObserver(([e]) => {
      paused = !e.isIntersecting;
      if (!paused && filledRef.current === 0) {
        filledRef.current = 0;
      }
    });
    visObs.observe(wrap);
    const resObs = new ResizeObserver(resize);
    resObs.observe(wrap);
    resize();
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      visObs.disconnect();
      resObs.disconnect();
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseleave", onMouseLeave);
    };
  }, []);

  return (
    <div className="my-8 rounded-lg border border-zinc-800 bg-zinc-950 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800">
        <span className="text-xs font-mono text-zinc-400">R(G,N) heatmap — information completeness by symmetry</span>
      </div>
      <div ref={wrapRef} className="relative overflow-hidden" style={{ aspectRatio: "100/56" }}>
        <canvas ref={canvasRef} className="absolute top-0 left-0" style={{ cursor: "crosshair" }} />
      </div>
      <div className="px-4 py-2 border-t border-zinc-800 text-xs font-mono text-zinc-500">
        Hover cells for molecule examples. Green = R≈1.0 (all modes observable). Red = many silent modes. Fills left-to-right on scroll entry.
      </div>
    </div>
  );
}
