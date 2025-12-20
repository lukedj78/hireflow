import { Suspense } from "react";
import CreateJobClientPage from "./client-page";
import { getOrganizationAction } from "@/lib/server/organization-actions";
import DashboardLoading from "@/components/loading";
import { redirect } from "next/navigation";
import { PageLayout } from "@/components/page-layout";
import { checkOrgPermission } from "@/lib/server/permissions-check";

export default async function CreateJobPage({ params }: { params: Promise<{ organizationId: string }> }) {

    const { organizationId } = await params;

    try {
        await checkOrgPermission(organizationId, { jobPosting: ["create"] });
    } catch {
        redirect(`/dashboard/${organizationId}/jobs`);
    }

    const org = await getOrganizationAction(organizationId);

    if (!org) {
        redirect("/dashboard");
    }

    return (
        <PageLayout>
            <Suspense fallback={<DashboardLoading />}>
                <CreateJobClientPage activeOrgId={org.id} />
            </Suspense>
        </PageLayout>
    )
}
