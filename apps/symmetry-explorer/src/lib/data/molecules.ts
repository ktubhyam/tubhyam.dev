import type { MoleculeData } from '@/types';

/**
 * 3D molecular geometry data for ~27 molecules covering 15 different
 * point groups (Schoenflies notation). All coordinates are idealized
 * geometries in Angstroms, centered at (or very near) the origin.
 */
export const MOLECULES: MoleculeData[] = [
  // ─── C1 ──────────────────────────────────────────────────────────
  {
    id: 'chfclbr',
    name: 'Bromochlorofluoromethane',
    formula: 'CHFClBr',
    pointGroup: 'C1',
    atoms: [
      { element: 'C',  x:  0.00,  y:  0.00,  z:  0.00 },
      { element: 'H',  x:  0.63,  y:  0.63,  z:  0.63 },  // C-H ~1.09A
      { element: 'F',  x: -0.78,  y: -0.78,  z:  0.78 },  // C-F ~1.35A
      { element: 'Cl', x: -1.02,  y:  1.02,  z: -1.02 },  // C-Cl ~1.77A
      { element: 'Br', x:  1.12,  y: -1.12,  z: -1.12 },  // C-Br ~1.94A
    ],
    bonds: [
      [0, 1], // C-H
      [0, 2], // C-F
      [0, 3], // C-Cl
      [0, 4], // C-Br
    ],
    linear: false,
  },

  // ─── Cs ──────────────────────────────────────────────────────────
  {
    id: 'hocl',
    name: 'Hypochlorous Acid',
    formula: 'HOCl',
    pointGroup: 'Cs',
    atoms: [
      { element: 'O',  x:  0.00,  y:  0.00, z: 0 },
      { element: 'H',  x: -0.69,  y:  0.73, z: 0 },
      { element: 'Cl', x:  1.69,  y:  0.00, z: 0 },
    ],
    bonds: [
      [0, 1], // O-H
      [0, 2], // O-Cl
    ],
    linear: false,
  },

  // SOCl2 — Thionyl chloride — Cs
  // Pyramidal geometry: S at origin, O along +z, two Cl atoms in xz mirror plane
  // S=O ~1.44 A, S-Cl ~2.07 A, O-S-Cl ~106°, Cl-S-Cl ~96°
  // Mirror plane is xz; the lone pair on S points in the -y direction
  {
    id: 'socl2',
    name: 'Thionyl Chloride',
    formula: 'SOCl₂',
    pointGroup: 'Cs',
    atoms: [
      { element: 'S',  x:  0.000, y:  0.000, z:  0.000 },
      { element: 'O',  x:  0.000, y:  0.863, z:  1.140 },
      { element: 'Cl', x:  1.607, y: -0.540, z: -0.574 },
      { element: 'Cl', x: -1.607, y: -0.540, z: -0.574 },
    ],
    bonds: [
      [0, 1], // S=O
      [0, 2], // S-Cl
      [0, 3], // S-Cl
    ],
    linear: false,
  },

  // ─── Ci ──────────────────────────────────────────────────────────
  // meso-1,2-dichloro-1,2-difluoroethane (anti conformation)
  // Has only an inversion center — no mirror planes, no rotation axes
  {
    id: 'meso-chclf-chclf',
    name: 'meso-1,2-Dichloro-1,2-difluoroethane',
    formula: 'CHClF-CHClF',
    pointGroup: 'Ci',
    atoms: [
      { element: 'C',  x: -0.77,  y:  0.00,  z:  0.00 },
      { element: 'C',  x:  0.77,  y:  0.00,  z:  0.00 },
      { element: 'H',  x: -1.17,  y:  1.03,  z:  0.00 },
      { element: 'H',  x:  1.17,  y: -1.03,  z:  0.00 },
      { element: 'F',  x: -1.17,  y: -0.51,  z:  0.89 },
      { element: 'F',  x:  1.17,  y:  0.51,  z: -0.89 },
      { element: 'Cl', x: -1.17,  y: -0.51,  z: -0.89 },
      { element: 'Cl', x:  1.17,  y:  0.51,  z:  0.89 },
    ],
    bonds: [
      [0, 1], // C-C
      [0, 2], // C-H
      [0, 4], // C-F
      [0, 6], // C-Cl
      [1, 3], // C-H
      [1, 5], // C-F
      [1, 7], // C-Cl
    ],
    linear: false,
  },

  // ─── C2 ──────────────────────────────────────────────────────────
  {
    id: 'h2o2',
    name: 'Hydrogen Peroxide',
    formula: 'H₂O₂',
    pointGroup: 'C2',
    atoms: [
      { element: 'O', x:  0.00, y:  0.73, z:  0.00 },
      { element: 'O', x:  0.00, y: -0.73, z:  0.00 },
      { element: 'H', x:  0.83, y:  0.95, z:  0.35 },
      { element: 'H', x: -0.83, y: -0.95, z: -0.35 },
    ],
    bonds: [
      [0, 1], // O-O
      [0, 2], // O-H
      [1, 3], // O-H
    ],
    linear: false,
  },

  // ─── C2v ─────────────────────────────────────────────────────────
  {
    id: 'water',
    name: 'Water',
    formula: 'H₂O',
    pointGroup: 'C2v',
    atoms: [
      { element: 'O', x:  0.000, y:  0.000, z:  0.117 },
      { element: 'H', x:  0.000, y:  0.757, z: -0.469 },
      { element: 'H', x:  0.000, y: -0.757, z: -0.469 },
    ],
    bonds: [
      [0, 1], // O-H
      [0, 2], // O-H
    ],
    linear: false,
  },

  {
    id: 'formaldehyde',
    name: 'Formaldehyde',
    formula: 'H₂CO',
    pointGroup: 'C2v',
    atoms: [
      { element: 'C', x:  0.000, y:  0.000, z:  0.000 },
      { element: 'O', x:  0.000, y:  0.000, z:  1.203 },
      { element: 'H', x:  0.000, y:  0.934, z: -0.587 },
      { element: 'H', x:  0.000, y: -0.934, z: -0.587 },
    ],
    bonds: [
      [0, 1], // C=O
      [0, 2], // C-H
      [0, 3], // C-H
    ],
    linear: false,
  },

  // ClF3 — Chlorine trifluoride — C2v
  // T-shaped (from trigonal bipyramidal with 2 lone pairs in equatorial)
  // Cl at origin, 2 axial F along z-axis (Cl-F ~1.70 A), 1 equatorial F along +y (Cl-F ~1.60 A)
  // C2 axis along y, molecule in yz plane
  {
    id: 'clf3',
    name: 'Chlorine Trifluoride',
    formula: 'ClF₃',
    pointGroup: 'C2v',
    atoms: [
      { element: 'Cl', x:  0.000, y:  0.000, z:  0.000 },
      { element: 'F',  x:  0.000, y:  0.000, z:  1.698 },
      { element: 'F',  x:  0.000, y:  0.000, z: -1.698 },
      { element: 'F',  x:  0.000, y:  1.598, z:  0.000 },
    ],
    bonds: [
      [0, 1], // Cl-F (axial)
      [0, 2], // Cl-F (axial)
      [0, 3], // Cl-F (equatorial)
    ],
    linear: false,
  },

  // cis-C2H2Cl2 — cis-1,2-Dichloroethylene — C2v
  // Planar in yz plane. C=C along z, H and Cl on same side.
  // C=C ~1.33 A, C-H ~1.08 A, C-Cl ~1.73 A, H-C=C ~120°, Cl-C=C ~124°
  {
    id: 'cis-c2h2cl2',
    name: 'cis-1,2-Dichloroethylene',
    formula: 'cis-C₂H₂Cl₂',
    pointGroup: 'C2v',
    atoms: [
      { element: 'C',  x:  0.000, y:  0.665, z:  0.000 },
      { element: 'C',  x:  0.000, y: -0.665, z:  0.000 },
      { element: 'H',  x:  0.000, y:  1.245, z:  0.935 },
      { element: 'H',  x:  0.000, y: -1.245, z:  0.935 },
      { element: 'Cl', x:  0.000, y:  1.465, z: -1.410 },
      { element: 'Cl', x:  0.000, y: -1.465, z: -1.410 },
    ],
    bonds: [
      [0, 1], // C=C
      [0, 2], // C-H
      [0, 4], // C-Cl
      [1, 3], // C-H
      [1, 5], // C-Cl
    ],
    linear: false,
  },

  // ─── C2h ─────────────────────────────────────────────────────────
  {
    id: 'trans-c2h2cl2',
    name: 'trans-1,2-Dichloroethylene',
    formula: 'trans-C₂H₂Cl₂',
    pointGroup: 'C2h',
    atoms: [
      { element: 'C',  x: -0.67, y:  0.00, z: 0 },
      { element: 'C',  x:  0.67, y:  0.00, z: 0 },
      { element: 'H',  x: -1.26, y:  0.93, z: 0 },
      { element: 'Cl', x: -1.73, y: -0.93, z: 0 },
      { element: 'H',  x:  1.26, y: -0.93, z: 0 },
      { element: 'Cl', x:  1.73, y:  0.93, z: 0 },
    ],
    bonds: [
      [0, 1], // C=C
      [0, 2], // C-H
      [0, 3], // C-Cl
      [1, 4], // C-H
      [1, 5], // C-Cl
    ],
    linear: false,
  },

  // ─── C3v ─────────────────────────────────────────────────────────
  {
    id: 'ammonia',
    name: 'Ammonia',
    formula: 'NH₃',
    pointGroup: 'C3v',
    atoms: [
      { element: 'N', x:  0.000, y:  0.000, z:  0.381 },
      { element: 'H', x:  0.000, y:  0.942, z: -0.127 },
      { element: 'H', x:  0.816, y: -0.471, z: -0.127 },
      { element: 'H', x: -0.816, y: -0.471, z: -0.127 },
    ],
    bonds: [
      [0, 1], // N-H
      [0, 2], // N-H
      [0, 3], // N-H
    ],
    linear: false,
  },

  {
    id: 'chloroform',
    name: 'Chloroform',
    formula: 'CHCl₃',
    pointGroup: 'C3v',
    atoms: [
      { element: 'C',  x:  0.00,  y:  0.00,  z:  0.00 },
      { element: 'H',  x:  0.00,  y:  0.00,  z:  1.07 },
      { element: 'Cl', x:  0.00,  y:  1.68,  z: -0.36 },
      { element: 'Cl', x:  1.45,  y: -0.84,  z: -0.36 },
      { element: 'Cl', x: -1.45,  y: -0.84,  z: -0.36 },
    ],
    bonds: [
      [0, 1], // C-H
      [0, 2], // C-Cl
      [0, 3], // C-Cl
      [0, 4], // C-Cl
    ],
    linear: false,
  },

  // NF3 — Nitrogen trifluoride — C3v
  // Pyramidal like NH3. N-F ~1.37 A, F-N-F ~102.2°
  // N at apex along +z, 3 F below in a cone
  {
    id: 'nf3',
    name: 'Nitrogen Trifluoride',
    formula: 'NF₃',
    pointGroup: 'C3v',
    atoms: [
      { element: 'N', x:  0.000, y:  0.000, z:  0.404 },
      { element: 'F', x:  0.000, y:  1.100, z: -0.135 },
      { element: 'F', x:  0.953, y: -0.550, z: -0.135 },
      { element: 'F', x: -0.953, y: -0.550, z: -0.135 },
    ],
    bonds: [
      [0, 1], // N-F
      [0, 2], // N-F
      [0, 3], // N-F
    ],
    linear: false,
  },

  // PCl3 — Phosphorus trichloride — C3v
  // Pyramidal. P-Cl ~2.04 A, Cl-P-Cl ~100.3°
  // P at apex along +z, 3 Cl below
  {
    id: 'pcl3',
    name: 'Phosphorus Trichloride',
    formula: 'PCl₃',
    pointGroup: 'C3v',
    atoms: [
      { element: 'P',  x:  0.000, y:  0.000, z:  0.510 },
      { element: 'Cl', x:  0.000, y:  1.634, z: -0.170 },
      { element: 'Cl', x:  1.415, y: -0.817, z: -0.170 },
      { element: 'Cl', x: -1.415, y: -0.817, z: -0.170 },
    ],
    bonds: [
      [0, 1], // P-Cl
      [0, 2], // P-Cl
      [0, 3], // P-Cl
    ],
    linear: false,
  },

  // ─── C∞v ─────────────────────────────────────────────────────────
  {
    id: 'hcn',
    name: 'Hydrogen Cyanide',
    formula: 'HCN',
    pointGroup: 'C∞v',
    atoms: [
      { element: 'H', x: 0, y: 0, z: -1.63 },
      { element: 'C', x: 0, y: 0, z: -0.56 },
      { element: 'N', x: 0, y: 0, z:  0.60 },
    ],
    bonds: [
      [0, 1], // H-C
      [1, 2], // C≡N
    ],
    linear: true,
  },

  {
    id: 'n2o',
    name: 'Nitrous Oxide',
    formula: 'N₂O',
    pointGroup: 'C∞v',
    atoms: [
      { element: 'N', x: 0, y: 0, z: -1.19 },
      { element: 'N', x: 0, y: 0, z: -0.07 },
      { element: 'O', x: 0, y: 0, z:  1.13 },
    ],
    bonds: [
      [0, 1], // N-N
      [1, 2], // N-O
    ],
    linear: true,
  },

  // ─── D∞h ─────────────────────────────────────────────────────────
  {
    id: 'co2',
    name: 'Carbon Dioxide',
    formula: 'CO₂',
    pointGroup: 'D∞h',
    atoms: [
      { element: 'C', x: 0, y: 0, z:  0.00 },
      { element: 'O', x: 0, y: 0, z:  1.16 },
      { element: 'O', x: 0, y: 0, z: -1.16 },
    ],
    bonds: [
      [0, 1], // C=O
      [0, 2], // C=O
    ],
    linear: true,
  },

  {
    id: 'acetylene',
    name: 'Acetylene',
    formula: 'C₂H₂',
    pointGroup: 'D∞h',
    atoms: [
      { element: 'C', x: 0, y: 0, z:  0.60 },
      { element: 'C', x: 0, y: 0, z: -0.60 },
      { element: 'H', x: 0, y: 0, z:  1.66 },
      { element: 'H', x: 0, y: 0, z: -1.66 },
    ],
    bonds: [
      [0, 1], // C≡C
      [0, 2], // C-H
      [1, 3], // C-H
    ],
    linear: true,
  },

  // ─── D2h ─────────────────────────────────────────────────────────
  {
    id: 'ethylene',
    name: 'Ethylene',
    formula: 'C₂H₄',
    pointGroup: 'D2h',
    atoms: [
      { element: 'C', x: -0.67, y:  0.00, z: 0 },
      { element: 'C', x:  0.67, y:  0.00, z: 0 },
      { element: 'H', x: -1.24, y:  0.93, z: 0 },
      { element: 'H', x: -1.24, y: -0.93, z: 0 },
      { element: 'H', x:  1.24, y:  0.93, z: 0 },
      { element: 'H', x:  1.24, y: -0.93, z: 0 },
    ],
    bonds: [
      [0, 1], // C=C
      [0, 2], // C-H
      [0, 3], // C-H
      [1, 4], // C-H
      [1, 5], // C-H
    ],
    linear: false,
  },

  // ─── D3h ─────────────────────────────────────────────────────────
  {
    id: 'bf3',
    name: 'Boron Trifluoride',
    formula: 'BF₃',
    pointGroup: 'D3h',
    atoms: [
      { element: 'B', x:  0.000, y:  0.000, z: 0 },
      { element: 'F', x:  0.000, y:  1.310, z: 0 },
      { element: 'F', x:  1.134, y: -0.655, z: 0 },
      { element: 'F', x: -1.134, y: -0.655, z: 0 },
    ],
    bonds: [
      [0, 1], // B-F
      [0, 2], // B-F
      [0, 3], // B-F
    ],
    linear: false,
  },

  // PF5 — Phosphorus pentafluoride — D3h
  // Trigonal bipyramidal. P at center, 3 equatorial F in xy plane at 120°
  // (P-F_eq ~1.53 A), 2 axial F along z (P-F_ax ~1.58 A)
  {
    id: 'pf5',
    name: 'Phosphorus Pentafluoride',
    formula: 'PF₅',
    pointGroup: 'D3h',
    atoms: [
      { element: 'P', x:  0.000, y:  0.000, z:  0.000 },
      // equatorial F (in xy plane, 120° apart)
      { element: 'F', x:  0.000, y:  1.534, z:  0.000 },
      { element: 'F', x:  1.328, y: -0.767, z:  0.000 },
      { element: 'F', x: -1.328, y: -0.767, z:  0.000 },
      // axial F (along z)
      { element: 'F', x:  0.000, y:  0.000, z:  1.577 },
      { element: 'F', x:  0.000, y:  0.000, z: -1.577 },
    ],
    bonds: [
      [0, 1], // P-F (eq)
      [0, 2], // P-F (eq)
      [0, 3], // P-F (eq)
      [0, 4], // P-F (ax)
      [0, 5], // P-F (ax)
    ],
    linear: false,
  },

  // SO3 — Sulfur trioxide — D3h
  // Trigonal planar. S=O ~1.42 A, O-S-O = 120°
  {
    id: 'so3',
    name: 'Sulfur Trioxide',
    formula: 'SO₃',
    pointGroup: 'D3h',
    atoms: [
      { element: 'S', x:  0.000, y:  0.000, z: 0 },
      { element: 'O', x:  0.000, y:  1.420, z: 0 },
      { element: 'O', x:  1.230, y: -0.710, z: 0 },
      { element: 'O', x: -1.230, y: -0.710, z: 0 },
    ],
    bonds: [
      [0, 1], // S=O
      [0, 2], // S=O
      [0, 3], // S=O
    ],
    linear: false,
  },

  // Cyclopropane — C3H6 — D3h
  // Equilateral triangle of C atoms in xy plane (C-C ~1.51 A, side = 1.51)
  // Each C has 2 H atoms: one above and one below the plane (C-H ~1.09 A)
  // Triangle centroid at origin, C-C = 1.51 A → circumradius = 1.51/√3 ≈ 0.872
  {
    id: 'cyclopropane',
    name: 'Cyclopropane',
    formula: 'C₃H₆',
    pointGroup: 'D3h',
    atoms: [
      // Carbon ring (circumradius ~0.872 A)
      { element: 'C', x:  0.000, y:  0.872, z:  0.000 },
      { element: 'C', x:  0.755, y: -0.436, z:  0.000 },
      { element: 'C', x: -0.755, y: -0.436, z:  0.000 },
      // H atoms on C0 (bisector direction: +y)
      { element: 'H', x:  0.000, y:  1.472, z:  0.893 },
      { element: 'H', x:  0.000, y:  1.472, z: -0.893 },
      // H atoms on C1 (bisector direction: +x, -y at 120°)
      { element: 'H', x:  1.275, y: -1.036, z:  0.893 },
      { element: 'H', x:  1.275, y: -1.036, z: -0.893 },
      // H atoms on C2 (bisector direction: -x, -y at 240°)
      { element: 'H', x: -1.275, y: -1.036, z:  0.893 },
      { element: 'H', x: -1.275, y: -1.036, z: -0.893 },
    ],
    bonds: [
      // C-C ring
      [0, 1],
      [1, 2],
      [2, 0],
      // C-H bonds
      [0, 3],
      [0, 4],
      [1, 5],
      [1, 6],
      [2, 7],
      [2, 8],
    ],
    linear: false,
  },

  // ─── D4h ─────────────────────────────────────────────────────────
  {
    id: 'xef4',
    name: 'Xenon Tetrafluoride',
    formula: 'XeF₄',
    pointGroup: 'D4h',
    atoms: [
      { element: 'Xe', x:  0.00, y:  0.00, z: 0 },
      { element: 'F',  x:  1.95, y:  0.00, z: 0 },
      { element: 'F',  x: -1.95, y:  0.00, z: 0 },
      { element: 'F',  x:  0.00, y:  1.95, z: 0 },
      { element: 'F',  x:  0.00, y: -1.95, z: 0 },
    ],
    bonds: [
      [0, 1], // Xe-F
      [0, 2], // Xe-F
      [0, 3], // Xe-F
      [0, 4], // Xe-F
    ],
    linear: false,
  },

  // ─── D6h ─────────────────────────────────────────────────────────
  {
    id: 'benzene',
    name: 'Benzene',
    formula: 'C₆H₆',
    pointGroup: 'D6h',
    atoms: [
      // Carbon ring (radius = 1.40 A)
      { element: 'C', x:  1.400, y:  0.000, z: 0 },
      { element: 'C', x:  0.700, y:  1.212, z: 0 },
      { element: 'C', x: -0.700, y:  1.212, z: 0 },
      { element: 'C', x: -1.400, y:  0.000, z: 0 },
      { element: 'C', x: -0.700, y: -1.212, z: 0 },
      { element: 'C', x:  0.700, y: -1.212, z: 0 },
      // Hydrogen ring (radius = 2.48 A)
      { element: 'H', x:  2.480, y:  0.000, z: 0 },
      { element: 'H', x:  1.240, y:  2.147, z: 0 },
      { element: 'H', x: -1.240, y:  2.147, z: 0 },
      { element: 'H', x: -2.480, y:  0.000, z: 0 },
      { element: 'H', x: -1.240, y: -2.147, z: 0 },
      { element: 'H', x:  1.240, y: -2.147, z: 0 },
    ],
    bonds: [
      // C-C ring
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 0],
      // C-H bonds
      [0, 6],
      [1, 7],
      [2, 8],
      [3, 9],
      [4, 10],
      [5, 11],
    ],
    linear: false,
  },

  // ─── Td ──────────────────────────────────────────────────────────
  {
    id: 'methane',
    name: 'Methane',
    formula: 'CH₄',
    pointGroup: 'Td',
    atoms: [
      { element: 'C', x:  0.00,  y:  0.00,  z:  0.00 },
      { element: 'H', x:  0.63,  y:  0.63,  z:  0.63 },
      { element: 'H', x: -0.63,  y: -0.63,  z:  0.63 },
      { element: 'H', x: -0.63,  y:  0.63,  z: -0.63 },
      { element: 'H', x:  0.63,  y: -0.63,  z: -0.63 },
    ],
    bonds: [
      [0, 1], // C-H
      [0, 2], // C-H
      [0, 3], // C-H
      [0, 4], // C-H
    ],
    linear: false,
  },

  // ─── Oh ──────────────────────────────────────────────────────────
  {
    id: 'sf6',
    name: 'Sulfur Hexafluoride',
    formula: 'SF₆',
    pointGroup: 'Oh',
    atoms: [
      { element: 'S', x:  0.00, y:  0.00, z:  0.00 },
      { element: 'F', x:  1.56, y:  0.00, z:  0.00 },
      { element: 'F', x: -1.56, y:  0.00, z:  0.00 },
      { element: 'F', x:  0.00, y:  1.56, z:  0.00 },
      { element: 'F', x:  0.00, y: -1.56, z:  0.00 },
      { element: 'F', x:  0.00, y:  0.00, z:  1.56 },
      { element: 'F', x:  0.00, y:  0.00, z: -1.56 },
    ],
    bonds: [
      [0, 1], // S-F
      [0, 2], // S-F
      [0, 3], // S-F
      [0, 4], // S-F
      [0, 5], // S-F
      [0, 6], // S-F
    ],
    linear: false,
  },
];

/**
 * Look up a single molecule by its unique ID slug.
 */
export function getMolecule(id: string): MoleculeData | undefined {
  return MOLECULES.find((m) => m.id === id);
}

/**
 * Return every molecule that belongs to the given point group
 * (Schoenflies symbol, e.g. "C2v", "D6h", "Td").
 */
export function getMoleculesByPointGroup(pg: string): MoleculeData[] {
  return MOLECULES.filter((m) => m.pointGroup === pg);
}
