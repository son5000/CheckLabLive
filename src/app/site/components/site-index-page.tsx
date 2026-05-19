"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Cpu,
  Factory,
  Image as ImageIcon,
  MapPin,
  Pencil,
  Plus,
  Save,
  SkipForward,
  Trash2,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";

import { dashboardStatusClassName } from "@/app/layouts/constants/status-styles";
import type { DashboardStatus } from "@/app/layouts/types";
import {
  createAsset as createManagedAsset,
  createLocation as createManagedLocation,
  createSite as createManagedSite,
  deleteAsset as deleteManagedAsset,
  deleteLocation as deleteManagedLocation,
  deleteSite as deleteManagedSite,
  updateAsset as updateManagedAsset,
  updateLocation as updateManagedLocation,
  updateSite as updateManagedSite,
} from "@/app/site/services/site-management-client";
import type {
  ApiCreateAssetRequest,
  ApiCreateLocationRequest,
  ApiCreateSiteRequest,
  ApiSiteManagementResponse,
  ApiUpdateAssetRequest,
  ApiUpdateLocationRequest,
  ApiUpdateSiteRequest,
} from "@/app/site/services/site-management-api";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type SiteBuilderSite = {
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

type SiteBuilderLocation = {
  assets: SiteBuilderAsset[];
  floor: string;
  imageUrl?: string;
  location_id: string;
  name: string;
  status: DashboardStatus;
  summary: string;
};

type SiteBuilderAsset = {
  asset_code: string;
  asset_id: string;
  description: string;
  imageUrl?: string;
  manager: string;
  name: string;
  status: DashboardStatus;
  type: string;
};

// "site" → 공정 등록, "location" → 위치 등록, "asset" → 설비 등록
type SiteEditorStep = "site" | "location" | "asset";
type SiteApiMessage = {
  tone: "error" | "success";
  text: string;
};
type SiteMutationAction =
  | "asset-delete"
  | "asset-save"
  | "location-delete"
  | "location-save"
  | "site-delete"
  | "site-save";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const SITE_BUILDER_STORAGE_KEY = "checklab:site-builder-sites";

const emptySite: SiteBuilderSite = {
  alertCount: 0,
  description: "",
  assetCount: 0,
  locationCount: 0,
  locations: [],
  name: "",
  site_id: "",
  status: "normal",
};

const emptyLocation: SiteBuilderLocation = {
  assets: [],
  floor: "",
  location_id: "",
  name: "",
  status: "normal",
  summary: "",
};

const emptyAsset: SiteBuilderAsset = {
  asset_code: "",
  asset_id: "",
  description: "",
  manager: "",
  name: "",
  status: "normal",
  type: "",
};

const statusOptions: { label: string; value: DashboardStatus }[] = [
  { label: "정상", value: "normal" },
  { label: "요주의", value: "caution" },
  { label: "경고", value: "warning" },
  { label: "이상", value: "danger" },
  { label: "오류", value: "error" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export function SiteIndexPage() {
  const [sites, setSites] = useState<SiteBuilderSite[]>([]);
  const [hasLoadedStoredSites, setHasLoadedStoredSites] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [activeSiteIndex, setActiveSiteIndex] = useState<number>();
  const [activeLocationIndex, setActiveLocationIndex] = useState<number>();
  const [editorStep, setEditorStep] = useState<SiteEditorStep>("site");
  const [draftSite, setDraftSite] = useState<SiteBuilderSite>(emptySite);
  const [draftLocation, setDraftLocation] = useState<SiteBuilderLocation>(emptyLocation);
  const [draftAsset, setDraftAsset] = useState<SiteBuilderAsset>(emptyAsset);
  const [editingAssetId, setEditingAssetId] = useState<string>();
  const [pendingAction, setPendingAction] = useState<SiteMutationAction>();
  const [apiMessage, setApiMessage] = useState<SiteApiMessage>();

  // 트리 펼침 상태: site_id → boolean
  const [expandedSites, setExpandedSites] = useState<Record<string, boolean>>({});
  // location 트리 펼침 상태: location_id → boolean
  const [expandedLocations, setExpandedLocations] = useState<Record<string, boolean>>({});

  const activeSite = getItemAt(sites, activeSiteIndex);
  const activeLocation = getItemAt(activeSite?.locations, activeLocationIndex);
  const isMutating = Boolean(pendingAction);

  const canSaveSite = Boolean(draftSite.site_id.trim() && draftSite.name.trim());
  const canSaveLocation = Boolean(
    activeSite && draftLocation.location_id.trim() && draftLocation.name.trim(),
  );
  const canSaveAsset = Boolean(
    activeSite &&
      activeLocation &&
      draftAsset.asset_id.trim() &&
      draftAsset.name.trim(),
  );

  const totals = useMemo(
    () =>
      sites.reduce(
        (currentTotals, site) => ({
          alerts: currentTotals.alerts + site.alertCount,
          assets:
            currentTotals.assets +
            site.locations.reduce((count, loc) => count + loc.assets.length, 0),
          locations: currentTotals.locations + site.locations.length,
          sites: currentTotals.sites + 1,
        }),
        { alerts: 0, assets: 0, locations: 0, sites: 0 },
      ),
    [sites],
  );

  // ── Storage ──────────────────────────────────────────────────────────────

  useEffect(() => {
    const storedSites = readStoredSites();
    if (storedSites.length) {
      setSites(storedSites);
      setActiveSiteIndex(0);
      setDraftSite(storedSites[0]);
    }
    setHasLoadedStoredSites(true);
  }, []);

  useEffect(() => {
    if (!hasLoadedStoredSites) return;
    window.localStorage.setItem(SITE_BUILDER_STORAGE_KEY, JSON.stringify(sites));
  }, [hasLoadedStoredSites, sites]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const runMutation = async <T,>(
    action: SiteMutationAction,
    failureMessage: string,
    mutation: () => Promise<T>,
  ) => {
    setPendingAction(action);
    setApiMessage(undefined);

    try {
      return await mutation();
    } catch (error) {
      setApiMessage({
        tone: "error",
        text: getApiErrorMessage(error, failureMessage),
      });
      return undefined;
    } finally {
      setPendingAction(undefined);
    }
  };

  const showSuccessMessage = (text: string) => {
    setApiMessage({ tone: "success", text });
  };

  const handleStartSite = () => {
    setIsEditorOpen(true);
    setActiveSiteIndex(undefined);
    setActiveLocationIndex(undefined);
    setDraftSite(emptySite);
    setDraftLocation(emptyLocation);
    setDraftAsset(emptyAsset);
    setEditingAssetId(undefined);
    setEditorStep("site");
  };

  const handleSelectSite = (siteIndex: number) => {
    const nextSite = sites[siteIndex];
    setIsEditorOpen(true);
    setActiveSiteIndex(siteIndex);
    setActiveLocationIndex(nextSite.locations.length ? 0 : undefined);
    setDraftSite(nextSite);
    setDraftLocation(nextSite.locations[0] ?? emptyLocation);
    setDraftAsset(emptyAsset);
    setEditingAssetId(undefined);
    setEditorStep("site");
  };

  const handleSaveSite = async () => {
    if (isMutating) return;

    const nextSite = normalizeSite(draftSite);
    const duplicateIndex = sites.findIndex(
      (site, index) => site.site_id === nextSite.site_id && index !== activeSiteIndex,
    );
    if (duplicateIndex >= 0) return;

    const currentSite = getItemAt(sites, activeSiteIndex);
    const response = await runMutation<ApiSiteManagementResponse>(
      "site-save",
      "공정 저장에 실패했습니다.",
      () =>
        currentSite
          ? updateManagedSite(
              currentSite.site_id,
              toUpdateSitePayload(nextSite),
            )
          : createManagedSite(toCreateSitePayload(nextSite)),
    );

    if (response === undefined) {
      return;
    }

    const savedSite = currentSite
      ? recalculateSiteCounts({
          ...applySiteResponse(nextSite, response),
          locations: currentSite.locations,
        })
      : applySiteResponse(nextSite, response);

    if (activeSiteIndex === undefined) {
      const nextSiteIndex = sites.length;
      setSites((prev) => [...prev, savedSite]);
      setActiveSiteIndex(nextSiteIndex);
      // 새 공정 트리 자동 펼치기
      setExpandedSites((prev) => ({ ...prev, [savedSite.site_id]: true }));
    } else {
      setSites((prev) =>
        prev.map((site, index) =>
          index === activeSiteIndex
            ? savedSite
            : site,
        ),
      );
    }
    setDraftSite(savedSite);
    showSuccessMessage(
      activeSiteIndex === undefined
        ? "공정이 생성되었습니다."
        : "공정이 수정되었습니다.",
    );
    setEditorStep("location");
  };

  const handleSaveLocation = async () => {
    if (activeSiteIndex === undefined || !activeSite || isMutating) return;

    const nextLocation = normalizeLocation(draftLocation);
    const currentLocations = sites[activeSiteIndex]?.locations ?? [];
    const duplicateIndex = currentLocations.findIndex(
      (loc, index) =>
        loc.location_id === nextLocation.location_id && index !== activeLocationIndex,
    );
    if (duplicateIndex >= 0) return;

    const currentLocation = getItemAt(currentLocations, activeLocationIndex);
    const response = await runMutation<ApiSiteManagementResponse>(
      "location-save",
      "위치 저장에 실패했습니다.",
      () =>
        currentLocation
          ? updateManagedLocation(
              currentLocation.location_id,
              toUpdateLocationPayload(nextLocation),
            )
          : createManagedLocation(
              toCreateLocationPayload(activeSite.site_id, nextLocation),
            ),
    );

    if (response === undefined) {
      return;
    }

    const savedLocation = currentLocation
      ? {
          ...applyLocationResponse(nextLocation, response),
          assets: currentLocation.assets,
        }
      : applyLocationResponse(nextLocation, response);
    const nextLocationIndex =
      activeLocationIndex === undefined ? currentLocations.length : activeLocationIndex;

    setSites((prev) =>
      prev.map((site, siteIndex) => {
        if (siteIndex !== activeSiteIndex) return site;
        if (activeLocationIndex === undefined) {
          return recalculateSiteCounts({
            ...site,
            locations: [...site.locations, savedLocation],
          });
        }
        return recalculateSiteCounts({
          ...site,
          locations: site.locations.map((loc, locIndex) =>
            locIndex === activeLocationIndex
              ? savedLocation
              : loc,
          ),
        });
      }),
    );
    setActiveLocationIndex(nextLocationIndex);
    setDraftLocation(savedLocation);
    setDraftAsset(emptyAsset);
    setEditingAssetId(undefined);
    // 새 위치 트리 자동 펼치기
    setExpandedLocations((prev) => ({
      ...prev,
      [savedLocation.location_id]: true,
    }));
    showSuccessMessage(
      currentLocation ? "위치가 수정되었습니다." : "위치가 생성되었습니다.",
    );
    setEditorStep("asset");
  };

  const handleSaveAsset = async () => {
    if (
      activeSiteIndex === undefined ||
      activeLocationIndex === undefined ||
      !activeLocation ||
      isMutating
    ) {
      return;
    }

    const nextAsset = normalizeAsset(draftAsset);
    const response = await runMutation<ApiSiteManagementResponse>(
      "asset-save",
      "설비 저장에 실패했습니다.",
      () =>
        editingAssetId
          ? updateManagedAsset(editingAssetId, toUpdateAssetPayload(nextAsset))
          : createManagedAsset(
              toCreateAssetPayload(activeLocation.location_id, nextAsset),
            ),
    );

    if (response === undefined) {
      return;
    }

    const savedAsset = applyAssetResponse(nextAsset, response);

    setSites((prev) =>
      prev.map((site, siteIndex) => {
        if (siteIndex !== activeSiteIndex) return site;
        return recalculateSiteCounts({
          ...site,
          locations: site.locations.map((loc, locIndex) => {
            if (locIndex !== activeLocationIndex) return loc;
            const hasSameAsset = loc.assets.some(
              (assetItem) =>
                assetItem.asset_id === (editingAssetId ?? savedAsset.asset_id),
            );
            return {
              ...loc,
              assets: hasSameAsset
                ? loc.assets.map((assetItem) =>
                    assetItem.asset_id === (editingAssetId ?? savedAsset.asset_id)
                      ? savedAsset
                      : assetItem,
                  )
                : [...loc.assets, savedAsset],
            };
          }),
        });
      }),
    );
    setDraftAsset(emptyAsset);
    setEditingAssetId(undefined);
    showSuccessMessage(
      editingAssetId ? "설비가 수정되었습니다." : "설비가 생성되었습니다.",
    );
  };

  const handleSelectLocation = (
    locationIndex: number,
    siteIndex = activeSiteIndex,
  ) => {
    const targetSite = getItemAt(sites, siteIndex);
    const nextLocation = targetSite?.locations[locationIndex];
    if (siteIndex !== undefined) {
      setActiveSiteIndex(siteIndex);
      setDraftSite(targetSite ?? emptySite);
    }
    setActiveLocationIndex(locationIndex);
    setDraftLocation(nextLocation ?? emptyLocation);
    setDraftAsset(emptyAsset);
    setEditingAssetId(undefined);
    setEditorStep("asset");
  };

  const handleStartLocation = () => {
    setActiveLocationIndex(undefined);
    setDraftLocation(emptyLocation);
    setDraftAsset(emptyAsset);
    setEditingAssetId(undefined);
    setEditorStep("location");
  };

  const handleStartAsset = () => {
    setDraftAsset(emptyAsset);
    setEditingAssetId(undefined);
  };

  const handleEditAsset = (asset: SiteBuilderAsset) => {
    setDraftAsset(normalizeAsset(asset));
    setEditingAssetId(asset.asset_id);
  };

  const handleRemoveSite = async (siteIndex: number) => {
    const site = sites[siteIndex];
    if (!site || isMutating) return;

    const response = await runMutation<ApiSiteManagementResponse>(
      "site-delete",
      "공정 삭제에 실패했습니다.",
      () => deleteManagedSite(site.site_id),
    );

    if (response === undefined) {
      return;
    }

    setSites((prev) => prev.filter((_, index) => index !== siteIndex));
    if (activeSiteIndex === siteIndex) {
      setIsEditorOpen(false);
      setActiveSiteIndex(undefined);
      setActiveLocationIndex(undefined);
      setEditorStep("site");
    }
    showSuccessMessage("공정이 삭제되었습니다.");
  };

  const handleRemoveLocation = async (locationIndex: number) => {
    if (activeSiteIndex === undefined || isMutating) return;
    const location = sites[activeSiteIndex]?.locations[locationIndex];
    if (!location) return;

    const response = await runMutation<ApiSiteManagementResponse>(
      "location-delete",
      "위치 삭제에 실패했습니다.",
      () => deleteManagedLocation(location.location_id),
    );

    if (response === undefined) {
      return;
    }

    setSites((prev) =>
      prev.map((site, siteIndex) =>
        siteIndex === activeSiteIndex
          ? recalculateSiteCounts({
              ...site,
              locations: site.locations.filter((_, i) => i !== locationIndex),
            })
          : site,
      ),
    );
    setActiveLocationIndex(undefined);
    setDraftLocation(emptyLocation);
    setDraftAsset(emptyAsset);
    setEditingAssetId(undefined);
    showSuccessMessage("위치가 삭제되었습니다.");
    setEditorStep("location");
  };

  const handleRemoveAsset = async (asset_id: string) => {
    if (
      activeSiteIndex === undefined ||
      activeLocationIndex === undefined ||
      isMutating
    ) {
      return;
    }

    const response = await runMutation<ApiSiteManagementResponse>(
      "asset-delete",
      "설비 삭제에 실패했습니다.",
      () => deleteManagedAsset(asset_id),
    );

    if (response === undefined) {
      return;
    }

    setSites((prev) =>
      prev.map((site, siteIndex) =>
        siteIndex === activeSiteIndex
          ? recalculateSiteCounts({
              ...site,
              locations: site.locations.map((loc, locIndex) =>
                locIndex === activeLocationIndex
                  ? {
                      ...loc,
                      assets: loc.assets.filter((assetItem) => assetItem.asset_id !== asset_id),
                    }
                  : loc,
              ),
            })
          : site,
      ),
    );
    if (editingAssetId === asset_id) {
      setDraftAsset(emptyAsset);
      setEditingAssetId(undefined);
    }
    showSuccessMessage("설비가 삭제되었습니다.");
  };

  // 에디터 스텝 뒤로 가기
  const handleGoBack = () => {
    if (editorStep === "asset") setEditorStep("location");
    else if (editorStep === "location") setEditorStep("site");
  };

  // 건너뛰기 (location → asset 건너뜀, asset → 완료)
  const handleSkip = () => {
    if (editorStep === "location") {
      setEditorStep("asset");
    } else if (editorStep === "asset") {
      // 완료: 에디터 닫고 목록으로 돌아가기
      setIsEditorOpen(false);
      setActiveSiteIndex(undefined);
      setActiveLocationIndex(undefined);
      setEditorStep("site");
    }
  };

  // 트리 토글
  const toggleSiteExpand = (site_id: string) => {
    setExpandedSites((prev) => ({ ...prev, [site_id]: !prev[site_id] }));
  };
  const toggleLocationExpand = (location_id: string) => {
    setExpandedLocations((prev) => ({ ...prev, [location_id]: !prev[location_id] }));
  };

  // ── Editor step label helpers ─────────────────────────────────────────────

  const stepLabel = {
    site: "공정",
    location: "위치",
    asset: "설비",
  } as const;

  const stepIcon = {
    site: Factory,
    location: MapPin,
    asset: Cpu,
  } as const;

  const stepNumber = {
    site: "01",
    location: "02",
    asset: "03",
  } as const;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <main className="SiteIndexPage SiteIndexPage__root-1 min-w-0 flex-1 overflow-hidden bg-muted/35 p-3 md:p-4">
      <div className="SiteIndexPage SiteIndexPage__container-1 mx-auto h-full max-w-7xl grid grid-rows-[auto_auto_minmax(0,1fr)] gap-3">

        {/* ── 상단 헤더 ── */}
        <section className="SiteIndexPage SiteIndexPage__section-1 flex min-w-0 items-center justify-between gap-3">
          <div className="SiteIndexPage SiteIndexPage__container-2 min-w-0">
            <h1 className="SiteIndexPage SiteIndexPage__title-1 truncate text-xl font-semibold text-foreground">
              공정 구성
            </h1>
            <p className="SiteIndexPage SiteIndexPage__text-1 mt-1 truncate text-sm text-muted-foreground">
              공정, 위치, 설비 등록
            </p>
          </div>
          <div className="SiteIndexPage SiteIndexPage__container-27 flex shrink-0 items-center gap-2">
            {apiMessage ? (
              <span
                className={cn(
                  "SiteIndexPage SiteIndexPage__api-message-1 max-w-[18rem] truncate rounded-md border px-3 py-2 text-xs font-semibold",
                  apiMessage.tone === "success"
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                    : "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300",
                )}
                title={apiMessage.text}
              >
                {apiMessage.text}
              </span>
            ) : null}
            <button
              type="button"
              className="SiteIndexPage SiteIndexPage__button-1 inline-flex h-10 shrink-0 items-center gap-1.5 rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isMutating}
              onClick={handleStartSite}
            >
              <Plus className="SiteIndexPage SiteIndexPage__icon-1 h-4 w-4" aria-hidden="true" />
              공정 생성
            </button>
          </div>
        </section>

        {/* ── 집계 메트릭 ── */}
        <section className="SiteIndexPage SiteIndexPage__summary-1 grid gap-2 md:grid-cols-4">
          <Metric label="공정" value={totals.sites} />
          <Metric label="위치" value={totals.locations} />
          <Metric label="설비" value={totals.assets} />
          <Metric label="알림" value={totals.alerts} />
        </section>

        {/* ── 워크스페이스 ── */}
        {isEditorOpen ? (
          // 에디터 열림 상태: 기존 왼쪽 목록 + 오른쪽 에디터
          <section className="SiteIndexPage SiteIndexPage__workspace-1 grid min-h-0 gap-3 overflow-hidden lg:grid-cols-[22rem_minmax(0,1fr)]">

            {/* ── 좌측: 공정 목록 트리 ── */}
            <aside className="SiteIndexPage SiteIndexPage__site-list-1 min-h-0 rounded-md border border-border bg-card text-card-foreground overflow-hidden flex flex-col">
              <div className="SiteIndexPage SiteIndexPage__site-list-head-1 flex h-12 items-center justify-between gap-2 border-b border-border px-4 shrink-0">
                <h2 className="SiteIndexPage SiteIndexPage__title-2 truncate text-sm font-semibold">
                  공정 목록
                </h2>
                <span className="SiteIndexPage SiteIndexPage__count-1 rounded-sm border border-border bg-background px-1.5 py-0.5 text-[11px] text-muted-foreground">
                  {sites.length}
                </span>
              </div>
              <div className="SiteIndexPage SiteIndexPage__site-list-body-1 flex-1 overflow-y-auto p-2 space-y-1">
                {sites.length ? (
                  sites.map((site, siteIndex) => {
                    const isExpanded = expandedSites[site.site_id] ?? false;
                    const isActiveSite = activeSiteIndex === siteIndex;
                    return (
                      <div key={site.site_id}>
                        {/* 공정 행 */}
                        <div
                          className={cn(
                            "SiteIndexPage SiteIndexPage__tree-site-1 flex min-w-0 items-center gap-1 rounded-md border border-border bg-background transition hover:bg-accent/55 group",
                            isActiveSite && "border-cyan-300/50 bg-cyan-300/10",
                          )}
                        >
                          {/* 펼치기/접기 버튼 */}
                          <button
                            type="button"
                            className="SiteIndexPage SiteIndexPage__tree-toggle-1 flex h-10 w-8 shrink-0 items-center justify-center text-muted-foreground transition hover:text-foreground"
                            onClick={() => toggleSiteExpand(site.site_id)}
                            aria-label={isExpanded ? "접기" : "펼치기"}
                          >
                            {site.locations.length > 0 ? (
                              isExpanded ? (
                                <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                              ) : (
                                <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                              )
                            ) : (
                              <span className="h-3.5 w-3.5" />
                            )}
                          </button>
                          {/* 공정 선택 버튼 */}
                          <button
                            type="button"
                            className="SiteIndexPage SiteIndexPage__tree-site-btn-1 flex min-w-0 flex-1 items-center gap-2 py-2 pr-2 text-left"
                            onClick={() => handleSelectSite(siteIndex)}
                          >
                            <span className="SiteIndexPage SiteIndexPage__tree-site-icon-1 grid h-7 w-7 shrink-0 place-items-center rounded-md border border-border bg-card">
                              <Factory className="h-3.5 w-3.5" aria-hidden="true" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-semibold">
                                {site.name}
                              </span>
                              <span className="block truncate text-xs text-muted-foreground">
                                {site.site_id}
                              </span>
                            </span>
                            <span className="shrink-0 rounded-sm border border-border bg-background px-1.5 py-0.5 text-[10px] text-muted-foreground">
                              {site.locationCount}
                            </span>
                          </button>
                        </div>

                        {/* 위치 트리 (공정 하위) */}
                        {isExpanded && site.locations.map((location, locIndex) => {
                          const isLocExpanded = expandedLocations[location.location_id] ?? false;
                          const isActiveLocation =
                            isActiveSite && activeLocationIndex === locIndex;
                          return (
                            <div key={location.location_id} className="ml-7">
                              <div
                                className={cn(
                                  "SiteIndexPage SiteIndexPage__tree-location-1 mt-1 flex min-w-0 items-center gap-1 rounded-md border border-border bg-background transition hover:bg-accent/55",
                                  isActiveLocation && "border-cyan-300/50 bg-cyan-300/10",
                                )}
                              >
                                {/* 위치 펼치기/접기 */}
                                <button
                                  type="button"
                                  className="SiteIndexPage SiteIndexPage__tree-toggle-2 flex h-9 w-7 shrink-0 items-center justify-center text-muted-foreground transition hover:text-foreground"
                                  onClick={() => toggleLocationExpand(location.location_id)}
                                  aria-label={isLocExpanded ? "접기" : "펼치기"}
                                >
                                  {location.assets.length > 0 ? (
                                    isLocExpanded ? (
                                      <ChevronDown className="h-3 w-3" aria-hidden="true" />
                                    ) : (
                                      <ChevronRight className="h-3 w-3" aria-hidden="true" />
                                    )
                                  ) : (
                                    <span className="h-3 w-3" />
                                  )}
                                </button>
                                {/* 위치 선택 버튼 */}
                                <button
                                  type="button"
                                  className="SiteIndexPage SiteIndexPage__tree-location-btn-1 flex min-w-0 flex-1 items-center gap-2 py-1.5 pr-2 text-left"
                                  onClick={() => {
                                    handleSelectLocation(locIndex, siteIndex);
                                  }}
                                >
                                  <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                                  <span className="min-w-0 flex-1">
                                    <span className="block truncate text-sm font-medium">
                                      {location.name}
                                    </span>
                                    <span className="block truncate text-xs text-muted-foreground">
                                      {location.floor || location.location_id}
                                    </span>
                                  </span>
                                  <span className="shrink-0 rounded-sm border border-border bg-background px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                    {location.assets.length}
                                  </span>
                                </button>
                              </div>

                              {/* 설비 트리 (위치 하위) */}
                              {isLocExpanded && location.assets.map((asset) => (
                                <div
                                  key={asset.asset_id}
                                  className="SiteIndexPage SiteIndexPage__tree-asset-1 ml-7 mt-1 flex min-w-0 items-center gap-2 rounded-md border border-border bg-background px-2 py-1.5"
                                >
                                  <Cpu className="h-3 w-3 shrink-0 text-muted-foreground" aria-hidden="true" />
                                  <span className="min-w-0 flex-1">
                                    <span className="block truncate text-xs font-medium">
                                      {asset.name}
                                    </span>
                                    <span className="block truncate text-[10px] text-muted-foreground">
                                      {asset.asset_id}
                                    </span>
                                  </span>
                                  <span
                                    className={cn(
                                      "shrink-0 rounded-sm border px-1 py-0.5 text-[10px] font-semibold",
                                      dashboardStatusClassName[asset.status],
                                    )}
                                  >
                                    {asset.status}
                                  </span>
                                </div>
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })
                ) : (
                  <div className="SiteIndexPage SiteIndexPage__empty-1 rounded-md border border-dashed border-border bg-background p-4 text-sm text-muted-foreground">
                    등록된 공정 없음
                  </div>
                )}
              </div>
            </aside>

            {/* ── 우측: 순차 에디터 (단일 패널) ── */}
            <div className="SiteIndexPage SiteIndexPage__editor-1 min-h-0 rounded-md border border-border bg-card text-card-foreground overflow-hidden flex flex-col">

              {/* 에디터 헤더: 스텝 표시 + 뒤로/건너뛰기 버튼 */}
              <div className="SiteIndexPage SiteIndexPage__editor-header-1 flex items-center gap-3 border-b border-border px-5 py-3 shrink-0">
                {/* 뒤로가기 버튼 (공정 단계에선 숨김) */}
                {editorStep !== "site" && (
                  <button
                    type="button"
                    className="SiteIndexPage SiteIndexPage__back-btn-1 inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-background px-3 text-sm font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground"
                    onClick={handleGoBack}
                  >
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                    이전으로
                  </button>
                )}

                {/* 스텝 탭 */}
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  {(["site", "location", "asset"] as SiteEditorStep[]).map((step) => {
                    const Icon = stepIcon[step];
                    const isActive = editorStep === step;
                    const isPast =
                      (step === "site" && (editorStep === "location" || editorStep === "asset")) ||
                      (step === "location" && editorStep === "asset");
                    return (
                      <span
                        key={step}
                        className={cn(
                          "SiteIndexPage SiteIndexPage__step-tab-1 inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm font-semibold transition",
                          isActive
                            ? "border-cyan-300/50 bg-cyan-300/10 text-foreground"
                            : isPast
                              ? "border-border bg-background text-muted-foreground"
                              : "border-transparent text-muted-foreground/40",
                        )}
                      >
                        <span className="grid h-5 w-6 shrink-0 place-items-center rounded-sm border border-border bg-card text-[10px] font-bold text-muted-foreground">
                          {stepNumber[step]}
                        </span>
                        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                        {stepLabel[step]}
                      </span>
                    );
                  })}
                </div>

                {/* 건너뛰기 버튼 (위치/설비 단계에서만) */}
                {(editorStep === "location" || editorStep === "asset") && (
                  <button
                    type="button"
                    className="SiteIndexPage SiteIndexPage__skip-btn-1 inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-background px-3 text-sm font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground"
                    onClick={handleSkip}
                  >
                    건너뛰기
                    <SkipForward className="h-4 w-4" aria-hidden="true" />
                  </button>
                )}
              </div>

              {/* ── 에디터 바디 ── */}
              <div className="SiteIndexPage SiteIndexPage__editor-body-1 flex-1 overflow-y-auto p-5">

                {/* ────── 공정 등록 폼 ────── */}
                {editorStep === "site" && (
                  <div className="SiteIndexPage SiteIndexPage__site-form-1 grid gap-5 max-w-lg">
                    <div>
                      <h3 className="text-base font-semibold text-foreground">공정 등록</h3>
                      <p className="mt-1 text-sm text-muted-foreground">공정 기본 정보를 입력하세요.</p>
                    </div>
                    <TextField
                      label="공정 ID (site_id)"
                      onChange={(value) =>
                        setDraftSite((site) => ({ ...site, site_id: toSlugValue(value) }))
                      }
                      placeholder="site-main-line"
                      value={draftSite.site_id}
                    />
                    <TextField
                      label="공정명 (name)"
                      onChange={(value) =>
                        setDraftSite((site) => ({ ...site, name: value }))
                      }
                      placeholder="압축 공정"
                      value={draftSite.name}
                    />
                    <TextAreaField
                      label="설명 (description)"
                      onChange={(value) =>
                        setDraftSite((site) => ({ ...site, description: value }))
                      }
                      placeholder="공정 설명"
                      value={draftSite.description}
                    />
                    <ImageUploadField
                      label="대표 이미지"
                      onChange={(value) =>
                        setDraftSite((site) => ({ ...site, imageUrl: value }))
                      }
                      value={draftSite.imageUrl}
                      onRemove={() =>
                        setDraftSite((site) => ({ ...site, imageUrl: undefined }))
                      }
                    />
                    <StatusSelect
                      label="상태 (status)"
                      onChange={(value) =>
                        setDraftSite((site) => ({ ...site, status: value }))
                      }
                      value={draftSite.status}
                    />
                    <div className="SiteIndexPage SiteIndexPage__actions-1 flex justify-between gap-3">
                      {activeSiteIndex !== undefined ? (
                        <button
                          type="button"
                          className="SiteIndexPage SiteIndexPage__delete-1 inline-flex h-10 items-center gap-1.5 rounded-md border border-red-500/30 bg-red-500/10 px-4 text-sm font-medium text-red-300 transition hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={isMutating}
                          onClick={() => handleRemoveSite(activeSiteIndex)}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                          {pendingAction === "site-delete" ? "삭제 중" : "삭제"}
                        </button>
                      ) : (
                        <span />
                      )}
                      <button
                        type="button"
                        className="SiteIndexPage SiteIndexPage__save-1 inline-flex h-10 items-center gap-2 rounded-md bg-cyan-300 px-5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={!canSaveSite || isMutating}
                        onClick={handleSaveSite}
                      >
                        <Save className="h-4 w-4" aria-hidden="true" />
                        {pendingAction === "site-save"
                          ? "저장 중"
                          : "저장 후 위치 등록"}
                      </button>
                    </div>
                  </div>
                )}

                {/* ────── 위치 등록 폼 ────── */}
                {editorStep === "location" && (
                  <div className="SiteIndexPage SiteIndexPage__location-form-1 grid gap-5 max-w-lg">
                    <div>
                      <h3 className="text-base font-semibold text-foreground">위치 등록</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        공정 <span className="font-medium text-foreground">{activeSite?.name}</span> 에 위치를 추가합니다.
                      </p>
                    </div>

                    {/* 등록된 위치 칩 목록 */}
                    {(activeSite?.locations.length ?? 0) > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {activeSite?.locations.map((location, locIndex) => (
                          <button
                            key={location.location_id}
                            type="button"
                            className={cn(
                              "SiteIndexPage SiteIndexPage__location-chip-1 inline-flex h-8 max-w-full items-center gap-1.5 rounded-md border border-border bg-background px-3 text-sm text-foreground transition hover:bg-accent",
                              activeLocationIndex === locIndex &&
                                "border-cyan-300/50 bg-cyan-300/10 text-cyan-100",
                            )}
                            onClick={() => handleSelectLocation(locIndex)}
                          >
                            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                            <span className="truncate">{location.name}</span>
                          </button>
                        ))}
                        <button
                          type="button"
                          className="SiteIndexPage SiteIndexPage__location-add-1 inline-flex h-8 items-center gap-1.5 rounded-md border border-dashed border-border bg-background px-3 text-sm text-muted-foreground transition hover:bg-accent hover:text-foreground"
                          onClick={handleStartLocation}
                        >
                          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                          위치 추가
                        </button>
                      </div>
                    )}

                    <TextField
                      disabled={!activeSite}
                      label="위치 ID (location_id)"
                      onChange={(value) =>
                        setDraftLocation((loc) => ({
                          ...loc,
                          location_id: toSlugValue(value),
                        }))
                      }
                      placeholder="machine-room"
                      value={draftLocation.location_id}
                    />
                    <div className="grid gap-5 sm:grid-cols-2">
                      <TextField
                        disabled={!activeSite}
                        label="위치명 (name)"
                        onChange={(value) =>
                          setDraftLocation((loc) => ({ ...loc, name: value }))
                        }
                        placeholder="1층 기계실"
                        value={draftLocation.name}
                      />
                      <TextField
                        disabled={!activeSite}
                        label="층 (floor)"
                        onChange={(value) =>
                          setDraftLocation((loc) => ({ ...loc, floor: value }))
                        }
                        placeholder="1F"
                        value={draftLocation.floor}
                      />
                    </div>
                    <TextAreaField
                      disabled={!activeSite}
                      label="설명 (summary)"
                      onChange={(value) =>
                        setDraftLocation((loc) => ({ ...loc, summary: value }))
                      }
                      placeholder="위치 설명"
                      value={draftLocation.summary}
                    />
                    <ImageUploadField
                      disabled={!activeSite}
                      label="대표 이미지"
                      onChange={(value) =>
                        setDraftLocation((loc) => ({ ...loc, imageUrl: value }))
                      }
                      value={draftLocation.imageUrl}
                      onRemove={() =>
                        setDraftLocation((loc) => ({ ...loc, imageUrl: undefined }))
                      }
                    />
                    <StatusSelect
                      disabled={!activeSite}
                      label="상태 (status)"
                      onChange={(value) =>
                        setDraftLocation((loc) => ({ ...loc, status: value }))
                      }
                      value={draftLocation.status}
                    />
                    <div className="SiteIndexPage SiteIndexPage__actions-2 flex justify-between gap-3">
                      {activeLocationIndex !== undefined ? (
                        <button
                          type="button"
                          className="SiteIndexPage SiteIndexPage__delete-2 inline-flex h-10 items-center gap-1.5 rounded-md border border-red-500/30 bg-red-500/10 px-4 text-sm font-medium text-red-300 transition hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={isMutating}
                          onClick={() => handleRemoveLocation(activeLocationIndex)}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                          {pendingAction === "location-delete" ? "삭제 중" : "삭제"}
                        </button>
                      ) : (
                        <span />
                      )}
                      <button
                        type="button"
                        className="SiteIndexPage SiteIndexPage__save-2 inline-flex h-10 items-center gap-2 rounded-md bg-cyan-300 px-5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={!canSaveLocation || isMutating}
                        onClick={handleSaveLocation}
                      >
                        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                        {pendingAction === "location-save"
                          ? "저장 중"
                          : "저장 후 설비 등록"}
                      </button>
                    </div>
                  </div>
                )}

                {/* ────── 설비 등록 폼 ────── */}
                {editorStep === "asset" && (
                  <div className="SiteIndexPage SiteIndexPage__asset-form-1 grid gap-5">
                    <div className="flex min-w-0 items-start justify-between gap-3">
                      <div className="min-w-0">
                      <h3 className="text-base font-semibold text-foreground">
                        {editingAssetId ? "설비 수정" : "설비 등록"}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        위치 <span className="font-medium text-foreground">{activeLocation?.name ?? "—"}</span> 에 설비를 추가합니다.
                      </p>
                      </div>
                      {editingAssetId ? (
                        <button
                          type="button"
                          className="SiteIndexPage SiteIndexPage__asset-new-1 inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-border bg-background px-3 text-xs font-semibold text-muted-foreground transition hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={isMutating}
                          onClick={handleStartAsset}
                        >
                          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                          새 설비
                        </button>
                      ) : null}
                    </div>

                    {/* 위치 선택 칩 */}
                    {(activeSite?.locations.length ?? 0) > 0 && (
                      <div>
                        <p className="mb-2 text-xs font-semibold text-muted-foreground">위치 선택</p>
                        <div className="flex flex-wrap gap-2">
                          {activeSite?.locations.map((location, locIndex) => (
                            <button
                              key={location.location_id}
                              type="button"
                              className={cn(
                                "SiteIndexPage SiteIndexPage__location-chip-2 inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-background px-3 text-sm text-foreground transition hover:bg-accent",
                                activeLocationIndex === locIndex &&
                                  "border-cyan-300/50 bg-cyan-300/10 text-cyan-100",
                              )}
                              onClick={() => handleSelectLocation(locIndex)}
                            >
                              <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                              {location.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                      {/* 설비 입력 폼 */}
                      <div className="grid gap-5 content-start">
                        <div className="grid gap-5 sm:grid-cols-2">
                          <TextField
                            disabled={!activeLocation || Boolean(editingAssetId)}
                            label="자산 ID (asset_id)"
                            onChange={(value) =>
                              setDraftAsset((eq) => ({
                                ...eq,
                                asset_id: toSlugValue(value),
                              }))
                            }
                            placeholder="asset-compressor-01"
                            value={draftAsset.asset_id}
                          />
                          <TextField
                            disabled={!activeLocation}
                            label="설비 코드 (asset_code)"
                            onChange={(value) =>
                              setDraftAsset((assetDraft) => ({
                                ...assetDraft,
                                asset_code: value,
                              }))
                            }
                            placeholder="EQ-CP-001"
                            value={draftAsset.asset_code}
                          />
                        </div>
                        <div className="grid gap-5 sm:grid-cols-2">
                          <TextField
                            disabled={!activeLocation}
                            label="설비명 (name)"
                            onChange={(value) =>
                              setDraftAsset((eq) => ({ ...eq, name: value }))
                            }
                            placeholder="압축기 1호기"
                            value={draftAsset.name}
                          />
                          <TextField
                            disabled={!activeLocation}
                            label="유형 (type)"
                            onChange={(value) =>
                              setDraftAsset((eq) => ({ ...eq, type: value }))
                            }
                            placeholder="회전 설비"
                            value={draftAsset.type}
                          />
                        </div>
                        <TextAreaField
                          disabled={!activeLocation}
                          label="설명 (description)"
                          onChange={(value) =>
                            setDraftAsset((eq) => ({ ...eq, description: value }))
                          }
                          placeholder="설비 설명"
                          value={draftAsset.description}
                        />
                        <div className="grid gap-5 sm:grid-cols-2">
                          <TextField
                            disabled={!activeLocation}
                            label="담당자 (manager)"
                            onChange={(value) =>
                              setDraftAsset((eq) => ({ ...eq, manager: value }))
                            }
                            placeholder="담당자"
                            value={draftAsset.manager}
                          />
                        </div>
                        <ImageUploadField
                          disabled={!activeLocation}
                          label="대표 이미지"
                          onChange={(value) =>
                            setDraftAsset((eq) => ({ ...eq, imageUrl: value }))
                          }
                          value={draftAsset.imageUrl}
                          onRemove={() =>
                            setDraftAsset((eq) => ({ ...eq, imageUrl: undefined }))
                          }
                        />
                        <StatusSelect
                          disabled={!activeLocation}
                          label="상태 (status)"
                          onChange={(value) =>
                            setDraftAsset((eq) => ({ ...eq, status: value }))
                          }
                          value={draftAsset.status}
                        />
                        <div className="flex justify-end">
                          <button
                            type="button"
                            className="SiteIndexPage SiteIndexPage__save-3 inline-flex h-10 items-center gap-2 rounded-md bg-cyan-300 px-5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={!canSaveAsset || isMutating}
                            onClick={handleSaveAsset}
                          >
                            {editingAssetId ? (
                              <Save className="h-4 w-4" aria-hidden="true" />
                            ) : (
                              <Plus className="h-4 w-4" aria-hidden="true" />
                            )}
                            {pendingAction === "asset-save"
                              ? "저장 중"
                              : editingAssetId
                                ? "설비 수정"
                                : "설비 등록"}
                          </button>
                        </div>
                      </div>

                      {/* 등록된 설비 목록 */}
                      <div className="SiteIndexPage SiteIndexPage__asset-list-1 min-h-0 rounded-md border border-border bg-background flex flex-col overflow-hidden">
                        <div className="SiteIndexPage SiteIndexPage__asset-head-1 grid h-11 grid-cols-[minmax(0,1fr)_8rem_8rem_5rem] items-center gap-2 border-b border-border px-4 text-xs font-semibold text-muted-foreground shrink-0">
                          <span>설비명</span>
                          <span>asset_id</span>
                          <span>상태</span>
                          <span />
                        </div>
                        <div className="SiteIndexPage SiteIndexPage__asset-body-1 flex-1 overflow-y-auto p-2 space-y-1">
                          {activeLocation?.assets.length ? (
                            activeLocation.assets.map((asset) => (
                              <div
                                key={asset.asset_id}
                                className={cn(
                                  "SiteIndexPage SiteIndexPage__asset-row-1 grid min-h-11 grid-cols-[minmax(0,1fr)_8rem_8rem_5rem] items-center gap-2 rounded-md border border-border bg-card px-3 text-sm",
                                  editingAssetId === asset.asset_id &&
                                    "border-cyan-300/50 bg-cyan-300/10",
                                )}
                              >
                                <div className="min-w-0">
                                  <p className="truncate font-medium">{asset.name}</p>
                                  <p className="truncate text-xs text-muted-foreground">
                                    {asset.description || asset.type || "—"}
                                  </p>
                                </div>
                                <span className="truncate text-xs text-muted-foreground">
                                  {asset.asset_id}
                                </span>
                                <span
                                  className={cn(
                                    "SiteIndexPage SiteIndexPage__status-1 truncate rounded-sm border px-1.5 py-0.5 text-center text-[11px] font-semibold",
                                    dashboardStatusClassName[asset.status],
                                  )}
                                >
                                  {asset.status}
                                </span>
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    type="button"
                                    className="grid h-8 w-8 place-items-center rounded-md border border-border text-muted-foreground transition hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                                    disabled={isMutating}
                                    title="수정"
                                    aria-label="설비 수정"
                                    onClick={() => handleEditAsset(asset)}
                                  >
                                    <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                                  </button>
                                  <button
                                    type="button"
                                    className="grid h-8 w-8 place-items-center rounded-md border border-border text-muted-foreground transition hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                                    disabled={isMutating}
                                    title="삭제"
                                    aria-label="설비 삭제"
                                    onClick={() => handleRemoveAsset(asset.asset_id)}
                                  >
                                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                                  </button>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="rounded-md border border-dashed border-border bg-card p-4 text-sm text-muted-foreground">
                              등록된 설비 없음
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        ) : (
          // 에디터 닫힘 상태: 공정 목록 카드 표시
          <section className="SiteIndexPage SiteIndexPage__workspace-2 min-h-0 rounded-md border border-border bg-card overflow-hidden flex flex-col">
            {sites.length > 0 ? (
              // 공정이 있을 때: 카드 리스트
              <div className="flex-1 overflow-y-auto p-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {sites.map((site, siteIndex) => (
                    <button
                      key={site.site_id}
                      type="button"
                      onClick={() => handleSelectSite(siteIndex)}
                      className="SiteIndexPage SiteIndexPage__site-card-1 group grid gap-3 rounded-lg border border-border bg-background p-4 text-left transition hover:border-cyan-300/50 hover:bg-cyan-300/5"
                    >
                      {site.imageUrl && (
                        <div className="overflow-hidden rounded-md bg-muted/50 h-32">
                          <img
                            src={site.imageUrl}
                            alt={site.name}
                            className="h-full w-full object-cover transition group-hover:scale-105"
                          />
                        </div>
                      )}
                      <div className="min-w-0">
                        <h3 className="truncate text-base font-semibold text-foreground">
                          {site.name}
                        </h3>
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                          {site.description || "설명 없음"}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span
                          className={cn(
                            "inline-flex h-7 items-center gap-1 rounded-md border px-2 text-xs font-semibold",
                            dashboardStatusClassName[site.status],
                          )}
                        >
                          {site.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 border-t border-border pt-3">
                        <div className="text-center">
                          <p className="text-[11px] font-semibold text-muted-foreground">위치</p>
                          <p className="mt-1 text-sm font-bold">{site.locationCount}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[11px] font-semibold text-muted-foreground">설비</p>
                          <p className="mt-1 text-sm font-bold">{site.assetCount}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[11px] font-semibold text-muted-foreground">알림</p>
                          <p className="mt-1 text-sm font-bold text-orange-500">{site.alertCount}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              // 공정이 없을 때: 빈 상태
              <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
                <div className="grid h-20 w-20 place-items-center rounded-full border-2 border-dashed border-border bg-muted/30">
                  <Factory className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
                </div>
                <div className="max-w-sm">
                  <h3 className="text-lg font-semibold text-foreground">등록된 공정이 없습니다</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    새로운 공정을 생성하여 시작하세요.
                  </p>
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function TextField({
  disabled = false,
  label,
  onChange,
  placeholder,
  value,
}: {
  disabled?: boolean;
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
}) {
  return (
    <label className="SiteTextField SiteTextField__label-1 grid gap-2 text-sm font-semibold text-muted-foreground">
      {label}
      <input
        className="SiteTextField SiteTextField__input-1 h-10 min-w-0 rounded-md border border-input bg-background px-3 text-sm font-medium text-foreground outline-none transition placeholder:text-muted-foreground focus:border-cyan-300/60 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
    </label>
  );
}

function TextAreaField({
  disabled = false,
  label,
  onChange,
  placeholder,
  value,
}: {
  disabled?: boolean;
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
}) {
  return (
    <label className="SiteTextAreaField SiteTextAreaField__label-1 grid gap-2 text-sm font-semibold text-muted-foreground">
      {label}
      <textarea
        className="SiteTextAreaField SiteTextAreaField__textarea-1 min-h-24 min-w-0 resize-none rounded-md border border-input bg-background px-3 py-2.5 text-sm font-medium text-foreground outline-none transition placeholder:text-muted-foreground focus:border-cyan-300/60 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
    </label>
  );
}

function StatusSelect({
  disabled = false,
  label,
  onChange,
  value,
}: {
  disabled?: boolean;
  label: string;
  onChange: (value: DashboardStatus) => void;
  value: DashboardStatus;
}) {
  return (
    <label className="SiteStatusSelect SiteStatusSelect__label-1 grid gap-2 text-sm font-semibold text-muted-foreground">
      {label}
      <select
        className="SiteStatusSelect SiteStatusSelect__select-1 h-10 min-w-0 rounded-md border border-input bg-background px-3 text-sm font-medium text-foreground outline-none transition focus:border-cyan-300/60 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={disabled}
        onChange={(event) => onChange(event.target.value as DashboardStatus)}
        value={value}
      >
        {statusOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function ImageUploadField({
  disabled = false,
  label,
  onChange,
  onRemove,
  value,
}: {
  disabled?: boolean;
  label: string;
  onChange: (value: string) => void;
  onRemove: () => void;
  value?: string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === "string") onChange(result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <label className="SiteImageUploadField SiteImageUploadField__label-1 grid gap-2 text-sm font-semibold text-muted-foreground">
      {label}
      <div className="SiteImageUploadField SiteImageUploadField__container-1 flex gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => fileInputRef.current?.click()}
          className="SiteImageUploadField SiteImageUploadField__button-1 flex-1 h-10 flex items-center justify-center gap-2 rounded-md border border-dashed border-input bg-background/50 text-sm font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground hover:border-accent disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ImageIcon className="h-4 w-4" aria-hidden="true" />
          {value ? "이미지 변경" : "이미지 업로드"}
        </button>
        {value && (
          <button
            type="button"
            onClick={onRemove}
            disabled={disabled}
            className="SiteImageUploadField SiteImageUploadField__remove-1 h-10 w-10 flex items-center justify-center rounded-md border border-border bg-red-500/10 text-red-400 transition hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-50"
            title="이미지 제거"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>
      {value && (
        <div className="SiteImageUploadField SiteImageUploadField__preview-1 mt-1 rounded-md overflow-hidden border border-border bg-background">
          <img src={value} alt="preview" className="w-full h-24 object-cover" />
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />
    </label>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="SiteIndexMetric SiteIndexMetric__container-1 min-w-0 rounded-md border border-border bg-card px-4 py-3">
      <p className="SiteIndexMetric SiteIndexMetric__text-1 truncate text-xs text-muted-foreground">
        {label}
      </p>
      <p className="SiteIndexMetric SiteIndexMetric__text-2 truncate text-xl font-semibold text-foreground">
        {value}
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────────────────────

function getItemAt<T>(items: T[] | undefined, index: number | undefined) {
  return index === undefined ? undefined : items?.[index];
}

function normalizeSite(site: SiteBuilderSite): SiteBuilderSite {
  return recalculateSiteCounts({
    ...site,
    description: site.description.trim(),
    imageUrl: site.imageUrl?.trim() || undefined,
    locations: Array.isArray(site.locations)
      ? site.locations.map(normalizeLocation)
      : [],
    name: site.name.trim(),
    site_id: toSlugValue(site.site_id),
  });
}

function normalizeLocation(location: SiteBuilderLocation): SiteBuilderLocation {
  return {
    ...location,
    assets: Array.isArray(location.assets)
      ? location.assets.map(normalizeAsset)
      : [],
    floor: location.floor.trim(),
    imageUrl: location.imageUrl?.trim() || undefined,
    location_id: toSlugValue(location.location_id),
    name: location.name.trim(),
    summary: location.summary.trim(),
  };
}

function normalizeAsset(asset: SiteBuilderAsset): SiteBuilderAsset {
  return {
    ...asset,
    asset_id: toSlugValue(asset.asset_id),
    asset_code: asset.asset_code.trim(),
    description: asset.description?.trim() ?? "",
    imageUrl: asset.imageUrl?.trim() || undefined,
    manager: asset.manager.trim(),
    name: asset.name.trim(),
    type: asset.type.trim(),
  };
}

function toCreateSitePayload(site: SiteBuilderSite): ApiCreateSiteRequest {
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

function toUpdateSitePayload(site: SiteBuilderSite): ApiUpdateSiteRequest {
  return {
    description: site.description,
    process_name: site.name,
  };
}

function toCreateLocationPayload(
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

function toUpdateLocationPayload(
  location: SiteBuilderLocation,
): ApiUpdateLocationRequest {
  return {
    description: location.summary,
    floor: location.floor,
    name: location.name,
  };
}

function toCreateAssetPayload(
  location_id: string,
  asset: SiteBuilderAsset,
): ApiCreateAssetRequest {
  return {
    description: asset.description,
    location_id,
    name: asset.name,
  };
}

function toUpdateAssetPayload(asset: SiteBuilderAsset): ApiUpdateAssetRequest {
  return {
    description: asset.description,
    name: asset.name,
  };
}

function applySiteResponse(
  fallbackSite: SiteBuilderSite,
  response: unknown,
): SiteBuilderSite {
  const record = toResponseRecord(response);
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

function applyLocationResponse(
  fallbackLocation: SiteBuilderLocation,
  response: unknown,
): SiteBuilderLocation {
  const record = toResponseRecord(response);
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

function applyAssetResponse(
  fallbackAsset: SiteBuilderAsset,
  response: unknown,
): SiteBuilderAsset {
  const record = toResponseRecord(response);

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

function toResponseRecord(value: unknown) {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : undefined;
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

function recalculateSiteCounts(site: SiteBuilderSite): SiteBuilderSite {
  return {
    ...site,
    assetCount: site.locations.reduce(
      (count, loc) => count + loc.assets.length,
      0,
    ),
    locationCount: site.locations.length,
  };
}

function toSlugValue(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^0-9a-z가-힣]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getApiErrorMessage(error: unknown, fallbackMessage: string) {
  return error instanceof Error && error.message
    ? error.message
    : fallbackMessage;
}

function readStoredSites() {
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
