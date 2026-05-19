import type { DashboardHeaderState, DashboardNotification } from "@/app/layouts/types";

/**
 * 역할
 * - 대시보드 셸에서 사용하는 샘플 데이터입니다.
 *
 * 개요
 * - 백엔드 연동 전까지 헤더와 글로벌 알림은 이 모듈의 데이터를 사용합니다.
 *
 * STEP 1. 헤더에 필요한 선택 위치와 설비 요약을 제공합니다.
 * STEP 2. 최신 표시 우선순위에 맞춘 글로벌 알림을 제공합니다.
 *
 * 헬퍼
 * - 서버 데이터가 들어오면 이 파일을 셸 기본값의 어댑터 경계로 유지합니다.
 */

export const dashboardHeaderState: DashboardHeaderState = {
  selectedPath: ["압축 공정", "전기실", "배전반 1호기"],
  assetStatus: "normal",
  assetStatusLabel: "정상",
  unresolvedAlarmCount: 0,
  lastCollectedAt: "19:32:10",
  userName: "관제 관리자",
};

export const dashboardNotifications: DashboardNotification[] = [];
