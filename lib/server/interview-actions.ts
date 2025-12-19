"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { interview, application, organizationMember, jobPosting } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";

export type CreateInterviewData = {
    applicationId: string;
    candidateId: string;
    jobId: string;
    startTime: Date;
    endTime: Date;
    location?: string;
    meetingLink?: string;
    notes?: string;
};

/**
 * Crea una nuova intervista per una candidatura.
 * Richiede che l'utente sia autenticato e membro dell'organizzazione.
 */
export async function createInterviewAction(data: CreateInterviewData) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) {
            throw new Error("Unauthorized");
        }

        // Verify user is a member of the organization that owns the job
        const job = await db.query.jobPosting.findFirst({
            where: eq(jobPosting.id, data.jobId),
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
            throw new Error("You are not authorized to schedule interviews for this job");
        }

        const [newInterview] = await db.insert(interview).values({
            id: nanoid(),
            applicationId: data.applicationId,
            organizerId: session.user.id,
            candidateId: data.candidateId,
            jobId: data.jobId,
            startTime: data.startTime,
            endTime: data.endTime,
            location: data.location,
            meetingLink: data.meetingLink,
            notes: data.notes,
            status: "scheduled",
        }).returning();

        // Optionally update application status to 'interview'
        await db.update(application)
            .set({ status: "interview" })
            .where(eq(application.id, data.applicationId));

        revalidatePath(`/dashboard/${job.organizationId}/jobs/${data.jobId}/applications/${data.applicationId}`);
        return { success: true, data: newInterview };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
}

/**
 * Recupera tutte le interviste per una specifica candidatura.
 */
export async function getApplicationInterviewsAction(applicationId: string) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) {
            throw new Error("Unauthorized");
        }

        // We should verify permissions here too
        const app = await db.query.application.findFirst({
            where: eq(application.id, applicationId),
            with: {
                jobPosting: true
            }
        });

        if (!app) {
            throw new Error("Application not found");
        }

        const membership = await db.query.organizationMember.findFirst({
            where: and(
                eq(organizationMember.organizationId, app.jobPosting.organizationId),
                eq(organizationMember.userId, session.user.id)
            )
        });

        if (!membership) {
            throw new Error("Unauthorized");
        }

        const interviews = await db.query.interview.findMany({
            where: eq(interview.applicationId, applicationId),
            orderBy: [desc(interview.startTime)],
            with: {
                organizer: true,
            }
        });

        return { success: true, data: interviews };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
}

/**
 * Aggiorna un'intervista esistente.
 */
export async function updateInterviewAction(interviewId: string, data: Partial<CreateInterviewData> & { status?: "scheduled" | "completed" | "cancelled" | "rescheduled" }) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) {
            throw new Error("Unauthorized");
        }

        const existingInterview = await db.query.interview.findFirst({
            where: eq(interview.id, interviewId),
            with: {
                job: true
            }
        });

        if (!existingInterview) {
            throw new Error("Interview not found");
        }

        const membership = await db.query.organizationMember.findFirst({
            where: and(
                eq(organizationMember.organizationId, existingInterview.job.organizationId),
                eq(organizationMember.userId, session.user.id)
            )
        });

        if (!membership) {
            throw new Error("Unauthorized");
        }

        const [updatedInterview] = await db.update(interview)
            .set({
                ...data,
                updatedAt: new Date(),
            })
            .where(eq(interview.id, interviewId))
            .returning();

        revalidatePath(`/dashboard/${existingInterview.job.organizationId}/jobs/${existingInterview.jobId}/applications/${existingInterview.applicationId}`);
        return { success: true, data: updatedInterview };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
}

/**
 * Cancella (elimina) un'intervista.
 */
export async function deleteInterviewAction(interviewId: string) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) {
            throw new Error("Unauthorized");
        }

        const existingInterview = await db.query.interview.findFirst({
            where: eq(interview.id, interviewId),
            with: {
                job: true
            }
        });

        if (!existingInterview) {
            throw new Error("Interview not found");
        }

        const membership = await db.query.organizationMember.findFirst({
            where: and(
                eq(organizationMember.organizationId, existingInterview.job.organizationId),
                eq(organizationMember.userId, session.user.id)
            )
        });

        if (!membership) {
            throw new Error("Unauthorized");
        }

        await db.delete(interview).where(eq(interview.id, interviewId));

        revalidatePath(`/dashboard/${existingInterview.job.organizationId}/jobs/${existingInterview.jobId}/applications/${existingInterview.applicationId}`);
        return { success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
}
