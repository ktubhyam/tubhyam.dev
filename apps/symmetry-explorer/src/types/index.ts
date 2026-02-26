export interface Atom {
  element: string; // "O", "H", "C", etc.
  x: number;
  y: number;
  z: number;
}

export interface MoleculeData {
  id: string;
  name: string;
  formula: string;
  pointGroup: string; // Schoenflies symbol: "C2v", "D6h", "Td", etc.
  atoms: Atom[];
  bonds: [number, number][]; // pairs of atom indices
  linear: boolean;
}

export interface SymmetryElement {
  type: "axis" | "plane" | "center" | "improper";
  label: string; // "C2", "σv(xz)", "i", "S4"
  // For axes:
  direction?: [number, number, number];
  order?: number; // 2 for C2, 3 for C3, etc.
  // For planes:
  normal?: [number, number, number];
}

export interface Irrep {
  label: string; // "A1", "B2g", "T1u", etc.
  characters: number[]; // character under each class of operations
  linearFunctions: string[]; // "x", "y", "z", "Rx", "Ry", "Rz"
  quadraticFunctions: string[]; // "x²", "y²", "z²", "xy", "xz", "yz", etc.
  degeneracy: number; // 1 for A/B, 2 for E, 3 for T
}

export interface CharacterTableData {
  pointGroup: string;
  operations: { label: string; count: number }[];
  irreps: Irrep[];
  order: number;
  hasInversion: boolean;
  symmetryElements: SymmetryElement[];
}

export interface SelectionResult {
  irActive: Irrep[];
  ramanActive: Irrep[];
  bothActive: Irrep[];
  silent: Irrep[];
  irCount: number;
  ramanCount: number;
  bothCount: number;
  silentCount: number;
  totalModes: number;
  uniqueObservable: number;
  ratio: number; // R(G,N)
}
