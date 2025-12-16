import { Suspense } from "react";
import TeamsClientPage from "./client-page"
import { getActiveOrganizationAction, listTeamsAction } from "@/lib/server/organization-actions"
import DashboardLoading from "@/components/loading";

export default async function TeamsPage() {
    const activeOrg = await getActiveOrganizationAction();
    const teams = activeOrg ? await listTeamsAction(activeOrg.id) : [];

    return (
        <Suspense fallback={<DashboardLoading />}>
            <TeamsClientPage initialTeams={teams || []} activeOrgId={activeOrg?.id || ""} />
        </Suspense>
    )
}
