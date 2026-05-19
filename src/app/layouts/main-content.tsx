"use client";

import { cn } from "@/lib/utils";

import {
  alarmRecords,
  assetJudgementItems,
  assetMetrics,
  temperatureAreas,
} from "./data/asset-monitoring-data";
import { AssetSummaryPanel } from "./content/asset-summary-panel";
import { RealtimeStatusPanel } from "./content/realtime-status-panel";
import { TrendAnalysisSection } from "./content/trend-analysis-section";
import { useDashboardShellState } from "./hooks/use-dashboard-shell-state";
import { useDashboardTelemetry } from "./hooks/use-dashboard-telemetry";

/**
 * 역할
 * - 대시보드 본문 영역을 조립합니다.
 *
 * 개요
 * - 선택 설비 요약, 실시간 분석, 추이 분석 섹션을 한 화면에 배치합니다.
 *
 * STEP 1. `useDashboardTelemetry`에서 실시간 상태와 파생 뷰 모델을 가져옵니다.
 * STEP 2. 선택 설비의 정적 데이터를 좌측 요약 패널에 전달합니다.
 * STEP 3. 계산된 차트와 임계치 값을 실시간/추이 모듈에 전달합니다.
 *
 * 헬퍼
 * - 이 파일은 레이아웃 조립만 담당하고, 섹션 내부 구현은 본문 하위 폴더에 둡니다.
 */

export function MainContent() {
  const telemetry = useDashboardTelemetry();
  const { isMobileSidebarOpen, isSidebarCollapsed } = useDashboardShellState();
  const isSidebarExpanded = !isMobileSidebarOpen && !isSidebarCollapsed;

  return (
    <main className="MainContent MainContent__root-1 min-w-0 flex-1 overflow-hidden bg-muted/35 p-2 md:p-3">
      <div
        className={cn(
          "MainContent MainContent__container-1 MainContentGrid grid h-full min-h-0 grid-rows-[18rem_minmax(0,1fr)] gap-2 md:grid-rows-1 md:gap-3",
          isSidebarExpanded
            ? "md:grid-cols-[19rem_minmax(0,1fr)] xl:grid-cols-[21rem_minmax(0,1fr)]"
            : "md:grid-cols-[22rem_minmax(0,1fr)] xl:grid-cols-[24rem_minmax(0,1fr)]",
        )}
      >
        <AssetSummaryPanel
          alarmRecords={alarmRecords}
          cautionCount={telemetry.judgementCounts.caution}
          abnormalCount={telemetry.judgementCounts.abnormal}
          assetMetrics={assetMetrics}
          judgementItems={assetJudgementItems}
          normalCount={telemetry.judgementCounts.normal}
          temperatureAreas={temperatureAreas}
        />

        <section
          className={cn(
            "MainContent MainContent__section-1 MainContentRealtimeColumn grid h-full min-h-0 min-w-0 gap-2 md:gap-3",
            isSidebarExpanded
              ? "grid-rows-[minmax(0,1.45fr)_minmax(0,0.72fr)]"
              : "grid-rows-[minmax(0,1.22fr)_minmax(0,0.78fr)]",
          )}
        >
          <RealtimeStatusPanel
            currentDataJudgement={telemetry.currentDataJudgement}
            currentAssetJudgement={telemetry.currentAssetJudgement}
            assetName={assetMetrics.assetName}
            exceededMetricCount={telemetry.exceededMetricCount}
            thresholdMetrics={telemetry.thresholdMetrics}
            waveformData={telemetry.waveformData}
            onThresholdChange={telemetry.onThresholdChange}
          />

          <TrendAnalysisSection
            activeRange={telemetry.activeRange}
            ultrasonicTrendData={telemetry.ultrasonicTrendData}
            temperatureTrendData={telemetry.temperatureTrendData}
            ultrasonicReferenceLines={telemetry.ultrasonicReferenceLines}
            temperatureReferenceLines={telemetry.temperatureReferenceLines}
          />
        </section>
      </div>
    </main>
  );
}
