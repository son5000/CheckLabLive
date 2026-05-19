import { MainLayout } from "@/app/layouts/main-layout";
import { SiteIndexPage } from "@/app/site/components/site-index-page";
import {
  buildBackendHeaderState,
  fetchBackendWorkflowTree,
} from "@/app/site/utils/backend-workflow";

export default async function SiteIndexRoutePage() {
  const monitoringTree = await fetchBackendWorkflowTree();

  return (
    <MainLayout
      activeNodeId="overview"
      headerState={buildBackendHeaderState({})}
      initialMonitoringTree={monitoringTree}
    >
      <SiteIndexPage />
    </MainLayout>
  );
}
