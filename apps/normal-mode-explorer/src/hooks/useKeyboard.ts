"use client";

import { useEffect } from "react";
import { useExplorerStore } from "@/lib/store";

export function useKeyboard() {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't capture when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const {
        molecule, modeA, modeB, togglePlaying, setModeA, setModeB,
        superpositionEnabled, setSuperpositionEnabled, clearSuperposition,
      } = useExplorerStore.getState();
      if (!molecule) return;

      const maxMode = molecule.modes.length - 1;

      switch (e.key) {
        case " ":
          e.preventDefault();
          togglePlaying();
          break;
        case "ArrowUp":
          e.preventDefault();
          setModeA(Math.max(0, modeA - 1));
          break;
        case "ArrowDown":
          e.preventDefault();
          setModeA(Math.min(maxMode, modeA + 1));
          break;
        case "ArrowLeft":
          if (modeB !== null) {
            e.preventDefault();
            setModeB(Math.max(0, modeB - 1));
          }
          break;
        case "ArrowRight":
          if (modeB !== null) {
            e.preventDefault();
            setModeB(Math.min(maxMode, modeB + 1));
          }
          break;
        case "b":
        case "B":
          e.preventDefault();
          if (modeB === null) {
            // Enable B viewport with the next mode after A
            setModeB(Math.min(maxMode, modeA + 1));
          } else {
            // Disable B viewport
            setModeB(null);
          }
          break;
        case "s":
        case "S":
          e.preventDefault();
          if (superpositionEnabled) {
            clearSuperposition();
            setSuperpositionEnabled(false);
          } else {
            setSuperpositionEnabled(true);
          }
          break;
        case "Escape":
          if (superpositionEnabled) {
            e.preventDefault();
            clearSuperposition();
            setSuperpositionEnabled(false);
          } else if (modeB !== null) {
            e.preventDefault();
            setModeB(null);
          }
          break;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
}
