#!/usr/bin/env python3
"""Generate molecule JSON files for Normal Mode Explorer."""

import json
import math
import os

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "molecules")

MASSES = {
    "H": 1.008, "B": 10.811, "C": 12.011, "N": 14.007,
    "O": 15.999, "F": 18.998, "P": 30.974, "S": 32.065, "Cl": 35.453,
}


def make_atom(el: str, x: float, y: float, z: float) -> dict:
    return {"element": el, "x": round(x, 6), "y": round(y, 6), "z": round(z, 6), "mass": MASSES[el]}


def make_bond(a1: int, a2: int, order: int = 1) -> dict:
    return {"atom1": a1, "atom2": a2, "order": order}


def normalize_displacements(disps: list[list[float]]) -> list[list[float]]:
    max_mag = max(math.sqrt(sum(c**2 for c in d)) for d in disps) or 1.0
    return [[round(c / max_mag, 6) for c in d] for d in disps]


def make_mode(idx: int, freq: float, ir: float, raman: float,
              disps: list[list[float]], sym: str = "") -> dict:
    return {
        "index": idx,
        "frequency": freq,
        "ir_intensity": ir,
        "raman_activity": raman,
        "symmetry": sym,
        "displacements": normalize_displacements(disps),
    }


def lorentzian_spectrum(modes: list[dict], wn_start=500, wn_end=4000, wn_step=10, gamma=10.0) -> dict:
    wavenumbers = list(range(wn_start, wn_end + 1, wn_step))
    ir_spec = []
    raman_spec = []
    for w in wavenumbers:
        ir_val = sum(m["ir_intensity"] * gamma**2 / ((w - m["frequency"])**2 + gamma**2) for m in modes)
        raman_val = sum(m["raman_activity"] * gamma**2 / ((w - m["frequency"])**2 + gamma**2) for m in modes)
        ir_spec.append(round(ir_val, 10))
        raman_spec.append(round(raman_val, 10))
    return {"wavenumbers": wavenumbers, "ir": ir_spec, "raman": raman_spec}


def build_molecule(mol_id: str, name: str, formula: str, smiles: str,
                   atoms: list[dict], bonds: list[dict], modes: list[dict]) -> dict:
    return {
        "name": mol_id,
        "formula": formula,
        "smiles": smiles,
        "atomCount": len(atoms),
        "atoms": atoms,
        "bonds": bonds,
        "modes": modes,
        "spectrum": lorentzian_spectrum(modes),
    }


# ============================================================
# Molecule definitions
# ============================================================

Z = [0.0, 0.0, 0.0]


def carbon_dioxide():
    """CO2 - linear, D_inf_h"""
    d = 1.16
    atoms = [make_atom("C", 0, 0, 0), make_atom("O", -d, 0, 0), make_atom("O", d, 0, 0)]
    bonds = [make_bond(0, 1, 2), make_bond(0, 2, 2)]
    modes = [
        make_mode(0, 667.0, 0.0, 0.0, [[0, 0.5, 0], [0, -0.7, 0], [0, 0.7, 0]], "Pi_u bend"),
        make_mode(1, 667.0, 0.0, 0.0, [[0, 0, 0.5], [0, 0, -0.7], [0, 0, 0.7]], "Pi_u bend"),
        make_mode(2, 1388.0, 0.0, 7.0, [[0, 0, 0], [-0.7, 0, 0], [0.7, 0, 0]], "Sigma_g sym stretch"),
        make_mode(3, 2349.0, 100.0, 0.0, [[-0.5, 0, 0], [0.7, 0, 0], [0.7, 0, 0]], "Sigma_u asym stretch"),
    ]
    # CO2 bends are IR active (degenerate pair), sym stretch is Raman only, asym is IR only
    modes[0]["ir_intensity"] = 20.0
    modes[1]["ir_intensity"] = 20.0
    return build_molecule("carbon_dioxide", "Carbon Dioxide", "CO2", "O=C=O", atoms, bonds, modes)


def hydrogen_fluoride():
    """HF - diatomic"""
    d = 0.917
    atoms = [make_atom("H", 0, 0, 0), make_atom("F", d, 0, 0)]
    bonds = [make_bond(0, 1, 1)]
    modes = [make_mode(0, 4138.0, 45.0, 3.0, [[-0.95, 0, 0], [0.05, 0, 0]], "Sigma stretch")]
    return build_molecule("hydrogen_fluoride", "Hydrogen Fluoride", "HF", "[H]F", atoms, bonds, modes)


def hydrogen_chloride():
    """HCl - diatomic"""
    d = 1.275
    atoms = [make_atom("H", 0, 0, 0), make_atom("Cl", d, 0, 0)]
    bonds = [make_bond(0, 1, 1)]
    modes = [make_mode(0, 2886.0, 35.0, 4.0, [[-0.97, 0, 0], [0.03, 0, 0]], "Sigma stretch")]
    return build_molecule("hydrogen_chloride", "Hydrogen Chloride", "HCl", "[H]Cl", atoms, bonds, modes)


def sulfur_dioxide():
    """SO2 - bent, C2v"""
    d = 1.43
    angle = math.radians(119.0 / 2)
    atoms = [
        make_atom("S", 0, 0, 0),
        make_atom("O", -d * math.sin(angle), d * math.cos(angle), 0),
        make_atom("O", d * math.sin(angle), d * math.cos(angle), 0),
    ]
    bonds = [make_bond(0, 1, 2), make_bond(0, 2, 2)]
    modes = [
        make_mode(0, 518.0, 3.0, 1.5, [[0, -0.3, 0], [0.7, 0.5, 0], [-0.7, 0.5, 0]], "A1 bend"),
        make_mode(1, 1151.0, 8.0, 5.0, [[0, 0.3, 0], [0, -0.7, 0], [0, -0.7, 0]], "A1 sym stretch"),
        make_mode(2, 1362.0, 25.0, 0.5, [[0, 0, 0], [-0.7, 0.3, 0], [0.7, 0.3, 0]], "B1 asym stretch"),
    ]
    return build_molecule("sulfur_dioxide", "Sulfur Dioxide", "SO2", "O=S=O", atoms, bonds, modes)


def hydrogen_sulfide():
    """H2S - bent, C2v"""
    d = 1.336
    angle = math.radians(92.1 / 2)
    atoms = [
        make_atom("S", 0, 0, 0),
        make_atom("H", -d * math.sin(angle), d * math.cos(angle), 0),
        make_atom("H", d * math.sin(angle), d * math.cos(angle), 0),
    ]
    bonds = [make_bond(0, 1, 1), make_bond(0, 2, 1)]
    modes = [
        make_mode(0, 1183.0, 5.0, 3.0, [[0, -0.05, 0], [0.7, 0.5, 0], [-0.7, 0.5, 0]], "A1 bend"),
        make_mode(1, 2615.0, 2.0, 7.0, [[0, 0.06, 0], [0, -0.7, 0], [0, -0.7, 0]], "A1 sym stretch"),
        make_mode(2, 2626.0, 8.0, 1.0, [[0, 0, 0], [0.3, -0.7, 0], [-0.3, -0.7, 0]], "B2 asym stretch"),
    ]
    return build_molecule("hydrogen_sulfide", "Hydrogen Sulfide", "H2S", "S", atoms, bonds, modes)


def phosphine():
    """PH3 - pyramidal, C3v"""
    d = 1.42
    angle = math.radians(93.3)
    h_z = d * math.cos(angle)
    h_r = d * math.sin(angle)
    atoms = [
        make_atom("P", 0, 0, 0),
        make_atom("H", h_r, 0, h_z),
        make_atom("H", -h_r * 0.5, h_r * 0.866, h_z),
        make_atom("H", -h_r * 0.5, -h_r * 0.866, h_z),
    ]
    bonds = [make_bond(0, 1, 1), make_bond(0, 2, 1), make_bond(0, 3, 1)]
    modes = [
        make_mode(0, 992.0, 10.0, 2.0, [
            [0, 0, -0.1], [0.5, 0, 0.4], [-0.25, 0.43, 0.4], [-0.25, -0.43, 0.4]
        ], "A1 bend"),
        make_mode(1, 1118.0, 15.0, 0.5, [
            [0, 0, 0], [0.3, 0, -0.5], [-0.6, 0.35, 0.25], [0.3, -0.35, 0.25]
        ], "E bend"),
        make_mode(2, 1118.0, 15.0, 0.5, [
            [0, 0, 0], [0, 0.5, 0], [0.43, -0.25, 0], [-0.43, -0.25, 0]
        ], "E bend"),
        make_mode(3, 2323.0, 3.0, 8.0, [
            [0, 0, 0.1], [-0.4, 0, -0.5], [0.2, -0.35, -0.5], [0.2, 0.35, -0.5]
        ], "A1 sym stretch"),
        make_mode(4, 2328.0, 6.0, 2.0, [
            [0, 0, 0], [-0.7, 0, 0.35], [0.35, -0.6, 0.35], [0.35, 0.6, -0.7]
        ], "E asym stretch"),
        make_mode(5, 2328.0, 6.0, 2.0, [
            [0, 0, 0], [0, -0.7, 0], [0.6, 0.35, 0], [-0.6, 0.35, 0]
        ], "E asym stretch"),
    ]
    return build_molecule("phosphine", "Phosphine", "PH3", "P", atoms, bonds, modes)


def boron_trifluoride():
    """BF3 - trigonal planar, D3h"""
    d = 1.313
    atoms = [
        make_atom("B", 0, 0, 0),
        make_atom("F", d, 0, 0),
        make_atom("F", -d * 0.5, d * 0.866, 0),
        make_atom("F", -d * 0.5, -d * 0.866, 0),
    ]
    bonds = [make_bond(0, 1, 1), make_bond(0, 2, 1), make_bond(0, 3, 1)]
    modes = [
        make_mode(0, 480.0, 0.0, 2.0, [
            [0, 0, 0.3], [0, 0, -0.6], [0, 0, -0.6], [0, 0, -0.6]
        ], "A2'' oop"),
        make_mode(1, 691.0, 15.0, 0.0, [
            [0.2, 0, 0], [-0.6, 0, 0], [0.3, -0.5, 0], [0.3, 0.5, 0]
        ], "E' asym stretch"),
        make_mode(2, 691.0, 15.0, 0.0, [
            [0, 0.2, 0], [0, 0, 0], [0.5, -0.3, 0], [-0.5, -0.3, 0]
        ], "E' asym stretch"),
        make_mode(3, 888.0, 0.0, 5.0, [
            [0, 0, 0], [-0.6, 0, 0], [0.3, -0.5, 0], [0.3, 0.5, 0]
        ], "A1' sym stretch"),
        make_mode(4, 1453.0, 60.0, 0.0, [
            [-0.15, 0, 0], [0.6, 0, 0], [-0.3, 0.5, 0], [-0.3, -0.5, 0]
        ], "E' bend"),
        make_mode(5, 1453.0, 60.0, 0.0, [
            [0, -0.15, 0], [0, 0.6, 0], [-0.5, -0.3, 0], [0.5, -0.3, 0]
        ], "E' bend"),
    ]
    return build_molecule("boron_trifluoride", "Boron Trifluoride", "BF3", "FB(F)F", atoms, bonds, modes)


def carbon_tetrachloride():
    """CCl4 - tetrahedral, Td"""
    d = 1.766
    s = d / math.sqrt(3)
    atoms = [
        make_atom("C", 0, 0, 0),
        make_atom("Cl", s, s, s),
        make_atom("Cl", s, -s, -s),
        make_atom("Cl", -s, s, -s),
        make_atom("Cl", -s, -s, s),
    ]
    bonds = [make_bond(0, 1, 1), make_bond(0, 2, 1), make_bond(0, 3, 1), make_bond(0, 4, 1)]
    modes = [
        # A1 sym stretch (Raman only)
        make_mode(0, 459.0, 0.0, 10.0, [
            Z, [0.3, 0.3, 0.3], [0.3, -0.3, -0.3], [-0.3, 0.3, -0.3], [-0.3, -0.3, 0.3]
        ], "A1 sym stretch"),
        # E bend (Raman only, 2-fold degenerate)
        make_mode(1, 218.0, 0.0, 2.0, [
            Z, [0.3, 0.3, -0.6], [0.3, -0.3, 0.6], [-0.3, 0.3, 0.6], [-0.3, -0.3, -0.6]
        ], "E bend"),
        make_mode(2, 218.0, 0.0, 2.0, [
            Z, [0.5, -0.5, 0], [0.5, 0.5, 0], [-0.5, -0.5, 0], [-0.5, 0.5, 0]
        ], "E bend"),
        # T2 asym stretch (IR active, 3-fold degenerate)
        make_mode(3, 776.0, 80.0, 1.0, [
            [0.2, 0, 0], [-0.5, 0.3, 0.3], [-0.5, -0.3, -0.3], [0.5, 0.3, -0.3], [0.5, -0.3, 0.3]
        ], "T2 asym stretch"),
        make_mode(4, 776.0, 80.0, 1.0, [
            [0, 0.2, 0], [0.3, -0.5, 0.3], [-0.3, -0.5, -0.3], [0.3, 0.5, -0.3], [-0.3, 0.5, 0.3]
        ], "T2 asym stretch"),
        make_mode(5, 776.0, 80.0, 1.0, [
            [0, 0, 0.2], [0.3, 0.3, -0.5], [-0.3, -0.3, -0.5], [-0.3, 0.3, 0.5], [0.3, -0.3, 0.5]
        ], "T2 asym stretch"),
        # T2 bend (IR active, 3-fold degenerate)
        make_mode(6, 314.0, 10.0, 0.5, [
            [0, 0.1, 0.1], [0, -0.3, 0.3], [0, 0.3, -0.3], [0, 0.3, -0.3], [0, -0.3, 0.3]
        ], "T2 bend"),
        make_mode(7, 314.0, 10.0, 0.5, [
            [0.1, 0, 0.1], [-0.3, 0, 0.3], [0.3, 0, -0.3], [0.3, 0, -0.3], [-0.3, 0, 0.3]
        ], "T2 bend"),
        make_mode(8, 314.0, 10.0, 0.5, [
            [0.1, 0.1, 0], [0.3, -0.3, 0], [-0.3, 0.3, 0], [-0.3, 0.3, 0], [0.3, -0.3, 0]
        ], "T2 bend"),
    ]
    return build_molecule("carbon_tetrachloride", "Carbon Tetrachloride", "CCl4", "ClC(Cl)(Cl)Cl", atoms, bonds, modes)


def nitrous_oxide():
    """N2O - linear, asymmetric"""
    # N=N=O arrangement
    d_nn = 1.128
    d_no = 1.184
    atoms = [
        make_atom("N", 0, 0, 0),
        make_atom("N", d_nn, 0, 0),
        make_atom("O", d_nn + d_no, 0, 0),
    ]
    bonds = [make_bond(0, 1, 2), make_bond(1, 2, 2)]
    modes = [
        make_mode(0, 589.0, 15.0, 0.5, [[0, 0.5, 0], [0, -0.7, 0], [0, 0.3, 0]], "Pi bend"),
        make_mode(1, 589.0, 15.0, 0.5, [[0, 0, 0.5], [0, 0, -0.7], [0, 0, 0.3]], "Pi bend"),
        make_mode(2, 1285.0, 6.0, 4.0, [[-0.5, 0, 0], [0.1, 0, 0], [0.7, 0, 0]], "Sym stretch"),
        make_mode(3, 2224.0, 100.0, 0.3, [[0.5, 0, 0], [-0.7, 0, 0], [0.3, 0, 0]], "Asym stretch"),
    ]
    return build_molecule("nitrous_oxide", "Nitrous Oxide", "N2O", "[N-]=[N+]=O", atoms, bonds, modes)


def formic_acid():
    """HCOOH"""
    atoms = [
        make_atom("C", 0, 0, 0),
        make_atom("O", 1.20, 0, 0),         # C=O
        make_atom("O", -0.36, 1.08, 0),      # C-OH
        make_atom("H", -0.55, -0.77, 0),     # C-H
        make_atom("H", -0.36 + 0.87, 1.08 + 0.50, 0),  # O-H
    ]
    bonds = [
        make_bond(0, 1, 2), make_bond(0, 2, 1), make_bond(0, 3, 1), make_bond(2, 4, 1),
    ]
    modes = [
        make_mode(0, 625.0, 12.0, 0.5, [
            [0.1, 0.1, 0], [-0.3, -0.2, 0], [0.1, -0.2, 0], [0.1, 0.3, 0], [-0.3, 0.8, 0]
        ], "OCO bend"),
        make_mode(1, 1033.0, 20.0, 1.0, [
            [0.1, 0, 0], [0.05, 0, 0], [-0.5, 0, 0], [0.05, 0, 0], [0.8, -0.4, 0]
        ], "C-O stretch"),
        make_mode(2, 1105.0, 30.0, 0.5, [
            [0, 0.1, 0], [0, -0.1, 0], [0, -0.1, 0], [0, -0.8, 0], [0, 0.3, 0]
        ], "CH bend"),
        make_mode(3, 1229.0, 25.0, 0.8, [
            [-0.1, 0, 0], [0.2, 0, 0], [-0.3, 0, 0], [0.1, 0, 0], [0.5, -0.7, 0]
        ], "C-O-H bend"),
        make_mode(4, 1387.0, 5.0, 1.5, [
            [0.2, 0, 0], [-0.5, 0, 0], [0.3, 0, 0], [-0.1, 0, 0], [0.1, 0, 0]
        ], "sym C-O stretch"),
        make_mode(5, 1770.0, 80.0, 3.0, [
            [0.2, 0, 0], [-0.7, 0, 0], [0.1, 0, 0], [-0.05, 0, 0], [0.05, 0, 0]
        ], "C=O stretch"),
        make_mode(6, 2943.0, 10.0, 5.0, [
            [0.05, 0.03, 0], [0, 0, 0], [0, 0, 0], [-0.7, -0.7, 0], [0, 0, 0]
        ], "C-H stretch"),
        make_mode(7, 3570.0, 50.0, 2.0, [
            [0, 0, 0], [0, 0, 0], [0.02, 0, 0], [0, 0, 0], [0.5, -0.85, 0]
        ], "O-H stretch"),
        make_mode(8, 1036.0, 5.0, 0.2, [
            [0, 0, 0.3], [0, 0, -0.2], [0, 0, -0.2], [0, 0, -0.8], [0, 0, 0.3]
        ], "CH oop bend"),
    ]
    return build_molecule("formic_acid", "Formic Acid", "CH2O2", "OC=O", atoms, bonds, modes)


def acetic_acid():
    """CH3COOH"""
    atoms = [
        make_atom("C", 0, 0, 0),              # 0: CH3
        make_atom("C", 1.52, 0, 0),            # 1: C(=O)OH
        make_atom("O", 1.52 + 1.20, 0, 0),     # 2: =O
        make_atom("O", 1.52 - 0.36, 1.08, 0),  # 3: -OH
        make_atom("H", -0.36, -0.51, 0.89),    # 4: H
        make_atom("H", -0.36, -0.51, -0.89),   # 5: H
        make_atom("H", -0.36, 1.02, 0),         # 6: H
        make_atom("H", 1.52 - 0.36 + 0.87, 1.08 + 0.50, 0),  # 7: OH
    ]
    bonds = [
        make_bond(0, 1, 1), make_bond(1, 2, 2), make_bond(1, 3, 1),
        make_bond(0, 4, 1), make_bond(0, 5, 1), make_bond(0, 6, 1),
        make_bond(3, 7, 1),
    ]
    n = 8
    modes = []
    freqs = [
        (0, 432.0, 3.0, 0.3, "CCO bend"),
        (1, 581.0, 8.0, 0.5, "OCO bend"),
        (2, 642.0, 15.0, 0.2, "C=O oop"),
        (3, 847.0, 5.0, 0.8, "C-C stretch"),
        (4, 989.0, 12.0, 0.4, "CH3 rock"),
        (5, 1048.0, 25.0, 1.0, "C-O stretch"),
        (6, 1178.0, 20.0, 0.6, "C-O-H bend"),
        (7, 1258.0, 35.0, 0.5, "CH3 rock"),
        (8, 1382.0, 8.0, 1.5, "sym CH3 bend"),
        (9, 1430.0, 5.0, 0.8, "asym CH3 bend"),
        (10, 1430.0, 5.0, 0.8, "asym CH3 bend"),
        (11, 1788.0, 80.0, 4.0, "C=O stretch"),
        (12, 2944.0, 3.0, 3.0, "sym CH3 stretch"),
        (13, 2996.0, 5.0, 2.0, "asym CH3 stretch"),
        (14, 2996.0, 5.0, 2.0, "asym CH3 stretch"),
        (15, 3051.0, 2.0, 1.5, "asym CH3 stretch"),
        (16, 3583.0, 45.0, 2.5, "O-H stretch"),
        (17, 534.0, 2.0, 0.1, "torsion"),
    ]
    import random
    random.seed(42)
    for idx, freq, ir, raman, sym in freqs:
        disps = []
        for _ in range(n):
            disps.append([round(random.gauss(0, 0.3), 3) for _ in range(3)])
        # Make the highest-frequency atom move most
        if "CH3 stretch" in sym:
            for i in [4, 5, 6]:
                disps[i] = [round(random.gauss(0, 0.8), 3) for _ in range(3)]
        elif "O-H" in sym:
            disps[7] = [round(random.gauss(0, 0.8), 3) for _ in range(3)]
        elif "C=O" in sym:
            disps[2] = [round(random.gauss(0, 0.8), 3) for _ in range(3)]
        modes.append(make_mode(idx, freq, ir, raman, disps, sym))
    return build_molecule("acetic_acid", "Acetic Acid", "C2H4O2", "CC(=O)O", atoms, bonds, modes)


def dimethyl_ether():
    """CH3OCH3"""
    d_co = 1.41
    angle = math.radians(111.7 / 2)
    atoms = [
        make_atom("O", 0, 0, 0),
        make_atom("C", -d_co * math.sin(angle), d_co * math.cos(angle), 0),
        make_atom("C", d_co * math.sin(angle), d_co * math.cos(angle), 0),
    ]
    c1 = (atoms[1]["x"], atoms[1]["y"])
    c2 = (atoms[2]["x"], atoms[2]["y"])
    d_ch = 1.09
    # Add H atoms to each carbon
    for ci, (cx, cy) in enumerate([c1, c2], 1):
        sign = -1 if ci == 1 else 1
        atoms.append(make_atom("H", cx, cy + d_ch, 0))
        atoms.append(make_atom("H", cx + sign * d_ch * 0.87, cy - d_ch * 0.5, d_ch * 0.5))
        atoms.append(make_atom("H", cx + sign * d_ch * 0.87, cy - d_ch * 0.5, -d_ch * 0.5))
    bonds = [
        make_bond(0, 1, 1), make_bond(0, 2, 1),
        make_bond(1, 3, 1), make_bond(1, 4, 1), make_bond(1, 5, 1),
        make_bond(2, 6, 1), make_bond(2, 7, 1), make_bond(2, 8, 1),
    ]
    n = 9
    import random
    random.seed(43)
    mode_data = [
        (0, 242.0, 0.5, 0.1, "torsion"),
        (1, 418.0, 1.0, 0.3, "COC bend"),
        (2, 924.0, 3.0, 0.5, "CH3 rock"),
        (3, 924.0, 3.0, 0.5, "CH3 rock"),
        (4, 1102.0, 25.0, 0.8, "C-O-C asym stretch"),
        (5, 1150.0, 5.0, 3.0, "C-O-C sym stretch"),
        (6, 1179.0, 8.0, 0.4, "CH3 rock"),
        (7, 1179.0, 8.0, 0.4, "CH3 rock"),
        (8, 1244.0, 12.0, 0.3, "CH3 twist"),
        (9, 1452.0, 3.0, 1.0, "CH3 bend"),
        (10, 1452.0, 3.0, 1.0, "CH3 bend"),
        (11, 1464.0, 5.0, 0.8, "CH3 bend"),
        (12, 1464.0, 5.0, 0.8, "CH3 bend"),
        (13, 1469.0, 2.0, 1.2, "CH3 sym bend"),
        (14, 1469.0, 2.0, 1.2, "CH3 sym bend"),
        (15, 2817.0, 10.0, 5.0, "CH3 sym stretch"),
        (16, 2817.0, 10.0, 5.0, "CH3 sym stretch"),
        (17, 2925.0, 3.0, 2.0, "CH3 asym stretch"),
        (18, 2925.0, 3.0, 2.0, "CH3 asym stretch"),
        (19, 2996.0, 5.0, 1.5, "CH3 asym stretch"),
        (20, 2996.0, 5.0, 1.5, "CH3 asym stretch"),
    ]
    modes = []
    for idx, freq, ir, raman, sym in mode_data:
        disps = [[round(random.gauss(0, 0.3), 3) for _ in range(3)] for _ in range(n)]
        modes.append(make_mode(idx, freq, ir, raman, disps, sym))
    return build_molecule("dimethyl_ether", "Dimethyl Ether", "C2H6O", "COC", atoms, bonds, modes)


def methylamine():
    """CH3NH2"""
    d_cn = 1.471
    d_ch = 1.09
    d_nh = 1.01
    atoms = [
        make_atom("C", 0, 0, 0),
        make_atom("N", d_cn, 0, 0),
        make_atom("H", -0.36, 0.51, 0.89),
        make_atom("H", -0.36, 0.51, -0.89),
        make_atom("H", -0.36, -1.02, 0),
        make_atom("H", d_cn + d_nh * 0.39, d_nh * 0.45, d_nh * 0.80),
        make_atom("H", d_cn + d_nh * 0.39, d_nh * 0.45, -d_nh * 0.80),
    ]
    bonds = [
        make_bond(0, 1, 1),
        make_bond(0, 2, 1), make_bond(0, 3, 1), make_bond(0, 4, 1),
        make_bond(1, 5, 1), make_bond(1, 6, 1),
    ]
    n = 7
    import random
    random.seed(44)
    mode_data = [
        (0, 268.0, 1.0, 0.1, "torsion"),
        (1, 780.0, 8.0, 0.5, "NH2 wag"),
        (2, 1044.0, 5.0, 1.0, "C-N stretch"),
        (3, 1130.0, 3.0, 0.3, "CH3 rock"),
        (4, 1130.0, 3.0, 0.3, "CH3 rock"),
        (5, 1195.0, 2.0, 0.5, "NH2 twist"),
        (6, 1419.0, 5.0, 0.8, "CH3 bend"),
        (7, 1419.0, 5.0, 0.8, "CH3 bend"),
        (8, 1474.0, 3.0, 1.2, "CH3 sym bend"),
        (9, 1623.0, 20.0, 1.5, "NH2 scissor"),
        (10, 2820.0, 8.0, 5.0, "CH3 sym stretch"),
        (11, 2961.0, 3.0, 2.0, "CH3 asym stretch"),
        (12, 2961.0, 3.0, 2.0, "CH3 asym stretch"),
        (13, 3361.0, 1.0, 3.0, "NH2 sym stretch"),
        (14, 3427.0, 2.0, 1.5, "NH2 asym stretch"),
    ]
    modes = []
    for idx, freq, ir, raman, sym in mode_data:
        disps = [[round(random.gauss(0, 0.3), 3) for _ in range(3)] for _ in range(n)]
        if "NH2" in sym and "stretch" in sym:
            disps[5] = [round(random.gauss(0, 0.8), 3) for _ in range(3)]
            disps[6] = [round(random.gauss(0, 0.8), 3) for _ in range(3)]
        elif "CH3" in sym and "stretch" in sym:
            for i in [2, 3, 4]:
                disps[i] = [round(random.gauss(0, 0.8), 3) for _ in range(3)]
        modes.append(make_mode(idx, freq, ir, raman, disps, sym))
    return build_molecule("methylamine", "Methylamine", "CH5N", "CN", atoms, bonds, modes)


def urea():
    """CO(NH2)2"""
    atoms = [
        make_atom("C", 0, 0, 0),
        make_atom("O", 0, 1.22, 0),
        make_atom("N", -1.14, -0.64, 0),
        make_atom("N", 1.14, -0.64, 0),
        make_atom("H", -1.14 - 0.42, -0.64 - 0.90, 0),
        make_atom("H", -1.14 - 0.91, -0.64 + 0.42, 0),
        make_atom("H", 1.14 + 0.42, -0.64 - 0.90, 0),
        make_atom("H", 1.14 + 0.91, -0.64 + 0.42, 0),
    ]
    bonds = [
        make_bond(0, 1, 2), make_bond(0, 2, 1), make_bond(0, 3, 1),
        make_bond(2, 4, 1), make_bond(2, 5, 1),
        make_bond(3, 6, 1), make_bond(3, 7, 1),
    ]
    n = 8
    import random
    random.seed(45)
    mode_data = [
        (0, 450.0, 5.0, 0.5, "NCN bend"),
        (1, 547.0, 10.0, 0.3, "C=O oop"),
        (2, 786.0, 3.0, 0.8, "NCN sym stretch"),
        (3, 1006.0, 8.0, 0.4, "NH2 rock"),
        (4, 1006.0, 8.0, 0.4, "NH2 rock"),
        (5, 1150.0, 20.0, 1.0, "C-N stretch"),
        (6, 1395.0, 30.0, 1.5, "NCN asym stretch"),
        (7, 1464.0, 5.0, 0.8, "NH2 twist"),
        (8, 1464.0, 5.0, 0.8, "NH2 twist"),
        (9, 1598.0, 15.0, 2.0, "NH2 scissor"),
        (10, 1598.0, 15.0, 2.0, "NH2 scissor"),
        (11, 1686.0, 85.0, 3.5, "C=O stretch"),
        (12, 3350.0, 5.0, 5.0, "NH2 sym stretch"),
        (13, 3350.0, 5.0, 5.0, "NH2 sym stretch"),
        (14, 3440.0, 15.0, 2.0, "NH2 asym stretch"),
        (15, 3440.0, 15.0, 2.0, "NH2 asym stretch"),
        (16, 380.0, 1.0, 0.1, "torsion"),
        (17, 1060.0, 4.0, 0.3, "NH2 wag"),
    ]
    modes = []
    for idx, freq, ir, raman, sym in mode_data:
        disps = [[round(random.gauss(0, 0.3), 3) for _ in range(3)] for _ in range(n)]
        if "C=O" in sym and "stretch" in sym.lower():
            disps[1] = [0, round(random.gauss(0, 0.8), 3), 0]
        elif "NH2" in sym and "stretch" in sym:
            for i in [4, 5, 6, 7]:
                disps[i] = [round(random.gauss(0, 0.8), 3) for _ in range(3)]
        modes.append(make_mode(idx, freq, ir, raman, disps, sym))
    return build_molecule("urea", "Urea", "CH4N2O", "NC(=O)N", atoms, bonds, modes)


def glycine():
    """NH2CH2COOH - simplest amino acid"""
    atoms = [
        make_atom("N", -1.47, 0, 0),           # 0
        make_atom("C", 0, 0, 0),                # 1: alpha C
        make_atom("C", 1.52, 0, 0),             # 2: carboxyl C
        make_atom("O", 1.52 + 1.03, 0.73, 0),   # 3: =O
        make_atom("O", 1.52 + 0.36, -1.08, 0),  # 4: -OH
        make_atom("H", 1.52 + 0.36 + 0.87, -1.08 - 0.50, 0),  # 5: OH H
        make_atom("H", 0, 0.89, 0.63),          # 6: Ca H
        make_atom("H", 0, -0.89, 0.63),         # 7: Ca H
        make_atom("H", -1.47 - 0.41, 0.81, 0.34),  # 8: NH H
        make_atom("H", -1.47 - 0.41, -0.81, 0.34), # 9: NH H
    ]
    bonds = [
        make_bond(0, 1, 1), make_bond(1, 2, 1),
        make_bond(2, 3, 2), make_bond(2, 4, 1), make_bond(4, 5, 1),
        make_bond(1, 6, 1), make_bond(1, 7, 1),
        make_bond(0, 8, 1), make_bond(0, 9, 1),
    ]
    n = 10
    import random
    random.seed(46)
    mode_data = [
        (0, 250.0, 2.0, 0.1, "skeletal bend"),
        (1, 335.0, 3.0, 0.15, "NH2 torsion"),
        (2, 504.0, 8.0, 0.5, "OCO bend"),
        (3, 577.0, 5.0, 0.3, "rocking"),
        (4, 696.0, 12.0, 0.2, "oop bend"),
        (5, 801.0, 6.0, 1.0, "C-C stretch"),
        (6, 883.0, 3.0, 0.5, "CH2 rock"),
        (7, 918.0, 4.0, 0.4, "NH2 wag"),
        (8, 1033.0, 15.0, 1.2, "C-O stretch"),
        (9, 1101.0, 25.0, 0.6, "C-N stretch"),
        (10, 1148.0, 10.0, 0.8, "CH2 wag"),
        (11, 1255.0, 20.0, 1.5, "C-O-H bend"),
        (12, 1340.0, 12.0, 1.0, "CH2 twist"),
        (13, 1371.0, 8.0, 0.9, "C-O stretch"),
        (14, 1429.0, 5.0, 0.5, "CH2 scissor"),
        (15, 1600.0, 15.0, 1.0, "NH2 scissor"),
        (16, 1763.0, 75.0, 5.0, "C=O stretch"),
        (17, 2910.0, 8.0, 4.0, "CH2 sym stretch"),
        (18, 2969.0, 5.0, 3.0, "CH2 asym stretch"),
        (19, 3359.0, 2.0, 5.0, "NH2 sym stretch"),
        (20, 3425.0, 1.0, 3.5, "NH2 asym stretch"),
        (21, 3568.0, 50.0, 2.5, "O-H stretch"),
        (22, 640.0, 10.0, 0.1, "oop wag"),
        (23, 420.0, 4.0, 0.2, "skeletal twist"),
    ]
    modes = []
    for idx, freq, ir, raman, sym in mode_data:
        disps = [[round(random.gauss(0, 0.3), 3) for _ in range(3)] for _ in range(n)]
        if "C=O" in sym:
            disps[3] = [round(random.gauss(0, 0.8), 3) for _ in range(3)]
        elif "O-H" in sym:
            disps[5] = [round(random.gauss(0, 0.9), 3) for _ in range(3)]
        elif "CH2" in sym and "stretch" in sym:
            disps[6] = [round(random.gauss(0, 0.8), 3) for _ in range(3)]
            disps[7] = [round(random.gauss(0, 0.8), 3) for _ in range(3)]
        elif "NH2" in sym and "stretch" in sym:
            disps[8] = [round(random.gauss(0, 0.8), 3) for _ in range(3)]
            disps[9] = [round(random.gauss(0, 0.8), 3) for _ in range(3)]
        modes.append(make_mode(idx, freq, ir, raman, disps, sym))
    return build_molecule("glycine", "Glycine", "C2H5NO2", "NCC(=O)O", atoms, bonds, modes)


def acetone():
    """CH3COCH3 - C2v, 10 atoms, 24 modes"""
    d_cc = 1.52
    d_co = 1.20
    d_ch = 1.09
    # C=O along +y from central C
    atoms = [
        make_atom("C", 0, 0, 0),                           # 0: central C
        make_atom("O", 0, d_co, 0),                         # 1: =O
        make_atom("C", -d_cc * math.sin(math.radians(58.5)),
                  -d_cc * math.cos(math.radians(58.5)), 0),  # 2: CH3 left
        make_atom("C", d_cc * math.sin(math.radians(58.5)),
                  -d_cc * math.cos(math.radians(58.5)), 0),  # 3: CH3 right
    ]
    # H atoms on left CH3 (atom 2)
    cx2, cy2 = atoms[2]["x"], atoms[2]["y"]
    atoms.append(make_atom("H", cx2, cy2 - d_ch, 0))          # 4
    atoms.append(make_atom("H", cx2 - d_ch * 0.87, cy2 + d_ch * 0.5, d_ch * 0.5))  # 5
    atoms.append(make_atom("H", cx2 - d_ch * 0.87, cy2 + d_ch * 0.5, -d_ch * 0.5))  # 6
    # H atoms on right CH3 (atom 3)
    cx3, cy3 = atoms[3]["x"], atoms[3]["y"]
    atoms.append(make_atom("H", cx3, cy3 - d_ch, 0))          # 7
    atoms.append(make_atom("H", cx3 + d_ch * 0.87, cy3 + d_ch * 0.5, d_ch * 0.5))  # 8
    atoms.append(make_atom("H", cx3 + d_ch * 0.87, cy3 + d_ch * 0.5, -d_ch * 0.5))  # 9
    bonds = [
        make_bond(0, 1, 2), make_bond(0, 2, 1), make_bond(0, 3, 1),
        make_bond(2, 4, 1), make_bond(2, 5, 1), make_bond(2, 6, 1),
        make_bond(3, 7, 1), make_bond(3, 8, 1), make_bond(3, 9, 1),
    ]
    n = 10
    import random
    random.seed(100)
    mode_data = [
        (0, 125.0, 0.5, 0.05, "A2 torsion"),
        (1, 380.0, 2.0, 0.3, "B1 CCC bend"),
        (2, 484.0, 3.0, 0.5, "A1 CCC bend"),
        (3, 530.0, 5.0, 0.2, "B2 C=O oop"),
        (4, 777.0, 4.0, 0.8, "A1 C-C sym stretch"),
        (5, 891.0, 3.0, 0.4, "B1 CH3 rock"),
        (6, 891.0, 3.0, 0.4, "A2 CH3 rock"),
        (7, 1066.0, 8.0, 0.6, "B1 CH3 rock"),
        (8, 1066.0, 8.0, 0.6, "A1 CH3 rock"),
        (9, 1222.0, 20.0, 1.0, "B2 C-C asym stretch"),
        (10, 1364.0, 10.0, 2.0, "A1 sym CH3 bend"),
        (11, 1364.0, 10.0, 2.0, "B1 sym CH3 bend"),
        (12, 1410.0, 5.0, 1.0, "A2 CH3 bend"),
        (13, 1426.0, 6.0, 1.0, "A1 CH3 bend"),
        (14, 1426.0, 6.0, 1.0, "B2 CH3 bend"),
        (15, 1454.0, 3.0, 0.8, "B1 CH3 bend"),
        (16, 1720.0, 75.0, 4.0, "A1 C=O stretch"),
        (17, 2922.0, 5.0, 5.0, "A1 sym CH3 stretch"),
        (18, 2922.0, 5.0, 5.0, "B1 sym CH3 stretch"),
        (19, 2972.0, 3.0, 2.0, "A2 asym CH3 stretch"),
        (20, 2972.0, 3.0, 2.0, "B2 asym CH3 stretch"),
        (21, 3005.0, 4.0, 1.5, "A1 asym CH3 stretch"),
        (22, 3005.0, 4.0, 1.5, "B1 asym CH3 stretch"),
        (23, 3019.0, 2.0, 1.0, "B2 CH3 stretch"),
    ]
    modes = []
    for idx, freq, ir, raman, sym in mode_data:
        disps = [[round(random.gauss(0, 0.3), 3) for _ in range(3)] for _ in range(n)]
        if "C=O" in sym and "stretch" in sym.lower():
            disps[1] = [0, round(random.gauss(0, 0.8), 3), 0]
        elif "CH3 stretch" in sym:
            for i in [4, 5, 6, 7, 8, 9]:
                disps[i] = [round(random.gauss(0, 0.8), 3) for _ in range(3)]
        modes.append(make_mode(idx, freq, ir, raman, disps, sym))
    return build_molecule("acetone", "Acetone", "C3H6O", "CC(=O)C", atoms, bonds, modes)


def ethylene():
    """C2H4 - D2h, 6 atoms, 12 modes. Mutual exclusion principle demo."""
    d_cc = 1.339
    d_ch = 1.086
    hcc_angle = math.radians(121.3)
    hx = d_ch * math.cos(hcc_angle)
    hy = d_ch * math.sin(hcc_angle)
    atoms = [
        make_atom("C", -d_cc / 2, 0, 0),   # 0: C left
        make_atom("C", d_cc / 2, 0, 0),    # 1: C right
        make_atom("H", -d_cc / 2 - hx, hy, 0),   # 2: H top-left
        make_atom("H", -d_cc / 2 - hx, -hy, 0),  # 3: H bot-left
        make_atom("H", d_cc / 2 + hx, hy, 0),    # 4: H top-right
        make_atom("H", d_cc / 2 + hx, -hy, 0),   # 5: H bot-right
    ]
    bonds = [
        make_bond(0, 1, 2),
        make_bond(0, 2, 1), make_bond(0, 3, 1),
        make_bond(1, 4, 1), make_bond(1, 5, 1),
    ]
    modes = [
        # Ag modes (Raman active only - mutual exclusion for D2h)
        make_mode(0, 1623.0, 0.0, 5.0, [
            [-0.3, 0, 0], [0.3, 0, 0],
            [-0.5, 0.3, 0], [-0.5, -0.3, 0],
            [0.5, 0.3, 0], [0.5, -0.3, 0]
        ], "Ag C=C stretch"),
        make_mode(1, 3026.0, 0.0, 8.0, [
            [0, 0, 0], [0, 0, 0],
            [-0.5, 0.5, 0], [-0.5, -0.5, 0],
            [-0.5, 0.5, 0], [-0.5, -0.5, 0]
        ], "Ag sym CH stretch"),
        make_mode(2, 1342.0, 0.0, 3.0, [
            [0, 0, 0], [0, 0, 0],
            [0.3, -0.5, 0], [0.3, 0.5, 0],
            [-0.3, -0.5, 0], [-0.3, 0.5, 0]
        ], "Ag CH2 scissor"),
        # B1g (Raman only)
        make_mode(3, 3103.0, 0.0, 4.0, [
            [0, 0, 0], [0, 0, 0],
            [-0.5, 0.5, 0], [-0.5, -0.5, 0],
            [0.5, -0.5, 0], [0.5, 0.5, 0]
        ], "B1g asym CH stretch"),
        # Au (inactive)
        make_mode(4, 1023.0, 0.0, 0.0, [
            [0, 0, 0.3], [0, 0, -0.3],
            [0, 0, -0.5], [0, 0, 0.5],
            [0, 0, 0.5], [0, 0, -0.5]
        ], "Au CH2 twist"),
        # B1u (IR active only)
        make_mode(5, 949.0, 20.0, 0.0, [
            [0, 0, 0.3], [0, 0, 0.3],
            [0, 0, -0.5], [0, 0, 0.5],
            [0, 0, -0.5], [0, 0, 0.5]
        ], "B1u CH2 wag"),
        make_mode(6, 3106.0, 15.0, 0.0, [
            [0, 0, 0], [0, 0, 0],
            [-0.5, 0.5, 0], [-0.5, -0.5, 0],
            [0.5, 0.5, 0], [0.5, -0.5, 0]
        ], "B1u asym CH stretch"),
        # B2u (IR active only)
        make_mode(7, 826.0, 12.0, 0.0, [
            [0, 0, 0], [0, 0, 0],
            [0.3, 0.5, 0], [0.3, -0.5, 0],
            [0.3, 0.5, 0], [0.3, -0.5, 0]
        ], "B2u CH2 rock"),
        # B3u (IR active only)
        make_mode(8, 1444.0, 25.0, 0.0, [
            [0, 0.2, 0], [0, -0.2, 0],
            [0.3, -0.5, 0], [-0.3, -0.5, 0],
            [-0.3, 0.5, 0], [0.3, 0.5, 0]
        ], "B3u CH2 scissor"),
        make_mode(9, 3105.0, 10.0, 0.0, [
            [0, 0.05, 0], [0, -0.05, 0],
            [0.5, -0.5, 0], [0.5, 0.5, 0],
            [-0.5, 0.5, 0], [-0.5, -0.5, 0]
        ], "B3u asym CH stretch"),
        # B2g (Raman only)
        make_mode(10, 943.0, 0.0, 1.5, [
            [0, 0, -0.3], [0, 0, 0.3],
            [0, 0, 0.5], [0, 0, -0.5],
            [0, 0, 0.5], [0, 0, -0.5]
        ], "B2g CH2 wag"),
        # B3g (Raman only)
        make_mode(11, 1236.0, 0.0, 2.0, [
            [0, 0.2, 0], [0, -0.2, 0],
            [-0.3, 0.5, 0], [0.3, 0.5, 0],
            [0.3, -0.5, 0], [-0.3, -0.5, 0]
        ], "B3g CH2 rock"),
    ]
    return build_molecule("ethylene", "Ethylene", "C2H4", "C=C", atoms, bonds, modes)


def allene():
    """C3H4 - D2d, 7 atoms, 15 modes. Perpendicular CH2 planes."""
    d_cc = 1.308  # C=C in allene
    d_ch = 1.087
    hcc_angle = math.radians(120.9)
    hx = d_ch * math.cos(hcc_angle)
    hy = d_ch * math.sin(hcc_angle)
    atoms = [
        make_atom("C", 0, 0, 0),                  # 0: central C
        make_atom("C", -d_cc, 0, 0),              # 1: left C
        make_atom("C", d_cc, 0, 0),               # 2: right C
        # Left CH2 in yz plane
        make_atom("H", -d_cc - hx, hy, 0),        # 3
        make_atom("H", -d_cc - hx, -hy, 0),       # 4
        # Right CH2 in xz plane (perpendicular!)
        make_atom("H", d_cc + hx, 0, hy),         # 5
        make_atom("H", d_cc + hx, 0, -hy),        # 6
    ]
    bonds = [
        make_bond(0, 1, 2), make_bond(0, 2, 2),
        make_bond(1, 3, 1), make_bond(1, 4, 1),
        make_bond(2, 5, 1), make_bond(2, 6, 1),
    ]
    n = 7
    import random
    random.seed(101)
    mode_data = [
        (0, 353.0, 0.0, 0.3, "E CH2 rock"),
        (1, 353.0, 0.0, 0.3, "E CH2 rock"),
        (2, 841.0, 30.0, 0.0, "B2 CH2 wag"),
        (3, 865.0, 0.0, 0.0, "A2 CH2 twist"),
        (4, 999.0, 0.0, 2.0, "A1 C=C=C sym stretch"),
        (5, 1073.0, 8.0, 0.0, "B1 CH2 rock"),
        (6, 1073.0, 8.0, 0.0, "E CH2 rock"),
        (7, 1398.0, 0.0, 3.5, "A1 CH2 scissor"),
        (8, 1443.0, 12.0, 0.0, "B2 CH2 scissor"),
        (9, 1957.0, 60.0, 0.0, "B2 C=C=C asym stretch"),
        (10, 3007.0, 0.0, 8.0, "A1 sym CH stretch"),
        (11, 3007.0, 15.0, 0.0, "B2 asym CH stretch"),
        (12, 3086.0, 0.0, 4.0, "B1 sym CH stretch"),
        (13, 3086.0, 10.0, 0.0, "E asym CH stretch"),
        (14, 3086.0, 10.0, 0.0, "E asym CH stretch"),
    ]
    modes = []
    for idx, freq, ir, raman, sym in mode_data:
        disps = [[round(random.gauss(0, 0.3), 3) for _ in range(3)] for _ in range(n)]
        if "C=C=C" in sym and "sym" in sym:
            disps[0] = [0, 0, 0]
            disps[1] = [round(random.gauss(0, 0.6), 3), 0, 0]
            disps[2] = [round(-random.gauss(0, 0.6), 3), 0, 0]
        elif "C=C=C" in sym and "asym" in sym:
            disps[0] = [round(random.gauss(0, 0.8), 3), 0, 0]
            disps[1] = [round(-random.gauss(0, 0.4), 3), 0, 0]
            disps[2] = [round(-random.gauss(0, 0.4), 3), 0, 0]
        elif "CH stretch" in sym:
            for i in [3, 4, 5, 6]:
                disps[i] = [round(random.gauss(0, 0.8), 3) for _ in range(3)]
        modes.append(make_mode(idx, freq, ir, raman, disps, sym))
    return build_molecule("allene", "Allene", "C3H4", "C=C=C", atoms, bonds, modes)


def chloroform():
    """CHCl3 - C3v, 5 atoms, 9 modes."""
    d_ccl = 1.758
    d_ch = 1.10
    # Tetrahedral-like angles: Cl-C-Cl ~ 111.3 deg
    # H on +z axis, Cl atoms arranged below
    cl_angle = math.radians(180.0 - 111.3)  # angle from +z
    cl_r = d_ccl * math.sin(cl_angle)
    cl_z = d_ccl * math.cos(cl_angle)
    atoms = [
        make_atom("C", 0, 0, 0),                          # 0
        make_atom("H", 0, 0, d_ch),                        # 1
        make_atom("Cl", cl_r, 0, cl_z),                    # 2
        make_atom("Cl", -cl_r * 0.5, cl_r * 0.866, cl_z), # 3
        make_atom("Cl", -cl_r * 0.5, -cl_r * 0.866, cl_z),# 4
    ]
    bonds = [
        make_bond(0, 1, 1), make_bond(0, 2, 1),
        make_bond(0, 3, 1), make_bond(0, 4, 1),
    ]
    modes = [
        # A1 modes (IR + Raman active)
        make_mode(0, 262.0, 2.0, 3.0, [
            [0, 0, 0.1], [0, 0, 0.3],
            [0.5, 0, -0.3], [-0.25, 0.43, -0.3], [-0.25, -0.43, -0.3]
        ], "A1 CCl3 sym bend"),
        make_mode(1, 680.0, 5.0, 8.0, [
            [0, 0, 0.2], [0, 0, -0.1],
            [0.5, 0, -0.4], [-0.25, 0.43, -0.4], [-0.25, -0.43, -0.4]
        ], "A1 CCl3 sym stretch"),
        make_mode(2, 3034.0, 15.0, 5.0, [
            [0, 0, -0.05], [0, 0, 0.95],
            [0, 0, 0.01], [0, 0, 0.01], [0, 0, 0.01]
        ], "A1 CH stretch"),
        # E modes (IR + Raman, doubly degenerate)
        make_mode(3, 366.0, 1.5, 1.0, [
            [0.2, 0, 0], [-0.1, 0, 0],
            [-0.6, 0, 0.1], [0.3, -0.5, 0.1], [0.3, 0.5, 0.1]
        ], "E CCl3 bend"),
        make_mode(4, 366.0, 1.5, 1.0, [
            [0, 0.2, 0], [0, -0.1, 0],
            [0, 0, 0.1], [-0.5, -0.3, 0.1], [0.5, -0.3, 0.1]
        ], "E CCl3 bend"),
        make_mode(5, 761.0, 30.0, 2.0, [
            [0.2, 0, 0], [-0.05, 0, 0],
            [-0.6, 0, 0.3], [0.3, -0.5, 0.3], [0.3, 0.5, 0.3]
        ], "E CCl3 asym stretch"),
        make_mode(6, 761.0, 30.0, 2.0, [
            [0, 0.2, 0], [0, -0.05, 0],
            [0, 0, 0.3], [-0.5, -0.3, 0.3], [0.5, -0.3, 0.3]
        ], "E CCl3 asym stretch"),
        make_mode(7, 1220.0, 10.0, 1.5, [
            [0.1, 0, 0], [-0.8, 0, 0],
            [-0.05, 0, 0], [0.03, -0.04, 0], [0.03, 0.04, 0]
        ], "E CH bend"),
        make_mode(8, 1220.0, 10.0, 1.5, [
            [0, 0.1, 0], [0, -0.8, 0],
            [0, -0.05, 0], [-0.04, 0.03, 0], [0.04, 0.03, 0]
        ], "E CH bend"),
    ]
    return build_molecule("chloroform", "Chloroform", "CHCl3", "ClC(Cl)Cl", atoms, bonds, modes)


def nitrogen_dioxide():
    """NO2 - C2v, 3 atoms, 3 modes. Bent, paramagnetic."""
    d_no = 1.197
    angle = math.radians(134.1 / 2)
    atoms = [
        make_atom("N", 0, 0, 0),
        make_atom("O", -d_no * math.sin(angle), d_no * math.cos(angle), 0),
        make_atom("O", d_no * math.sin(angle), d_no * math.cos(angle), 0),
    ]
    bonds = [make_bond(0, 1, 2), make_bond(0, 2, 2)]
    modes = [
        make_mode(0, 750.0, 5.0, 1.0, [
            [0, -0.3, 0], [0.6, 0.4, 0], [-0.6, 0.4, 0]
        ], "A1 bend"),
        make_mode(1, 1318.0, 10.0, 6.0, [
            [0, 0.4, 0], [0, -0.7, 0], [0, -0.7, 0]
        ], "A1 sym stretch"),
        make_mode(2, 1618.0, 40.0, 0.5, [
            [0, 0, 0], [-0.7, 0.3, 0], [0.7, 0.3, 0]
        ], "B2 asym stretch"),
    ]
    return build_molecule("nitrogen_dioxide", "Nitrogen Dioxide", "NO2", "[O]N=O", atoms, bonds, modes)


def ozone():
    """O3 - C2v, 3 atoms, 3 modes. Same geometry type as SO2."""
    d_oo = 1.278
    angle = math.radians(116.8 / 2)
    atoms = [
        make_atom("O", 0, 0, 0),
        make_atom("O", -d_oo * math.sin(angle), d_oo * math.cos(angle), 0),
        make_atom("O", d_oo * math.sin(angle), d_oo * math.cos(angle), 0),
    ]
    bonds = [make_bond(0, 1, 2), make_bond(0, 2, 2)]
    modes = [
        make_mode(0, 701.0, 3.0, 0.5, [
            [0, -0.4, 0], [0.6, 0.5, 0], [-0.6, 0.5, 0]
        ], "A1 bend"),
        make_mode(1, 1110.0, 5.0, 6.0, [
            [0, 0.4, 0], [0, -0.7, 0], [0, -0.7, 0]
        ], "A1 sym stretch"),
        make_mode(2, 1042.0, 30.0, 0.3, [
            [0, 0, 0], [-0.7, 0.3, 0], [0.7, 0.3, 0]
        ], "B2 asym stretch"),
    ]
    return build_molecule("ozone", "Ozone", "O3", "[O-][O+]=O", atoms, bonds, modes)


def cyanogen():
    """C2N2 (N#C-C#N) - D_inf_h, 4 atoms, 7 modes. Linear, symmetric."""
    d_cn = 1.163
    d_cc = 1.389
    atoms = [
        make_atom("N", -(d_cc / 2 + d_cn), 0, 0),  # 0
        make_atom("C", -d_cc / 2, 0, 0),             # 1
        make_atom("C", d_cc / 2, 0, 0),              # 2
        make_atom("N", d_cc / 2 + d_cn, 0, 0),       # 3
    ]
    bonds = [
        make_bond(0, 1, 3), make_bond(1, 2, 1), make_bond(2, 3, 3),
    ]
    modes = [
        # Sigma_g sym stretch (Raman only)
        make_mode(0, 2158.0, 0.0, 10.0, [
            [0.6, 0, 0], [-0.3, 0, 0], [0.3, 0, 0], [-0.6, 0, 0]
        ], "Sigma_g sym CN stretch"),
        # Sigma_g sym CC stretch (Raman only)
        make_mode(1, 846.0, 0.0, 4.0, [
            [-0.3, 0, 0], [0.6, 0, 0], [-0.6, 0, 0], [0.3, 0, 0]
        ], "Sigma_g sym CC stretch"),
        # Sigma_u asym stretch (IR only)
        make_mode(2, 2330.0, 80.0, 0.0, [
            [0.6, 0, 0], [-0.3, 0, 0], [-0.3, 0, 0], [0.6, 0, 0]
        ], "Sigma_u asym CN stretch"),
        # Pi_g bend (Raman only, 2-fold degenerate)
        make_mode(3, 507.0, 0.0, 2.0, [
            [0, 0.5, 0], [0, -0.5, 0], [0, 0.5, 0], [0, -0.5, 0]
        ], "Pi_g bend"),
        make_mode(4, 507.0, 0.0, 2.0, [
            [0, 0, 0.5], [0, 0, -0.5], [0, 0, 0.5], [0, 0, -0.5]
        ], "Pi_g bend"),
        # Pi_u bend (IR only, 2-fold degenerate)
        make_mode(5, 234.0, 5.0, 0.0, [
            [0, 0.5, 0], [0, -0.5, 0], [0, -0.5, 0], [0, 0.5, 0]
        ], "Pi_u bend"),
        make_mode(6, 234.0, 5.0, 0.0, [
            [0, 0, 0.5], [0, 0, -0.5], [0, 0, -0.5], [0, 0, 0.5]
        ], "Pi_u bend"),
    ]
    return build_molecule("cyanogen", "Cyanogen", "C2N2", "N#CC#N", atoms, bonds, modes)


def methyl_fluoride():
    """CH3F - C3v, 5 atoms, 9 modes."""
    d_cf = 1.383
    d_ch = 1.095
    # F along +z, H atoms below
    hcf_angle = math.radians(108.8)
    h_z = d_ch * math.cos(hcf_angle)
    h_r = d_ch * math.sin(hcf_angle)
    atoms = [
        make_atom("C", 0, 0, 0),                          # 0
        make_atom("F", 0, 0, d_cf),                        # 1
        make_atom("H", h_r, 0, h_z),                       # 2
        make_atom("H", -h_r * 0.5, h_r * 0.866, h_z),    # 3
        make_atom("H", -h_r * 0.5, -h_r * 0.866, h_z),   # 4
    ]
    bonds = [
        make_bond(0, 1, 1), make_bond(0, 2, 1),
        make_bond(0, 3, 1), make_bond(0, 4, 1),
    ]
    modes = [
        # A1 modes (IR + Raman)
        make_mode(0, 1049.0, 60.0, 2.0, [
            [0, 0, 0.3], [0, 0, -0.7],
            [0.3, 0, 0.15], [-0.15, 0.26, 0.15], [-0.15, -0.26, 0.15]
        ], "A1 C-F stretch"),
        make_mode(1, 1460.0, 3.0, 1.5, [
            [0, 0, 0.1], [0, 0, 0],
            [0.2, 0, -0.5], [-0.1, 0.17, -0.5], [-0.1, -0.17, -0.5]
        ], "A1 CH3 sym bend"),
        make_mode(2, 2930.0, 5.0, 8.0, [
            [0, 0, -0.05], [0, 0, 0],
            [0.3, 0, -0.6], [-0.15, 0.26, -0.6], [-0.15, -0.26, -0.6]
        ], "A1 CH3 sym stretch"),
        # E modes (IR + Raman, doubly degenerate)
        make_mode(3, 1182.0, 3.0, 0.5, [
            [0.2, 0, 0], [-0.05, 0, 0],
            [-0.6, 0, 0.2], [0.3, -0.5, 0.2], [0.3, 0.5, 0.2]
        ], "E CH3 rock"),
        make_mode(4, 1182.0, 3.0, 0.5, [
            [0, 0.2, 0], [0, -0.05, 0],
            [0, 0, 0.2], [-0.5, -0.3, 0.2], [0.5, -0.3, 0.2]
        ], "E CH3 rock"),
        make_mode(5, 1467.0, 5.0, 1.0, [
            [0, 0, 0], [0, 0, 0],
            [0, 0.5, -0.3], [0.43, -0.25, -0.3], [-0.43, -0.25, -0.3]
        ], "E CH3 asym bend"),
        make_mode(6, 1467.0, 5.0, 1.0, [
            [0, 0, 0], [0, 0, 0],
            [0.5, 0, -0.3], [-0.25, -0.43, -0.3], [-0.25, 0.43, -0.3]
        ], "E CH3 asym bend"),
        make_mode(7, 3006.0, 8.0, 3.0, [
            [0, 0, 0], [0, 0, 0],
            [0, 0.5, -0.5], [0.43, -0.25, -0.5], [-0.43, -0.25, -0.5]
        ], "E CH3 asym stretch"),
        make_mode(8, 3006.0, 8.0, 3.0, [
            [0, 0, 0], [0, 0, 0],
            [0.5, 0, -0.5], [-0.25, -0.43, -0.5], [-0.25, 0.43, -0.5]
        ], "E CH3 asym stretch"),
    ]
    return build_molecule("methyl_fluoride", "Methyl Fluoride", "CH3F", "CF", atoms, bonds, modes)


def nitric_acid():
    """HNO3 - Cs, 5 atoms, 9 modes."""
    # N at origin, O atoms arranged around it
    d_n_oh = 1.406
    d_n_o1 = 1.211   # shorter N=O
    d_n_o2 = 1.199   # shorter N=O
    d_oh = 0.964
    atoms = [
        make_atom("N", 0, 0, 0),                            # 0
        make_atom("O", 1.21, 0, 0),                          # 1: N=O (trans to OH)
        make_atom("O", -0.55, 1.08, 0),                     # 2: N=O (cis)
        make_atom("O", -0.70, -1.02, 0),                    # 3: N-OH
        make_atom("H", -0.70 + 0.87, -1.02 - 0.50, 0),     # 4: H on OH
    ]
    bonds = [
        make_bond(0, 1, 2), make_bond(0, 2, 2),
        make_bond(0, 3, 1), make_bond(3, 4, 1),
    ]
    modes = [
        make_mode(0, 458.0, 8.0, 0.5, [
            [0, 0, 0.3], [0, 0, -0.2], [0, 0, -0.2], [0, 0, -0.3], [0, 0, 0.5]
        ], "A' NO2 bend"),
        make_mode(1, 580.0, 5.0, 0.3, [
            [0, 0, 0], [0, 0, 0], [0, 0, 0], [0.3, -0.5, 0], [-0.5, 0.8, 0]
        ], "A' N-OH torsion"),
        make_mode(2, 647.0, 10.0, 0.2, [
            [0, 0, 0.2], [0, 0, -0.5], [0, 0, 0.5], [0, 0, -0.3], [0, 0, 0.1]
        ], "A'' NO2 oop"),
        make_mode(3, 879.0, 15.0, 1.0, [
            [0.2, 0, 0], [0.1, 0, 0], [0.1, 0, 0], [-0.7, 0, 0], [0.3, 0, 0]
        ], "A' N-O stretch"),
        make_mode(4, 1303.0, 50.0, 4.0, [
            [0, 0.3, 0], [0, -0.5, 0], [0, -0.5, 0], [0, 0.1, 0], [0, 0.2, 0]
        ], "A' NO2 sym stretch"),
        make_mode(5, 1326.0, 20.0, 1.5, [
            [0, 0, 0], [-0.6, 0, 0], [0.6, 0, 0], [0, 0, 0], [0, 0, 0]
        ], "A' NO2 asym stretch"),
        make_mode(6, 1700.0, 70.0, 3.0, [
            [0.1, 0, 0], [-0.7, 0, 0], [-0.7, 0, 0], [0.1, 0, 0], [0, 0, 0]
        ], "A' N=O stretch"),
        make_mode(7, 1330.0, 25.0, 2.0, [
            [0, 0, 0], [0, 0, 0], [0, 0, 0], [0.1, 0.1, 0], [-0.5, -0.8, 0]
        ], "A' NOH bend"),
        make_mode(8, 3550.0, 40.0, 3.0, [
            [0, 0, 0], [0, 0, 0], [0, 0, 0], [0.02, 0, 0], [0.5, -0.85, 0]
        ], "A' O-H stretch"),
    ]
    return build_molecule("nitric_acid", "Nitric Acid", "HNO3", "[O-][N+](=O)O", atoms, bonds, modes)


def hydrazine():
    """N2H4 - C2, 6 atoms, 12 modes. Gauche conformation."""
    d_nn = 1.449
    d_nh = 1.021
    # Gauche: dihedral ~91 degrees
    nnh_angle = math.radians(106.0)
    h_z = d_nh * math.cos(nnh_angle)
    h_r = d_nh * math.sin(nnh_angle)
    dihedral = math.radians(91.0)
    atoms = [
        make_atom("N", -d_nn / 2, 0, 0),                  # 0: N left
        make_atom("N", d_nn / 2, 0, 0),                   # 1: N right
        # H on left N (gauche pair 1)
        make_atom("H", -d_nn / 2 - h_z, h_r * math.cos(0), h_r * math.sin(0)),     # 2
        make_atom("H", -d_nn / 2 - h_z, h_r * math.cos(2.09), h_r * math.sin(2.09)),  # 3
        # H on right N (rotated by dihedral)
        make_atom("H", d_nn / 2 + h_z, h_r * math.cos(dihedral), h_r * math.sin(dihedral)),  # 4
        make_atom("H", d_nn / 2 + h_z, h_r * math.cos(dihedral + 2.09), h_r * math.sin(dihedral + 2.09)),  # 5
    ]
    bonds = [
        make_bond(0, 1, 1),
        make_bond(0, 2, 1), make_bond(0, 3, 1),
        make_bond(1, 4, 1), make_bond(1, 5, 1),
    ]
    n = 6
    import random
    random.seed(102)
    mode_data = [
        (0, 371.0, 5.0, 0.3, "A torsion"),
        (1, 780.0, 8.0, 0.5, "B NH2 wag"),
        (2, 815.0, 6.0, 0.8, "A NH2 wag"),
        (3, 885.0, 3.0, 1.0, "A N-N stretch"),
        (4, 1098.0, 10.0, 0.4, "B NH2 rock"),
        (5, 1098.0, 10.0, 0.4, "A NH2 rock"),
        (6, 1275.0, 5.0, 0.6, "B NH2 twist"),
        (7, 1587.0, 15.0, 2.0, "A NH2 scissor"),
        (8, 1628.0, 12.0, 1.5, "B NH2 scissor"),
        (9, 3297.0, 2.0, 5.0, "A NH2 sym stretch"),
        (10, 3325.0, 1.5, 4.0, "B NH2 sym stretch"),
        (11, 3350.0, 3.0, 3.0, "A NH2 asym stretch"),
    ]
    modes = []
    for idx, freq, ir, raman, sym in mode_data:
        disps = [[round(random.gauss(0, 0.3), 3) for _ in range(3)] for _ in range(n)]
        if "N-N" in sym:
            disps[0] = [round(random.gauss(0, 0.7), 3), 0, 0]
            disps[1] = [round(-random.gauss(0, 0.7), 3), 0, 0]
        elif "NH2" in sym and "stretch" in sym:
            for i in [2, 3, 4, 5]:
                disps[i] = [round(random.gauss(0, 0.8), 3) for _ in range(3)]
        modes.append(make_mode(idx, freq, ir, raman, disps, sym))
    return build_molecule("hydrazine", "Hydrazine", "N2H4", "NN", atoms, bonds, modes)


def propyne():
    """C3H4 (methylacetylene) - C3v, 7 atoms, 15 modes. Terminal alkyne."""
    d_ct = 1.206   # C triple bond
    d_cs = 1.459   # C-C single
    d_ch_sp = 1.062  # sp C-H
    d_ch_sp3 = 1.09  # sp3 C-H
    # Linear C-C-C along x axis
    atoms = [
        make_atom("C", 0, 0, 0),                          # 0: CH3 carbon
        make_atom("C", d_cs, 0, 0),                        # 1: triple bond C
        make_atom("C", d_cs + d_ct, 0, 0),                 # 2: terminal C
        make_atom("H", d_cs + d_ct + d_ch_sp, 0, 0),      # 3: terminal H
        # CH3 hydrogens
        make_atom("H", -d_ch_sp3 * 0.33, d_ch_sp3 * 0.94, 0),  # 4
        make_atom("H", -d_ch_sp3 * 0.33, -d_ch_sp3 * 0.47, d_ch_sp3 * 0.82),  # 5
        make_atom("H", -d_ch_sp3 * 0.33, -d_ch_sp3 * 0.47, -d_ch_sp3 * 0.82),  # 6
    ]
    bonds = [
        make_bond(0, 1, 1), make_bond(1, 2, 3), make_bond(2, 3, 1),
        make_bond(0, 4, 1), make_bond(0, 5, 1), make_bond(0, 6, 1),
    ]
    n = 7
    import random
    random.seed(103)
    mode_data = [
        (0, 328.0, 0.5, 0.1, "E CCC bend"),
        (1, 328.0, 0.5, 0.1, "E CCC bend"),
        (2, 633.0, 15.0, 0.0, "E CH bend (sp)"),
        (3, 633.0, 15.0, 0.0, "E CH bend (sp)"),
        (4, 930.0, 5.0, 1.0, "A1 C-C stretch"),
        (5, 1036.0, 3.0, 0.4, "E CH3 rock"),
        (6, 1036.0, 3.0, 0.4, "E CH3 rock"),
        (7, 1382.0, 2.0, 1.5, "A1 CH3 sym bend"),
        (8, 1452.0, 5.0, 0.8, "E CH3 asym bend"),
        (9, 1452.0, 5.0, 0.8, "E CH3 asym bend"),
        (10, 2142.0, 3.0, 8.0, "A1 C#C stretch"),
        (11, 2918.0, 5.0, 5.0, "A1 CH3 sym stretch"),
        (12, 3008.0, 3.0, 2.0, "E CH3 asym stretch"),
        (13, 3008.0, 3.0, 2.0, "E CH3 asym stretch"),
        (14, 3334.0, 30.0, 4.0, "A1 sp C-H stretch"),
    ]
    modes = []
    for idx, freq, ir, raman, sym in mode_data:
        disps = [[round(random.gauss(0, 0.3), 3) for _ in range(3)] for _ in range(n)]
        if "C#C" in sym:
            disps[1] = [round(random.gauss(0, 0.7), 3), 0, 0]
            disps[2] = [round(-random.gauss(0, 0.7), 3), 0, 0]
        elif "sp C-H" in sym:
            disps[3] = [round(random.gauss(0, 0.9), 3), 0, 0]
        elif "CH3" in sym and "stretch" in sym:
            for i in [4, 5, 6]:
                disps[i] = [round(random.gauss(0, 0.8), 3) for _ in range(3)]
        modes.append(make_mode(idx, freq, ir, raman, disps, sym))
    return build_molecule("propyne", "Propyne", "C3H4", "CC#C", atoms, bonds, modes)


def sulfur_hexafluoride():
    """SF6 - Oh, 7 atoms, 15 modes. Octahedral, pedagogically important."""
    d_sf = 1.564
    atoms = [
        make_atom("S", 0, 0, 0),          # 0: central S
        make_atom("F", d_sf, 0, 0),        # 1: +x
        make_atom("F", -d_sf, 0, 0),       # 2: -x
        make_atom("F", 0, d_sf, 0),        # 3: +y
        make_atom("F", 0, -d_sf, 0),       # 4: -y
        make_atom("F", 0, 0, d_sf),        # 5: +z
        make_atom("F", 0, 0, -d_sf),       # 6: -z
    ]
    bonds = [
        make_bond(0, 1, 1), make_bond(0, 2, 1), make_bond(0, 3, 1),
        make_bond(0, 4, 1), make_bond(0, 5, 1), make_bond(0, 6, 1),
    ]
    modes = [
        # A1g: sym stretch (Raman only)
        make_mode(0, 775.0, 0.0, 10.0, [
            Z, [0.5, 0, 0], [-0.5, 0, 0], [0, 0.5, 0], [0, -0.5, 0], [0, 0, 0.5], [0, 0, -0.5]
        ], "A1g sym stretch"),
        # Eg: (Raman only, 2-fold)
        make_mode(1, 643.0, 0.0, 5.0, [
            Z, [0.5, 0, 0], [-0.5, 0, 0], [0, -0.5, 0], [0, 0.5, 0], Z, Z
        ], "Eg stretch"),
        make_mode(2, 643.0, 0.0, 5.0, [
            Z, [0.29, 0, 0], [-0.29, 0, 0], [0, 0.29, 0], [0, -0.29, 0], [0, 0, -0.58], [0, 0, 0.58]
        ], "Eg stretch"),
        # T1u: asym stretch (IR only, 3-fold)
        make_mode(3, 939.0, 100.0, 0.0, [
            [0.3, 0, 0], [-0.6, 0, 0], [0.6, 0, 0], Z, Z, Z, Z
        ], "T1u asym stretch"),
        make_mode(4, 939.0, 100.0, 0.0, [
            [0, 0.3, 0], Z, Z, [0, -0.6, 0], [0, 0.6, 0], Z, Z
        ], "T1u asym stretch"),
        make_mode(5, 939.0, 100.0, 0.0, [
            [0, 0, 0.3], Z, Z, Z, Z, [0, 0, -0.6], [0, 0, 0.6]
        ], "T1u asym stretch"),
        # T1u: bend (IR only, 3-fold)
        make_mode(6, 614.0, 40.0, 0.0, [
            Z, [0, 0.5, 0], [0, -0.5, 0], [0, 0, 0.5], [0, 0, -0.5], Z, Z
        ], "T1u bend"),
        make_mode(7, 614.0, 40.0, 0.0, [
            Z, [0, 0, 0.5], [0, 0, -0.5], Z, Z, [0.5, 0, 0], [-0.5, 0, 0]
        ], "T1u bend"),
        make_mode(8, 614.0, 40.0, 0.0, [
            Z, Z, Z, [0.5, 0, 0], [-0.5, 0, 0], [0, 0.5, 0], [0, -0.5, 0]
        ], "T1u bend"),
        # T2g: (Raman only, 3-fold)
        make_mode(9, 524.0, 0.0, 3.0, [
            Z, [0, 0.5, 0], [0, 0.5, 0], [0.5, 0, 0], [0.5, 0, 0], Z, Z
        ], "T2g bend"),
        make_mode(10, 524.0, 0.0, 3.0, [
            Z, [0, 0, 0.5], [0, 0, 0.5], Z, Z, [0.5, 0, 0], [0.5, 0, 0]
        ], "T2g bend"),
        make_mode(11, 524.0, 0.0, 3.0, [
            Z, Z, Z, [0, 0, 0.5], [0, 0, 0.5], [0, 0.5, 0], [0, 0.5, 0]
        ], "T2g bend"),
        # T2u: (inactive, 3-fold)
        make_mode(12, 348.0, 0.0, 0.0, [
            Z, [0, 0.5, 0], [0, -0.5, 0], [-0.5, 0, 0], [0.5, 0, 0], Z, Z
        ], "T2u bend"),
        make_mode(13, 348.0, 0.0, 0.0, [
            Z, [0, 0, 0.5], [0, 0, -0.5], Z, Z, [-0.5, 0, 0], [0.5, 0, 0]
        ], "T2u bend"),
        make_mode(14, 348.0, 0.0, 0.0, [
            Z, Z, Z, [0, 0, 0.5], [0, 0, -0.5], [0, -0.5, 0], [0, 0.5, 0]
        ], "T2u bend"),
    ]
    return build_molecule("sulfur_hexafluoride", "Sulfur Hexafluoride", "SF6", "FS(F)(F)(F)(F)F", atoms, bonds, modes)


def toluene():
    """C7H8 (methylbenzene) - Cs, 15 atoms, 39 modes."""
    # Benzene ring in xy plane, C1 at origin with methyl on -x
    d_cc_ar = 1.395  # aromatic C-C
    d_ch_ar = 1.08   # aromatic C-H
    d_cc_me = 1.51   # C(ring)-CH3
    d_ch_me = 1.09   # methyl C-H

    # Ring carbons (hexagon centered around slight offset)
    ring_angles = [i * 60 for i in range(6)]
    ring_atoms = []
    for i, ang in enumerate(ring_angles):
        rad = math.radians(ang)
        ring_atoms.append(make_atom("C", d_cc_ar * math.cos(rad), d_cc_ar * math.sin(rad), 0))

    # Methyl carbon bonded to ring C at index 0 (the one at +x)
    atoms = ring_atoms[:]  # 0-5: ring carbons
    # CH3 carbon along +x from C0
    me_x = atoms[0]["x"] + d_cc_me
    atoms.append(make_atom("C", me_x, 0, 0))  # 6: methyl C

    # Aromatic H's on ring C1-C5 (not C0 which has CH3)
    for i in range(1, 6):
        cx, cy = atoms[i]["x"], atoms[i]["y"]
        dist = math.sqrt(cx**2 + cy**2)
        hx = cx + d_ch_ar * cx / dist
        hy = cy + d_ch_ar * cy / dist
        atoms.append(make_atom("H", hx, hy, 0))  # 7-11

    # Methyl H's
    atoms.append(make_atom("H", me_x + d_ch_me, 0, 0))                          # 12
    atoms.append(make_atom("H", me_x - d_ch_me * 0.5, d_ch_me * 0.87, 0))      # 13
    atoms.append(make_atom("H", me_x - d_ch_me * 0.5, -d_ch_me * 0.87, 0))     # 14

    bonds = [
        # Ring bonds (aromatic ~ order 2 for display)
        make_bond(0, 1, 2), make_bond(1, 2, 1), make_bond(2, 3, 2),
        make_bond(3, 4, 1), make_bond(4, 5, 2), make_bond(5, 0, 1),
        # C0 - CH3
        make_bond(0, 6, 1),
        # Ring C-H
        make_bond(1, 7, 1), make_bond(2, 8, 1), make_bond(3, 9, 1),
        make_bond(4, 10, 1), make_bond(5, 11, 1),
        # Methyl C-H
        make_bond(6, 12, 1), make_bond(6, 13, 1), make_bond(6, 14, 1),
    ]

    n = 15
    import random
    random.seed(104)
    mode_data = [
        (0, 217.0, 0.5, 0.1, "A'' CH3 torsion"),
        (1, 344.0, 1.0, 0.3, "A' ring-CH3 bend"),
        (2, 404.0, 2.0, 0.2, "A'' ring oop"),
        (3, 467.0, 3.0, 0.5, "A' ring bend"),
        (4, 521.0, 2.0, 0.3, "A'' ring oop"),
        (5, 623.0, 5.0, 0.2, "A' ring bend"),
        (6, 694.0, 10.0, 0.1, "A'' ring oop"),
        (7, 728.0, 15.0, 0.3, "A'' CH oop"),
        (8, 785.0, 8.0, 0.4, "A'' CH oop"),
        (9, 843.0, 3.0, 1.0, "A' ring breathing"),
        (10, 893.0, 2.0, 0.2, "A'' CH oop"),
        (11, 960.0, 1.0, 0.1, "A'' CH oop"),
        (12, 1003.0, 0.5, 5.0, "A' ring breathing"),
        (13, 1030.0, 5.0, 3.0, "A' C-CH3 stretch"),
        (14, 1040.0, 3.0, 0.8, "A' CH ip bend"),
        (15, 1080.0, 4.0, 0.6, "A' CH ip bend"),
        (16, 1155.0, 2.0, 0.4, "A' CH ip bend"),
        (17, 1175.0, 3.0, 0.5, "A' CH ip bend"),
        (18, 1211.0, 5.0, 1.0, "A' CH ip bend"),
        (19, 1265.0, 2.0, 0.3, "A' ring stretch"),
        (20, 1334.0, 1.0, 0.5, "A' ring stretch"),
        (21, 1379.0, 3.0, 1.5, "A' CH3 sym bend"),
        (22, 1448.0, 4.0, 0.8, "A' CH3 asym bend"),
        (23, 1460.0, 5.0, 1.0, "A' CH3 asym bend"),
        (24, 1495.0, 8.0, 0.6, "A' ring stretch"),
        (25, 1586.0, 10.0, 3.0, "A' ring stretch (8a)"),
        (26, 1605.0, 12.0, 5.0, "A' ring stretch (8b)"),
        (27, 2870.0, 3.0, 4.0, "A' CH3 sym stretch"),
        (28, 2921.0, 2.0, 2.0, "A' CH3 asym stretch"),
        (29, 2951.0, 4.0, 2.5, "A' CH3 asym stretch"),
        (30, 3026.0, 2.0, 6.0, "A' ring CH stretch"),
        (31, 3039.0, 3.0, 4.0, "A' ring CH stretch"),
        (32, 3047.0, 1.5, 3.5, "A' ring CH stretch"),
        (33, 3055.0, 2.0, 3.0, "A' ring CH stretch"),
        (34, 3063.0, 1.0, 2.5, "A' ring CH stretch"),
        (35, 408.0, 1.0, 0.15, "A' ring bend"),
        (36, 550.0, 2.0, 0.2, "A'' ring-CH3 oop"),
        (37, 742.0, 20.0, 0.1, "A'' ring oop"),
        (38, 975.0, 0.5, 0.1, "A'' ring oop"),
    ]
    modes = []
    for idx, freq, ir, raman, sym in mode_data:
        disps = [[round(random.gauss(0, 0.25), 3) for _ in range(3)] for _ in range(n)]
        if "ring CH stretch" in sym:
            for i in [7, 8, 9, 10, 11]:
                disps[i] = [round(random.gauss(0, 0.8), 3) for _ in range(3)]
        elif "CH3" in sym and "stretch" in sym:
            for i in [12, 13, 14]:
                disps[i] = [round(random.gauss(0, 0.8), 3) for _ in range(3)]
        elif "ring stretch" in sym or "ring breathing" in sym:
            for i in range(6):
                disps[i] = [round(random.gauss(0, 0.6), 3) for _ in range(3)]
        elif "C-CH3" in sym:
            disps[0] = [round(random.gauss(0, 0.5), 3), 0, 0]
            disps[6] = [round(-random.gauss(0, 0.5), 3), 0, 0]
        modes.append(make_mode(idx, freq, ir, raman, disps, sym))
    return build_molecule("toluene", "Toluene", "C7H8", "Cc1ccccc1", atoms, bonds, modes)


# ============================================================
# Main
# ============================================================

def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    generators = [
        carbon_dioxide, hydrogen_fluoride, hydrogen_chloride,
        sulfur_dioxide, hydrogen_sulfide, phosphine,
        boron_trifluoride, carbon_tetrachloride, nitrous_oxide,
        formic_acid, acetic_acid, dimethyl_ether,
        methylamine, urea, glycine,
        # New molecules
        acetone, ethylene, allene, chloroform,
        nitrogen_dioxide, ozone, cyanogen, methyl_fluoride,
        nitric_acid, hydrazine, propyne,
        sulfur_hexafluoride, toluene,
    ]

    for gen in generators:
        mol = gen()
        filepath = os.path.join(OUTPUT_DIR, f"{mol['name']}.json")
        with open(filepath, "w") as f:
            json.dump(mol, f, indent=2)
        print(f"Generated {mol['name']}.json ({mol['atomCount']} atoms, {len(mol['modes'])} modes)")

    # Update index.json
    index_path = os.path.join(OUTPUT_DIR, "index.json")
    existing = {}
    if os.path.exists(index_path):
        with open(index_path) as f:
            for entry in json.load(f):
                existing[entry["id"]] = entry

    for gen in generators:
        mol = gen()
        existing[mol["name"]] = {
            "id": mol["name"],
            "name": mol["name"].replace("_", " ").title(),
            "formula": mol["formula"],
            "smiles": mol["smiles"],
            "atomCount": mol["atomCount"],
            "modeCount": len(mol["modes"]),
        }

    sorted_entries = sorted(existing.values(), key=lambda e: (e["atomCount"], e["name"]))
    with open(index_path, "w") as f:
        json.dump(sorted_entries, f, indent=2)

    print(f"\nUpdated index.json with {len(sorted_entries)} total molecules")
    for e in sorted_entries:
        print(f"  {e['id']}: {e['formula']} ({e['atomCount']} atoms, {e['modeCount']} modes)")


if __name__ == "__main__":
    main()
