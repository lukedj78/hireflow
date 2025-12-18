import { Suspense } from "react";
import EditJobClientPage from "./client-page";
import { getJobAction } from "@/lib/server/jobs-actions";
import DashboardLoading from "@/components/loading";
import { notFound } from "next/navigation";
import { PageLayout } from "@/components/page-layout";

interface PageProps {
    params: Promise<{ jobId: string }>;
}

export default async function EditJobPage({ params }: PageProps) {
    const { jobId } = await params;
    const result = await getJobAction(jobId);

    if (!result.success || !result.data) {
        notFound();
    }

    return (
        <PageLayout>
            <Suspense fallback={<DashboardLoading />}>
                <EditJobClientPage job={result.data} />
            </Suspense>
        </PageLayout>
    )
}
