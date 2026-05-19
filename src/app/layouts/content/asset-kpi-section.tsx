import type { AssetMetrics } from "@/app/layouts/types";
import { MetricTile } from "./metric-tile";

/**
 * 역할
 * - 설비 핵심 지표 그리드입니다.
 *
 * 개요
 * - 선택 설비의 초음파, 온도, 전압, 전력 값을 표시합니다.
 *
 * STEP 1. 섹션 헤더에 전력 상태 라벨을 표시합니다.
 * STEP 2. 주요 핵심 지표 타일 6개를 렌더링합니다.
 * STEP 3. 보조 전력 타일 2개를 렌더링합니다.
 *
 * 헬퍼
 * - 반복되는 핵심 지표 마크업은 지표 타일 컴포넌트 한 곳에서 관리합니다.
 */

type AssetKpiSectionProps = {
  assetMetrics: AssetMetrics;
};

export function AssetKpiSection({ assetMetrics }: AssetKpiSectionProps) {
  return (
    <section className="AssetKpiSection AssetKpiSection__section-1 min-h-0 overflow-hidden" aria-label="설비 계측 KPI">
      <div className="AssetKpiSection AssetKpiSection__container-1 mb-1 flex min-w-0 items-center justify-between gap-2">
        <h2 className="AssetKpiSection AssetKpiSection__title-1 min-w-0 truncate text-xs font-semibold text-foreground">설비 KPI</h2>
        <span className="AssetKpiSection AssetKpiSection__label-1 shrink-0 truncate text-[11px] text-muted-foreground">
          {assetMetrics.powerStatus}
        </span>
      </div>
      <div className="AssetKpiSection AssetKpiSection__container-2 grid grid-cols-3 gap-1">
        <MetricTile label="dB" value={assetMetrics.soundDb} />
        <MetricTile label="peak dB" value={assetMetrics.peakDb} />
        <MetricTile label="kHz" value={assetMetrics.frequencyKHz} />
        <MetricTile label="평균 온도" value={assetMetrics.averageTemperature} unit="℃" />
        <MetricTile label="최고 온도" value={assetMetrics.maxTemperature} unit="℃" />
        <MetricTile label="최저 온도" value={assetMetrics.minTemperature} unit="℃" />
      </div>
      <div className="AssetKpiSection AssetKpiSection__container-3 mt-1 grid grid-cols-2 gap-1">
        <MetricTile label="입력 전압" value={assetMetrics.inputVoltage} />
        <MetricTile label="전력 사용량" value={assetMetrics.powerUsage} />
      </div>
    </section>
  );
}
