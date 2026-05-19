import {
  buildCheckLabApiUrl,
  requestCheckLabJson,
} from "@/app/monitoring/services/checklab-api-client";

export type ApiCreateSiteAssetRequest = {
  description?: string;
  name: string;
};

export type ApiCreateSiteLocationRequest = {
  assets?: ApiCreateSiteAssetRequest[];
  description?: string;
  floor?: string;
  name: string;
};

export type ApiCreateSiteRequest = {
  description?: string;
  locations?: ApiCreateSiteLocationRequest[];
  process_name: string;
};

export type ApiUpdateSiteRequest = {
  description?: string;
  process_name: string;
};

export type ApiCreateLocationRequest = {
  description?: string;
  floor?: string;
  name: string;
  site_id: string;
};

export type ApiUpdateLocationRequest = {
  description?: string;
  floor?: string;
  name: string;
};

export type ApiCreateAssetRequest = {
  description?: string;
  location_id: string;
  name: string;
};

export type ApiUpdateAssetRequest = {
  description?: string;
  name: string;
};

export type ApiSiteManagementResponse = Record<string, unknown> | null;

export async function createSite(
  payload: ApiCreateSiteRequest,
): Promise<ApiSiteManagementResponse> {
  const url = buildCheckLabApiUrl("api/v1/site");

  return requestCheckLabJson<ApiSiteManagementResponse>(url, {
    body: payload,
    context: {
      locationCount: payload.locations?.length ?? 0,
      process_name: payload.process_name,
    },
    method: "POST",
    requestName: "site create",
  });
}

export async function updateSite(
  site_id: string,
  payload: ApiUpdateSiteRequest,
): Promise<ApiSiteManagementResponse> {
  const url = buildCheckLabApiUrl(`api/v1/site/${encodeURIComponent(site_id)}`);

  return requestCheckLabJson<ApiSiteManagementResponse>(url, {
    body: payload,
    context: { process_name: payload.process_name, site_id },
    method: "PUT",
    requestName: "site update",
  });
}

export async function deleteSite(
  site_id: string,
): Promise<ApiSiteManagementResponse> {
  const url = buildCheckLabApiUrl(`api/v1/site/${encodeURIComponent(site_id)}`);

  return requestCheckLabJson<ApiSiteManagementResponse>(url, {
    context: { site_id },
    method: "DELETE",
    requestName: "site delete",
  });
}

export async function createLocation(
  payload: ApiCreateLocationRequest,
): Promise<ApiSiteManagementResponse> {
  const url = buildCheckLabApiUrl("api/v1/location");

  return requestCheckLabJson<ApiSiteManagementResponse>(url, {
    body: payload,
    context: { name: payload.name, site_id: payload.site_id },
    method: "POST",
    requestName: "location create",
  });
}

export async function updateLocation(
  location_id: string,
  payload: ApiUpdateLocationRequest,
): Promise<ApiSiteManagementResponse> {
  const url = buildCheckLabApiUrl(
    `api/v1/location/${encodeURIComponent(location_id)}`,
  );

  return requestCheckLabJson<ApiSiteManagementResponse>(url, {
    body: payload,
    context: { location_id, name: payload.name },
    method: "PUT",
    requestName: "location update",
  });
}

export async function deleteLocation(
  location_id: string,
): Promise<ApiSiteManagementResponse> {
  const url = buildCheckLabApiUrl(
    `api/v1/location/${encodeURIComponent(location_id)}`,
  );

  return requestCheckLabJson<ApiSiteManagementResponse>(url, {
    context: { location_id },
    method: "DELETE",
    requestName: "location delete",
  });
}

export async function createAsset(
  payload: ApiCreateAssetRequest,
): Promise<ApiSiteManagementResponse> {
  const url = buildCheckLabApiUrl("api/v1/asset");

  return requestCheckLabJson<ApiSiteManagementResponse>(url, {
    body: payload,
    context: { location_id: payload.location_id, name: payload.name },
    method: "POST",
    requestName: "asset create",
  });
}

export async function updateAsset(
  asset_id: string,
  payload: ApiUpdateAssetRequest,
): Promise<ApiSiteManagementResponse> {
  const url = buildCheckLabApiUrl(`api/v1/asset/${encodeURIComponent(asset_id)}`);

  return requestCheckLabJson<ApiSiteManagementResponse>(url, {
    body: payload,
    context: { asset_id, name: payload.name },
    method: "PUT",
    requestName: "asset update",
  });
}

export async function deleteAsset(
  asset_id: string,
): Promise<ApiSiteManagementResponse> {
  const url = buildCheckLabApiUrl(`api/v1/asset/${encodeURIComponent(asset_id)}`);

  return requestCheckLabJson<ApiSiteManagementResponse>(url, {
    context: { asset_id },
    method: "DELETE",
    requestName: "asset delete",
  });
}
