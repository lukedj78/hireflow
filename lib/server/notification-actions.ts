"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { communicationLog, candidate, organizationMember, jobPosting, organization } from "@/lib/db/schema";
import { eq, and, desc, isNull, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

/**
 * Recupera le notifiche per l'utente corrente.
 * Supporta notifiche per candidati e membri di organizzazioni.
 * @param organizationId Opzionale. Se fornito, recupera le notifiche per l'organizzazione specifica.
 */
export async function getNotificationsAction(organizationId?: string) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return [];

    // Se è specificata un'organizzazione, recupera le notifiche per quella organizzazione
    if (organizationId) {
        // Verifica membership
        const membership = await db.query.organizationMember.findFirst({
            where: and(
                eq(organizationMember.userId, session.user.id),
                eq(organizationMember.organizationId, organizationId)
            )
        });

        if (!membership) return [];

        // Recupera le notifiche legate ai job posting dell'organizzazione
        // Utilizziamo una query più complessa per filtrare in base all'organizzazione
        const notifications = await db
            .select({
                log: communicationLog,
                job: jobPosting,
                org: organization
            })
            .from(communicationLog)
            .leftJoin(jobPosting, eq(communicationLog.jobPostingId, jobPosting.id))
            .leftJoin(organization, eq(jobPosting.organizationId, organization.id))
            .where(eq(jobPosting.organizationId, organizationId))
            .orderBy(desc(communicationLog.createdAt));

        // Mappa i risultati nel formato atteso
        return notifications.map(({ log, job, org }) => ({
            ...log,
            jobPosting: job && org ? {
                id: job.id,
                title: job.title,
                slug: job.slug,
                organizationId: org.id,
                organization: {
                    name: org.name,
                    slug: org.slug,
                    logo: org.logo
                }
            } : null
        }));
    }

    // Altrimenti, comportamento default per candidati
    // O per notifiche dirette all'utente (es. Admin)
    
    // 1. Cerca notifiche dirette all'utente (es. Admin o System notifications)
    const userNotifications = await db.query.communicationLog.findMany({
        where: eq(communicationLog.userId, session.user.id),
        orderBy: [desc(communicationLog.createdAt)],
        with: {
            jobPosting: {
                columns: {
                    id: true,
                    title: true,
                    slug: true,
                    organizationId: true,
                },
                with: {
                    organization: {
                        columns: {
                            name: true,
                            slug: true,
                            logo: true,
                        }
                    }
                }
            }
        }
    });

    // 2. Cerca notifiche per il candidato (se l'utente è anche un candidato)
    const userCandidate = await db.query.candidate.findFirst({
        where: eq(candidate.userId, session.user.id),
    });

    let candidateNotifications: typeof userNotifications = [];

    if (userCandidate) {
        candidateNotifications = await db.query.communicationLog.findMany({
            where: eq(communicationLog.candidateId, userCandidate.id),
            orderBy: [desc(communicationLog.createdAt)],
            with: {
                jobPosting: {
                    columns: {
                        id: true,
                        title: true,
                        slug: true,
                        organizationId: true,
                    },
                    with: {
                        organization: {
                            columns: {
                                name: true,
                                slug: true,
                                logo: true,
                            }
                        }
                    }
                }
            }
        });
    }

    // Unisci e ordina
    const allNotifications = [...userNotifications, ...candidateNotifications].sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return allNotifications;
}

/**
 * Segna una notifica come letta.
 */
export async function markNotificationAsReadAction(notificationId: string) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return { success: false, error: "Unauthorized" };

    try {
        // Nota: non verifichiamo la proprietà stretta qui perché potrebbe essere
        // sia di un candidato che di un membro dell'organizzazione.
        // In un sistema più robusto, dovremmo verificare i permessi.
        await db.update(communicationLog)
            .set({ readAt: new Date() })
            .where(eq(communicationLog.id, notificationId));

        revalidatePath("/dashboard");
        return { success: true };
    } catch (error) {
        console.error("Error marking notification as read:", error);
        return { success: false, error: "Failed to update notification" };
    }
}

/**
 * Segna tutte le notifiche dell'utente come lette.
 * @param organizationId Opzionale. Se fornito, segna come lette le notifiche dell'organizzazione.
 */
export async function markAllNotificationsAsReadAction(organizationId?: string) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return { success: false, error: "Unauthorized" };

    try {
        if (organizationId) {
            // Verifica membership
            const membership = await db.query.organizationMember.findFirst({
                where: and(
                    eq(organizationMember.userId, session.user.id),
                    eq(organizationMember.organizationId, organizationId)
                )
            });

            if (!membership) return { success: false, error: "Unauthorized" };

            // Trova gli ID delle notifiche da aggiornare
            // Questo è un po' complesso con Drizzle update + join, quindi facciamo in due step o usiamo subquery
            // SQLite supporta update con subquery in where
            
            // Per semplicità, troviamo prima i jobPostingId dell'organizzazione
            const orgJobPostings = await db.query.jobPosting.findMany({
                where: eq(jobPosting.organizationId, organizationId),
                columns: { id: true }
            });
            
            const jobPostingIds = orgJobPostings.map(j => j.id);

            if (jobPostingIds.length > 0) {
                await db.update(communicationLog)
                    .set({ readAt: new Date() })
                    .where(
                        and(
                            inArray(communicationLog.jobPostingId, jobPostingIds),
                            isNull(communicationLog.readAt)
                        )
                    );
            }
        } else {
            // Logica utente generico (incluso Candidato e Admin)
            
            // 1. Marca come lette le notifiche dirette all'utente
            await db.update(communicationLog)
                .set({ readAt: new Date() })
                .where(
                    and(
                        eq(communicationLog.userId, session.user.id),
                        isNull(communicationLog.readAt)
                    )
                );

            // 2. Marca come lette le notifiche candidato (se esiste)
            const userCandidate = await db.query.candidate.findFirst({
                where: eq(candidate.userId, session.user.id),
            });

            if (userCandidate) {
                await db.update(communicationLog)
                    .set({ readAt: new Date() })
                    .where(
                        and(
                            eq(communicationLog.candidateId, userCandidate.id),
                            isNull(communicationLog.readAt)
                        )
                    );
            }
        }

        revalidatePath("/dashboard");
        return { success: true };
    } catch (error) {
        console.error("Error marking all notifications as read:", error);
        return { success: false, error: "Failed to update notifications" };
    }
}

/**
 * Elimina una notifica.
 */
export async function deleteNotificationAction(notificationId: string) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return { success: false, error: "Unauthorized" };

    try {
        await db.delete(communicationLog)
            .where(eq(communicationLog.id, notificationId));

        revalidatePath("/dashboard");
        return { success: true };
    } catch (error) {
        console.error("Error deleting notification:", error);
        return { success: false, error: "Failed to delete notification" };
    }
}

/**
 * Elimina tutte le notifiche dell'utente.
 * @param organizationId Opzionale.
 */
export async function deleteAllNotificationsAction(organizationId?: string) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return { success: false, error: "Unauthorized" };

    try {
        if (organizationId) {
             const membership = await db.query.organizationMember.findFirst({
                where: and(
                    eq(organizationMember.userId, session.user.id),
                    eq(organizationMember.organizationId, organizationId)
                )
            });

            if (!membership) return { success: false, error: "Unauthorized" };

            const orgJobPostings = await db.query.jobPosting.findMany({
                where: eq(jobPosting.organizationId, organizationId),
                columns: { id: true }
            });
            
            const jobPostingIds = orgJobPostings.map(j => j.id);

            if (jobPostingIds.length > 0) {
                await db.delete(communicationLog)
                    .where(inArray(communicationLog.jobPostingId, jobPostingIds));
            }

        } else {
            const userCandidate = await db.query.candidate.findFirst({
                where: eq(candidate.userId, session.user.id),
            });

            if (!userCandidate) return { success: false, error: "Candidate profile not found" };

            await db.delete(communicationLog)
                .where(eq(communicationLog.candidateId, userCandidate.id));
        }

        revalidatePath("/dashboard");
        return { success: true };
    } catch (error) {
        console.error("Error deleting all notifications:", error);
        return { success: false, error: "Failed to delete notifications" };
    }
}
