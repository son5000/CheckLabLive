import {
  deleteAsset,
  updateAsset,
  type ApiUpdateAssetRequest,
} from "@/app/site/services/site-management-api";

export const dynamic = "force-dynamic";

type AssetRouteContext = {
  params: {
    asset_id: string;
  };
};

export async function PUT(request: Request, { params }: AssetRouteContext) {
  try {
    const body = (await request.json()) as ApiUpdateAssetRequest;
    const result = await updateAsset(params.asset_id, body);

    return Response.json(result ?? { ok: true }, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[CheckLab API] asset update proxy failed", {
      asset_id: params.asset_id,
      error,
    });

    return Response.json(
      { message: "Failed to update asset." },
      { status: 502 },
    );
  }
}

export async function DELETE(_request: Request, { params }: AssetRouteContext) {
  try {
    const result = await deleteAsset(params.asset_id);

    return Response.json(result ?? { ok: true }, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[CheckLab API] asset delete proxy failed", {
      asset_id: params.asset_id,
      error,
    });

    return Response.json(
      { message: "Failed to delete asset." },
      { status: 502 },
    );
  }
}
