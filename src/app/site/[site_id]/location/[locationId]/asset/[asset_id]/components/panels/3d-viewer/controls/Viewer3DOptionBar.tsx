"use client";

import { SlidersHorizontal } from "lucide-react";

import type { Model3DFile, Viewer3DConfig } from "@/app/layouts/types";
import { BackgroundControls } from "./BackgroundControls";
import { CameraControls } from "./CameraControls";
import {
  ControlSection,
  RangeField,
  ToggleField,
} from "./control-fields";
import { LightingControls } from "./LightingControls";
import { ModelControls } from "./ModelControls";
import { ModelFileControls } from "./ModelFileControls";

export function Viewer3DOptionBar({
  config,
  modelFile,
  onConfigChange,
  onModelFileChange,
}: {
  config: Viewer3DConfig;
  modelFile: Model3DFile;
  onConfigChange: (config: Viewer3DConfig) => void;
  onModelFileChange: (modelFile: Model3DFile) => void;
}) {
  const controls = config.controls ?? {};

  return (
    <aside className="Viewer3DOptionBar Viewer3DOptionBar__aside-1 min-h-0 min-w-0 overflow-y-auto border-t border-border bg-card/95 p-2 md:border-l md:border-t-0">
      <div className="Viewer3DOptionBar Viewer3DOptionBar__stack-1 grid gap-2">
        {controls.enableFileInputs !== false ? (
          <ModelFileControls
            modelFile={modelFile}
            onChange={onModelFileChange}
          />
        ) : null}

        <ControlSection icon={SlidersHorizontal} title="조작">
          <div className="Viewer3DOptionBar Viewer3DOptionBar__toggles-1 grid grid-cols-3 gap-1.5">
            <ToggleField
              checked={controls.enableRotate ?? true}
              label="회전"
              onChange={(enableRotate) =>
                onConfigChange({
                  ...config,
                  controls: { ...controls, enableRotate },
                })
              }
            />
            <ToggleField
              checked={controls.enablePan ?? true}
              label="이동"
              onChange={(enablePan) =>
                onConfigChange({
                  ...config,
                  controls: { ...controls, enablePan },
                })
              }
            />
            <ToggleField
              checked={controls.enableZoom ?? true}
              label="줌"
              onChange={(enableZoom) =>
                onConfigChange({
                  ...config,
                  controls: { ...controls, enableZoom },
                })
              }
            />
          </div>

          <RangeField
            label="자동 회전 속도"
            max={4}
            min={0.1}
            onChange={(autoRotateSpeed) =>
              onConfigChange({
                ...config,
                controls: { ...controls, autoRotateSpeed },
              })
            }
            step={0.1}
            value={controls.autoRotateSpeed ?? 0.7}
          />
        </ControlSection>

        <CameraControls
          config={config.camera}
          onChange={(camera) => onConfigChange({ ...config, camera })}
        />
        <ModelControls
          config={config.model}
          onChange={(model) => onConfigChange({ ...config, model })}
        />
        <LightingControls
          config={config.lighting}
          onChange={(lighting) => onConfigChange({ ...config, lighting })}
        />
        <BackgroundControls
          config={config.background}
          onChange={(background) => onConfigChange({ ...config, background })}
        />
      </div>
    </aside>
  );
}
