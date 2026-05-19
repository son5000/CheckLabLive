import {
  createAsset,
  type ApiCreateAssetRequest,
} from "@/app/site/services/site-management-api";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ApiCreateAssetRequest;
    const result = await createAsset(body);

    return Response.json(result ?? { ok: true }, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[CheckLab API] asset create proxy failed", { error });

    return Response.json(
      { message: "Failed to create asset." },
      { status: 502 },
    );
  }
}
