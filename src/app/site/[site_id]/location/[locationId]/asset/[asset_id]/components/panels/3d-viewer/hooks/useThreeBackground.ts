import { useEffect } from "react";
import type { RefObject } from "react";
import * as THREE from "three";

import type { Background3DConfig } from "@/app/layouts/types";
import { SceneBuilder } from "../modules/SceneBuilder";

export function useThreeBackground(
  sceneRef: RefObject<THREE.Scene | null>,
  backgroundConfig: Background3DConfig,
) {
  useEffect(() => {
    if (!sceneRef.current) return;
    SceneBuilder.applyBackground(sceneRef.current, backgroundConfig);
  }, [sceneRef, backgroundConfig]);
}
