"use server";

import { db } from "@/lib/db";
import { application, candidate, jobPosting, organizationMember } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { nanoid } from "nanoid";
import { triggerWorkflow } from "@/lib/events";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

export type SubmitApplicationData = {
    jobSlug: string;
    resumeUrl?: string;
    resumeBase64?: string;
    resumeFileName?: string;
};

export async function submitApplicationAction(data: SubmitApplicationData) {
    // 1. Verify Authentication
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
        throw new Error("You must be logged in to apply");
    }

    // 2. Find the job
    const job = await db.query.jobPosting.findFirst({
        where: eq(jobPosting.slug, data.jobSlug),
    });

    if (!job) {
        throw new Error("Job not found");
    }

    if (job.status !== "published") {
        throw new Error("Job is not accepting applications");
    }

    // 3. Find candidate profile associated with user
    const existingCandidate = await db.query.candidate.findFirst({
        where: eq(candidate.userId, session.user.id),
    });

    if (!existingCandidate) {
        throw new Error("Candidate profile not found. Please complete onboarding as a candidate.");
    }

    const now = new Date();
    let shouldUpdateResumeDate = false;

    // 4. Update resume if provided
    // If a file is uploaded (resumeBase64) or a new URL is provided
    if (data.resumeUrl && data.resumeUrl !== existingCandidate.resumeUrl) {
        await db.update(candidate)
            .set({ 
                resumeUrl: data.resumeUrl,
                resumeLastUpdatedAt: now
            })
            .where(eq(candidate.id, existingCandidate.id));
        shouldUpdateResumeDate = true;
    }
    
    // If a file is uploaded, we update the timestamp too
    if (data.resumeBase64) {
         await db.update(candidate)
            .set({ 
                resumeLastUpdatedAt: now
            })
            .where(eq(candidate.id, existingCandidate.id));
        shouldUpdateResumeDate = true;
    }

    // 5. Check if already applied
    const existingApplication = await db.query.application.findFirst({
        where: and(
            eq(application.jobPostingId, job.id),
            eq(application.candidateId, existingCandidate.id)
        ),
    });

    if (existingApplication) {
        throw new Error("You have already applied for this job");
    }

    // 6. Create application
    const [newApplication] = await db.insert(application).values({
        id: nanoid(),
        jobPostingId: job.id,
        candidateId: existingCandidate.id,
        status: "applied",
    }).returning();

    // Trigger event for n8n workflow
    await triggerWorkflow("application.created", {
        application: newApplication,
        candidate: existingCandidate,
        job,
        resume: {
            url: data.resumeUrl,
            fileName: data.resumeFileName,
            content: data.resumeBase64, // Base64 encoded file content
        }
    });

    return { success: true };
}

export async function updateApplicationStatusAction(applicationId: string, status: "applied" | "screening" | "interview" | "offer" | "hired" | "rejected") {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) {
            throw new Error("Unauthorized");
        }

        const app = await db.query.application.findFirst({
            where: eq(application.id, applicationId),
            with: {
                jobPosting: true
            }
        });

        if (!app) {
            throw new Error("Application not found");
        }

        // Verify membership
        const membership = await db.query.organizationMember.findFirst({
            where: and(
                eq(organizationMember.organizationId, app.jobPosting.organizationId),
                eq(organizationMember.userId, session.user.id)
            )
        });

        if (!membership) {
            throw new Error("You are not authorized to update this application");
        }

        const [updatedApp] = await db.update(application)
            .set({ status })
            .where(eq(application.id, applicationId))
            .returning();

        // Trigger workflow event
        await triggerWorkflow("application.status_updated", {
            application: updatedApp,
            previousStatus: app.status
        });

        revalidatePath(`/dashboard/${app.jobPosting.organizationId}/jobs/${app.jobPosting.id}/applications`);
        revalidatePath(`/dashboard/${app.jobPosting.organizationId}/jobs/${app.jobPosting.id}/pipeline`);
        
        return { success: true, data: updatedApp };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
}

export async function deleteApplicationAction(applicationId: string) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) {
            throw new Error("Unauthorized");
        }

        const app = await db.query.application.findFirst({
            where: eq(application.id, applicationId),
            with: {
                jobPosting: true
            }
        });

        if (!app) {
            throw new Error("Application not found");
        }

        // Verify membership
        const membership = await db.query.organizationMember.findFirst({
            where: and(
                eq(organizationMember.organizationId, app.jobPosting.organizationId),
                eq(organizationMember.userId, session.user.id)
            )
        });

        if (!membership) {
            throw new Error("You are not authorized to delete this application");
        }

        await db.delete(application).where(eq(application.id, applicationId));

        revalidatePath(`/dashboard/${app.jobPosting.organizationId}/jobs/${app.jobPosting.id}/applications`);
        revalidatePath(`/dashboard/${app.jobPosting.organizationId}/jobs/${app.jobPosting.id}/pipeline`);

        return { success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
}

export async function getJobApplicationsAction(jobId: string) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
        throw new Error("Unauthorized");
    }

    // Verify membership for the job's organization
    const job = await db.query.jobPosting.findFirst({
        where: eq(jobPosting.id, jobId),
    });

    if (!job) {
        throw new Error("Job not found");
    }

    const membership = await db.query.organizationMember.findFirst({
        where: and(
            eq(organizationMember.organizationId, job.organizationId),
            eq(organizationMember.userId, session.user.id)
        )
    });

    if (!membership) {
        throw new Error("You are not authorized to view applications for this job");
    }

    const applications = await db.query.application.findMany({
        where: eq(application.jobPostingId, jobId),
        with: {
            candidate: true,
        },
        orderBy: [desc(application.createdAt)],
    });

    return applications;
}

export async function getApplicationAction(applicationId: string) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
        throw new Error("Unauthorized");
    }

    const app = await db.query.application.findFirst({
        where: eq(application.id, applicationId),
        with: {
            candidate: true,
            jobPosting: true,
        },
    });

    if (!app) {
        return null;
    }

    // Verify membership
    const membership = await db.query.organizationMember.findFirst({
        where: and(
            eq(organizationMember.organizationId, app.jobPosting.organizationId),
            eq(organizationMember.userId, session.user.id)
        )
    });

    if (!membership) {
        throw new Error("You are not authorized to view this application");
    }

    return app;
}

