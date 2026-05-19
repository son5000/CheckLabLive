"use client";

import type { PointerEvent, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Camera,
  Check,
  Box,
  Maximize2,
  MousePointer2,
  SquareDashedMousePointer,
  Upload,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";

import type {
  AssetPartConfig,
  DetectionPointConfig,
  DetectionRoiConfig,
  DetectionSelectionMode,
  AssetCameraFeed,
  AssetThresholdConfig,
  Model3DFile,
  Model3DViewType,
  Viewer3DConfig,
} from "@/app/layouts/types";
import {
  DEFAULT_MODEL_3D_FILE,
  DEFAULT_VIEWER_3D_CONFIG,
  Three3DViewer,
} from "./3d-viewer";
import {
  getModelSourceName,
  normalizeModelTextures,
  withUpdatedTextureSlot,
} from "./3d-viewer/utils/modelFileUtils";

/**
 * 역할
 * - 설비 대시보드의 라이브 카메라와 파트 지정 패널입니다.
 *
 * 개요
 * - 기본 탭은 서버가 합성해서 전달하는 단일 스트림을 표시합니다.
 * - 사용자는 파트 추가 상태에서 마우스 드래그 영역이나 여러 포인트를 지정하고 이름/임계치를 저장합니다.
 *
 * STEP 1. 기본 스트림과 개별 카메라 탭을 전환합니다.
 * STEP 2. 파트 추가 상태에서 영역 드래그 또는 포인트 클릭을 수집합니다.
 * STEP 3. 이름, 온도 임계치, 초음파 임계치를 포함한 파트 설정을 상위 페이지로 전달합니다.
 *
 * 헬퍼
 * - 좌표는 화면 크기와 무관하게 백엔드로 보내기 쉬운 퍼센트 좌표로 보관합니다.
 */

type CameraMode = "default" | string;

type AssetCameraPanelProps = {
  activeCameraId: CameraMode;
  cameraFeeds?: AssetCameraFeed[];
  defaultAssetThresholds: AssetThresholdConfig;
  assetParts: AssetPartConfig[];
  assetThresholds: AssetThresholdConfig | null;
  isAddingAssetPart: boolean;
  selectedAssetPartId?: string;
  onCameraSelect: (cameraId: CameraMode) => void;
  onCancelAssetPart: () => void;
  onCreateAssetPart: (area: AssetPartConfig) => void;
  onSelectAssetPart: (partId: string | undefined) => void;
  onUpdateAssetPart: (area: AssetPartConfig) => void;
  initialViewMode?: Model3DViewType;
  onViewer3DConfigChange?: (config: Viewer3DConfig) => void;
  onViewer3DModelFileChange?: (modelFile: Model3DFile) => void;
  variant?: "full" | "stream";
  viewer3DConfig?: Viewer3DConfig;
  viewer3DModelFile?: Model3DFile;
};

type PercentPoint = {
  x: number;
  y: number;
};

type RoiDragInteraction =
  | {
      partId: string;
      startPointer: PercentPoint;
      startRoi: DetectionRoiConfig;
      type: "move-area-roi";
    }
  | {
      startPointer: PercentPoint;
      startRoi: DetectionRoiConfig;
      type: "move-draft-roi";
    }
  | {
      startPointer: PercentPoint;
      type: "draw-roi";
    };

type PointDragInteraction =
  | {
      partId: string;
      pointId: string;
      startPointer: PercentPoint;
      startPoint: PercentPoint;
      type: "move-area-point";
    }
  | {
      pointId: string;
      startPointer: PercentPoint;
      startPoint: PercentPoint;
      type: "move-draft-point";
    };

type DragInteraction = RoiDragInteraction | PointDragInteraction;

const POINT_HIT_RADIUS = 2.6;
const EMPTY_VIEWER_3D_MODEL_LABEL = "사용자 PLY 모델";

const defaultCameraFeeds: AssetCameraFeed[] = [
  {
    id: "cam-1",
    label: "CAM 1",
    name: "카메라 1",
    streamMessage: "스트림 대기",
    streamState: "idle",
    streamUrl: null,
  },
];

export function AssetCameraPanel({
  activeCameraId,
  cameraFeeds = defaultCameraFeeds,
  defaultAssetThresholds,
  assetParts,
  assetThresholds,
  isAddingAssetPart,
  selectedAssetPartId,
  onCameraSelect,
  onCancelAssetPart,
  onCreateAssetPart,
  onSelectAssetPart,
  onUpdateAssetPart,
  initialViewMode = "camera",
  onViewer3DConfigChange,
  onViewer3DModelFileChange,
  viewer3DConfig,
  viewer3DModelFile,
}: AssetCameraPanelProps) {
  const availableCameraFeeds = cameraFeeds.length
    ? cameraFeeds
    : defaultCameraFeeds;
  const selectedCamera = useMemo(
    () =>
      availableCameraFeeds.find((camera) => camera.id === activeCameraId) ??
      availableCameraFeeds[0],
    [activeCameraId, availableCameraFeeds],
  );
  const activeAssetThresholds =
    assetThresholds ?? defaultAssetThresholds;
  const [draftName, setDraftName] = useState("단자부");
  const [selectionMode, setSelectionMode] =
    useState<DetectionSelectionMode>("area");
  const [draftThresholds, setDraftThresholds] =
    useState<AssetThresholdConfig>(activeAssetThresholds);
  const [areDraftThresholdsDirty, setAreDraftThresholdsDirty] = useState(false);
  const [draftRoi, setDraftRoi] = useState<DetectionRoiConfig>();
  const [draftPoints, setDraftPoints] = useState<DetectionPointConfig[]>([]);
  const [dragInteraction, setDragInteraction] = useState<DragInteraction>();
  const dragInteractionRef = useRef<DragInteraction>();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [canRenderPreviewPortal, setCanRenderPreviewPortal] = useState(false);
  const [viewMode, setViewMode] = useState<Model3DViewType>(initialViewMode);
  const [currentViewer3DConfig, setCurrentViewer3DConfig] =
    useState<Viewer3DConfig>(viewer3DConfig ?? DEFAULT_VIEWER_3D_CONFIG);
  const [currentViewer3DModelFile, setCurrentViewer3DModelFile] =
    useState<Model3DFile | null>(viewer3DModelFile ?? null);
  const canSave =
    draftName.trim().length > 0 &&
    (selectionMode === "area"
      ? Boolean(draftRoi && draftRoi.width >= 2 && draftRoi.height >= 2)
      : draftPoints.length > 0);
  const isDraggingRoi =
    dragInteraction?.type === "move-area-roi" ||
    dragInteraction?.type === "move-draft-roi";
  const readyViewer3DModelFile = hasCompleteViewer3DModelFile(
    currentViewer3DModelFile,
  )
    ? currentViewer3DModelFile
    : null;

  useEffect(() => {
    setCanRenderPreviewPortal(true);
  }, []);

  useEffect(() => {
    if (viewer3DConfig) {
      setCurrentViewer3DConfig(viewer3DConfig);
    }
  }, [viewer3DConfig]);

  useEffect(() => {
    if (viewer3DModelFile) {
      setCurrentViewer3DModelFile(viewer3DModelFile);
    }
  }, [viewer3DModelFile]);

  useEffect(() => {
    if (!isAddingAssetPart) {
      return;
    }

    if (areDraftThresholdsDirty) {
      return;
    }

    setDraftThresholds((currentThresholds) =>
      areAssetThresholdsEqual(currentThresholds, activeAssetThresholds)
        ? currentThresholds
        : activeAssetThresholds,
    );
  }, [
    activeAssetThresholds,
    areDraftThresholdsDirty,
    isAddingAssetPart,
  ]);

  useEffect(() => {
    if (!isPreviewOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsPreviewOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPreviewOpen]);

  const startDragInteraction = (interaction: DragInteraction) => {
    dragInteractionRef.current = interaction;
    setDragInteraction(interaction);
  };

  const clearDragInteraction = () => {
    dragInteractionRef.current = undefined;
    setDragInteraction(undefined);
  };

  const capturePointer = (event: PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const releasePointer = (event: PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    const point = getRelativePoint(event);

    if (!isAddingAssetPart) {
      const hitPoint = findAreaPointHit(
        point,
        assetParts,
        selectedAssetPartId,
      );

      if (hitPoint) {
        capturePointer(event);
        onSelectAssetPart(hitPoint.area.id);
        startDragInteraction({
          partId: hitPoint.area.id,
          pointId: hitPoint.point.id,
          startPointer: point,
          startPoint: hitPoint.point,
          type: "move-area-point",
        });
        return;
      }

      const hitRoi = findAreaRoiHit(
        point,
        assetParts,
        selectedAssetPartId,
      );

      if (hitRoi?.roi) {
        capturePointer(event);
        onSelectAssetPart(hitRoi.area.id);
        startDragInteraction({
          partId: hitRoi.area.id,
          startPointer: point,
          startRoi: hitRoi.roi,
          type: "move-area-roi",
        });
      }

      return;
    }

    if (selectionMode === "points") {
      const hitDraftPoint = findPointHit(point, draftPoints);

      if (hitDraftPoint) {
        capturePointer(event);
        startDragInteraction({
          pointId: hitDraftPoint.id,
          startPointer: point,
          startPoint: hitDraftPoint,
          type: "move-draft-point",
        });
        return;
      }

      setDraftPoints((currentPoints) =>
        [
          ...currentPoints,
          {
            id: `point-${Date.now()}`,
            x: point.x,
            y: point.y,
          },
        ].slice(-8),
      );
      return;
    }

    capturePointer(event);

    if (draftRoi && isPointInsideRoi(point, draftRoi)) {
      startDragInteraction({
        startPointer: point,
        startRoi: draftRoi,
        type: "move-draft-roi",
      });
      return;
    }

    startDragInteraction({
      startPointer: point,
      type: "draw-roi",
    });
    setDraftRoi({
      height: 0,
      width: 0,
      x: point.x,
      y: point.y,
    });
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const activeInteraction = dragInteractionRef.current;

    if (!activeInteraction) {
      return;
    }

    const point = getRelativePoint(event);
    const delta = getPointDelta(activeInteraction.startPointer, point);

    if (activeInteraction.type === "draw-roi") {
      setDraftRoi(buildRoi(activeInteraction.startPointer, point));
      return;
    }

    if (activeInteraction.type === "move-draft-roi") {
      setDraftRoi(moveRoi(activeInteraction.startRoi, delta));
      return;
    }

    if (activeInteraction.type === "move-draft-point") {
      setDraftPoints((currentPoints) =>
        currentPoints.map((currentPoint) =>
          currentPoint.id === activeInteraction.pointId
            ? {
                ...currentPoint,
                ...movePoint(activeInteraction.startPoint, delta),
              }
            : currentPoint,
        ),
      );
      return;
    }

    const targetArea = assetParts.find(
      (area) => area.id === activeInteraction.partId,
    );

    if (!targetArea) {
      return;
    }

    if (activeInteraction.type === "move-area-roi") {
      onUpdateAssetPart({
        ...targetArea,
        roi: moveRoi(activeInteraction.startRoi, delta),
      });
      return;
    }

    onUpdateAssetPart({
      ...targetArea,
      points: targetArea.points.map((currentPoint) =>
        currentPoint.id === activeInteraction.pointId
          ? {
              ...currentPoint,
              ...movePoint(activeInteraction.startPoint, delta),
            }
          : currentPoint,
      ),
    });
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const activeInteraction = dragInteractionRef.current;

    if (!activeInteraction) {
      return;
    }

    if (activeInteraction.type === "draw-roi") {
      setDraftRoi(
        buildRoi(activeInteraction.startPointer, getRelativePoint(event)),
      );
    }

    releasePointer(event);
    clearDragInteraction();
  };

  const handlePointerCancel = (event: PointerEvent<HTMLDivElement>) => {
    releasePointer(event);
    clearDragInteraction();
  };

  const handleDraftThresholdChange = (
    nextThresholds: AssetThresholdConfig,
  ) => {
    setAreDraftThresholdsDirty(true);
    setDraftThresholds(nextThresholds);
  };

  const handleViewer3DConfigChange = (nextConfig: Viewer3DConfig) => {
    setCurrentViewer3DConfig(nextConfig);
    onViewer3DConfigChange?.(nextConfig);
  };

  const handleViewer3DModelFileChange = (nextModelFile: Model3DFile) => {
    setCurrentViewer3DModelFile(nextModelFile);
    onViewer3DModelFileChange?.(nextModelFile);
  };

  const handleViewer3DPlyFileChange = (file: File) => {
    const nextModelFile = {
      ...createViewer3DModelDraft(currentViewer3DModelFile),
      label: file.name,
      plyUrl: file,
    };

    setCurrentViewer3DModelFile(nextModelFile);

    if (hasCompleteViewer3DModelFile(nextModelFile)) {
      onViewer3DModelFileChange?.(nextModelFile);
    }
  };

  const handleViewer3DTextureFileChange = (file: File) => {
    const nextModelFile = withUpdatedTextureSlot(
      createViewer3DModelDraft(currentViewer3DModelFile),
      0,
      file,
    );

    setCurrentViewer3DModelFile(nextModelFile);

    if (hasCompleteViewer3DModelFile(nextModelFile)) {
      onViewer3DModelFileChange?.(nextModelFile);
    }
  };

  const handleUseSampleViewer3DModel = () => {
    handleViewer3DModelFileChange({
      ...DEFAULT_MODEL_3D_FILE,
      textures: DEFAULT_MODEL_3D_FILE.textures?.map((texture) => ({
        ...texture,
      })),
    });
  };

  const handleSave = () => {
    if (!canSave) {
      return;
    }

    onCreateAssetPart({
      id: `detection-${Date.now()}`,
      linkedAlarm: true,
      mode: selectionMode,
      name: draftName.trim(),
      points: selectionMode === "points" ? draftPoints : [],
      roi: selectionMode === "area" ? draftRoi : undefined,
      thresholds: draftThresholds,
    });
    resetDraft(activeAssetThresholds);
  };

  const handleCancel = () => {
    resetDraft(activeAssetThresholds);
    onCancelAssetPart();
  };

  return (
    <section className="AssetCameraPanel AssetCameraPanel__section-1 flex min-h-0 min-w-0 flex-col overflow-hidden rounded-md border border-border bg-card p-1 text-card-foreground">
      <div className="AssetCameraPanel AssetCameraPanel__container-1 mb-1 flex min-w-0 items-center justify-between gap-2">
        <div className="AssetCameraPanel AssetCameraPanel__container-2 flex min-w-0 items-center gap-1.5 ml-3">
          <div
            className="AssetCameraPanel AssetCameraPanel__view-toggle-1 flex items-center gap-1 rounded-md border border-border bg-background p-0.5"
            role="group"
            aria-label="패널 보기"
          >
            <PanelModeButton
              active={viewMode === "camera"}
              icon={Camera}
              label="카메라"
              onClick={() => setViewMode("camera")}
            />
            <PanelModeButton
              active={viewMode === "3d"}
              icon={Box}
              label="3D"
              onClick={() => setViewMode("3d")}
            />
          </div>
        </div>
        <div className="AssetCameraPanel AssetCameraPanel__container-4 mb-1 flex justify-end mr-1">
          <label className="AssetCameraPanel AssetCameraPanel__field-1 flex min-w-[8.5rem] items-center gap-1 rounded-md border border-border bg-background px-2 text-[11px] font-semibold text-muted-foreground">
            <span className="AssetCameraPanel AssetCameraPanel__label-2 shrink-0">
              카메라
            </span>
            <select
              className="AssetCameraPanel AssetCameraPanel__select-1 h-7 min-w-0 flex-1 bg-transparent text-xs font-semibold text-foreground outline-none"
              value={selectedCamera.id}
              onChange={(event) => onCameraSelect(event.target.value)}
            >
              {availableCameraFeeds.map((camera) => (
                <option key={camera.id} value={camera.id}>
                  {camera.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
      <div className="AssetCameraPanel AssetCameraPanel__container-5 grid min-h-0 flex-1 place-items-center overflow-hidden rounded-md border border-border bg-neutral-950/85 p-1 [container-type:size]">
        <div
          className={cn(
            "AssetCameraPanel AssetCameraPanel__container-6 relative h-[min(100cqw,100cqh)] w-[min(100cqw,100cqh)] touch-none overflow-hidden rounded-md border border-white/15 bg-neutral-950 shadow-[0_0_28px_rgba(34,211,238,0.16)]",
            viewMode === "camera" &&
              isAddingAssetPart &&
              "cursor-crosshair border-primary/70",
            viewMode === "camera" && isDraggingRoi && "cursor-move",
          )}
          onPointerDown={viewMode === "camera" ? handlePointerDown : undefined}
          onPointerMove={viewMode === "camera" ? handlePointerMove : undefined}
          onPointerCancel={
            viewMode === "camera" ? handlePointerCancel : undefined
          }
          onPointerUp={viewMode === "camera" ? handlePointerUp : undefined}
        >
          {viewMode === "3d" ? (
            <>
              {readyViewer3DModelFile ? (
                <>
                  <Three3DViewer
                    allowOptionBar={false}
                    config={currentViewer3DConfig}
                    modelFile={readyViewer3DModelFile}
                    onConfigChange={handleViewer3DConfigChange}
                    onModelFileChange={handleViewer3DModelFileChange}
                  />
                  <button
                    type="button"
                    className="AssetCameraPanel AssetCameraPanel__button-1 absolute right-2 top-12 z-20 grid h-8 w-8 place-items-center rounded-md border border-white/20 bg-black/45 text-white/80 backdrop-blur transition hover:bg-white/15 hover:text-white"
                    onClick={(event) => {
                      event.stopPropagation();
                      setIsPreviewOpen(true);
                    }}
                    title="3D 크게 보기"
                  >
                    <Maximize2
                      className="AssetCameraPanel AssetCameraPanel__icon-2 h-4 w-4"
                      aria-hidden="true"
                    />
                  </button>
                </>
              ) : (
                <Viewer3DModelUploadPanel
                  modelFile={currentViewer3DModelFile}
                  onPlyFileChange={handleViewer3DPlyFileChange}
                  onTextureFileChange={handleViewer3DTextureFileChange}
                  onUseSample={handleUseSampleViewer3DModel}
                />
              )}
            </>
          ) : (
            <>
              <div className="AssetCameraPanel AssetCameraPanel__container-7 absolute inset-0 opacity-25 [background-image:linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:34px_34px]" />
              <CameraViewport
                focused={selectedCamera.id !== "default"}
                streamMessage={selectedCamera.streamMessage}
                streamState={selectedCamera.streamState}
                streamUrl={selectedCamera.streamUrl}
                onOpenPreview={() => setIsPreviewOpen(true)}
              >
                <DetectionOverlays
                  parts={assetParts}
                  draftPoints={draftPoints}
                  draftRoi={draftRoi}
                  isDraftVisible={isAddingAssetPart}
                  selectedPartId={selectedAssetPartId}
                />
              </CameraViewport>
            </>
          )}
        </div>
      </div>

      {isAddingAssetPart && canRenderPreviewPortal
        ? createPortal(
            <DetectionSetupDialog
              canSave={canSave}
              assetParts={assetParts}
              draftName={draftName}
              draftPoints={draftPoints}
              draftRoi={draftRoi}
              draftThresholds={draftThresholds}
              isDraggingRoi={isDraggingRoi}
              selectedCamera={selectedCamera}
              selectedPartId={selectedAssetPartId}
              selectionMode={selectionMode}
              onCancel={handleCancel}
              onDraftNameChange={setDraftName}
              onDraftThresholdChange={handleDraftThresholdChange}
              onPointerCancel={handlePointerCancel}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onSave={handleSave}
              onSelectionModeChange={(mode) => {
                setSelectionMode(mode);
                if (mode === "area") {
                  setDraftPoints([]);
                } else {
                  setDraftRoi(undefined);
                }
              }}
            />,
            document.body,
          )
        : null}

      {isPreviewOpen && canRenderPreviewPortal
        ? createPortal(
            <div
              className="AssetCameraPanel AssetCameraPanel__container-15 fixed inset-0 z-[100] grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
              role="dialog"
              aria-modal="true"
              aria-label={viewMode === "3d" ? "3D 크게 보기" : "캠 크게 보기"}
              onClick={() => setIsPreviewOpen(false)}
            >
              <div
                className={cn(
                  "AssetCameraPanel AssetCameraPanel__container-16 flex max-h-[calc(100dvh-2rem)] max-w-[calc(100dvw-2rem)] min-w-0 flex-col overflow-hidden rounded-md border border-white/15 bg-neutral-950 text-white shadow-2xl",
                  viewMode === "3d"
                    ? "h-[min(92dvh,56rem)] w-[min(96dvw,84rem)]"
                    : "h-[min(92dvh,92dvw)] w-[min(92dvh,92dvw)]",
                )}
                onClick={(event) => event.stopPropagation()}
              >
                <div className="AssetCameraPanel AssetCameraPanel__container-17 flex h-10 shrink-0 items-center justify-between gap-2 border-b border-white/15 px-3">
                  <div className="AssetCameraPanel AssetCameraPanel__container-18 flex min-w-0 items-center gap-2">
                    {viewMode === "3d" ? (
                      <Box
                        className="AssetCameraPanel AssetCameraPanel__icon-3 h-4 w-4 shrink-0 text-cyan-200"
                        aria-hidden="true"
                      />
                    ) : (
                      <Camera
                        className="AssetCameraPanel AssetCameraPanel__icon-3 h-4 w-4 shrink-0 text-cyan-200"
                        aria-hidden="true"
                      />
                    )}
                    <p className="AssetCameraPanel AssetCameraPanel__text-3 truncate text-sm font-semibold">
                      {viewMode === "3d"
                        ? "3D 월드 · PLY 뷰어"
                        : `${selectedCamera.label} · ${selectedCamera.name}`}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="AssetCameraPanel AssetCameraPanel__button-2 grid h-7 w-7 place-items-center rounded-md border border-white/15 bg-white/10 text-white/80 transition hover:bg-white/15 hover:text-white"
                    onClick={() => setIsPreviewOpen(false)}
                    title="닫기"
                  >
                    <X
                      className="AssetCameraPanel AssetCameraPanel__icon-4 h-3.5 w-3.5"
                      aria-hidden="true"
                    />
                  </button>
                </div>
                {viewMode === "3d" ? (
                  <div className="AssetCameraPanel AssetCameraPanel__container-19 min-h-0 flex-1 p-3">
                    {readyViewer3DModelFile ? (
                      <Three3DViewer
                        className="AssetCameraPanel AssetCameraPanel__viewer-1 h-full"
                        config={currentViewer3DConfig}
                        modelFile={readyViewer3DModelFile}
                        onConfigChange={handleViewer3DConfigChange}
                        onModelFileChange={handleViewer3DModelFileChange}
                      />
                    ) : (
                      <Viewer3DModelUploadPanel
                        modelFile={currentViewer3DModelFile}
                        onPlyFileChange={handleViewer3DPlyFileChange}
                        onTextureFileChange={handleViewer3DTextureFileChange}
                        onUseSample={handleUseSampleViewer3DModel}
                      />
                    )}
                  </div>
                ) : (
                  <div className="AssetCameraPanel AssetCameraPanel__container-19 grid min-h-0 flex-1 place-items-center p-3 [container-type:size]">
                    <div
                      className={cn(
                        "AssetCameraPanel AssetCameraPanel__container-20 relative h-[min(100cqw,100cqh)] w-[min(100cqw,100cqh)] touch-none overflow-hidden rounded-md border border-cyan-200/25 bg-neutral-950 shadow-[0_0_42px_rgba(34,211,238,0.2)]",
                        isAddingAssetPart &&
                          "cursor-crosshair border-primary/70",
                        isDraggingRoi && "cursor-move",
                      )}
                      onPointerDown={handlePointerDown}
                      onPointerMove={handlePointerMove}
                      onPointerCancel={handlePointerCancel}
                      onPointerUp={handlePointerUp}
                    >
                      <div className="AssetCameraPanel AssetCameraPanel__container-21 absolute inset-0 opacity-25 [background-image:linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:34px_34px]" />
                      <CameraViewport
                        focused={selectedCamera.id !== "default"}
                        streamMessage={selectedCamera.streamMessage}
                        streamState={selectedCamera.streamState}
                        streamUrl={selectedCamera.streamUrl}
                      >
                        <DetectionOverlays
                          parts={assetParts}
                          draftPoints={draftPoints}
                          draftRoi={draftRoi}
                          isDraftVisible={isAddingAssetPart}
                          selectedPartId={selectedAssetPartId}
                        />
                      </CameraViewport>
                    </div>
                  </div>
                )}
              </div>
            </div>,
            document.body,
          )
        : null}
    </section>
  );

  function resetDraft(thresholds: AssetThresholdConfig) {
    setDraftName("단자부");
    setDraftThresholds(thresholds);
    setAreDraftThresholdsDirty(false);
    setDraftRoi(undefined);
    setDraftPoints([]);
    clearDragInteraction();
    setSelectionMode("area");
  }
}

function Viewer3DModelUploadPanel({
  modelFile,
  onPlyFileChange,
  onTextureFileChange,
  onUseSample,
}: {
  modelFile: Model3DFile | null;
  onPlyFileChange: (file: File) => void;
  onTextureFileChange: (file: File) => void;
  onUseSample: () => void;
}) {
  const textureSource = getPrimaryTextureSource(modelFile);

  return (
    <div className="Viewer3DModelUploadPanel Viewer3DModelUploadPanel__root-1 relative grid h-full min-h-0 w-full place-items-center overflow-hidden bg-neutral-950 px-2 pb-2 pt-11 text-white">
      <button
        type="button"
        className="Viewer3DModelUploadPanel Viewer3DModelUploadPanel__sample-button-1 absolute right-2 top-2 z-20 inline-flex h-7 max-w-[calc(100%-1rem)] items-center gap-1.5 rounded-md border border-cyan-200/35 bg-cyan-300/15 px-2 text-[11px] font-semibold text-cyan-50 backdrop-blur transition hover:bg-cyan-300/25"
        onClick={onUseSample}
        title="샘플 모델 생성하기"
      >
        <Box
          className="Viewer3DModelUploadPanel Viewer3DModelUploadPanel__icon-1 h-3.5 w-3.5 shrink-0"
          aria-hidden="true"
        />
        <span className="Viewer3DModelUploadPanel Viewer3DModelUploadPanel__sample-label-1 min-w-0 truncate">
          샘플 모델 생성하기
        </span>
      </button>

      <div className="Viewer3DModelUploadPanel Viewer3DModelUploadPanel__form-1 grid w-full max-w-[19rem] gap-1.5">
        <Viewer3DFilePicker
          accept=".ply"
          label="PLY 모델"
          name={getModelSourceName(modelFile?.plyUrl)}
          onFile={onPlyFileChange}
        />
        <Viewer3DFilePicker
          accept="image/png,.png"
          label="PNG 텍스처"
          name={getModelSourceName(textureSource)}
          onFile={onTextureFileChange}
        />
      </div>
    </div>
  );
}

function Viewer3DFilePicker({
  accept,
  label,
  name,
  onFile,
}: {
  accept: string;
  label: string;
  name: string;
  onFile: (file: File) => void;
}) {
  return (
    <label className="Viewer3DFilePicker Viewer3DFilePicker__field-1 grid min-w-0 cursor-pointer">
      <span className="Viewer3DFilePicker Viewer3DFilePicker__button-1 flex h-8 min-w-0 items-center gap-1.5 rounded-md border border-dashed border-white/25 bg-white/10 px-2 text-xs font-semibold text-white transition hover:border-cyan-200/70 hover:bg-white/15">
        <Upload
          className="Viewer3DFilePicker Viewer3DFilePicker__icon-1 h-3.5 w-3.5 shrink-0 text-cyan-100"
          aria-hidden="true"
        />
        <span className="Viewer3DFilePicker Viewer3DFilePicker__label-1 shrink-0 text-[10px] font-semibold text-white/70">
          {label}
        </span>
        <span className="Viewer3DFilePicker Viewer3DFilePicker__name-1 min-w-0 truncate">
          {name}
        </span>
      </span>
      <input
        accept={accept}
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];

          if (file) {
            onFile(file);
          }

          event.target.value = "";
        }}
        type="file"
      />
    </label>
  );
}

function createViewer3DModelDraft(
  modelFile: Model3DFile | null,
): Model3DFile {
  return {
    label: modelFile?.label ?? EMPTY_VIEWER_3D_MODEL_LABEL,
    normalizeSize:
      modelFile?.normalizeSize ?? DEFAULT_MODEL_3D_FILE.normalizeSize,
    plyUrl: modelFile?.plyUrl ?? "",
    textureUrl: modelFile?.textureUrl,
    textureUrls: modelFile?.textureUrls,
    textures: modelFile?.textures ? [...modelFile.textures] : [],
  };
}

function hasCompleteViewer3DModelFile(
  modelFile: Model3DFile | null,
): modelFile is Model3DFile {
  if (!modelFile?.plyUrl) {
    return false;
  }

  return Boolean(getPrimaryTextureSource(modelFile));
}

function getPrimaryTextureSource(modelFile: Model3DFile | null) {
  if (!modelFile) {
    return undefined;
  }

  return normalizeModelTextures(modelFile).find((texture) =>
    Boolean(texture.source),
  )?.source;
}

function PanelModeButton({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={cn(
        "PanelModeButton PanelModeButton__button-1 inline-flex h-7 min-w-[2.25rem] items-center justify-center gap-1 rounded-sm px-2 text-[11px] font-semibold text-muted-foreground transition hover:bg-accent hover:text-foreground",
        active && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
      )}
      onClick={onClick}
      title={label}
    >
      <Icon
        className="PanelModeButton PanelModeButton__icon-1 h-3.5 w-3.5"
        aria-hidden="true"
      />
      <span className="PanelModeButton PanelModeButton__label-1 hidden sm:inline">
        {label}
      </span>
    </button>
  );
}

function ModeButton({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={cn(
        "ModeButton ModeButton__button-1 inline-flex h-8 min-w-0 items-center justify-center gap-1 rounded-md border px-2 text-[11px] font-semibold",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-muted-foreground",
      )}
      onClick={onClick}
    >
      <Icon
        className="ModeButton ModeButton__icon-1 h-3.5 w-3.5 shrink-0"
        aria-hidden="true"
      />
      <span className="ModeButton ModeButton__label-1 truncate">{label}</span>
    </button>
  );
}

function IconButton({
  disabled,
  icon: Icon,
  label,
  onClick,
  variant = "default",
}: {
  disabled?: boolean;
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  variant?: "danger" | "default" | "primary";
}) {
  return (
    <button
      type="button"
      className={cn(
        "IconButton IconButton__button-1 inline-flex h-8 items-center justify-center rounded-md border px-2 text-[11px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-45",
        variant === "primary" &&
          "border-primary bg-primary text-primary-foreground",
        variant === "danger" &&
          "border-red-500/35 bg-red-500/10 text-red-700 hover:bg-red-500/15 dark:text-red-300",
        variant === "default" &&
          "border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground",
      )}
      disabled={disabled}
      onClick={onClick}
      title={label}
    >
      <Icon
        className="IconButton IconButton__icon-1 h-3.5 w-3.5"
        aria-hidden="true"
      />
    </button>
  );
}

function DetectionSetupDialog({
  canSave,
  assetParts,
  draftName,
  draftPoints,
  draftRoi,
  draftThresholds,
  isDraggingRoi,
  selectedPartId,
  selectedCamera,
  selectionMode,
  onCancel,
  onDraftNameChange,
  onDraftThresholdChange,
  onPointerCancel,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onSave,
  onSelectionModeChange,
}: {
  canSave: boolean;
  assetParts: AssetPartConfig[];
  draftName: string;
  draftPoints: DetectionPointConfig[];
  draftRoi?: DetectionRoiConfig;
  draftThresholds: AssetThresholdConfig;
  isDraggingRoi: boolean;
  selectedPartId?: string;
  selectedCamera: AssetCameraFeed;
  selectionMode: DetectionSelectionMode;
  onCancel: () => void;
  onDraftNameChange: (name: string) => void;
  onDraftThresholdChange: (thresholds: AssetThresholdConfig) => void;
  onPointerCancel: (event: PointerEvent<HTMLDivElement>) => void;
  onPointerDown: (event: PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (event: PointerEvent<HTMLDivElement>) => void;
  onPointerUp: (event: PointerEvent<HTMLDivElement>) => void;
  onSave: () => void;
  onSelectionModeChange: (mode: DetectionSelectionMode) => void;
}) {
  const draftScopeLabel =
    selectionMode === "area"
      ? draftRoi
        ? `${Math.round(draftRoi.width)}×${Math.round(draftRoi.height)}%`
        : "ROI 미지정"
      : `${draftPoints.length}개 포인트`;

  return (
    <div
      className="AssetCameraPanel AssetCameraPanel__setup-dialog-overlay-1 fixed inset-0 z-[90] grid place-items-center bg-black/55 p-3 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="감지 데이터 설정"
    >
      <div className="AssetCameraPanel AssetCameraPanel__setup-dialog-1 grid h-[min(86dvh,48rem)] w-[min(72rem,calc(100dvw-1.5rem))] min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-md border border-border bg-card text-card-foreground shadow-2xl">
        <div className="AssetCameraPanel AssetCameraPanel__setup-header-1 flex h-11 min-w-0 items-center justify-between gap-3 border-b border-border px-3">
          <div className="AssetCameraPanel AssetCameraPanel__setup-title-1 flex min-w-0 items-center gap-2">
            <SquareDashedMousePointer
              className="AssetCameraPanel AssetCameraPanel__setup-icon-1 h-4 w-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            <div className="AssetCameraPanel AssetCameraPanel__setup-title-copy-1 min-w-0">
              <h2 className="AssetCameraPanel AssetCameraPanel__setup-heading-1 truncate text-sm font-semibold">
                감지 데이터 설정
              </h2>
              <p className="AssetCameraPanel AssetCameraPanel__setup-text-1 truncate text-[11px] text-muted-foreground">
                {selectedCamera.label} · {draftScopeLabel}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="AssetCameraPanel AssetCameraPanel__setup-close-1 grid h-8 w-8 shrink-0 place-items-center rounded-md border border-border bg-background text-muted-foreground transition hover:bg-accent hover:text-foreground"
            onClick={onCancel}
            title="닫기"
          >
            <X
              className="AssetCameraPanel AssetCameraPanel__setup-icon-2 h-4 w-4"
              aria-hidden="true"
            />
          </button>
        </div>

        <div className="AssetCameraPanel AssetCameraPanel__setup-body-1 grid min-h-0 min-w-0 gap-3 p-3 md:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)]">
          <div className="AssetCameraPanel AssetCameraPanel__setup-stream-1 grid min-h-0 min-w-0 place-items-center overflow-hidden rounded-md border border-border bg-neutral-950/90 p-2 [container-type:size]">
            <div
              className={cn(
                "AssetCameraPanel AssetCameraPanel__setup-stream-frame-1 relative h-[min(100cqw,100cqh)] w-[min(100cqw,100cqh)] touch-none overflow-hidden rounded-md border border-primary/60 bg-neutral-950 shadow-[0_0_42px_rgba(34,211,238,0.2)]",
                "cursor-crosshair",
                isDraggingRoi && "cursor-move",
              )}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerCancel={onPointerCancel}
              onPointerUp={onPointerUp}
            >
              <div className="AssetCameraPanel AssetCameraPanel__setup-stream-grid-1 absolute inset-0 opacity-25 [background-image:linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:34px_34px]" />
              <CameraViewport
                focused={selectedCamera.id !== "default"}
                streamMessage={selectedCamera.streamMessage}
                streamState={selectedCamera.streamState}
                streamUrl={selectedCamera.streamUrl}
              >
                <DetectionOverlays
                  parts={assetParts}
                  draftPoints={draftPoints}
                  draftRoi={draftRoi}
                  isDraftVisible
                  selectedPartId={selectedPartId}
                />
              </CameraViewport>
            </div>
          </div>

          <aside className="AssetCameraPanel AssetCameraPanel__setup-side-1 flex min-h-0 min-w-0 flex-col gap-3 overflow-hidden rounded-md border border-border bg-background p-3">
            <label className="AssetCameraPanel AssetCameraPanel__setup-field-1 grid min-w-0 gap-1">
              <span className="AssetCameraPanel AssetCameraPanel__setup-label-1 text-[11px] font-semibold text-muted-foreground">
                이름
              </span>
              <input
                className="AssetCameraPanel AssetCameraPanel__setup-input-1 h-9 min-w-0 rounded-md border border-border bg-card px-2 text-sm font-semibold outline-none"
                value={draftName}
                onChange={(event) => onDraftNameChange(event.target.value)}
              />
            </label>

            <div
              className="AssetCameraPanel AssetCameraPanel__setup-group-1 grid gap-1"
              role="group"
              aria-label="지정 방식"
            >
              <span className="AssetCameraPanel AssetCameraPanel__setup-label-2 text-[11px] font-semibold text-muted-foreground">
                지정 방식
              </span>
              <div className="AssetCameraPanel AssetCameraPanel__setup-modes-1 grid grid-cols-2 gap-1.5">
                <ModeButton
                  active={selectionMode === "area"}
                  icon={SquareDashedMousePointer}
                  label="영역"
                  onClick={() => onSelectionModeChange("area")}
                />
                <ModeButton
                  active={selectionMode === "points"}
                  icon={MousePointer2}
                  label="포인트"
                  onClick={() => onSelectionModeChange("points")}
                />
              </div>
            </div>

            <div
              className="AssetCameraPanel AssetCameraPanel__setup-group-2 grid gap-1"
              role="group"
              aria-label="임계치"
            >
              <span className="AssetCameraPanel AssetCameraPanel__setup-label-3 text-[11px] font-semibold text-muted-foreground">
                임계치
              </span>
              <div className="AssetCameraPanel AssetCameraPanel__setup-thresholds-1 grid grid-cols-2 gap-1.5">
                <ThresholdField
                  label="온도"
                  suffix="℃"
                  value={draftThresholds.temperature}
                  onChange={(temperature) =>
                    onDraftThresholdChange({
                      ...draftThresholds,
                      temperature,
                    })
                  }
                />
                <ThresholdField
                  label="초음파"
                  suffix="dB"
                  value={draftThresholds.ultrasoundDb}
                  onChange={(ultrasoundDb) =>
                    onDraftThresholdChange({
                      ...draftThresholds,
                      ultrasoundDb,
                    })
                  }
                />
              </div>
            </div>

            <div className="AssetCameraPanel AssetCameraPanel__setup-status-1 grid gap-1.5 rounded-md border border-border bg-card p-2">
              <DetectionSetupStatusRow label="방식" value={selectionMode === "area" ? "영역 ROI" : "포인트"} />
              <DetectionSetupStatusRow label="지정" value={draftScopeLabel} />
              <DetectionSetupStatusRow
                label="알림"
                value={`온도 ${draftThresholds.temperature}℃ · 초음파 ${draftThresholds.ultrasoundDb} dB`}
              />
            </div>

            <div className="AssetCameraPanel AssetCameraPanel__setup-actions-1 mt-auto grid grid-cols-2 gap-1.5">
              <IconButton
                disabled={!canSave}
                icon={Check}
                label="저장"
                onClick={onSave}
                variant="primary"
              />
              <IconButton icon={X} label="취소" onClick={onCancel} />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function DetectionSetupStatusRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="DetectionSetupStatusRow DetectionSetupStatusRow__row-1 flex min-w-0 items-center justify-between gap-2 rounded-sm border border-border/60 bg-background px-2 py-1.5">
      <span className="DetectionSetupStatusRow DetectionSetupStatusRow__label-1 shrink-0 text-[10px] font-semibold text-muted-foreground">
        {label}
      </span>
      <span className="DetectionSetupStatusRow DetectionSetupStatusRow__value-1 min-w-0 truncate text-right font-mono text-[11px] font-semibold">
        {value}
      </span>
    </div>
  );
}

function ThresholdField({
  label,
  onChange,
  suffix,
  value,
}: {
  label: string;
  onChange: (value: number) => void;
  suffix: string;
  value: number;
}) {
  return (
    <label className="ThresholdField ThresholdField__field-1 flex h-8 min-w-[5.75rem] flex-[1_1_5.75rem] items-center gap-1 rounded-md border border-border bg-card px-2">
      <span className="ThresholdField ThresholdField__label-1 shrink-0 text-[10px] text-muted-foreground">
        {label}
      </span>
      <input
        className="ThresholdField ThresholdField__input-1 w-0 min-w-0 flex-1 bg-transparent font-mono text-xs font-semibold outline-none"
        type="number"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <span className="ThresholdField ThresholdField__label-2 shrink-0 text-[10px] text-muted-foreground">
        {suffix}
      </span>
    </label>
  );
}

function CameraViewport({
  children,
  focused,
  onOpenPreview,
  streamMessage = "스트림 대기",
  streamState = "idle",
  streamUrl,
}: {
  children: ReactNode;
  focused?: boolean;
  onOpenPreview?: () => void;
  streamMessage?: string;
  streamState?: string;
  streamUrl?: string | null;
}) {
  const hasStream = Boolean(streamUrl);

  return (
    <div className="CameraViewport CameraViewport__container-1 relative h-full min-h-0 overflow-hidden bg-white/10">
      <div className="CameraViewport CameraViewport__container-4 relative grid h-full place-items-center text-white/80">
        {onOpenPreview ? (
          <button
            type="button"
            className="AssetCameraPanel AssetCameraPanel__button-1 absolute right-2 top-2 z-20 grid h-8 w-8 place-items-center rounded-md border border-white/20 bg-black/45 text-white/80 backdrop-blur transition hover:bg-white/15 hover:text-white"
            onClick={(event) => {
              event.stopPropagation();
              onOpenPreview();
            }}
            onPointerDown={(event) => event.stopPropagation()}
            title="캠 크게 보기"
          >
            <Maximize2
              className="AssetCameraPanel AssetCameraPanel__icon-2 h-4 w-4"
              aria-hidden="true"
            />
          </button>
        ) : null}
        {hasStream ? (
          <video
            className="CameraViewport CameraViewport__video-1 h-full w-full object-cover"
            src={streamUrl ?? undefined}
            autoPlay
            muted
            playsInline
            controls={streamState !== "live"}
          />
        ) : (
          <div className="CameraViewport CameraViewport__container-5 grid place-items-center gap-2">
            <Maximize2
              className={cn(
                "CameraViewport CameraViewport__icon-1 h-6 w-6",
                focused && "h-7 w-7",
              )}
              aria-hidden="true"
            />
            <p
              className={cn(
                "CameraViewport CameraViewport__text-1 font-mono text-xs",
                focused && "text-sm",
              )}
            >
              {streamMessage}
            </p>
          </div>
        )}
      </div>
      {children}
    </div>
  );
}

function DetectionOverlays({
  parts,
  draftPoints,
  draftRoi,
  isDraftVisible,
  selectedPartId,
}: {
  parts: AssetPartConfig[];
  draftPoints: DetectionPointConfig[];
  draftRoi?: DetectionRoiConfig;
  isDraftVisible: boolean;
  selectedPartId?: string;
}) {
  return (
    <div className="DetectionOverlays DetectionOverlays__container-1 pointer-events-none absolute inset-0 z-10">
      {parts.map((area) => (
        <AssetPartOverlay
          key={area.id}
          area={area}
          selected={area.id === selectedPartId}
        />
      ))}
      {isDraftVisible && draftRoi ? (
        <RoiBox
          className="border-white bg-white/10 outline outline-1 outline-black shadow-[0_0_0_1px_rgba(0,0,0,0.9),0_0_18px_rgba(255,255,255,0.28)]"
          label="신규 영역"
          roi={draftRoi}
        />
      ) : null}
      {isDraftVisible
        ? draftPoints.map((point, index) => (
            <PointMarker
              key={point.id}
              index={index + 1}
              point={point}
              className="border-primary bg-primary text-primary-foreground"
            />
          ))
        : null}
    </div>
  );
}

function AssetPartOverlay({
  area,
  selected,
}: {
  area: AssetPartConfig;
  selected: boolean;
}) {
  return (
    <>
      {area.roi ? (
        <RoiBox
          className={
            selected
              ? "border-lime-300 bg-lime-300/15 shadow-[0_0_20px_rgba(190,242,100,0.34)]"
              : "border-cyan-300 bg-cyan-300/10"
          }
          label={area.name}
          roi={area.roi}
        />
      ) : null}
      {area.points.map((point, index) => (
        <PointMarker
          key={point.id}
          className={
            selected
              ? "border-lime-200 bg-lime-300 text-neutral-950 shadow-[0_0_14px_rgba(190,242,100,0.42)]"
              : "border-cyan-200 bg-cyan-300 text-neutral-950"
          }
          index={index + 1}
          point={point}
        />
      ))}
    </>
  );
}

function RoiBox({
  className,
  label,
  roi,
}: {
  className: string;
  label: string;
  roi: DetectionRoiConfig;
}) {
  return (
    <div
      className={cn(
        "RoiBox RoiBox__container-1 pointer-events-auto absolute cursor-move rounded-sm border-2",
        className,
      )}
      style={{
        height: `${roi.height}%`,
        left: `${roi.x}%`,
        top: `${roi.y}%`,
        width: `${roi.width}%`,
      }}
    >
      <span className="RoiBox RoiBox__label-1 absolute left-1 top-1 rounded-sm bg-black/55 px-1 py-0.5 text-[10px] font-semibold text-white">
        {label}
      </span>
    </div>
  );
}

function PointMarker({
  className,
  index,
  point,
}: {
  className: string;
  index: number;
  point: DetectionPointConfig;
}) {
  return (
    <span
      className={cn(
        "PointMarker PointMarker__label-1 absolute grid h-5 w-5 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border text-[10px] font-bold",
        className,
      )}
      style={{
        left: `${point.x}%`,
        top: `${point.y}%`,
      }}
    >
      {index}
    </span>
  );
}

function getRelativePoint(event: PointerEvent<HTMLDivElement>): PercentPoint {
  const rect = event.currentTarget.getBoundingClientRect();

  return {
    x: roundPercent(((event.clientX - rect.left) / rect.width) * 100),
    y: roundPercent(((event.clientY - rect.top) / rect.height) * 100),
  };
}

function buildRoi(start: PercentPoint, end: PercentPoint): DetectionRoiConfig {
  return {
    height: roundPercent(Math.abs(end.y - start.y)),
    width: roundPercent(Math.abs(end.x - start.x)),
    x: roundPercent(Math.min(start.x, end.x)),
    y: roundPercent(Math.min(start.y, end.y)),
  };
}

function findAreaPointHit(
  point: PercentPoint,
  parts: AssetPartConfig[],
  selectedPartId?: string,
) {
  for (const area of getHitOrderedAreas(parts, selectedPartId)) {
    const hitPoint = findPointHit(point, area.points);

    if (hitPoint) {
      return { area, point: hitPoint };
    }
  }

  return undefined;
}

function findAreaRoiHit(
  point: PercentPoint,
  parts: AssetPartConfig[],
  selectedPartId?: string,
) {
  return getHitOrderedAreas(parts, selectedPartId)
    .filter((area) => area.roi && isPointInsideRoi(point, area.roi))
    .sort((firstArea, secondArea) => {
      if (firstArea.id === selectedPartId) {
        return -1;
      }

      if (secondArea.id === selectedPartId) {
        return 1;
      }

      return getRoiArea(firstArea.roi) - getRoiArea(secondArea.roi);
    })
    .map((area) => ({ area, roi: area.roi }))
    .at(0);
}

function getHitOrderedAreas(
  parts: AssetPartConfig[],
  selectedPartId?: string,
) {
  return [...parts].sort((firstArea, secondArea) => {
    if (firstArea.id === selectedPartId) {
      return -1;
    }

    if (secondArea.id === selectedPartId) {
      return 1;
    }

    return 0;
  });
}

function findPointHit(pointer: PercentPoint, points: DetectionPointConfig[]) {
  return points.find(
    (point) =>
      Math.hypot(pointer.x - point.x, pointer.y - point.y) <= POINT_HIT_RADIUS,
  );
}

function isPointInsideRoi(point: PercentPoint, roi: DetectionRoiConfig) {
  return (
    point.x >= roi.x &&
    point.x <= roi.x + roi.width &&
    point.y >= roi.y &&
    point.y <= roi.y + roi.height
  );
}

function getPointDelta(start: PercentPoint, end: PercentPoint): PercentPoint {
  return {
    x: end.x - start.x,
    y: end.y - start.y,
  };
}

function moveRoi(
  roi: DetectionRoiConfig,
  delta: PercentPoint,
): DetectionRoiConfig {
  return {
    ...roi,
    x: roundPercent(Math.min(100 - roi.width, Math.max(0, roi.x + delta.x))),
    y: roundPercent(Math.min(100 - roi.height, Math.max(0, roi.y + delta.y))),
  };
}

function movePoint(point: PercentPoint, delta: PercentPoint): PercentPoint {
  return {
    x: roundPercent(point.x + delta.x),
    y: roundPercent(point.y + delta.y),
  };
}

function getRoiArea(roi?: DetectionRoiConfig) {
  return roi ? roi.width * roi.height : Number.POSITIVE_INFINITY;
}

function roundPercent(value: number) {
  return Number(Math.min(100, Math.max(0, value)).toFixed(1));
}

function areAssetThresholdsEqual(
  firstThresholds: AssetThresholdConfig,
  secondThresholds: AssetThresholdConfig,
) {
  return (
    firstThresholds.temperature === secondThresholds.temperature &&
    firstThresholds.temperatureCritical === secondThresholds.temperatureCritical &&
    firstThresholds.ultrasoundDb === secondThresholds.ultrasoundDb &&
    firstThresholds.ultrasoundCriticalDb ===
      secondThresholds.ultrasoundCriticalDb
  );
}
