import { Suspense } from "react";
import EditJobClientPage from "./client-page";
import { getJobAction } from "@/lib/server/jobs-actions";
import DashboardLoading from "@/components/loading";
import { notFound } from "next/navigation";
import { PageLayout } from "@/components/page-layout";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getOrganizationAction } from "@/lib/server/organization-actions";

interface PageProps {
    params: Promise<{ jobId: string; organizationId: string }>;
}

export default async function EditJobPage({ params }: PageProps) {
    const { jobId, organizationId } = await params;
    const result = await getJobAction(jobId);

    if (!result.success || !result.data) {
        notFound();
    }

    const session = await auth.api.getSession({
        headers: await headers()
    });

    const org = await getOrganizationAction(organizationId);
    const members = org?.members || [];
    const currentUserMember = members.find(m => m.userId === session?.user.id);
    const currentUserRole = currentUserMember?.role || "member";

    return (
        <PageLayout>
            <Suspense fallback={<DashboardLoading />}>
                <EditJobClientPage job={result.data} currentUserRole={currentUserRole} />
            </Suspense>
        </PageLayout>
    )
}
