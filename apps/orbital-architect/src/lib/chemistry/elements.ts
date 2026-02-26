import type { Element, SubshellOccupancy } from '@/types/chemistry';

// Subshell occupancy shorthand: [n, l, electrons]
type OccupancyTuple = [number, number, number];

function occ(tuples: OccupancyTuple[]): SubshellOccupancy[] {
  return tuples.map(([n, l, electrons]) => ({ n, l, electrons }));
}

function configString(occupancies: SubshellOccupancy[]): string {
  const subshellNames = ['s', 'p', 'd', 'f'];
  const superscripts: Record<string, string> = {
    '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
    '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
    '10': '¹⁰',
  };
  return occupancies
    .map(({ n, l, electrons }) => {
      const sup = electrons <= 10
        ? (superscripts[String(electrons)] ?? String(electrons))
        : String(electrons).split('').map(d => superscripts[d] ?? d).join('');
      return `${n}${subshellNames[l]}${sup}`;
    })
    .join(' ');
}

interface ElementData {
  symbol: string;
  name: string;
  period: number;
  group: number;
  category: Element['category'];
  config: OccupancyTuple[];
  isException?: boolean;
  exceptionNote?: string;
  nobleGasCore?: string;
}

const elementData: ElementData[] = [
  // Period 1
  { symbol: 'H',  name: 'Hydrogen',    period: 1, group: 1,  category: 'nonmetal',            config: [[1,0,1]] },
  { symbol: 'He', name: 'Helium',      period: 1, group: 18, category: 'noble-gas',            config: [[1,0,2]] },
  // Period 2
  { symbol: 'Li', name: 'Lithium',     period: 2, group: 1,  category: 'alkali-metal',         config: [[1,0,2],[2,0,1]] },
  { symbol: 'Be', name: 'Beryllium',   period: 2, group: 2,  category: 'alkaline-earth',       config: [[1,0,2],[2,0,2]] },
  { symbol: 'B',  name: 'Boron',       period: 2, group: 13, category: 'metalloid',            config: [[1,0,2],[2,0,2],[2,1,1]] },
  { symbol: 'C',  name: 'Carbon',      period: 2, group: 14, category: 'nonmetal',             config: [[1,0,2],[2,0,2],[2,1,2]] },
  { symbol: 'N',  name: 'Nitrogen',    period: 2, group: 15, category: 'nonmetal',             config: [[1,0,2],[2,0,2],[2,1,3]] },
  { symbol: 'O',  name: 'Oxygen',      period: 2, group: 16, category: 'nonmetal',             config: [[1,0,2],[2,0,2],[2,1,4]] },
  { symbol: 'F',  name: 'Fluorine',    period: 2, group: 17, category: 'halogen',              config: [[1,0,2],[2,0,2],[2,1,5]] },
  { symbol: 'Ne', name: 'Neon',        period: 2, group: 18, category: 'noble-gas',            config: [[1,0,2],[2,0,2],[2,1,6]] },
  // Period 3
  { symbol: 'Na', name: 'Sodium',      period: 3, group: 1,  category: 'alkali-metal',         config: [[1,0,2],[2,0,2],[2,1,6],[3,0,1]], nobleGasCore: '[Ne]' },
  { symbol: 'Mg', name: 'Magnesium',   period: 3, group: 2,  category: 'alkaline-earth',       config: [[1,0,2],[2,0,2],[2,1,6],[3,0,2]], nobleGasCore: '[Ne]' },
  { symbol: 'Al', name: 'Aluminium',   period: 3, group: 13, category: 'post-transition-metal',config: [[1,0,2],[2,0,2],[2,1,6],[3,0,2],[3,1,1]], nobleGasCore: '[Ne]' },
  { symbol: 'Si', name: 'Silicon',     period: 3, group: 14, category: 'metalloid',            config: [[1,0,2],[2,0,2],[2,1,6],[3,0,2],[3,1,2]], nobleGasCore: '[Ne]' },
  { symbol: 'P',  name: 'Phosphorus',  period: 3, group: 15, category: 'nonmetal',             config: [[1,0,2],[2,0,2],[2,1,6],[3,0,2],[3,1,3]], nobleGasCore: '[Ne]' },
  { symbol: 'S',  name: 'Sulfur',      period: 3, group: 16, category: 'nonmetal',             config: [[1,0,2],[2,0,2],[2,1,6],[3,0,2],[3,1,4]], nobleGasCore: '[Ne]' },
  { symbol: 'Cl', name: 'Chlorine',    period: 3, group: 17, category: 'halogen',              config: [[1,0,2],[2,0,2],[2,1,6],[3,0,2],[3,1,5]], nobleGasCore: '[Ne]' },
  { symbol: 'Ar', name: 'Argon',       period: 3, group: 18, category: 'noble-gas',            config: [[1,0,2],[2,0,2],[2,1,6],[3,0,2],[3,1,6]], nobleGasCore: '[Ne]' },
  // Period 4
  { symbol: 'K',  name: 'Potassium',   period: 4, group: 1,  category: 'alkali-metal',         config: [[1,0,2],[2,0,2],[2,1,6],[3,0,2],[3,1,6],[4,0,1]], nobleGasCore: '[Ar]' },
  { symbol: 'Ca', name: 'Calcium',     period: 4, group: 2,  category: 'alkaline-earth',       config: [[1,0,2],[2,0,2],[2,1,6],[3,0,2],[3,1,6],[4,0,2]], nobleGasCore: '[Ar]' },
  { symbol: 'Sc', name: 'Scandium',    period: 4, group: 3,  category: 'transition-metal',     config: [[1,0,2],[2,0,2],[2,1,6],[3,0,2],[3,1,6],[4,0,2],[3,2,1]], nobleGasCore: '[Ar]' },
  { symbol: 'Ti', name: 'Titanium',    period: 4, group: 4,  category: 'transition-metal',     config: [[1,0,2],[2,0,2],[2,1,6],[3,0,2],[3,1,6],[4,0,2],[3,2,2]], nobleGasCore: '[Ar]' },
  { symbol: 'V',  name: 'Vanadium',    period: 4, group: 5,  category: 'transition-metal',     config: [[1,0,2],[2,0,2],[2,1,6],[3,0,2],[3,1,6],[4,0,2],[3,2,3]], nobleGasCore: '[Ar]' },
  { symbol: 'Cr', name: 'Chromium',    period: 4, group: 6,  category: 'transition-metal',     config: [[1,0,2],[2,0,2],[2,1,6],[3,0,2],[3,1,6],[4,0,1],[3,2,5]], nobleGasCore: '[Ar]', isException: true, exceptionNote: 'Half-filled d subshell is extra stable: [Ar] 3d⁵ 4s¹ instead of [Ar] 3d⁴ 4s²' },
  { symbol: 'Mn', name: 'Manganese',   period: 4, group: 7,  category: 'transition-metal',     config: [[1,0,2],[2,0,2],[2,1,6],[3,0,2],[3,1,6],[4,0,2],[3,2,5]], nobleGasCore: '[Ar]' },
  { symbol: 'Fe', name: 'Iron',        period: 4, group: 8,  category: 'transition-metal',     config: [[1,0,2],[2,0,2],[2,1,6],[3,0,2],[3,1,6],[4,0,2],[3,2,6]], nobleGasCore: '[Ar]' },
  { symbol: 'Co', name: 'Cobalt',      period: 4, group: 9,  category: 'transition-metal',     config: [[1,0,2],[2,0,2],[2,1,6],[3,0,2],[3,1,6],[4,0,2],[3,2,7]], nobleGasCore: '[Ar]' },
  { symbol: 'Ni', name: 'Nickel',      period: 4, group: 10, category: 'transition-metal',     config: [[1,0,2],[2,0,2],[2,1,6],[3,0,2],[3,1,6],[4,0,2],[3,2,8]], nobleGasCore: '[Ar]' },
  { symbol: 'Cu', name: 'Copper',      period: 4, group: 11, category: 'transition-metal',     config: [[1,0,2],[2,0,2],[2,1,6],[3,0,2],[3,1,6],[4,0,1],[3,2,10]], nobleGasCore: '[Ar]', isException: true, exceptionNote: 'Fully-filled d subshell is extra stable: [Ar] 3d¹⁰ 4s¹ instead of [Ar] 3d⁹ 4s²' },
  { symbol: 'Zn', name: 'Zinc',        period: 4, group: 12, category: 'transition-metal',     config: [[1,0,2],[2,0,2],[2,1,6],[3,0,2],[3,1,6],[4,0,2],[3,2,10]], nobleGasCore: '[Ar]' },
  { symbol: 'Ga', name: 'Gallium',     period: 4, group: 13, category: 'post-transition-metal',config: [[1,0,2],[2,0,2],[2,1,6],[3,0,2],[3,1,6],[4,0,2],[3,2,10],[4,1,1]], nobleGasCore: '[Ar]' },
  { symbol: 'Ge', name: 'Germanium',   period: 4, group: 14, category: 'metalloid',            config: [[1,0,2],[2,0,2],[2,1,6],[3,0,2],[3,1,6],[4,0,2],[3,2,10],[4,1,2]], nobleGasCore: '[Ar]' },
  { symbol: 'As', name: 'Arsenic',     period: 4, group: 15, category: 'metalloid',            config: [[1,0,2],[2,0,2],[2,1,6],[3,0,2],[3,1,6],[4,0,2],[3,2,10],[4,1,3]], nobleGasCore: '[Ar]' },
  { symbol: 'Se', name: 'Selenium',    period: 4, group: 16, category: 'nonmetal',             config: [[1,0,2],[2,0,2],[2,1,6],[3,0,2],[3,1,6],[4,0,2],[3,2,10],[4,1,4]], nobleGasCore: '[Ar]' },
  { symbol: 'Br', name: 'Bromine',     period: 4, group: 17, category: 'halogen',              config: [[1,0,2],[2,0,2],[2,1,6],[3,0,2],[3,1,6],[4,0,2],[3,2,10],[4,1,5]], nobleGasCore: '[Ar]' },
  { symbol: 'Kr', name: 'Krypton',     period: 4, group: 18, category: 'noble-gas',            config: [[1,0,2],[2,0,2],[2,1,6],[3,0,2],[3,1,6],[4,0,2],[3,2,10],[4,1,6]], nobleGasCore: '[Ar]' },
];

export const ELEMENTS: Element[] = elementData.map((data, index) => {
  const occupancies = occ(data.config);
  const fullConfig = configString(occupancies);

  let nobleGasConfig: string | undefined;
  if (data.nobleGasCore) {
    const coreEnd = data.nobleGasCore === '[Ne]' ? 3 : data.nobleGasCore === '[Ar]' ? 5 : 0;
    const valence = occupancies.slice(coreEnd);
    nobleGasConfig = `${data.nobleGasCore} ${configString(valence)}`;
  }

  return {
    atomicNumber: index + 1,
    symbol: data.symbol,
    name: data.name,
    electronConfig: fullConfig,
    nobleGasConfig,
    period: data.period,
    group: data.group,
    category: data.category,
    isAufbauException: data.isException ?? false,
    exceptionNote: data.exceptionNote,
  };
});

// Fallback element for out-of-range lookups (prevents render crashes)
const FALLBACK_ELEMENT: Element = {
  atomicNumber: 0,
  symbol: '?',
  name: 'Unknown',
  electronConfig: '',
  period: 0,
  group: 0,
  category: 'nonmetal',
  isAufbauException: false,
};

export function getElement(atomicNumber: number): Element {
  const el = ELEMENTS[atomicNumber - 1];
  if (!el) {
    console.warn(`[getElement] Element with Z=${atomicNumber} not found, using fallback`);
    return FALLBACK_ELEMENT;
  }
  return el;
}

export function getElementConfig(atomicNumber: number): SubshellOccupancy[] {
  const data = elementData[atomicNumber - 1];
  if (!data) {
    console.warn(`[getElementConfig] Element with Z=${atomicNumber} not found`);
    return [];
  }
  return occ(data.config);
}
