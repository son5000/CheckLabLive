import type {
  AlarmRecord,
  AssetJudgementItem,
  AssetMetrics,
  TemperatureArea,
} from "@/app/layouts/types";
import { AlarmRecordSection } from "./alarm-record-section";
import { AssetKpiSection } from "./asset-kpi-section";
import { AssetStatusSection } from "./asset-status-section";
import { TemperatureAreaSection } from "./temperature-area-section";

/**
 * 역할
 * - 좌측 선택 설비 요약 패널입니다.
 *
 * 개요
 * - 운전 상태, 핵심 지표, 열화상 영역, 설비 단위 경보 기록을 조립합니다.
 *
 * STEP 1. 선택 설비 식별 정보와 판정 요약을 렌더링합니다.
 * STEP 2. 현재 계측 핵심 지표를 렌더링합니다.
 * STEP 3. 열화상 및 경보 상세 목록을 렌더링합니다.
 *
 * 헬퍼
 * - 패널 하위 요소는 도메인별로 분리해 각 목록/카드가 독립적으로 확장되게 합니다.
 */

type AssetSummaryPanelProps = {
  alarmRecords: AlarmRecord[];
  cautionCount: number;
  abnormalCount: number;
  assetMetrics: AssetMetrics;
  judgementItems: AssetJudgementItem[];
  normalCount: number;
  temperatureAreas: TemperatureArea[];
};

export function AssetSummaryPanel({
  alarmRecords,
  cautionCount,
  abnormalCount,
  assetMetrics,
  judgementItems,
  normalCount,
  temperatureAreas,
}: AssetSummaryPanelProps) {
  return (
    <aside className="DashboardContentAssetSummaryPanel DashboardContentAssetSummaryPanel__panel-1 grid h-full min-h-0 min-w-0 grid-rows-[auto_auto_minmax(0,1fr)_minmax(40%,1.15fr)] gap-2 overflow-hidden rounded-md border border-border bg-card p-2 text-card-foreground md:p-3">
      <AssetStatusSection
        assetMetrics={assetMetrics}
        judgementItems={judgementItems}
        normalCount={normalCount}
        cautionCount={cautionCount}
        abnormalCount={abnormalCount}
      />
      <AssetKpiSection assetMetrics={assetMetrics} />
      <TemperatureAreaSection parts={temperatureAreas} />
      <AlarmRecordSection records={alarmRecords} />
    </aside>
  );
}
