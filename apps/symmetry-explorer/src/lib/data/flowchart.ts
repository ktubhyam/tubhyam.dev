/**
 * Decision tree data for identifying molecular point groups.
 *
 * Based on the standard algorithm from Cotton's "Chemical Applications of
 * Group Theory." The flowchart walks through a series of yes/no questions
 * about the symmetry elements present in a molecule and arrives at the
 * correct point group classification.
 *
 * Navigation: each node has `yes` and `no` fields that are either
 *   - another node id (continue the decision tree), or
 *   - a string prefixed with "result:" followed by the point group symbol
 *     (terminal answer).
 */

export interface FlowchartNode {
  id: string;
  question: string;
  /** Brief explanation of what this symmetry test means. */
  description: string;
  /** Node id to follow when the answer is "yes", or "result:<PointGroup>" for a terminal answer. */
  yes: string;
  /** Node id to follow when the answer is "no", or "result:<PointGroup>" for a terminal answer. */
  no: string;
}

export const FLOWCHART_NODES: FlowchartNode[] = [
  // ─── Step 1: Linearity ───────────────────────────────────────────────
  {
    id: 'start',
    question: 'Is the molecule linear?',
    description:
      'All atoms lie along a single straight line. Linear molecules possess a C\u221E axis ' +
      '(rotation by any angle about the molecular axis).',
    yes: 'linear-inversion',
    no: 'high-symmetry',
  },
  {
    id: 'linear-inversion',
    question: 'Does the linear molecule have a center of inversion (i)?',
    description:
      'An inversion center means that for every atom at position (x, y, z) there is an ' +
      'identical atom at (\u2212x, \u2212y, \u2212z). Symmetric linear molecules like CO\u2082 ' +
      'have inversion; asymmetric ones like HCN do not.',
    yes: 'result:D\u221Eh',
    no: 'result:C\u221Ev',
  },

  // ─── Step 2: High-symmetry (cubic / icosahedral) ─────────────────────
  {
    id: 'high-symmetry',
    question: 'Are there two or more C\u2099 axes with n \u2265 3?',
    description:
      'Multiple high-order rotation axes (n \u2265 3) indicate a Platonic-solid-type geometry: ' +
      'tetrahedral, octahedral, or icosahedral. Examples include CH\u2084 (Td) and SF\u2086 (Oh).',
    yes: 'high-sym-inversion',
    no: 'principal-axis',
  },
  {
    id: 'high-sym-inversion',
    question: 'Does the molecule have a center of inversion (i)?',
    description:
      'Among high-symmetry groups, the presence of an inversion center distinguishes ' +
      'Oh (octahedral) and Ih (icosahedral) from the non-centrosymmetric groups.',
    yes: 'high-sym-oh-or-ih',
    no: 'high-sym-mirror',
  },
  {
    id: 'high-sym-oh-or-ih',
    question: 'Does the molecule have C\u2085 axes?',
    description:
      'Icosahedral symmetry (Ih) uniquely features C\u2085 rotation axes (72\u00B0 rotations), ' +
      'as seen in C\u2086\u2080 (buckminsterfullerene). Octahedral symmetry (Oh) has C\u2084 axes ' +
      'but no C\u2085.',
    yes: 'result:Ih',
    no: 'result:Oh',
  },
  {
    id: 'high-sym-mirror',
    question: 'Does the molecule have mirror planes (\u03C3)?',
    description:
      'Among the non-centrosymmetric high-symmetry groups, the presence of mirror planes ' +
      '(specifically \u03C3d dihedral planes) distinguishes Td from the pure rotation groups.',
    yes: 'high-sym-td-check',
    no: 'high-sym-pure-rotation',
  },
  {
    id: 'high-sym-td-check',
    question: 'Does the molecule have C\u2085 axes?',
    description:
      'This distinguishes Td (tetrahedral with \u03C3d planes, no C\u2085) from the rare case of ' +
      'I with mirrors. In practice, molecules with mirror planes and multiple C\u2083 axes but ' +
      'no inversion are almost always Td.',
    yes: 'result:I',
    no: 'result:Td',
  },
  {
    id: 'high-sym-pure-rotation',
    question: 'Does the molecule have C\u2085 axes?',
    description:
      'The pure rotation high-symmetry groups (no mirror planes, no inversion) are T, O, and I. ' +
      'C\u2085 axes indicate icosahedral rotation symmetry (I). These groups are extremely rare ' +
      'in real molecules.',
    yes: 'result:I',
    no: 'high-sym-t-or-o',
  },
  {
    id: 'high-sym-t-or-o',
    question: 'Does the molecule have C\u2084 axes?',
    description:
      'Among the pure rotation groups without C\u2085, the presence of C\u2084 axes distinguishes ' +
      'octahedral rotation symmetry (O) from tetrahedral rotation symmetry (T). Both are very rare.',
    yes: 'result:O',
    no: 'result:T',
  },

  // ─── Step 3: Find the principal axis ─────────────────────────────────
  {
    id: 'principal-axis',
    question: 'Does the molecule have a proper rotation axis C\u2099 with n \u2265 2?',
    description:
      'The principal axis is the rotation axis of highest order. For example, benzene has C\u2086 ' +
      'as its principal axis (60\u00B0 rotation maps the molecule onto itself). If no C\u2099 ' +
      '(n \u2265 2) exists, the molecule belongs to one of the low-symmetry groups: C\u2081, Cs, or Ci.',
    yes: 'perp-c2',
    no: 'low-sym-mirror',
  },

  // ─── Step 3a: No rotation axis \u2014 low symmetry groups ───────────────
  {
    id: 'low-sym-mirror',
    question: 'Does the molecule have a mirror plane (\u03C3)?',
    description:
      'A mirror plane reflects every atom to an equivalent position on the other side. ' +
      'With no rotation axis, a single mirror plane gives the Cs point group.',
    yes: 'result:Cs',
    no: 'low-sym-inversion',
  },
  {
    id: 'low-sym-inversion',
    question: 'Does the molecule have a center of inversion (i)?',
    description:
      'The inversion operation maps each atom at (x, y, z) to (\u2212x, \u2212y, \u2212z). ' +
      'With no rotation axis and no mirror plane, inversion alone gives the Ci point group. ' +
      'Without any symmetry element at all, the molecule is C\u2081.',
    yes: 'result:Ci',
    no: 'result:C1',
  },

  // ─── Step 4: Perpendicular C\u2082 axes \u2014 Dn vs Cn families ──────────
  {
    id: 'perp-c2',
    question: 'Are there n C\u2082 axes perpendicular to the principal C\u2099?',
    description:
      'Look for two-fold rotation axes that lie in a plane perpendicular to the principal axis. ' +
      'If there are exactly n such C\u2082 axes (where n is the order of the principal axis), ' +
      'the molecule belongs to a D (dihedral) group; otherwise it belongs to a C group.',
    yes: 'dn-sigma-h',
    no: 'cn-sigma-h',
  },

  // ─── Step 4a: D\u2099 family ─────────────────────────────────────────────
  {
    id: 'dn-sigma-h',
    question: 'Does the molecule have a horizontal mirror plane (\u03C3h)?',
    description:
      'A horizontal mirror plane (\u03C3h) is perpendicular to the principal rotation axis. ' +
      'It reflects atoms above the plane to equivalent positions below it. In D groups, ' +
      '\u03C3h gives the Dnh point group (e.g., benzene is D\u2086h, BF\u2083 is D\u2083h).',
    yes: 'result:Dnh',
    no: 'dn-sigma-d',
  },
  {
    id: 'dn-sigma-d',
    question: 'Does the molecule have dihedral mirror planes (\u03C3d)?',
    description:
      'Dihedral mirror planes (\u03C3d) contain the principal axis and bisect the angles ' +
      'between adjacent C\u2082 axes. Their presence gives the Dnd point group ' +
      '(e.g., staggered ethane is D\u2083d, allene is D\u2082d). Without any mirror planes, ' +
      'the molecule is Dn (pure dihedral rotation).',
    yes: 'result:Dnd',
    no: 'result:Dn',
  },

  // ─── Step 4b: C\u2099 family ─────────────────────────────────────────────
  {
    id: 'cn-sigma-h',
    question: 'Does the molecule have a horizontal mirror plane (\u03C3h)?',
    description:
      'A horizontal mirror plane (\u03C3h) is perpendicular to the principal C\u2099 axis. ' +
      'In the C family, this gives the Cnh point group (e.g., trans-C\u2082H\u2082Cl\u2082 is C\u2082h).',
    yes: 'result:Cnh',
    no: 'cn-sigma-v',
  },
  {
    id: 'cn-sigma-v',
    question: 'Does the molecule have n vertical mirror planes (\u03C3v)?',
    description:
      'Vertical mirror planes (\u03C3v) contain the principal rotation axis. If there are n such ' +
      'planes (where n is the order of C\u2099), the molecule is Cnv. For example, H\u2082O is C\u2082v ' +
      '(one C\u2082 axis and two \u03C3v planes), and NH\u2083 is C\u2083v.',
    yes: 'result:Cnv',
    no: 'cn-s2n',
  },
  {
    id: 'cn-s2n',
    question: 'Does the molecule have an S\u2082n improper rotation axis?',
    description:
      'An improper rotation S\u2082n is a rotation by 360\u00B0/(2n) followed by reflection ' +
      'through the perpendicular plane. If S\u2082n is present but no mirror planes exist, ' +
      'the molecule belongs to the S\u2082n point group (e.g., S\u2084, S\u2086). ' +
      'These are relatively uncommon. Without S\u2082n, the molecule is simply Cn.',
    yes: 'result:S2n',
    no: 'result:Cn',
  },
];

/**
 * Helper: look up a node by its id.
 */
export function getFlowchartNode(id: string): FlowchartNode | undefined {
  return FLOWCHART_NODES.find((node) => node.id === id);
}

/**
 * Returns true when a destination string is a terminal result
 * (i.e., a point group classification rather than a follow-up node).
 */
export function isResult(destination: string): boolean {
  return destination.startsWith('result:');
}

/**
 * Extracts the point group name from a "result:..." string.
 * Returns null if the string is not a result.
 */
export function extractPointGroup(destination: string): string | null {
  if (!isResult(destination)) return null;
  return destination.slice('result:'.length);
}

/**
 * Map point groups to example molecules from the molecules database.
 *
 * Keys are the standard Schoenflies symbols. Values are arrays of molecule
 * identifiers (matching the `id` field in the molecules dataset).
 */
export const POINT_GROUP_EXAMPLES: Record<string, string[]> = {
  // Low symmetry
  C1: ['chfclbr'],
  Cs: ['hocl', 'socl2'],
  Ci: ['meso-chclf-chclf'],

  // Cn groups
  C2: ['h2o2'],

  // Cnv groups
  C2v: ['water', 'formaldehyde', 'clf3', 'cis-c2h2cl2'],
  C3v: ['ammonia', 'chloroform', 'nf3', 'pcl3'],
  Cnv: ['water', 'ammonia'],

  // Cnh groups
  C2h: ['trans-c2h2cl2'],
  Cnh: ['trans-c2h2cl2'],

  // Linear groups
  'C\u221Ev': ['hcn', 'n2o'],
  'D\u221Eh': ['co2', 'acetylene'],

  // Dn groups — no examples in our database

  // Dnh groups
  D2h: ['ethylene'],
  D3h: ['bf3', 'pf5', 'so3', 'cyclopropane'],
  D4h: ['xef4'],
  D6h: ['benzene'],
  Dnh: ['benzene', 'bf3', 'xef4', 'ethylene'],

  // Dnd groups — no examples in our database

  // High symmetry
  Td: ['methane'],
  Oh: ['sf6'],
};

/**
 * All point groups that appear as terminal results in the flowchart,
 * organized by family for display purposes.
 */
export const POINT_GROUP_FAMILIES: Record<string, string[]> = {
  'Non-axial': ['C1', 'Cs', 'Ci'],
  'Cn': ['C2', 'C3', 'C4', 'C5', 'C6'],
  'Cnv': ['C2v', 'C3v', 'C4v', 'C5v', 'C6v'],
  'Cnh': ['C2h', 'C3h', 'C4h', 'C5h', 'C6h'],
  'Sn': ['S4', 'S6', 'S8'],
  'Dn': ['D2', 'D3', 'D4', 'D5', 'D6'],
  'Dnh': ['D2h', 'D3h', 'D4h', 'D5h', 'D6h'],
  'Dnd': ['D2d', 'D3d', 'D4d', 'D5d'],
  'Linear': ['C\u221Ev', 'D\u221Eh'],
  'Cubic': ['T', 'Td', 'Th', 'O', 'Oh'],
  'Icosahedral': ['I', 'Ih'],
};
