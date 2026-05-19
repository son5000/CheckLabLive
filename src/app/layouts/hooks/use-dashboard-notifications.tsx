import { createContext, useContext } from "react";

import type { DashboardNotification } from "@/app/layouts/types";

/**
 * 역할
 * - 하위 대시보드 화면이 글로벌 알림 스택을 갱신하기 위한 컨텍스트입니다.
 *
 * 개요
 * - 설비 페이지처럼 자체 이벤트를 계산하는 화면이 레이아웃 알림 영역과 동기화할 수 있게 합니다.
 */

type DashboardNotificationsController = {
  setNotifications: (notifications: DashboardNotification[]) => void;
};

const DashboardNotificationsContext =
  createContext<DashboardNotificationsController | null>(null);

export const DashboardNotificationsProvider = DashboardNotificationsContext.Provider;

export function useDashboardNotificationsController() {
  const context = useContext(DashboardNotificationsContext);

  if (!context) {
    throw new Error(
      "useDashboardNotificationsController must be used within DashboardNotificationsProvider",
    );
  }

  return context;
}
