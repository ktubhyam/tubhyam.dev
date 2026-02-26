# Normal Mode Explorer

Visualize and decompose molecular vibrations into individual normal modes. Animate each mode, compare two side-by-side, superpose multiple modes, hear their frequencies, and explore how symmetry determines spectroscopic selection rules.

**[Live Demo](https://nme.tubhyam.dev)** | **[Project Page](https://tubhyam.dev/simulations/normal-mode-explorer)**

---

## Features

### 3D Visualization
- 45 molecules (H₂ to toluene) with 583 total normal modes
- Per-atom displacement arrows animated along DFT eigenvectors
- Trajectory trails showing atomic paths during vibration
- Symmetry element overlays (axes, planes, inversion center)
- Adjustable amplitude (0-2x) and speed (0.1-3x)

### Side-by-Side Comparison
- Shift+click any mode to set Mode B
- Split viewport with independent 3D scenes
- Color-coded: Mode A (cyan) vs Mode B (gold)

### Superposition Mode
- Combine multiple modes into a single visualization
- Checkbox multi-select when superposition is enabled
- Weighted vector sum of displacement fields

### Spectrum Chart
- Interactive IR and Raman spectrum with clickable mode markers
- Click on the spectrum to jump to the nearest mode
- Grid lines from 1000-4000 cm^-1

### Boltzmann Panel
- Temperature slider (10-3000 K)
- Population distribution bars using Boltzmann statistics
- Zero-point energy and average thermal energy calculations

### Sonification
- Play a mode as an audible tone (400-4000 cm^-1 mapped to 200-800 Hz)
- Play all modes as a chord with IR intensity scaling volume
- Web Audio API synthesis

### Analysis Panels
- **Selection Rules** — IR/Raman activity with intensity bars and explanations
- **Symmetry Info** — point group, irrep labels, active/silent mode counts
- **Energy Chart** — bar chart ranking all modes by frequency
- **Displacement Table** — per-atom dx, dy, dz components with magnitude bars

### Keyboard Shortcuts
- `Space` — play/pause animation
- `Arrow Up/Down` — cycle Mode A
- `Arrow Left/Right` — cycle Mode B (when active)
- `B` — toggle Mode B comparison view
- `S` — toggle superposition mode
- `Esc` — close comparison or clear superposition

### URL State
- Shareable URLs: `nme.tubhyam.dev/?mol=ethanol&mode=3&modeB=7`
- Molecule, Mode A, and Mode B synced to query parameters

## Tech Stack

- **Framework:** Next.js 16 + React 19 + TypeScript
- **3D Rendering:** Three.js 0.183 + React Three Fiber 9 + Drei + Postprocessing
- **Animation:** Framer Motion 12
- **State:** Zustand 5
- **Styling:** Tailwind CSS 4
- **Data:** 45 pre-computed molecule files (DFT, B3LYP/def2-TZVP level)

## Getting Started

```bash
git clone https://github.com/ktubhyam/normal-mode-explorer.git
cd normal-mode-explorer
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## How It Works

Normal modes are the fundamental vibrational patterns of a molecule. Each mode is characterized by:

- A **frequency** (cm^-1) — how fast the atoms vibrate
- A **displacement vector** — which direction each atom moves
- **Symmetry labels** — which irreducible representation it belongs to
- **Selection rules** — whether it's IR-active (dipole change), Raman-active (polarizability change), or silent

The Wilson GF method solves the secular equation `|GF - λI| = 0` to give eigenvalues (frequencies²) and eigenvectors (displacement vectors). This tool visualizes those eigenvectors in 3D and lets you explore how molecular symmetry determines what spectroscopy can observe.

## Author

**Tubhyam Karthikeyan** — [tubhyam.dev](https://tubhyam.dev) | [GitHub](https://github.com/ktubhyam)

## License

MIT
