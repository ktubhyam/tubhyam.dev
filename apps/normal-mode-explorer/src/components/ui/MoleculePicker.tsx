"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useExplorerStore } from "@/lib/store";

export function MoleculePicker() {
  const manifest = useExplorerStore((s) => s.manifest);
  const moleculeId = useExplorerStore((s) => s.moleculeId);
  const setMoleculeId = useExplorerStore((s) => s.setMoleculeId);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const current = manifest.find((m) => m.id === moleculeId);

  const filtered = query
    ? manifest.filter(
        (m) =>
          m.name.toLowerCase().includes(query.toLowerCase()) ||
          m.formula.toLowerCase().includes(query.toLowerCase()),
      )
    : manifest;

  const handleSelect = useCallback(
    (id: string) => {
      setMoleculeId(id);
      setOpen(false);
      setQuery("");
    },
    [setMoleculeId],
  );

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setQuery("");
      } else if (e.key === "Enter" && filtered.length > 0) {
        handleSelect(filtered[0].id);
      }
    },
    [filtered, handleSelect],
  );

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 sm:gap-2 bg-surface border border-border rounded-lg px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-mono text-foreground hover:border-border-bright transition-colors"
      >
        <span className="capitalize">
          {current ? current.name : "Select..."}
        </span>
        {current && (
          <span className="hidden sm:inline text-foreground/40 text-xs">{current.formula}</span>
        )}
        <svg
          width="10"
          height="10"
          viewBox="0 0 12 12"
          fill="none"
          className={`text-foreground/40 transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="fixed sm:absolute z-50 top-12 sm:top-full right-2 sm:right-0 left-2 sm:left-auto mt-0 sm:mt-1 sm:w-64 bg-surface border border-border rounded-lg shadow-xl overflow-hidden">
          <div className="p-2 border-b border-border">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search molecules..."
              className="w-full bg-surface-2 border border-border rounded-md px-2.5 py-1.5 text-sm font-mono text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-accent"
            />
          </div>
          <div className="max-h-[min(18rem,60dvh)] overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-center text-foreground/30 text-sm">
                No molecules found
              </div>
            ) : (
              filtered.map((mol) => (
                <button
                  key={mol.id}
                  onClick={() => handleSelect(mol.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-left transition-colors ${
                    mol.id === moleculeId
                      ? "bg-accent/10 text-accent"
                      : "hover:bg-surface-2 text-foreground/70"
                  }`}
                >
                  <div>
                    <span className="text-sm capitalize">{mol.name}</span>
                    <span className="text-[11px] font-mono text-foreground/40 ml-2">
                      {mol.formula}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-foreground/30">
                    {mol.atomCount}a {mol.modeCount}m
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
