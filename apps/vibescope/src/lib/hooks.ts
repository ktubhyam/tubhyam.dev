import { useEffect } from "react";
import { useVibeStore } from "./store";

export function useKeyboardShortcuts() {
  const togglePlaying = useVibeStore((s) => s.togglePlaying);
  const molecule = useVibeStore((s) => s.molecule);
  const selectedMode = useVibeStore((s) => s.selectedMode);
  const setSelectedMode = useVibeStore((s) => s.setSelectedMode);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't intercept when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case " ":
          e.preventDefault();
          togglePlaying();
          break;
        case "ArrowUp":
          e.preventDefault();
          if (molecule && selectedMode > 0) {
            setSelectedMode(selectedMode - 1);
          }
          break;
        case "ArrowDown":
          e.preventDefault();
          if (molecule && selectedMode < molecule.modes.length - 1) {
            setSelectedMode(selectedMode + 1);
          }
          break;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [togglePlaying, molecule, selectedMode, setSelectedMode]);
}
