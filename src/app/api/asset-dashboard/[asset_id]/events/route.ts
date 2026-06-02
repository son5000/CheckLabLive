import { fetchAssetEvents } from "@/app/monitoring/services/asset-events-api";

export const dynamic = "force-dynamic";

type AssetEventsRouteContext = {
  params: {
    asset_id: string;
  };
};

export async function GET(
  request: Request,
  { params }: AssetEventsRouteContext,
) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = readLimit(searchParams.get("limit"), 100);
    const events = await fetchAssetEvents(params.asset_id, { limit });

    return Response.json(events, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[CheckLab API] asset events proxy failed", {
      asset_id: params.asset_id,
      error,
    });

    return Response.json([], {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  }
}

function readLimit(value: string | null, fallback: number) {
  const limit = Number(value);

  return Number.isFinite(limit) && limit > 0 ? Math.min(limit, 200) : fallback;
}
