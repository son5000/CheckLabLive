import { redirect } from "next/navigation";

type AssetStatusPageProps = {
  params: {
    site_id: string;
    locationId: string;
    asset_id: string;
  };
};

export default function AssetStatusPage({ params }: AssetStatusPageProps) {
  redirect(
    `/site/${params.site_id}/location/${params.locationId}/asset/${params.asset_id}`,
  );
}
