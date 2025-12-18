import { Suspense } from "react";
import JobsClientPage from "./client-page";
import { getOrganizationAction } from "@/lib/server/organization-actions";
import { getJobsAction } from "@/lib/server/jobs-actions";
import DashboardLoading from "@/components/loading";
import { JobPosting } from "@/lib/db/schema";
import { PageLayout } from "@/components/page-layout";

export default async function JobsPage({ params }: { params: Promise<{ organizationId: string }> }) {
    const { organizationId } = await params;
    const org = await getOrganizationAction(organizationId);
    const jobsResult = org ? await getJobsAction(org.id) : { success: false, data: [] };
    const jobs = jobsResult.success && jobsResult.data ? jobsResult.data : [];

    return (
        <PageLayout>
            <Suspense fallback={<DashboardLoading />}>
                <JobsClientPage initialJobs={jobs as unknown as JobPosting[]} organizationId={organizationId} />
            </Suspense>
        </PageLayout>
    )
}
