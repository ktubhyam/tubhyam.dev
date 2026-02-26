import type { CharacterTableData, SymmetryElement } from '@/types';

/**
 * Character table data for 15 molecular point groups.
 *
 * All character values, irreducible representation labels, linear/rotational
 * functions, and quadratic functions are chemically accurate and consistent
 * with standard references (Cotton, Atkins, Harris & Bertolucci).
 *
 * These data determine IR/Raman selection rules and must not be modified
 * without careful verification against published character tables.
 */
export const CHARACTER_TABLES: Record<string, CharacterTableData> = {
  // ─────────────────────────────────────────────
  // C₁  (order 1)
  // ─────────────────────────────────────────────
  C1: {
    pointGroup: 'C1',
    order: 1,
    hasInversion: false,
    operations: [{ label: 'E', count: 1 }],
    irreps: [
      {
        label: 'A',
        characters: [1],
        linearFunctions: ['x', 'y', 'z', 'Rx', 'Ry', 'Rz'],
        quadraticFunctions: ['x\u00B2', 'y\u00B2', 'z\u00B2', 'xy', 'xz', 'yz'],
        degeneracy: 1,
      },
    ],
    symmetryElements: [],
  },

  // ─────────────────────────────────────────────
  // Cₛ  (order 2)
  // ─────────────────────────────────────────────
  Cs: {
    pointGroup: 'Cs',
    order: 2,
    hasInversion: false,
    operations: [
      { label: 'E', count: 1 },
      { label: '\u03C3\u2095', count: 1 },
    ],
    irreps: [
      {
        label: "A'",
        characters: [1, 1],
        linearFunctions: ['x', 'y', 'Rz'],
        quadraticFunctions: ['x\u00B2', 'y\u00B2', 'z\u00B2', 'xy'],
        degeneracy: 1,
      },
      {
        label: "A''",
        characters: [1, -1],
        linearFunctions: ['z', 'Rx', 'Ry'],
        quadraticFunctions: ['xz', 'yz'],
        degeneracy: 1,
      },
    ],
    symmetryElements: [
      { type: 'plane', label: '\u03C3\u2095', normal: [0, 1, 0] },
    ],
  },

  // ─────────────────────────────────────────────
  // Cᵢ  (order 2)
  // ─────────────────────────────────────────────
  Ci: {
    pointGroup: 'Ci',
    order: 2,
    hasInversion: true,
    operations: [
      { label: 'E', count: 1 },
      { label: 'i', count: 1 },
    ],
    irreps: [
      {
        label: 'Ag',
        characters: [1, 1],
        linearFunctions: ['Rx', 'Ry', 'Rz'],
        quadraticFunctions: ['x\u00B2', 'y\u00B2', 'z\u00B2', 'xy', 'xz', 'yz'],
        degeneracy: 1,
      },
      {
        label: 'Au',
        characters: [1, -1],
        linearFunctions: ['x', 'y', 'z'],
        quadraticFunctions: [],
        degeneracy: 1,
      },
    ],
    symmetryElements: [
      { type: 'center', label: 'i' },
    ],
  },

  // ─────────────────────────────────────────────
  // C₂  (order 2)
  // ─────────────────────────────────────────────
  C2: {
    pointGroup: 'C2',
    order: 2,
    hasInversion: false,
    operations: [
      { label: 'E', count: 1 },
      { label: 'C\u2082', count: 1 },
    ],
    irreps: [
      {
        label: 'A',
        characters: [1, 1],
        linearFunctions: ['z', 'Rz'],
        quadraticFunctions: ['x\u00B2', 'y\u00B2', 'z\u00B2', 'xy'],
        degeneracy: 1,
      },
      {
        label: 'B',
        characters: [1, -1],
        linearFunctions: ['x', 'y', 'Rx', 'Ry'],
        quadraticFunctions: ['xz', 'yz'],
        degeneracy: 1,
      },
    ],
    symmetryElements: [
      { type: 'axis', label: 'C\u2082', direction: [0, 1, 0], order: 2 },
    ],
  },

  // ─────────────────────────────────────────────
  // C₂ᵥ  (order 4)
  // ─────────────────────────────────────────────
  C2v: {
    pointGroup: 'C2v',
    order: 4,
    hasInversion: false,
    operations: [
      { label: 'E', count: 1 },
      { label: 'C\u2082', count: 1 },
      { label: '\u03C3\u1D65(xz)', count: 1 },
      { label: "\u03C3\u1D65'(yz)", count: 1 },
    ],
    irreps: [
      {
        label: 'A\u2081',
        characters: [1, 1, 1, 1],
        linearFunctions: ['z'],
        quadraticFunctions: ['x\u00B2', 'y\u00B2', 'z\u00B2'],
        degeneracy: 1,
      },
      {
        label: 'A\u2082',
        characters: [1, 1, -1, -1],
        linearFunctions: ['Rz'],
        quadraticFunctions: ['xy'],
        degeneracy: 1,
      },
      {
        label: 'B\u2081',
        characters: [1, -1, 1, -1],
        linearFunctions: ['x', 'Ry'],
        quadraticFunctions: ['xz'],
        degeneracy: 1,
      },
      {
        label: 'B\u2082',
        characters: [1, -1, -1, 1],
        linearFunctions: ['y', 'Rx'],
        quadraticFunctions: ['yz'],
        degeneracy: 1,
      },
    ],
    symmetryElements: [
      { type: 'axis', label: 'C\u2082', direction: [0, 1, 0], order: 2 },
      { type: 'plane', label: '\u03C3\u1D65(xz)', normal: [0, 0, 1] },
      { type: 'plane', label: "\u03C3\u1D65'(yz)", normal: [1, 0, 0] },
    ],
  },

  // ─────────────────────────────────────────────
  // C₂ₕ  (order 4)
  // ─────────────────────────────────────────────
  C2h: {
    pointGroup: 'C2h',
    order: 4,
    hasInversion: true,
    operations: [
      { label: 'E', count: 1 },
      { label: 'C\u2082', count: 1 },
      { label: 'i', count: 1 },
      { label: '\u03C3\u2095', count: 1 },
    ],
    irreps: [
      {
        label: 'Ag',
        characters: [1, 1, 1, 1],
        linearFunctions: ['Rz'],
        quadraticFunctions: ['x\u00B2', 'y\u00B2', 'z\u00B2', 'xy'],
        degeneracy: 1,
      },
      {
        label: 'Bg',
        characters: [1, -1, 1, -1],
        linearFunctions: ['Rx', 'Ry'],
        quadraticFunctions: ['xz', 'yz'],
        degeneracy: 1,
      },
      {
        label: 'Au',
        characters: [1, 1, -1, -1],
        linearFunctions: ['z'],
        quadraticFunctions: [],
        degeneracy: 1,
      },
      {
        label: 'Bu',
        characters: [1, -1, -1, 1],
        linearFunctions: ['x', 'y'],
        quadraticFunctions: [],
        degeneracy: 1,
      },
    ],
    symmetryElements: [
      { type: 'axis', label: 'C\u2082', direction: [0, 1, 0], order: 2 },
      { type: 'center', label: 'i' },
      { type: 'plane', label: '\u03C3\u2095', normal: [0, 1, 0] },
    ],
  },

  // ─────────────────────────────────────────────
  // C₃ᵥ  (order 6)
  // ─────────────────────────────────────────────
  C3v: {
    pointGroup: 'C3v',
    order: 6,
    hasInversion: false,
    operations: [
      { label: 'E', count: 1 },
      { label: '2C\u2083', count: 2 },
      { label: '3\u03C3\u1D65', count: 3 },
    ],
    irreps: [
      {
        label: 'A\u2081',
        characters: [1, 1, 1],
        linearFunctions: ['z'],
        quadraticFunctions: ['x\u00B2+y\u00B2', 'z\u00B2'],
        degeneracy: 1,
      },
      {
        label: 'A\u2082',
        characters: [1, 1, -1],
        linearFunctions: ['Rz'],
        quadraticFunctions: [],
        degeneracy: 1,
      },
      {
        label: 'E',
        characters: [2, -1, 0],
        linearFunctions: ['x', 'y', 'Rx', 'Ry'],
        quadraticFunctions: ['x\u00B2\u2212y\u00B2', 'xy', 'xz', 'yz'],
        degeneracy: 2,
      },
    ],
    symmetryElements: [
      { type: 'axis', label: 'C\u2083', direction: [0, 1, 0], order: 3 },
      { type: 'plane', label: '\u03C3\u1D65', normal: [0, 0, 1] },
      { type: 'plane', label: '\u03C3\u1D65', normal: [0.866, 0, 0.5] },
      { type: 'plane', label: '\u03C3\u1D65', normal: [-0.866, 0, 0.5] },
    ],
  },

  // ─────────────────────────────────────────────
  // D₂ₕ  (order 8)
  // ─────────────────────────────────────────────
  D2h: {
    pointGroup: 'D2h',
    order: 8,
    hasInversion: true,
    operations: [
      { label: 'E', count: 1 },
      { label: 'C\u2082(z)', count: 1 },
      { label: 'C\u2082(y)', count: 1 },
      { label: 'C\u2082(x)', count: 1 },
      { label: 'i', count: 1 },
      { label: '\u03C3(xy)', count: 1 },
      { label: '\u03C3(xz)', count: 1 },
      { label: '\u03C3(yz)', count: 1 },
    ],
    irreps: [
      {
        label: 'Ag',
        characters: [1, 1, 1, 1, 1, 1, 1, 1],
        linearFunctions: [],
        quadraticFunctions: ['x\u00B2', 'y\u00B2', 'z\u00B2'],
        degeneracy: 1,
      },
      {
        label: 'B\u2081g',
        characters: [1, 1, -1, -1, 1, 1, -1, -1],
        linearFunctions: ['Rz'],
        quadraticFunctions: ['xy'],
        degeneracy: 1,
      },
      {
        label: 'B\u2082g',
        characters: [1, -1, 1, -1, 1, -1, 1, -1],
        linearFunctions: ['Ry'],
        quadraticFunctions: ['xz'],
        degeneracy: 1,
      },
      {
        label: 'B\u2083g',
        characters: [1, -1, -1, 1, 1, -1, -1, 1],
        linearFunctions: ['Rx'],
        quadraticFunctions: ['yz'],
        degeneracy: 1,
      },
      {
        label: 'Au',
        characters: [1, 1, 1, 1, -1, -1, -1, -1],
        linearFunctions: [],
        quadraticFunctions: [],
        degeneracy: 1,
      },
      {
        label: 'B\u2081u',
        characters: [1, 1, -1, -1, -1, -1, 1, 1],
        linearFunctions: ['z'],
        quadraticFunctions: [],
        degeneracy: 1,
      },
      {
        label: 'B\u2082u',
        characters: [1, -1, 1, -1, -1, 1, -1, 1],
        linearFunctions: ['y'],
        quadraticFunctions: [],
        degeneracy: 1,
      },
      {
        label: 'B\u2083u',
        characters: [1, -1, -1, 1, -1, 1, 1, -1],
        linearFunctions: ['x'],
        quadraticFunctions: [],
        degeneracy: 1,
      },
    ],
    symmetryElements: [
      { type: 'axis', label: 'C\u2082(z)', direction: [0, 1, 0], order: 2 },
      { type: 'axis', label: 'C\u2082(y)', direction: [0, 0, 1], order: 2 },
      { type: 'axis', label: 'C\u2082(x)', direction: [1, 0, 0], order: 2 },
      { type: 'center', label: 'i' },
      { type: 'plane', label: '\u03C3(xy)', normal: [0, 1, 0] },
      { type: 'plane', label: '\u03C3(xz)', normal: [0, 0, 1] },
      { type: 'plane', label: '\u03C3(yz)', normal: [1, 0, 0] },
    ],
  },

  // ─────────────────────────────────────────────
  // D₃ₕ  (order 12)
  // ─────────────────────────────────────────────
  D3h: {
    pointGroup: 'D3h',
    order: 12,
    hasInversion: false,
    operations: [
      { label: 'E', count: 1 },
      { label: '2C\u2083', count: 2 },
      { label: '3C\u2082', count: 3 },
      { label: '\u03C3\u2095', count: 1 },
      { label: '2S\u2083', count: 2 },
      { label: '3\u03C3\u1D65', count: 3 },
    ],
    irreps: [
      {
        label: "A\u2081'",
        characters: [1, 1, 1, 1, 1, 1],
        linearFunctions: [],
        quadraticFunctions: ['x\u00B2+y\u00B2', 'z\u00B2'],
        degeneracy: 1,
      },
      {
        label: "A\u2082'",
        characters: [1, 1, -1, 1, 1, -1],
        linearFunctions: ['Rz'],
        quadraticFunctions: [],
        degeneracy: 1,
      },
      {
        label: "E'",
        characters: [2, -1, 0, 2, -1, 0],
        linearFunctions: ['x', 'y'],
        quadraticFunctions: ['x\u00B2\u2212y\u00B2', 'xy'],
        degeneracy: 2,
      },
      {
        label: "A\u2081''",
        characters: [1, 1, 1, -1, -1, -1],
        linearFunctions: [],
        quadraticFunctions: [],
        degeneracy: 1,
      },
      {
        label: "A\u2082''",
        characters: [1, 1, -1, -1, -1, 1],
        linearFunctions: ['z'],
        quadraticFunctions: [],
        degeneracy: 1,
      },
      {
        label: "E''",
        characters: [2, -1, 0, -2, 1, 0],
        linearFunctions: ['Rx', 'Ry'],
        quadraticFunctions: ['xz', 'yz'],
        degeneracy: 2,
      },
    ],
    symmetryElements: [
      { type: 'axis', label: 'C\u2083', direction: [0, 1, 0], order: 3 },
      { type: 'axis', label: 'C\u2082', direction: [1, 0, 0], order: 2 },
      { type: 'axis', label: 'C\u2082', direction: [-0.5, 0, 0.866], order: 2 },
      { type: 'axis', label: 'C\u2082', direction: [-0.5, 0, -0.866], order: 2 },
      { type: 'plane', label: '\u03C3\u2095', normal: [0, 1, 0] },
      { type: 'improper', label: 'S\u2083', direction: [0, 1, 0], order: 3 },
      { type: 'plane', label: '\u03C3\u1D65', normal: [0, 0, 1] },
      { type: 'plane', label: '\u03C3\u1D65', normal: [0.866, 0, 0.5] },
      { type: 'plane', label: '\u03C3\u1D65', normal: [-0.866, 0, 0.5] },
    ],
  },

  // ─────────────────────────────────────────────
  // D₄ₕ  (order 16)
  // ─────────────────────────────────────────────
  D4h: {
    pointGroup: 'D4h',
    order: 16,
    hasInversion: true,
    operations: [
      { label: 'E', count: 1 },
      { label: '2C\u2084', count: 2 },
      { label: 'C\u2082', count: 1 },
      { label: "2C\u2082'", count: 2 },
      { label: "2C\u2082''", count: 2 },
      { label: 'i', count: 1 },
      { label: '2S\u2084', count: 2 },
      { label: '\u03C3\u2095', count: 1 },
      { label: '2\u03C3\u1D65', count: 2 },
      { label: '2\u03C3\u1D48', count: 2 },
    ],
    irreps: [
      {
        label: 'A\u2081g',
        characters: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        linearFunctions: [],
        quadraticFunctions: ['x\u00B2+y\u00B2', 'z\u00B2'],
        degeneracy: 1,
      },
      {
        label: 'A\u2082g',
        characters: [1, 1, 1, -1, -1, 1, 1, 1, -1, -1],
        linearFunctions: ['Rz'],
        quadraticFunctions: [],
        degeneracy: 1,
      },
      {
        label: 'B\u2081g',
        characters: [1, -1, 1, 1, -1, 1, -1, 1, 1, -1],
        linearFunctions: [],
        quadraticFunctions: ['x\u00B2\u2212y\u00B2'],
        degeneracy: 1,
      },
      {
        label: 'B\u2082g',
        characters: [1, -1, 1, -1, 1, 1, -1, 1, -1, 1],
        linearFunctions: [],
        quadraticFunctions: ['xy'],
        degeneracy: 1,
      },
      {
        label: 'Eg',
        characters: [2, 0, -2, 0, 0, 2, 0, -2, 0, 0],
        linearFunctions: ['Rx', 'Ry'],
        quadraticFunctions: ['xz', 'yz'],
        degeneracy: 2,
      },
      {
        label: 'A\u2081u',
        characters: [1, 1, 1, 1, 1, -1, -1, -1, -1, -1],
        linearFunctions: [],
        quadraticFunctions: [],
        degeneracy: 1,
      },
      {
        label: 'A\u2082u',
        characters: [1, 1, 1, -1, -1, -1, -1, -1, 1, 1],
        linearFunctions: ['z'],
        quadraticFunctions: [],
        degeneracy: 1,
      },
      {
        label: 'B\u2081u',
        characters: [1, -1, 1, 1, -1, -1, 1, -1, -1, 1],
        linearFunctions: [],
        quadraticFunctions: [],
        degeneracy: 1,
      },
      {
        label: 'B\u2082u',
        characters: [1, -1, 1, -1, 1, -1, 1, -1, 1, -1],
        linearFunctions: [],
        quadraticFunctions: [],
        degeneracy: 1,
      },
      {
        label: 'Eu',
        characters: [2, 0, -2, 0, 0, -2, 0, 2, 0, 0],
        linearFunctions: ['x', 'y'],
        quadraticFunctions: [],
        degeneracy: 2,
      },
    ],
    symmetryElements: [
      { type: 'axis', label: 'C\u2084', direction: [0, 1, 0], order: 4 },
      { type: 'axis', label: 'C\u2082', direction: [0, 1, 0], order: 2 },
      { type: 'axis', label: "C\u2082'", direction: [1, 0, 0], order: 2 },
      { type: 'axis', label: "C\u2082'", direction: [0, 0, 1], order: 2 },
      { type: 'axis', label: "C\u2082''", direction: [0.707, 0, 0.707], order: 2 },
      { type: 'axis', label: "C\u2082''", direction: [0.707, 0, -0.707], order: 2 },
      { type: 'center', label: 'i' },
      { type: 'improper', label: 'S\u2084', direction: [0, 1, 0], order: 4 },
      { type: 'plane', label: '\u03C3\u2095', normal: [0, 1, 0] },
      { type: 'plane', label: '\u03C3\u1D65', normal: [1, 0, 0] },
      { type: 'plane', label: '\u03C3\u1D65', normal: [0, 0, 1] },
      { type: 'plane', label: '\u03C3\u1D48', normal: [0.707, 0, 0.707] },
      { type: 'plane', label: '\u03C3\u1D48', normal: [0.707, 0, -0.707] },
    ],
  },

  // ─────────────────────────────────────────────
  // D₆ₕ  (order 24)
  // ─────────────────────────────────────────────
  D6h: {
    pointGroup: 'D6h',
    order: 24,
    hasInversion: true,
    operations: [
      { label: 'E', count: 1 },
      { label: '2C\u2086', count: 2 },
      { label: '2C\u2083', count: 2 },
      { label: 'C\u2082', count: 1 },
      { label: "3C\u2082'", count: 3 },
      { label: "3C\u2082''", count: 3 },
      { label: 'i', count: 1 },
      { label: '2S\u2083', count: 2 },
      { label: '2S\u2086', count: 2 },
      { label: '\u03C3\u2095', count: 1 },
      { label: '3\u03C3\u1D48', count: 3 },
      { label: '3\u03C3\u1D65', count: 3 },
    ],
    irreps: [
      {
        label: 'A\u2081g',
        characters: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        linearFunctions: [],
        quadraticFunctions: ['x\u00B2+y\u00B2', 'z\u00B2'],
        degeneracy: 1,
      },
      {
        label: 'A\u2082g',
        characters: [1, 1, 1, 1, -1, -1, 1, 1, 1, 1, -1, -1],
        linearFunctions: ['Rz'],
        quadraticFunctions: [],
        degeneracy: 1,
      },
      {
        label: 'B\u2081g',
        characters: [1, -1, 1, -1, 1, -1, 1, -1, 1, -1, 1, -1],
        linearFunctions: [],
        quadraticFunctions: [],
        degeneracy: 1,
      },
      {
        label: 'B\u2082g',
        characters: [1, -1, 1, -1, -1, 1, 1, -1, 1, -1, -1, 1],
        linearFunctions: [],
        quadraticFunctions: [],
        degeneracy: 1,
      },
      {
        label: 'E\u2081g',
        characters: [2, 1, -1, -2, 0, 0, 2, 1, -1, -2, 0, 0],
        linearFunctions: ['Rx', 'Ry'],
        quadraticFunctions: ['xz', 'yz'],
        degeneracy: 2,
      },
      {
        label: 'E\u2082g',
        characters: [2, -1, -1, 2, 0, 0, 2, -1, -1, 2, 0, 0],
        linearFunctions: [],
        quadraticFunctions: ['x\u00B2\u2212y\u00B2', 'xy'],
        degeneracy: 2,
      },
      {
        label: 'A\u2081u',
        characters: [1, 1, 1, 1, 1, 1, -1, -1, -1, -1, -1, -1],
        linearFunctions: [],
        quadraticFunctions: [],
        degeneracy: 1,
      },
      {
        label: 'A\u2082u',
        characters: [1, 1, 1, 1, -1, -1, -1, -1, -1, -1, 1, 1],
        linearFunctions: ['z'],
        quadraticFunctions: [],
        degeneracy: 1,
      },
      {
        label: 'B\u2081u',
        characters: [1, -1, 1, -1, 1, -1, -1, 1, -1, 1, -1, 1],
        linearFunctions: [],
        quadraticFunctions: [],
        degeneracy: 1,
      },
      {
        label: 'B\u2082u',
        characters: [1, -1, 1, -1, -1, 1, -1, 1, -1, 1, 1, -1],
        linearFunctions: [],
        quadraticFunctions: [],
        degeneracy: 1,
      },
      {
        label: 'E\u2081u',
        characters: [2, 1, -1, -2, 0, 0, -2, -1, 1, 2, 0, 0],
        linearFunctions: ['x', 'y'],
        quadraticFunctions: [],
        degeneracy: 2,
      },
      {
        label: 'E\u2082u',
        characters: [2, -1, -1, 2, 0, 0, -2, 1, 1, -2, 0, 0],
        linearFunctions: [],
        quadraticFunctions: [],
        degeneracy: 2,
      },
    ],
    symmetryElements: [
      { type: 'axis', label: 'C\u2086', direction: [0, 1, 0], order: 6 },
      { type: 'axis', label: 'C\u2083', direction: [0, 1, 0], order: 3 },
      { type: 'axis', label: 'C\u2082', direction: [0, 1, 0], order: 2 },
      { type: 'axis', label: "C\u2082'", direction: [1, 0, 0], order: 2 },
      { type: 'axis', label: "C\u2082'", direction: [-0.5, 0, 0.866], order: 2 },
      { type: 'axis', label: "C\u2082'", direction: [-0.5, 0, -0.866], order: 2 },
      { type: 'axis', label: "C\u2082''", direction: [0.866, 0, 0.5], order: 2 },
      { type: 'axis', label: "C\u2082''", direction: [0, 0, 1], order: 2 },
      { type: 'axis', label: "C\u2082''", direction: [-0.866, 0, 0.5], order: 2 },
      { type: 'center', label: 'i' },
      { type: 'improper', label: 'S\u2083', direction: [0, 1, 0], order: 3 },
      { type: 'improper', label: 'S\u2086', direction: [0, 1, 0], order: 6 },
      { type: 'plane', label: '\u03C3\u2095', normal: [0, 1, 0] },
      { type: 'plane', label: '\u03C3\u1D65', normal: [1, 0, 0] },
      { type: 'plane', label: '\u03C3\u1D65', normal: [-0.5, 0, 0.866] },
      { type: 'plane', label: '\u03C3\u1D65', normal: [-0.5, 0, -0.866] },
      { type: 'plane', label: '\u03C3\u1D48', normal: [0.866, 0, 0.5] },
      { type: 'plane', label: '\u03C3\u1D48', normal: [0, 0, 1] },
      { type: 'plane', label: '\u03C3\u1D48', normal: [-0.866, 0, 0.5] },
    ],
  },

  // ─────────────────────────────────────────────
  // Tᵈ  (order 24)
  // ─────────────────────────────────────────────
  Td: {
    pointGroup: 'Td',
    order: 24,
    hasInversion: false,
    operations: [
      { label: 'E', count: 1 },
      { label: '8C\u2083', count: 8 },
      { label: '3C\u2082', count: 3 },
      { label: '6S\u2084', count: 6 },
      { label: '6\u03C3\u1D48', count: 6 },
    ],
    irreps: [
      {
        label: 'A\u2081',
        characters: [1, 1, 1, 1, 1],
        linearFunctions: [],
        quadraticFunctions: ['x\u00B2+y\u00B2+z\u00B2'],
        degeneracy: 1,
      },
      {
        label: 'A\u2082',
        characters: [1, 1, 1, -1, -1],
        linearFunctions: [],
        quadraticFunctions: [],
        degeneracy: 1,
      },
      {
        label: 'E',
        characters: [2, -1, 2, 0, 0],
        linearFunctions: [],
        quadraticFunctions: ['2z\u00B2\u2212x\u00B2\u2212y\u00B2', 'x\u00B2\u2212y\u00B2'],
        degeneracy: 2,
      },
      {
        label: 'T\u2081',
        characters: [3, 0, -1, 1, -1],
        linearFunctions: ['Rx', 'Ry', 'Rz'],
        quadraticFunctions: [],
        degeneracy: 3,
      },
      {
        label: 'T\u2082',
        characters: [3, 0, -1, -1, 1],
        linearFunctions: ['x', 'y', 'z'],
        quadraticFunctions: ['xy', 'xz', 'yz'],
        degeneracy: 3,
      },
    ],
    symmetryElements: [
      { type: 'axis', label: 'C\u2083', direction: [1, 1, 1], order: 3 },
      { type: 'axis', label: 'C\u2083', direction: [1, -1, -1], order: 3 },
      { type: 'axis', label: 'C\u2083', direction: [-1, 1, -1], order: 3 },
      { type: 'axis', label: 'C\u2083', direction: [-1, -1, 1], order: 3 },
      { type: 'axis', label: 'C\u2082', direction: [1, 0, 0], order: 2 },
      { type: 'axis', label: 'C\u2082', direction: [0, 1, 0], order: 2 },
      { type: 'axis', label: 'C\u2082', direction: [0, 0, 1], order: 2 },
      { type: 'improper', label: 'S\u2084', direction: [1, 0, 0], order: 4 },
      { type: 'improper', label: 'S\u2084', direction: [0, 1, 0], order: 4 },
      { type: 'improper', label: 'S\u2084', direction: [0, 0, 1], order: 4 },
      { type: 'plane', label: '\u03C3\u1D48', normal: [1, 1, 0] },
      { type: 'plane', label: '\u03C3\u1D48', normal: [1, -1, 0] },
      { type: 'plane', label: '\u03C3\u1D48', normal: [1, 0, 1] },
      { type: 'plane', label: '\u03C3\u1D48', normal: [1, 0, -1] },
      { type: 'plane', label: '\u03C3\u1D48', normal: [0, 1, 1] },
      { type: 'plane', label: '\u03C3\u1D48', normal: [0, 1, -1] },
    ],
  },

  // ─────────────────────────────────────────────
  // Oₕ  (order 48)
  // ─────────────────────────────────────────────
  Oh: {
    pointGroup: 'Oh',
    order: 48,
    hasInversion: true,
    operations: [
      { label: 'E', count: 1 },
      { label: '8C\u2083', count: 8 },
      { label: '6C\u2082', count: 6 },
      { label: '6C\u2084', count: 6 },
      { label: '3C\u2082(\u003DC\u2084\u00B2)', count: 3 },
      { label: 'i', count: 1 },
      { label: '6S\u2084', count: 6 },
      { label: '8S\u2086', count: 8 },
      { label: '3\u03C3\u2095', count: 3 },
      { label: '6\u03C3\u1D48', count: 6 },
    ],
    irreps: [
      {
        label: 'A\u2081g',
        characters: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        linearFunctions: [],
        quadraticFunctions: ['x\u00B2+y\u00B2+z\u00B2'],
        degeneracy: 1,
      },
      {
        label: 'A\u2082g',
        characters: [1, 1, -1, -1, 1, 1, -1, 1, 1, -1],
        linearFunctions: [],
        quadraticFunctions: [],
        degeneracy: 1,
      },
      {
        label: 'Eg',
        characters: [2, -1, 0, 0, 2, 2, 0, -1, 2, 0],
        linearFunctions: [],
        quadraticFunctions: ['2z\u00B2\u2212x\u00B2\u2212y\u00B2', 'x\u00B2\u2212y\u00B2'],
        degeneracy: 2,
      },
      {
        label: 'T\u2081g',
        characters: [3, 0, -1, 1, -1, 3, 1, 0, -1, -1],
        linearFunctions: ['Rx', 'Ry', 'Rz'],
        quadraticFunctions: [],
        degeneracy: 3,
      },
      {
        label: 'T\u2082g',
        characters: [3, 0, 1, -1, -1, 3, -1, 0, -1, 1],
        linearFunctions: [],
        quadraticFunctions: ['xy', 'xz', 'yz'],
        degeneracy: 3,
      },
      {
        label: 'A\u2081u',
        characters: [1, 1, 1, 1, 1, -1, -1, -1, -1, -1],
        linearFunctions: [],
        quadraticFunctions: [],
        degeneracy: 1,
      },
      {
        label: 'A\u2082u',
        characters: [1, 1, -1, -1, 1, -1, 1, -1, -1, 1],
        linearFunctions: [],
        quadraticFunctions: [],
        degeneracy: 1,
      },
      {
        label: 'Eu',
        characters: [2, -1, 0, 0, 2, -2, 0, 1, -2, 0],
        linearFunctions: [],
        quadraticFunctions: [],
        degeneracy: 2,
      },
      {
        label: 'T\u2081u',
        characters: [3, 0, -1, 1, -1, -3, -1, 0, 1, 1],
        linearFunctions: ['x', 'y', 'z'],
        quadraticFunctions: [],
        degeneracy: 3,
      },
      {
        label: 'T\u2082u',
        characters: [3, 0, 1, -1, -1, -3, 1, 0, 1, -1],
        linearFunctions: [],
        quadraticFunctions: [],
        degeneracy: 3,
      },
    ],
    symmetryElements: [
      { type: 'axis', label: 'C\u2083', direction: [1, 1, 1], order: 3 },
      { type: 'axis', label: 'C\u2083', direction: [1, -1, -1], order: 3 },
      { type: 'axis', label: 'C\u2083', direction: [-1, 1, -1], order: 3 },
      { type: 'axis', label: 'C\u2083', direction: [-1, -1, 1], order: 3 },
      { type: 'axis', label: 'C\u2082', direction: [1, 1, 0], order: 2 },
      { type: 'axis', label: 'C\u2082', direction: [1, -1, 0], order: 2 },
      { type: 'axis', label: 'C\u2082', direction: [1, 0, 1], order: 2 },
      { type: 'axis', label: 'C\u2082', direction: [1, 0, -1], order: 2 },
      { type: 'axis', label: 'C\u2082', direction: [0, 1, 1], order: 2 },
      { type: 'axis', label: 'C\u2082', direction: [0, 1, -1], order: 2 },
      { type: 'axis', label: 'C\u2084', direction: [1, 0, 0], order: 4 },
      { type: 'axis', label: 'C\u2084', direction: [0, 1, 0], order: 4 },
      { type: 'axis', label: 'C\u2084', direction: [0, 0, 1], order: 4 },
      { type: 'center', label: 'i' },
      { type: 'improper', label: 'S\u2084', direction: [1, 0, 0], order: 4 },
      { type: 'improper', label: 'S\u2084', direction: [0, 1, 0], order: 4 },
      { type: 'improper', label: 'S\u2084', direction: [0, 0, 1], order: 4 },
      { type: 'improper', label: 'S\u2086', direction: [1, 1, 1], order: 6 },
      { type: 'improper', label: 'S\u2086', direction: [1, -1, -1], order: 6 },
      { type: 'improper', label: 'S\u2086', direction: [-1, 1, -1], order: 6 },
      { type: 'improper', label: 'S\u2086', direction: [-1, -1, 1], order: 6 },
      { type: 'plane', label: '\u03C3\u2095', normal: [1, 0, 0] },
      { type: 'plane', label: '\u03C3\u2095', normal: [0, 1, 0] },
      { type: 'plane', label: '\u03C3\u2095', normal: [0, 0, 1] },
      { type: 'plane', label: '\u03C3\u1D48', normal: [1, 1, 0] },
      { type: 'plane', label: '\u03C3\u1D48', normal: [1, -1, 0] },
      { type: 'plane', label: '\u03C3\u1D48', normal: [1, 0, 1] },
      { type: 'plane', label: '\u03C3\u1D48', normal: [1, 0, -1] },
      { type: 'plane', label: '\u03C3\u1D48', normal: [0, 1, 1] },
      { type: 'plane', label: '\u03C3\u1D48', normal: [0, 1, -1] },
    ],
  },

  // ─────────────────────────────────────────────
  // C∞v  (simplified, order ∞)
  // ─────────────────────────────────────────────
  'C∞v': {
    pointGroup: 'C\u221Ev',
    order: Infinity,
    hasInversion: false,
    operations: [
      { label: 'E', count: 1 },
      { label: '2C\u221E', count: 2 },
      { label: '\u221E\u03C3\u1D65', count: Infinity },
    ],
    irreps: [
      {
        label: '\u03A3\u207A',
        characters: [1, 1, 1],
        linearFunctions: ['z'],
        quadraticFunctions: ['x\u00B2+y\u00B2', 'z\u00B2'],
        degeneracy: 1,
      },
      {
        label: '\u03A3\u207B',
        characters: [1, 1, -1],
        linearFunctions: ['Rz'],
        quadraticFunctions: [],
        degeneracy: 1,
      },
      {
        label: '\u03A0',
        characters: [2, 1, 0],
        linearFunctions: ['x', 'y', 'Rx', 'Ry'],
        quadraticFunctions: ['xz', 'yz'],
        degeneracy: 2,
      },
      {
        label: '\u0394',
        characters: [2, 0, 0],
        linearFunctions: [],
        quadraticFunctions: ['x\u00B2\u2212y\u00B2', 'xy'],
        degeneracy: 2,
      },
    ],
    symmetryElements: [
      { type: 'axis', label: 'C\u221E', direction: [0, 1, 0], order: Infinity },
      { type: 'plane', label: '\u03C3\u1D65', normal: [1, 0, 0] },
      { type: 'plane', label: '\u03C3\u1D65', normal: [0, 0, 1] },
    ],
  },

  // ─────────────────────────────────────────────
  // D∞h  (simplified, order ∞)
  // ─────────────────────────────────────────────
  'D∞h': {
    pointGroup: 'D\u221Eh',
    order: Infinity,
    hasInversion: true,
    operations: [
      { label: 'E', count: 1 },
      { label: '2C\u221E', count: 2 },
      { label: '\u221E\u03C3\u1D65', count: Infinity },
      { label: 'i', count: 1 },
      { label: '2S\u221E', count: 2 },
      { label: '\u221EC\u2082', count: Infinity },
    ],
    irreps: [
      {
        label: '\u03A3g\u207A',
        characters: [1, 1, 1, 1, 1, 1],
        linearFunctions: [],
        quadraticFunctions: ['x\u00B2+y\u00B2', 'z\u00B2'],
        degeneracy: 1,
      },
      {
        label: '\u03A3g\u207B',
        characters: [1, 1, -1, 1, 1, -1],
        linearFunctions: ['Rz'],
        quadraticFunctions: [],
        degeneracy: 1,
      },
      {
        label: '\u03A0g',
        characters: [2, 1, 0, 2, 1, 0],
        linearFunctions: ['Rx', 'Ry'],
        quadraticFunctions: ['xz', 'yz'],
        degeneracy: 2,
      },
      {
        label: '\u0394g',
        characters: [2, 0, 0, 2, 0, 0],
        linearFunctions: [],
        quadraticFunctions: ['x\u00B2\u2212y\u00B2', 'xy'],
        degeneracy: 2,
      },
      {
        label: '\u03A3u\u207A',
        characters: [1, 1, 1, -1, -1, -1],
        linearFunctions: ['z'],
        quadraticFunctions: [],
        degeneracy: 1,
      },
      {
        label: '\u03A3u\u207B',
        characters: [1, 1, -1, -1, -1, 1],
        linearFunctions: [],
        quadraticFunctions: [],
        degeneracy: 1,
      },
      {
        label: '\u03A0u',
        characters: [2, 1, 0, -2, -1, 0],
        linearFunctions: ['x', 'y'],
        quadraticFunctions: [],
        degeneracy: 2,
      },
      {
        label: '\u0394u',
        characters: [2, 0, 0, -2, 0, 0],
        linearFunctions: [],
        quadraticFunctions: [],
        degeneracy: 2,
      },
    ],
    symmetryElements: [
      { type: 'axis', label: 'C\u221E', direction: [0, 1, 0], order: Infinity },
      { type: 'plane', label: '\u03C3\u1D65', normal: [1, 0, 0] },
      { type: 'plane', label: '\u03C3\u1D65', normal: [0, 0, 1] },
      { type: 'center', label: 'i' },
      { type: 'improper', label: 'S\u221E', direction: [0, 1, 0], order: Infinity },
      { type: 'axis', label: 'C\u2082', direction: [1, 0, 0], order: 2 },
      { type: 'axis', label: 'C\u2082', direction: [0, 0, 1], order: 2 },
    ],
  },
};

/**
 * Retrieve the character table data for a given point group.
 *
 * Accepts common string representations of point groups and performs
 * normalisation to match the keys in CHARACTER_TABLES. For example,
 * "C2v", "c2v", "C_2v" will all resolve correctly.
 *
 * @param pointGroup - Schoenflies symbol of the point group (e.g. "C2v", "D6h", "Td")
 * @returns The CharacterTableData for the requested point group, or undefined if not found.
 */
export function getCharacterTable(
  pointGroup: string,
): CharacterTableData | undefined {
  // Direct lookup first
  if (CHARACTER_TABLES[pointGroup]) {
    return CHARACTER_TABLES[pointGroup];
  }

  // Try case-insensitive match and common variations
  const normalised = pointGroup
    .replace(/_/g, '')
    .replace(/infinity|inf/gi, '\u221E');

  for (const key of Object.keys(CHARACTER_TABLES)) {
    if (key.toLowerCase() === normalised.toLowerCase()) {
      return CHARACTER_TABLES[key];
    }
  }

  return undefined;
}
