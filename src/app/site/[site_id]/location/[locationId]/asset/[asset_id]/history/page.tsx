import { redirect } from "next/navigation";

type AssetHistoryPageProps = {
  params: {
    site_id: string;
    locationId: string;
    asset_id: string;
  };
};

export default function AssetHistoryPage({
  params,
}: AssetHistoryPageProps) {
  redirect(
    `/site/${params.site_id}/location/${params.locationId}/asset/${params.asset_id}`,
  );
}
