# Symmetry Explorer

Interactive 3D tool for exploring molecular point groups, symmetry operations, character tables, and spectroscopic selection rules. Pick a molecule, watch symmetry operations animate in real time, and see exactly which vibrational modes are IR-active, Raman-active, or silent.

**[Live Demo](https://symmetry.tubhyam.dev)** | **[Project Page](https://tubhyam.dev/simulations/symmetry-explorer)**

---

## Features

### 3D Molecule Viewer
- 27 molecules spanning 15 point groups — from C1 (no symmetry) to Oh (octahedral)
- Symmetry element overlays: rotation axes (Cn), mirror planes (sigma), inversion center (i), improper axes (Sn)
- Step-through symmetry operations with smooth animations (rotations, reflections, inversions)

### Vibrational Mode Animations
- 43+ normal modes with per-atom displacement vectors from DFT calculations (B3LYP/def2-TZVP)
- Click any mode in the breakdown panel to watch atoms oscillate along their eigenvectors
- Frequency labels (cm^-1), IR/Raman activity indicators, degeneracy markers

### Character Tables
- Full character tables with irreducible representations, symmetry operations, and basis functions
- Highlighted rows on hover with cross-linked selection rules
- Linear function and quadratic function columns for IR and Raman activity

### Selection Rules
- Automatic decomposition of 3N-6 (or 3N-5 for linear) vibrational modes into irreducible representations
- IR-active, Raman-active, both, or silent classification per irrep
- Information Completeness Ratio R(G,N) — fraction of vibrational DOF observable by spectroscopy
- Mutual exclusion principle highlighted for centrosymmetric molecules

### Point Group Identification
- Interactive flowchart implementing the Cotton algorithm (18 decision nodes)
- Step-by-step yes/no questions: "Is the molecule linear?", "Are there Cn axes?", etc.
- Links to example molecules for each identified point group

### Keyboard Shortcuts & URL State
- `Arrow Left/Right` — cycle through molecules
- `Space` — toggle symmetry element overlays
- `Esc` — stop active animation
- Shareable URLs: molecule selection and sidebar tab are synced to the URL

## Molecule Library

| Point Group | Molecules |
|-------------|-----------|
| C1 | Alanine |
| Cs | Hypochlorous acid, Thionyl chloride |
| Ci | Meso-tartaric acid |
| C2 | Hydrogen peroxide |
| C2v | Water, Formaldehyde, Pyridine, Dichloromethane |
| C2h | Trans-diazene |
| C3v | Ammonia, Chloroform, Phosphine, Phosphoryl chloride |
| C-inf-v | Hydrogen chloride, Hydrogen cyanide |
| D-inf-h | Carbon dioxide, Acetylene |
| D2h | Ethylene |
| D3h | Boron trifluoride, Cyclopropane, Carbonate ion, Phosphorus pentachloride |
| D4h | Xenon tetrafluoride |
| D6h | Benzene |
| Td | Methane |
| Oh | Sulfur hexafluoride |

## Tech Stack

- **Framework:** Next.js 16 + React 19 + TypeScript
- **3D Rendering:** Three.js 0.183 + React Three Fiber 9 + Drei
- **Animation:** Framer Motion 12
- **State:** Zustand 5
- **Styling:** Tailwind CSS 4
- **Analytics:** Vercel Analytics

## Getting Started

```bash
git clone https://github.com/ktubhyam/tubhyam.dev.git
cd tubhyam.dev
pnpm install
pnpm turbo dev --filter=@tubhyam/symmetry-explorer
```

Open [http://localhost:3001](http://localhost:3001).

## How It Works

1. **Character tables** are pre-computed for all 15 point groups with irrep labels, symmetry operation characters, and basis functions
2. **Selection rules** are derived by checking which irreps transform as linear functions (x, y, z → IR) or quadratic functions (x^2, xy, ... → Raman)
3. **Vibrational decomposition** uses the reduction formula to decompose the 3N-dimensional reducible representation into irreps, subtracting translations and rotations
4. **Normal mode displacements** are pre-computed DFT eigenvectors animated in real time using Three.js `useFrame` at 60fps

## Educational Value

This tool bridges abstract group theory and practical spectroscopy:

- See *why* CO2 has IR-active but Raman-inactive asymmetric stretch (mutual exclusion in D-inf-h)
- Understand *how* symmetry determines which vibrations absorb infrared light
- Watch *what happens* to selection rules as molecular symmetry changes
- Follow the Cotton flowchart to *identify* a molecule's point group step by step

## Author

**Tubhyam Karthikeyan** — [tubhyam.dev](https://tubhyam.dev) | [GitHub](https://github.com/ktubhyam) | [LinkedIn](https://linkedin.com/in/ktubhyam)

## License

MIT
