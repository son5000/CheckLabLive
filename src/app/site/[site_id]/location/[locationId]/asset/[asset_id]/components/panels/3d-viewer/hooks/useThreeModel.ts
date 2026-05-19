import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import * as THREE from "three";

import type { Model3DConfig, Model3DFile } from "@/app/layouts/types";
import { ModelController } from "../modules/ModelController";
import { ModelLoader } from "../modules/ModelLoader";
import { disposeObject3D } from "../utils/threeDisposal";

export function useThreeModel(
  sceneRef: RefObject<THREE.Scene | null>,
  modelFile: Model3DFile,
  modelConfig: Model3DConfig,
) {
  const loaderRef = useRef<ModelLoader>(new ModelLoader());
  const modelRef = useRef<THREE.Group | null>(null);
  const modelConfigRef = useRef(modelConfig);
  const [loadState, setLoadState] = useState<{
    error?: string;
    isLoading: boolean;
  }>({ isLoading: true });

  useEffect(() => {
    modelConfigRef.current = modelConfig;
  }, [modelConfig]);

  useEffect(() => {
    const scene = sceneRef.current;

    if (!scene) {
      return;
    }

    let isActive = true;
    setLoadState({ isLoading: true });

    loaderRef.current
      .loadModel(modelFile)
      .then((model) => {
        if (!isActive) {
          disposeObject3D(model);
          return;
        }

        if (modelRef.current) {
          scene.remove(modelRef.current);
          disposeObject3D(modelRef.current);
        }

        ModelController.applyConfig(model, modelConfigRef.current);
        modelRef.current = model;
        scene.add(model);
        setLoadState({ isLoading: false });
      })
      .catch((error: unknown) => {
        if (!isActive) {
          return;
        }

        setLoadState({
          error: error instanceof Error ? error.message : "모델 로드 실패",
          isLoading: false,
        });
      });

    return () => {
      isActive = false;
    };
  }, [modelFile, sceneRef]);

  useEffect(() => {
    if (modelRef.current) {
      ModelController.applyConfig(modelRef.current, modelConfig);
    }
  }, [modelConfig]);

  useEffect(() => {
    return () => {
      if (modelRef.current) {
        disposeObject3D(modelRef.current);
        modelRef.current = null;
      }
    };
  }, []);

  return { loadState, modelRef };
}
