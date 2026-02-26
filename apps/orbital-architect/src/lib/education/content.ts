// Educational content database — keyed by trigger conditions
// Each entry fires at the right moment during gameplay

export type ContentCategory = 'concept' | 'fact' | 'tip' | 'history';

export interface ContentTrigger {
  type:
    | 'level_start'
    | 'first_subshell'
    | 'violation'
    | 'subshell_complete'
    | 'electron_milestone'
    | 'period_start'
    | 'aufbau_exception'
    | 'noble_gas'
    | 'level_complete'
    | 'hund_phase_transition';
  // Discriminant value — atomicNumber, subshell label ("2p"), violation type, etc.
  value: string | number;
}

export interface EducationalEntry {
  id: string;
  trigger: ContentTrigger;
  priority: 'high' | 'medium' | 'low';
  category: ContentCategory;
  title: string;
  body: string;
  detail?: string;
  showOnce: boolean;
}

// ─── Content Database ──────────────────────────────────────────────

export const EDUCATION_CONTENT: EducationalEntry[] = [
  // ── Period 1: Fundamentals ──────────────────────────────────────

  {
    id: 'start_h',
    trigger: { type: 'level_start', value: 1 },
    priority: 'high',
    category: 'concept',
    title: 'The Simplest Atom',
    body: 'Hydrogen has just one proton and one electron. The 1s orbital is the lowest energy state, closest to the nucleus.',
    showOnce: true,
  },
  {
    id: 'first_1s',
    trigger: { type: 'first_subshell', value: '1s' },
    priority: 'high',
    category: 'concept',
    title: 's Orbitals',
    body: "The 's' stands for 'sharp', from spectroscopy. s orbitals are spherical — the electron has equal probability in every direction.",
    showOnce: true,
  },
  {
    id: 'start_he',
    trigger: { type: 'level_start', value: 2 },
    priority: 'high',
    category: 'concept',
    title: 'Pauli in Action',
    body: 'Helium has 2 electrons sharing the 1s orbital. They must have opposite spins — this is the Pauli Exclusion Principle.',
    showOnce: true,
  },
  {
    id: 'noble_he',
    trigger: { type: 'noble_gas', value: 2 },
    priority: 'medium',
    category: 'fact',
    title: 'First Noble Gas',
    body: "Helium's filled 1s shell makes it remarkably stable and chemically inert. Noble gases rarely form compounds.",
    showOnce: true,
  },

  // ── Period 2: p Orbitals & Hund's Rule ─────────────────────────

  {
    id: 'period_2',
    trigger: { type: 'period_start', value: 2 },
    priority: 'high',
    category: 'concept',
    title: 'Period 2 Begins',
    body: 'Electrons now access n=2 orbitals. The 2s fills before 2p because of the (n+l) energy rule.',
    showOnce: true,
  },
  {
    id: 'start_li',
    trigger: { type: 'level_start', value: 3 },
    priority: 'medium',
    category: 'fact',
    title: 'Alkali Metal',
    body: "Lithium's single outer electron makes it highly reactive. It defines the start of each new period.",
    showOnce: true,
  },
  {
    id: 'start_b',
    trigger: { type: 'level_start', value: 5 },
    priority: 'high',
    category: 'concept',
    title: 'First p Electron',
    body: 'Boron introduces the first p electron. The 2p subshell has 3 orbitals, each holding up to 2 electrons.',
    showOnce: true,
  },
  {
    id: 'first_2p',
    trigger: { type: 'first_subshell', value: '2p' },
    priority: 'high',
    category: 'concept',
    title: 'p Orbitals',
    body: "p orbitals are dumbbell-shaped with three orientations (px, py, pz). The 'p' stands for 'principal'.",
    detail: 'Each p subshell has 3 orbitals (ml = -1, 0, +1) holding a total of 6 electrons.',
    showOnce: true,
  },
  {
    id: 'start_c',
    trigger: { type: 'level_start', value: 6 },
    priority: 'medium',
    category: 'concept',
    title: "Hund's Rule Matters",
    body: "Carbon has 2 electrons in 2p. Hund's rule: spread them across different orbitals with parallel spins before pairing.",
    showOnce: true,
  },
  {
    id: 'start_n',
    trigger: { type: 'level_start', value: 7 },
    priority: 'medium',
    category: 'fact',
    title: 'Half-Filled Stability',
    body: "Nitrogen has a half-filled 2p subshell — one electron per orbital, all spin-up. Half-filled subshells are extra stable.",
    showOnce: true,
  },
  {
    id: 'start_o',
    trigger: { type: 'level_start', value: 8 },
    priority: 'high',
    category: 'concept',
    title: 'Pairing Begins',
    body: 'With Oxygen, pairing begins in 2p. The fourth p-electron must pair with one already placed — use spin-down.',
    showOnce: true,
  },
  {
    id: 'hund_2p',
    trigger: { type: 'hund_phase_transition', value: '2p' },
    priority: 'high',
    category: 'tip',
    title: 'Phase Transition',
    body: 'All 2p orbitals now have one electron. Time to pair up — add electrons with opposite spins.',
    showOnce: true,
  },
  {
    id: 'start_f',
    trigger: { type: 'level_start', value: 9 },
    priority: 'low',
    category: 'fact',
    title: 'Most Reactive Nonmetal',
    body: "Fluorine is one electron short of a noble gas config. This makes it the most electronegative element — it desperately 'wants' that last electron.",
    showOnce: true,
  },
  {
    id: 'noble_ne',
    trigger: { type: 'noble_gas', value: 10 },
    priority: 'medium',
    category: 'fact',
    title: 'Period 2 Complete',
    body: 'Neon completes Period 2. All orbitals through 2p are full. This closed-shell configuration is extremely stable.',
    showOnce: true,
  },
  {
    id: 'complete_2p',
    trigger: { type: 'subshell_complete', value: '2p' },
    priority: 'medium',
    category: 'tip',
    title: '2p Subshell Filled',
    body: 'The 2p subshell is now fully occupied with 6 electrons. Next energy level: 3s.',
    showOnce: true,
  },

  // ── Period 3: Pattern Recognition ──────────────────────────────

  {
    id: 'period_3',
    trigger: { type: 'period_start', value: 3 },
    priority: 'high',
    category: 'concept',
    title: 'Familiar Patterns',
    body: 'Period 3 mirrors Period 2: 3s fills, then 3p. The rhythm should feel familiar now.',
    showOnce: true,
  },
  {
    id: 'start_na',
    trigger: { type: 'level_start', value: 11 },
    priority: 'medium',
    category: 'concept',
    title: 'Noble Gas Notation',
    body: "Sodium: [Ne] 3s\u00B9. The [Ne] represents the filled core — only the outer electron matters for chemistry.",
    showOnce: true,
  },
  {
    id: 'first_3p',
    trigger: { type: 'first_subshell', value: '3p' },
    priority: 'medium',
    category: 'tip',
    title: '3p Subshell',
    body: "Same rules as 2p: fill all three orbitals singly (spin-up) before pairing. Hund's rule applies to every p, d, and f subshell.",
    showOnce: true,
  },
  {
    id: 'hund_3p',
    trigger: { type: 'hund_phase_transition', value: '3p' },
    priority: 'medium',
    category: 'tip',
    title: 'Pairing in 3p',
    body: 'All 3p orbitals occupied. Begin pairing with spin-down electrons.',
    showOnce: true,
  },
  {
    id: 'noble_ar',
    trigger: { type: 'noble_gas', value: 18 },
    priority: 'medium',
    category: 'fact',
    title: 'Argon — Halfway There',
    body: "18 electrons placed! Argon's completed 3p shell means you've mastered s and p orbital filling.",
    showOnce: true,
  },

  // ── Period 4: d-Block & Exceptions ─────────────────────────────

  {
    id: 'period_4',
    trigger: { type: 'period_start', value: 4 },
    priority: 'high',
    category: 'concept',
    title: 'The d-Block Awaits',
    body: 'Period 4 gets interesting. The 4s orbital fills BEFORE 3d because 4s has lower energy (n+l = 4 vs 5).',
    detail: 'After 4s, electrons enter the 3d subshell — 5 orbitals, 10 electrons total.',
    showOnce: true,
  },
  {
    id: 'start_k',
    trigger: { type: 'level_start', value: 19 },
    priority: 'medium',
    category: 'concept',
    title: 'Aufbau in Action',
    body: 'Potassium skips 3d and fills 4s. The Aufbau principle says: always fill the lowest energy orbital first.',
    showOnce: true,
  },
  {
    id: 'first_4s',
    trigger: { type: 'first_subshell', value: '4s' },
    priority: 'medium',
    category: 'concept',
    title: '4s Before 3d',
    body: "4s has lower energy than 3d (n+l = 4 vs 5). This is why Potassium's outer electron is in 4s, not 3d.",
    showOnce: true,
  },
  {
    id: 'start_sc',
    trigger: { type: 'level_start', value: 21 },
    priority: 'high',
    category: 'concept',
    title: 'Transition Metals Begin',
    body: 'Scandium starts the transition metals. After filling 4s, electrons now enter 3d. These metals have vibrant chemistry.',
    showOnce: true,
  },
  {
    id: 'first_3d',
    trigger: { type: 'first_subshell', value: '3d' },
    priority: 'high',
    category: 'concept',
    title: 'd Orbitals',
    body: "d orbitals have 5 orientations per subshell. 'd' stands for 'diffuse'. They give transition metals their colorful compounds.",
    detail: 'Each d subshell holds up to 10 electrons across 5 orbitals (ml = -2, -1, 0, +1, +2).',
    showOnce: true,
  },
  {
    id: 'hund_3d',
    trigger: { type: 'hund_phase_transition', value: '3d' },
    priority: 'medium',
    category: 'tip',
    title: '3d Half-Filled',
    body: 'All five 3d orbitals have one electron. Now pair up — add electrons with opposite spins starting from the lowest ml.',
    showOnce: true,
  },
  {
    id: 'exception_cr',
    trigger: { type: 'aufbau_exception', value: 24 },
    priority: 'high',
    category: 'concept',
    title: 'Chromium Exception',
    body: "Chromium steals an electron from 4s to get [Ar] 3d\u2075 4s\u00B9. Half-filled d subshells have extra exchange energy stability.",
    detail: 'Exchange energy: electrons with parallel spins in degenerate orbitals lower the total energy. More parallel spins = more stability.',
    showOnce: true,
  },
  {
    id: 'exception_cu',
    trigger: { type: 'aufbau_exception', value: 29 },
    priority: 'high',
    category: 'concept',
    title: 'Copper Exception',
    body: "Copper prefers [Ar] 3d\u00B9\u2070 4s\u00B9 over [Ar] 3d\u2079 4s\u00B2. A completely filled d subshell is thermodynamically favored.",
    detail: 'The energy gain from a full d\u00B9\u2070 configuration outweighs the cost of an incomplete 4s shell.',
    showOnce: true,
  },
  {
    id: 'start_ti',
    trigger: { type: 'level_start', value: 22 },
    priority: 'low',
    category: 'history',
    title: 'Titanium',
    body: 'Named after the Titans of Greek mythology. Strong, lightweight, and corrosion-resistant — used in aircraft and medical implants.',
    showOnce: true,
  },
  {
    id: 'start_fe',
    trigger: { type: 'level_start', value: 26 },
    priority: 'medium',
    category: 'fact',
    title: 'Iron — The Most Stable',
    body: "Iron-56 has the highest nuclear binding energy per nucleon. Stars die when they reach iron — fusion stops being energetically favorable.",
    showOnce: true,
  },
  {
    id: 'start_ni',
    trigger: { type: 'level_start', value: 28 },
    priority: 'low',
    category: 'fact',
    title: 'Nickel',
    body: "Earth's core is mostly iron and nickel. Nickel's 3d⁸ 4s² configuration gives it remarkable catalytic properties.",
    showOnce: true,
  },
  {
    id: 'start_zn',
    trigger: { type: 'level_start', value: 30 },
    priority: 'medium',
    category: 'concept',
    title: 'Full d-Shell',
    body: "Zinc fills all five 3d orbitals plus 4s². It's technically a d-block element but behaves more like a main-group metal.",
    showOnce: true,
  },
  {
    id: 'start_ga',
    trigger: { type: 'level_start', value: 31 },
    priority: 'medium',
    category: 'concept',
    title: 'Back to p-Block',
    body: 'Gallium begins the 4p subshell. The 3d electrons are now part of the core — only 4s and 4p electrons drive chemistry.',
    showOnce: true,
  },
  {
    id: 'start_as',
    trigger: { type: 'level_start', value: 33 },
    priority: 'low',
    category: 'fact',
    title: 'Arsenic the Metalloid',
    body: 'Arsenic sits on the staircase between metals and nonmetals. Its 4p³ configuration mirrors nitrogen — a half-filled p subshell.',
    showOnce: true,
  },
  {
    id: 'first_4p',
    trigger: { type: 'first_subshell', value: '4p' },
    priority: 'medium',
    category: 'concept',
    title: '4p Subshell',
    body: 'After filling 3d, electrons return to the p-block. The 4p orbitals complete Period 4.',
    showOnce: true,
  },
  {
    id: 'hund_4p',
    trigger: { type: 'hund_phase_transition', value: '4p' },
    priority: 'medium',
    category: 'tip',
    title: 'Pairing in 4p',
    body: 'All three 4p orbitals now have one electron. Begin pairing — the same pattern you learned in 2p and 3p.',
    showOnce: true,
  },
  {
    id: 'complete_4p',
    trigger: { type: 'subshell_complete', value: '4p' },
    priority: 'medium',
    category: 'tip',
    title: '4p Complete',
    body: 'The 4p subshell is full! Period 4 complete. You\'ve placed electrons through all s, p, and d subshell types.',
    showOnce: true,
  },
  {
    id: 'noble_kr',
    trigger: { type: 'noble_gas', value: 36 },
    priority: 'high',
    category: 'fact',
    title: 'Krypton — All 36 Complete',
    body: "You've mastered 1s through 4p — that covers s, p, and d orbitals. Real quantum mechanics, architect.",
    showOnce: true,
  },

  // ── Violation-triggered Teaching (repeatable) ──────────────────

  {
    id: 'violation_aufbau',
    trigger: { type: 'violation', value: 'aufbau' },
    priority: 'high',
    category: 'concept',
    title: 'Aufbau Principle',
    body: "German for 'building up': lower-energy orbitals fill first. Energy order: 1s < 2s < 2p < 3s < 3p < 4s < 3d < 4p.",
    detail: 'Use the (n+l) rule: lower sum fills first. If tied, lower n fills first.',
    showOnce: false,
  },
  {
    id: 'violation_pauli',
    trigger: { type: 'violation', value: 'pauli' },
    priority: 'high',
    category: 'concept',
    title: 'Pauli Exclusion',
    body: 'No two electrons can share all four quantum numbers (n, l, ml, ms). Each orbital holds max 2 electrons with opposite spins.',
    showOnce: false,
  },
  {
    id: 'violation_hund',
    trigger: { type: 'violation', value: 'hund' },
    priority: 'high',
    category: 'concept',
    title: "Hund's Rule",
    body: "Electrons occupy empty orbitals before pairing. Think of bus seats — spread out first, then double up.",
    detail: 'Parallel spins in degenerate orbitals minimize electron-electron repulsion and maximize exchange energy.',
    showOnce: false,
  },

  // ── Electron Milestones ────────────────────────────────────────

  {
    id: 'milestone_10',
    trigger: { type: 'electron_milestone', value: 10 },
    priority: 'low',
    category: 'fact',
    title: '10 Electrons',
    body: "You've completed Neon's configuration — the second noble gas. All orbitals through 2p are occupied.",
    showOnce: true,
  },
  {
    id: 'milestone_18',
    trigger: { type: 'electron_milestone', value: 18 },
    priority: 'low',
    category: 'fact',
    title: '18 Electrons',
    body: "Argon's configuration achieved. The 3p subshell is complete. Next stop: the d-block.",
    showOnce: true,
  },
  {
    id: 'milestone_36',
    trigger: { type: 'electron_milestone', value: 36 },
    priority: 'low',
    category: 'fact',
    title: '36 Electrons',
    body: "Krypton's full configuration. You've placed every electron from 1s through 4p. Master architect status.",
    showOnce: true,
  },

  // ── Subshell completions ───────────────────────────────────────

  {
    id: 'complete_1s',
    trigger: { type: 'subshell_complete', value: '1s' },
    priority: 'low',
    category: 'tip',
    title: '1s Complete',
    body: "The 1s orbital is full with 2 electrons. This is Helium's ground state — the simplest filled shell.",
    showOnce: true,
  },
  {
    id: 'complete_2s',
    trigger: { type: 'subshell_complete', value: '2s' },
    priority: 'low',
    category: 'tip',
    title: '2s Complete',
    body: '2s is full. The next available subshell is 2p — three orbitals at slightly higher energy.',
    showOnce: true,
  },
  {
    id: 'complete_3s',
    trigger: { type: 'subshell_complete', value: '3s' },
    priority: 'low',
    category: 'tip',
    title: '3s Complete',
    body: '3s filled. Moving on to 3p — same filling pattern as 2p.',
    showOnce: true,
  },
  {
    id: 'complete_3p',
    trigger: { type: 'subshell_complete', value: '3p' },
    priority: 'low',
    category: 'tip',
    title: '3p Complete',
    body: "3p is done. Next up: 4s (not 3d!) — the Aufbau principle at work.",
    showOnce: true,
  },
  {
    id: 'complete_4s',
    trigger: { type: 'subshell_complete', value: '4s' },
    priority: 'medium',
    category: 'tip',
    title: '4s Complete',
    body: '4s is full. Now the 3d subshell opens up — 5 orbitals, 10 electrons. Welcome to d-block chemistry.',
    showOnce: true,
  },
  {
    id: 'complete_3d',
    trigger: { type: 'subshell_complete', value: '3d' },
    priority: 'medium',
    category: 'tip',
    title: '3d Complete',
    body: "All 10 d-electrons placed. The transition metals are done! Final stretch: 4p to complete Period 4.",
    showOnce: true,
  },
];
