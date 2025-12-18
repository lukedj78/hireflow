import { Suspense } from "react";
import OrganizationSettingsClientPage from "./client-page"
import { getOrganizationAction } from "@/lib/server/organization-actions"
import DashboardLoading from "@/components/loading";
import { PageLayout } from "@/components/page-layout";

export default async function OrganizationSettingsPage({ params }: { params: { organizationId: string } }) {
    const org = await getOrganizationAction(params.organizationId);

    return (
        <PageLayout>
            <Suspense fallback={<DashboardLoading />}>
                <OrganizationSettingsClientPage initialOrg={org} />
            </Suspense>
        </PageLayout>
    )
}
