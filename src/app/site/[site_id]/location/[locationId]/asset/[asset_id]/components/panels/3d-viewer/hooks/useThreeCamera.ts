import { useEffect } from "react";
import type { RefObject } from "react";
import * as THREE from "three";
import type { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import type {
  Camera3DConfig,
  Viewer3DControlConfig,
} from "@/app/layouts/types";
import { CameraController } from "../modules/CameraController";

export function useThreeCamera(
  cameraRef: RefObject<THREE.PerspectiveCamera | null>,
  controlsRef: RefObject<OrbitControls | null>,
  cameraConfig: Camera3DConfig,
  controlConfig?: Viewer3DControlConfig,
) {
  useEffect(() => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;

    if (!camera) {
      return;
    }

    CameraController.applyConfig(camera, controls, cameraConfig);

    if (!controls) {
      return;
    }

    controls.enablePan = controlConfig?.enablePan ?? true;
    controls.enableRotate = controlConfig?.enableRotate ?? true;
    controls.enableZoom = controlConfig?.enableZoom ?? true;
  }, [cameraConfig, cameraRef, controlConfig, controlsRef]);
}
