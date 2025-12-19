"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { jobPosting, organizationMember } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import { generateEmbedding } from "./ai-actions";

export type CreateJobData = {
    title: string;
    description: string;
    location: string;
    type: "remote" | "onsite" | "hybrid";
    salaryRange: string;
    organizationId: string;
    status: "draft" | "published" | "closed";
};

/**
 * Crea un nuovo annuncio di lavoro.
 * Richiede che l'utente sia autenticato e membro dell'organizzazione.
 * Genera automaticamente uno slug univoco e l'embedding per la ricerca semantica.
 */
export async function createJobAction(data: CreateJobData) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) {
            throw new Error("Unauthorized");
        }

        // Verify user is a member of the organization
        const membership = await db.query.organizationMember.findFirst({
            where: and(
                eq(organizationMember.organizationId, data.organizationId),
                eq(organizationMember.userId, session.user.id)
            )
        });

        if (!membership) {
            throw new Error("You are not a member of this organization");
        }

        // Generate a unique slug
        const slug = `${data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${nanoid(6)}`;

        // Generate embedding
        const embedding = await generateEmbedding(`${data.title}\n\n${data.description}`);

        const [newJob] = await db.insert(jobPosting).values({
            id: nanoid(),
            title: data.title,
            slug,
            description: data.description,
            location: data.location,
            type: data.type,
            salaryRange: data.salaryRange,
            status: data.status,
            organizationId: data.organizationId,
            embedding,
        }).returning();

        revalidatePath(`/dashboard/${data.organizationId}/jobs`);
        return { success: true, data: newJob };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
}

/**
 * Recupera tutti gli annunci di lavoro di un'organizzazione.
 * Richiede che l'utente sia autenticato e membro dell'organizzazione.
 * Ordina i risultati per data di creazione decrescente.
 */
export async function getJobsAction(organizationId: string) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) {
            throw new Error("Unauthorized");
        }

        const membership = await db.query.organizationMember.findFirst({
            where: and(
                eq(organizationMember.organizationId, organizationId),
                eq(organizationMember.userId, session.user.id)
            )
        });

        if (!membership) {
            throw new Error("You are not a member of this organization");
        }

        const jobs = await db.query.jobPosting.findMany({
            where: eq(jobPosting.organizationId, organizationId),
            orderBy: [desc(jobPosting.createdAt)],
        });

        return { success: true, data: jobs };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
}

/**
 * Recupera un singolo annuncio di lavoro tramite ID.
 * Richiede che l'utente sia autenticato e membro dell'organizzazione proprietaria dell'annuncio.
 */
export async function getJobAction(jobId: string) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) {
            throw new Error("Unauthorized");
        }

        const job = await db.query.jobPosting.findFirst({
            where: eq(jobPosting.id, jobId),
        });

        if (!job) {
            return { success: true, data: null };
        }

        const membership = await db.query.organizationMember.findFirst({
            where: and(
                eq(organizationMember.organizationId, job.organizationId),
                eq(organizationMember.userId, session.user.id)
            )
        });

        if (!membership) {
            throw new Error("You are not authorized to view this job");
        }

        return { success: true, data: job };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
}

/**
 * Recupera un annuncio di lavoro pubblico tramite slug.
 * L'annuncio deve essere in stato "published".
 * Include i dettagli dell'organizzazione.
 */
export async function getJobBySlugAction(slug: string) {
    try {
        const job = await db.query.jobPosting.findFirst({
            where: and(
                eq(jobPosting.slug, slug),
                eq(jobPosting.status, "published")
            ),
            with: {
                organization: true
            }
        });
        return { success: true, data: job };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
}

export async function getPublicJobsAction() {
    try {
        const jobs = await db.query.jobPosting.findMany({
            where: eq(jobPosting.status, "published"),
            orderBy: [desc(jobPosting.createdAt)],
            with: {
                organization: true
            }
        });
        return { success: true, data: jobs };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
}

export async function updateJobAction(jobId: string, data: Partial<CreateJobData>) {
    try {
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

        const membership = await db.query.organizationMember.findFirst({
            where: and(
                eq(organizationMember.organizationId, job.organizationId),
                eq(organizationMember.userId, session.user.id)
            )
        });

        if (!membership) {
            throw new Error("You are not authorized to update this job");
        }

        // Generate embedding if title or description changed
        let embedding: number[] | undefined;
        if (data.title || data.description) {
            const title = data.title || job.title;
            const description = data.description || job.description;
            embedding = await generateEmbedding(`${title}\n\n${description}`);
        }

        const [updatedJob] = await db.update(jobPosting)
            .set({
                ...data,
                ...(embedding ? { embedding } : {}),
                updatedAt: new Date(),
            })
            .where(eq(jobPosting.id, jobId))
            .returning();

        revalidatePath(`/dashboard/${job.organizationId}/jobs`);
        return { success: true, data: updatedJob };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
}

/**
 * Elimina un annuncio di lavoro.
 * Richiede che l'utente sia autenticato e membro dell'organizzazione.
 */
export async function deleteJobAction(jobId: string) {
    try {
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

        const membership = await db.query.organizationMember.findFirst({
            where: and(
                eq(organizationMember.organizationId, job.organizationId),
                eq(organizationMember.userId, session.user.id)
            )
        });

        if (!membership) {
            throw new Error("You are not authorized to delete this job");
        }

        await db.delete(jobPosting).where(eq(jobPosting.id, jobId));
        revalidatePath(`/dashboard/${job.organizationId}/jobs`);
        return { success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
}
