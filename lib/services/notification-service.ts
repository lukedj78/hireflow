import { db } from "@/lib/db";
import { communicationLog, organizationMember, userSettings, user } from "@/lib/db/schema";
import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";
import { 
    sendApplicationReceivedEmail, 
    sendNewApplicationAlertEmail,
    sendApplicationStatusUpdateEmail,
    sendInterviewScheduledEmail,
    sendInterviewUpdatedEmail,
    sendInterviewCancelledEmail,
    sendHighMatchAlertEmail,
    sendInvitationToApplyEmail,
    sendAccountStatusEmail
} from "@/lib/email";
import { triggerWorkflow } from "@/lib/events";

export type NotificationEvent = 
    | "application.created"
    | "application.status_updated"
    | "interview.scheduled"
    | "interview.updated"
    | "interview.cancelled"
    | "ai.match_analysis"
    | "candidate.invited"
    | "admin.user.banned"
    | "admin.user.unbanned"
    | "org.created"
    | "system.alert";

export class NotificationService {
    
    private static async getCandidateSettings(userId?: string | null) {
        if (!userId) return { emailNotifications: true, inAppNotifications: true };
        const settings = await db.query.userSettings.findFirst({
            where: eq(userSettings.userId, userId)
        });
        return settings || { emailNotifications: true, inAppNotifications: true };
    }

    /**
     * Gestisce la notifica di nuova organizzazione agli admin
     */
    static async handleOrganizationCreated(data: {
        organizationId: string;
        name: string;
        slug: string;
        ownerId: string;
    }) {
        try {
            // 1. Fetch all admins
            const admins = await db.select().from(user).where(eq(user.role, "admin"));
            
            if (admins.length > 0) {
                // 2. In-App Notification
                await db.insert(communicationLog).values(
                    admins.map(admin => ({
                        id: nanoid(),
                        type: "notification" as const,
                        userId: admin.id,
                        candidateId: null, // Explicitly null for admin notifications
                        subject: "New Organization Signup",
                        content: `${data.name} (${data.slug}) has been created.`,
                        metadata: {
                            trigger: "org.created",
                            organizationId: data.organizationId,
                            ownerId: data.ownerId
                        },
                        createdAt: new Date(),
                    }))
                );

                // 3. Trigger Workflow (Optional)
                // await triggerWorkflow("org.created", data);
            }
        } catch (error) {
            console.error("[NotificationService] Failed to handle org.created:", error);
        }
    }

    /**
     * Gestisce notifiche di sistema critiche agli admin
     */
    static async handleSystemAlert(data: {
        subject: string;
        message: string;
        severity: "low" | "medium" | "high" | "critical";
        metadata?: Record<string, unknown>;
    }) {
        try {
            // 1. Fetch all admins
            const admins = await db.select().from(user).where(eq(user.role, "admin"));
            
            if (admins.length > 0) {
                // 2. In-App Notification
                await db.insert(communicationLog).values(
                    admins.map(admin => ({
                        id: nanoid(),
                        type: "notification" as const,
                        userId: admin.id,
                        candidateId: null, // Explicitly null for system alerts
                        subject: `[${data.severity.toUpperCase()}] ${data.subject}`,
                        content: data.message,
                        metadata: {
                            trigger: "system.alert",
                            severity: data.severity,
                            ...data.metadata
                        },
                        createdAt: new Date(),
                    }))
                );
            }
        } catch (error) {
            console.error("[NotificationService] Failed to handle system.alert:", error);
        }
    }

    private static shouldSendEmail(settings: { emailNotifications: boolean } | undefined | null) {
        return settings?.emailNotifications !== false;
    }

    private static shouldSendInApp(settings: { inAppNotifications: boolean } | undefined | null) {
        return settings?.inAppNotifications !== false;
    }

    /**
     * Gestisce la logica di notifica per invito a candidarsi
     */
    static async handleCandidateInterest(data: {
        candidate: { id: string; name: string; email: string; userId?: string | null };
        job: { id: string; title: string; organizationId: string; organization: { name: string } };
        recruiterId: string;
        message?: string;
    }) {
        try {
            const settings = await this.getCandidateSettings(data.candidate.userId);

            // 1. Notify Candidate (Email)
            if (data.candidate.email && this.shouldSendEmail(settings)) {
                await sendInvitationToApplyEmail(data.candidate.email, {
                    candidateName: data.candidate.name,
                    jobTitle: data.job.title,
                    organizationName: data.job.organization.name,
                    message: data.message
                });
            }

            // 2. Log Communication
            // Always log interest/invitation as it's a direct action from recruiter? 
            // Or subject to in-app settings? Usually direct actions are always logged, but let's respect settings or just log it as "interest" type which might be different from "notification".
            // The prompt says "verificare le preferenze... prima di inviare email o log".
            // For "interest", it's a log that the recruiter sent something. I'll respect the setting for consistency.
            if (this.shouldSendInApp(settings)) {
                await db.insert(communicationLog).values({
                    id: nanoid(),
                    type: "interest",
                    candidateId: data.candidate.id,
                    jobPostingId: data.job.id,
                    userId: data.recruiterId,
                    subject: `Invitation to Apply: ${data.job.title}`,
                    content: data.message || "No custom message",
                    metadata: {
                        jobTitle: data.job.title,
                        organizationName: data.job.organization.name,
                        trigger: "candidate.invited"
                    },
                    createdAt: new Date(),
                });
            }

        } catch (error) {
            console.error("[NotificationService] Failed to handle candidate.invited:", error);
        }
    }

    /**
     * Gestisce la logica di notifica per una nuova candidatura
     */
    static async handleApplicationCreated(data: {
        applicationId: string;
        candidate: { id: string; name: string; email: string; phone?: string | null };
        job: { id: string; title: string; organizationId: string; organization: { name: string } };
    }) {
        try {
            // Candidate settings (unregistered candidate usually, so default true)
            // But if we had userId we would check. Here we don't have userId in input? 
            // Input definition: candidate: { id: string; name: string; email: string; phone?: string | null };
            // I'll assume default true for now as they just applied.
            
            // 1. Notify Candidate (Email)
            if (data.candidate.email) {
                await sendApplicationReceivedEmail(data.candidate.email, {
                    candidateName: data.candidate.name,
                    jobTitle: data.job.title,
                    companyName: data.job.organization.name,
                    dashboardLink: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/candidate/applications`
                });
            }

            // 2. Notify Recruiters (DB Log + Email)
            const members = await db.query.organizationMember.findMany({
                where: eq(organizationMember.organizationId, data.job.organizationId),
                with: { 
                    user: {
                        with: { settings: true }
                    } 
                }
            });

            if (members.length > 0) {
                // DB Logs
                const inAppRecipients = members.filter(m => this.shouldSendInApp(m.user.settings));
                if (inAppRecipients.length > 0) {
                    await db.insert(communicationLog).values(
                        inAppRecipients.map(member => ({
                            id: nanoid(),
                            type: "notification" as const,
                            userId: member.userId,
                            candidateId: data.candidate.id,
                            jobPostingId: data.job.id,
                            subject: "New Application Received",
                            content: `${data.candidate.name} has applied for ${data.job.title}`,
                            metadata: { 
                                applicationId: data.applicationId, 
                                trigger: "application.created",
                                jobTitle: data.job.title,
                                candidateName: data.candidate.name
                            },
                            createdAt: new Date(),
                        }))
                    );
                }

                // Email Alerts
                const emailRecipients = members.filter(m => this.shouldSendEmail(m.user.settings));
                await Promise.allSettled(emailRecipients.map(member => {
                    if (member.user.email) {
                        return sendNewApplicationAlertEmail(member.user.email, {
                            candidateName: data.candidate.name,
                            jobTitle: data.job.title,
                            applicationLink: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/${data.job.organizationId}/jobs/${data.job.id}/applications/${data.applicationId}`,
                            candidateEmail: data.candidate.email,
                            candidatePhone: data.candidate.phone || "Not provided",
                            matchScore: 0
                        });
                    }
                    return Promise.resolve();
                }));
            }
        } catch (error) {
            console.error("[NotificationService] Failed to handle application.created:", error);
            // Non blocchiamo il flusso in caso di errore notifiche
        }
    }

    /**
     * Gestisce la logica di notifica per aggiornamento stato candidatura
     */
    static async handleApplicationStatusUpdated(data: {
        applicationId: string;
        status: string;
        candidate: { id: string; name: string; email: string; userId?: string | null };
        job: { id: string; title: string; organizationId: string; organization: { name: string } };
    }) {
        try {
            const settings = await this.getCandidateSettings(data.candidate.userId);

            // 1. Notify Candidate (DB Log if user exists)
            if (data.candidate.userId && this.shouldSendInApp(settings)) {
                await db.insert(communicationLog).values({
                    id: nanoid(),
                    type: "notification",
                    userId: data.candidate.userId,
                    candidateId: data.candidate.id,
                    jobPostingId: data.job.id,
                    subject: "Application Status Update",
                    content: `Your application for ${data.job.title} has moved to the ${data.status} stage.`,
                    metadata: {
                        applicationId: data.applicationId,
                        trigger: "application.status_updated",
                        status: data.status,
                        jobTitle: data.job.title
                    },
                    createdAt: new Date(),
                });
            }

            // 2. Notify Candidate (Email)
            if (data.candidate.email && this.shouldSendEmail(settings)) {
                await sendApplicationStatusUpdateEmail(data.candidate.email, {
                    candidateName: data.candidate.name,
                    jobTitle: data.job.title,
                    status: data.status,
                    companyName: data.job.organization.name,
                    dashboardLink: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/candidate/applications`
                });
            }
        } catch (error) {
            console.error("[NotificationService] Failed to handle application.status_updated:", error);
        }
    }

    /**
     * Gestisce la logica di notifica per colloquio pianificato
     */
    static async handleInterviewScheduled(data: {
        interviewId: string;
        candidate: { id: string; name: string; email: string; userId?: string | null };
        job: { id: string; title: string; organizationId: string; organization: { name: string } };
        organizerId: string;
        startTime: Date;
        location?: string | null;
        meetingLink?: string | null;
    }) {
        try {
            const settings = await this.getCandidateSettings(data.candidate.userId);

            // 1. Notify Candidate (DB Log + Email)
            if (data.candidate.userId && this.shouldSendInApp(settings)) {
                await db.insert(communicationLog).values({
                    id: nanoid(),
                    type: "notification",
                    userId: data.candidate.userId,
                    candidateId: data.candidate.id,
                    jobPostingId: data.job.id,
                    subject: "Interview Scheduled",
                    content: `An interview for ${data.job.title} has been scheduled.`,
                    metadata: {
                        interviewId: data.interviewId,
                        trigger: "interview.scheduled",
                        startTime: data.startTime.toISOString(),
                        jobTitle: data.job.title
                    },
                    createdAt: new Date(),
                });
            }

            if (data.candidate.email && this.shouldSendEmail(settings)) {
                await sendInterviewScheduledEmail(data.candidate.email, {
                    candidateName: data.candidate.name,
                    jobTitle: data.job.title,
                    companyName: data.job.organization.name,
                    interviewDate: data.startTime.toLocaleString(),
                    interviewLink: data.meetingLink || undefined,
                    location: data.location || undefined,
                    isCandidate: true,
                    dashboardLink: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/candidate/interviews`
                });
            }

            // 2. Notify Recruiters (DB Log only, excluding organizer if needed)
            const members = await db.query.organizationMember.findMany({
                where: eq(organizationMember.organizationId, data.job.organizationId),
                with: { 
                    user: {
                        with: { settings: true }
                    } 
                }
            });

            const recipients = members.filter(m => m.userId !== data.organizerId && this.shouldSendInApp(m.user.settings));
            
            if (recipients.length > 0) {
                await db.insert(communicationLog).values(
                    recipients.map(member => ({
                        id: nanoid(),
                        type: "notification" as const,
                        userId: member.userId,
                        candidateId: data.candidate.id,
                        jobPostingId: data.job.id,
                        subject: "Interview Scheduled",
                        content: `Interview scheduled with ${data.candidate.name} for ${data.job.title}`,
                        metadata: {
                            interviewId: data.interviewId,
                            trigger: "interview.scheduled",
                            startTime: data.startTime.toISOString(),
                            candidateName: data.candidate.name
                        },
                        createdAt: new Date(),
                    }))
                );
            }
        } catch (error) {
            console.error("[NotificationService] Failed to handle interview.scheduled:", error);
        }
    }

    /**
     * Gestisce la logica di notifica per aggiornamento colloquio
     */
    static async handleInterviewUpdated(data: {
        interviewId: string;
        candidate: { id: string; name: string; email: string; userId?: string | null };
        job: { id: string; title: string; organizationId: string; organization: { name: string } };
        organizerId?: string;
        oldStartTime: Date;
        newStartTime: Date;
        location?: string | null;
        meetingLink?: string | null;
    }) {
        try {
            const settings = await this.getCandidateSettings(data.candidate.userId);

            // 1. Notify Candidate (DB Log + Email)
            if (data.candidate.userId && this.shouldSendInApp(settings)) {
                await db.insert(communicationLog).values({
                    id: nanoid(),
                    type: "notification",
                    userId: data.candidate.userId,
                    candidateId: data.candidate.id,
                    jobPostingId: data.job.id,
                    subject: "Interview Updated",
                    content: `Your interview for ${data.job.title} has been updated.`,
                    metadata: {
                        interviewId: data.interviewId,
                        trigger: "interview.updated",
                        newStartTime: data.newStartTime.toISOString(),
                        jobTitle: data.job.title
                    },
                    createdAt: new Date(),
                });
            }

            if (data.candidate.email && this.shouldSendEmail(settings)) {
                await sendInterviewUpdatedEmail(data.candidate.email, {
                    candidateName: data.candidate.name,
                    jobTitle: data.job.title,
                    companyName: data.job.organization.name,
                    oldDate: data.oldStartTime.toLocaleString(),
                    newDate: data.newStartTime.toLocaleString(),
                    newLink: data.meetingLink || undefined,
                    newLocation: data.location || undefined,
                    dashboardLink: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/candidate/interviews`
                });
            }

            // 2. Notify Recruiters (DB Log)
            const members = await db.query.organizationMember.findMany({
                where: eq(organizationMember.organizationId, data.job.organizationId),
                with: { 
                    user: {
                        with: { settings: true }
                    } 
                }
            });

            const recipients = data.organizerId 
                ? members.filter(m => m.userId !== data.organizerId && this.shouldSendInApp(m.user.settings))
                : members.filter(m => this.shouldSendInApp(m.user.settings));

            if (recipients.length > 0) {
                await db.insert(communicationLog).values(
                    recipients.map(member => ({
                        id: nanoid(),
                        type: "notification" as const,
                        userId: member.userId,
                        candidateId: data.candidate.id,
                        jobPostingId: data.job.id,
                        subject: "Interview Updated",
                        content: `Interview with ${data.candidate.name} updated`,
                        metadata: {
                            interviewId: data.interviewId,
                            trigger: "interview.updated",
                            candidateName: data.candidate.name
                        },
                        createdAt: new Date(),
                    }))
                );
            }
        } catch (error) {
            console.error("[NotificationService] Failed to handle interview.updated:", error);
        }
    }

    /**
     * Gestisce la logica di notifica per cancellazione colloquio
     */
    static async handleInterviewCancelled(data: {
        interviewId: string;
        candidate: { id: string; name: string; email: string; userId?: string | null };
        job: { id: string; title: string; organizationId: string; organization: { name: string } };
        organizerId?: string;
        startTime: Date;
    }) {
        try {
            const settings = await this.getCandidateSettings(data.candidate.userId);

            // 1. Notify Candidate (DB Log + Email)
            if (data.candidate.userId && this.shouldSendInApp(settings)) {
                await db.insert(communicationLog).values({
                    id: nanoid(),
                    type: "notification",
                    userId: data.candidate.userId,
                    candidateId: data.candidate.id,
                    jobPostingId: data.job.id,
                    subject: "Interview Cancelled",
                    content: `Your interview for ${data.job.title} has been cancelled.`,
                    metadata: {
                        interviewId: data.interviewId,
                        trigger: "interview.cancelled",
                        jobTitle: data.job.title
                    },
                    createdAt: new Date(),
                });
            }

            if (data.candidate.email && this.shouldSendEmail(settings)) {
                await sendInterviewCancelledEmail(data.candidate.email, {
                    candidateName: data.candidate.name,
                    companyName: data.job.organization.name,
                    jobTitle: data.job.title,
                    interviewDate: data.startTime.toLocaleString(),
                });
            }

            // 2. Notify Recruiters (DB Log)
            const members = await db.query.organizationMember.findMany({
                where: eq(organizationMember.organizationId, data.job.organizationId),
                with: { 
                    user: {
                        with: { settings: true }
                    } 
                }
            });

            const recipients = data.organizerId 
                ? members.filter(m => m.userId !== data.organizerId && this.shouldSendInApp(m.user.settings))
                : members.filter(m => this.shouldSendInApp(m.user.settings));

            if (recipients.length > 0) {
                await db.insert(communicationLog).values(
                    recipients.map(member => ({
                        id: nanoid(),
                        type: "notification" as const,
                        userId: member.userId,
                        candidateId: data.candidate.id,
                        jobPostingId: data.job.id,
                        subject: "Interview Cancelled",
                        content: `Interview with ${data.candidate.name} cancelled`,
                        metadata: {
                            interviewId: data.interviewId,
                            trigger: "interview.cancelled",
                            candidateName: data.candidate.name
                        },
                        createdAt: new Date(),
                    }))
                );
            }
        } catch (error) {
            console.error("[NotificationService] Failed to handle interview.cancelled:", error);
        }
    }

    /**
     * Gestisce la logica di notifica per High Match AI
     */
    static async handleHighMatchAlert(data: {
        applicationId: string;
        score: number;
        analysis: string;
        candidate: { id: string; name: string };
        job: { id: string; title: string; organizationId: string };
    }) {
        try {
            const members = await db.query.organizationMember.findMany({
                where: eq(organizationMember.organizationId, data.job.organizationId),
                with: { 
                    user: {
                        with: { settings: true }
                    } 
                }
            });

            if (members.length > 0) {
                // DB Logs
                const inAppRecipients = members.filter(m => this.shouldSendInApp(m.user.settings));
                if (inAppRecipients.length > 0) {
                    await db.insert(communicationLog).values(
                        inAppRecipients.map(member => ({
                            id: nanoid(),
                            type: "notification" as const,
                            userId: member.userId,
                            candidateId: data.candidate.id,
                            jobPostingId: data.job.id,
                            subject: "High Match Candidate Found!",
                            content: `${data.candidate.name} is a high match (${data.score}/100) for ${data.job.title}`,
                            metadata: {
                                applicationId: data.applicationId,
                                trigger: "ai.match_analysis",
                                score: data.score,
                                analysisSummary: data.analysis.substring(0, 100) + "..."
                            },
                            createdAt: new Date(),
                        }))
                    );
                }

                // Email Alerts
                const emailRecipients = members.filter(m => this.shouldSendEmail(m.user.settings));
                await Promise.allSettled(emailRecipients.map(member => {
                    if (member.user.email) {
                        return sendHighMatchAlertEmail(member.user.email, {
                            candidateName: data.candidate.name,
                            jobTitle: data.job.title,
                            matchScore: data.score,
                            analysisSummary: data.analysis,
                            applicationLink: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/${data.job.organizationId}/jobs/${data.job.id}/applications/${data.applicationId}`
                        });
                    }
                    return Promise.resolve();
                }));
            }
        } catch (error) {
            console.error("[NotificationService] Failed to handle ai.match_analysis:", error);
        }
    }

    /**
     * Gestisce la notifica di ban utente
     */
    static async handleUserBanned(data: {
        userId: string;
        email: string;
        name: string;
        reason?: string;
        adminId: string;
    }) {
        try {
            // 1. Send Email (Critical - always send)
            await sendAccountStatusEmail(data.email, {
                userName: data.name,
                type: 'banned',
                reason: data.reason
            });

            // 2. Trigger Workflow
            await triggerWorkflow("admin.user.banned", {
                userId: data.userId,
                reason: data.reason,
                adminId: data.adminId,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error("[NotificationService] Failed to handle admin.user.banned:", error);
        }
    }

    /**
     * Gestisce la notifica di sblocco utente
     */
    static async handleUserUnbanned(data: {
        userId: string;
        email: string;
        name: string;
        adminId: string;
    }) {
        try {
            // 1. Send Email (Critical - always send)
            await sendAccountStatusEmail(data.email, {
                userName: data.name,
                type: 'unbanned'
            });

            // 2. Trigger Workflow
            await triggerWorkflow("admin.user.unbanned", {
                userId: data.userId,
                adminId: data.adminId,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error("[NotificationService] Failed to handle admin.user.unbanned:", error);
        }
    }
}
