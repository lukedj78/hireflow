import { Suspense } from "react";
import MembersClientPage, { Member } from "./client-page"
import { getOrganizationAction } from "@/lib/server/organization-actions"
import DashboardLoading from "@/components/loading";
import { PageLayout } from "@/components/page-layout";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function MembersPage({ params }: { params: Promise<{ organizationId: string }> }) {
    const { organizationId } = await params;
    const org = await getOrganizationAction(organizationId);
    const members = (org?.members || []) as unknown as Member[];
    
    const session = await auth.api.getSession({
        headers: await headers()
    });

    const currentUserMember = members.find(m => m.userId === session?.user.id);
    const currentUserRole = currentUserMember?.role || "member";

    return (
        <PageLayout>
            <Suspense fallback={<DashboardLoading />}>
                <MembersClientPage 
                    initialMembers={members} 
                    activeOrgId={org?.id || ""} 
                    currentUserRole={currentUserRole}
                />
            </Suspense>
        </PageLayout>
    )
}
