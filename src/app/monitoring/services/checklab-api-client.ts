const DEFAULT_CHECKLAB_API_BASE_URL = "http://192.168.219.46:8000";

const DEFAULT_CHECKLAB_API_TIMEOUT_MS = 3_000;

/**
 * 역할
 * - CheckLab 백엔드 API를 호출할 때 공통으로 쓰는 URL/JSON 요청 클라이언트입니다.
 *
 * 개요
 * - CHECKLAB_API_BASE_URL → NEXT_PUBLIC_CHECKLAB_API_BASE_URL → 기본 IP 순서로 서버 주소를 결정합니다.
 * - query 값은 null/undefined를 제외하고 URLSearchParams로 붙입니다.
 * - 모든 요청은 no-store JSON 요청으로 보내고, 성공/실패 로그에는 requestName과 context를 남깁니다.
 *
 * STEP 1. buildCheckLabApiUrl로 api/v1/... 같은 일반 API 경로를 만듭니다.
 * STEP 2. buildCheckLabAssetUrl로 api/v1/assets/{asset_id}/... 자산 하위 API 경로를 만듭니다.
 * STEP 3. requestCheckLabJson으로 GET/POST/PUT JSON 응답을 타입에 맞춰 반환합니다.
 *
 * 사용처
 * - asset-dashboard-api, asset-threshold-api, asset-alerts-api, asset-events-api에서 CheckLab 원 API 호출 전에 사용합니다.
 */

type QueryValue = boolean | number | string | null | undefined;

type CheckLabJsonRequestOptions = {
  body?: unknown;
  context?: Record<string, unknown>;
  method?: "DELETE" | "GET" | "POST" | "PUT";
  requestName: string;
  timeoutMs?: number;
};

export function buildCheckLabApiUrl(
  path: string,
  query?: Record<string, QueryValue>,
) {
  const baseUrl =
    process.env.CHECKLAB_API_BASE_URL ??
    process.env.NEXT_PUBLIC_CHECKLAB_API_BASE_URL ??
    DEFAULT_CHECKLAB_API_BASE_URL;
  const normalizedBaseUrl = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  const url = new URL(path.replace(/^\/+/, ""), normalizedBaseUrl);

  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value === null || value === undefined) {
      return;
    }

    url.searchParams.set(key, String(value));
  });

  return url;
}

export function buildCheckLabAssetUrl(
  asset_id: string,
  assetPath: string,
  query?: Record<string, QueryValue>,
) {
  return buildCheckLabApiUrl(
    `api/v1/assets/${encodeURIComponent(asset_id)}/${assetPath.replace(/^\/+/, "")}`,
    query,
  );
}

export async function requestCheckLabJson<T>(
  url: URL,
  {
    body,
    context,
    method = "GET",
    requestName,
    timeoutMs = DEFAULT_CHECKLAB_API_TIMEOUT_MS,
  }: CheckLabJsonRequestOptions,
): Promise<T> {
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), timeoutMs);
  let response: Response;

  try {
    response = await fetch(url, {
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
      headers: {
        accept: "application/json",
        ...(body === undefined ? {} : { "content-type": "application/json" }),
      },
      method,
      signal: abortController.signal,
    });
  } catch (error) {
    console.error(`[CheckLab API] ${requestName} request unavailable`, {
      ...context,
      error,
      timeoutMs,
      url: String(url),
    });

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    console.error(`[CheckLab API] ${requestName} failed`, {
      ...context,
      status: response.status,
      statusText: response.statusText,
      url: String(url),
    });

    throw new Error(
      `${requestName} request failed: ${response.status} ${response.statusText}`,
    );
  }

  const responseText = await response.text();
  const contentType = response.headers.get("content-type") ?? "";
  const data = (
    responseText
      ? contentType.includes("application/json")
        ? JSON.parse(responseText)
        : responseText
      : null
  ) as T;

  console.info(`[CheckLab API] ${requestName} success`, {
    ...context,
    status: response.status,
    url: String(url),
  });

  return data;
}
