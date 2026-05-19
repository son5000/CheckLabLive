import { Menu, PanelLeftClose } from "lucide-react";

import { cn } from "@/lib/utils";

import { HeaderActions } from "./header/header-actions";
import { HeaderClock } from "./header/header-clock";
import { HeaderIconButton } from "./header/header-icon-button";
import { HeaderStatusSummary } from "./header/header-status-summary";
import type { DashboardHeaderState } from "./types";

/**
 * 역할
 * - 공정 관제 대시보드의 상단 헤더를 구성합니다.
 *
 * 개요
 * - 메뉴 토글, 선택 위치/상태 요약, 시계, 유틸리티 액션을 조립합니다.
 *
 * STEP 1. 반응형 셸 상태에서 사이드메뉴 토글 라벨을 계산합니다.
 * STEP 2. 가운데 영역에 위치와 상태 요약 모듈을 렌더링합니다.
 * STEP 3. 오른쪽 영역에 시계와 액션 모듈을 렌더링합니다.
 *
 * 헬퍼
 * - 세부 헤더 조각은 헤더 하위 폴더에 두어 셸 파일은 조립 역할만 유지합니다.
 */

type MainHeaderProps = {
  headerState: DashboardHeaderState;
  currentDate: string;
  currentTime: string;
  isDarkMode: boolean;
  isSidebarCollapsed: boolean;
  isMobileSidebarOpen: boolean;
  onMenuToggle: () => void;
  onThemeToggle: () => void;
};

export function MainHeader({
  headerState,
  currentDate,
  currentTime,
  isDarkMode,
  isSidebarCollapsed,
  isMobileSidebarOpen,
  onMenuToggle,
  onThemeToggle,
}: MainHeaderProps) {
  const menuLabel =
    isMobileSidebarOpen || isSidebarCollapsed ? "사이드 메뉴 열기" : "사이드 메뉴 닫기";

  return (
    <header className="MainHeader MainHeader__header-1 grid h-14 shrink-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 border-b border-border bg-background px-2.5 md:px-3">
      <div className="MainHeader MainHeader__container-1 flex min-w-0 items-center gap-2">
        <HeaderIconButton label={menuLabel} onClick={onMenuToggle}>
          <Menu className="MainHeader MainHeader__icon-1 h-4 w-4 md:hidden" aria-hidden="true" />
          <PanelLeftClose
            className={cn("MainHeader MainHeader__icon-2 hidden h-4 w-4 md:block", isSidebarCollapsed && "rotate-180")}
            aria-hidden="true"
          />
        </HeaderIconButton>

        <HeaderStatusSummary headerState={headerState} />
      </div>

      <HeaderClock currentDate={currentDate} currentTime={currentTime} />

      <div className="MainHeader MainHeader__container-2 flex min-w-0 justify-end">
        <HeaderActions
          isDarkMode={isDarkMode}
          unresolvedAlarmCount={headerState.unresolvedAlarmCount}
          userName={headerState.userName}
          onThemeToggle={onThemeToggle}
        />
      </div>
    </header>
  );
}
