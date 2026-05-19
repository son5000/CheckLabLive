"use client";

import { createContext, useContext } from "react";

import type { DashboardHeaderState } from "@/app/layouts/types";

/**
 * 역할
 * - 하위 대시보드 화면이 헤더 상태를 갱신하기 위한 컨텍스트입니다.
 *
 * 개요
 * - 설비 대시보드는 실시간 데이터와 임계치 설정에 따라 판정이 바뀔 수 있습니다.
 * - 헤더와 본문이 서로 다른 판정을 표시하지 않도록 같은 상태 갱신 경로를 공유합니다.
 *
 * STEP 1. 레이아웃 셸에서 헤더 상태 갱신 함수를 공급합니다.
 * STEP 2. 하위 설비 화면은 계산된 단일 설비 판정을 헤더에 반영합니다.
 *
 * 헬퍼
 * - 공급자가 없는 화면에서는 아무 동작도 하지 않아 기존 화면을 안전하게 유지합니다.
 */

type DashboardHeaderStateContextValue = {
  setHeaderState: (
    nextState:
      | DashboardHeaderState
      | ((currentState: DashboardHeaderState) => DashboardHeaderState),
  ) => void;
};

const DashboardHeaderStateContext = createContext<DashboardHeaderStateContextValue>({
  setHeaderState: () => undefined,
});

export const DashboardHeaderStateProvider = DashboardHeaderStateContext.Provider;

export function useDashboardHeaderStateController() {
  return useContext(DashboardHeaderStateContext);
}
