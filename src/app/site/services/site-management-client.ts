import type {
  ApiCreateAssetRequest,
  ApiCreateLocationRequest,
  ApiCreateSiteRequest,
  ApiSiteManagementResponse,
  ApiUpdateAssetRequest,
  ApiUpdateLocationRequest,
  ApiUpdateSiteRequest,
} from "./site-management-api";

type ProxyMutationOptions = {
  body?: unknown;
  method: "DELETE" | "POST" | "PUT";
  requestName: string;
};

export async function createSite(
  payload: ApiCreateSiteRequest,
): Promise<ApiSiteManagementResponse> {
  return requestProxyJson("/api/v1/site", {
    body: payload,
    method: "POST",
    requestName: "site create",
  });
}

export async function updateSite(
  site_id: string,
  payload: ApiUpdateSiteRequest,
): Promise<ApiSiteManagementResponse> {
  return requestProxyJson(`/api/v1/site/${encodeURIComponent(site_id)}`, {
    body: payload,
    method: "PUT",
    requestName: "site update",
  });
}

export async function deleteSite(
  site_id: string,
): Promise<ApiSiteManagementResponse> {
  return requestProxyJson(`/api/v1/site/${encodeURIComponent(site_id)}`, {
    method: "DELETE",
    requestName: "site delete",
  });
}

export async function createLocation(
  payload: ApiCreateLocationRequest,
): Promise<ApiSiteManagementResponse> {
  return requestProxyJson("/api/v1/location", {
    body: payload,
    method: "POST",
    requestName: "location create",
  });
}

export async function updateLocation(
  location_id: string,
  payload: ApiUpdateLocationRequest,
): Promise<ApiSiteManagementResponse> {
  return requestProxyJson(`/api/v1/location/${encodeURIComponent(location_id)}`, {
    body: payload,
    method: "PUT",
    requestName: "location update",
  });
}

export async function deleteLocation(
  location_id: string,
): Promise<ApiSiteManagementResponse> {
  return requestProxyJson(`/api/v1/location/${encodeURIComponent(location_id)}`, {
    method: "DELETE",
    requestName: "location delete",
  });
}

export async function createAsset(
  payload: ApiCreateAssetRequest,
): Promise<ApiSiteManagementResponse> {
  return requestProxyJson("/api/v1/asset", {
    body: payload,
    method: "POST",
    requestName: "asset create",
  });
}

export async function updateAsset(
  asset_id: string,
  payload: ApiUpdateAssetRequest,
): Promise<ApiSiteManagementResponse> {
  return requestProxyJson(`/api/v1/asset/${encodeURIComponent(asset_id)}`, {
    body: payload,
    method: "PUT",
    requestName: "asset update",
  });
}

export async function deleteAsset(
  asset_id: string,
): Promise<ApiSiteManagementResponse> {
  return requestProxyJson(`/api/v1/asset/${encodeURIComponent(asset_id)}`, {
    method: "DELETE",
    requestName: "asset delete",
  });
}

async function requestProxyJson<T>(
  path: string,
  { body, method, requestName }: ProxyMutationOptions,
): Promise<T> {
  const response = await fetch(path, {
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
    headers: {
      accept: "application/json",
      ...(body === undefined ? {} : { "content-type": "application/json" }),
    },
    method,
  });

  const responseText = await response.text();
  const contentType = response.headers.get("content-type") ?? "";
  const data = responseText
    ? contentType.includes("application/json")
      ? JSON.parse(responseText)
      : responseText
    : null;

  if (!response.ok) {
    const message =
      isErrorBody(data) && data.message
        ? data.message
        : `${requestName} failed.`;

    throw new Error(message);
  }

  return data as T;
}

function isErrorBody(value: unknown): value is { message?: string } {
  return typeof value === "object" && value !== null && "message" in value;
}
