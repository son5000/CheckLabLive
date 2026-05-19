import { fetchAssetDashboard } from "@/app/monitoring/services/asset-dashboard-api";
import { toAssetDashboardRemoteSnapshot } from "@/app/monitoring/services/asset-dashboard-adapter";

export const dynamic = "force-dynamic";

type AssetDashboardRouteContext = {
  params: {
    asset_id: string;
  };
};

export async function GET(
  _request: Request,
  { params }: AssetDashboardRouteContext,
) {
  try {
    const response = await fetchAssetDashboard(params.asset_id);
    const snapshot = toAssetDashboardRemoteSnapshot(response);

    return Response.json(snapshot, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[CheckLab API] asset dashboard proxy failed", {
      asset_id: params.asset_id,
      error,
    });

    return Response.json(
      { message: "Failed to load asset dashboard." },
      { status: 502 },
    );
  }
}
