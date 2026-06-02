import type { DashboardStatus } from "@/app/layouts/types";
import type {
  ApiCreateAssetRequest,
  ApiCreateLocationRequest,
  ApiCreateSiteRequest,
  ApiSiteSummary,
  ApiUpdateAssetRequest,
  ApiUpdateLocationRequest,
  ApiUpdateSiteRequest,
} from "@/app/site/services/site-management-api";

export type SiteBuilderSite = {
  alertCount: number;
  description: string;
  assetCount: number;
  imageUrl?: string;
  locationCount: number;
  locations: SiteBuilderLocation[];
  name: string;
  site_id: string;
  status: DashboardStatus;
};

export type SiteBuilderLocation = {
  assets: SiteBuilderAsset[];
  floor: string;
  imageUrl?: string;
  location_id: string;
  name: string;
  status: DashboardStatus;
  summary: string;
};

export type SiteBuilderAsset = {
  asset_code: string;
  asset_id: string;
  description: string;
  imageUrl?: string;
  manager: string;
  name: string;
  status: DashboardStatus;
  type: string;
};

export type SiteEditorStep = "site" | "location" | "asset";

export type SiteApiMessage = {
  tone: "error" | "success";
  text: string;
};

export type SiteMutationAction =
  | "asset-delete"
  | "asset-save"
  | "location-delete"
  | "location-save"
  | "site-delete"
  | "site-save";

export const SITE_BUILDER_STORAGE_KEY = "checklab:site-builder-sites";

export const emptySite: SiteBuilderSite = {
  alertCount: 0,
  description: "",
  assetCount: 0,
  locationCount: 0,
  locations: [],
  name: "",
  site_id: "",
  status: "normal",
};

export const emptyLocation: SiteBuilderLocation = {
  assets: [],
  floor: "",
  location_id: "",
  name: "",
  status: "normal",
  summary: "",
};

export const emptyAsset: SiteBuilderAsset = {
  asset_code: "",
  asset_id: "",
  description: "",
  manager: "",
  name: "",
  status: "normal",
  type: "",
};

export const statusOptions: { label: string; value: DashboardStatus }[] = [
  { label: "정상", value: "normal" },
  { label: "요주의", value: "caution" },
  { label: "경고", value: "warning" },
  { label: "이상", value: "danger" },
  { label: "오류", value: "error" },
];

export const EMPTY_INITIAL_SITES: ApiSiteSummary[] = [];

export function getItemAt<T>(items: T[] | undefined, index: number | undefined) {
  return index === undefined ? undefined : items?.[index];
}

export function toSiteBuilderSite(site: ApiSiteSummary): SiteBuilderSite {
  return {
    alertCount: 0,
    assetCount: site.asset_count,
    description: "",
    locationCount: site.location_count,
    locations: [],
    name: site.site_name,
    site_id: site.site_id,
    status: "normal",
  };
}

export function normalizeSite(site: SiteBuilderSite): SiteBuilderSite {
  return recalculateSiteCounts({
    ...site,
    description: site.description.trim(),
    imageUrl: site.imageUrl?.trim() || undefined,
    locations: Array.isArray(site.locations)
      ? site.locations.map(normalizeLocation)
      : [],
    name: site.name.trim(),
    site_id: site.site_id.trim(),
  });
}

export function normalizeLocation(
  location: SiteBuilderLocation,
): SiteBuilderLocation {
  return {
    ...location,
    assets: Array.isArray(location.assets)
      ? location.assets.map(normalizeAsset)
      : [],
    floor: location.floor.trim(),
    imageUrl: location.imageUrl?.trim() || undefined,
    location_id: location.location_id.trim(),
    name: location.name.trim(),
    summary: location.summary.trim(),
  };
}

export function normalizeAsset(asset: SiteBuilderAsset): SiteBuilderAsset {
  return {
    ...asset,
    asset_id: asset.asset_id.trim(),
    asset_code: asset.asset_code.trim(),
    description: asset.description?.trim() ?? "",
    imageUrl: asset.imageUrl?.trim() || undefined,
    manager: asset.manager.trim(),
    name: asset.name.trim(),
    type: asset.type.trim(),
  };
}

export function toCreateSitePayload(
  site: SiteBuilderSite,
): ApiCreateSiteRequest {
  const locations = site.locations
    .map(toCreateSiteLocationPayload)
    .filter((location) => location.name.trim().length > 0);

  return {
    description: site.description,
    ...(locations.length ? { locations } : {}),
    process_name: site.name,
  };
}

function toCreateSiteLocationPayload(
  location: SiteBuilderLocation,
): NonNullable<ApiCreateSiteRequest["locations"]>[number] {
  const assets = location.assets
    .map(toCreateSiteAssetPayload)
    .filter((asset) => asset.name.trim().length > 0);

  return {
    ...(assets.length ? { assets } : {}),
    description: location.summary,
    floor: location.floor,
    name: location.name,
  };
}

function toCreateSiteAssetPayload(
  asset: SiteBuilderAsset,
): NonNullable<
  NonNullable<ApiCreateSiteRequest["locations"]>[number]["assets"]
>[number] {
  return {
    description: asset.description,
    name: asset.name,
  };
}

export function toUpdateSitePayload(
  site: SiteBuilderSite,
): ApiUpdateSiteRequest {
  return {
    description: site.description,
    process_name: site.name,
  };
}

export function toCreateLocationPayload(
  site_id: string,
  location: SiteBuilderLocation,
): ApiCreateLocationRequest {
  return {
    description: location.summary,
    floor: location.floor,
    name: location.name,
    site_id,
  };
}

export function toUpdateLocationPayload(
  location: SiteBuilderLocation,
): ApiUpdateLocationRequest {
  return {
    description: location.summary,
    floor: location.floor,
    name: location.name,
  };
}

export function toCreateAssetPayload(
  location_id: string,
  asset: SiteBuilderAsset,
): ApiCreateAssetRequest {
  return {
    description: asset.description,
    location_id,
    name: asset.name,
  };
}

export function toUpdateAssetPayload(
  asset: SiteBuilderAsset,
): ApiUpdateAssetRequest {
  return {
    description: asset.description,
    name: asset.name,
  };
}

export function applySiteResponse(
  fallbackSite: SiteBuilderSite,
  response: unknown,
): SiteBuilderSite {
  const record = toResponseRecord(
    response,
    ["site", "process"],
    ["site_id", "process_id", "id"],
  );
  const responseLocations = readRecordArray(record, "locations");
  const locations = responseLocations
    ? responseLocations.map((location, index) =>
        applyLocationResponse(
          fallbackSite.locations[index] ?? emptyLocation,
          location,
        ),
      )
    : fallbackSite.locations;

  return recalculateSiteCounts({
    ...fallbackSite,
    description:
      readRecordString(record, ["description", "summary"]) ??
      fallbackSite.description,
    locations,
    name:
      readRecordString(record, ["process_name", "name"]) ?? fallbackSite.name,
    site_id:
      readRecordString(record, ["site_id", "process_id", "id"]) ??
      fallbackSite.site_id,
  });
}

export function applyLocationResponse(
  fallbackLocation: SiteBuilderLocation,
  response: unknown,
): SiteBuilderLocation {
  const record = toResponseRecord(
    response,
    ["location"],
    ["location_id", "id"],
  );
  const responseAssets = readRecordArray(record, "assets");
  const assets = responseAssets
    ? responseAssets.map((asset, index) =>
        applyAssetResponse(fallbackLocation.assets[index] ?? emptyAsset, asset),
      )
    : fallbackLocation.assets;

  return {
    ...fallbackLocation,
    assets,
    floor: readRecordString(record, ["floor"]) ?? fallbackLocation.floor,
    location_id:
      readRecordString(record, ["location_id", "id"]) ??
      fallbackLocation.location_id,
    name: readRecordString(record, ["name"]) ?? fallbackLocation.name,
    status: readRecordStatus(record) ?? fallbackLocation.status,
    summary:
      readRecordString(record, ["description", "summary"]) ??
      fallbackLocation.summary,
  };
}

export function applyAssetResponse(
  fallbackAsset: SiteBuilderAsset,
  response: unknown,
): SiteBuilderAsset {
  const record = toResponseRecord(
    response,
    ["asset"],
    ["asset_id", "id"],
  );

  return {
    ...fallbackAsset,
    asset_code:
      readRecordString(record, ["asset_code", "assetCode"]) ??
      fallbackAsset.asset_code,
    asset_id:
      readRecordString(record, ["asset_id", "id"]) ?? fallbackAsset.asset_id,
    description:
      readRecordString(record, ["description", "summary"]) ??
      fallbackAsset.description,
    manager:
      readRecordString(record, ["manager", "manager_name"]) ??
      fallbackAsset.manager,
    name: readRecordString(record, ["name"]) ?? fallbackAsset.name,
    status: readRecordStatus(record) ?? fallbackAsset.status,
    type:
      readRecordString(record, ["type", "asset_type"]) ?? fallbackAsset.type,
  };
}

export function recalculateSiteCounts(site: SiteBuilderSite): SiteBuilderSite {
  return {
    ...site,
    assetCount: site.locations.reduce(
      (count, loc) => count + loc.assets.length,
      0,
    ),
    locationCount: site.locations.length,
  };
}

export function getApiErrorMessage(error: unknown, fallbackMessage: string) {
  return error instanceof Error && error.message
    ? error.message
    : fallbackMessage;
}

export function readStoredSites() {
  try {
    const storedValue = window.localStorage.getItem(SITE_BUILDER_STORAGE_KEY);
    if (!storedValue) return [];
    const parsedValue = JSON.parse(storedValue) as SiteBuilderSite[];
    return Array.isArray(parsedValue) ? parsedValue.map(normalizeSite) : [];
  } catch (error) {
    console.warn("Failed to read site builder storage.", error);
    return [];
  }
}

function toResponseRecord(
  value: unknown,
  nestedKeys: string[] = [],
  entityKeys: string[] = [],
) {
  const record = toPlainRecord(value);
  if (!record) return undefined;
  if (hasAnyRecordKey(record, entityKeys)) return record;

  const directNestedRecord = findNestedRecord(record, nestedKeys);
  if (directNestedRecord) return directNestedRecord;

  const wrappedRecord = findNestedRecord(record, ["data", "result"]);
  if (!wrappedRecord) return record;

  return findNestedRecord(wrappedRecord, nestedKeys) ?? wrappedRecord;
}

function toPlainRecord(value: unknown) {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : undefined;
}

function findNestedRecord(
  record: Record<string, unknown>,
  keys: string[],
) {
  for (const key of keys) {
    const nestedRecord = toPlainRecord(record[key]);
    if (nestedRecord) return nestedRecord;
  }

  return undefined;
}

function hasAnyRecordKey(
  record: Record<string, unknown>,
  keys: string[],
) {
  return keys.some((key) => record[key] !== undefined && record[key] !== null);
}

function readRecordArray(
  record: Record<string, unknown> | undefined,
  key: string,
) {
  const value = record?.[key];

  return Array.isArray(value) ? value : undefined;
}

function readRecordString(
  record: Record<string, unknown> | undefined,
  keys: string[],
) {
  for (const key of keys) {
    const value = record?.[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return undefined;
}

function readRecordStatus(record: Record<string, unknown> | undefined) {
  const status = readRecordString(record, ["status", "dashboard_status"]);

  return isDashboardStatus(status) ? status : undefined;
}

function isDashboardStatus(value: string | undefined): value is DashboardStatus {
  return Boolean(value && statusOptions.some((option) => option.value === value));
}
