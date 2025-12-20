import { Suspense } from "react";
import JobsClientPage from "./client-page";
import { getOrganizationAction } from "@/lib/server/organization-actions";
import { getJobsAction } from "@/lib/server/jobs-actions";
import DashboardLoading from "@/components/loading";
import { JobPosting } from "@/lib/db/schema";
import { PageLayout } from "@/components/page-layout";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { searchParamsCache } from "./search-params";

export default async function JobsPage({ 
    params, 
    searchParams 
}: { 
    params: Promise<{ organizationId: string }>;
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const { organizationId } = await params;
    const { q, status, type } = searchParamsCache.parse(await searchParams);

    const org = await getOrganizationAction(organizationId);
    const jobsResult = org ? await getJobsAction(org.id, { search: q, status, type }) : { success: false, data: [] };
    const jobs = jobsResult.success && jobsResult.data ? jobsResult.data : [];

    const session = await auth.api.getSession({
        headers: await headers()
    });

    const members = org?.members || [];

    const currentUserMember = members.find(m => m.userId === session?.user.id);
    const currentUserRole = currentUserMember?.role || "member";

    return (
        <PageLayout>
            <Suspense fallback={<DashboardLoading />}>
                <JobsClientPage 
                    initialJobs={jobs as unknown as JobPosting[]} 
                    organizationId={organizationId} 
                    currentUserRole={currentUserRole}
                />
            </Suspense>
        </PageLayout>
    )
}
