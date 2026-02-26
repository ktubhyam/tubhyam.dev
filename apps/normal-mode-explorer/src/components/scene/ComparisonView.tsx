"use client";

import { useExplorerStore } from "@/lib/store";
import { MiniViewer } from "./MiniViewer";

export function ComparisonView() {
  const molecule = useExplorerStore((s) => s.molecule);
  const modeA = useExplorerStore((s) => s.modeA);
  const modeB = useExplorerStore((s) => s.modeB);
  const loading = useExplorerStore((s) => s.loading);
  const error = useExplorerStore((s) => s.error);

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2 bg-surface/80 backdrop-blur-sm rounded-lg px-6 py-4 border border-error/30">
          <div className="w-2 h-2 rounded-full bg-error" />
          <span className="text-error/80 font-mono text-sm">{error}</span>
          <span className="text-foreground/30 font-mono text-[10px]">Try selecting another molecule</span>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          {/* Pulsing molecule skeleton */}
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
            <div className="absolute bottom-3 right-3">
              <div className="w-3 h-3 rounded-full bg-foreground/10 animate-pulse" style={{ animationDelay: "0.6s" }} />
            </div>
            {/* Bond lines */}
            <div className="absolute top-1/2 left-1/2 w-10 h-px bg-foreground/5 -translate-x-1/2 -translate-y-1/2 rotate-45 animate-pulse" />
            <div className="absolute top-1/2 left-1/2 w-10 h-px bg-foreground/5 -translate-x-1/2 -translate-y-1/2 -rotate-45 animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            <span className="text-foreground/40 font-mono text-xs">Loading molecule...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!molecule) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <span className="text-foreground/30 font-mono text-sm">Select a molecule</span>
      </div>
    );
  }

  const isDual = modeB !== null;

  return (
    <div className="flex-1 flex min-h-0 gap-px bg-border">
      <div className={`flex flex-col min-h-0 bg-background ${isDual ? "w-1/2" : "w-full"}`}>
        <MiniViewer
          molecule={molecule}
          modeIndex={modeA}
          label="A"
          accentColor="#00D8FF"
        />
      </div>
      {isDual && modeB !== null && (
        <div className="flex flex-col min-h-0 w-1/2 bg-background">
          <MiniViewer
            molecule={molecule}
            modeIndex={modeB}
            label="B"
            accentColor="#C9A04A"
          />
        </div>
      )}
    </div>
  );
}
