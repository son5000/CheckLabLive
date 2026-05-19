import { cn } from "@/lib/utils";

import { assetJudgementClassName } from "../constants/status-styles";
import type {
  AssetJudgement,
  ThresholdMetric,
  ThresholdState,
  WaveformPoint,
} from "@/app/layouts/types";
import { AnalysisPanel } from "./analysis-panel";
import { AssetVideoPanel } from "./asset-video-panel";

/**
 * 역할
 * - 메인 실시간 관제 패널입니다.
 *
 * 개요
 * - 선택 설비 영상 영역과 초음파/열화상 분석 컨트롤을 조립합니다.
 *
 * STEP 1. 실시간 패널 제목과 현재 설비 판정을 렌더링합니다.
 * STEP 2. 영상과 분석 모듈을 반응형 2열 그리드로 렌더링합니다.
 * STEP 3. 임계치 편집 콜백을 분석 행으로 전달합니다.
 *
 * 헬퍼
 * - 본문 영역의 상단 운전 섹션이며, 추이 이력은 별도 섹션에서 다룹니다.
 */

type RealtimeStatusPanelProps = {
  currentDataJudgement: string;
  currentAssetJudgement: AssetJudgement;
  assetName: string;
  exceededMetricCount: number;
  thresholdMetrics: ThresholdMetric[];
  waveformData: WaveformPoint[];
  onThresholdChange: (id: keyof ThresholdState, value: number) => void;
};

export function RealtimeStatusPanel({
  currentDataJudgement,
  currentAssetJudgement,
  assetName,
  exceededMetricCount,
  thresholdMetrics,
  waveformData,
  onThresholdChange,
}: RealtimeStatusPanelProps) {
  return (
    <div className="RealtimeStatusPanel RealtimeStatusPanel__container-1 flex min-h-0 min-w-0 flex-col overflow-hidden rounded-md border border-border bg-card p-3 text-card-foreground">
      <div className="RealtimeStatusPanel RealtimeStatusPanel__container-2 flex min-w-0 items-center justify-between gap-2">
        <p className="RealtimeStatusPanel RealtimeStatusPanel__text-1 min-w-0 truncate text-sm font-semibold text-foreground">
          {assetName} 실시간 현황
        </p>
        <span
          className={cn(
            "RealtimeStatusPanel RealtimeStatusPanel__label-1 shrink-0 rounded-md border px-2 py-1 text-xs font-semibold",
            assetJudgementClassName[currentAssetJudgement],
          )}
        >
          {currentAssetJudgement}
        </span>
      </div>
      <div className="RealtimeStatusPanel RealtimeStatusPanel__container-3 mt-2 grid min-h-0 flex-1 gap-2 md:grid-cols-2">
        <AssetVideoPanel assetName={assetName} />
        <AnalysisPanel
          currentDataJudgement={currentDataJudgement}
          exceededMetricCount={exceededMetricCount}
          thresholdMetrics={thresholdMetrics}
          waveformData={waveformData}
          onThresholdChange={onThresholdChange}
        />
      </div>
    </div>
  );
}
