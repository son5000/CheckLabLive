import {
  buildCheckLabApiUrl,
  requestCheckLabJson,
} from "./checklab-api-client";

/**
 * 역할
 * - 설비별 CheckLab 알림 목록을 불러오고, 알림 열람 상태를 저장하는 API 모듈입니다.
 *
 * 개요
 * - 알림 목록은 대시보드 이벤트 로그와 전역 알림 배지의 원본이 됩니다.
 * - 열람 처리는 이벤트 상세를 열었을 때 "미열람 → 열람" 상태를 백엔드에 반영합니다.
 * - 알림 본문/현재 열람 상태는 alerts, 열람 감사 이력은 alert_read_events에 저장됩니다.
 *
 * STEP 1. fetchAssetAlerts가 asset_id 기준 알림 목록을 가져옵니다.
 * STEP 2. asset-dashboard-adapter가 알림을 AssetEventRecord로 변환합니다.
 * STEP 3. markAlertRead/markAlertsRead가 사용자가 확인한 알림의 read_by/read_at 값을 갱신합니다.
 * STEP 4. fetchAlertSummary/fetchActiveAlerts가 전역 알림과 헤더 카운터를 가볍게 갱신합니다.
 *
 * 사용처
 * - fetchAssetDashboard가 최신 alerts를 합쳐 AssetEventLogPanel에 전달합니다.
 * - src/app/api/asset-dashboard/[asset_id]/alerts/route.ts에서 알림 목록 프록시로 사용합니다.
 * - src/app/api/asset-dashboard/alerts/[alertId]/read/route.ts에서 열람 처리 프록시로 사용합니다.
 */

/**
 * API
 * - GET /api/v1/alerts?asset_id={asset_id}&limit={limit}
 * - GET /api/v1/alerts/summary?asset_id={asset_id}&is_read=false
 * - PUT /api/v1/alerts/{alertId}/read
 * - PUT /api/v1/alerts/read
 * - POST /api/v1/alert-suppressions
 *
 * 원천 테이블
 * - alerts, alert_read_events
 *
 * 사용 컴포넌트
 * - AssetDashboardPage의 EventLogBlindDrawer, AssetEventLogPanel, 전역 알림 목록에서 사용합니다.
 */
export type ApiAlertRecord = {
  /** 알림 ID입니다. 이벤트 key, 상세 선택, 열람 처리 대상 ID로 사용합니다. */
  alert_id?: string | null;
  /** 알림이 속한 CheckLab 자산 ID입니다. 로그 context와 이벤트 원천 표시에 사용합니다. */
  asset_id?: string | null;
  /** 알림 생성 ISO 시각입니다. 이벤트 발생 시각과 정렬 기준으로 사용합니다. */
  created_at?: string | null;
  /** 열람 여부입니다. AssetEventLogPanel의 열람/미열람 배지에 사용합니다. */
  is_read?: boolean | null;
  /** 알림 메시지입니다. 이벤트 카드와 상세 본문에 표시합니다. */
  message?: string | null;
  /** 열람 ISO 시각입니다. 이벤트 상세 상태 보존에 사용합니다. */
  read_at?: string | null;
  /** 열람자 ID입니다. 프론트엔드 사용자 ID를 저장하고 이벤트 상태에 반영합니다. */
  read_by?: string | null;
  /** 알림 심각도입니다. normal/caution/abnormal 배지 색상과 전역 알림 등급에 사용합니다. */
  severity?: string | null;
  asset_name?: string | null;
  dashboard_href?: string | null;
  dashboard_status?: string | null;
  location_label?: string | null;
};

export type ApiAlertSummary = {
  /** 조건에 맞는 전체 알림 수입니다. */
  total_count?: number | null;
  /** 미열람 알림 수입니다. HeaderStatusSummary와 글로벌 알림 배지에 사용합니다. */
  unread_count?: number | null;
  /** 정상/정보성 알림 수입니다. 필요 시 통계 표시에 사용합니다. */
  normal_count?: number | null;
  /** 요주의 알림 수입니다. */
  caution_count?: number | null;
  /** 경고 알림 수입니다. */
  warning_count?: number | null;
  /** 이상/위험 알림 수입니다. */
  abnormal_count?: number | null;
  /** 가장 최근 알림 생성 시각입니다. 헤더 최신 알림 문맥에 사용합니다. */
  latest_created_at?: string | null;
};

/**
 * 알림 열람 API 요청 body
 * - AssetDashboardPage의 FRONTEND_USER_ID가 read_by로 들어갑니다.
 */
export type ApiMarkAlertReadRequest = {
  read_by: string;
};

/**
 * 알림 일괄 열람 API 요청 body
 * - alert_ids가 있으면 지정 알림만, asset_id가 있으면 해당 설비의 미열람 알림을 처리합니다.
 */
export type ApiMarkAlertsReadRequest = {
  alert_ids?: string[];
  asset_id?: string;
  only_unread?: boolean;
  read_by: string;
};

export type ApiMarkAlertsReadResponse = {
  alerts?: ApiAlertRecord[];
  read_at?: string | null;
  read_by?: string | null;
  updated_count: number;
};

/**
 * 알림 억제 요청 body
 * - 같은 설비에서 짧은 시간 반복되는 글로벌 알럿을 서버 기준으로 잠시 숨길 때 사용합니다.
 */
export type ApiCreateAlertSuppressionRequest = {
  asset_id: string;
  duration_seconds: number;
  reason?: string;
  suppressed_by: string;
};

export type ApiAlertSuppressionRecord = {
  asset_id?: string | null;
  created_at?: string | null;
  duration_seconds?: number | null;
  reason?: string | null;
  suppression_id?: string | null;
  suppressed_by?: string | null;
  suppressed_until?: string | null;
};

export async function fetchAlerts({
  asset_id,
  isRead,
  limit = 20,
  severity,
}: {
  asset_id?: string;
  isRead?: boolean;
  limit?: number;
  severity?: string[];
} = {}): Promise<ApiAlertRecord[]> {
  const url = buildCheckLabApiUrl("api/v1/alerts", {
    asset_id: asset_id,
    is_read: isRead,
    limit,
    severity: severity?.length ? severity.join(",") : undefined,
  });

  return requestCheckLabJson<ApiAlertRecord[]>(url, {
    context: { asset_id, isRead, limit, severity },
    requestName: asset_id ? "asset alerts" : "global alerts",
  });
}

/**
 * API
 * - GET /api/v1/alerts?asset_id={asset_id}&limit={limit}
 *
 * 불러오는 값
 * - alerts 테이블의 설비 기준 최신 알림 목록입니다.
 *
 * 사용 컴포넌트
 * - AssetEventLogPanel의 이벤트 목록과 HeaderStatusSummary의 미해결 알림 수 계산에 사용합니다.
 */
export async function fetchAssetAlerts(
  asset_id: string,
  { limit = 20 }: { limit?: number } = {},
): Promise<ApiAlertRecord[]> {
  return fetchAlerts({ asset_id, limit });
}

/**
 * API
 * - GET /api/v1/alerts?is_read=false&limit={limit}
 *
 * 불러오는 값
 * - 글로벌 알럿에 필요한 미열람 알림 목록입니다.
 *
 * 사용 컴포넌트
 * - useGlobalAlertMonitor가 폴링할 때 전체 알림 대신 활성 알림만 받도록 백엔드가 지원해야 하는 API입니다.
 */
export async function fetchActiveAlerts({
  asset_id,
  limit = 100,
}: {
  asset_id?: string;
  limit?: number;
} = {}): Promise<ApiAlertRecord[]> {
  return fetchAlerts({ asset_id, isRead: false, limit });
}

/**
 * API
 * - GET /api/v1/alerts/summary?asset_id={asset_id}&is_read={isRead}
 *
 * 불러오는 값
 * - 미열람/등급별 알림 수와 최신 알림 시각입니다.
 *
 * 사용 컴포넌트
 * - HeaderStatusSummary, 글로벌 알림 배지, 설비 목록 카운터에서 목록 전체를 받지 않고 카운트만 쓸 때 사용합니다.
 */
export async function fetchAlertSummary({
  asset_id,
  isRead,
}: {
  asset_id?: string;
  isRead?: boolean;
} = {}): Promise<ApiAlertSummary> {
  const url = buildCheckLabApiUrl("api/v1/alerts/summary", {
    asset_id: asset_id,
    is_read: isRead,
  });

  return requestCheckLabJson<ApiAlertSummary>(url, {
    context: { asset_id, isRead },
    requestName: asset_id ? "asset alert summary" : "global alert summary",
  });
}

/**
 * API
 * - PUT /api/v1/alerts/{alertId}/read
 *
 * 저장하는 값
 * - read_by: 열람 처리한 사용자 ID입니다.
 * - 백엔드는 alerts.read_at/read_by를 갱신하고 alert_read_events에 감사 row를 추가합니다.
 *
 * 사용 컴포넌트
 * - AssetEventLogPanel에서 알림 이벤트를 열었을 때 AssetDashboardPage.handleEventRead가 호출합니다.
 */
export async function markAlertRead(
  alertId: string,
  readBy: string,
): Promise<ApiAlertRecord> {
  const url = buildCheckLabApiUrl(
    `api/v1/alerts/${encodeURIComponent(alertId)}/read`,
  );

  return requestCheckLabJson<ApiAlertRecord>(url, {
    body: { read_by: readBy } satisfies ApiMarkAlertReadRequest,
    context: { alertId },
    method: "PUT",
    requestName: "alert read",
  });
}

/**
 * API
 * - PUT /api/v1/alerts/read
 *
 * 저장하는 값
 * - alert_ids: 지정 알림들을 열람 처리합니다.
 * - asset_id: 지정 설비의 알림들을 열람 처리합니다.
 * - read_by/read_at: 백엔드가 alerts와 alert_read_events에 반영합니다.
 *
 * 사용 컴포넌트
 * - 사용자가 설비 상세를 보고 조치에 들어간 뒤, 같은 설비의 미열람 알림을 한 번에 열람 처리할 때 사용합니다.
 */
export async function markAlertsRead(
  request: ApiMarkAlertsReadRequest,
): Promise<ApiMarkAlertsReadResponse> {
  const url = buildCheckLabApiUrl("api/v1/alerts/read");

  return requestCheckLabJson<ApiMarkAlertsReadResponse>(url, {
    body: {
      only_unread: true,
      ...request,
    } satisfies ApiMarkAlertsReadRequest,
    context: {
      alertCount: request.alert_ids?.length,
      asset_id: request.asset_id,
      onlyUnread: request.only_unread ?? true,
    },
    method: "PUT",
    requestName: "bulk alert read",
  });
}

/**
 * API
 * - POST /api/v1/alert-suppressions
 *
 * 저장하는 값
 * - asset_id/suppressed_by/suppressed_until/reason을 alert_suppressions에 저장합니다.
 *
 * 사용 컴포넌트
 * - 글로벌 알럿을 열람한 뒤 같은 설비 반복 알림을 몇 분간 서버 기준으로 숨길 때 사용합니다.
 */
export async function createAlertSuppression(
  request: ApiCreateAlertSuppressionRequest,
): Promise<ApiAlertSuppressionRecord> {
  const url = buildCheckLabApiUrl("api/v1/alert-suppressions");

  return requestCheckLabJson<ApiAlertSuppressionRecord>(url, {
    body: request,
    context: {
      asset_id: request.asset_id,
      durationSeconds: request.duration_seconds,
      suppressedBy: request.suppressed_by,
    },
    method: "POST",
    requestName: "alert suppression",
  });
}
