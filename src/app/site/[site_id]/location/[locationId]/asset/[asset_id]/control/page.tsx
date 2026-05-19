import { redirect } from "next/navigation";

type AssetControlPageProps = {
  params: {
    site_id: string;
    locationId: string;
    asset_id: string;
  };
};

export default function AssetControlPage({
  params,
}: AssetControlPageProps) {
  redirect(
    `/site/${params.site_id}/location/${params.locationId}/asset/${params.asset_id}`,
  );
}
