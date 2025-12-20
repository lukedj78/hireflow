"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { interview, application, organizationMember, jobPosting, candidate, communicationLog } from "@/lib/db/schema";
import { eq, and, desc, ne } from "drizzle-orm";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";

import { VideoProviderFactory } from "@/lib/video/factory";
import { NotificationService } from "@/lib/services/notification-service";
import { triggerWorkflow } from "@/lib/events";

export type CreateInterviewData = {
    applicationId: string;
    candidateId: string;
    jobId: string;
    startTime: Date;
    endTime: Date;
    location?: string;
    meetingLink?: string;
    notes?: string;
    feedbackReport?: string;
    generateMeetingLink?: boolean; // Nuovo flag opzionale
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
            with: {
                organization: true
            }
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

        // Gestione creazione meeting video
        let finalMeetingLink = data.meetingLink;
        let meetingProvider = null;
        let meetingMetadata = null;
        const interviewId = nanoid(); // Generate ID beforehand

        if (data.generateMeetingLink) {
            try {
                const videoProvider = VideoProviderFactory.getProvider();
                const durationMinutes = Math.round((data.endTime.getTime() - data.startTime.getTime()) / 60000);
                
                const meeting = await videoProvider.createMeeting(
                    `Interview for ${job.title}`,
                    data.startTime,
                    durationMinutes
                );

                // Use internal room route instead of provider URL
                // Assuming the app is running on localhost:3000 or defined env var
                const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
                finalMeetingLink = `${baseUrl}/room/${interviewId}`;
                
                meetingProvider = meeting.provider;
                meetingMetadata = meeting.metadata;
            } catch (videoError) {
                console.error("Failed to generate video meeting:", videoError);
                // Non blocchiamo la creazione dell'intervista, ma logghiamo l'errore
            }
        }

        const [newInterview] = await db.insert(interview).values({
            id: interviewId,
            applicationId: data.applicationId,
            organizerId: session.user.id,
            candidateId: data.candidateId,
            jobId: data.jobId,
            startTime: data.startTime,
            endTime: data.endTime,
            location: data.location,
            meetingLink: finalMeetingLink,
            meetingProvider: meetingProvider,
            meetingMetadata: meetingMetadata, // Drizzle handles JSON stringification with mode: "json"
            notes: data.notes,
            status: "scheduled",
        }).returning();

        // Optionally update application status to 'interview'
        await db.update(application)
            .set({ status: "interview" })
            .where(eq(application.id, data.applicationId));

        // --- NOTIFICATIONS ---
        
        // Fetch candidate to ensure we have data for notifications
        const cand = await db.query.candidate.findFirst({
            where: eq(candidate.id, data.candidateId)
        });

        if (cand) {
            await NotificationService.handleInterviewScheduled({
                interviewId: newInterview.id,
                candidate: cand,
                job: job,
                organizerId: session.user.id,
                startTime: newInterview.startTime,
                location: newInterview.location || undefined,
                meetingLink: newInterview.meetingLink || undefined
            });

            await triggerWorkflow("interview.scheduled", {
                interview: newInterview,
                candidate: cand,
                job: job,
                organizerId: session.user.id
            });
        }

        revalidatePath(`/dashboard/${job.organizationId}/jobs/${data.jobId}/applications/${data.applicationId}`);
        revalidatePath("/[locale]/dashboard/[organizationId]/jobs/[jobId]/applications/[applicationId]", "page");
        return { success: true, data: newInterview };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
}

/**
 * Recupera tutte le interviste per una specifica candidatura.
 */
export async function getApplicationInterviewsAction(applicationId: string) {
    console.log(`[getApplicationInterviewsAction] Fetching interviews for application: ${applicationId}`);
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) {
            console.log("[getApplicationInterviewsAction] No session found");
            throw new Error("Unauthorized");
        }

        // We should verify permissions here too
        const app = await db.query.application.findFirst({
            where: eq(application.id, applicationId),
            with: {
                jobPosting: {
                    columns: {
                        organizationId: true
                    }
                }
            }
        });

        if (!app) {
            console.log("[getApplicationInterviewsAction] Application not found");
            throw new Error("Application not found");
        }

        const membership = await db.query.organizationMember.findFirst({
            where: and(
                eq(organizationMember.organizationId, app.jobPosting.organizationId),
                eq(organizationMember.userId, session.user.id)
            )
        });

        if (!membership) {
            console.log("[getApplicationInterviewsAction] User not member of org");
            throw new Error("Unauthorized");
        }

        const interviews = await db.query.interview.findMany({
            where: eq(interview.applicationId, applicationId),
            orderBy: [desc(interview.startTime)],
            with: {
                organizer: true,
            }
        });
        
        console.log(`[getApplicationInterviewsAction] Found ${interviews.length} interviews`);

        return { success: true, data: interviews };
    } catch (error) {
        console.error("[getApplicationInterviewsAction] Error:", error);
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
                job: {
                    columns: {
                        id: true,
                        title: true,
                        organizationId: true,
                        status: true,
                    },
                    with: {
                        organization: true
                    }
                }
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

        // --- NOTIFICATIONS ---
        // Notify Candidate and Team if critical details changed (status, time, link)
        if (data.status || data.startTime || data.meetingLink) {
             const cand = await db.query.candidate.findFirst({
                where: eq(candidate.id, existingInterview.candidateId)
            });

            const job = await db.query.jobPosting.findFirst({
                where: eq(jobPosting.id, existingInterview.jobId),
                with: {
                    organization: true
                }
            });

            if (cand && job) {
                if (data.status === 'cancelled') {
                    await NotificationService.handleInterviewCancelled({
                        interviewId: updatedInterview.id,
                        candidate: cand,
                        job: job,
                        organizerId: session.user.id,
                        startTime: updatedInterview.startTime
                    });
                } else if (data.status === 'rescheduled' || data.startTime || data.meetingLink) {
                    await NotificationService.handleInterviewUpdated({
                        interviewId: updatedInterview.id,
                        candidate: cand,
                        job: job,
                        organizerId: session.user.id,
                        oldStartTime: existingInterview.startTime,
                        newStartTime: updatedInterview.startTime,
                        location: updatedInterview.location || undefined,
                        meetingLink: updatedInterview.meetingLink || undefined
                    });
                }

                await triggerWorkflow("interview.updated", {
                    interview: updatedInterview,
                    candidate: cand,
                    job: job,
                    previousInterview: existingInterview,
                    changes: data,
                    organizerId: session.user.id
                });
            }
        }

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
                job: {
                    columns: {
                        id: true,
                        title: true,
                        organizationId: true,
                    },
                    with: {
                        organization: true
                    }
                }
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

        // --- NOTIFICATIONS ---
        const cand = await db.query.candidate.findFirst({
            where: eq(candidate.id, existingInterview.candidateId)
        });
        
        if (cand) {
             await NotificationService.handleInterviewCancelled({
                interviewId: existingInterview.id,
                candidate: cand,
                job: existingInterview.job,
                organizerId: session.user.id,
                startTime: existingInterview.startTime
            });

            await triggerWorkflow("interview.cancelled", {
                interview: existingInterview,
                candidate: cand,
                job: existingInterview.job,
                organizerId: session.user.id
            });
        }

        revalidatePath(`/dashboard/${existingInterview.job.organizationId}/jobs/${existingInterview.jobId}/applications/${existingInterview.applicationId}`);
        return { success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
}
