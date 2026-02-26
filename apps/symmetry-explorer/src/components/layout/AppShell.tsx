'use client';

import { useMemo, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';

import { useExplorerStore } from '@/lib/store';
import { MOLECULES } from '@/lib/data/molecules';
import { CHARACTER_TABLES } from '@/lib/data/characterTables';
import { getSelectionRules } from '@/lib/chemistry/selectionRules';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useURLState } from '@/hooks/useURLState';

import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { MoleculePicker } from '@/components/ui/MoleculePicker';
import { SymmetryElements } from '@/components/ui/SymmetryElements';
import { CharacterTable } from '@/components/ui/CharacterTable';
import { SelectionRules } from '@/components/ui/SelectionRules';
import { PointGroupInfo } from '@/components/ui/PointGroupInfo';
import { ModeBreakdown } from '@/components/ui/ModeBreakdown';
import { OperationPlayer } from '@/components/ui/OperationPlayer';
import { PointGroupFlowchart } from '@/components/ui/PointGroupFlowchart';

const MoleculeViewer = dynamic(
  () => import('@/components/three/MoleculeViewer'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-black">
        <div className="text-accent font-mono text-sm animate-pulse-glow">
          initializing 3d renderer...
        </div>
      </div>
    ),
  }
);

type SidebarTab = 'molecules' | 'elements' | 'table' | 'rules' | 'identify';

const TABS: { key: SidebarTab; label: string }[] = [
  { key: 'molecules', label: 'molecules' },
  { key: 'elements', label: 'elements' },
  { key: 'table', label: 'table' },
  { key: 'rules', label: 'rules' },
  { key: 'identify', label: 'identify' },
];

function ModeIndicator() {
  const activeMode = useExplorerStore((s) => s.activeMode);
  const stopMode = useExplorerStore((s) => s.stopMode);

  if (!activeMode) return null;

  return (
    <div className="absolute top-3 right-3 z-10">
      <button
        onClick={stopMode}
        className="flex items-center gap-2 px-2 py-1 bg-cyan/10 border border-cyan/30 text-cyan text-[10px] font-mono hover:bg-cyan/20 transition-colors"
      >
        <span className="animate-pulse-glow">&#9654;</span>
        <span className="truncate max-w-[120px]">{activeMode.label}</span>
        <span className="text-[#555]">&#x2715;</span>
      </button>
    </div>
  );
}

export function AppShell() {
  const selectedId = useExplorerStore((s) => s.selectedMoleculeId);

  // Wire in keyboard shortcuts and URL state sync
  useKeyboardShortcuts();
  useURLState();

  const molecule = useMemo(
    () => MOLECULES.find((m) => m.id === selectedId) ?? MOLECULES[0],
    [selectedId]
  );

  const table = useMemo(
    () => CHARACTER_TABLES[molecule.pointGroup],
    [molecule.pointGroup]
  );

  const selectionResult = useMemo(
    () => getSelectionRules(table, molecule.atoms.length, molecule.linear),
    [table, molecule.atoms.length, molecule.linear]
  );

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <Header
        pointGroup={table.pointGroup}
        moleculeName={molecule.name}
        formula={molecule.formula}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:flex-row gap-px bg-border">
        {/* Left: 3D Viewer + Selection Rules */}
        <main
          className="flex-1 lg:w-[60%] flex flex-col min-h-[400px] lg:min-h-0"
          aria-label="3D molecule viewer"
        >
          <div className="flex-1 relative">
            {/* Molecule name overlay */}
            <div className="absolute top-3 left-3 z-10 pointer-events-none">
              <AnimatePresence mode="wait">
                <motion.div
                  key={molecule.id}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="text-sm font-mono text-accent font-bold">
                    {molecule.formula}
                  </div>
                  <div className="text-[10px] text-[#666]">
                    {molecule.name}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Active mode indicator */}
            <ModeIndicator />

            {/* Keyboard hints */}
            <div className="absolute bottom-3 right-3 z-10 pointer-events-none hidden lg:flex gap-1.5 items-center">
              <span className="kbd">←→</span>
              <span className="text-[9px] text-[#444]">cycle</span>
              <span className="kbd">Space</span>
              <span className="text-[9px] text-[#444]">elements</span>
              <span className="kbd">Esc</span>
              <span className="text-[9px] text-[#444]">stop</span>
            </div>

            <ErrorBoundary
              fallback={
                <div className="w-full h-full flex items-center justify-center bg-black">
                  <div className="text-center space-y-2">
                    <div className="text-error font-mono text-sm">
                      WebGL unavailable
                    </div>
                    <div className="text-[#555] text-xs">
                      3D rendering requires WebGL support
                    </div>
                  </div>
                </div>
              }
            >
              <Suspense
                fallback={
                  <div className="w-full h-full flex items-center justify-center bg-black">
                    <div className="text-accent font-mono text-sm animate-pulse-glow">
                      loading...
                    </div>
                  </div>
                }
              >
                <MoleculeViewer molecule={molecule} table={table} />
              </Suspense>
            </ErrorBoundary>
          </div>

          {/* Selection Rules — below 3D viewer */}
          <div className="shrink-0">
            <SelectionRules
              result={selectionResult}
              pointGroup={table.pointGroup}
              hasInversion={table.hasInversion}
            />
          </div>
        </main>

        {/* Right: Sidebar panels */}
        <DesktopSidebar molecule={molecule} table={table} />
        <MobileTabs molecule={molecule} table={table} />
      </div>
    </div>
  );
}

/* ─── Header ─── */

function Header({
  pointGroup,
  moleculeName,
  formula,
}: {
  pointGroup: string;
  moleculeName: string;
  formula: string;
}) {
  return (
    <header
      className="flex items-center justify-between px-4 py-2 border-b border-border bg-surface shrink-0"
      role="banner"
    >
      <div className="flex items-center gap-3">
        <span className="text-xs font-mono text-accent text-shimmer">
          symmetry-explorer
        </span>
        <span className="text-[10px] text-[#555] font-mono">v1.0</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-mono text-[#666] hidden sm:inline">
          {moleculeName}
        </span>
        <span className="text-xs font-mono px-2 py-0.5 border border-accent/30 text-accent bg-accent/5 shine-border">
          {pointGroup}
        </span>
      </div>
      <a
        href="https://tubhyam.dev"
        target="_blank"
        rel="noopener noreferrer"
        className="text-[10px] font-mono text-[#555] hover:text-accent transition-colors"
        aria-label="Visit tubhyam.dev"
      >
        tubhyam.dev →
      </a>
    </header>
  );
}

/* ─── Desktop Sidebar (lg+) ─── */

interface SidebarProps {
  molecule: (typeof MOLECULES)[number];
  table: (typeof CHARACTER_TABLES)[string];
}

function DesktopSidebar({ molecule, table }: SidebarProps) {
  return (
    <aside
      className="hidden lg:block lg:w-[40%] overflow-y-auto bg-background"
      aria-label="Analysis panels"
    >
      <div className="space-y-px">
        <PointGroupInfo molecule={molecule} table={table} />
        <MoleculePicker />
        <SymmetryElements table={table} />
        <OperationPlayer table={table} />
        <CharacterTable table={table} />
        <ModeBreakdown
          table={table}
          nAtoms={molecule.atoms.length}
          linear={molecule.linear}
          moleculeId={molecule.id}
        />
        <PointGroupFlowchart />
      </div>
    </aside>
  );
}

/* ─── Mobile Tabs (below lg) ─── */

function MobileTabs({ molecule, table }: SidebarProps) {
  const sidebarTab = useExplorerStore((s) => s.sidebarTab) as SidebarTab;
  const setSidebarTab = useExplorerStore((s) => s.setSidebarTab);

  return (
    <div className="lg:hidden bg-background">
      {/* Tab bar */}
      <nav
        className="flex border-b border-border"
        role="tablist"
        aria-label="Analysis panels"
      >
        {TABS.map((tab) => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={sidebarTab === tab.key}
            aria-controls={`panel-${tab.key}`}
            onClick={() => setSidebarTab(tab.key)}
            className={`flex-1 py-2 text-[10px] font-mono uppercase tracking-wider transition-colors ${
              sidebarTab === tab.key
                ? 'text-accent border-b border-accent bg-accent/5'
                : 'text-[#555] hover:text-[#888]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={sidebarTab}
          role="tabpanel"
          id={`panel-${sidebarTab}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
        >
          {sidebarTab === 'molecules' && (
            <div className="space-y-px">
              <PointGroupInfo molecule={molecule} table={table} />
              <MoleculePicker />
            </div>
          )}
          {sidebarTab === 'elements' && (
            <div className="space-y-px">
              <SymmetryElements table={table} />
              <OperationPlayer table={table} />
            </div>
          )}
          {sidebarTab === 'table' && <CharacterTable table={table} />}
          {sidebarTab === 'rules' && (
            <ModeBreakdown
              table={table}
              nAtoms={molecule.atoms.length}
              linear={molecule.linear}
              moleculeId={molecule.id}
            />
          )}
          {sidebarTab === 'identify' && <PointGroupFlowchart />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
