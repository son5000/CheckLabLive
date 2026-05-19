import { cn } from "@/lib/utils";

import { thresholdStatusClassName } from "../constants/status-styles";
import type { ThresholdMetric, ThresholdState } from "@/app/layouts/types";

/**
 * 역할
 * - 분석 패널의 편집 가능한 임계치 행입니다.
 *
 * 개요
 * - 현재 값, 임계치 입력, 차이, 초과/정상 상태를 표시합니다.
 *
 * STEP 1. 현재 지표 값을 임계치와 비교합니다.
 * STEP 2. 편집 가능한 임계치 입력을 렌더링합니다.
 * STEP 3. 임계치가 바뀌면 상위 텔레메트리 훅에 알립니다.
 *
 * 헬퍼
 * - 숫자 파싱을 이곳에서 처리해 텔레메트리 훅에는 정리된 숫자 값만 전달합니다.
 */

type ThresholdMetricRowProps = {
  metric: ThresholdMetric;
  onThresholdChange: (id: keyof ThresholdState, value: number) => void;
};

export function ThresholdMetricRow({
  metric,
  onThresholdChange,
}: ThresholdMetricRowProps) {
  const isExceeded = metric.value > metric.threshold;
  const difference = Math.abs(metric.threshold - metric.value).toFixed(1);

  return (
    <div className="ThresholdMetricRow ThresholdMetricRow__container-1 grid min-h-0 min-w-0 grid-cols-[3.25rem_minmax(0,1fr)_4.5rem_4.75rem_3.5rem] items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-[11px]">
      <span className="ThresholdMetricRow ThresholdMetricRow__label-1 truncate text-muted-foreground">{metric.group}</span>
      <div className="ThresholdMetricRow ThresholdMetricRow__container-2 min-w-0">
        <p className="ThresholdMetricRow ThresholdMetricRow__text-1 truncate font-semibold text-foreground">{metric.label}</p>
        <p className="ThresholdMetricRow ThresholdMetricRow__text-2 truncate font-mono text-[10px] text-muted-foreground">
          현재 {metric.value}
          {metric.unit} · {isExceeded ? "초과" : "여유"} {difference}
          {metric.unit}
        </p>
      </div>
      <p className="ThresholdMetricRow ThresholdMetricRow__text-3 truncate text-right font-mono text-xs font-semibold text-foreground">
        {metric.value}
        <span className="ThresholdMetricRow ThresholdMetricRow__label-2 ml-0.5 text-[10px] font-medium text-muted-foreground">{metric.unit}</span>
      </p>
      <label className="ThresholdMetricRow ThresholdMetricRow__field-1 flex min-w-0 items-center gap-1 rounded-md border border-border bg-background px-1 py-0.5">
        <span className="ThresholdMetricRow ThresholdMetricRow__label-3 sr-only">{metric.label} 임계치</span>
        <input
          className="ThresholdMetricRow ThresholdMetricRow__input-1 min-w-0 flex-1 bg-transparent text-right font-mono text-xs font-semibold text-foreground outline-none"
          type="number"
          min={0}
          step="0.1"
          value={metric.threshold}
          onChange={(event) => {
            const nextValue = Number(event.target.value);
            onThresholdChange(metric.id, Number.isNaN(nextValue) ? 0 : nextValue);
          }}
        />
        <span className="ThresholdMetricRow ThresholdMetricRow__label-4 shrink-0 text-[10px] text-muted-foreground">{metric.unit}</span>
      </label>
      <span
        className={cn(
          "ThresholdMetricRow ThresholdMetricRow__label-5 rounded-sm border px-1 py-0.5 text-center text-[10px] font-semibold",
          isExceeded ? thresholdStatusClassName.exceeded : thresholdStatusClassName.normal,
        )}
      >
        {isExceeded ? "초과" : "정상"}
      </span>
    </div>
  );
}
