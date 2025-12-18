import { getJobApplicationsAction } from "@/lib/server/application-actions";
import ApplicationsClientPage from "./client-page";
import { getJobAction } from "@/lib/server/jobs-actions";
import { notFound } from "next/navigation";

export default async function ApplicationsPage({ params }: { params: Promise<{ jobId: string }> }) {
    const { jobId } = await params;
    const result = await getJobAction(jobId);
    if (!result.success || !result.data) notFound();

    const applications = await getJobApplicationsAction(jobId);

    return <ApplicationsClientPage job={result.data} applications={applications} />;
}
