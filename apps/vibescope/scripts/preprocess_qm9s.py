"""Extract molecules from QM9S dataset into browser-ready JSON files for VibeScope.

Reads QM9S CSV files, eigendecomposes Hessian matrices to get normal modes,
detects bonds, and outputs one JSON file per molecule.

Usage:
    python scripts/preprocess_qm9s.py
"""
from __future__ import annotations

import csv
import io
import json
import zipfile
from pathlib import Path

import numpy as np

# ── Paths ──────────────────────────────────────────────────────────────
QM9S_DIR = Path(__file__).resolve().parents[1] / ".." / "Spekron" / "data" / "raw" / "qm9s"
ZIP_PATH = QM9S_DIR / "qm9s_csv.zip"
IR_PATH = QM9S_DIR / "ir_broaden.csv"
RAMAN_PATH = QM9S_DIR / "raman_broaden.csv"
OUTPUT_DIR = Path(__file__).resolve().parents[1] / "public" / "molecules"

# ── Constants ──────────────────────────────────────────────────────────
# Conversion: sqrt(eV / (Angstrom^2 * amu)) -> cm^-1
EV_TO_CM = 521.470898

ATOMIC_MASSES: dict[int, float] = {
    1: 1.008, 6: 12.011, 7: 14.007, 8: 15.999, 9: 18.998,
    16: 32.065, 17: 35.453,
}

ELEMENT_SYMBOLS: dict[int, str] = {
    1: "H", 6: "C", 7: "N", 8: "O", 9: "F", 16: "S", 17: "Cl",
}

# Covalent radii in Angstrom (for bond detection)
COVALENT_RADII: dict[int, float] = {
    1: 0.31, 6: 0.76, 7: 0.71, 8: 0.66, 9: 0.57, 16: 1.05, 17: 1.02,
}

BOND_TOLERANCE = 0.45  # Angstrom

# Typical single/double bond lengths for bond order heuristic
BOND_LENGTH_SINGLE: dict[tuple[int, int], float] = {
    (6, 6): 1.54, (6, 7): 1.47, (6, 8): 1.43, (6, 9): 1.35,
    (7, 7): 1.45, (7, 8): 1.40, (8, 8): 1.48,
}
BOND_LENGTH_DOUBLE: dict[tuple[int, int], float] = {
    (6, 6): 1.34, (6, 7): 1.29, (6, 8): 1.21, (7, 7): 1.25, (7, 8): 1.24,
}

# Target molecules: (QM9S index, name, expected SMILES fragment)
TARGET_MOLECULES = [
    (1, "methane"),
    (2, "ammonia"),
    (3, "water"),
    (4, "acetylene"),
    (5, "hydrogen_cyanide"),
    (6, "formaldehyde"),
    (7, "ethane"),
    (8, "methanol"),
    (10, "acetonitrile"),
    (11, "acetaldehyde"),
    (12, "formamide"),
    (13, "propane"),
    (14, "ethanol"),
    (16, "cyclopropane"),
    (19, "isobutane"),
    (43, "cyclobutane"),
    (197, "benzene"),
]


def _parse_row(line: str) -> list[str]:
    """Split a CSV line and filter out empty trailing values."""
    return [v.strip() for v in line.split(",") if v.strip()]


def parse_molecule_csv(content: str) -> dict:
    """Parse a single QM9S CSV file into a molecule dict.

    File format (0-indexed file lines):
        Line 0: header row (column indices)
        Line 1 (row 0): QM9S_idx, QM9_idx, SMILES, n_atoms
        Lines 2-10 (rows 1-9): energy, charges, dipole, quadrupole, etc.
        Lines 11 to 10+n (rows 10 to 9+n): Cartesian coordinates
        Lines 11+n to 10+2n: dipole derivatives (9 vals per atom)
        Lines 11+2n to 10+3n: polarizability derivatives (18 vals per atom)
        Lines 11+3n to 10+6n: Hessian matrix (3N x 3N)
    """
    lines = content.strip().split("\n")

    # Line 1 (skip header at line 0): metadata
    meta = _parse_row(lines[1])
    smiles = meta[3]  # [row_idx, qm9s_idx, qm9_idx, SMILES, n_atoms]
    n_atoms = int(float(meta[4]))

    # Coordinates: file lines 11 to 10+n
    # Format: row_idx, atomic_number, x, y, z
    coords_start = 11  # file line index
    atomic_numbers: list[int] = []
    positions: list[list[float]] = []

    for i in range(coords_start, coords_start + n_atoms):
        parts = _parse_row(lines[i])
        z_num = int(float(parts[1]))
        x, y, z = float(parts[2]), float(parts[3]), float(parts[4])
        atomic_numbers.append(z_num)
        positions.append([x, y, z])

    positions_arr = np.array(positions)

    # Dipole derivatives: file lines 11+n to 10+2n
    dd_start = coords_start + n_atoms
    dipole_derivs = []
    for i in range(dd_start, dd_start + n_atoms):
        parts = _parse_row(lines[i])
        vals = [float(v) for v in parts[1:]]  # skip row index
        dipole_derivs.append(vals)
    dipole_derivs_arr = np.array(dipole_derivs)
    if dipole_derivs_arr.shape[1] >= 9:
        dipole_derivs_arr = dipole_derivs_arr[:, :9].reshape(n_atoms, 3, 3)
    else:
        dipole_derivs_arr = None

    # Polarizability derivatives: file lines 11+2n to 10+3n
    pd_start = dd_start + n_atoms

    # Hessian: file lines 11+3n to 10+6n
    hess_start = pd_start + n_atoms
    n3 = 3 * n_atoms
    hessian_rows = []
    for i in range(hess_start, hess_start + n3):
        parts = _parse_row(lines[i])
        row = [float(v) for v in parts[1:]]  # skip row index
        hessian_rows.append(row)
    hessian = np.array(hessian_rows)

    return {
        "smiles": smiles,
        "n_atoms": n_atoms,
        "atomic_numbers": atomic_numbers,
        "positions": positions_arr,
        "hessian": hessian,
        "dipole_derivs": dipole_derivs_arr,
    }


def compute_normal_modes(
    hessian: np.ndarray,
    atomic_numbers: list[int],
    n_atoms: int,
) -> tuple[np.ndarray, np.ndarray]:
    """Eigendecompose mass-weighted Hessian to get frequencies and displacement vectors.

    Returns:
        frequencies: (n_modes,) in cm^-1
        displacements: (n_modes, n_atoms, 3) normalized displacement vectors
    """
    masses = np.array([ATOMIC_MASSES[z] for z in atomic_numbers])

    # Mass-weight the Hessian
    mass_vec = np.repeat(masses, 3)  # (3N,)
    sqrt_mass = np.sqrt(mass_vec)
    hessian_mw = hessian / np.outer(sqrt_mass, sqrt_mass)

    # Symmetrize (numerical noise)
    hessian_mw = 0.5 * (hessian_mw + hessian_mw.T)

    # Eigendecompose
    eigenvalues, eigenvectors = np.linalg.eigh(hessian_mw)

    # Convert eigenvalues to frequencies in cm^-1
    # freq = EV_TO_CM * sqrt(|eigenvalue|) * sign(eigenvalue)
    freqs = np.where(
        eigenvalues >= 0,
        EV_TO_CM * np.sqrt(np.abs(eigenvalues)),
        -EV_TO_CM * np.sqrt(np.abs(eigenvalues)),
    )

    # Check linearity: if molecule is linear, discard 5 modes; otherwise 6
    is_linear = check_linearity(n_atoms, eigenvalues)
    n_skip = 5 if is_linear else 6

    # Keep only real vibrational modes (skip translation + rotation)
    valid_mask = np.arange(len(freqs)) >= n_skip
    freqs = freqs[valid_mask]
    eigvecs = eigenvectors[:, valid_mask]  # (3N, n_modes)

    # Un-mass-weight the eigenvectors to get Cartesian displacements
    cart_displacements = eigvecs / sqrt_mass[:, np.newaxis]

    # Reshape to (n_modes, n_atoms, 3)
    n_modes = cart_displacements.shape[1]
    displacements = cart_displacements.T.reshape(n_modes, n_atoms, 3)

    # Normalize each mode so max atomic displacement magnitude = 1.0
    for m in range(n_modes):
        atom_magnitudes = np.linalg.norm(displacements[m], axis=1)
        max_mag = atom_magnitudes.max()
        if max_mag > 1e-10:
            displacements[m] /= max_mag

    return freqs, displacements


def check_linearity(n_atoms: int, eigenvalues: np.ndarray) -> bool:
    """Check if molecule is linear by looking at near-zero eigenvalues."""
    if n_atoms <= 2:
        return True
    # Sort eigenvalues and check if the 6th is much larger than the 5th
    sorted_eigs = np.sort(np.abs(eigenvalues))
    if len(sorted_eigs) < 6:
        return True
    # If the 6th eigenvalue is very small (< threshold), molecule is linear
    threshold = 0.001  # eV/Angstrom^2/amu
    return sorted_eigs[5] < threshold


def detect_bonds(
    positions: np.ndarray, atomic_numbers: list[int]
) -> list[dict[str, int]]:
    """Detect bonds based on covalent radii."""
    n = len(atomic_numbers)
    bonds = []
    for i in range(n):
        for j in range(i + 1, n):
            dist = np.linalg.norm(positions[i] - positions[j])
            r_cov_i = COVALENT_RADII.get(atomic_numbers[i], 1.0)
            r_cov_j = COVALENT_RADII.get(atomic_numbers[j], 1.0)
            if dist < r_cov_i + r_cov_j + BOND_TOLERANCE:
                order = estimate_bond_order(atomic_numbers[i], atomic_numbers[j], dist)
                bonds.append({"atom1": i, "atom2": j, "order": order})
    return bonds


def estimate_bond_order(z1: int, z2: int, dist: float) -> int:
    """Estimate bond order from distance."""
    key = tuple(sorted([z1, z2]))
    double_len = BOND_LENGTH_DOUBLE.get(key)  # type: ignore[arg-type]
    if double_len and dist < (double_len + 0.10):
        return 2
    return 1


def center_molecule(positions: np.ndarray, masses: np.ndarray) -> np.ndarray:
    """Center molecule at center of mass."""
    com = np.average(positions, axis=0, weights=masses)
    return positions - com


def compute_ir_intensity(
    dipole_derivs: np.ndarray | None,
    displacements_raw: np.ndarray,
    n_atoms: int,
) -> float:
    """Compute IR intensity for a single mode from dipole derivatives."""
    if dipole_derivs is None:
        return 0.0
    # dipole_derivs: (n_atoms, 3, 3) -> d(mu_alpha)/d(R_i_beta)
    # displacement: (n_atoms, 3)
    # IR intensity = sum_alpha |sum_i,beta (d mu_alpha / d R_i_beta) * L_i_beta|^2
    intensity = 0.0
    for alpha in range(3):
        component = 0.0
        for i in range(n_atoms):
            for beta in range(3):
                component += dipole_derivs[i, alpha, beta] * displacements_raw[i, beta]
        intensity += component ** 2
    return float(intensity)


def smiles_to_formula(smiles: str, atomic_numbers: list[int]) -> str:
    """Generate molecular formula from atomic numbers."""
    from collections import Counter
    counts = Counter(ELEMENT_SYMBOLS.get(z, "?") for z in atomic_numbers)
    # Standard order: C, H, then alphabetical
    formula = ""
    for elem in ["C", "H"]:
        if elem in counts:
            formula += elem
            if counts[elem] > 1:
                formula += str(counts[elem])
            del counts[elem]
    for elem in sorted(counts):
        formula += elem
        if counts[elem] > 1:
            formula += str(counts[elem])
    return formula


def load_broadened_spectra(
    mol_index: int,
) -> dict[str, list[float]] | None:
    """Load broadened IR and Raman spectra for a molecule."""
    wavenumbers = list(range(500, 4001))  # 500 to 4000 cm^-1, 1 cm^-1 step

    ir_data = None
    raman_data = None

    # IR spectra — CSV has header row at line 0, data rows start at line 1.
    # First column is 0-based molecule index, rest are spectral values.
    # mol_index is 1-based, so data row for mol_index=1 is at enumerate index 1.
    if IR_PATH.exists():
        with open(IR_PATH) as f:
            reader = csv.reader(f)
            for i, row in enumerate(reader):
                if i == 0:
                    continue  # skip header
                if i == mol_index:
                    # Skip first column (index), filter empty trailing values
                    ir_data = [float(v) for v in row[1:] if v.strip()]
                    break

    # Raman spectra — same format as IR
    if RAMAN_PATH.exists():
        with open(RAMAN_PATH) as f:
            reader = csv.reader(f)
            for i, row in enumerate(reader):
                if i == 0:
                    continue
                if i == mol_index:
                    raman_data = [float(v) for v in row[1:] if v.strip()]
                    break

    if ir_data is None and raman_data is None:
        return None

    # Downsample from 3501 to ~350 points (every 10th)
    step = 10
    wn_down = wavenumbers[::step]
    ir_down = ir_data[::step] if ir_data else [0.0] * len(wn_down)
    raman_down = raman_data[::step] if raman_data else [0.0] * len(wn_down)

    return {
        "wavenumbers": wn_down,
        "ir": ir_down,
        "raman": raman_down,
    }


def process_molecule(
    zip_file: zipfile.ZipFile,
    mol_index: int,
    mol_name: str,
) -> dict | None:
    """Process a single molecule from the QM9S zip file."""
    # Find the CSV file in the zip
    target_name = None
    for name in zip_file.namelist():
        # Files are named like "qm9s_1.csv" or similar
        if name.endswith(f"_{mol_index}.csv") or name.endswith(f"/{mol_index}.csv"):
            target_name = name
            break

    if target_name is None:
        # Try different naming patterns
        for name in zip_file.namelist():
            basename = name.split("/")[-1].replace(".csv", "")
            try:
                if int(basename) == mol_index:
                    target_name = name
                    break
            except ValueError:
                continue

    if target_name is None:
        print(f"  WARNING: Could not find CSV for molecule {mol_index} ({mol_name})")
        return None

    print(f"  Found: {target_name}")
    content = zip_file.read(target_name).decode("utf-8")

    # Parse CSV
    mol = parse_molecule_csv(content)

    # Center molecule
    masses = np.array([ATOMIC_MASSES[z] for z in mol["atomic_numbers"]])
    mol["positions"] = center_molecule(mol["positions"], masses)

    # Compute normal modes
    freqs, displacements = compute_normal_modes(
        mol["hessian"], mol["atomic_numbers"], mol["n_atoms"]
    )

    # Detect bonds
    bonds = detect_bonds(mol["positions"], mol["atomic_numbers"])

    # Compute IR intensities for each mode
    ir_intensities = []
    for m in range(len(freqs)):
        ir_int = compute_ir_intensity(
            mol["dipole_derivs"], displacements[m], mol["n_atoms"]
        )
        ir_intensities.append(round(ir_int, 4))

    # Load broadened spectra
    spectrum = load_broadened_spectra(mol_index)

    # Build JSON structure
    formula = smiles_to_formula(mol["smiles"], mol["atomic_numbers"])

    atoms = []
    for i in range(mol["n_atoms"]):
        z = mol["atomic_numbers"][i]
        atoms.append({
            "element": ELEMENT_SYMBOLS.get(z, "?"),
            "x": round(float(mol["positions"][i, 0]), 6),
            "y": round(float(mol["positions"][i, 1]), 6),
            "z": round(float(mol["positions"][i, 2]), 6),
            "mass": ATOMIC_MASSES.get(z, 1.0),
        })

    modes = []
    for m in range(len(freqs)):
        if freqs[m] < 10:  # Skip near-zero modes
            continue
        modes.append({
            "index": len(modes),
            "frequency": round(float(freqs[m]), 1),
            "ir_intensity": ir_intensities[m] if m < len(ir_intensities) else 0.0,
            "raman_activity": 0.0,  # Would need more complex computation
            "symmetry": "",
            "displacements": [
                [round(float(d), 6) for d in displacements[m, i]]
                for i in range(mol["n_atoms"])
            ],
        })

    result: dict = {
        "name": mol_name,
        "formula": formula,
        "smiles": mol["smiles"],
        "atomCount": mol["n_atoms"],
        "atoms": atoms,
        "bonds": bonds,
        "modes": modes,
    }

    if spectrum:
        result["spectrum"] = spectrum

    return result


def main() -> None:
    """Extract target molecules from QM9S and write JSON files."""
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    print(f"Opening QM9S zip: {ZIP_PATH}")
    if not ZIP_PATH.exists():
        print(f"ERROR: {ZIP_PATH} not found!")
        return

    # First, peek at the zip structure
    with zipfile.ZipFile(ZIP_PATH, "r") as zf:
        all_names = zf.namelist()
        print(f"  Zip contains {len(all_names)} files")
        if all_names:
            print(f"  Example: {all_names[0]}, {all_names[1] if len(all_names) > 1 else ''}")

        manifest = []

        for mol_index, mol_name in TARGET_MOLECULES:
            print(f"\nProcessing {mol_name} (index {mol_index})...")
            result = process_molecule(zf, mol_index, mol_name)

            if result is None:
                continue

            # Write JSON
            out_path = OUTPUT_DIR / f"{mol_name}.json"
            with open(out_path, "w") as f:
                json.dump(result, f, indent=2)
            print(f"  Wrote {out_path.name}: {result['atomCount']} atoms, {len(result['modes'])} modes")

            manifest.append({
                "id": mol_name,
                "name": mol_name.replace("_", " ").title(),
                "formula": result["formula"],
                "smiles": result["smiles"],
                "atomCount": result["atomCount"],
                "modeCount": len(result["modes"]),
            })

        # Write manifest
        manifest_path = OUTPUT_DIR / "index.json"
        with open(manifest_path, "w") as f:
            json.dump(manifest, f, indent=2)
        print(f"\nWrote manifest: {manifest_path} ({len(manifest)} molecules)")


if __name__ == "__main__":
    main()
