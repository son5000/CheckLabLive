import {
  deleteLocation,
  updateLocation,
  type ApiUpdateLocationRequest,
} from "@/app/site/services/site-management-api";

export const dynamic = "force-dynamic";

type LocationRouteContext = {
  params: {
    location_id: string;
  };
};

export async function PUT(request: Request, { params }: LocationRouteContext) {
  try {
    const body = (await request.json()) as ApiUpdateLocationRequest;
    const result = await updateLocation(params.location_id, body);

    return Response.json(result ?? { ok: true }, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[CheckLab API] location update proxy failed", {
      error,
      location_id: params.location_id,
    });

    return Response.json(
      { message: "Failed to update location." },
      { status: 502 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: LocationRouteContext,
) {
  try {
    const result = await deleteLocation(params.location_id);

    return Response.json(result ?? { ok: true }, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[CheckLab API] location delete proxy failed", {
      error,
      location_id: params.location_id,
    });

    return Response.json(
      { message: "Failed to delete location." },
      { status: 502 },
    );
  }
}
