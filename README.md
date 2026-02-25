# tubhyam.dev

Personal portfolio and research site for **Tubhyam Karthikeyan** — computational chemistry, machine learning, and open source.

**Live:** [tubhyam.dev](https://tubhyam.dev)
**Publication:** [Latent Chemistry](https://tubhyam.dev/blog) — deep learning for chemical sciences

Built with Astro 5, React 19, Tailwind CSS 4, and MDX. Static site deployed on Vercel.

---

## Research Projects

| Project | Description | Stack | Links |
|---------|-------------|-------|-------|
| **[Spekron](https://github.com/ktubhyam/Spekron)** | Foundation model for vibrational spectroscopy — D-LinOSS backbone, masked pretraining, VIB disentanglement, calibration transfer | Python, PyTorch | [Project page](https://tubhyam.dev/projects/spekron) |
| **[ReactorTwin](https://github.com/ktubhyam/reactor-twin)** | Digital twin for chemical reactors using neural ODEs and PINNs | Python, PyTorch, FastAPI | [Project page](https://tubhyam.dev/projects/reactor-twin) |
| **[Speklens](https://github.com/ktubhyam/Speklens)** | CNN-Transformer encoder pretrained on 350K+ molecules for spectral representation learning | Python, PyTorch | — |

## Libraries

| Library | Description | Install | Links |
|---------|-------------|---------|-------|
| **[SpectraKit](https://github.com/ktubhyam/spectrakit)** | Spectral preprocessing — baseline correction, smoothing, normalization, peak detection, multi-format I/O. Functional API, 699 tests, 2 core deps | `pip install pyspectrakit` | [Docs](https://ktubhyam.github.io/spectrakit/) · [PyPI](https://pypi.org/project/pyspectrakit/) · [API Reference](https://tubhyam.dev/libraries/spectrakit/api) |
| **[SpectraView](https://github.com/ktubhyam/spectraview)** | Interactive React component for vibrational spectroscopy visualization — peak picking, multi-spectrum overlay, region highlighting | `npm i spectraview` | [npm](https://www.npmjs.com/package/spectraview) |

## Interactive Simulations

Browser-based educational tools built with Next.js, React Three Fiber, and Three.js.

| Simulation | Description | Live Demo |
|------------|-------------|-----------|
| **[Normal Mode Explorer](https://github.com/ktubhyam/normal-mode-explorer)** | Decompose molecular vibrations into normal modes with symmetry labels and selection rules | [Launch](https://normal-mode-explorer.vercel.app) |
| **[Orbital Architect](https://github.com/ktubhyam/orbital-architect)** | Gamified quantum chemistry — build atoms by placing electrons following Aufbau, Pauli, and Hund's rules | [Launch](https://orbital.tubhyam.dev) |
| **[VibeScope](https://github.com/ktubhyam/vibescope)** | Real-time 3D molecular vibration visualization with IR/Raman spectrum overlay | [Launch](https://vibescope.vercel.app) |
| **[Symmetry Explorer](https://github.com/ktubhyam/symmetry-explorer)** | Visualize point groups, symmetry operations, and character tables for spectroscopic selection rules | [Launch](https://symmetry-explorer.vercel.app) |
| **[Spectrum-to-Structure](https://github.com/ktubhyam/spectrum-to-structure)** | ML model predicts 3D molecular structure from IR/Raman spectra using ONNX inference | [Launch](https://spectrum-to-structure.vercel.app) |

## Research Papers

| Paper | Status | Topic |
|-------|--------|-------|
| [Hybrid State-Space Attention for Multi-Task Vibrational Spectroscopy](https://tubhyam.dev/research/hybrid-ssa-spectroscopy) | In preparation | Spekron architecture — wavelet embeddings, Mamba, MoE, VIB |
| [Information-Theoretic Limits of Spectroscopic Molecular Identification](https://tubhyam.dev/research/spectral-identifiability) | In preparation | R(G,N) completeness ratio, modal complementarity theorem |

## Blog Posts

Technical writing published under [Latent Chemistry](https://tubhyam.dev/blog). Each post includes interactive visualizations, equations, and code.

| Post | Date | Interactive Component |
|------|------|----------------------|
| [Masked Pretraining for Scientific Spectra](https://tubhyam.dev/blog/masked-pretraining-scientific-spectra) | Apr 2026 | MaskingDemo — identity collapse visualizer |
| [Optimal Transport for Spectral Matching](https://tubhyam.dev/blog/optimal-transport-spectral-matching) | Mar 2026 | SinkhornExplorer — real-time transport plan |
| [The Spectral Inverse Problem](https://tubhyam.dev/blog/spectral-inverse-problem) | Mar 2026 | — |
| [Spectral Identifiability Theory](https://tubhyam.dev/blog/spectral-identifiability-theory) | Feb 2026 | SymmetryExplorer — point group analysis |
| [SpectraKit: A Functional API](https://tubhyam.dev/blog/spectrakit) | Jan 2026 | — |
| [State Space Models for Spectroscopy](https://tubhyam.dev/blog/state-space-models-for-spectroscopy) | Jan 2026 | ReceptiveFieldDemo — CNN vs SSM |
| [Neural ODEs for Reactor Modeling](https://tubhyam.dev/blog/neural-odes-for-reactor-modeling) | Dec 2025 | CSTRSimulator — phase portrait |
| [Why Spectra Are Harder Than Images](https://tubhyam.dev/blog/why-spectra-are-harder-than-images) | Nov 2025 | — |

---

## Site Architecture

```
src/
├── content/           # MDX content collections
│   ├── blog/          # 8 technical posts
│   ├── research/      # 2 papers
│   ├── projects/      # 3 projects
│   ├── simulations/   # 5 interactive tools
│   └── libraries/     # 1 library (SpectraKit)
├── components/
│   ├── islands/       # React components (client:visible hydration)
│   └── layout/        # Astro layout components
├── pages/             # File-based routing
│   ├── og/            # Dynamic OG image generation (Satori)
│   └── rss.xml.ts     # RSS feed
├── lib/               # Constants, OG image renderer, utilities
└── styles/            # Global CSS + Tailwind
```

**Key features:**
- Astro 5 static output with React islands for interactivity
- KaTeX for equations, Shiki (Vesper theme) for code highlighting
- Dynamic OG images via Satori + resvg
- Pagefind for client-side search
- Google News integration (Latent Chemistry publication)
- JSON-LD structured data (BlogPosting, ScholarlyArticle, SoftwareSourceCode, WebApplication)
- Sitemap with priority hierarchy + RSS feed

## Development

```bash
npm install
npm run dev       # localhost:4321
npm run build     # static build → dist/
npm run preview   # preview production build
```

## License

Site content and design. Code samples in blog posts are MIT-licensed.
