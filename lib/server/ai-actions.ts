"use server";

import { db } from "@/lib/db";
import { candidate, jobPosting, application, organizationMember } from "@/lib/db/schema";
import { eq, sql, desc, and } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { generateObject, embed } from 'ai';
import { z } from 'zod';
import { revalidatePath } from "next/cache";

export async function generateEmbedding(text: string) {
    try {
        const { embedding } = await embed({
            model: 'text-embedding-3-small',
            value: text,
        });
        return embedding;
    } catch (error) {
        console.error("Failed to generate embedding:", error);
        throw new Error("Failed to generate embedding");
    }
}

export async function findMatchingCandidatesAction(jobId: string, limit: number = 10) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) throw new Error("Unauthorized");

    const job = await db.query.jobPosting.findFirst({
        where: eq(jobPosting.id, jobId),
    });

    if (!job) throw new Error("Job not found");

    const membership = await db.query.organizationMember.findFirst({
        where: and(
            eq(organizationMember.organizationId, job.organizationId),
            eq(organizationMember.userId, session.user.id)
        )
    });

    if (!membership) throw new Error("Unauthorized");

    if (!job.embedding) {
        throw new Error("Job posting has no embedding. Please update the job description to generate one.");
    }

    // Perform vector search
    // Note: vector_distance_cos returns distance (lower is better)
    // We order by distance ASC
    const similarCandidates = await db.select({
        id: candidate.id,
        name: candidate.name,
        email: candidate.email,
        skills: candidate.skills,
        experience: candidate.experience,
        summary: candidate.summary,
        resumeUrl: candidate.resumeUrl,
        similarity: sql<number>`vector_distance_cos(${candidate.embedding}, ${JSON.stringify(job.embedding)})`,
    })
    .from(candidate)
    .where(sql`${candidate.embedding} IS NOT NULL`)
    .orderBy(sql`vector_distance_cos(${candidate.embedding}, ${JSON.stringify(job.embedding)}) ASC`)
    .limit(limit);

    return similarCandidates;
}

export async function generateMatchAnalysisAction(applicationId: string) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) throw new Error("Unauthorized");

    const app = await db.query.application.findFirst({
        where: eq(application.id, applicationId),
        with: {
            candidate: true,
            jobPosting: true,
        }
    });

    if (!app) throw new Error("Application not found");

    const membership = await db.query.organizationMember.findFirst({
        where: and(
            eq(organizationMember.organizationId, app.jobPosting.organizationId),
            eq(organizationMember.userId, session.user.id)
        )
    });

    if (!membership) throw new Error("Unauthorized");

    // Prepare data for AI
    const candidateData = {
        name: app.candidate.name,
        skills: app.candidate.skills,
        experience: app.candidate.experience,
        summary: app.candidate.summary,
    };

    const jobData = {
        title: app.jobPosting.title,
        description: app.jobPosting.description,
        requirements: "See description", // You might want to parse this separately if available
    };

    try {
        const { object } = await generateObject({
            model: 'gpt-4o',
            schema: z.object({
                score: z.number().min(0).max(100).describe("Match score between 0 and 100"),
                analysis: z.string().describe("Detailed analysis of the match"),
                strengths: z.array(z.string()).describe("Key strengths of the candidate"),
                weaknesses: z.array(z.string()).describe("Potential gaps or weaknesses"),
            }),
            prompt: `
                Analyze the match between this candidate and job posting.
                
                Candidate:
                ${JSON.stringify(candidateData)}
                
                Job:
                ${JSON.stringify(jobData)}
            `,
        });

        return object;
    } catch (error) {
        console.error("AI Analysis failed:", error);
        throw new Error("Failed to generate analysis");
    }
}

export async function triggerCandidateParsingAction(candidateId: string) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) throw new Error("Unauthorized");

    // Check if candidate exists
    const cand = await db.query.candidate.findFirst({
        where: eq(candidate.id, candidateId)
    });
    if (!cand) throw new Error("Candidate not found");

    // Check authorization: User must be a member of an organization that has an application from this candidate
    const apps = await db.query.application.findMany({
        where: eq(application.candidateId, candidateId),
        with: {
            jobPosting: true
        }
    });

    if (apps.length === 0) {
        throw new Error("No applications found for this candidate");
    }

    const organizationIds = apps.map(app => app.jobPosting.organizationId);

    // Check if user is member of any of these organizations
    let authorized = false;
    for (const orgId of organizationIds) {
        const membership = await db.query.organizationMember.findFirst({
            where: and(
                eq(organizationMember.organizationId, orgId),
                eq(organizationMember.userId, session.user.id)
            )
        });
        if (membership) {
            authorized = true;
            break;
        }
    }

    if (!authorized) {
        throw new Error("You are not authorized to perform this action");
    }

    if (!process.env.N8N_PARSING_WEBHOOK_URL) {
        console.warn("N8N_PARSING_WEBHOOK_URL not configured. Skipping webhook call.");
        return { success: false, message: "N8N_PARSING_WEBHOOK_URL not configured" };
    }

    try {
        const response = await fetch(process.env.N8N_PARSING_WEBHOOK_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                type: "candidate",
                id: cand.id,
                resumeUrl: cand.resumeUrl,
            }),
        });

        if (!response.ok) {
             const text = await response.text();
             throw new Error(`N8N webhook failed: ${response.statusText} - ${text}`);
        }
    } catch (e) {
        console.error("Failed to trigger n8n:", e);
        throw new Error("Failed to trigger parsing workflow");
    }

    return { success: true };
}

export async function triggerJobParsingAction(jobId: string) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) throw new Error("Unauthorized");

    const job = await db.query.jobPosting.findFirst({
        where: eq(jobPosting.id, jobId)
    });

    if (!job) throw new Error("Job not found");

    const membership = await db.query.organizationMember.findFirst({
        where: and(
            eq(organizationMember.organizationId, job.organizationId),
            eq(organizationMember.userId, session.user.id)
        )
    });

    if (!membership) throw new Error("Unauthorized");

     if (!process.env.N8N_PARSING_WEBHOOK_URL) {
        console.warn("N8N_PARSING_WEBHOOK_URL not configured. Skipping webhook call.");
        return { success: false, message: "N8N_PARSING_WEBHOOK_URL not configured" };
    }

    try {
        const response = await fetch(process.env.N8N_PARSING_WEBHOOK_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                type: "job",
                id: job.id,
                description: job.description,
            }),
        });

         if (!response.ok) {
             const text = await response.text();
             throw new Error(`N8N webhook failed: ${response.statusText} - ${text}`);
        }
    } catch (e) {
        console.error("Failed to trigger n8n:", e);
        throw new Error("Failed to trigger parsing workflow");
    }

    return { success: true };
}
