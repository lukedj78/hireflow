import { Suspense } from "react";
import OrganizationSettingsClientPage from "./client-page"
import { getOrganizationAction } from "@/lib/server/organization-actions"
import DashboardLoading from "@/components/loading";
import { PageLayout } from "@/components/page-layout";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

interface Member {
    userId: string;
    role: string;
}

export default async function OrganizationSettingsPage({ params }: { params: Promise<{ organizationId: string }> }) {
    const { organizationId } = await params;
    const org = await getOrganizationAction(organizationId);

    const session = await auth.api.getSession({
        headers: await headers()
    });

    const members = (org?.members || []) as unknown as Member[];
    const currentUserMember = members.find(m => m.userId === session?.user.id);
    const currentUserRole = currentUserMember?.role || "member";

    return (
        <PageLayout>
            <Suspense fallback={<DashboardLoading />}>
                <OrganizationSettingsClientPage initialOrg={org} currentUserRole={currentUserRole} />
            </Suspense>
        </PageLayout>
    )
}
