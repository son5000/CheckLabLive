import { cn } from "@/lib/utils";

import type { AlarmRecord } from "@/app/layouts/types";

/**
 * 역할
 * - 선택 설비의 로컬 경보 이력 섹션입니다.
 *
 * 개요
 * - 최근 경보 레코드의 코드, 발생 시각, 확인 상태를 표시합니다.
 *
 * STEP 1. 최신 레코드를 간결한 그리드로 렌더링합니다.
 * STEP 2. 확인 상태에 따라 성공/오류 스타일을 선택합니다.
 * STEP 3. 제한된 사이드 패널 공간에서도 코드와 시각을 보이게 유지합니다.
 *
 * 헬퍼
 * - 설비 단위 이력이므로 글로벌 알림과 별도 섹션으로 분리합니다.
 */

type AlarmRecordSectionProps = {
  records: AlarmRecord[];
};

export function AlarmRecordSection({ records }: AlarmRecordSectionProps) {
  return (
    <section className="AlarmRecordSection AlarmRecordSection__section-1 min-h-0 overflow-hidden border-t border-border pt-2" aria-label="경보 기록">
      <h2 className="AlarmRecordSection AlarmRecordSection__title-1 mb-1 truncate text-xs font-semibold text-foreground">경보 기록</h2>
      <div className="AlarmRecordSection AlarmRecordSection__container-1 grid min-h-0 gap-1">
        {records.map((alarmRecord) => (
          <div
            key={alarmRecord.id}
            className="AlarmRecordSection AlarmRecordSection__container-2 grid h-8 min-w-0 grid-cols-[minmax(0,1fr)_4.25rem_3rem] items-center gap-1 rounded-md border border-border bg-background px-2 text-[11px]"
            title={`${alarmRecord.type} ${alarmRecord.occurredAt} ${alarmRecord.code}`}
          >
            <div className="AlarmRecordSection AlarmRecordSection__container-3 min-w-0">
              <p className="AlarmRecordSection AlarmRecordSection__text-1 truncate font-medium text-foreground">{alarmRecord.type}</p>
              <p className="AlarmRecordSection AlarmRecordSection__text-2 truncate text-[10px] text-muted-foreground">
                {alarmRecord.occurredAt} · {alarmRecord.code}
              </p>
            </div>
            <span className="AlarmRecordSection AlarmRecordSection__label-1 truncate text-muted-foreground">{alarmRecord.code}</span>
            <span
              className={cn(
                "AlarmRecordSection AlarmRecordSection__label-2 rounded-sm border px-1 py-0.5 text-center text-[10px] font-semibold",
                alarmRecord.isConfirmed
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                  : "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300",
              )}
            >
              {alarmRecord.isConfirmed ? "확인" : "미확인"}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
