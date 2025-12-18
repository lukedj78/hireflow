"use server";

import { db } from "@/lib/db";
import { application, candidate, jobPosting } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { nanoid } from "nanoid";
import { triggerWorkflow } from "@/lib/events";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

export type SubmitApplicationData = {
    jobSlug: string;
    name: string;
    email: string;
    phone: string;
    resumeUrl: string; // URL or text for now
};

export async function submitApplicationAction(data: SubmitApplicationData) {
    // 1. Find the job
    const job = await db.query.jobPosting.findFirst({
        where: eq(jobPosting.slug, data.jobSlug),
    });

    if (!job) {
        throw new Error("Job not found");
    }

    if (job.status !== "published") {
        throw new Error("Job is not accepting applications");
    }

    // 2. Find or create candidate
    let existingCandidate = await db.query.candidate.findFirst({
        where: eq(candidate.email, data.email),
    });

    if (!existingCandidate) {
        const [newCandidate] = await db.insert(candidate).values({
            id: nanoid(),
            name: data.name,
            email: data.email,
            phone: data.phone,
            resumeUrl: data.resumeUrl,
        }).returning();
        existingCandidate = newCandidate;
    } else {
        // Optional: Update candidate info
    }

    // 3. Check if already applied
    const existingApplication = await db.query.application.findFirst({
        where: and(
            eq(application.jobPostingId, job.id),
            eq(application.candidateId, existingCandidate.id)
        ),
    });

    if (existingApplication) {
        throw new Error("You have already applied for this job");
    }

    // 4. Create application
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
    });

    return { success: true };
}

export async function getJobApplicationsAction(jobId: string) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
        throw new Error("Unauthorized");
    }

    const job = await db.query.jobPosting.findFirst({
        where: eq(jobPosting.id, jobId),
    });

    if (!job) {
        throw new Error("Job not found");
    }

    const membership = await auth.api.getActiveMember({
        query: {
            organizationId: job.organizationId,
            userId: session.user.id
        },
        headers: await headers()
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

export async function updateApplicationStatusAction(applicationId: string, status: "applied" | "screening" | "interview" | "offer" | "hired" | "rejected") {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
        throw new Error("Unauthorized");
    }

    const app = await db.query.application.findFirst({
        where: eq(application.id, applicationId),
        with: {
            jobPosting: true,
        }
    });

    if (!app) {
        throw new Error("Application not found");
    }

    const membership = await auth.api.getActiveMember({
        query: {
            organizationId: app.jobPosting.organizationId,
            userId: session.user.id
        },
        headers: await headers()
    });

    if (!membership) {
        throw new Error("You are not authorized to update this application");
    }

    await db.update(application)
        .set({ status })
        .where(eq(application.id, applicationId));
    
    // Trigger workflow
    await triggerWorkflow("application.status_updated", {
        applicationId,
        status,
        previousStatus: app.status,
    });

    revalidatePath(`/dashboard/organization/jobs/${app.jobPostingId}`);
    revalidatePath(`/dashboard/organization/jobs/${app.jobPostingId}/pipeline`);
    
    return { success: true };
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
        }
    });

    if (!app) {
        return null;
    }

    const membership = await auth.api.getActiveMember({
        query: {
            organizationId: app.jobPosting.organizationId,
            userId: session.user.id
        },
        headers: await headers()
    });

    if (!membership) {
        throw new Error("You are not authorized to view this application");
    }

    return app;
}

export async function deleteApplicationAction(applicationId: string) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
        throw new Error("Unauthorized");
    }

    const app = await db.query.application.findFirst({
        where: eq(application.id, applicationId),
        with: {
            jobPosting: true,
        }
    });

    if (!app) {
        throw new Error("Application not found");
    }

    const membership = await auth.api.getActiveMember({
        query: {
            organizationId: app.jobPosting.organizationId,
            userId: session.user.id
        },
        headers: await headers()
    });

    if (!membership) {
        throw new Error("You are not authorized to delete this application");
    }

    await db.delete(application).where(eq(application.id, applicationId));

    revalidatePath(`/dashboard/${app.jobPosting.organizationId}/jobs/${app.jobPostingId}/applications`);
    
    return { success: true };
}
