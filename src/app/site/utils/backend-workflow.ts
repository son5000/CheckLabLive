import type {
  DashboardHeaderState,
  DashboardStatus,
  MonitoringTreeNode,
  SampleAsset,
  SampleLocation,
  SampleSite,
} from "@/app/layouts/types";
import { fetchBackendMonitoringTree } from "@/app/monitoring/services/monitoring-tree-loader";

const statusLabel: Record<DashboardStatus, string> = {
  normal: "정상",
  caution: "요주의",
  warning: "경고",
  danger: "이상",
  error: "오류",
};

export async function fetchBackendWorkflowTree() {
  return fetchBackendMonitoringTree();
}

export function findSiteNode(tree: MonitoringTreeNode, site_id: string) {
  return (tree.children ?? []).find(
    (node) => node.type === "site" && node.id === site_id,
  );
}

export function findLocationNode(
  siteNode: MonitoringTreeNode,
  locationId: string,
) {
  return (siteNode.children ?? []).find(
    (node) => node.type === "place" && node.id === locationId,
  );
}

export function findAssetNode(
  locationNode: MonitoringTreeNode,
  asset_id: string,
) {
  return (locationNode.children ?? []).find(
    (node) => node.type === "asset" && node.id === asset_id,
  );
}

export function toSiteModel(siteNode: MonitoringTreeNode): SampleSite {
  const locations = siteNode.children ?? [];

  return {
    alertCount: siteNode.alertCount ?? 0,
    assetCount:
      siteNode.assetCount ??
      locations.reduce(
        (count, location) => count + (location.assetCount ?? location.children?.length ?? 0),
        0,
      ),
    description: siteNode.description ?? "",
    href: siteNode.href ?? `/site/${encodeURIComponent(siteNode.id)}`,
    locationCount: siteNode.locationCount ?? locations.length,
    name: siteNode.label,
    site_id: siteNode.id,
    status: siteNode.status ?? "normal",
  };
}

export function toLocationModel(
  siteNode: MonitoringTreeNode,
  locationNode: MonitoringTreeNode,
): SampleLocation {
  return {
    assetCount: locationNode.assetCount ?? locationNode.children?.length ?? 0,
    floor: locationNode.floor ?? "",
    href:
      locationNode.href ??
      `/site/${encodeURIComponent(siteNode.id)}/location/${encodeURIComponent(locationNode.id)}`,
    id: locationNode.id,
    name: locationNode.label,
    site_id: siteNode.id,
    status: locationNode.status ?? "normal",
    summary: locationNode.description ?? "",
  };
}

export function toAssetModel({
  assetNode,
  locationNode,
  siteNode,
}: {
  assetNode: MonitoringTreeNode;
  locationNode: MonitoringTreeNode;
  siteNode: MonitoringTreeNode;
}): SampleAsset {
  return {
    assetCode: assetNode.assetCode,
    assetNumber: assetNode.assetNumber,
    asset_id: assetNode.id,
    emergencyContact: assetNode.emergencyContact,
    href:
      assetNode.href ??
      `/site/${encodeURIComponent(siteNode.id)}/location/${encodeURIComponent(locationNode.id)}/asset/${encodeURIComponent(assetNode.id)}`,
    id: assetNode.id,
    lastCollectedAt: assetNode.lastCollectedAt ?? "수집 대기",
    lastInspectionDate: assetNode.lastInspectionDate,
    locationId: locationNode.id,
    manager: assetNode.manager,
    modelName: assetNode.modelName,
    name: assetNode.label,
    operationState:
      assetNode.operationState === "가동중" ||
      assetNode.operationState === "비가동"
        ? assetNode.operationState
        : undefined,
    serialNumber: assetNode.serialNumber,
    site_id: siteNode.id,
    status: assetNode.status ?? "normal",
    type: assetNode.description ?? "설비",
  };
}

export function toLocationModels(siteNode: MonitoringTreeNode) {
  return (siteNode.children ?? [])
    .filter((node) => node.type === "place")
    .map((locationNode) => toLocationModel(siteNode, locationNode));
}

export function toAssetModels(siteNode: MonitoringTreeNode) {
  return (siteNode.children ?? []).flatMap((locationNode) =>
    (locationNode.children ?? [])
      .filter((node) => node.type === "asset")
      .map((assetNode) =>
        toAssetModel({
          assetNode,
          locationNode,
          siteNode,
        }),
      ),
  );
}

export function buildBackendHeaderState({
  asset,
  location,
  site,
}: {
  asset?: SampleAsset;
  location?: SampleLocation;
  site?: SampleSite;
}): DashboardHeaderState {
  const selectedPath = [
    site?.name ?? "공정 선택",
    location?.name,
    asset?.name,
  ].filter(Boolean) as string[];
  const status = asset?.status ?? location?.status ?? site?.status ?? "normal";

  return {
    assetStatus: status,
    assetStatusLabel: statusLabel[status],
    lastCollectedAt: asset?.lastCollectedAt ?? "수집 대기",
    selectedPath,
    unresolvedAlarmCount: site?.alertCount ?? 0,
    userName: "관제 관리자",
  };
}
