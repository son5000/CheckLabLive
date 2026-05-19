import { fetchAlerts } from "@/app/monitoring/services/asset-alerts-api";
import { enrichAlertsWithDashboardContext } from "@/app/monitoring/services/dashboard-asset-context";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = readLimit(searchParams.get("limit"), 100);
    const alerts = await fetchAlerts({
      isRead: readOptionalBoolean(searchParams.get("is_read")),
      limit,
    });
    const enrichedAlerts = await enrichAlertsWithDashboardContext(alerts);

    return Response.json(enrichedAlerts, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[CheckLab API] global alerts proxy failed", { error });

    return Response.json(
      { message: "Failed to load global alerts." },
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

function readLimit(value: string | null, fallback: number) {
  const limit = Number(value);

  return Number.isFinite(limit) && limit > 0 ? Math.min(limit, 200) : fallback;
}
