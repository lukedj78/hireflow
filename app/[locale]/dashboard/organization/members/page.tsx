import { Suspense } from "react";
import MembersClientPage, { Member } from "./client-page"
import { getActiveOrganizationAction } from "@/lib/server/organization-actions"
import DashboardLoading from "@/components/loading";

export default async function MembersPage() {
    const activeOrg = await getActiveOrganizationAction();
    const members = (activeOrg?.members || []) as unknown as Member[];

    return (
        <Suspense fallback={<DashboardLoading />}>
            <MembersClientPage initialMembers={members} activeOrgId={activeOrg?.id || ""} />
        </Suspense>
    )
}
