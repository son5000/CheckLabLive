import { markAlertRead } from "@/app/monitoring/services/asset-alerts-api";

export const dynamic = "force-dynamic";

const DEFAULT_FRONTEND_USER_ID = "frontend-user-id";

type AlertReadRouteContext = {
  params: {
    alertId: string;
  };
};

export async function PUT(
  request: Request,
  { params }: AlertReadRouteContext,
) {
  try {
    const body = (await request.json()) as { read_by?: string };
    const readBy = body.read_by?.trim() || DEFAULT_FRONTEND_USER_ID;
    const alert = await markAlertRead(params.alertId, readBy);

    return Response.json(alert, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[CheckLab API] alert read proxy failed", {
      alertId: params.alertId,
      error,
    });

    return Response.json(
      { message: "Failed to mark alert as read." },
      { status: 502 },
    );
  }
}
