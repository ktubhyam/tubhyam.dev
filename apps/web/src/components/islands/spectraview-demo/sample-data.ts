/**
 * Embedded sample spectra for the SpectraView demo.
 * Synthetic IR data with Gaussian peaks at common functional group frequencies.
 */

/** Generate a Gaussian peak. */
function gaussian(x: number, center: number, width: number, height: number): number {
  return height * Math.exp(-0.5 * ((x - center) / width) ** 2);
}

/** Create a synthetic ethanol IR spectrum. */
export function createEthanolSpectrum() {
  const n = 500;
  const x = new Float64Array(n);
  const y = new Float64Array(n);

  for (let i = 0; i < n; i++) {
    x[i] = 400 + (i / (n - 1)) * 3600;
    y[i] =
      0.05 +
      gaussian(x[i], 1050, 35, 0.65) + // C-O stretch
      gaussian(x[i], 1380, 20, 0.25) + // C-H bend
      gaussian(x[i], 1450, 25, 0.3) + // C-H bend
      gaussian(x[i], 2900, 50, 0.5) + // C-H stretch
      gaussian(x[i], 2970, 40, 0.45) + // C-H stretch (asym)
      gaussian(x[i], 3350, 150, 0.8); // O-H stretch (broad)
  }

  return {
    id: "ethanol",
    label: "Ethanol",
    x,
    y,
    xUnit: "cm\u207B\u00B9" as const,
    yUnit: "Absorbance" as const,
    type: "IR" as const,
    visible: true,
  };
}

/** Create a synthetic acetone IR spectrum. */
export function createAcetoneSpectrum() {
  const n = 500;
  const x = new Float64Array(n);
  const y = new Float64Array(n);

  for (let i = 0; i < n; i++) {
    x[i] = 400 + (i / (n - 1)) * 3600;
    y[i] =
      0.03 +
      gaussian(x[i], 1220, 30, 0.5) + // C-C stretch
      gaussian(x[i], 1365, 20, 0.35) + // C-H bend (sym)
      gaussian(x[i], 1715, 30, 0.95) + // C=O stretch
      gaussian(x[i], 2925, 40, 0.3) + // C-H stretch
      gaussian(x[i], 3005, 35, 0.25); // C-H stretch
  }

  return {
    id: "acetone",
    label: "Acetone",
    x,
    y,
    xUnit: "cm\u207B\u00B9" as const,
    yUnit: "Absorbance" as const,
    type: "IR" as const,
    visible: true,
  };
}

/** Create a synthetic isopropanol IR spectrum. */
export function createIsopropanolSpectrum() {
  const n = 500;
  const x = new Float64Array(n);
  const y = new Float64Array(n);

  for (let i = 0; i < n; i++) {
    x[i] = 400 + (i / (n - 1)) * 3600;
    y[i] =
      0.04 +
      gaussian(x[i], 950, 30, 0.45) + // C-O stretch
      gaussian(x[i], 1130, 25, 0.55) + // C-O stretch
      gaussian(x[i], 1380, 20, 0.3) + // C-H bend
      gaussian(x[i], 2880, 35, 0.4) + // C-H stretch
      gaussian(x[i], 2970, 45, 0.5) + // C-H stretch
      gaussian(x[i], 3380, 140, 0.7); // O-H stretch
  }

  return {
    id: "isopropanol",
    label: "Isopropanol",
    x,
    y,
    xUnit: "cm\u207B\u00B9" as const,
    yUnit: "Absorbance" as const,
    type: "IR" as const,
    visible: true,
  };
}
