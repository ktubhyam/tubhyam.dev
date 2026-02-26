import { create } from "zustand";
import type { MoleculeData, MoleculeManifestEntry } from "./types";

interface VibeStore {
  // Manifest
  manifest: MoleculeManifestEntry[];
  setManifest: (entries: MoleculeManifestEntry[]) => void;

  // Current molecule
  moleculeId: string;
  molecule: MoleculeData | null;
  loading: boolean;
  setMoleculeId: (id: string) => void;
  setMolecule: (data: MoleculeData | null) => void;
  setLoading: (loading: boolean) => void;

  // Selected mode
  selectedMode: number;
  setSelectedMode: (index: number) => void;

  // Animation controls
  isPlaying: boolean;
  speed: number;
  amplitude: number;
  togglePlaying: () => void;
  setSpeed: (speed: number) => void;
  setAmplitude: (amplitude: number) => void;

  // Spectrum
  spectrumType: "ir" | "raman";
  setSpectrumType: (type: "ir" | "raman") => void;
}

export const useVibeStore = create<VibeStore>((set) => ({
  manifest: [],
  setManifest: (entries) => set({ manifest: entries }),

  moleculeId: "water",
  molecule: null,
  loading: false,
  setMoleculeId: (id) => set({ moleculeId: id, selectedMode: 0 }),
  setMolecule: (data) => set({ molecule: data }),
  setLoading: (loading) => set({ loading }),

  selectedMode: 0,
  setSelectedMode: (index) => set({ selectedMode: index }),

  isPlaying: true,
  speed: 1.0,
  amplitude: 0.5,
  togglePlaying: () => set((s) => ({ isPlaying: !s.isPlaying })),
  setSpeed: (speed) => set({ speed }),
  setAmplitude: (amplitude) => set({ amplitude }),

  spectrumType: "ir",
  setSpectrumType: (type) => set({ spectrumType: type }),
}));
