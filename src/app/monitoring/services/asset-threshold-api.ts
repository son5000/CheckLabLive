import type { AssetThresholdConfig } from "@/app/layouts/types";
import {
  buildCheckLabAssetUrl,
  requestCheckLabJson,
} from "./checklab-api-client";

/**
 * 역할
 * - 설비 온도/초음파 임계치를 불러오고 저장하는 API 모듈입니다.
 *
 * 개요
 * - threshold_panel은 대시보드 판정, 파트 판정, 추이 차트 기준선, 임계치 편집 폼의 원본입니다.
 * - 백엔드 asset_thresholds 테이블의 sensor_type/threshold_level 행들이 프론트에서는 warn/critical 필드로 펼쳐져 옵니다.
 * - 백엔드 응답에는 asset_id가 함께 올 수 있어서 요청 asset_id와 다르면 경고 로그를 남깁니다.
 *
 * STEP 1. fetchAssetThresholds가 현재 임계치를 가져옵니다.
 * STEP 2. updateAssetThresholds가 사용자가 저장한 임계치를 PUT으로 반영합니다.
 * STEP 3. toAssetThresholdConfig/toThresholdFallback이 화면에서 쓰는 임계치 형태로 변환합니다.
 *
 * 사용처
 * - fetchAssetDashboard가 dashboard snapshot에 최신 threshold_panel을 합칩니다.
 * - AssetSummaryPanel의 ThresholdEditor, AssetTrendPanel 기준선, AssetPartList 판정에 사용됩니다.
 * - src/app/api/asset-dashboard/[asset_id]/thresholds/route.ts에서 조회/저장 프록시로 사용합니다.
 */

/**
 * API
 * - GET /api/v1/assets/{asset_id}/thresholds
 * - PUT /api/v1/assets/{asset_id}/thresholds
 *
 * 원천 테이블
 * - asset_thresholds
 *
 * 사용 컴포넌트
 * - ThresholdEditor에서 표시/수정하고, AssetDashboardPage가 저장 후 Summary/Trend/AssetPart 상태에 재반영합니다.
 */
export type ApiThresholdPanel = {
  /** 초음파 위험 임계치(dB)입니다. 초과 시 abnormal 판정에 사용합니다. */
  acoustic_critical_db?: number | null;
  /** 초음파 경고 임계치(dB)입니다. 요약 카드, 파트, 추이 기준선에 사용합니다. */
  acoustic_warn_db?: number | null;
  /** 임계치 설정 여부입니다. false면 화면에서 "임계치 미설정" 상태로 처리합니다. */
  is_configured?: boolean | null;
  /** 백엔드가 판단한 확인 필요 여부입니다. 현재 화면 변환에는 직접 쓰지 않습니다. */
  needs_attention?: boolean | null;
  /** 온도 위험 임계치(℃)입니다. 초과 시 abnormal 판정에 사용합니다. */
  temperature_critical_c?: number | null;
  /** 온도 경고 임계치(℃)입니다. 요약 카드, 파트, 추이 기준선에 사용합니다. */
  temperature_warn_c?: number | null;
  /** 임계치 수정 ISO 시각입니다. 현재 화면 변환에는 직접 쓰지 않습니다. */
  updated_at?: string | null;
  /** 임계치 수정자 ID입니다. 저장 요청 이후 상태 추적용으로 유지합니다. */
  updated_by?: string | null;
};

/**
 * 임계치 API 응답
 * - threshold_panel 값에 asset_id가 추가된 형태입니다.
 */
export type ApiAssetThresholdResponse = ApiThresholdPanel & {
  /** 응답이 어느 자산의 임계치인지 확인하기 위한 CheckLab 자산 ID입니다. */
  asset_id?: string | null;
};

/**
 * 임계치 저장 API 요청 body
 * - AssetDashboardPage.toThresholdUpdatePayload가 화면 임계치 값을 이 형태로 바꿉니다.
 */
export type ApiUpdateAssetThresholdsRequest = {
  /** 저장할 초음파 위험 임계치(dB)입니다. */
  acoustic_critical_db: number;
  /** 저장할 초음파 경고 임계치(dB)입니다. */
  acoustic_warn_db: number;
  /** 저장할 온도 위험 임계치(℃)입니다. */
  temperature_critical_c: number;
  /** 저장할 온도 경고 임계치(℃)입니다. */
  temperature_warn_c: number;
  /** 저장자 ID입니다. 현재는 프론트엔드 고정 사용자 ID를 사용합니다. */
  updated_by: string;
};

/**
 * API
 * - GET /api/v1/assets/{asset_id}/thresholds
 *
 * 불러오는 값
 * - asset_thresholds의 temperature/acoustic warn·critical 임계치와 설정 여부입니다.
 *
 * 사용 컴포넌트
 * - ThresholdEditor의 초기값, AssetTrendPanel 기준선, SummaryPanel/AssetPartList 판정 계산에 사용합니다.
 */
export async function fetchAssetThresholds(
  asset_id: string,
): Promise<ApiThresholdPanel> {
  const url = buildCheckLabAssetUrl(asset_id, "thresholds");
  const data = await requestCheckLabJson<ApiAssetThresholdResponse>(url, {
    context: { asset_id },
    requestName: "asset thresholds",
  });

  warnIfAssetMismatch(data.asset_id, asset_id, url);

  return toThresholdPanel(data);
}

/**
 * API
 * - PUT /api/v1/assets/{asset_id}/thresholds
 *
 * 저장하는 값
 * - temperature_warn_c/temperature_critical_c: 온도 경고·위험 임계치입니다.
 * - acoustic_warn_db/acoustic_critical_db: 초음파 경고·위험 임계치입니다.
 * - updated_by: 저장자 ID입니다.
 * - 백엔드는 이 값을 asset_thresholds의 sensor_type, threshold_level별 row로 저장합니다.
 *
 * 사용 컴포넌트
 * - ThresholdEditor 저장 버튼을 누르면 AssetDashboardPage.handleAssetThresholdSave가 호출합니다.
 */
export async function updateAssetThresholds(
  asset_id: string,
  thresholds: ApiUpdateAssetThresholdsRequest,
): Promise<ApiThresholdPanel> {
  const url = buildCheckLabAssetUrl(asset_id, "thresholds");
  const data = await requestCheckLabJson<ApiAssetThresholdResponse>(url, {
    body: thresholds,
    context: { asset_id },
    method: "PUT",
    requestName: "asset thresholds update",
  });

  warnIfAssetMismatch(data.asset_id, asset_id, url);

  return toThresholdPanel(data);
}

/**
 * 역할
 * - 백엔드 threshold_panel을 화면 공통 AssetThresholdConfig로 변환합니다.
 *
 * 사용처
 * - AssetSummaryPanel, AssetCameraPanel, AssetTrendPanel이 같은 임계치 구조를 공유합니다.
 */
export function toAssetThresholdConfig(
  thresholdPanel?: ApiThresholdPanel | null,
): AssetThresholdConfig | null | undefined {
  if (!thresholdPanel) {
    return undefined;
  }

  if (thresholdPanel.is_configured === false) {
    return null;
  }

  const temperature =
    thresholdPanel.temperature_warn_c ?? thresholdPanel.temperature_critical_c;
  const ultrasoundDb =
    thresholdPanel.acoustic_warn_db ?? thresholdPanel.acoustic_critical_db;

  if (!isFiniteNumber(temperature) || !isFiniteNumber(ultrasoundDb)) {
    return undefined;
  }

  return {
    temperature,
    temperatureCritical: toFiniteNumber(thresholdPanel.temperature_critical_c),
    ultrasoundDb,
    ultrasoundCriticalDb: toFiniteNumber(thresholdPanel.acoustic_critical_db),
  };
}

/**
 * 역할
 * - 임계치가 일부만 오거나 미설정인 경우 파트 생성에 쓸 안전한 기본값을 만듭니다.
 */
export function toThresholdFallback(
  thresholdPanel?: ApiThresholdPanel | null,
): AssetThresholdConfig {
  if (!thresholdPanel || thresholdPanel.is_configured === false) {
    return {
      temperature: 0,
      ultrasoundDb: 0,
    };
  }

  return {
    temperature:
      getTemperatureWarningThreshold(thresholdPanel) ??
      thresholdPanel.temperature_critical_c ??
      0,
    temperatureCritical: toFiniteNumber(thresholdPanel.temperature_critical_c),
    ultrasoundDb:
      getAcousticWarningThreshold(thresholdPanel) ??
      thresholdPanel.acoustic_critical_db ??
      0,
    ultrasoundCriticalDb: toFiniteNumber(thresholdPanel.acoustic_critical_db),
  };
}

export function getTemperatureWarningThreshold(
  thresholdPanel?: ApiThresholdPanel | null,
) {
  return toFiniteNumber(thresholdPanel?.temperature_warn_c);
}

export function getAcousticWarningThreshold(
  thresholdPanel?: ApiThresholdPanel | null,
) {
  return toFiniteNumber(thresholdPanel?.acoustic_warn_db);
}

function toThresholdPanel(
  data: ApiAssetThresholdResponse,
): ApiThresholdPanel {
  return {
    acoustic_critical_db: data.acoustic_critical_db,
    acoustic_warn_db: data.acoustic_warn_db,
    is_configured: data.is_configured,
    needs_attention: data.needs_attention,
    temperature_critical_c: data.temperature_critical_c,
    temperature_warn_c: data.temperature_warn_c,
    updated_at: data.updated_at,
    updated_by: data.updated_by,
  };
}

function warnIfAssetMismatch(
  responseAssetId: string | null | undefined,
  asset_id: string,
  url: URL,
) {
  if (!responseAssetId || responseAssetId === asset_id) {
    return;
  }

  console.warn("[CheckLab API] asset thresholds asset mismatch", {
    asset_id,
    responseAssetId,
    url: String(url),
  });
}

function toFiniteNumber(value?: number | null) {
  return isFiniteNumber(value) ? value : undefined;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}
