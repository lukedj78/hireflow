import { getApplicationAction } from "@/lib/server/application-actions";
import { getApplicationInterviewsAction } from "@/lib/server/interview-actions";
import ApplicationDetailClientPage from "./client-page";
import { notFound } from "next/navigation";

export default async function ApplicationDetailPage({ params }: { params: Promise<{ locale: string, organizationId: string, jobId: string, applicationId: string }> }) {
    const { applicationId } = await params;
    const application = await getApplicationAction(applicationId);
    const interviewsResult = await getApplicationInterviewsAction(applicationId);
    const interviews = interviewsResult.success && interviewsResult.data ? interviewsResult.data : [];

    if (!application) notFound();

    return <ApplicationDetailClientPage application={application} interviews={interviews} />;
}
