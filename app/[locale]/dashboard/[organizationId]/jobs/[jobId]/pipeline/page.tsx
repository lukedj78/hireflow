import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { application, jobPosting, organizationMember } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import PipelineClientPage from "./client-page";
import { PageLayout } from "@/components/page-layout";

interface PageProps {
    params: Promise<{
        organizationId: string;
        jobId: string;
        locale: string;
    }>;
}

export default async function PipelinePage({ params }: PageProps) {
    const { jobId } = await params;
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
        redirect("/auth/sign-in");
    }

    const job = await db.query.jobPosting.findFirst({
        where: eq(jobPosting.id, jobId),
    });

    if (!job) {
        notFound();
    }

    const membership = await db.query.organizationMember.findFirst({
        where: and(
            eq(organizationMember.organizationId, job.organizationId),
            eq(organizationMember.userId, session.user.id)
        )
    });

    if (!membership) {
        redirect("/dashboard");
    }

    const applications = await db.query.application.findMany({
        where: eq(application.jobPostingId, jobId),
        with: {
            candidate: true,
        },
        orderBy: [desc(application.createdAt)],
    });

    return (
        <PageLayout maxWidth="full" className="h-[calc(100vh-4rem)] flex flex-col">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold tracking-tight">Recruiting Pipeline</h1>
                <p className="text-muted-foreground">
                    Manage candidates for <span className="font-semibold text-foreground">{job.title}</span>
                </p>
            </div>
            
            <div className="flex-1 overflow-hidden min-h-0">
                <PipelineClientPage 
                    jobId={jobId} 
                    initialApplications={applications} 
                />
            </div>
        </PageLayout>
    );
}
