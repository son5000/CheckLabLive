import { Bell, Moon, Settings, Sun, UserCircle } from "lucide-react";

import { HeaderIconButton } from "./header-icon-button";

/**
 * 역할
 * - 대시보드 헤더 오른쪽 액션 묶음입니다.
 *
 * 개요
 * - 테마 토글, 알림 배지, 설정 진입, 사용자 메뉴 버튼을 담당합니다.
 *
 * STEP 1. `isDarkMode` 값에 따라 테마 아이콘을 선택합니다.
 * STEP 2. 알림 수를 접근 가능한 배지로 렌더링합니다.
 * STEP 3. 설정과 사용자 진입 버튼의 크기를 헤더 버튼과 맞춥니다.
 *
 * 헬퍼
 * - 알림 버튼은 겹쳐진 숫자 배지를 포함하므로 별도 마크업을 사용합니다.
 */

type HeaderActionsProps = {
  isDarkMode: boolean;
  unresolvedAlarmCount: number;
  userName: string;
  onThemeToggle: () => void;
};

export function HeaderActions({
  isDarkMode,
  unresolvedAlarmCount,
  userName,
  onThemeToggle,
}: HeaderActionsProps) {
  return (
    <div className="HeaderActions HeaderActions__container-1 flex shrink-0 items-center gap-1">
      <HeaderIconButton
        label={isDarkMode ? "밝은 화면으로 전환" : "어두운 화면으로 전환"}
        onClick={onThemeToggle}
      >
        {isDarkMode ? (
          <Sun className="HeaderActions HeaderActions__icon-1 h-4 w-4" aria-hidden="true" />
        ) : (
          <Moon className="HeaderActions HeaderActions__icon-2 h-4 w-4" aria-hidden="true" />
        )}
      </HeaderIconButton>

      <button
        type="button"
        className="HeaderActions HeaderActions__button-1 relative grid h-9 w-9 shrink-0 place-items-center rounded-md border border-border bg-background text-muted-foreground transition hover:bg-accent hover:text-foreground"
        title="알림"
        aria-label={`알림, 미처리 경보 ${unresolvedAlarmCount}건`}
      >
        <Bell className="HeaderActions HeaderActions__icon-3 h-4 w-4" aria-hidden="true" />
        <span className="HeaderActions HeaderActions__label-1 absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
          {unresolvedAlarmCount}
        </span>
      </button>

      <HeaderIconButton label="설정">
        <Settings className="HeaderActions HeaderActions__icon-4 h-4 w-4" aria-hidden="true" />
      </HeaderIconButton>

      <button
        type="button"
        className="HeaderActions HeaderActions__button-2 flex h-9 max-w-36 shrink-0 items-center gap-1.5 rounded-md border border-border bg-background px-2 text-sm text-muted-foreground transition hover:bg-accent hover:text-foreground"
        title="사용자 메뉴"
        aria-label="사용자 메뉴"
      >
        <UserCircle className="HeaderActions HeaderActions__icon-5 h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="HeaderActions HeaderActions__label-2 hidden truncate text-xs font-medium md:inline">{userName}</span>
      </button>
    </div>
  );
}
