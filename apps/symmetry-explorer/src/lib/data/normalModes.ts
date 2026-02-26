/**
 * Normal mode displacement vectors for key molecules in the symmetry explorer.
 *
 * Each normal mode specifies a displacement vector (dx, dy, dz) per atom,
 * in the same order as the atoms array in molecules.ts. These vectors are
 * used to animate vibrational motion in the 3D viewer.
 *
 * Conventions:
 * - Displacement vectors approximately conserve center of mass (sum of
 *   mass-weighted displacements ~ 0; equal-mass approximation used for
 *   simplicity where exact masses would over-complicate the data).
 * - Maximum displacement component is ~0.3-0.5 for good visual amplitude.
 * - For degenerate modes (E, T), each component is orthogonal.
 * - Irrep labels use Unicode to match the character table data exactly.
 */

export interface NormalMode {
  /** Irreducible representation label, e.g. "A₁", "B₂" - must match character table irrep labels */
  irrep: string;
  /** Human-readable description: "symmetric stretch", "bend", etc. */
  label: string;
  /** Approximate frequency in cm⁻¹ (for educational display) */
  frequency?: number;
  /** Displacement vector [dx, dy, dz] per atom, same order as the molecule's atoms array */
  displacements: [number, number, number][];
}

// ─── Helper constants for Unicode irrep labels ───────────────────────────────
// These must match the labels in characterTables.ts exactly.

// C2v irreps
const A1_C2V = 'A\u2081';    // A₁
const B1_C2V = 'B\u2081';    // B₁
const B2_C2V = 'B\u2082';    // B₂

// C3v irreps
const A1_C3V = 'A\u2081';    // A₁
const E_C3V = 'E';

// D3h irreps
const A1P_D3H = "A\u2081'";  // A₁'
const A2PP_D3H = "A\u2082''"; // A₂''
const EP_D3H = "E'";          // E'

// D6h irreps
const A1G_D6H = 'A\u2081g';  // A₁g
const A2U_D6H = 'A\u2082u';  // A₂u
const B2G_D6H = 'B\u2082g';  // B₂g
const E1U_D6H = 'E\u2081u';  // E₁u
const E2G_D6H = 'E\u2082g';  // E₂g

// Td irreps
const A1_TD = 'A\u2081';     // A₁
const E_TD = 'E';
const T2_TD = 'T\u2082';     // T₂

// Oh irreps
const A1G_OH = 'A\u2081g';   // A₁g
const EG_OH = 'Eg';
const T1U_OH = 'T\u2081u';   // T₁u
const T2G_OH = 'T\u2082g';   // T₂g

// C∞v irreps
const SIGMA_PLUS_CINF = '\u03A3\u207A';  // Σ⁺
const PI_CINF = '\u03A0';                // Π

// D∞h irreps
const SIGMA_G_PLUS = '\u03A3g\u207A';    // Σg⁺
const SIGMA_U_PLUS = '\u03A3u\u207A';    // Σu⁺
const PI_U = '\u03A0u';                  // Πu


export const NORMAL_MODES: Record<string, NormalMode[]> = {
  // ═══════════════════════════════════════════════════════════════════════════
  // WATER (C2v) - 3 atoms, 3 vibrational modes
  // Atoms: O(0,0,0.117), H(0,0.757,-0.469), H(0,-0.757,-0.469)
  // O-H bond direction for H1: (0, 0.757, -0.586) normalized ~ (0, 0.791, -0.612)
  // O-H bond direction for H2: (0, -0.757, -0.586) normalized ~ (0, -0.791, -0.612)
  // ═══════════════════════════════════════════════════════════════════════════
  water: [
    {
      irrep: A1_C2V,
      label: 'symmetric stretch',
      frequency: 3657,
      // Both H atoms move away from O along their respective bond directions;
      // O moves slightly to conserve center of mass.
      displacements: [
        [0, 0, -0.06],           // O: slight downward compensation
        [0, 0.35, -0.27],        // H1: along +y, -z (away from O)
        [0, -0.35, -0.27],       // H2: along -y, -z (away from O)
      ],
    },
    {
      irrep: A1_C2V,
      label: 'bend',
      frequency: 1595,
      // H-O-H angle opens and closes. H atoms move in y (toward/away from each other).
      // O compensates with z motion to conserve center of mass.
      displacements: [
        [0, 0, 0.10],            // O: moves up slightly
        [0, -0.40, -0.15],       // H1: moves toward -y (closing angle) and slightly down
        [0, 0.40, -0.15],        // H2: moves toward +y (closing angle) and slightly down
      ],
    },
    {
      irrep: B2_C2V,
      label: 'asymmetric stretch',
      frequency: 3756,
      // One H moves away from O while the other moves toward O.
      // This mode has B2 symmetry (antisymmetric w.r.t. xz plane).
      displacements: [
        [0, 0.08, 0],            // O: compensates in y
        [0, 0.35, -0.27],        // H1: stretches away from O
        [0, 0.35, 0.27],         // H2: compresses toward O
      ],
    },
  ],

  // ═══════════════════════════════════════════════════════════════════════════
  // CO2 (D∞h) - 3 atoms, 4 vibrational modes (3N-5 = 4 for linear)
  // Atoms: C(0,0,0), O(0,0,1.16), O(0,0,-1.16)
  // Molecule is along z-axis in molecules.ts
  // ═══════════════════════════════════════════════════════════════════════════
  co2: [
    {
      irrep: SIGMA_G_PLUS,
      label: 'symmetric stretch (Raman active)',
      frequency: 1388,
      // Both O atoms move outward along z; C stays still (by symmetry).
      displacements: [
        [0, 0, 0],               // C: stationary
        [0, 0, 0.40],            // O1 (+z): moves further out
        [0, 0, -0.40],           // O2 (-z): moves further out
      ],
    },
    {
      irrep: PI_U,
      label: 'bend (in y)',
      frequency: 667,
      // C moves in +y, both O atoms move in -y. Degenerate pair component 1.
      displacements: [
        [0, 0.50, 0],            // C: moves +y
        [0, -0.25, 0],           // O1: moves -y
        [0, -0.25, 0],           // O2: moves -y
      ],
    },
    {
      irrep: PI_U,
      label: 'bend (in x)',
      frequency: 667,
      // Same as above but in x. Degenerate pair component 2.
      displacements: [
        [0.50, 0, 0],            // C: moves +x
        [-0.25, 0, 0],           // O1: moves -x
        [-0.25, 0, 0],           // O2: moves -x
      ],
    },
    {
      irrep: SIGMA_U_PLUS,
      label: 'asymmetric stretch (IR active)',
      frequency: 2349,
      // One O moves out while the other moves in; C compensates.
      displacements: [
        [0, 0, -0.50],           // C: moves toward O2
        [0, 0, 0.25],            // O1: moves out (+z)
        [0, 0, 0.25],            // O2: moves in (toward C, +z direction from -z side)
      ],
    },
  ],

  // ═══════════════════════════════════════════════════════════════════════════
  // AMMONIA (C3v) - 4 atoms, 6 vibrational modes
  // Atoms: N(0,0,0.381), H(0,0.942,-0.127), H(0.816,-0.471,-0.127), H(-0.816,-0.471,-0.127)
  // N sits above the H plane along +z
  // H1 is at 90° (along +y), H2 at 330° (+x,-y), H3 at 210° (-x,-y)
  // ═══════════════════════════════════════════════════════════════════════════
  ammonia: [
    {
      irrep: A1_C3V,
      label: 'symmetric stretch',
      frequency: 3337,
      // All 3 H atoms move radially away from N; N compensates along z.
      // H1 radial direction: (0, 0.942, -0.508)/|...| ~ (0, 0.880, -0.474)
      // H2 radial direction: (0.816, -0.471, -0.508)/|...| ~ (0.762, -0.440, -0.474)
      // H3 radial direction: (-0.816, -0.471, -0.508)/|...| ~ (-0.762, -0.440, -0.474)
      displacements: [
        [0, 0, -0.40],           // N: moves down to compensate
        [0, 0.35, -0.19],        // H1: radially outward
        [0.30, -0.18, -0.19],    // H2: radially outward
        [-0.30, -0.18, -0.19],   // H3: radially outward
      ],
    },
    {
      irrep: A1_C3V,
      label: 'umbrella (inversion)',
      frequency: 950,
      // N moves up, all H atoms move down. Classic umbrella/inversion mode.
      displacements: [
        [0, 0, 0.40],            // N: moves up (+z)
        [0, 0, -0.40],           // H1: moves down (-z)
        [0, 0, -0.40],           // H2: moves down
        [0, 0, -0.40],           // H3: moves down
      ],
    },
    {
      irrep: E_C3V,
      label: 'asymmetric stretch (a)',
      frequency: 3444,
      // E mode component a: H1 stretches out while H2 and H3 compress.
      // Breaks 3-fold symmetry. H1 gets full displacement, H2 and H3 get -1/2.
      displacements: [
        [0, -0.10, 0],           // N: compensates
        [0, 0.45, -0.10],        // H1: stretches away (+y)
        [0.10, -0.15, -0.10],    // H2: compresses
        [-0.10, -0.15, -0.10],   // H3: compresses
      ],
    },
    {
      irrep: E_C3V,
      label: 'asymmetric stretch (b)',
      frequency: 3444,
      // E mode component b: orthogonal to (a). H2 and H3 move oppositely in x.
      // H1 stationary, H2 stretches, H3 compresses (or vice versa).
      displacements: [
        [0.07, 0, 0],            // N: compensates in x
        [0, 0, 0],               // H1: stationary (node)
        [0.35, -0.20, -0.10],    // H2: stretches away
        [-0.35, 0.20, 0.10],     // H3: compresses toward
      ],
    },
    {
      irrep: E_C3V,
      label: 'asymmetric bend (a)',
      frequency: 1627,
      // E mode component a: scissors-like angular deformation.
      // H1 moves one way, H2+H3 move opposite way laterally.
      displacements: [
        [0, 0.10, 0],            // N: slight compensation
        [0, -0.40, 0],           // H1: moves toward -y
        [-0.10, 0.20, 0],        // H2: moves toward +y region
        [0.10, 0.20, 0],         // H3: moves toward +y region
      ],
    },
    {
      irrep: E_C3V,
      label: 'asymmetric bend (b)',
      frequency: 1627,
      // E mode component b: orthogonal angular deformation.
      // H2 and H3 move in opposite x directions.
      displacements: [
        [-0.07, 0, 0],           // N: slight compensation
        [0, 0, 0],               // H1: stationary (node)
        [0.35, 0.20, 0],         // H2: moves in +x
        [-0.35, -0.20, 0],       // H3: moves in -x (opposite)
      ],
    },
  ],

  // ═══════════════════════════════════════════════════════════════════════════
  // METHANE (Td) - 5 atoms, 9 vibrational modes
  // Atoms: C(0,0,0), H1(0.63,0.63,0.63), H2(-0.63,-0.63,0.63),
  //        H3(-0.63,0.63,-0.63), H4(0.63,-0.63,-0.63)
  // Tetrahedral arrangement: H atoms at alternating vertices of a cube
  // ═══════════════════════════════════════════════════════════════════════════
  methane: [
    {
      irrep: A1_TD,
      label: 'symmetric stretch',
      frequency: 2917,
      // All 4 H atoms move radially outward from C; C stays still (by symmetry).
      // Each H direction is along its position vector (normalized).
      // (0.63,0.63,0.63)/|(0.63,0.63,0.63)| = (1,1,1)/sqrt(3) ~ (0.577,0.577,0.577)
      // Scale to ~0.33 per component.
      displacements: [
        [0, 0, 0],                     // C: stationary
        [0.33, 0.33, 0.33],            // H1: radially out along (1,1,1)
        [-0.33, -0.33, 0.33],          // H2: radially out along (-1,-1,1)
        [-0.33, 0.33, -0.33],          // H3: radially out along (-1,1,-1)
        [0.33, -0.33, -0.33],          // H4: radially out along (1,-1,-1)
      ],
    },
    {
      irrep: E_TD,
      label: 'bend (a)',
      frequency: 1534,
      // E mode component a: corresponds to (2z^2 - x^2 - y^2) distortion.
      // Opposite pairs compress/stretch. "Breathing" that breaks cubic symmetry.
      // Under this distortion: z-axis pairs move out, x/y-axis pairs move in.
      // H1(+,+,+) and H2(-,-,+): z>0, move +z. H3(-,+,-) and H4(+,-,-): z<0, move -z.
      // But it's an angle bend not a stretch, so motion is tangential.
      // For 2z^2-x^2-y^2: displacements proportional to (−x, −y, 2z) per H.
      displacements: [
        [0, 0, 0],                     // C: stationary
        [-0.20, -0.20, 0.40],          // H1: (-x,-y,2z) scaled
        [0.20, 0.20, 0.40],            // H2: (-(-1),-(-1),2(1)) -> (+,+,2) scaled
        [0.20, -0.20, -0.40],          // H3: (-(-1),(1),2(-1)) -> (+,-,-2) scaled
        [-0.20, 0.20, -0.40],          // H4: (-(1),-(-1),2(-1)) -> (-,+,-2) scaled
      ],
    },
    {
      irrep: E_TD,
      label: 'bend (b)',
      frequency: 1534,
      // E mode component b: corresponds to (x^2 - y^2) distortion, orthogonal to (a).
      // Displacements proportional to (x, -y, 0) per H.
      displacements: [
        [0, 0, 0],                     // C: stationary
        [0.35, -0.35, 0],              // H1: (x,-y,0) = (+,−,0)
        [-0.35, 0.35, 0],              // H2: (-,+,0)
        [-0.35, -0.35, 0],             // H3: (-,-,0)
        [0.35, 0.35, 0],               // H4: (+,+,0)
      ],
    },
    {
      irrep: T2_TD,
      label: 'asymmetric stretch (x)',
      frequency: 3019,
      // T2 mode component along x: transforms as x under Td.
      // C moves in +x, H atoms move to create a net dipole along x.
      // H1(+,+,+) and H4(+,-,-) have +x component → move -x (compress).
      // H2(-,-,+) and H3(-,+,-) have -x component → move +x (stretch).
      // C compensates for center of mass.
      displacements: [
        [-0.40, 0, 0],                 // C: moves -x
        [0.25, 0, 0],                  // H1: +x
        [-0.25, 0, 0],                 // H2: -x
        [-0.25, 0, 0],                 // H3: -x
        [0.25, 0, 0],                  // H4: +x
      ],
    },
    {
      irrep: T2_TD,
      label: 'asymmetric stretch (y)',
      frequency: 3019,
      // T2 mode component along y: same pattern but along y.
      displacements: [
        [0, -0.40, 0],                 // C: moves -y
        [0, 0.25, 0],                  // H1: +y
        [0, -0.25, 0],                 // H2: -y
        [0, 0.25, 0],                  // H3: +y
        [0, -0.25, 0],                 // H4: -y
      ],
    },
    {
      irrep: T2_TD,
      label: 'asymmetric stretch (z)',
      frequency: 3019,
      // T2 mode component along z: same pattern but along z.
      displacements: [
        [0, 0, -0.40],                 // C: moves -z
        [0, 0, 0.25],                  // H1: +z
        [0, 0, 0.25],                  // H2: +z
        [0, 0, -0.25],                 // H3: -z
        [0, 0, -0.25],                 // H4: -z
      ],
    },
    {
      irrep: T2_TD,
      label: 'asymmetric bend (x)',
      frequency: 1306,
      // T2 bend component x: angular deformation creating dipole along x.
      // Tangential displacements (perpendicular to radial direction).
      // For the bend, H atoms move tangentially to rearrange angles.
      displacements: [
        [0.10, 0, 0],                  // C: slight compensation
        [0, -0.25, 0.25],              // H1: tangential motion in yz
        [0, 0.25, 0.25],               // H2: tangential motion
        [0, -0.25, -0.25],             // H3: tangential motion
        [0, 0.25, -0.25],              // H4: tangential motion
      ],
    },
    {
      irrep: T2_TD,
      label: 'asymmetric bend (y)',
      frequency: 1306,
      // T2 bend component y.
      displacements: [
        [0, 0.10, 0],                  // C: slight compensation
        [0.25, 0, -0.25],              // H1
        [-0.25, 0, -0.25],             // H2
        [0.25, 0, 0.25],               // H3
        [-0.25, 0, 0.25],              // H4
      ],
    },
    {
      irrep: T2_TD,
      label: 'asymmetric bend (z)',
      frequency: 1306,
      // T2 bend component z.
      displacements: [
        [0, 0, 0.10],                  // C: slight compensation
        [-0.25, 0.25, 0],              // H1
        [0.25, -0.25, 0],              // H2
        [-0.25, -0.25, 0],             // H3
        [0.25, 0.25, 0],               // H4
      ],
    },
  ],

  // ═══════════════════════════════════════════════════════════════════════════
  // BENZENE (D6h) - 12 atoms, 30 vibrational modes (showing 5 key modes)
  // Atoms: C0(1.40,0,0), C1(0.70,1.212,0), C2(-0.70,1.212,0),
  //        C3(-1.40,0,0), C4(-0.70,-1.212,0), C5(0.70,-1.212,0),
  //        H6(2.48,0,0), H7(1.24,2.147,0), H8(-1.24,2.147,0),
  //        H9(-2.48,0,0), H10(-1.24,-2.147,0), H11(1.24,-2.147,0)
  // All atoms in xy-plane (z=0). C at angles 0,60,120,180,240,300 degrees.
  // ═══════════════════════════════════════════════════════════════════════════
  benzene: [
    {
      irrep: A1G_D6H,
      label: 'breathing mode (Raman active)',
      frequency: 993,
      // All C-C bonds expand/contract together. C atoms move radially.
      // H atoms move radially in the same direction (ring breathing).
      // Radial directions for C_i at angle theta: (cos(theta), sin(theta), 0)
      // C0: (1,0,0), C1: (0.5,0.866,0), C2: (-0.5,0.866,0), etc.
      displacements: [
        [0.30, 0, 0],                 // C0: radial out at 0°
        [0.15, 0.26, 0],              // C1: radial out at 60°
        [-0.15, 0.26, 0],             // C2: radial out at 120°
        [-0.30, 0, 0],                // C3: radial out at 180°
        [-0.15, -0.26, 0],            // C4: radial out at 240°
        [0.15, -0.26, 0],             // C5: radial out at 300°
        [0.35, 0, 0],                 // H6: radial out at 0°
        [0.175, 0.303, 0],            // H7: radial out at 60°
        [-0.175, 0.303, 0],           // H8: radial out at 120°
        [-0.35, 0, 0],                // H9: radial out at 180°
        [-0.175, -0.303, 0],          // H10: radial out at 240°
        [0.175, -0.303, 0],           // H11: radial out at 300°
      ],
    },
    {
      irrep: A2U_D6H,
      label: 'out-of-plane C-H bend (IR active)',
      frequency: 674,
      // All C-H bonds bend out of plane together. H atoms move in +z,
      // C atoms move in -z to compensate.
      displacements: [
        [0, 0, -0.10],                // C0
        [0, 0, -0.10],                // C1
        [0, 0, -0.10],                // C2
        [0, 0, -0.10],                // C3
        [0, 0, -0.10],                // C4
        [0, 0, -0.10],                // C5
        [0, 0, 0.40],                 // H6
        [0, 0, 0.40],                 // H7
        [0, 0, 0.40],                 // H8
        [0, 0, 0.40],                 // H9
        [0, 0, 0.40],                 // H10
        [0, 0, 0.40],                 // H11
      ],
    },
    {
      irrep: E1U_D6H,
      label: 'asymmetric C-C stretch (IR active)',
      frequency: 1484,
      // E1u mode: one component of the doubly-degenerate C-C stretching mode.
      // Alternating pattern with dipole moment along x.
      // Pairs of C atoms on opposite sides move in opposite x directions.
      displacements: [
        [0, 0.30, 0],                 // C0: tangential at 0°
        [0.26, 0.15, 0],              // C1: tangential at 60°
        [0.26, -0.15, 0],             // C2: tangential at 120°
        [0, -0.30, 0],                // C3: tangential at 180°
        [-0.26, -0.15, 0],            // C4: tangential at 240°
        [-0.26, 0.15, 0],             // C5: tangential at 300°
        [0, 0.15, 0],                 // H6: follows C0
        [0.13, 0.075, 0],             // H7: follows C1
        [0.13, -0.075, 0],            // H8: follows C2
        [0, -0.15, 0],                // H9: follows C3
        [-0.13, -0.075, 0],           // H10: follows C4
        [-0.13, 0.075, 0],            // H11: follows C5
      ],
    },
    {
      irrep: E2G_D6H,
      label: 'quadrant stretch (Raman active)',
      frequency: 1596,
      // E2g mode: C-C stretching with quadrupolar pattern (Raman active).
      // Adjacent C-C bonds alternately stretch and compress in a cos(2*theta) pattern.
      // Radial displacements proportional to cos(2*angle).
      // C0(0°): cos(0)=1, C1(60°): cos(120°)=-0.5, C2(120°): cos(240°)=-0.5
      // C3(180°): cos(360°)=1, C4(240°): cos(480°)=-0.5, C5(300°): cos(600°)=-0.5
      displacements: [
        [0.35, 0, 0],                 // C0: radially out (cos2*0 = 1)
        [-0.088, -0.152, 0],          // C1: radially in (cos2*60 = -0.5)
        [0.088, -0.152, 0],           // C2: radially in
        [-0.35, 0, 0],                // C3: radially out (cos2*180 = 1, but at 180° radial is -x)
        [0.088, 0.152, 0],            // C4: radially in
        [-0.088, 0.152, 0],           // C5: radially in
        [0.20, 0, 0],                 // H6: follows C0 pattern
        [-0.05, -0.087, 0],           // H7: follows C1 pattern
        [0.05, -0.087, 0],            // H8: follows C2 pattern
        [-0.20, 0, 0],                // H9: follows C3 pattern
        [0.05, 0.087, 0],             // H10: follows C4 pattern
        [-0.05, 0.087, 0],            // H11: follows C5 pattern
      ],
    },
    {
      irrep: B2G_D6H,
      label: 'Kekul\u00E9 mode',
      frequency: 1310,
      // B2g: alternating short/long C-C bonds (Kekule structure oscillation).
      // Adjacent C atoms move toward or away from each other alternately.
      // Tangential displacements with alternating sign: C_i moves tangentially
      // by (-1)^i amount. No net translation or rotation.
      displacements: [
        [0, 0.30, 0],                 // C0: tangential + at 0°
        [-0.26, -0.15, 0],            // C1: tangential - at 60°
        [0.26, -0.15, 0],             // C2: tangential + at 120°
        [0, 0.30, 0],                 // C3: tangential - at 180° (reversed: tangent at 180° is (0,-1), so -(0,-1)=(0,1))
        [-0.26, -0.15, 0],            // C4: tangential + at 240°
        [0.26, -0.15, 0],             // C5: tangential - at 300°
        [0, 0, 0],                    // H6: minimal motion (C-C mode)
        [0, 0, 0],                    // H7
        [0, 0, 0],                    // H8
        [0, 0, 0],                    // H9
        [0, 0, 0],                    // H10
        [0, 0, 0],                    // H11
      ],
    },
  ],

  // ═══════════════════════════════════════════════════════════════════════════
  // BF3 (D3h) - 4 atoms, 6 vibrational modes
  // Atoms: B(0,0,0), F1(0,1.310,0), F2(1.134,-0.655,0), F3(-1.134,-0.655,0)
  // Trigonal planar in xy-plane. F1 along +y, F2 at 330°, F3 at 210°.
  // ═══════════════════════════════════════════════════════════════════════════
  bf3: [
    {
      irrep: A1P_D3H,
      label: 'symmetric stretch (Raman active)',
      frequency: 888,
      // All F atoms move radially outward; B stays still (by symmetry).
      displacements: [
        [0, 0, 0],                    // B: stationary
        [0, 0.40, 0],                 // F1: radially out along +y
        [0.346, -0.20, 0],            // F2: radially out at 330° (cos330°, sin330°)
        [-0.346, -0.20, 0],           // F3: radially out at 210° (cos210°, sin210°)
      ],
    },
    {
      irrep: A2PP_D3H,
      label: 'out-of-plane bend (IR active)',
      frequency: 719,
      // B moves out of plane (+z), F atoms stay or move -z. Classic umbrella mode
      // for planar molecule. Since B is much lighter effect, B moves more.
      displacements: [
        [0, 0, 0.50],                 // B: moves up out of plane
        [0, 0, -0.17],               // F1: moves down
        [0, 0, -0.17],               // F2: moves down
        [0, 0, -0.17],               // F3: moves down
      ],
    },
    {
      irrep: EP_D3H,
      label: 'asymmetric stretch (a)',
      frequency: 1453,
      // E' mode component a: F1 moves out while F2,F3 move in.
      // Breaks 3-fold symmetry. Creates dipole along +y.
      displacements: [
        [0, -0.15, 0],                // B: compensates in -y
        [0, 0.45, 0],                 // F1: moves out along +y
        [0.10, -0.15, 0],             // F2: moves in (toward B)
        [-0.10, -0.15, 0],            // F3: moves in
      ],
    },
    {
      irrep: EP_D3H,
      label: 'asymmetric stretch (b)',
      frequency: 1453,
      // E' mode component b (orthogonal to a): F2 and F3 move in opposite
      // x-directions, F1 stays still. Creates dipole along x.
      displacements: [
        [0.10, 0, 0],                 // B: compensates in +x
        [0, 0, 0],                    // F1: stationary (node along y-axis)
        [0.35, 0.20, 0],              // F2: moves in +x, slight +y
        [-0.35, 0.20, 0],             // F3: moves in -x, slight +y
      ],
    },
    {
      irrep: EP_D3H,
      label: 'in-plane bend (a)',
      frequency: 480,
      // E' bend component a: angular deformation in xy plane.
      // F1 moves tangentially, F2/F3 move to change angles.
      displacements: [
        [0, 0.10, 0],                 // B: slight compensation
        [0, -0.40, 0],                // F1: moves toward -y (tangential = along x, but bend means radial component)
        [-0.10, 0.20, 0],             // F2: tangential motion
        [0.10, 0.20, 0],              // F3: tangential motion
      ],
    },
    {
      irrep: EP_D3H,
      label: 'in-plane bend (b)',
      frequency: 480,
      // E' bend component b: orthogonal angular deformation.
      displacements: [
        [-0.07, 0, 0],                // B: slight compensation
        [0, 0, 0],                    // F1: node
        [0.35, 0.20, 0],              // F2: tangential
        [-0.35, -0.20, 0],            // F3: opposite tangential
      ],
    },
  ],

  // ═══════════════════════════════════════════════════════════════════════════
  // SF6 (Oh) - 7 atoms, 15 vibrational modes (showing 4 key modes)
  // Atoms: S(0,0,0), F1(1.56,0,0), F2(-1.56,0,0),
  //        F3(0,1.56,0), F4(0,-1.56,0), F5(0,0,1.56), F6(0,0,-1.56)
  // ═══════════════════════════════════════════════════════════════════════════
  sf6: [
    {
      irrep: A1G_OH,
      label: 'breathing mode (Raman active)',
      frequency: 775,
      // All 6 F atoms move radially outward simultaneously; S stays still.
      displacements: [
        [0, 0, 0],                    // S: stationary
        [0.40, 0, 0],                 // F1: +x
        [-0.40, 0, 0],               // F2: -x
        [0, 0.40, 0],                 // F3: +y
        [0, -0.40, 0],               // F4: -y
        [0, 0, 0.40],                 // F5: +z
        [0, 0, -0.40],               // F6: -z
      ],
    },
    {
      irrep: T1U_OH,
      label: 'asymmetric stretch (x, IR active)',
      frequency: 939,
      // T1u component x: F atoms along x-axis move one way, S compensates.
      // Creates dipole along x. The F on +x moves +x, F on -x moves +x,
      // S moves -x to compensate. (Asymmetric: both F move same direction.)
      displacements: [
        [-0.35, 0, 0],                // S: moves -x
        [0.40, 0, 0],                 // F1(+x): moves further +x
        [0.40, 0, 0],                 // F2(-x): moves toward +x
        [0, 0, 0],                    // F3: stationary
        [0, 0, 0],                    // F4: stationary
        [0, 0, 0],                    // F5: stationary
        [0, 0, 0],                    // F6: stationary
      ],
    },
    {
      irrep: EG_OH,
      label: 'stretch (Raman active)',
      frequency: 643,
      // Eg mode component a: corresponds to 2z^2 - x^2 - y^2 distortion.
      // F along z move out, F along x and y move in.
      // 2-fold degenerate; this is one component.
      displacements: [
        [0, 0, 0],                    // S: stationary
        [-0.25, 0, 0],               // F1: moves in (-x)
        [0.25, 0, 0],                 // F2: moves in (+x)
        [0, -0.25, 0],               // F3: moves in (-y)
        [0, 0.25, 0],                 // F4: moves in (+y)
        [0, 0, 0.50],                 // F5: moves out (+z)
        [0, 0, -0.50],               // F6: moves out (-z)
      ],
    },
    {
      irrep: T2G_OH,
      label: 'bend (Raman active)',
      frequency: 615,
      // T2g component: angular deformation. Adjacent F atoms move toward
      // each other in the plane they share. This component has xy character.
      // F atoms in x and y planes scissor.
      displacements: [
        [0, 0, 0],                    // S: stationary
        [0, 0.30, 0],                 // F1(+x): moves +y (scissors in xy plane)
        [0, -0.30, 0],               // F2(-x): moves -y
        [0.30, 0, 0],                 // F3(+y): moves +x
        [-0.30, 0, 0],               // F4(-y): moves -x
        [0, 0, 0],                    // F5: stationary (in z)
        [0, 0, 0],                    // F6: stationary (in z)
      ],
    },
  ],

  // ═══════════════════════════════════════════════════════════════════════════
  // FORMALDEHYDE (C2v) - 4 atoms, 6 vibrational modes
  // Atoms: C(0,0,0), O(0,0,1.203), H1(0,0.934,-0.587), H2(0,-0.934,-0.587)
  // Molecule in yz-plane. C2 axis along z. C=O along +z, H atoms below.
  // ═══════════════════════════════════════════════════════════════════════════
  formaldehyde: [
    {
      irrep: A1_C2V,
      label: 'C=O stretch',
      frequency: 1746,
      // C and O move apart along z; H atoms compensate slightly.
      displacements: [
        [0, 0, -0.30],                // C: moves down (-z)
        [0, 0, 0.40],                 // O: moves up (+z)
        [0, 0, -0.05],                // H1: slight compensation
        [0, 0, -0.05],                // H2: slight compensation
      ],
    },
    {
      irrep: A1_C2V,
      label: 'CH symmetric stretch',
      frequency: 2783,
      // Both H atoms move away from C along their bond directions symmetrically.
      // H1 bond direction: (0, 0.934, -0.587), H2: (0, -0.934, -0.587)
      displacements: [
        [0, 0, 0.15],                 // C: compensates up
        [0, 0, 0.02],                 // O: minimal motion
        [0, 0.35, -0.22],             // H1: along +y, -z
        [0, -0.35, -0.22],            // H2: along -y, -z
      ],
    },
    {
      irrep: A1_C2V,
      label: 'CH\u2082 scissors',
      frequency: 1500,
      // H-C-H angle changes. H atoms move in y (closing/opening angle).
      displacements: [
        [0, 0, 0.05],                 // C: slight z compensation
        [0, 0, 0],                    // O: minimal motion
        [0, -0.40, -0.10],            // H1: moves toward -y (closing)
        [0, 0.40, -0.10],             // H2: moves toward +y (closing)
      ],
    },
    {
      irrep: B1_C2V,
      label: 'CH\u2082 rock',
      frequency: 1167,
      // Both H atoms rock in the same x direction (out of molecular plane).
      // B1 symmetry: symmetric w.r.t. xz, antisymmetric w.r.t. yz.
      // Actually for C2v in yz plane, B1 involves x-displacement.
      displacements: [
        [0.10, 0, 0],                 // C: compensates
        [0.05, 0, 0],                 // O: slight compensation
        [-0.30, 0, 0],                // H1: moves -x
        [-0.30, 0, 0],                // H2: moves -x (same direction for rock)
      ],
    },
    {
      irrep: B2_C2V,
      label: 'CH asymmetric stretch',
      frequency: 2843,
      // One H moves away while other moves toward C. B2 symmetry.
      displacements: [
        [0, 0.08, 0],                 // C: compensates in y
        [0, 0, 0],                    // O: minimal motion
        [0, 0.35, -0.22],             // H1: stretches away
        [0, 0.35, 0.22],              // H2: compresses toward
      ],
    },
    {
      irrep: B1_C2V,
      label: 'CH\u2082 wag (out-of-plane)',
      frequency: 1249,
      // H atoms wag out of the molecular plane in opposite directions relative
      // to their position. Both H move in +x while C moves -x.
      // This is the out-of-plane wagging motion.
      displacements: [
        [-0.15, 0, 0],                // C: compensates in -x
        [0, 0, 0],                    // O: minimal motion
        [0.40, 0, 0],                 // H1: +x (out of yz plane)
        [0.40, 0, 0],                 // H2: +x (same direction = wag, not twist)
      ],
    },
  ],

  // ═══════════════════════════════════════════════════════════════════════════
  // HCN (C∞v) - 3 atoms, 4 vibrational modes (3N-5 = 4 for linear)
  // Atoms: H(0,0,-1.63), C(0,0,-0.56), N(0,0,0.60)
  // Linear molecule along z-axis. H---C≡N
  // ═══════════════════════════════════════════════════════════════════════════
  hcn: [
    {
      irrep: SIGMA_PLUS_CINF,
      label: 'C-H stretch',
      frequency: 3311,
      // H moves away from C along -z; C and N compensate.
      displacements: [
        [0, 0, -0.45],                // H: moves -z (away from C)
        [0, 0, 0.25],                 // C: moves +z (toward N slightly)
        [0, 0, 0.05],                 // N: slight compensation
      ],
    },
    {
      irrep: SIGMA_PLUS_CINF,
      label: 'C\u2261N stretch',
      frequency: 2097,
      // C and N move apart; H moves with C to conserve center of mass.
      displacements: [
        [0, 0, -0.10],                // H: moves with C
        [0, 0, -0.30],                // C: moves -z (toward H)
        [0, 0, 0.40],                 // N: moves +z (away from C)
      ],
    },
    {
      irrep: PI_CINF,
      label: 'bend (in y)',
      frequency: 712,
      // Bending in the yz plane. C moves one way, H and N compensate.
      // This is the doubly-degenerate bending mode, component 1.
      displacements: [
        [0, -0.20, 0],                // H: moves -y
        [0, 0.45, 0],                 // C: moves +y (central atom bends most)
        [0, -0.20, 0],                // N: moves -y
      ],
    },
    {
      irrep: PI_CINF,
      label: 'bend (in x)',
      frequency: 712,
      // Same bending mode but in xz plane. Degenerate partner.
      displacements: [
        [-0.20, 0, 0],                // H: moves -x
        [0.45, 0, 0],                 // C: moves +x
        [-0.20, 0, 0],                // N: moves -x
      ],
    },
  ],
};
