# tubhyam.dev

Monorepo containing the personal portfolio, research blog, and interactive educational simulations for **Tubhyam Karthikeyan** — computational chemistry, machine learning, and open source tooling for vibrational spectroscopy.

**Live:** [tubhyam.dev](https://tubhyam.dev)
**Blog:** [Latent Chemistry](https://tubhyam.dev/blog) — technical writing on deep learning for chemical sciences

---

## Monorepo Structure

```
apps/
├── web/                     # Portfolio + blog (Astro 5 + MDX)         → tubhyam.dev
├── symmetry-explorer/       # Point groups & selection rules           → symmetry.tubhyam.dev
├── normal-mode-explorer/    # Vibrational mode visualization           → nme.tubhyam.dev
├── orbital-architect/       # Gamified electron configuration          → orbital.tubhyam.dev
├── vibescope/               # 3D molecular vibration viewer            → vibescope.tubhyam.dev
└── spectrum-to-structure/   # Spectrum → 3D structure (ML)             → s2s.tubhyam.dev
```

**Tooling:** pnpm workspaces + Turborepo. Each app deploys independently to its own Vercel subdomain.

## Apps

### Portfolio & Blog (`apps/web`)

Built with Astro 5, React 19, Tailwind CSS 4, and MDX. Static site with React islands for interactivity.

- 8 technical blog posts with interactive visualizations and equations (KaTeX)
- 2 research papers, 3 project pages, 5 simulation pages, library documentation
- Dynamic OG images (Satori + resvg), Pagefind search, RSS feed, JSON-LD structured data

### Interactive Simulations

Browser-based educational tools built with Next.js 16, React Three Fiber, and Three.js.

| App | Features | Live Demo |
|-----|----------|-----------|
| **Symmetry Explorer** | 27 molecules, 15 point groups, character tables, selection rules, vibrational mode animations, point group identification flowchart | [Launch](https://symmetry.tubhyam.dev) |
| **Normal Mode Explorer** | 45 molecules, 583 normal modes, side-by-side comparison, superposition, Boltzmann panel, sonification | [Launch](https://nme.tubhyam.dev) |
| **Orbital Architect** | 36-level campaign, drag-and-drop electron placement, 3D orbital rendering, scoring and achievements | [Launch](https://orbital.tubhyam.dev) |
| **VibeScope** | 17 molecules, per-mode animation, IR/Raman spectrum overlay, adjustable amplitude and speed | [Launch](https://vibescope.tubhyam.dev) |
| **Spectrum-to-Structure** | ML model predicts 3D molecular structure from vibrational spectra | Coming soon |

## Related Repositories

| Project | Description | Links |
|---------|-------------|-------|
| **Spektron** | Foundation model for vibrational spectroscopy — D-LinOSS backbone, masked pretraining on 350K spectra | [Code](https://github.com/ktubhyam/Spektron) |
| **SpectraKit** | Python toolkit for spectral preprocessing — 699 tests, functional API | [PyPI](https://pypi.org/project/pyspectrakit/) |
| **SpectraView** | Interactive React component for spectroscopy visualization | [npm](https://www.npmjs.com/package/spectraview) |
| **ReactorTwin** | Digital twin for chemical reactors using neural ODEs | [Code](https://github.com/ktubhyam/reactor-twin) |

## Development

```bash
pnpm install                                    # install all deps
pnpm turbo dev --filter=@tubhyam/web            # portfolio on localhost:4321
pnpm turbo dev --filter=@tubhyam/symmetry-explorer  # simulation on localhost:3001
pnpm turbo build                                # build all apps
```

## License

Site content and design. Code samples in blog posts are MIT-licensed. Simulation apps are MIT-licensed.
