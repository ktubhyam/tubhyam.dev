# Orbital Architect

A gamified quantum chemistry puzzle game where you build atoms by filling electron orbitals following real quantum mechanical rules.

**[Play Online](https://orbital.tubhyam.dev)** | **[Project Page](https://tubhyam.dev/simulations/orbital-architect)**

## The Game

You're given a target element (e.g., "Build Iron"). You see an energy level diagram and a 3D orbital viewer. Place electrons into orbital slots following three fundamental rules of quantum mechanics:

- **Aufbau Principle** — Fill lower energy orbitals before higher ones (1s → 2s → 2p → 3s → 3p → 4s → 3d → 4p)
- **Pauli Exclusion** — Max 2 electrons per orbital, must have opposite spins
- **Hund's Rule** — In degenerate orbitals, fill singly with parallel spins before pairing

The quantum rules ARE the game mechanics.

## Game Modes

### Campaign
36 levels: Hydrogen (Z=1) through Krypton (Z=36). Each level teaches a new concept. Star ratings based on accuracy. Boss levels at Chromium and Copper (Aufbau exceptions).

### Challenge
Random element, 30-second timer. Complete atoms to earn time bonuses. Streak multipliers. Local leaderboard.

### Sandbox
No rules enforced, no scoring. Explore any element freely. Quantum number display for every orbital. Break rules and see what happens.

## Features

- Interactive energy level diagram with click-to-place and drag-and-drop
- Real-time 3D orbital visualization using point-cloud rendering
- Procedural audio — ascending tones tied to shell energy levels
- Full rule validation engine (Aufbau, Pauli, Hund)
- Streak multipliers, star ratings, achievements
- Undo/redo support
- Keyboard shortcuts (U/D for spin, Ctrl+Z for undo)
- Quantum number info panel
- Progress persistence via localStorage

## Tech Stack

- **Framework**: Next.js 15 + React 19 + TypeScript
- **3D**: Three.js via React Three Fiber + Drei + Postprocessing (Bloom)
- **Animation**: Framer Motion
- **Styling**: Tailwind CSS 4
- **State**: Zustand
- **Drag & Drop**: @dnd-kit
- **Audio**: Web Audio API (procedural)
- **Effects**: canvas-confetti

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── campaign/           # Campaign mode (level select + play)
│   ├── challenge/          # Challenge mode (timed)
│   └── sandbox/            # Sandbox mode (free explore)
├── components/
│   ├── game/               # Game UI (EnergyDiagram, HUD, ElectronTray, etc.)
│   └── three/              # 3D orbital viewer (React Three Fiber)
├── lib/
│   ├── chemistry/          # Orbital data, element database, rule validation
│   └── game/               # Audio manager
├── stores/                 # Zustand stores (game state, progress)
└── types/                  # TypeScript type definitions
```

## License

MIT
