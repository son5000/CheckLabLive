"use client";

import { createContext, useContext } from "react";

/**
 * 역할
 * - 대시보드 셸 상태를 하위 화면에서 읽기 위한 컨텍스트입니다.
 *
 * 개요
 * - 설비 대시보드는 사이드메뉴 접힘 여부에 따라 레이아웃이 크게 달라집니다.
 * - 페이지 컴포넌트가 상위 셸 상태를 직접 prop으로 전달받지 않아도 되도록 분리합니다.
 *
 * STEP 1. 셸에서 사이드메뉴 접힘/모바일 열림 상태를 공급합니다.
 * STEP 2. 하위 대시보드 화면은 훅으로 필요한 상태만 읽습니다.
 *
 * 헬퍼
 * - 공급자가 없을 때도 기본값을 반환해 기존 화면은 안전하게 동작합니다.
 */

type DashboardShellState = {
  isSidebarCollapsed: boolean;
  isMobileSidebarOpen: boolean;
};

const DashboardShellStateContext = createContext<DashboardShellState>({
  isSidebarCollapsed: false,
  isMobileSidebarOpen: false,
});

export const DashboardShellStateProvider = DashboardShellStateContext.Provider;

export function useDashboardShellState() {
  return useContext(DashboardShellStateContext);
}
