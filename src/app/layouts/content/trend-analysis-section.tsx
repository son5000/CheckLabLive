import type { ReferenceLineConfig, TrendPoint, TrendRange } from "@/app/layouts/types";
import { TrendChart } from "./trend-chart";

/**
 * 역할
 * - 실시간 관제 패널 아래의 추이 이력 섹션입니다.
 *
 * 개요
 * - 현재 활성 범위의 초음파와 온도 이력 차트를 표시합니다.
 *
 * STEP 1. 자동 범위 전환 안내를 표시합니다.
 * STEP 2. dB 기준선이 포함된 초음파 추이 차트를 렌더링합니다.
 * STEP 3. 온도 기준선이 포함된 온도 추이 차트를 렌더링합니다.
 *
 * 헬퍼
 * - 차트 시리즈와 기준선은 대시보드 텔레메트리 훅에서 미리 준비됩니다.
 */

type TrendAnalysisSectionProps = {
  activeRange: TrendRange;
  ultrasonicTrendData: TrendPoint[];
  temperatureTrendData: TrendPoint[];
  ultrasonicReferenceLines: ReferenceLineConfig[];
  temperatureReferenceLines: ReferenceLineConfig[];
};

export function TrendAnalysisSection({
  activeRange,
  ultrasonicTrendData,
  temperatureTrendData,
  ultrasonicReferenceLines,
  temperatureReferenceLines,
}: TrendAnalysisSectionProps) {
  return (
    <section className="TrendAnalysisSection TrendAnalysisSection__section-1 flex min-h-0 min-w-0 flex-col overflow-hidden rounded-md border border-border bg-background/35 p-2 md:p-3" aria-label="추이 변화 분석">
      <div className="TrendAnalysisSection TrendAnalysisSection__container-1 mb-2 flex min-w-0 items-center justify-between gap-2">
        <h2 className="TrendAnalysisSection TrendAnalysisSection__title-1 min-w-0 truncate text-sm font-semibold text-foreground">추이 변화 분석</h2>
        <span className="TrendAnalysisSection TrendAnalysisSection__label-1 shrink-0 truncate text-xs text-muted-foreground">
          30초마다 표시 범위 전환 · 현재 {activeRange.label}
        </span>
      </div>
      <div className="TrendAnalysisSection TrendAnalysisSection__container-2 grid min-h-0 flex-1 gap-2 lg:grid-cols-2">
        <TrendChart
          title="초음파 추이 변화"
          rangeLabel={activeRange.label}
          data={ultrasonicTrendData}
          variant="ultrasonic"
          referenceLines={ultrasonicReferenceLines}
        />
        <TrendChart
          title="온도 추이 변화"
          rangeLabel={activeRange.label}
          data={temperatureTrendData}
          variant="temperature"
          referenceLines={temperatureReferenceLines}
        />
      </div>
    </section>
  );
}
