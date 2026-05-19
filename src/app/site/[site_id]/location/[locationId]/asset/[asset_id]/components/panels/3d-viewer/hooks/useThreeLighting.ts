import { useEffect } from "react";
import type { RefObject } from "react";
import * as THREE from "three";

import type { Lighting3DConfig } from "@/app/layouts/types";
import { LightingManager } from "../modules/LightingManager";

export function useThreeLighting(
  sceneRef: RefObject<THREE.Scene | null>,
  lightingConfig: Lighting3DConfig,
) {
  useEffect(() => {
    if (!sceneRef.current) return;
    LightingManager.applyConfig(sceneRef.current, lightingConfig);
  }, [sceneRef, lightingConfig]);
}
