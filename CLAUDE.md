# tubhyam.dev — CLAUDE.md

Personal research site for Tubhyam Karthikeyan. Astro 5 monorepo.

## Quick Reference

- **Local path**: `/Users/admin/Work/Code/GitHub/tubhyam.dev/`
- **Stack**: Astro 5, React (islands), TypeScript, Tailwind CSS
- **Monorepo**: pnpm workspaces + Turborepo
- **Deploy**: Vercel (auto-deploy on push to main)
- **Commands** (all from monorepo root):
  - `pnpm dev` — start dev server
  - `pnpm build` — production build
  - `pnpm typecheck` — TypeScript check

## Key Paths

- Content collections: `apps/web/src/content/` — `blog/`, `libraries/`, `projects/`, `research/`, `simulations/`
- React island components: `apps/web/src/components/islands/`
- Pages: `apps/web/src/pages/`
- OG image route: `apps/web/src/pages/og/`
- Constants: `apps/web/src/lib/constants.ts`

## Content Schema Rules

- Blog `draft: true` is MANDATORY for any future-dated post
- Library `status` enum: `"alpha"` | `"beta"` | `"stable"` — never `"active"` or `"wip"`
- Project `status` enum: `"active"` | `"archived"` | `"wip"`
- All dates: ISO `YYYY-MM-DD` format

## Canonical Values — DO NOT CHANGE without explicit instruction

| Item | Value |
|------|-------|
| QM9S dataset | **130K molecules** (129,817 rounded; 222K = total spectra, never use for molecule count) |
| SpectraKit | v1.8.0, 699 tests, 97% coverage |
| Spektron | v0.1.0, 12 tests, 28% coverage |
| ReactorTwin | stable, v1.0.0, **1500x faster** than simulation, 1477 tests, 90%+ coverage |
| VibScope | v0.0.1-dev |
| qm9s-loader | v0.0.1-dev |
| Papers WIP | 2 |
| Target R² | 0.95 |
| GPU Hours | 0 |

## Hardcoded Components (keep in sync with real repo state)

### StatusBoard.tsx (`apps/web/src/components/islands/StatusBoard.tsx`)
| Project | Status | Version | Coverage | Tests |
|---------|--------|---------|----------|-------|
| spectrakit | passing | v1.8.0 | 97% | 699 |
| spektron | building | v0.1.0 | 28% | 12 |
| vibescope | building | v0.0.1-dev | — | — |
| tubhyam.dev | passing | v1.0.0 | — | — |
| qm9s-loader | building | v0.0.1-dev | — | — |

### MetricCards.tsx (`apps/web/src/components/islands/MetricCards.tsx`)
- Target R²: 0.95
- QM9S Dataset: 130K
- GPU Hours: 0
- Papers WIP: 2

## Historical Issues — Do Not Reintroduce

- SpectralFM → Spektron: FileTree, LogStream, PipelineFlow, StatusBoard, MetricCards all had stale refs — fixed
- ReactorTwin speed: intro text AND performance table must BOTH say 1500x (not 1000x)
- Broken link: `/libraries/spektron` must point to `/projects/spektron`
- Future blog post without `draft: true`: variational-information-bottleneck — fixed
- QM9S incorrectly set to 222K in MetricCards — reverted to 130K molecules

## Before Making Changes

1. Run `pnpm typecheck` after any TypeScript edits
2. For content changes, confirm the schema allows your field values
3. Never hardcode a canonical value that differs from the table above
4. When updating StatusBoard or MetricCards, also update this CLAUDE.md and the memory file at `~/.claude/projects/-Users-admin/memory/tubhyam-dev.md`
