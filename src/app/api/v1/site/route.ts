import {
  createSite,
  type ApiCreateSiteRequest,
} from "@/app/site/services/site-management-api";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ApiCreateSiteRequest;
    const result = await createSite(body);

    return Response.json(result ?? { ok: true }, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[CheckLab API] site create proxy failed", { error });

    return Response.json(
      { message: "Failed to create site." },
      { status: 502 },
    );
  }
}
