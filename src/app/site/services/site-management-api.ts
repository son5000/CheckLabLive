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

export type ApiSiteSummary = {
  asset_count: number;
  location_count: number;
  site_id: string;
  site_name: string;
};

export type ApiSiteLocationSummary = {
  asset_count: number;
  display_label: string;
  location_id: string;
  location_name: string;
  parent_location_id: string | null;
  site_id: string;
};

export type ApiSiteLocationDetail = ApiSiteLocationSummary & {
  site_name: string;
};

export type ApiSiteLocationAssetSummary = {
  asset_id: string;
  asset_name: string;
  display_name: string;
  location_id: string;
  location_name: string;
  recent_alert_count: number;
  site_id: string;
  site_name: string;
  status: string;
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

export async function fetchSites(): Promise<ApiSiteSummary[]> {
  const url = buildCheckLabApiUrl("api/v1/site");

  return requestCheckLabJson<ApiSiteSummary[]>(url, {
    method: "GET",
    requestName: "site list",
  });
}

export async function fetchSite(site_id: string): Promise<ApiSiteSummary> {
  const url = buildCheckLabApiUrl(`api/v1/site/${encodeURIComponent(site_id)}`);

  return requestCheckLabJson<ApiSiteSummary>(url, {
    context: { site_id },
    method: "GET",
    requestName: "site detail",
  });
}

export async function fetchSiteLocations(
  site_id: string,
): Promise<ApiSiteLocationSummary[]> {
  const url = buildCheckLabApiUrl(
    `api/v1/site/${encodeURIComponent(site_id)}/location`,
  );

  return requestCheckLabJson<ApiSiteLocationSummary[]>(url, {
    context: { site_id },
    method: "GET",
    requestName: "site location list",
  });
}

export async function fetchSiteLocation(
  site_id: string,
  location_id: string,
): Promise<ApiSiteLocationDetail> {
  const url = buildCheckLabApiUrl(
    `api/v1/site/${encodeURIComponent(site_id)}/location/${encodeURIComponent(location_id)}`,
  );

  return requestCheckLabJson<ApiSiteLocationDetail>(url, {
    context: { location_id, site_id },
    method: "GET",
    requestName: "site location detail",
  });
}

export async function fetchSiteLocationAssets(
  site_id: string,
  location_id: string,
): Promise<ApiSiteLocationAssetSummary[]> {
  const url = buildCheckLabApiUrl(
    `api/v1/site/${encodeURIComponent(site_id)}/location/${encodeURIComponent(location_id)}/assets`,
  );

  return requestCheckLabJson<ApiSiteLocationAssetSummary[]>(url, {
    context: { location_id, site_id },
    method: "GET",
    requestName: "site location asset list",
  });
}

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
