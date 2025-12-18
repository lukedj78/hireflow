import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { application, jobPosting } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import PipelineClientPage from "./client-page";
import { getTranslations } from "next-intl/server";

interface PageProps {
    params: Promise<{
        jobId: string;
        locale: string;
    }>;
}

export default async function PipelinePage({ params }: PageProps) {
    const { jobId, locale } = await params;
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

    const membership = await auth.api.getActiveMember({
        query: { organizationId: job.organizationId, userId: session.user.id },
        headers: await headers()
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
        <div className="flex flex-col gap-6 h-full">
            <div className="flex flex-col gap-2 px-6 pt-6">
                <h1 className="text-2xl font-bold tracking-tight">Recruiting Pipeline</h1>
                <p className="text-muted-foreground">
                    Manage candidates for <span className="font-semibold text-foreground">{job.title}</span>
                </p>
            </div>
            
            <div className="flex-1 px-6 pb-6 overflow-hidden">
                <PipelineClientPage 
                    jobId={jobId} 
                    initialApplications={applications} 
                />
            </div>
        </div>
    );
}
