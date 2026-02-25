/**
 * SpectraviewDemo — Interactive spectral viewer demo using the spectraview library.
 * Shows sample IR spectra with toggle controls, peak detection, and theme switching.
 */
import { useState, useRef, useMemo, useCallback } from "react";
import { motion, useInView } from "motion/react";
import { SpectraView, usePeakPicking } from "spectraview";
import type { Spectrum, Peak, Region } from "spectraview";
import {
  createEthanolSpectrum,
  createAcetoneSpectrum,
  createIsopropanolSpectrum,
} from "./spectraview-demo/sample-data";

interface Props {
  className?: string;
}

/** Sample spectra keyed by ID. */
const SAMPLE_SPECTRA: Record<string, () => Spectrum> = {
  ethanol: createEthanolSpectrum,
  acetone: createAcetoneSpectrum,
  isopropanol: createIsopropanolSpectrum,
};

/** Region highlights for common functional groups. */
const REGIONS: Region[] = [
  { xStart: 1650, xEnd: 1780, label: "C=O stretch" },
  { xStart: 2800, xEnd: 3100, label: "C-H stretch", color: "rgba(78, 205, 196, 0.15)" },
  { xStart: 3200, xEnd: 3600, label: "O-H stretch", color: "rgba(201, 160, 74, 0.15)" },
];

export default function SpectraviewDemo({ className = "" }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  // State
  const [activeIds, setActiveIds] = useState<Set<string>>(new Set(["ethanol"]));
  const [showPeaks, setShowPeaks] = useState(false);
  const [showRegions, setShowRegions] = useState(false);
  const [prominence, setProminence] = useState(0.1);
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  // Build active spectra
  const spectra = useMemo(() => {
    return Array.from(activeIds)
      .filter((id) => SAMPLE_SPECTRA[id])
      .map((id) => SAMPLE_SPECTRA[id]());
  }, [activeIds]);

  // Peak detection
  const peaks = usePeakPicking(spectra, {
    enabled: showPeaks,
    prominence,
  });

  // Toggle a sample spectrum
  const toggleSpectrum = useCallback((id: string) => {
    setActiveIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`rounded-xl border border-border overflow-hidden bg-bg-secondary ${className}`}
    >
      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-surface border-b border-border">
        <div className="flex items-center gap-1.5">
          <div className="w-[10px] h-[10px] rounded-full bg-[#FF5F57]" />
          <div className="w-[10px] h-[10px] rounded-full bg-[#FEBC2E]" />
          <div className="w-[10px] h-[10px] rounded-full bg-[#28C840]" />
        </div>
        <span className="ml-2 text-[10px] font-mono text-text-muted/60 select-none">
          spectraview_demo.py
        </span>
        <span className="ml-auto flex items-center gap-1.5 text-[10px] font-mono text-[#34D399]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#34D399] animate-pulse" />
          interactive
        </span>
      </div>

      {/* Controls */}
      <div className="px-4 pt-3 pb-2 border-b border-border">
        <div className="flex flex-wrap items-center gap-2">
          {/* Sample toggles */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono text-text-muted uppercase tracking-wider">
              Samples
            </span>
            {Object.keys(SAMPLE_SPECTRA).map((id) => (
              <button
                key={id}
                onClick={() => toggleSpectrum(id)}
                className={`px-2.5 py-1 text-[11px] font-mono rounded-md border transition-all duration-150 ${
                  activeIds.has(id)
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-border text-text-muted hover:border-border hover:text-text-secondary"
                }`}
              >
                {id}
              </button>
            ))}
          </div>

          <div className="w-px h-5 bg-border hidden sm:block" />

          {/* Feature toggles */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowPeaks(!showPeaks)}
              className={`px-2.5 py-1 text-[11px] font-mono rounded-md border transition-all duration-150 ${
                showPeaks
                  ? "border-teal bg-teal/10 text-teal"
                  : "border-border text-text-muted hover:text-text-secondary"
              }`}
            >
              peaks
            </button>
            <button
              onClick={() => setShowRegions(!showRegions)}
              className={`px-2.5 py-1 text-[11px] font-mono rounded-md border transition-all duration-150 ${
                showRegions
                  ? "border-violet bg-violet/10 text-violet"
                  : "border-border text-text-muted hover:text-text-secondary"
              }`}
            >
              regions
            </button>
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="px-2.5 py-1 text-[11px] font-mono rounded-md border border-border text-text-muted hover:text-text-secondary transition-all duration-150"
            >
              {theme === "dark" ? "light" : "dark"}
            </button>
          </div>
        </div>

        {/* Prominence slider */}
        {showPeaks && (
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[10px] font-mono text-text-muted">prominence</span>
            <input
              type="range"
              min="0.01"
              max="0.5"
              step="0.01"
              value={prominence}
              onChange={(e) => setProminence(parseFloat(e.target.value))}
              className="flex-1 h-1 accent-teal"
            />
            <span className="text-[10px] font-mono text-teal w-8 text-right">
              {prominence.toFixed(2)}
            </span>
          </div>
        )}
      </div>

      {/* SpectraView chart */}
      <div className="p-3 flex justify-center">
        <SpectraView
          spectra={spectra}
          peaks={showPeaks ? peaks : []}
          regions={showRegions ? REGIONS : []}
          width={720}
          height={380}
          reverseX={true}
          theme={theme}
          showToolbar={true}
          showCrosshair={true}
          showGrid={true}
        />
      </div>

      {/* Status bar */}
      <div className="px-4 py-2 border-t border-border flex items-center gap-4 text-[10px] font-mono text-text-muted">
        <span>
          {spectra.length} spectr{spectra.length === 1 ? "um" : "a"} loaded
        </span>
        {showPeaks && <span>{peaks.length} peaks detected</span>}
        <span className="ml-auto">spectraview v0.1.1</span>
      </div>
    </motion.div>
  );
}
