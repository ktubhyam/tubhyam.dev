export interface AtomData {
  element: string;
  x: number;
  y: number;
  z: number;
  mass: number;
}

export interface BondData {
  atom1: number;
  atom2: number;
  order: number;
}

export interface ModeData {
  index: number;
  frequency: number;
  ir_intensity: number;
  raman_activity: number;
  symmetry: string;
  displacements: [number, number, number][];
}

export interface SpectrumData {
  wavenumbers: number[];
  ir: number[];
  raman: number[];
}

export interface MoleculeData {
  name: string;
  formula: string;
  smiles: string;
  atomCount: number;
  atoms: AtomData[];
  bonds: BondData[];
  modes: ModeData[];
  spectrum?: SpectrumData;
}

export interface MoleculeManifestEntry {
  id: string;
  name: string;
  formula: string;
  smiles: string;
  atomCount: number;
  modeCount: number;
}
