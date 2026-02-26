"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useVibeStore } from "@/lib/store";

export function MoleculePicker() {
  const manifest = useVibeStore((s) => s.manifest);
  const moleculeId = useVibeStore((s) => s.moleculeId);
  const setMoleculeId = useVibeStore((s) => s.setMoleculeId);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const current = manifest.find((m) => m.id === moleculeId);

  const filtered = query
    ? manifest.filter(
        (m) =>
          m.name.toLowerCase().includes(query.toLowerCase()) ||
          m.formula.toLowerCase().includes(query.toLowerCase()) ||
          m.id.toLowerCase().includes(query.toLowerCase()),
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

  // Close on outside click
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

  // Focus input when opening
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Keyboard nav
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
      <label className="text-[11px] font-medium text-text-secondary uppercase tracking-wider">
        Molecule
      </label>

      {/* Trigger button */}
      <button
        onClick={() => setOpen(!open)}
        className="mt-1 w-full flex items-center justify-between bg-bg-secondary border border-border rounded-lg px-3 py-2 text-sm font-mono text-text hover:border-border-hover focus:outline-none focus:border-accent transition-colors"
      >
        <span>
          {current ? `${current.name}` : "Select..."}
          {current && (
            <span className="text-text-muted ml-1.5">({current.formula})</span>
          )}
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          className={`text-text-muted transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-surface border border-border rounded-lg shadow-xl overflow-hidden">
          {/* Search input */}
          <div className="p-2 border-b border-border">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search molecules..."
              className="w-full bg-bg-secondary border border-border rounded-md px-2.5 py-1.5 text-sm font-mono text-text placeholder:text-text-muted focus:outline-none focus:border-accent"
            />
          </div>

          {/* Results */}
          <div className="max-h-52 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-center text-text-muted text-sm">
                No molecules found
              </div>
            ) : (
              filtered.map((mol) => (
                <button
                  key={mol.id}
                  onClick={() => handleSelect(mol.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-left transition-colors ${
                    mol.id === moleculeId
                      ? "bg-accent-dim text-accent"
                      : "hover:bg-surface-hover text-text-secondary"
                  }`}
                >
                  <div>
                    <span className="text-sm capitalize">{mol.name}</span>
                    <span className="text-[11px] font-mono text-text-muted ml-2">
                      {mol.formula}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-text-muted">
                    {mol.atomCount}a · {mol.modeCount}m
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
