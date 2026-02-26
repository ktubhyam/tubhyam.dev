/**
 * CPK coloring convention and covalent radii for chemical elements.
 * Used for consistent 3D molecule rendering throughout the app.
 */

/** Standard CPK colors keyed by element symbol */
export const ELEMENT_COLORS: Record<string, string> = {
  H: "#FFFFFF",
  C: "#333333",
  N: "#3050F8",
  O: "#FF0D0D",
  F: "#90E050",
  Cl: "#1FF01F",
  Br: "#A62929",
  S: "#FFFF30",
  P: "#FF8000",
  B: "#FFB5B5",
  Xe: "#429EB0",
  Fe: "#E06633",
};

/** Covalent radii in Angstroms, used for relative sizing in 3D rendering */
export const ELEMENT_RADII: Record<string, number> = {
  H: 0.31,
  C: 0.76,
  N: 0.71,
  O: 0.66,
  F: 0.57,
  Cl: 0.99,
  Br: 1.14,
  S: 1.05,
  P: 1.07,
  B: 0.84,
  Xe: 1.4,
  Fe: 1.32,
};

const DEFAULT_COLOR = "#CC00CC";
const DEFAULT_RADIUS = 0.77;

/**
 * Returns the CPK color for a given element symbol.
 * Falls back to magenta (#CC00CC) for unknown elements.
 */
export function getElementColor(element: string): string {
  return ELEMENT_COLORS[element] ?? DEFAULT_COLOR;
}

/**
 * Returns the covalent radius (in Angstroms) for a given element symbol.
 * Falls back to 0.77 A (carbon-like) for unknown elements.
 */
export function getElementRadius(element: string): number {
  return ELEMENT_RADII[element] ?? DEFAULT_RADIUS;
}
