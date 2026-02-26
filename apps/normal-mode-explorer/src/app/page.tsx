"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";
import { useExplorerStore } from "@/lib/store";
import { useKeyboard } from "@/hooks/useKeyboard";
import { Header } from "@/components/Header";
import { MobileModeStrip } from "@/components/MobileModeStrip";
import { ModeList } from "@/components/panels/ModeList";
import { AnimationControls } from "@/components/panels/AnimationControls";
import { Sonification } from "@/components/panels/Sonification";
import type { MoleculeData, MoleculeManifestEntry } from "@/lib/types";

const ComparisonView = dynamic(
  () =>
    import("@/components/scene/ComparisonView").then((m) => ({
      default: m.ComparisonView,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 flex items-center justify-center bg-[#030308]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-24 h-24">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-6 h-6 rounded-full bg-cyan/20 animate-pulse" />
            </div>
            <div className="absolute top-2 right-4">
              <div className="w-4 h-4 rounded-full bg-foreground/10 animate-pulse" style={{ animationDelay: "0.2s" }} />
            </div>
            <div className="absolute bottom-2 left-4">
              <div className="w-4 h-4 rounded-full bg-foreground/10 animate-pulse" style={{ animationDelay: "0.4s" }} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            <span className="text-foreground/40 font-mono text-xs">Loading 3D viewer...</span>
          </div>
        </div>
      </div>
    ),
  },
);

const SpectrumChart = dynamic(
  () => import("@/components/panels/SpectrumChart").then((m) => ({ default: m.SpectrumChart })),
);
const EnergyChart = dynamic(
  () => import("@/components/panels/EnergyChart").then((m) => ({ default: m.EnergyChart })),
);
const SelectionRules = dynamic(
  () => import("@/components/panels/SelectionRules").then((m) => ({ default: m.SelectionRules })),
);
const BoltzmannPanel = dynamic(
  () => import("@/components/panels/BoltzmannPanel").then((m) => ({ default: m.BoltzmannPanel })),
);
const SymmetryInfo = dynamic(
  () => import("@/components/panels/SymmetryInfo").then((m) => ({ default: m.SymmetryInfo })),
);
const DisplacementTable = dynamic(
  () => import("@/components/panels/DisplacementTable").then((m) => ({ default: m.DisplacementTable })),
);

function URLSync() {
  const moleculeId = useExplorerStore((s) => s.moleculeId);
  const modeA = useExplorerStore((s) => s.modeA);
  const modeB = useExplorerStore((s) => s.modeB);
  const initialized = useRef(false);

  useEffect(() => {
    // Skip the first render to avoid overwriting URL before manifest loads
    if (!initialized.current) {
      initialized.current = true;
      return;
    }
    const params = new URLSearchParams();
    params.set("mol", moleculeId);
    if (modeA !== 0) params.set("mode", String(modeA));
    if (modeB !== null) params.set("modeB", String(modeB));
    const search = params.toString();
    const url = search ? `?${search}` : window.location.pathname;
    window.history.replaceState(null, "", url);
  }, [moleculeId, modeA, modeB]);

  return null;
}

function DataLoader() {
  const moleculeId = useExplorerStore((s) => s.moleculeId);
  const setMolecule = useExplorerStore((s) => s.setMolecule);
  const setManifest = useExplorerStore((s) => s.setManifest);
  const setLoading = useExplorerStore((s) => s.setLoading);
  const setError = useExplorerStore((s) => s.setError);

  useEffect(() => {
    fetch("/molecules/index.json")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: MoleculeManifestEntry[]) => setManifest(data))
      .catch((err) => console.error("Failed to load manifest:", err));
  }, [setManifest]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/molecules/${moleculeId}.json`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: MoleculeData) => {
        setMolecule(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load molecule:", err);
        setError(`Failed to load ${moleculeId}`);
        setLoading(false);
      });
  }, [moleculeId, setMolecule, setLoading, setError]);

  return null;
}

export default function Page() {
  useKeyboard();

  return (
    <div className="h-screen flex flex-col">
      <DataLoader />
      <URLSync />
      <Header />
      <MobileModeStrip />

      <main id="main-content" className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-y-auto lg:overflow-hidden">
        {/* 3D viewer — fixed height on mobile to prevent CLS */}
        <div className="h-[50vh] lg:h-auto lg:flex-1 flex flex-col min-w-0 shrink-0 overflow-hidden">
          <div className="flex-1 min-h-0">
            <ComparisonView />
          </div>
        </div>

        {/* Analysis panels */}
        <aside className="w-full lg:w-[420px] border-t lg:border-t-0 lg:border-l border-border bg-surface/30 lg:overflow-y-auto shrink-0 pb-[env(safe-area-inset-bottom)]">
          <div className="p-2 space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <ModeList />
              <div className="space-y-2">
                <AnimationControls />
                <Sonification />
              </div>
            </div>

            <SpectrumChart />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <EnergyChart />
              <SelectionRules />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <BoltzmannPanel />
              <SymmetryInfo />
            </div>

            <DisplacementTable />
          </div>

          <div className="hidden lg:block px-3 py-2 border-t border-border">
            <div className="text-[10px] font-mono text-foreground/20 space-y-0.5">
              <div>Space — play/pause</div>
              <div>↑↓ — cycle mode A</div>
              <div>←→ — cycle mode B</div>
              <div>B — toggle compare</div>
              <div>S — toggle superposition</div>
              <div>Esc — close compare</div>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
