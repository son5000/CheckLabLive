"use client";

import {
  MousePointer2,
  RefreshCw,
  RotateCcw,
  Settings2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { Model3DFile, Viewer3DConfig } from "@/app/layouts/types";
import { cn } from "@/lib/utils";
import { getModelSourceName } from "../utils/modelFileUtils";

export function ViewerToolbar({
  allowOptionBar = true,
  config,
  modelFile,
  onChange,
  onReset,
}: {
  allowOptionBar?: boolean;
  config: Viewer3DConfig;
  modelFile: Model3DFile;
  onChange: (config: Viewer3DConfig) => void;
  onReset: () => void;
}) {
  const showOptionBar = config.controls?.showOptionBar ?? true;

  return (
    <div className="ViewerToolbar ViewerToolbar__bar-1 flex h-10 min-w-0 shrink-0 items-center justify-between gap-2 border-b border-border bg-card px-2">
      <div className="ViewerToolbar ViewerToolbar__title-1 flex min-w-0 items-center gap-2">
        <MousePointer2
          className="ViewerToolbar ViewerToolbar__icon-1 h-4 w-4 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
        <div className="ViewerToolbar ViewerToolbar__copy-1 min-w-0">
          <p className="ViewerToolbar ViewerToolbar__name-1 truncate text-xs font-semibold">
            3D 월드
          </p>
          <p className="ViewerToolbar ViewerToolbar__source-1 truncate text-[10px] text-muted-foreground">
            {getModelSourceName(modelFile.plyUrl)}
          </p>
        </div>
      </div>

      <div className="ViewerToolbar ViewerToolbar__actions-1 flex shrink-0 items-center gap-1">
        <ToolbarIconButton
          active={config.autoRotate}
          icon={RotateCcw}
          label="자동 회전"
          onClick={() => onChange({ ...config, autoRotate: !config.autoRotate })}
        />
        <ToolbarIconButton
          icon={RefreshCw}
          label="초기화"
          onClick={onReset}
        />
        {allowOptionBar ? (
          <ToolbarIconButton
            active={showOptionBar}
            icon={Settings2}
            label="옵션"
            onClick={() =>
              onChange({
                ...config,
                controls: {
                  ...config.controls,
                  showOptionBar: !showOptionBar,
                },
              })
            }
          />
        ) : null}
      </div>
    </div>
  );
}

function ToolbarIconButton({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active?: boolean;
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={cn(
        "ToolbarIconButton ToolbarIconButton__button-1 grid h-7 w-7 place-items-center rounded-md border border-border bg-background text-muted-foreground transition hover:border-primary/60 hover:text-foreground",
        active && "border-primary bg-primary text-primary-foreground hover:text-primary-foreground",
      )}
      onClick={onClick}
      title={label}
      type="button"
    >
      <Icon
        className="ToolbarIconButton ToolbarIconButton__icon-1 h-3.5 w-3.5"
        aria-hidden="true"
      />
    </button>
  );
}
