import { cn } from "@/lib/utils";

import { ManagementMenuSection } from "./side-menu/management-menu-section";
import { MonitoringTreeSection } from "./side-menu/monitoring-tree-section";
import { SideMenuBrand } from "./side-menu/side-menu-brand";
import type { ManagementMenuItem, MonitoringTreeNode } from "./types";

/**
 * 역할
 * - 대시보드 페이지의 전역 사이드메뉴 셸입니다.
 *
 * 개요
 * - 브랜드, 관제 트리, 관리 메뉴를 조립하고 반응형 너비와 모바일 오버레이 동작을 관리합니다.
 *
 * STEP 1. 모바일 사이드메뉴가 열려 있으면 배경 오버레이를 표시합니다.
 * STEP 2. 사이드메뉴 셸에 반응형 너비와 접힘 클래스를 적용합니다.
 * STEP 3. 화면의 전역 사이드메뉴 순서에 맞춰 탐색 그룹을 렌더링합니다.
 *
 * 헬퍼
 * - 사이드메뉴 하위 모듈은 사이드메뉴의 시각적 섹션을 그대로 반영합니다.
 */

type MainSideMenuProps = {
  monitoringTree: MonitoringTreeNode;
  activeNodeId: string;
  managementMenuItems: ManagementMenuItem[];
  isCollapsed: boolean;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
};

export function MainSideMenu({
  monitoringTree,
  activeNodeId,
  managementMenuItems,
  isCollapsed,
  isMobileOpen,
  onCloseMobile,
}: MainSideMenuProps) {
  return (
    <>
      {isMobileOpen ? (
        <button
          type="button"
          className="MainSideMenu MainSideMenu__button-1 MainSideMenuOverlay absolute inset-0 z-30 bg-black/35 md:hidden"
          aria-label="사이드 메뉴 닫기"
          onClick={onCloseMobile}
        />
      ) : null}

      <aside
        className={cn(
          "MainSideMenu MainSideMenu__panel-1 absolute inset-y-0 left-0 z-40 flex h-full min-h-0 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground shadow-xl transition-[transform,width] duration-200 md:static md:translate-x-0 md:shadow-none",
          isMobileOpen ? "translate-x-0" : "-translate-x-full",
          isCollapsed ? "w-[280px] md:w-[72px]" : "w-[280px]",
        )}
        aria-label="대시보드 사이드 메뉴"
      >
        <div className="MainSideMenu MainSideMenu__container-1 MainSideMenuInner flex h-full min-h-0 flex-col gap-2 overflow-hidden p-2">
          <SideMenuBrand isCollapsed={isCollapsed} />

          <div className="MainSideMenu MainSideMenu__container-2 MainSideMenuSections grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_auto] gap-2">
            <MonitoringTreeSection
              monitoringTree={monitoringTree}
              activeNodeId={activeNodeId}
              isCollapsed={isCollapsed}
            />
            <ManagementMenuSection
              items={managementMenuItems}
              isCollapsed={isCollapsed}
            />
          </div>
        </div>
      </aside>
    </>
  );
}
