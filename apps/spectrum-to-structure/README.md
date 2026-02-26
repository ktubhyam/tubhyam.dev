# Spectrum-to-Structure

Input a vibrational spectrum (IR or Raman) and watch as an ML model predicts the most likely molecular structure in 3D.

**[Project Page](https://tubhyam.dev/simulations/spectrum-to-structure)**

## Features

- Upload or draw a spectrum interactively
- Real-time ML inference using SPECTRE encoder
- 3D molecular structure visualization of predicted candidates
- Confidence scores and uncertainty quantification
- Side-by-side comparison: input spectrum vs. predicted spectrum

## Tech Stack

- **Framework:** Next.js 15 + TypeScript
- **3D:** Three.js + React Three Fiber
- **ML Inference:** ONNX Runtime (browser) or API endpoint
- **Styling:** Tailwind CSS 4
- **Model:** SPECTRE encoder + retrieval decoder

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## How It Works

1. User provides an IR or Raman spectrum (upload, paste, or draw)
2. The SPECTRE encoder processes the spectrum through CNN tokenizer → Transformer → VIB head
3. The z_chem latent vector is compared against a molecular database via nearest neighbor retrieval
4. Top-k candidate structures are displayed in 3D with confidence scores
5. Conformal prediction provides calibrated uncertainty bounds

## License

MIT
