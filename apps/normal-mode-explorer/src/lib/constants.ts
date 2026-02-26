/** CPK coloring scheme for atoms */
export const CPK_COLORS: Record<string, string> = {
  H: "#FFFFFF",
  C: "#909090",
  N: "#3050F8",
  O: "#FF0D0D",
  F: "#90E050",
  S: "#FFFF30",
  P: "#FF8000",
  Cl: "#1FF01F",
  Br: "#A62929",
  I: "#940094",
};

/** Covalent radii in angstroms */
export const COVALENT_RADII: Record<string, number> = {
  H: 0.31,
  C: 0.76,
  N: 0.71,
  O: 0.66,
  F: 0.57,
  S: 1.05,
  P: 1.07,
  Cl: 1.02,
  Br: 1.2,
  I: 1.39,
};

/** Visual scale factor for atom sphere radius */
export const ATOM_SCALE = 0.4;

/** Bond cylinder radius */
export const BOND_RADIUS = 0.08;

/** Default amplitude for vibration animation */
export const DEFAULT_AMPLITUDE = 0.5;

/** Default speed multiplier */
export const DEFAULT_SPEED = 1.0;

/** Visual frequency for animation (Hz) */
export const VISUAL_FREQ = 1.5;

/** Known point groups, symmetry labels, and mode descriptions for common molecules */
export const MOLECULE_SYMMETRY: Record<string, {
  pointGroup: string;
  modeLabels: string[];
  modeDescriptions?: string[];
}> = {
  water: {
    pointGroup: "C₂ᵥ",
    modeLabels: ["A₁", "A₁", "B₂"],
    modeDescriptions: ["Symmetric stretch", "Bending", "Asymmetric stretch"],
  },
  ammonia: {
    pointGroup: "C₃ᵥ",
    modeLabels: ["A₁", "E", "E", "A₁", "E", "E"],
    modeDescriptions: ["Symmetric stretch", "Degenerate deformation", "Degenerate deformation", "Symmetric deformation", "Degenerate stretch", "Degenerate stretch"],
  },
  methane: {
    pointGroup: "Tᵈ",
    modeLabels: ["A₁", "E", "E", "T₂", "T₂", "T₂", "T₂", "T₂", "T₂"],
    modeDescriptions: ["Symmetric stretch", "Degenerate deformation", "Degenerate deformation", "Asymmetric stretch", "Asymmetric stretch", "Asymmetric stretch", "Degenerate deformation", "Degenerate deformation", "Degenerate deformation"],
  },
  formaldehyde: {
    pointGroup: "C₂ᵥ",
    modeLabels: ["A₁", "A₁", "A₁", "B₁", "B₂", "B₂"],
    modeDescriptions: ["C-H symmetric stretch", "C=O stretch", "CH₂ scissoring", "Out-of-plane wag", "C-H asymmetric stretch", "CH₂ rocking"],
  },
  benzene: { pointGroup: "D₆ₕ", modeLabels: [] },
  acetylene: {
    pointGroup: "D∞ₕ",
    modeLabels: ["Σᵍ⁺", "Σᵍ⁺", "Σᵤ⁺", "Πᵍ", "Πᵍ", "Πᵤ", "Πᵤ"],
    modeDescriptions: ["Symmetric C-H stretch", "C≡C stretch", "Asymmetric C-H stretch", "Symmetric bend", "Symmetric bend", "Asymmetric bend", "Asymmetric bend"],
  },
  hydrogen_cyanide: {
    pointGroup: "C∞ᵥ",
    modeLabels: ["Σ⁺", "Σ⁺", "Π", "Π"],
    modeDescriptions: ["C-H stretch", "C≡N stretch", "Bending", "Bending"],
  },
  ethane: { pointGroup: "D₃ᵈ", modeLabels: [] },
};
