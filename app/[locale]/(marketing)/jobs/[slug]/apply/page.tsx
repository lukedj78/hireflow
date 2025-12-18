import { getJobBySlugAction } from "@/lib/server/jobs-actions";
import { getCandidateProfileAction } from "@/lib/server/candidate-actions";
import { notFound } from "next/navigation";
import ApplyClientPage from "./client-page";
import { PageLayout } from "@/components/page-layout";
import { Suspense } from "react";
import DashboardLoading from "@/components/loading";

interface PageProps {
    params: Promise<{ slug: string }>;
}

export default async function ApplyPage({ params }: PageProps) {
    const { slug } = await params;
    const [jobResult, candidateProfile] = await Promise.all([
        getJobBySlugAction(slug),
        getCandidateProfileAction(),
    ]);

    if (!jobResult.success || !jobResult.data) {
        notFound();
    }

    return (
        <PageLayout>
            <Suspense fallback={<DashboardLoading />}>
                <ApplyClientPage job={jobResult.data} candidateProfile={candidateProfile} />
            </Suspense>
        </PageLayout>
    )

}
