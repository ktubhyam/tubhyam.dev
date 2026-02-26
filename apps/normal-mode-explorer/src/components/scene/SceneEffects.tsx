"use client";

import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";

/** Post-processing effects: bloom glow + subtle vignette */
export function SceneEffects() {
  return (
    <EffectComposer>
      <Bloom
        luminanceThreshold={0.3}
        luminanceSmoothing={0.9}
        intensity={0.6}
        mipmapBlur
      />
      <Vignette eskil={false} offset={0.3} darkness={0.6} />
    </EffectComposer>
  );
}
