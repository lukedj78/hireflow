import { Suspense } from "react";
import MembersClientPage, { Member } from "./client-page"
import { getOrganizationAction } from "@/lib/server/organization-actions"
import DashboardLoading from "@/components/loading";
import { PageLayout } from "@/components/page-layout";

export default async function MembersPage({ params }: { params: Promise<{ organizationId: string }> }) {
    const { organizationId } = await params;
    const org = await getOrganizationAction(organizationId);
    const members = (org?.members || []) as unknown as Member[];
    console.log(members);
    return (
        <PageLayout>
            <Suspense fallback={<DashboardLoading />}>
                <MembersClientPage initialMembers={members} activeOrgId={org?.id || ""} />
            </Suspense>
        </PageLayout>
    )
}
