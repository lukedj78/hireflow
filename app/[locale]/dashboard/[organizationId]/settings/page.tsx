import { Suspense } from "react";
import OrganizationSettingsClientPage from "./client-page"
import { getOrganizationAction } from "@/lib/server/organization-actions"
import DashboardLoading from "@/components/loading";

export default async function OrganizationSettingsPage({ params }: { params: { organizationId: string } }) {
    const org = await getOrganizationAction(params.organizationId);

    return (
        <Suspense fallback={<DashboardLoading />}>
            <OrganizationSettingsClientPage initialOrg={org} />
        </Suspense>
    )
}
