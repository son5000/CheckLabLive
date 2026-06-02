import { fetchSiteLocationAssets } from "@/app/site/services/site-management-api";

export const dynamic = "force-dynamic";

type SiteLocationAssetsRouteContext = {
  params: {
    location_id: string;
    site_id: string;
  };
};

export async function GET(
  _request: Request,
  { params }: SiteLocationAssetsRouteContext,
) {
  try {
    const result = await fetchSiteLocationAssets(
      params.site_id,
      params.location_id,
    );

    return Response.json(result, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[CheckLab API] site location asset list proxy failed", {
      error,
      location_id: params.location_id,
      site_id: params.site_id,
    });

    return Response.json(
      { message: "Failed to load site location assets." },
      { status: 502 },
    );
  }
}
