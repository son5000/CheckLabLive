"use client";

import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  ArrowRight,
  BellRing,
  Camera,
  Clock3,
  Cpu,
  Plus,
  Save,
  Settings2,
  SlidersHorizontal,
  Thermometer,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

import { dashboardStatusClassName } from "@/app/layouts/constants/status-styles";
import { DASHBOARD_TIME_ZONE } from "@/app/layouts/helpers/time-formatters";
import type {
  DashboardStatus,
  SampleAsset,
  SampleLocation,
  SampleSite,
} from "@/app/layouts/types";

/**
 * 역할
 * - 백엔드 monitoring tree에서 받은 위치 단위 설비 요약과 설비 관리 화면입니다.
 *
 * 개요
 * - 특정 공정 위치와 하위 설비의 현재 상태를 표시합니다.
 * - 위치 안에서 설비를 등록/제거하고, 선택 설비의 관제 옵션을 조정합니다.
 *
 * STEP 1. 선택한 공정/위치 문맥과 상태 합계를 표시합니다.
 * STEP 2. 하위 설비 카드를 상태별로 요약하고 대시보드 진입점을 제공합니다.
 * STEP 3. 등록 폼과 옵션 패널에서 설비 운영 설정을 로컬 상태로 관리합니다.
 *
 * 헬퍼
 * - 초기 설비 목록은 route server component가 백엔드 트리에서 구성한 값만 사용합니다.
 */

type LocationSummaryPageProps = {
  site: SampleSite;
  location: SampleLocation;
  assets: SampleAsset[];
};

type ManagedAsset = SampleAsset & {
  alarmLinked: boolean;
  cameraId: string;
  collectionCycleSec: number;
  isUserDefined?: boolean;
  temperatureThreshold: number;
  ultrasoundThresholdDb: number;
};

type AssetDraft = {
  alarmLinked: boolean;
  cameraId: string;
  collectionCycleSec: number;
  lastCollectedAt: string;
  name: string;
  status: DashboardStatus;
  temperatureThreshold: number;
  type: string;
  ultrasoundThresholdDb: number;
};

const dashboardStatusOptions: DashboardStatus[] = [
  "normal",
  "caution",
  "warning",
  "danger",
  "error",
];

const statusLabel: Record<DashboardStatus, string> = {
  normal: "정상",
  caution: "요주의",
  warning: "경고",
  danger: "이상",
  error: "오류",
};

const assetTypeOptions = [
  "회전 설비",
  "전기 설비",
  "배관 설비",
  "가열 설비",
  "냉각 설비",
  "기타 설비",
];

const cameraOptions = ["CAM 1", "CAM 2", "열화상 CAM", "복합 센서"];

const defaultDraft: AssetDraft = {
  alarmLinked: true,
  cameraId: cameraOptions[0],
  collectionCycleSec: 5,
  lastCollectedAt: "수집 대기",
  name: "",
  status: "normal",
  temperatureThreshold: 65,
  type: assetTypeOptions[0],
  ultrasoundThresholdDb: 70,
};

export function LocationSummaryPage({
  site,
  location,
  assets,
}: LocationSummaryPageProps) {
  const initialAssets = useMemo(
    () => assets.map((asset) => toManagedAsset(asset)),
    [assets],
  );
  const [managedAssets, setManagedAssets] =
    useState<ManagedAsset[]>(initialAssets);
  const [selectedAssetId, setSelectedAssetId] = useState(
    initialAssets[0]?.id ?? "",
  );
  const [draft, setDraft] = useState<AssetDraft>(defaultDraft);
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    setManagedAssets(initialAssets);
    setSelectedAssetId(initialAssets[0]?.id ?? "");
  }, [initialAssets]);

  useEffect(() => {
    if (!managedAssets.length) {
      setSelectedAssetId("");
      return;
    }

    if (
      selectedAssetId &&
      managedAssets.some((asset) => asset.id === selectedAssetId)
    ) {
      return;
    }

    setSelectedAssetId(managedAssets[0].id);
  }, [managedAssets, selectedAssetId]);

  const selectedAsset = managedAssets.find(
    (asset) => asset.id === selectedAssetId,
  );
  const abnormalCount = managedAssets.filter(
    (asset) => asset.status === "danger" || asset.status === "error",
  ).length;
  const watchCount = managedAssets.filter(
    (asset) =>
      asset.status === "warning" || asset.status === "caution",
  ).length;
  const alarmLinkedCount = managedAssets.filter(
    (asset) => asset.alarmLinked,
  ).length;
  const canRegister = draft.name.trim().length > 0 && draft.type.trim().length > 0;

  const handleRegisterAsset = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canRegister) {
      return;
    }

    const id = createAssetId(
      draft.name,
      managedAssets.map((asset) => asset.id),
    );
    const asset_id = `asset-${id}`;
    const nextAsset: ManagedAsset = {
      asset_id,
      id,
      alarmLinked: draft.alarmLinked,
      cameraId: draft.cameraId,
      collectionCycleSec: draft.collectionCycleSec,
      href: `${location.href}/asset/${asset_id}`,
      isUserDefined: true,
      lastCollectedAt: draft.lastCollectedAt,
      locationId: location.id,
      name: draft.name.trim(),
      site_id: site.site_id,
      status: draft.status,
      temperatureThreshold: draft.temperatureThreshold,
      type: draft.type.trim(),
      ultrasoundThresholdDb: draft.ultrasoundThresholdDb,
    };

    setManagedAssets((currentAssets) => [
      nextAsset,
      ...currentAssets,
    ]);
    setSelectedAssetId(nextAsset.id);
    setDraft({
      ...defaultDraft,
      lastCollectedAt: getCurrentClockLabel(),
    });
    setIsRegistering(false);
  };

  const handleRemoveAsset = (assetId: string) => {
    setManagedAssets((currentAssets) =>
      currentAssets.filter((asset) => asset.id !== assetId),
    );
  };

  const handleRestoreBackendAssets = () => {
    setManagedAssets(initialAssets);
    setSelectedAssetId(initialAssets[0]?.id ?? "");
  };

  const handleAssetChange = (
    assetId: string,
    patch: Partial<ManagedAsset>,
  ) => {
    setManagedAssets((currentAssets) =>
      currentAssets.map((asset) =>
        asset.id === assetId ? { ...asset, ...patch } : asset,
      ),
    );
  };

  return (
    <main className="LocationSummaryPage LocationSummaryPage__root-1 min-w-0 flex-1 overflow-auto bg-muted/35 p-3 md:p-4">
      <div className="LocationSummaryPage LocationSummaryPage__container-1 mx-auto flex max-w-6xl flex-col gap-3">
        <section className="LocationSummaryPage LocationSummaryPage__section-1 rounded-md border border-border bg-card p-3 text-card-foreground">
          <div className="LocationSummaryPage LocationSummaryPage__container-2 flex min-w-0 items-start justify-between gap-3">
            <div className="LocationSummaryPage LocationSummaryPage__container-3 min-w-0">
              <p className="LocationSummaryPage LocationSummaryPage__text-1 truncate text-xs font-medium text-muted-foreground">
                {site.name} · {location.floor}
              </p>
              <h1 className="LocationSummaryPage LocationSummaryPage__title-1 mt-1 truncate text-xl font-semibold">
                {location.name}
              </h1>
              <p className="LocationSummaryPage LocationSummaryPage__text-2 mt-1 text-sm text-muted-foreground">
                {location.summary}
              </p>
            </div>
            <div className="LocationSummaryPage LocationSummaryPage__container-10 flex shrink-0 items-center gap-1.5">
              <button
                type="button"
                className="LocationSummaryPage LocationSummaryPage__button-1 inline-flex h-8 items-center gap-1.5 rounded-md border border-primary bg-primary px-2.5 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90"
                onClick={() => setIsRegistering((current) => !current)}
              >
                {isRegistering ? (
                  <X
                    className="LocationSummaryPage LocationSummaryPage__icon-2 h-3.5 w-3.5"
                    aria-hidden="true"
                  />
                ) : (
                  <Plus
                    className="LocationSummaryPage LocationSummaryPage__icon-3 h-3.5 w-3.5"
                    aria-hidden="true"
                  />
                )}
                {isRegistering ? "취소" : "설비 등록"}
              </button>
              <span
                className={cn(
                  "LocationSummaryPage LocationSummaryPage__label-1 shrink-0 rounded-md border px-2 py-1 text-xs font-semibold",
                  dashboardStatusClassName[location.status],
                )}
              >
                {statusLabel[location.status]}
              </span>
            </div>
          </div>
          <div className="LocationSummaryPage LocationSummaryPage__container-4 mt-3 grid gap-2 sm:grid-cols-4">
            <Metric icon={Cpu} label="하위 설비" value={`${managedAssets.length}대`} />
            <Metric icon={Thermometer} label="이상 설비" value={`${abnormalCount}대`} />
            <Metric icon={Activity} label="관찰 대상" value={`${watchCount}대`} />
            <Metric icon={BellRing} label="알림 연동" value={`${alarmLinkedCount}대`} />
          </div>
        </section>

        {isRegistering ? (
          <section className="LocationSummaryPage LocationSummaryPage__section-3 rounded-md border border-border bg-card p-3 text-card-foreground">
            <div className="LocationSummaryPage LocationSummaryPage__container-11 mb-3 flex min-w-0 items-center justify-between gap-2">
              <div className="LocationSummaryPage LocationSummaryPage__container-12 flex min-w-0 items-center gap-1.5">
                <Plus
                  className="LocationSummaryPage LocationSummaryPage__icon-4 h-4 w-4 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <h2 className="LocationSummaryPage LocationSummaryPage__title-4 truncate text-sm font-semibold">
                  설비 등록
                </h2>
              </div>
              <span className="LocationSummaryPage LocationSummaryPage__label-4 shrink-0 rounded-sm border border-border bg-background px-1.5 py-0.5 text-[11px] text-muted-foreground">
                {location.name}
              </span>
            </div>

            <form
              className="LocationSummaryPage LocationSummaryPage__form-1 grid gap-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"
              onSubmit={handleRegisterAsset}
            >
              <div className="LocationSummaryPage LocationSummaryPage__container-13 grid gap-2 sm:grid-cols-2">
                <TextField
                  label="설비명"
                  value={draft.name}
                  onChange={(name) => setDraft((current) => ({ ...current, name }))}
                />
                <SelectField
                  label="설비 유형"
                  value={draft.type}
                  options={assetTypeOptions}
                  onChange={(type) => setDraft((current) => ({ ...current, type }))}
                />
                <SelectField
                  label="상태"
                  value={draft.status}
                  options={dashboardStatusOptions}
                  getOptionLabel={(status) => statusLabel[status]}
                  onChange={(status) => setDraft((current) => ({ ...current, status }))}
                />
                <SelectField
                  label="연동 카메라"
                  value={draft.cameraId}
                  options={cameraOptions}
                  onChange={(cameraId) =>
                    setDraft((current) => ({ ...current, cameraId }))
                  }
                />
              </div>

              <div className="LocationSummaryPage LocationSummaryPage__container-14 grid gap-2 sm:grid-cols-3">
                <NumberField
                  label="수집 주기"
                  suffix="초"
                  min={1}
                  value={draft.collectionCycleSec}
                  onChange={(collectionCycleSec) =>
                    setDraft((current) => ({ ...current, collectionCycleSec }))
                  }
                />
                <NumberField
                  label="온도 임계"
                  suffix="℃"
                  min={0}
                  value={draft.temperatureThreshold}
                  onChange={(temperatureThreshold) =>
                    setDraft((current) => ({ ...current, temperatureThreshold }))
                  }
                />
                <NumberField
                  label="초음파 임계"
                  suffix="dB"
                  min={0}
                  value={draft.ultrasoundThresholdDb}
                  onChange={(ultrasoundThresholdDb) =>
                    setDraft((current) => ({ ...current, ultrasoundThresholdDb }))
                  }
                />
                <label className="LocationSummaryPage LocationSummaryPage__field-4 flex h-8 min-w-0 items-center gap-2 rounded-md border border-border bg-background px-2 text-xs font-medium sm:col-span-3">
                  <input
                    className="LocationSummaryPage LocationSummaryPage__checkbox-1 h-3.5 w-3.5 accent-primary"
                    type="checkbox"
                    checked={draft.alarmLinked}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        alarmLinked: event.target.checked,
                      }))
                    }
                  />
                  알림 연동
                </label>
              </div>

              <button
                type="submit"
                disabled={!canRegister}
                className={cn(
                  "LocationSummaryPage LocationSummaryPage__button-2 inline-flex h-8 shrink-0 items-center justify-center gap-1.5 self-end rounded-md border px-3 text-xs font-semibold transition",
                  canRegister
                    ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90"
                    : "cursor-not-allowed border-border bg-muted text-muted-foreground",
                )}
              >
                <Save
                  className="LocationSummaryPage LocationSummaryPage__icon-5 h-3.5 w-3.5"
                  aria-hidden="true"
                />
                등록
              </button>
            </form>
          </section>
        ) : null}

        <section className="LocationSummaryPage LocationSummaryPage__section-2 grid gap-3 lg:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.65fr)]">
          <div className="LocationSummaryPage LocationSummaryPage__container-5 rounded-md border border-border bg-card p-3 text-card-foreground">
            <div className="LocationSummaryPage LocationSummaryPage__container-15 flex min-w-0 items-center justify-between gap-2">
              <h2 className="LocationSummaryPage LocationSummaryPage__title-2 truncate text-sm font-semibold">
                하위 설비 현상 요약
              </h2>
              <button
                type="button"
                className="LocationSummaryPage LocationSummaryPage__button-3 inline-flex h-7 shrink-0 items-center gap-1 rounded-md border border-border bg-background px-2 text-[11px] font-semibold text-muted-foreground transition hover:bg-accent hover:text-foreground"
                onClick={handleRestoreBackendAssets}
              >
                <X
                  className="LocationSummaryPage LocationSummaryPage__icon-6 h-3 w-3"
                  aria-hidden="true"
                />
                백엔드 값 복원
              </button>
            </div>

            <div className="LocationSummaryPage LocationSummaryPage__container-6 mt-2 grid gap-2 md:grid-cols-2">
              {managedAssets.length ? (
                managedAssets.map((asset) => (
                  <AssetCard
                    key={asset.id}
                    asset={asset}
                    selected={asset.id === selectedAssetId}
                    onRemove={handleRemoveAsset}
                    onSelect={setSelectedAssetId}
                  />
                ))
              ) : (
                <div className="LocationSummaryPage LocationSummaryPage__empty-1 grid min-h-40 place-items-center rounded-md border border-dashed border-border bg-background px-4 text-center text-sm text-muted-foreground md:col-span-2">
                  등록된 설비가 없습니다.
                </div>
              )}
            </div>
          </div>

          <AssetOptionPanel
            asset={selectedAsset}
            onChange={handleAssetChange}
            onRemove={handleRemoveAsset}
          />
        </section>
      </div>
    </main>
  );
}

function AssetCard({
  asset,
  selected,
  onRemove,
  onSelect,
}: {
  asset: ManagedAsset;
  selected: boolean;
  onRemove: (assetId: string) => void;
  onSelect: (assetId: string) => void;
}) {
  return (
    <article
      className={cn(
        "LocationSummaryPage LocationSummaryPage__card-1 flex min-h-44 min-w-0 flex-col justify-between rounded-md border border-border bg-background p-3 transition",
        selected && "border-primary bg-primary/5",
      )}
    >
      <button
        type="button"
        className="LocationSummaryPage LocationSummaryPage__button-card-1 min-w-0 text-left"
        onClick={() => onSelect(asset.id)}
      >
        <div className="LocationSummaryPage LocationSummaryPage__container-7 mb-2 flex min-w-0 items-start justify-between gap-2">
          <div className="LocationSummaryPage LocationSummaryPage__container-8 min-w-0">
            <p className="LocationSummaryPage LocationSummaryPage__text-3 truncate text-[11px] text-muted-foreground">
              {asset.type}
            </p>
            <h3 className="LocationSummaryPage LocationSummaryPage__title-3 truncate text-sm font-semibold">
              {asset.name}
            </h3>
          </div>
          <span
            className={cn(
              "LocationSummaryPage LocationSummaryPage__label-2 shrink-0 rounded-sm border px-1.5 py-0.5 text-[10px] font-semibold",
              dashboardStatusClassName[asset.status],
            )}
          >
            {statusLabel[asset.status]}
          </span>
        </div>

        <div className="LocationSummaryPage LocationSummaryPage__container-16 grid gap-1.5 text-xs text-muted-foreground">
          <AssetOptionRow
            icon={Clock3}
            label="최근 수집"
            value={asset.lastCollectedAt}
          />
          <AssetOptionRow
            icon={Camera}
            label="카메라"
            value={asset.cameraId}
          />
          <AssetOptionRow
            icon={SlidersHorizontal}
            label="임계"
            value={`${asset.temperatureThreshold}℃ · ${asset.ultrasoundThresholdDb} dB`}
          />
        </div>
      </button>

      <div className="LocationSummaryPage LocationSummaryPage__container-9 mt-3 flex items-center justify-between gap-2 text-xs font-medium">
        {asset.isUserDefined ? (
          <span className="LocationSummaryPage LocationSummaryPage__label-3 inline-flex h-7 items-center rounded-md border border-border bg-muted px-2 text-[11px] text-muted-foreground">
            대시보드 대기
          </span>
        ) : (
          <Link
            href={asset.href}
            className="LocationSummaryPage LocationSummaryPage__link-1 inline-flex h-7 items-center gap-1 rounded-md border border-border bg-card px-2 text-[11px] font-semibold transition hover:bg-accent"
          >
            설비 대시보드
            <ArrowRight
              className="LocationSummaryPage LocationSummaryPage__icon-1 h-3.5 w-3.5"
              aria-hidden="true"
            />
          </Link>
        )}

        <div className="LocationSummaryPage LocationSummaryPage__container-17 flex shrink-0 items-center gap-1">
          <button
            type="button"
            className="LocationSummaryPage LocationSummaryPage__button-4 grid h-7 w-7 place-items-center rounded-md border border-border bg-card text-muted-foreground transition hover:bg-accent hover:text-foreground"
            onClick={() => onSelect(asset.id)}
            title="옵션 설정"
          >
            <Settings2
              className="LocationSummaryPage LocationSummaryPage__icon-7 h-3.5 w-3.5"
              aria-hidden="true"
            />
          </button>
          <button
            type="button"
            className="LocationSummaryPage LocationSummaryPage__button-5 grid h-7 w-7 place-items-center rounded-md border border-red-500/35 bg-red-500/10 text-red-700 transition hover:bg-red-500/15 dark:text-red-300"
            onClick={() => onRemove(asset.id)}
            title="설비 제거"
          >
            <Trash2
              className="LocationSummaryPage LocationSummaryPage__icon-8 h-3.5 w-3.5"
              aria-hidden="true"
            />
          </button>
        </div>
      </div>
    </article>
  );
}

function AssetOptionPanel({
  asset,
  onChange,
  onRemove,
}: {
  asset?: ManagedAsset;
  onChange: (assetId: string, patch: Partial<ManagedAsset>) => void;
  onRemove: (assetId: string) => void;
}) {
  if (!asset) {
    return (
      <aside className="LocationSummaryPage LocationSummaryPage__aside-1 grid min-h-72 place-items-center rounded-md border border-dashed border-border bg-card p-4 text-center text-sm text-muted-foreground">
        설비를 선택하면 옵션을 설정할 수 있습니다.
      </aside>
    );
  }

  return (
    <aside className="LocationSummaryPage LocationSummaryPage__aside-2 min-w-0 rounded-md border border-border bg-card p-3 text-card-foreground">
      <div className="LocationSummaryPage LocationSummaryPage__container-18 mb-3 flex min-w-0 items-start justify-between gap-2">
        <div className="LocationSummaryPage LocationSummaryPage__container-19 min-w-0">
          <p className="LocationSummaryPage LocationSummaryPage__text-5 truncate text-[11px] text-muted-foreground">
            설비 옵션 설정
          </p>
          <h2 className="LocationSummaryPage LocationSummaryPage__title-5 truncate text-sm font-semibold">
            {asset.name}
          </h2>
        </div>
        <span
          className={cn(
            "LocationSummaryPage LocationSummaryPage__label-5 shrink-0 rounded-sm border px-1.5 py-0.5 text-[10px] font-semibold",
            dashboardStatusClassName[asset.status],
          )}
        >
          {statusLabel[asset.status]}
        </span>
      </div>

      <div className="LocationSummaryPage LocationSummaryPage__container-20 grid gap-2">
        <TextField
          label="설비명"
          value={asset.name}
          onChange={(name) => onChange(asset.id, { name })}
        />
        <SelectField
          label="설비 유형"
          value={asset.type}
          options={assetTypeOptions}
          onChange={(type) => onChange(asset.id, { type })}
        />
        <SelectField
          label="상태"
          value={asset.status}
          options={dashboardStatusOptions}
          getOptionLabel={(status) => statusLabel[status]}
          onChange={(status) => onChange(asset.id, { status })}
        />
        <SelectField
          label="연동 카메라"
          value={asset.cameraId}
          options={cameraOptions}
          onChange={(cameraId) => onChange(asset.id, { cameraId })}
        />

        <div className="LocationSummaryPage LocationSummaryPage__container-21 grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
          <NumberField
            label="수집 주기"
            suffix="초"
            min={1}
            value={asset.collectionCycleSec}
            onChange={(collectionCycleSec) =>
              onChange(asset.id, { collectionCycleSec })
            }
          />
          <NumberField
            label="온도 임계"
            suffix="℃"
            min={0}
            value={asset.temperatureThreshold}
            onChange={(temperatureThreshold) =>
              onChange(asset.id, { temperatureThreshold })
            }
          />
          <NumberField
            label="초음파 임계"
            suffix="dB"
            min={0}
            value={asset.ultrasoundThresholdDb}
            onChange={(ultrasoundThresholdDb) =>
              onChange(asset.id, { ultrasoundThresholdDb })
            }
          />
        </div>

        <label className="LocationSummaryPage LocationSummaryPage__field-5 flex h-8 min-w-0 items-center justify-between gap-2 rounded-md border border-border bg-background px-2 text-xs font-medium">
          <span className="LocationSummaryPage LocationSummaryPage__label-6 min-w-0 truncate">
            알림 연동
          </span>
          <input
            className="LocationSummaryPage LocationSummaryPage__checkbox-2 h-3.5 w-3.5 accent-primary"
            type="checkbox"
            checked={asset.alarmLinked}
            onChange={(event) =>
              onChange(asset.id, { alarmLinked: event.target.checked })
            }
          />
        </label>

        <button
          type="button"
          className="LocationSummaryPage LocationSummaryPage__button-6 inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-red-500/35 bg-red-500/10 px-3 text-xs font-semibold text-red-700 transition hover:bg-red-500/15 dark:text-red-300"
          onClick={() => onRemove(asset.id)}
        >
          <Trash2
            className="LocationSummaryPage LocationSummaryPage__icon-9 h-3.5 w-3.5"
            aria-hidden="true"
          />
          설비 제거
        </button>
      </div>
    </aside>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="LocationMetric LocationMetric__container-1 flex min-w-0 items-center gap-2 rounded-md border border-border bg-background px-3 py-2">
      <Icon
        className="LocationMetric LocationMetric__icon-1 h-4 w-4 shrink-0 text-muted-foreground"
        aria-hidden="true"
      />
      <div className="LocationMetric LocationMetric__container-2 min-w-0">
        <p className="LocationMetric LocationMetric__text-1 truncate text-[11px] text-muted-foreground">
          {label}
        </p>
        <p className="LocationMetric LocationMetric__text-2 truncate text-sm font-semibold">
          {value}
        </p>
      </div>
    </div>
  );
}

function AssetOptionRow({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <p className="LocationSummaryPage LocationSummaryPage__text-6 flex min-w-0 items-center gap-1.5">
      <Icon
        className="LocationSummaryPage LocationSummaryPage__icon-10 h-3.5 w-3.5 shrink-0 text-muted-foreground"
        aria-hidden="true"
      />
      <span className="LocationSummaryPage LocationSummaryPage__label-7 shrink-0 text-muted-foreground">
        {label}
      </span>
      <span className="LocationSummaryPage LocationSummaryPage__value-1 min-w-0 truncate font-medium text-foreground">
        {value}
      </span>
    </p>
  );
}

function TextField({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="LocationSummaryPage LocationSummaryPage__field-1 grid min-w-0 gap-1">
      <span className="LocationSummaryPage LocationSummaryPage__label-8 truncate text-[10px] font-medium text-muted-foreground">
        {label}
      </span>
      <input
        className="LocationSummaryPage LocationSummaryPage__input-1 h-8 min-w-0 rounded-md border border-border bg-background px-2 text-xs font-semibold outline-none transition focus:border-primary"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function SelectField<T extends string>({
  getOptionLabel,
  label,
  onChange,
  options,
  value,
}: {
  getOptionLabel?: (option: T) => string;
  label: string;
  onChange: (value: T) => void;
  options: readonly T[];
  value: T;
}) {
  return (
    <label className="LocationSummaryPage LocationSummaryPage__field-2 grid min-w-0 gap-1">
      <span className="LocationSummaryPage LocationSummaryPage__label-9 truncate text-[10px] font-medium text-muted-foreground">
        {label}
      </span>
      <select
        className="LocationSummaryPage LocationSummaryPage__select-1 h-8 min-w-0 rounded-md border border-border bg-background px-2 text-xs font-semibold outline-none transition focus:border-primary"
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {getOptionLabel ? getOptionLabel(option) : option}
          </option>
        ))}
      </select>
    </label>
  );
}

function NumberField({
  label,
  min,
  onChange,
  suffix,
  value,
}: {
  label: string;
  min: number;
  onChange: (value: number) => void;
  suffix: string;
  value: number;
}) {
  return (
    <label className="LocationSummaryPage LocationSummaryPage__field-3 grid min-w-0 gap-1">
      <span className="LocationSummaryPage LocationSummaryPage__label-10 truncate text-[10px] font-medium text-muted-foreground">
        {label}
      </span>
      <span className="LocationSummaryPage LocationSummaryPage__container-22 flex h-8 min-w-0 items-center gap-1 rounded-md border border-border bg-background px-2 transition focus-within:border-primary">
        <input
          className="LocationSummaryPage LocationSummaryPage__input-2 min-w-0 flex-1 bg-transparent font-mono text-xs font-semibold outline-none"
          type="number"
          min={min}
          value={value}
          onChange={(event) =>
            onChange(readBoundedNumber(event.target.value, value, min))
          }
        />
        <span className="LocationSummaryPage LocationSummaryPage__label-11 shrink-0 text-[10px] text-muted-foreground">
          {suffix}
        </span>
      </span>
    </label>
  );
}

function toManagedAsset(asset: SampleAsset): ManagedAsset {
  return {
    ...asset,
    alarmLinked: asset.status !== "normal",
    cameraId: asset.type === "전기 설비" ? "열화상 CAM" : cameraOptions[0],
    collectionCycleSec: asset.status === "normal" ? 5 : 2,
    temperatureThreshold: asset.type === "전기 설비" ? 65 : 70,
    ultrasoundThresholdDb: asset.type === "배관 설비" ? 68 : 72,
  };
}

function createAssetId(name: string, existingIds: string[]) {
  const normalizedName =
    name
      .trim()
      .toLowerCase()
      .replace(/[^0-9a-z가-힣]+/g, "-")
      .replace(/^-+|-+$/g, "") || "asset";
  let candidateId = normalizedName;
  let index = 2;

  while (existingIds.includes(candidateId)) {
    candidateId = `${normalizedName}-${index}`;
    index += 1;
  }

  return candidateId;
}

function getCurrentClockLabel() {
  return new Date().toLocaleTimeString("ko-KR", {
    timeZone: DASHBOARD_TIME_ZONE,
    hour: "2-digit",
    hourCycle: "h23",
    minute: "2-digit",
    second: "2-digit",
  });
}

function readBoundedNumber(value: string, fallback: number, min: number) {
  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue)) {
    return fallback;
  }

  return Math.max(min, parsedValue);
}
