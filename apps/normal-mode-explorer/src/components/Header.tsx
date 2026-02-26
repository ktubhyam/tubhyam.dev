"use client";

import { MoleculePicker } from "./ui/MoleculePicker";
import { useExplorerStore } from "@/lib/store";
import { MOLECULE_SYMMETRY } from "@/lib/constants";

export function Header() {
  const molecule = useExplorerStore((s) => s.molecule);

  const symmetryData = molecule
    ? MOLECULE_SYMMETRY[molecule.name.toLowerCase().replace(/\s+/g, "_")]
    : null;
  const pointGroup = symmetryData?.pointGroup || molecule?.pointGroup || "";

  return (
    <header className="relative z-50 flex items-center justify-between gap-2 px-3 sm:px-4 py-2 sm:py-2.5 border-b border-border bg-surface/50 backdrop-blur-sm">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-2 h-2 rounded-full bg-cyan shadow-[0_0_8px_var(--cyan)]" />
          <h1 className="text-xs sm:text-sm font-mono font-medium text-foreground tracking-tight whitespace-nowrap">
            Normal Mode Explorer
          </h1>
        </div>
        {molecule && (
          <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-foreground/40">
            <span>·</span>
            <span className="capitalize">{molecule.name}</span>
            <span className="text-foreground/25">{molecule.formula}</span>
            {pointGroup && (
              <>
                <span>·</span>
                <span className="text-cyan/60">{pointGroup}</span>
              </>
            )}
            <span>·</span>
            <span>{molecule.modes.length} modes</span>
          </div>
        )}
      </div>
      <MoleculePicker />
    </header>
  );
}
