import type { ApiAlertRecord } from "./asset-alerts-api";
import { fetchAssetAlerts } from "./asset-alerts-api";
import type { ApiAssetEventRecord } from "./asset-events-api";
import { fetchAssetEvents } from "./asset-events-api";
import type { ApiThresholdPanel } from "./asset-threshold-api";
import { fetchAssetThresholds } from "./asset-threshold-api";
import {
  buildCheckLabAssetUrl,
  requestCheckLabJson,
} from "./checklab-api-client";

/**
 * 역할
 * - 설비 상세 대시보드가 처음 필요한 CheckLab 원본 데이터를 한 번에 모으는 API 모듈입니다.
 *
 * 개요
 * - mock-dashboard API에서 헤더, 카메라, 요약 카드, 파트, 추이 차트, 기본 이벤트를 가져옵니다.
 * - thresholds, alerts, events API는 별도로 다시 불러와 mock-dashboard에 부족한 최신 값을 덮어씁니다.
 * - 백엔드 원천 테이블과 화면 영역 매핑은 mock-dashboard-table-map.ts에 구조화해 둡니다.
 * - 응답은 asset-dashboard-adapter에서 화면용 AssetDashboardRemoteSnapshot으로 변환됩니다.
 *
 * STEP 1. 화면 라우트에서 받은 asset_id로 자산 대시보드 snapshot을 호출합니다.
 * STEP 2. 보조 API를 병렬 호출해 최신 임계치, 알림, 이벤트를 합칩니다.
 * STEP 3. 실패한 보조 API는 기존 snapshot 값을 유지해서 대시보드 전체가 깨지지 않게 합니다.
 *
 * 사용처
 * - src/app/site/[site_id]/location/[locationId]/asset/[asset_id]/page.tsx에서 첫 화면 데이터를 만듭니다.
 * - src/app/api/asset-dashboard/[asset_id]/route.ts에서 클라이언트 5초 갱신용 프록시로 사용합니다.
 */

export type ApiDashboardStatus =
  | "normal"
  | "caution"
  | "warning"
  | "danger"
  | "critical"
  | "error"
  | string;

/**
 * API
 * - GET /api/v1/assets/{asset_id}/mock-dashboard
 *
 * 불러오는 값
 * - header: 설비명, 위치, 현재 판정, 수집 시각입니다.
 * - camera: 라이브 카메라 스트림 정보입니다.
 * - summary_cards: 온도/초음파 KPI 카드 값입니다.
 * - monitored_parts: CheckLab이 알고 있는 파트별 현재 값입니다.
 * - threshold_panel: 설비 온도/초음파 임계치입니다.
 * - trend_charts: 온도/초음파 시간대별 추이입니다.
 * - alerts, event_timeline, recent_events: 이벤트 로그에 표시할 알림/이벤트입니다.
 *
 * 원천 테이블
 * - sites, assets, asset_displays, metric_card_configs, asset_parts,
 *   asset_thresholds, observations, roi_values, system_events, alerts를 FastAPI가 집계합니다.
 *
 * 사용 컴포넌트
 * - AssetDashboardPage가 remoteDashboard로 받아서 AssetStatusTitlePanel,
 *   AssetCameraPanel, AssetSummaryPanel, AssetTrendPanel, AssetEventLogPanel에 나눠 전달합니다.
 */
export type AssetDashboardApiResponse = {
  /** CheckLab 자산 ID입니다. 화면 snapshot의 기준 키로 사용합니다. */
  asset_id: string;
  /** 임계치 초과 알림 목록입니다. AssetEventLogPanel과 전역 알림에 사용합니다. */
  alerts?: ApiAlertRecord[];
  /** 카메라 ID, 이름, 스트림 상태/URL입니다. AssetCameraPanel에서 사용합니다. */
  camera?: ApiCameraPanel | null;
  /** 센서/엣지 이벤트 타임라인입니다. AssetEventLogPanel 상세와 좌표 표시용으로 사용합니다. */
  event_timeline?: ApiAssetEventRecord[];
  /** 대시보드 상단 상태/시간/위치 정보입니다. AssetStatusTitlePanel과 DashboardHeader에서 사용합니다. */
  header?: ApiDashboardHeader | null;
  /** 백엔드 파트별 현재 측정값입니다. AssetCameraPanel, AssetPartList, SummaryPanel에서 사용합니다. */
  monitored_parts?: ApiMonitoredPart[];
  /** legacy API 호환 필드입니다. 신규 백엔드는 monitored_parts를 우선 사용합니다. */
  monitored_regions?: ApiMonitoredPart[];
  /** alerts/event_timeline API가 없을 때 쓰는 기본 이벤트 목록입니다. AssetEventLogPanel에서 사용합니다. */
  recent_events?: ApiRecentEvent[];
  /** 평균/최대/최소 온도, 초음파 평균/피크 같은 요약 카드 값입니다. AssetSummaryPanel에서 사용합니다. */
  summary_cards?: ApiSummaryCard[];
  /** 설비 임계치 설정입니다. ThresholdEditor, 추이 기준선, 판정 계산에 사용합니다. */
  threshold_panel?: ApiThresholdPanel | null;
  /** 온도/초음파 차트 포인트와 선택 기간입니다. AssetTrendPanel에서 사용합니다. */
  trend_charts?: ApiTrendChart[];
};

/**
 * 상단 헤더 API 값
 * - 설비 제목, 위치, 현재 상태 판정, 이벤트 판정, 수집 시각을 담습니다.
 * - sites/assets가 상위 문맥과 설비 master를 제공하고 asset_displays가 breadcrumb/location_label을 제공합니다.
 * - alerts와 system_events는 현재 상태와 알림 요약 문맥에 관여합니다.
 * - AssetStatusTitlePanel, HeaderStatusSummary, HeaderClock에서 최종적으로 보입니다.
 */
export type ApiDashboardHeader = {
  /** 설비 표시명입니다. AssetStatusTitlePanel의 큰 제목과 서버 page의 asset.name 보정에 사용합니다. */
  asset_name?: string | null;
  /** "공정 > 위치 > 설비" 형태의 경로 문자열입니다. DashboardHeader의 선택 경로로 변환됩니다. */
  breadcrumb?: string | null;
  /** 백엔드가 내려주는 현재 시간 텍스트입니다. HeaderClock과 최근 수집 시각에 사용합니다. */
  current_time_text?: string | null;
  /** 최신 이벤트 기준 판정 라벨입니다. AssetStatusTitlePanel의 실시간 이벤트 판정에 사용합니다. */
  event_judgment_label?: string | null;
  /** ISO 수집 시각입니다. current_time_text가 없을 때 최근 수집 시각 fallback으로 사용합니다. */
  latest_updated_at?: string | null;
  /** 위치 표시 라벨입니다. AssetStatusTitlePanel의 상단 작은 텍스트에 사용합니다. */
  location_label?: string | null;
  /** 설비 전체 상태 코드입니다. DashboardHeader 상태 색상과 설비 판정 계산에 사용합니다. */
  overall_status?: ApiDashboardStatus | null;
  /** 설비 전체 상태 표시 라벨입니다. "정상/요주의/이상" 같은 화면 문구로 사용합니다. */
  overall_status_label?: string | null;
  /** 최근 미해결 알림 수입니다. HeaderStatusSummary와 이벤트 핸들 카운트 계산에 사용합니다. */
  recent_alert_count?: number | null;
  /** 백엔드 기준 날짜 텍스트입니다. HeaderClock 날짜 override로 사용합니다. */
  reference_date_text?: string | null;
};

/**
 * 요약 카드 API 값
 * - 카드 ID/제목으로 온도 평균, 온도 범위, 초음파 평균, 초음파 피크 카드를 찾습니다.
 * - metric_card_configs가 카드 라벨과 표시 설정을 제공하고 observations/roi_values가 실제 수치를 제공합니다.
 * - asset_thresholds는 카드에 표시할 임계치 문맥으로 함께 집계됩니다.
 * - AssetSummaryPanel의 TemperatureMetricCard, UltrasoundMetricCard에 전달되는 KPI 원천입니다.
 */
export type ApiSummaryCard = {
  /** 카드 강조색 힌트입니다. 현재 adapter에서는 직접 쓰지 않고 백엔드 원본 계약으로 유지합니다. */
  accent?: string | null;
  /** 카드 식별자입니다. avg-temperature, avg-acoustic, thermal-range, peak-acoustic 판별에 사용합니다. */
  card_id?: string | null;
  /** 카드의 대표 숫자입니다. 평균 온도, 초음파 평균, 온도 최소값 등에 사용합니다. */
  display_value?: number | null;
  /** 카드 하단 설명 문구입니다. 현재 화면 변환에는 직접 쓰지 않습니다. */
  footer_label?: string | null;
  /** 게이지 보조 라벨입니다. 현재 화면 변환에는 직접 쓰지 않습니다. */
  gauge_label?: string | null;
  /** 제한/임계 설명 라벨입니다. 현재 화면 변환에는 직접 쓰지 않습니다. */
  limit_label?: string | null;
  /** 카드 최대값 fallback입니다. 온도 최대값 또는 초음파 피크 fallback으로 사용합니다. */
  max_value?: number | null;
  /** 카드 최소값 fallback입니다. 온도 최소값 fallback으로 사용합니다. */
  min_value?: number | null;
  /** 대표값 앞에 붙는 접두어입니다. 현재 화면 변환에는 직접 쓰지 않습니다. */
  primary_prefix?: string | null;
  /** 보조값 앞에 붙는 접두어입니다. 현재 화면 변환에는 직접 쓰지 않습니다. */
  secondary_prefix?: string | null;
  /** 보조값 단위입니다. 현재 화면 변환에는 직접 쓰지 않습니다. */
  secondary_unit?: string | null;
  /** 보조 숫자입니다. 온도 범위 카드의 최대 온도 우선값으로 사용합니다. */
  secondary_value?: number | null;
  /** 카드 상태 라벨입니다. 현재 화면 변환에는 직접 쓰지 않습니다. */
  status_label?: string | null;
  /** 카드 요약 문구입니다. 초음파 검출 개수와 주파수 대역 파싱에 사용합니다. */
  summary_label?: string | null;
  /** 임계치 모드 라벨입니다. 현재 화면 변환에는 직접 쓰지 않습니다. */
  threshold_mode_label?: string | null;
  /** 카드 임계치 숫자입니다. 현재 화면 변환에는 직접 쓰지 않고 threshold_panel을 우선 사용합니다. */
  threshold_value?: number | null;
  /** 카드 제목입니다. card_id가 불명확할 때 카드 종류 판별 fallback으로 사용합니다. */
  title?: string | null;
  /** 카드 톤 힌트입니다. 현재 화면 변환에는 직접 쓰지 않습니다. */
  tone?: string | null;
  /** 증감/추이 라벨입니다. 현재 화면 변환에는 직접 쓰지 않습니다. */
  trend_label?: string | null;
  /** 증감률입니다. 현재 화면 변환에는 직접 쓰지 않습니다. */
  trend_percent?: number | null;
  /** 대표값 단위입니다. 현재 화면 변환에는 직접 쓰지 않고 화면 컴포넌트의 고정 단위를 사용합니다. */
  unit?: string | null;
};

/**
 * 추이 차트 API 값
 * - chart_id/title/metric_label로 온도 차트와 초음파 차트를 구분합니다.
 * - observations는 acoustic chart, roi_values는 thermal chart의 실제 시계열 원천입니다.
 * - asset_displays는 차트 제목, asset_thresholds는 임계 기준선을 제공합니다.
 * - AssetTrendPanel과 AssetCombinedTrendChart의 라인 데이터/임계 기준선으로 사용합니다.
 */
export type ApiTrendChart = {
  /** 백엔드에서 선택 가능한 기간 목록입니다. 현재 화면은 로컬 assetTrendRanges를 우선 사용합니다. */
  available_windows?: string[];
  /** 기간 평균값입니다. 현재 화면 변환에는 직접 쓰지 않고 points를 차트에 사용합니다. */
  average_value?: number | null;
  /** 차트 식별자입니다. acoustic/ultrasound/thermal/temperature 판별에 사용합니다. */
  chart_id?: string | null;
  /** 현재값입니다. 현재 화면 변환에는 직접 쓰지 않고 points의 마지막 값을 사용합니다. */
  current_value?: number | null;
  /** 지표 라벨입니다. 임계 기준선 라벨과 차트 종류 판별에 사용합니다. */
  metric_label?: string | null;
  /** 시간대별 측정 포인트입니다. TrendPoint 배열로 변환되어 AssetTrendPanel에 전달됩니다. */
  points?: ApiTrendPoint[];
  /** 선택된 기간 ID입니다. AssetTrendPanel의 활성 기간 동기화에 사용합니다. */
  selected_window?: string | null;
  /** 차트 자체 임계값입니다. threshold_panel 값이 없을 때 기준선 fallback으로 사용합니다. */
  threshold_value?: number | null;
  /** 차트 제목입니다. chart_id가 불명확할 때 차트 종류/기준선 라벨 판별에 사용합니다. */
  title?: string | null;
  /** 차트 단위입니다. 현재 화면 변환에는 직접 쓰지 않고 화면 컴포넌트의 고정 단위를 사용합니다. */
  unit?: string | null;
};

/**
 * 추이 포인트 API 값
 * - observations.value 또는 roi_values avg/min/max 집계값이 value로 내려옵니다.
 * - observed_at이 있으면 실제 수집 시각 라벨로 쓰고, 없으면 offset_seconds/선택 구간 기준 상대 라벨을 씁니다.
 */
export type ApiTrendPoint = {
  /** 임계치 초과 여부입니다. 현재 화면 판정은 threshold_panel 기준으로 다시 계산합니다. */
  exceeds_threshold?: boolean;
  /** 강조 포인트 여부입니다. 현재 화면 변환에는 직접 쓰지 않습니다. */
  highlighted?: boolean;
  /** 현재 시점 기준 offset 초입니다. 현재 화면은 selected_window와 index로 라벨을 다시 만듭니다. */
  offset_seconds?: number | null;
  /** observations/roi_values의 수집 ISO 시각입니다. 있으면 차트 x축 라벨 후보로 사용합니다. */
  observed_at?: string | null;
  /** 실제 측정값입니다. 온도/초음파 차트의 average/max/min 값으로 변환됩니다. */
  value?: number | null;
};

/**
 * 카메라 API 값
 * - camera_name은 asset_displays의 화면 표시 메타데이터에서 옵니다.
 * - AssetCameraPanel의 라이브 스트림 선택/상태 표시 원천입니다.
 */
export type ApiCameraPanel = {
  /** 카메라 ID입니다. 카메라 탭/선택 상태의 key로 사용합니다. */
  camera_id?: string | null;
  /** 카메라 표시명입니다. AssetCameraPanel의 라벨로 사용합니다. */
  camera_name?: string | null;
  /** 스트림 안내/오류 메시지입니다. AssetCameraPanel의 비디오 상태 문구에 사용합니다. */
  stream_message?: string | null;
  /** live, idle, error 같은 스트림 상태입니다. AssetCameraPanel의 표시 상태에 사용합니다. */
  stream_state?: string | null;
  /** 실제 스트림 URL입니다. AssetCameraPanel의 영상 소스로 사용합니다. */
  stream_url?: string | null;
};

/**
 * 파트 API 값
 * - CheckLab이 내려준 센서 파트를 화면의 AssetPartConfig/AssetPartStatus로 바꿉니다.
 * - asset_parts가 파트 이름/센서 타입/단위를 정의하고 observations/roi_values가 현재값을 제공합니다.
 * - AssetCameraPanel의 오버레이, AssetPartList, SummaryPanel의 감지 데이터 카드에서 사용합니다.
 */
export type ApiMonitoredPart = {
  /** 현재 측정값입니다. thermal이면 온도, acoustic이면 초음파 피크값으로 해석합니다. */
  display_value?: number | null;
  /** 파트 표시명입니다. AssetPartList와 감지 데이터 카드에서 사용합니다. */
  label?: string | null;
  /** 파트 메모입니다. 현재 화면 변환에는 직접 쓰지 않습니다. */
  note?: string | null;
  /** 신규 파트 ID입니다. 파트 선택/상태 매칭 key로 사용합니다. */
  part_id?: string | null;
  /** legacy 파트 ID입니다. 기존 monitored_regions 응답 호환용으로만 사용합니다. */
  region_id?: string | null;
  /** 센서 종류입니다. thermal은 온도 파트, acoustic은 초음파 파트로 분기합니다. */
  sensor_type?: "thermal" | "acoustic" | string | null;
  /** asset_parts.source_metric입니다. 현재 화면 변환에는 직접 쓰지 않지만 백엔드 추적용으로 보존합니다. */
  source_metric?: string | null;
  /** 백엔드 판정 라벨입니다. 임계치 숫자가 부족할 때 파트 판정 fallback으로 사용합니다. */
  status_label?: string | null;
  /** 파트별 임계값입니다. 파트의 온도/초음파 임계치에 반영합니다. */
  threshold_value?: number | null;
  /** 측정 단위입니다. 현재 화면 변환에는 직접 쓰지 않고 sensor_type 기준 단위를 사용합니다. */
  unit?: string | null;
};

/**
 * 기본 이벤트 API 값
 * - alerts/event_timeline API가 따로 없을 때 이벤트 로그를 채우는 fallback 데이터입니다.
 * - system_events와 alerts가 상단 상태 문맥과 이벤트 목록의 원천입니다.
 * - AssetEventLogPanel, EventLogBlindDrawer, 전역 알림 계산에 사용합니다.
 */
export type ApiRecentEvent = {
  /** 이벤트 ID입니다. 이벤트 목록 key와 상세 선택 ID로 사용합니다. */
  event_id?: string | null;
  /** 이벤트 종류입니다. alert 여부를 판별해서 source를 정합니다. */
  event_type?: string | null;
  /** 이벤트 상세 메시지입니다. AssetEventLogPanel 카드/상세 본문에 표시합니다. */
  message?: string | null;
  /** 이벤트 발생 ISO 시각입니다. occurredAt/정렬 기준으로 사용합니다. */
  observed_at?: string | null;
  /** normal/caution/abnormal 같은 심각도입니다. 이벤트 배지 색상에 사용합니다. */
  severity?: string | null;
  /** alert/system 같은 원천 타입입니다. 이벤트 sourceType과 제목 판별에 사용합니다. */
  source_type?: string | null;
};

/**
 * API
 * - GET /api/v1/assets/{asset_id}/mock-dashboard
 * - GET /api/v1/assets/{asset_id}/thresholds
 * - GET /api/v1/alerts?asset_id={asset_id}&limit=20
 * - GET /api/v1/assets/{asset_id}/events?limit=100
 *
 * 불러오는 값
 * - 대시보드 기본 snapshot에 최신 임계치, 알림, 이벤트 타임라인을 합칩니다.
 *
 * 사용 컴포넌트
 * - AssetDashboardPage가 서버 초기값과 클라이언트 갱신값으로 사용합니다.
 */
export async function fetchAssetDashboard(
  asset_id: string,
): Promise<AssetDashboardApiResponse> {
  const [dashboard, thresholdPanel, alerts, eventTimeline] = await Promise.all([
    fetchAssetDashboardSnapshot(asset_id),
    fetchAssetThresholds(asset_id).catch((error) => {
      console.warn("[CheckLab API] asset thresholds unavailable", {
        asset_id,
        error,
      });

      return null;
    }),
    fetchAssetAlerts(asset_id).catch((error) => {
      console.warn("[CheckLab API] asset alerts unavailable", {
        asset_id,
        error,
      });

      return null;
    }),
    fetchAssetEvents(asset_id).catch((error) => {
      console.warn("[CheckLab API] asset events unavailable", {
        asset_id,
        error,
      });

      return null;
    }),
  ]);

  return {
    ...dashboard,
    alerts: alerts ?? dashboard.alerts,
    event_timeline: eventTimeline ?? dashboard.event_timeline,
    threshold_panel: thresholdPanel
      ? {
          ...dashboard.threshold_panel,
          ...thresholdPanel,
        }
      : dashboard.threshold_panel,
  };
}

async function fetchAssetDashboardSnapshot(
  asset_id: string,
): Promise<AssetDashboardApiResponse> {
  return requestCheckLabJson<AssetDashboardApiResponse>(
    buildCheckLabAssetUrl(asset_id, "mock-dashboard"),
    {
      context: { asset_id },
      requestName: "asset dashboard",
    },
  );
}
