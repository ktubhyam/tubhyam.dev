# VibeScope

Real-time 3D molecular vibration visualization. Select a molecule, pick a vibrational mode, and watch atoms oscillate along their displacement vectors with interactive IR and Raman spectrum overlays.

**[Live Demo](https://vibescope.tubhyam.dev)** | **[Project Page](https://tubhyam.dev/simulations/vibescope)**

---

## Features

### 3D Visualization
- 17 molecules from H₂O to benzene — rendered with CPK coloring and covalent-radius spheres
- Per-mode animation along DFT-computed displacement vectors (B3LYP/def2-TZVP)
- Adjustable amplitude (0-2x) and speed (0.1-3x) sliders
- Orbit controls for rotation, zoom, and pan

### Spectrum Overlay
- Toggle between IR and Raman spectrum views
- Click on the spectrum chart to jump to the nearest mode
- Selected mode highlighted with frequency label (cm^-1)

### Controls
- Play/pause, speed, and amplitude sliders in the control panel
- Mode selector with IR intensity bars for quick scanning
- Selected mode info: frequency, IR intensity, Raman activity, symmetry label

### Keyboard Shortcuts
- `Space` — play/pause animation
- `Arrow Up/Down` — cycle through modes

## Molecule Library

| Molecule | Formula | Atoms | Modes |
|----------|---------|-------|-------|
| Water | H₂O | 3 | 3 |
| Hydrogen Cyanide | HCN | 3 | 3 |
| Ammonia | NH₃ | 4 | 6 |
| Acetylene | C₂H₂ | 4 | 6 |
| Formaldehyde | CH₂O | 4 | 6 |
| Methane | CH₄ | 5 | 9 |
| Methanol | CH₄O | 6 | 12 |
| Acetonitrile | C₂H₃N | 6 | 12 |
| Formamide | CH₃NO | 6 | 12 |
| Ethylene | C₂H₄ | 6 | 12 |
| Acetaldehyde | C₂H₄O | 7 | 15 |
| Ethane | C₂H₆ | 8 | 18 |
| Cyclopropane | C₃H₆ | 9 | 21 |
| Ethanol | C₂H₆O | 9 | 21 |
| Propane | C₃H₈ | 11 | 27 |
| Cyclobutane | C₄H₈ | 12 | 30 |
| Benzene | C₆H₆ | 12 | 30 |

## Tech Stack

- **Framework:** Next.js 16 + React 19 + TypeScript
- **3D Rendering:** Three.js 0.183 + React Three Fiber 9 + Drei
- **State:** Zustand 5
- **Styling:** Tailwind CSS 4

## Getting Started

```bash
git clone https://github.com/ktubhyam/vibescope.git
cd vibescope
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## How It Works

1. Molecular geometries and normal modes are pre-computed using DFT (B3LYP/def2-TZVP)
2. The Wilson GF method gives eigenvalues (frequencies) and eigenvectors (displacement vectors)
3. Three.js renders the molecule and animates atoms along displacement vectors at 60fps
4. IR intensity and Raman activity determine selection rule classification per mode

## Author

**Tubhyam Karthikeyan** — [tubhyam.dev](https://tubhyam.dev) | [GitHub](https://github.com/ktubhyam)

## License

MIT
