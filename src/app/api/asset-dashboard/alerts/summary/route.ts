import { fetchAlertSummary } from "@/app/monitoring/services/asset-alerts-api";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const summary = await fetchAlertSummary({
      asset_id: searchParams.get("asset_id") ?? undefined,
      isRead: readOptionalBoolean(searchParams.get("is_read")),
    });

    return Response.json(summary, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[CheckLab API] alert summary proxy failed", { error });

    return Response.json(
      { message: "Failed to load alert summary." },
      { status: 502 },
    );
  }
}

function readOptionalBoolean(value: string | null) {
  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return undefined;
}
