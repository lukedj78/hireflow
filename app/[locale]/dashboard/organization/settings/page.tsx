import { Suspense } from "react";
import OrganizationSettingsClientPage from "./client-page"
import { getActiveOrganizationAction } from "@/lib/server/organization-actions"
import DashboardLoading from "@/components/loading";

export default async function OrganizationSettingsPage() {
    const activeOrg = await getActiveOrganizationAction();

    return (
        <Suspense fallback={<DashboardLoading />}>
            <OrganizationSettingsClientPage initialOrg={activeOrg} />
        </Suspense>
    )
}
