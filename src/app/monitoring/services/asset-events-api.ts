import {
  buildCheckLabApiUrl,
  buildCheckLabAssetUrl,
  requestCheckLabJson,
} from "./checklab-api-client";

/**
 * 역할
 * - CheckLab 자산 이벤트 타임라인을 불러오는 API 모듈입니다.
 *
 * 개요
 * - 알림(alerts)과 별개로 센서/엣지/ROI에서 발생한 시스템 이벤트를 가져옵니다.
 * - 백엔드 system_events 테이블의 observed_at/severity/message를 이벤트 타임라인으로 사용합니다.
 * - asset-dashboard-adapter가 알림과 합쳐 시간 역순 AssetEventRecord로 정렬합니다.
 *
 * STEP 1. asset_id 기준 events API를 호출합니다.
 * STEP 2. 좌표, ROI, edge 정보를 이벤트 상세 데이터로 유지합니다.
 * STEP 3. 이벤트 상세 열람 시 markEventRead로 system_events 열람 상태를 저장합니다.
 *
 * 사용처
 * - fetchAssetDashboard가 최신 event_timeline을 합칩니다.
 * - src/app/api/asset-dashboard/[asset_id]/events/route.ts에서 이벤트 목록 프록시로 사용합니다.
 * - src/app/api/asset-dashboard/events/[eventId]/read/route.ts에서 이벤트 열람 처리 프록시로 사용합니다.
 */

/**
 * API
 * - GET /api/v1/assets/{asset_id}/events?limit={limit}
 * - PUT /api/v1/events/{eventId}/read
 *
 * 원천 테이블
 * - system_events, system_event_read_events
 *
 * 사용 컴포넌트
 * - AssetDashboardPage의 EventLogBlindDrawer와 AssetEventLogPanel에서 이벤트 목록/상세로 사용합니다.
 */
export type ApiAssetEventRecord = {
  /** 이벤트를 만든 엣지 설비 ID입니다. 이벤트 상세의 원천 정보로 유지합니다. */
  edge_id?: string | null;
  /** 이벤트 ID입니다. 이벤트 목록 key와 상세 선택 ID로 사용합니다. */
  event_id?: string | null;
  /** 이벤트 종류입니다. 제목과 sourceType 판별에 사용합니다. */
  event_type?: string | null;
  /** 이벤트 메시지입니다. 이벤트 카드와 상세 본문에 표시합니다. */
  message?: string | null;
  /** 이벤트 발생 ISO 시각입니다. 이벤트 시간 표시와 정렬 기준으로 사용합니다. */
  observed_at?: string | null;
  /** 열람 여부입니다. AssetEventLogPanel의 열람/미열람 배지에 사용합니다. */
  is_read?: boolean | null;
  /** 열람 ISO 시각입니다. 이벤트 상세 상태 보존에 사용합니다. */
  read_at?: string | null;
  /** 열람자 ID입니다. 프론트엔드 사용자 ID를 저장하고 이벤트 상태에 반영합니다. */
  read_by?: string | null;
  /** 이벤트가 연결된 ROI ID입니다. 파트 관련 상세 정보로 유지합니다. */
  roi_id?: string | null;
  /** 이벤트 심각도입니다. normal/caution/abnormal 배지 색상에 사용합니다. */
  severity?: string | null;
  /** 이벤트 원천 타입입니다. alert/system 같은 sourceType 보존에 사용합니다. */
  source_type?: string | null;
  /** 이벤트 발생 x 좌표 정규화 값입니다. 카메라/ROI 오버레이와 연결할 수 있도록 유지합니다. */
  x_norm?: number | null;
  /** 이벤트 발생 y 좌표 정규화 값입니다. 카메라/ROI 오버레이와 연결할 수 있도록 유지합니다. */
  y_norm?: number | null;
};

/**
 * 이벤트 열람 API 요청 body
 * - AssetDashboardPage의 FRONTEND_USER_ID가 read_by로 들어갑니다.
 */
export type ApiMarkEventReadRequest = {
  read_by: string;
};

/**
 * API
 * - GET /api/v1/assets/{asset_id}/events?limit={limit}
 *
 * 불러오는 값
 * - system_events 테이블의 자산별 센서/엣지 이벤트 타임라인입니다.
 *
 * 사용 컴포넌트
 * - AssetEventLogPanel의 목록/상세와 AssetDashboardPage의 전역 알림 계산에서 사용합니다.
 */
export async function fetchAssetEvents(
  asset_id: string,
  { limit = 100 }: { limit?: number } = {},
): Promise<ApiAssetEventRecord[]> {
  const url = buildCheckLabAssetUrl(asset_id, "events", { limit });

  return requestCheckLabJson<ApiAssetEventRecord[]>(url, {
    context: { asset_id, limit },
    requestName: "asset events",
  });
}

/**
 * API
 * - PUT /api/v1/events/{eventId}/read
 *
 * 저장하는 값
 * - read_by: 이벤트 상세를 열람 처리한 사용자 ID입니다.
 * - 백엔드는 system_events.read_at/read_by/is_read를 갱신하고
 *   system_event_read_events에 감사 row를 추가합니다.
 *
 * 사용 컴포넌트
 * - AssetEventLogPanel에서 일반 system 이벤트를 열었을 때 AssetDashboardPage.handleEventRead가 호출합니다.
 */
export async function markEventRead(
  eventId: string,
  readBy: string,
): Promise<ApiAssetEventRecord> {
  const url = buildCheckLabApiUrl(
    `api/v1/events/${encodeURIComponent(eventId)}/read`,
  );

  return requestCheckLabJson<ApiAssetEventRecord>(url, {
    body: { read_by: readBy } satisfies ApiMarkEventReadRequest,
    context: { eventId },
    method: "PUT",
    requestName: "event read",
  });
}
