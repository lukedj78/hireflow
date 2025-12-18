import { Suspense } from "react";
import TeamsClientPage from "./client-page"
import { getOrganizationAction, listTeamsAction } from "@/lib/server/organization-actions"
import DashboardLoading from "@/components/loading";
import { PageLayout } from "@/components/page-layout";

export default async function TeamsPage({ params }: { params: { organizationId: string } }) {
    const org = await getOrganizationAction(params.organizationId);
    const teams = org ? await listTeamsAction(org.id) : [];

    return (
        <PageLayout>
            <Suspense fallback={<DashboardLoading />}>
                <TeamsClientPage initialTeams={teams || []} activeOrgId={org?.id || ""} />
            </Suspense>
        </PageLayout>
    )
}
