"use client";

import { Camera } from "lucide-react";

import type { Camera3DConfig, CameraPreset } from "@/app/layouts/types";
import { CAMERA_PRESET_LABELS } from "../constants";
import { CameraController } from "../modules/CameraController";
import {
  ControlSection,
  RangeField,
  SegmentedButton,
  Vector3Fields,
} from "./control-fields";

const PRESETS: CameraPreset[] = [
  "front",
  "back",
  "left",
  "right",
  "top",
  "isometric",
];

export function CameraControls({
  config,
  onChange,
}: {
  config: Camera3DConfig;
  onChange: (config: Camera3DConfig) => void;
}) {
  return (
    <ControlSection icon={Camera} title="카메라">
      <div className="CameraControls CameraControls__presets-1 grid grid-cols-3 gap-1">
        {PRESETS.map((preset) => (
          <SegmentedButton
            key={preset}
            active={config.preset === preset}
            onClick={() =>
              onChange(CameraController.getPresetConfig(preset, config))
            }
            title={`${CAMERA_PRESET_LABELS[preset]} 시점`}
          >
            {CAMERA_PRESET_LABELS[preset]}
          </SegmentedButton>
        ))}
      </div>

      <RangeField
        label="화각"
        max={90}
        min={20}
        onChange={(fov) => onChange({ ...config, fov })}
        suffix="°"
        value={config.fov}
      />

      <div className="CameraControls CameraControls__group-1 grid gap-1">
        <span className="CameraControls CameraControls__label-1 text-[10px] font-semibold text-muted-foreground">
          위치
        </span>
        <Vector3Fields
          onChange={(position) => onChange({ ...config, position })}
          value={config.position}
        />
      </div>

      <div className="CameraControls CameraControls__group-2 grid gap-1">
        <span className="CameraControls CameraControls__label-2 text-[10px] font-semibold text-muted-foreground">
          대상
        </span>
        <Vector3Fields
          onChange={(target) => onChange({ ...config, target })}
          value={config.target}
        />
      </div>

      <div className="CameraControls CameraControls__limits-1 grid grid-cols-2 gap-1.5">
        <RangeField
          label="최소 거리"
          max={120}
          min={1}
          onChange={(minDistance) => onChange({ ...config, minDistance })}
          value={config.minDistance ?? 18}
        />
        <RangeField
          label="최대 거리"
          max={1200}
          min={80}
          onChange={(maxDistance) => onChange({ ...config, maxDistance })}
          step={10}
          value={config.maxDistance ?? 640}
        />
      </div>
    </ControlSection>
  );
}
