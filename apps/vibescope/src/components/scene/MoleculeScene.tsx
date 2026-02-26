"use client";

import { useEffect } from "react";
import { useVibeStore } from "@/lib/store";
import { MoleculeViewer } from "./MoleculeViewer";
import type { MoleculeData, MoleculeManifestEntry } from "@/lib/types";

export default function MoleculeScene() {
  const moleculeId = useVibeStore((s) => s.moleculeId);
  const setMolecule = useVibeStore((s) => s.setMolecule);
  const setManifest = useVibeStore((s) => s.setManifest);
  const setLoading = useVibeStore((s) => s.setLoading);

  // Load manifest on mount
  useEffect(() => {
    fetch("/molecules/index.json")
      .then((r) => r.json())
      .then((data: MoleculeManifestEntry[]) => setManifest(data))
      .catch(console.error);
  }, [setManifest]);

  // Load molecule data when ID changes
  useEffect(() => {
    setLoading(true);
    fetch(`/molecules/${moleculeId}.json`)
      .then((r) => r.json())
      .then((data: MoleculeData) => {
        setMolecule(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load molecule:", err);
        setLoading(false);
      });
  }, [moleculeId, setMolecule, setLoading]);

  return <MoleculeViewer />;
}
