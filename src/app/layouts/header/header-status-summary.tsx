import { cn } from "@/lib/utils";

import { dashboardStatusClassName } from "../constants/status-styles";
import type { DashboardHeaderState } from "@/app/layouts/types";

/**
 * 역할
 * - 헤더의 위치와 설비 상태 표시 컴포넌트입니다.
 *
 * 개요
 * - 경로 표시 텍스트, 간결한 상태 칩, 수집 요약을 담당합니다.
 *
 * STEP 1. 선택 경로를 합쳐 기본 헤더 제목을 만듭니다.
 * STEP 2. 작은/중간 너비에서 사용할 보조 상태 문장을 구성합니다.
 * STEP 3. 큰 화면에서는 더 풍부한 상태 칩을 렌더링합니다.
 *
 * 헬퍼
 * - 상태 스타일 맵으로 다른 대시보드 모듈과 심각도 스타일을 맞춥니다.
 */

type HeaderStatusSummaryProps = {
  headerState: DashboardHeaderState;
};

export function HeaderStatusSummary({ headerState }: HeaderStatusSummaryProps) {
  const pathText = headerState.selectedPath.join(" > ");

  return (
    <>
      <div className="HeaderStatusSummary HeaderStatusSummary__container-1 min-w-0 flex-1">
        <div className="HeaderStatusSummary HeaderStatusSummary__container-2 flex min-w-0 items-center gap-2">
          <span className="HeaderStatusSummary HeaderStatusSummary__label-1 hidden shrink-0 text-[11px] font-medium text-muted-foreground sm:inline">
            현재 위치
          </span>
          <p className="HeaderStatusSummary HeaderStatusSummary__text-1 min-w-0 truncate text-sm font-semibold text-foreground">{pathText}</p>
        </div>
      </div>

      <div className="HeaderStatusSummary HeaderStatusSummary__container-3 hidden min-w-0 shrink-0 items-center gap-1.5 lg:flex">
        <span
          className={cn(
            "HeaderStatusSummary HeaderStatusSummary__label-2 inline-flex h-8 max-w-24 items-center rounded-md border px-2.5 text-sm font-semibold",
            dashboardStatusClassName[headerState.assetStatus],
          )}
          title={`현재 설비 상태 ${headerState.assetStatusLabel}`}
        >
          <span className="HeaderStatusSummary HeaderStatusSummary__label-3 truncate">{headerState.assetStatusLabel}</span>
        </span>
        <span
          className="HeaderStatusSummary HeaderStatusSummary__label-4 inline-flex h-8 max-w-28 items-center rounded-md border border-border bg-muted px-2.5 text-sm font-semibold text-foreground"
          title={`미처리 경보 ${headerState.unresolvedAlarmCount}건`}
        >
          <span className="HeaderStatusSummary HeaderStatusSummary__label-5 truncate">경보 {headerState.unresolvedAlarmCount}건</span>
        </span>
        <span
          className="HeaderStatusSummary HeaderStatusSummary__label-6 inline-flex h-8 max-w-44 items-center gap-1.5 rounded-md border border-border bg-muted px-2.5 text-xs font-semibold text-foreground"
          title={`최근 수집 ${headerState.lastCollectedAt}`}
        >
          <span className="HeaderStatusSummary HeaderStatusSummary__label-8 shrink-0 text-muted-foreground">
            최근 수집
          </span>
          <span className="HeaderStatusSummary HeaderStatusSummary__label-7 truncate font-mono text-sm text-foreground">
            {headerState.lastCollectedAt}
          </span>
        </span>
      </div>
    </>
  );
}
