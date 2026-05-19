"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";

import type { Model3DFile, Viewer3DConfig } from "@/app/layouts/types";
import { cn } from "@/lib/utils";
import {
  DEFAULT_MODEL_3D_FILE,
  DEFAULT_VIEWER_3D_CONFIG,
} from "./constants";
import { Viewer3DOptionBar } from "./controls/Viewer3DOptionBar";
import { ViewerToolbar } from "./controls/ViewerToolbar";
import { useThreeBackground } from "./hooks/useThreeBackground";
import { useThreeCamera } from "./hooks/useThreeCamera";
import { useThreeLighting } from "./hooks/useThreeLighting";
import { useThreeModel } from "./hooks/useThreeModel";
import { useThreeScene } from "./hooks/useThreeScene";

type Three3DViewerProps = {
  allowOptionBar?: boolean;
  className?: string;
  config?: Viewer3DConfig;
  initialConfig?: Viewer3DConfig;
  modelFile?: Model3DFile;
  onConfigChange?: (config: Viewer3DConfig) => void;
  onModelFileChange?: (modelFile: Model3DFile) => void;
};

export function Three3DViewer({
  allowOptionBar = true,
  className,
  config,
  initialConfig = DEFAULT_VIEWER_3D_CONFIG,
  modelFile,
  onConfigChange,
  onModelFileChange,
}: Three3DViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [internalConfig, setInternalConfig] =
    useState<Viewer3DConfig>(initialConfig);
  const [internalModelFile, setInternalModelFile] =
    useState<Model3DFile>(modelFile ?? DEFAULT_MODEL_3D_FILE);
  const resolvedConfig = config ?? internalConfig;
  const resolvedModelFile = modelFile ?? internalModelFile;
  const { cameraRef, controlsRef, sceneRef } = useThreeScene(
    containerRef,
    resolvedConfig,
  );
  const { loadState } = useThreeModel(
    sceneRef,
    resolvedModelFile,
    resolvedConfig.model,
  );

  useThreeCamera(
    cameraRef,
    controlsRef,
    resolvedConfig.camera,
    resolvedConfig.controls,
  );
  useThreeLighting(sceneRef, resolvedConfig.lighting);
  useThreeBackground(sceneRef, resolvedConfig.background);

  useEffect(() => {
    if (modelFile) {
      setInternalModelFile(modelFile);
    }
  }, [modelFile]);

  const handleConfigChange = (nextConfig: Viewer3DConfig) => {
    if (!config) {
      setInternalConfig(nextConfig);
    }

    onConfigChange?.(nextConfig);
  };

  const handleModelFileChange = (nextModelFile: Model3DFile) => {
    if (!modelFile) {
      setInternalModelFile(nextModelFile);
    }

    onModelFileChange?.(nextModelFile);
  };

  const handleReset = () => {
    handleConfigChange(initialConfig);
  };

  const showOptionBar =
    allowOptionBar && (resolvedConfig.controls?.showOptionBar ?? true);

  return (
    <div
      className={cn(
        "Three3DViewer Three3DViewer__root-1 flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-md border border-border bg-card text-card-foreground",
        className,
      )}
    >
      <ViewerToolbar
        allowOptionBar={allowOptionBar}
        config={resolvedConfig}
        modelFile={resolvedModelFile}
        onChange={handleConfigChange}
        onReset={handleReset}
      />

      <div
        className={cn(
          "Three3DViewer Three3DViewer__body-1 grid min-h-0 min-w-0 flex-1 grid-cols-1",
          showOptionBar && "md:grid-cols-[minmax(0,1fr)_18rem]",
        )}
      >
        <div className="Three3DViewer Three3DViewer__stage-1 relative min-h-0 min-w-0 overflow-hidden bg-neutral-950 md:min-h-[14rem]">
          <div
            ref={containerRef}
            className="Three3DViewer Three3DViewer__canvas-host-1 h-full min-h-0 w-full"
          />
          {loadState.isLoading || loadState.error ? (
            <ViewerLoadState
              error={loadState.error}
              isLoading={loadState.isLoading}
            />
          ) : null}
        </div>

        {showOptionBar ? (
          <Viewer3DOptionBar
            config={resolvedConfig}
            modelFile={resolvedModelFile}
            onConfigChange={handleConfigChange}
            onModelFileChange={handleModelFileChange}
          />
        ) : null}
      </div>
    </div>
  );
}

function ViewerLoadState({
  error,
  isLoading,
}: {
  error?: string;
  isLoading: boolean;
}) {
  return (
    <div className="ViewerLoadState ViewerLoadState__overlay-1 pointer-events-none absolute inset-0 z-10 grid place-items-center bg-black/30 text-white">
      <div className="ViewerLoadState ViewerLoadState__content-1 grid min-w-0 place-items-center gap-2 rounded-md border border-white/15 bg-black/50 px-3 py-2 text-center backdrop-blur-sm">
        {isLoading ? (
          <Loader2
            className="ViewerLoadState ViewerLoadState__icon-1 h-5 w-5 animate-spin"
            aria-hidden="true"
          />
        ) : (
          <AlertTriangle
            className="ViewerLoadState ViewerLoadState__icon-2 h-5 w-5 text-amber-200"
            aria-hidden="true"
          />
        )}
        <p className="ViewerLoadState ViewerLoadState__text-1 max-w-[14rem] text-xs font-semibold">
          {isLoading ? "3D 모델 로드 중" : error}
        </p>
      </div>
    </div>
  );
}
