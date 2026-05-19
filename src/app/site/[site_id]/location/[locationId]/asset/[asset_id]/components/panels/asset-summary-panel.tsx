import { useEffect, useState } from "react";

import {
  ArrowDown,
  ArrowUp,
  Gauge,
  MapPinned,
  SlidersHorizontal,
} from "lucide-react";

import { cn } from "@/lib/utils";

import type {
  AssetPartConfig,
  AssetPartStatus,
  AssetThresholdConfig,
  OperationState,
  SampleAsset,
  UltrasoundDetection,
} from "@/app/layouts/types";
import { AssetPartList } from "./summary/asset-part-list";
import {
  judgementClassName,
  judgementLabel,
  type AssetJudgementState,
} from "./summary/judgement";
import {
  TemperatureMetricCard,
  UltrasoundMetricCard,
} from "./summary/value-metrics";
import { ThresholdEditor } from "./summary/threshold-editor";

const DETECTION_AREA_SLIDE_INTERVAL_MS = 5_000;

type SummaryMetricCardId = "ultrasound" | "temperature" | "assetPart";

const DEFAULT_SUMMARY_METRIC_ORDER: SummaryMetricCardId[] = [
  "ultrasound",
  "temperature",
  "assetPart",
];

const summaryMetricCardLabels: Record<SummaryMetricCardId, string> = {
  assetPart: "파트",
  temperature: "온도",
  ultrasound: "초음파",
};

/**
 * 역할
 * - 설비 대시보드의 수치, 임계치, 파트 목록 패널입니다.
 *
 * 개요
 * - 설비 요약, 상태 KPI, 평균/최고/최저 온도, 초음파 피크와 주파수, 설비 임계치, 파트 설정을 한 영역에서 처리합니다.
 *
 * STEP 1. 설비의 현재 판정과 위치 문맥을 표시합니다.
 * STEP 2. 필수 수치와 설비 임계치 설정을 넓은 카드로 배치합니다.
 * STEP 3. 사용자가 추가한 파트의 판정, 임계치, 알림 연동 상태를 목록에서 확인합니다.
 *
 * 헬퍼
 * - 파트 추가 버튼은 카메라 패널의 드래그/포인트 지정 모드를 여는 신호만 보냅니다.
 */

type AssetSummaryPanelProps = {
  averageTemperature: number;
  assetParts: AssetPartConfig[];
  assetPartStates: AssetPartStatus[];
  assetThresholds: AssetThresholdConfig | null;
  assetJudgement: AssetJudgementState;
  asset: SampleAsset;
  isSimplified?: boolean;
  isThresholdSaving?: boolean;
  temperatureMax: number;
  temperatureMin: number;
  thresholdSaveError?: string;
  ultrasoundAverageDb: number;
  ultrasoundDetectionCount: number;
  ultrasoundMax: UltrasoundDetection;
  selectedAssetPartId?: string;
  onAssetPartSelect: (partId: string) => void;
  onAssetThresholdSave: (
    thresholds: AssetThresholdConfig | null,
  ) => void | Promise<void>;
  onThresholdEditorDirtyChange?: (isDirty: boolean) => void;
  onStartAssetPart: () => void;
  variant?: "detection" | "full" | "metrics";
};

export function AssetSummaryPanel({
  averageTemperature,
  assetParts,
  assetPartStates,
  assetThresholds,
  assetJudgement,
  asset,
  isSimplified = false,
  isThresholdSaving = false,
  temperatureMax,
  temperatureMin,
  thresholdSaveError,
  ultrasoundAverageDb,
  ultrasoundDetectionCount,
  ultrasoundMax,
  selectedAssetPartId,
  onAssetPartSelect,
  onAssetThresholdSave,
  onThresholdEditorDirtyChange,
  onStartAssetPart,
  variant = "full",
}: AssetSummaryPanelProps) {
  const [isThresholdEditorOpen, setIsThresholdEditorOpen] = useState(false);
  const [activeDetectionMetricIndex, setActiveDetectionMetricIndex] =
    useState(0);
  const [summaryMetricOrder, setSummaryMetricOrder] = useState(
    DEFAULT_SUMMARY_METRIC_ORDER,
  );
  const isTemperatureExceeded = assetThresholds
    ? isCriticalThresholdExceeded(
        averageTemperature,
        assetThresholds.temperature,
        assetThresholds.temperatureCritical,
      )
    : false;
  const isUltrasoundExceeded = assetThresholds
    ? isCriticalThresholdExceeded(
        ultrasoundAverageDb,
        assetThresholds.ultrasoundDb,
        assetThresholds.ultrasoundCriticalDb,
      )
    : false;

  useEffect(() => {
    if (!assetParts.length) {
      setActiveDetectionMetricIndex(0);
      return;
    }

    setActiveDetectionMetricIndex((currentIndex) =>
      currentIndex % assetParts.length,
    );

    if (assetParts.length === 1) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setActiveDetectionMetricIndex(
        (currentIndex) => (currentIndex + 1) % assetParts.length,
      );
    }, DETECTION_AREA_SLIDE_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [assetParts.length]);

  if (variant === "metrics") {
    const renderSummaryMetricCard = (metricId: SummaryMetricCardId) => {
      if (metricId === "ultrasound") {
        return (
          <UltrasoundMetricCard
            key={metricId}
            averageDb={ultrasoundAverageDb}
            peakDb={ultrasoundMax.peakDb}
            dominantFrequencyKHz={ultrasoundMax.dominantFrequencyKHz}
            frequencyBandKHz={ultrasoundMax.frequencyBandKHz}
            detectionCount={ultrasoundDetectionCount}
            threshold={assetThresholds?.ultrasoundDb}
            isExceeded={isUltrasoundExceeded}
          />
        );
      }

      if (metricId === "temperature") {
        return (
          <TemperatureMetricCard
            key={metricId}
            averageTemperature={averageTemperature}
            temperatureMax={temperatureMax}
            temperatureMin={temperatureMin}
            threshold={assetThresholds?.temperature}
            isExceeded={isTemperatureExceeded}
          />
        );
      }

      return (
        <AssetPartMetricCarousel
          key={metricId}
          activeIndex={activeDetectionMetricIndex}
          partStates={assetPartStates}
          parts={assetParts}
        />
      );
    };

    return (
      <section className="AssetDetailSummaryPanel AssetDetailSummaryPanel__section-1 relative flex min-h-0 min-w-0 flex-col overflow-hidden rounded-md border border-border bg-card p-2 text-card-foreground">
        <div className="AssetDetailSummaryPanel AssetDetailSummaryPanel__container-1 mb-2 flex min-w-0 items-center justify-between gap-2">
          <div className="AssetDetailSummaryPanel AssetDetailSummaryPanel__container-2 min-w-0">
            <Gauge
              aria-hidden="true"
              className="AssetDetailSummaryPanel AssetDetailSummaryPanel__title-1 h-4 w-4 text-muted-foreground"
            />
          </div>
          <div className="AssetDetailSummaryPanel AssetDetailSummaryPanel__container-6 flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              className={cn(
                "AssetDetailSummaryPanel AssetDetailSummaryPanel__button-1 grid h-7 w-7 shrink-0 place-items-center rounded-md border text-muted-foreground transition hover:bg-accent hover:text-foreground",
                isThresholdEditorOpen
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background",
              )}
              aria-label="설비 요약 설정"
              aria-expanded={isThresholdEditorOpen}
              aria-controls="asset-threshold-popover"
              title="설비 요약 설정"
              onClick={() => setIsThresholdEditorOpen((isOpen) => !isOpen)}
            >
              <SlidersHorizontal
                className="AssetDetailSummaryPanel AssetDetailSummaryPanel__icon-1 h-3.5 w-3.5"
                aria-hidden="true"
              />
            </button>
            <span
              className={cn(
                "AssetDetailSummaryPanel AssetDetailSummaryPanel__label-1 shrink-0 rounded-md border px-2 py-1 text-[11px] font-semibold",
                judgementClassName[assetJudgement],
              )}
            >
              {judgementLabel[assetJudgement]}
            </span>
          </div>
        </div>
        {isThresholdEditorOpen ? (
          <div
            id="asset-threshold-popover"
            className="AssetDetailSummaryPanel AssetDetailSummaryPanel__popover-1 absolute right-2 top-10 z-20 grid max-h-[calc(100%-2.75rem)] w-[min(22rem,calc(100%-1rem))] gap-2 overflow-y-auto overscroll-contain rounded-md shadow-2xl [scrollbar-width:thin]"
          >
            <ThresholdEditor
              isSaving={isThresholdSaving}
              onDirtyChange={onThresholdEditorDirtyChange}
              saveError={thresholdSaveError}
              thresholds={assetThresholds}
              temperatureExceeded={isTemperatureExceeded}
              ultrasoundExceeded={isUltrasoundExceeded}
              onClose={() => setIsThresholdEditorOpen(false)}
              onSave={onAssetThresholdSave}
            />
            <SummaryMetricOrderEditor
              order={summaryMetricOrder}
              onOrderChange={setSummaryMetricOrder}
            />
          </div>
        ) : null}
        <div className="AssetDetailSummaryPanel AssetDetailSummaryPanel__container-3 grid min-h-0 flex-1 grid-rows-3 gap-2 overflow-hidden">
          {summaryMetricOrder.map(renderSummaryMetricCard)}
        </div>
      </section>
    );
  }

  if (variant === "detection") {
    return (
      <section className="AssetDetailSummaryPanel AssetDetailSummaryPanel__section-1 grid h-full min-h-0 min-w-0 grid-rows-[minmax(0,2fr)_minmax(0,3fr)] gap-2 overflow-hidden rounded-md border border-border bg-card p-2 text-card-foreground">
        <div className="AssetDetailSummaryPanel AssetDetailSummaryPanel__container-5 min-h-0 min-w-0 overflow-hidden">
          <AssetPartList
            parts={assetParts}
            partStates={assetPartStates}
            selectedPartId={selectedAssetPartId}
            onPartSelect={onAssetPartSelect}
            onStartAssetPart={onStartAssetPart}
          />
        </div>
        <AssetAssetInfoSection asset={asset} />
      </section>
    );
  }

  return (
    <section
      className={cn(
        "AssetDetailSummaryPanel AssetDetailSummaryPanel__section-1 min-h-0 min-w-0 overflow-hidden rounded-md border border-border bg-card text-card-foreground",
        !isSimplified ? "grid h-full grid-rows-3" : "flex flex-col",
      )}
    >
      {/* ── 1/3: 초음파 카드 ── */}
      <div className="AssetDetailSummaryPanel AssetDetailSummaryPanel__row-1 min-h-0 overflow-hidden border-b border-border p-2">
        <UltrasoundMetricCard
          averageDb={ultrasoundAverageDb}
          peakDb={ultrasoundMax.peakDb}
          dominantFrequencyKHz={ultrasoundMax.dominantFrequencyKHz}
          frequencyBandKHz={ultrasoundMax.frequencyBandKHz}
          detectionCount={ultrasoundDetectionCount}
          threshold={assetThresholds?.ultrasoundDb}
          isExceeded={isUltrasoundExceeded}
        />
      </div>

      {/* ── 2/3: 온도 카드 ── */}
      <div className="AssetDetailSummaryPanel AssetDetailSummaryPanel__row-2 min-h-0 overflow-hidden border-b border-border p-2">
        <TemperatureMetricCard
          averageTemperature={averageTemperature}
          temperatureMax={temperatureMax}
          temperatureMin={temperatureMin}
          threshold={assetThresholds?.temperature}
          isExceeded={isTemperatureExceeded}
        />
      </div>

      {/* ── 3/3: 빈 공간 (추후 활용) ── */}
      <div className="AssetDetailSummaryPanel AssetDetailSummaryPanel__row-3 min-h-0 overflow-hidden p-2">
        <AssetPartMetricCarousel
          activeIndex={activeDetectionMetricIndex}
          partStates={assetPartStates}
          parts={assetParts}
        />
      </div>
    </section>
  );
}

function SummaryMetricOrderEditor({
  order,
  onOrderChange,
}: {
  order: SummaryMetricCardId[];
  onOrderChange: (order: SummaryMetricCardId[]) => void;
}) {
  const moveItem = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= order.length) {
      return;
    }

    const nextOrder = [...order];
    const [movedItem] = nextOrder.splice(fromIndex, 1);
    if (!movedItem) {
      return;
    }

    nextOrder.splice(toIndex, 0, movedItem);
    onOrderChange(nextOrder);
  };

  return (
    <section className="SummaryMetricOrderEditor SummaryMetricOrderEditor__section-1 rounded-md border border-border bg-background p-1.5">
      <div className="SummaryMetricOrderEditor SummaryMetricOrderEditor__header-1 mb-1.5 flex min-w-0 items-center justify-between gap-2">
        <h2 className="SummaryMetricOrderEditor SummaryMetricOrderEditor__title-1 truncate text-xs font-semibold">
          요약 카드 순서
        </h2>
        <span className="SummaryMetricOrderEditor SummaryMetricOrderEditor__label-1 shrink-0 rounded-sm border border-border bg-card px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
          {order.length}
        </span>
      </div>

      <ol className="SummaryMetricOrderEditor SummaryMetricOrderEditor__list-1 grid gap-1.5">
        {order.map((metricId, index) => (
          <li
            key={metricId}
            className="SummaryMetricOrderEditor SummaryMetricOrderEditor__item-1 grid min-w-0 grid-cols-[1.5rem_minmax(0,1fr)_auto] items-center gap-1.5 rounded-md border border-border bg-card px-2 py-1.5"
          >
            <span className="SummaryMetricOrderEditor SummaryMetricOrderEditor__index-1 font-mono text-[10px] font-bold text-muted-foreground">
              {index + 1}
            </span>
            <span className="SummaryMetricOrderEditor SummaryMetricOrderEditor__text-1 min-w-0 truncate text-[11px] font-semibold">
              {summaryMetricCardLabels[metricId]}
            </span>
            <span className="SummaryMetricOrderEditor SummaryMetricOrderEditor__actions-1 flex shrink-0 items-center gap-1">
              <button
                type="button"
                className="SummaryMetricOrderEditor SummaryMetricOrderEditor__button-1 grid h-6 w-6 place-items-center rounded-sm border border-border bg-background text-muted-foreground transition hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                aria-label={`${summaryMetricCardLabels[metricId]} 위로 이동`}
                title="위로 이동"
                disabled={index === 0}
                onClick={() => moveItem(index, index - 1)}
              >
                <ArrowUp
                  className="SummaryMetricOrderEditor SummaryMetricOrderEditor__icon-1 h-3.5 w-3.5"
                  aria-hidden="true"
                />
              </button>
              <button
                type="button"
                className="SummaryMetricOrderEditor SummaryMetricOrderEditor__button-2 grid h-6 w-6 place-items-center rounded-sm border border-border bg-background text-muted-foreground transition hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                aria-label={`${summaryMetricCardLabels[metricId]} 아래로 이동`}
                title="아래로 이동"
                disabled={index === order.length - 1}
                onClick={() => moveItem(index, index + 1)}
              >
                <ArrowDown
                  className="SummaryMetricOrderEditor SummaryMetricOrderEditor__icon-2 h-3.5 w-3.5"
                  aria-hidden="true"
                />
              </button>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

function AssetAssetInfoSection({
  asset,
}: {
  asset: SampleAsset;
}) {
  const operationState = getOperationState(
    asset.operationState,
    asset.status,
  );
  const assetInfoItems = [
    {
      label: "설비 코드 / 자산 번호",
      value: `${asset.assetCode ?? formatFallbackAssetCode(asset.id)} / ${asset.assetNumber ?? "미등록"}`,
    },
    { label: "모델명", value: asset.modelName ?? "미등록" },
    { label: "시리얼 번호", value: asset.serialNumber ?? "미등록" },
    { label: "가동 여부", value: formatOperationState(operationState) },
    { label: "담당자", value: asset.manager ?? "미지정" },
    { label: "비상 연락처", value: asset.emergencyContact ?? "미등록" },
    { label: "마지막 점검일", value: asset.lastInspectionDate ?? "미등록" },
  ];

  return (
    <section
      className="AssetAssetInfoSection AssetAssetInfoSection__section-1 flex min-h-0 min-w-0 flex-col overflow-hidden rounded-md border border-border bg-background p-1.5"
      aria-label="설비 기본 정보"
    >
      <div className="AssetAssetInfoSection AssetAssetInfoSection__header-1 mb-1.5 flex min-w-0 items-center justify-between gap-2">
        <div className="AssetAssetInfoSection AssetAssetInfoSection__title-wrap-1 min-w-0">
          <h2 className="AssetAssetInfoSection AssetAssetInfoSection__title-1 truncate text-xs font-semibold">
            설비 기본 정보
          </h2>
          <p className="AssetAssetInfoSection AssetAssetInfoSection__subtitle-1 truncate text-[10px] font-medium text-muted-foreground">
            {asset.name}
          </p>
        </div>
        <span
          className={cn(
            "AssetAssetInfoSection AssetAssetInfoSection__status-1 shrink-0 rounded-sm border px-1.5 py-0.5 text-[10px] font-semibold",
            operationStateClassName[operationState],
          )}
        >
          {formatOperationState(operationState)}
        </span>
      </div>

      <dl className="AssetAssetInfoSection AssetAssetInfoSection__list-1 grid min-h-0 flex-1 auto-rows-min gap-1 overflow-y-auto overscroll-contain pr-1 [scrollbar-gutter:stable] [scrollbar-width:thin]">
        {assetInfoItems.map((item) => (
          <div
            key={item.label}
            className="AssetAssetInfoSection AssetAssetInfoSection__row-1 grid min-w-0 grid-cols-[minmax(6.75rem,7.75rem)_minmax(0,1fr)] items-center gap-2 rounded-sm border border-border/70 bg-card px-2 py-1.5"
          >
            <dt className="AssetAssetInfoSection AssetAssetInfoSection__label-1 min-w-0 truncate text-[10px] font-semibold text-muted-foreground">
              {item.label}
            </dt>
            <dd
              className="AssetAssetInfoSection AssetAssetInfoSection__value-1 min-w-0 truncate text-right font-mono text-[11px] font-bold text-foreground"
              title={item.value}
            >
              {item.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function AssetPartMetricCarousel({
  activeIndex,
  parts,
  partStates,
}: {
  activeIndex: number;
  parts: AssetPartConfig[];
  partStates: AssetPartStatus[];
}) {
  const activePart = parts.length ? parts[activeIndex % parts.length] : undefined;
  const activePartState = activePart
    ? partStates.find((partState) => partState.partId === activePart.id)
    : undefined;

  if (!activePart) {
    return (
      <div className="UltrasoundMetricCard MetricPlaceholderCard relative flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-md border border-border/60 bg-background/80">
        <div className="h-[3px] w-full shrink-0 bg-muted-foreground/25" />
        <div className="flex min-w-0 items-center justify-between gap-2 border-b border-border/40 px-3 py-1.5">
          <p className="min-w-0 truncate text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            감지 데이터
          </p>
          <MapPinned
            className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
        </div>
        <div className="grid min-h-0 flex-1 place-items-center px-3 text-center">
          <p className="text-[11px] font-semibold text-muted-foreground">
            등록된 파트가 없습니다.
          </p>
        </div>
      </div>
    );
  }

  const judgement = activePartState?.judgement ?? "normal";
  const temperatureValue = activePartState?.temperatureMax ?? 0;
  const ultrasoundValue = activePartState?.ultrasoundPeakDb ?? 0;
  const isTemperatureExceeded = isCriticalThresholdExceeded(
    temperatureValue,
    activePart.thresholds.temperature,
    activePart.thresholds.temperatureCritical,
  );
  const isUltrasoundExceeded = isCriticalThresholdExceeded(
    ultrasoundValue,
    activePart.thresholds.ultrasoundDb,
    activePart.thresholds.ultrasoundCriticalDb,
  );
  const accentClassName =
    judgement === "abnormal"
      ? "bg-red-500"
      : judgement === "caution"
        ? "bg-amber-500"
        : "bg-emerald-500";

  return (
    <article className="UltrasoundMetricCard MetricPlaceholderCard relative flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-md border border-border/60 bg-background/80">
      <div className={cn("h-[3px] w-full shrink-0", accentClassName)} />
      <div className="flex min-w-0 items-center justify-between gap-2 border-b border-border/40 px-3 py-1.5">
        <div className="min-w-0">
          <p className="min-w-0 truncate text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            감지 데이터
          </p>
          <p className="truncate text-xs font-semibold">{activePart.name}</p>
        </div>
        <span className="shrink-0 rounded-sm border border-border bg-card px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
          {(activeIndex % parts.length) + 1}/{parts.length}
        </span>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-2 overflow-hidden">
        <div className="relative isolate flex min-h-0 min-w-0 flex-col justify-between overflow-hidden border-r border-border/40 p-2">
          <AssetPartMiniMap part={activePart} />
          <div className="mt-1 flex min-w-0 items-center justify-between gap-1">
            <span className="truncate text-[10px] font-semibold text-muted-foreground">
              {activePart.mode === "area" ? "영역 ROI" : "포인트"}
            </span>
            <span
              className={cn(
                "shrink-0 rounded-sm border px-1.5 py-0.5 text-[10px] font-semibold",
                judgementClassName[judgement],
              )}
            >
              {judgementLabel[judgement]}
            </span>
          </div>
        </div>

        <dl className="grid h-full min-h-0 min-w-0 grid-rows-4 gap-1 px-2 py-2">
          <DetectionMetricInfoRow
            highlighted={isTemperatureExceeded}
            label="온도"
            value={`${roundOne(temperatureValue)} / ${roundOne(activePart.thresholds.temperature)} ℃`}
          />
          <DetectionMetricInfoRow
            highlighted={isUltrasoundExceeded}
            label="초음파"
            value={`${roundOne(ultrasoundValue)} / ${roundOne(activePart.thresholds.ultrasoundDb)} dB`}
          />
          <DetectionMetricInfoRow
            label="주파수"
            value={`${activePartState?.dominantFrequencyKHz ?? 0} kHz`}
          />
          <DetectionMetricInfoRow
            label="지점"
            value={formatAssetPartScope(activePart)}
          />
        </dl>
      </div>
    </article>
  );
}

function AssetPartMiniMap({ part }: { part: AssetPartConfig }) {
  return (
    <div className="AssetPartMiniMap AssetPartMiniMap__container-1 relative min-h-0 flex-1 overflow-hidden rounded-md border border-border/60 bg-card [background-image:linear-gradient(90deg,color-mix(in_oklch,var(--muted-foreground)_18%,transparent)_1px,transparent_1px),linear-gradient(color-mix(in_oklch,var(--muted-foreground)_18%,transparent)_1px,transparent_1px)] [background-size:18px_18px]">
      {part.roi ? (
        <span
          className="AssetPartMiniMap AssetPartMiniMap__roi-1 absolute rounded-sm border-2 border-cyan-500 bg-cyan-500/15"
          style={{
            height: `${part.roi.height}%`,
            left: `${part.roi.x}%`,
            top: `${part.roi.y}%`,
            width: `${part.roi.width}%`,
          }}
        />
      ) : null}
      {part.points.map((point, index) => (
        <span
          key={point.id}
          className="AssetPartMiniMap AssetPartMiniMap__point-1 absolute grid h-4 w-4 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-cyan-200 bg-cyan-500 text-[9px] font-bold text-white shadow-sm"
          style={{
            left: `${point.x}%`,
            top: `${point.y}%`,
          }}
        >
          {index + 1}
        </span>
      ))}
    </div>
  );
}

function DetectionMetricInfoRow({
  highlighted,
  label,
  value,
}: {
  highlighted?: boolean;
  label: string;
  value: string;
}) {
  return (
    <div
      className={cn(
        "DetectionMetricInfoRow DetectionMetricInfoRow__row-1 flex min-h-0 min-w-0 items-center justify-between gap-1 overflow-hidden rounded-[4px] border border-border/45 border-l-2 bg-background/55 px-1.5 py-1.5",
        highlighted
          ? "border-l-red-500 bg-red-500/10"
          : "border-l-cyan-500",
      )}
    >
      <dt className="DetectionMetricInfoRow DetectionMetricInfoRow__label-1 min-w-0 shrink-0 truncate font-mono text-[10px] font-semibold uppercase tracking-normal text-muted-foreground">
        {label}
      </dt>
      <dd
        className={cn(
          "DetectionMetricInfoRow DetectionMetricInfoRow__value-1 min-w-0 truncate text-right font-mono text-[12px] font-black leading-none text-foreground",
          highlighted && "text-red-500 dark:text-red-400",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function formatAssetPartScope(part: AssetPartConfig) {
  if (part.mode === "area" && part.roi) {
    return `${Math.round(part.roi.width)}×${Math.round(part.roi.height)}%`;
  }

  return `${part.points.length}개`;
}

function roundOne(value: number) {
  return Math.round(value * 10) / 10;
}

function isCriticalThresholdExceeded(
  value: number,
  warningThreshold: number,
  criticalThreshold?: number,
) {
  if (value <= 0 || warningThreshold <= 0) {
    return false;
  }

  return isFinitePositiveNumber(criticalThreshold)
    ? value >= criticalThreshold
    : value >= warningThreshold;
}

function isFinitePositiveNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function getOperationState(
  operationState: OperationState | undefined,
  status: SampleAsset["status"],
): OperationState {
  if (operationState) {
    return operationState;
  }

  return status === "error" ? "비가동" : "가동중";
}

function formatOperationState(operationState: OperationState) {
  return operationState === "가동중" ? "가동 중" : "비가동";
}

function formatFallbackAssetCode(assetId: string) {
  return assetId.toUpperCase().replace(/[^0-9A-Z]+/g, "-");
}

const operationStateClassName: Record<OperationState, string> = {
  가동중:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  비가동:
    "border-slate-500/30 bg-slate-500/10 text-slate-700 dark:text-slate-300",
};
