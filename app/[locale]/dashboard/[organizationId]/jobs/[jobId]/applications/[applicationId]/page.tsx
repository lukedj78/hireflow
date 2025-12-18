import { getApplicationAction } from "@/lib/server/application-actions";
import ApplicationDetailClientPage from "./client-page";
import { notFound } from "next/navigation";

export default async function ApplicationDetailPage({ params }: { params: Promise<{ jobId: string, applicationId: string }> }) {
    const { applicationId } = await params;
    const application = await getApplicationAction(applicationId);

    if (!application) notFound();

    return <ApplicationDetailClientPage application={application} />;
}
