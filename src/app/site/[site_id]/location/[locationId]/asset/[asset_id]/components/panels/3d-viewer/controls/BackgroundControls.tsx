"use client";

import { Grid3X3 } from "lucide-react";

import type { Background3DConfig } from "@/app/layouts/types";
import {
  ColorField,
  ControlSection,
  RangeField,
  ToggleField,
} from "./control-fields";

const DEFAULT_FOG = {
  color: "#111827",
  enabled: true,
  far: 520,
  near: 180,
};

export function BackgroundControls({
  config,
  onChange,
}: {
  config: Background3DConfig;
  onChange: (config: Background3DConfig) => void;
}) {
  const fog = config.fog ?? DEFAULT_FOG;

  return (
    <ControlSection icon={Grid3X3} title="월드">
      <ColorField
        label="배경색"
        onChange={(color) => onChange({ ...config, color })}
        value={config.color}
      />

      <div className="BackgroundControls BackgroundControls__toggles-1 grid grid-cols-3 gap-1.5">
        <ToggleField
          checked={config.showGrid}
          label="그리드"
          onChange={(showGrid) => onChange({ ...config, showGrid })}
        />
        <ToggleField
          checked={config.showAxes ?? true}
          label="축"
          onChange={(showAxes) => onChange({ ...config, showAxes })}
        />
        <ToggleField
          checked={config.showGround ?? true}
          label="바닥"
          onChange={(showGround) => onChange({ ...config, showGround })}
        />
      </div>

      {config.showGrid ? (
        <div className="BackgroundControls BackgroundControls__grid-1 grid gap-1">
          <RangeField
            label="그리드 크기"
            max={420}
            min={40}
            onChange={(gridSize) => onChange({ ...config, gridSize })}
            step={10}
            value={config.gridSize}
          />
          <RangeField
            label="분할"
            max={80}
            min={4}
            onChange={(gridDivisions) =>
              onChange({ ...config, gridDivisions })
            }
            step={2}
            value={config.gridDivisions ?? 24}
          />
          <ColorField
            label="그리드 색"
            onChange={(gridColor) => onChange({ ...config, gridColor })}
            value={config.gridColor ?? "#475569"}
          />
        </div>
      ) : null}

      {config.showGround ? (
        <ColorField
          label="바닥색"
          onChange={(groundColor) => onChange({ ...config, groundColor })}
          value={config.groundColor ?? "#0f172a"}
        />
      ) : null}

      <ToggleField
        checked={fog.enabled}
        label="안개"
        onChange={(enabled) => onChange({ ...config, fog: { ...fog, enabled } })}
      />

      {fog.enabled ? (
        <div className="BackgroundControls BackgroundControls__fog-1 grid gap-1">
          <ColorField
            label="안개색"
            onChange={(color) => onChange({ ...config, fog: { ...fog, color } })}
            value={fog.color}
          />
          <RangeField
            label="시작"
            max={800}
            min={0}
            onChange={(near) => onChange({ ...config, fog: { ...fog, near } })}
            step={10}
            value={fog.near}
          />
          <RangeField
            label="끝"
            max={1600}
            min={60}
            onChange={(far) => onChange({ ...config, fog: { ...fog, far } })}
            step={10}
            value={fog.far}
          />
        </div>
      ) : null}
    </ControlSection>
  );
}
