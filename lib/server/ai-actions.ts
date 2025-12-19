"use server";

import { db } from "@/lib/db";
import { candidate, jobPosting, application, organizationMember } from "@/lib/db/schema";
import { eq, sql, and } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { generateObject, embed } from 'ai';
import { mistral } from '@ai-sdk/mistral';
import { z } from 'zod';
import { revalidatePath } from "next/cache";
import { createPresignedDownloadUrl } from "@/lib/supabase-storage";

/**
 * Esegue l'OCR su un file PDF tramite le API di Mistral.
 * Recupera il file dall'URL fornito (convertendolo in base64 se necessario)
 * e invia una richiesta a Mistral per estrarre il testo.
 */
async function runOCR(pdfUrl: string) {
    const apiKey = process.env.MISTRAL_API_KEY || process.env.AI_GATEWAY_API_KEY;
    if (!apiKey) throw new Error("Missing MISTRAL_API_KEY or AI_GATEWAY_API_KEY");

    // Mistral OCR requires the file to be accessible via URL or base64.
    // Since the resumeUrl might be a private Supabase URL, we should fetch it and convert to base64
    // OR use the presigned URL if it's public/accessible.
    // Safe bet: fetch and base64.
    
    try {
        const response = await fetch(pdfUrl);
        if (!response.ok) throw new Error(`Failed to fetch PDF: ${response.statusText}`);
        
        const arrayBuffer = await response.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');

        const ocrResponse = await fetch("https://api.mistral.ai/v1/ocr", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "mistral-ocr-latest",
                document: {
                    type: "document_url",
                    document_url: `data:application/pdf;base64,${base64}`
                }
            })
        });

        if (!ocrResponse.ok) {
            const errorText = await ocrResponse.text();
            throw new Error(`Mistral OCR failed: ${ocrResponse.status} ${errorText}`);
        }

        const data = await ocrResponse.json();
        // Combine text from pages
        return data.pages.map((p: { markdown: string }) => p.markdown).join("\n\n");
    } catch (error) {
        console.error("runOCR failed:", error);
        throw error;
    }
}

/**
 * Esegue il parsing di fallback del CV utilizzando OCR (Mistral) e AI.
 * Scarica il PDF, estrae il testo tramite OCR, strutturalizza i dati con Mistral,
 * genera un embedding e aggiorna il record del candidato nel database.
 */
export async function fallbackResumeParsingAction(candidateId: string, resumeKey: string) {
    try {
        console.log("N8N_PARSING_WEBHOOK_URL not set. Using Mistral OCR fallback...");
        
        // 1. Get signed URL for download
        const signedUrl = await createPresignedDownloadUrl(resumeKey);
        if (!signedUrl) throw new Error("Failed to generate download URL for OCR");

        // 2. Perform OCR
        const ocrText = await runOCR(signedUrl);
        console.log("OCR Success, extracting data...");

        // 3. Parse with AI
        const resumeSchema = z.object({
            skills: z.array(z.string()).describe("Technical and soft skills"),
            experience: z.array(z.object({
                company: z.string(),
                role: z.string(),
                startDate: z.string(),
                endDate: z.string().optional(),
                description: z.string(),
            })).describe("Professional experience"),
            education: z.array(z.object({
                institution: z.string(),
                degree: z.string(),
                startDate: z.string(),
                endDate: z.string().optional(),
            })).describe("Educational background"),
            summary: z.string().describe("Professional summary"),
            years_of_experience: z.number().describe("Total years of experience"),
            seniority_level: z.enum(["Junior", "Mid", "Senior", "Lead", "Executive"]).describe("Seniority level"),
        });

        const result = await generateObject({
            model: mistral('mistral-large-latest'),
            schema: resumeSchema,
            prompt: `You are an expert HR Recruiter. Analyze this resume text and extract structured data:\n\n${ocrText}`,
        });

        const parsedData = result.object;

        // 4. Generate Embedding
        const textToEmbed = `
            Summary: ${parsedData.summary}
            Seniority: ${parsedData.seniority_level}
            Years of Experience: ${parsedData.years_of_experience}
            Skills: ${parsedData.skills.join(", ")}
            Experience: ${JSON.stringify(parsedData.experience)}
        `.trim();

        const embedding = await generateEmbedding(textToEmbed);

        // 5. Update Database
        await db.update(candidate)
            .set({
                skills: JSON.stringify(parsedData.skills),
                experience: JSON.stringify(parsedData.experience),
                education: JSON.stringify(parsedData.education),
                summary: parsedData.summary,
                yearsOfExperience: parsedData.years_of_experience,
                seniority: parsedData.seniority_level,
                embedding: embedding,
                updatedAt: new Date(),
            })
            .where(eq(candidate.id, candidateId));

        console.log(`Successfully parsed resume for candidate ${candidateId} using AI fallback`);
        return { success: true };

    } catch (error) {
        console.error("AI Fallback parsing failed:", error);
        return { success: false, error: error instanceof Error ? error.message : "AI Fallback parsing failed" };
    }
}

/**
 * Genera un embedding vettoriale per una stringa di testo utilizzando il modello 'text-embedding-3-small'.
 * Utilizzato per creare rappresentazioni semantiche di CV e Job Description.
 */
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

/**
 * Trova i candidati più compatibili per una specifica offerta di lavoro (Job Posting).
 * Utilizza la ricerca vettoriale (cosine distance) tra l'embedding della JD e quelli dei candidati
 * per restituire i profili più pertinenti ordinati per similarità.
 */
export async function findMatchingCandidatesAction(jobId: string, limit: number = 10) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) return { success: false, error: "Unauthorized" };

        const job = await db.query.jobPosting.findFirst({
            where: eq(jobPosting.id, jobId),
        });

        if (!job) return { success: false, error: "Job not found" };

        const membership = await db.query.organizationMember.findFirst({
            where: and(
                eq(organizationMember.organizationId, job.organizationId),
                eq(organizationMember.userId, session.user.id)
            )
        });

        if (!membership) return { success: false, error: "Unauthorized" };

        if (!job.embedding) {
            return { success: false, error: "Job posting has no embedding. Please update the job description to generate one." };
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

        return { success: true, data: similarCandidates };
    } catch (error) {
        console.error("findMatchingCandidatesAction failed:", error);
        return { success: false, error: error instanceof Error ? error.message : "Failed to find matching candidates" };
    }
}

/**
 * Genera un'analisi dettagliata del match tra un candidato e una job posting.
 * Utilizza GPT-4o per confrontare le competenze del candidato con i requisiti dell'offerta,
 * fornendo uno score (0-100), un'analisi testuale, punti di forza e debolezze.
 */
export async function generateMatchAnalysisAction(applicationId: string) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) return { success: false, error: "Unauthorized" };

        const app = await db.query.application.findFirst({
            where: eq(application.id, applicationId),
            with: {
                candidate: {
                    columns: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        resumeUrl: true,
                        skills: true,
                        experience: true,
                        education: true,
                        summary: true,
                        yearsOfExperience: true,
                        seniority: true,
                        resumeLastUpdatedAt: true,
                        userId: true,
                        createdAt: true,
                        updatedAt: true,
                    }
                },
                jobPosting: {
                    columns: {
                        id: true,
                        title: true,
                        slug: true,
                        description: true,
                        location: true,
                        type: true,
                        salaryRange: true,
                        status: true,
                        parsedRequirements: true,
                        organizationId: true,
                        createdAt: true,
                        updatedAt: true,
                    }
                },
            }
        });

        if (!app) return { success: false, error: "Application not found" };

        const membership = await db.query.organizationMember.findFirst({
            where: and(
                eq(organizationMember.organizationId, app.jobPosting.organizationId),
                eq(organizationMember.userId, session.user.id)
            )
        });

        if (!membership) return { success: false, error: "Unauthorized" };

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

        return { success: true, data: object };
    } catch (error) {
        console.error("generateMatchAnalysisAction failed:", error);
        return { success: false, error: error instanceof Error ? error.message : "Failed to generate analysis" };
    }
}

/**
 * Attiva il workflow asincrono (n8n) per il parsing del CV di un candidato.
 * Verifica che l'utente abbia i permessi necessari (sia membro dell'organizzazione che ha ricevuto la candidatura)
 * e invia una richiesta al webhook configurato per l'elaborazione del file.
 */
export async function triggerCandidateParsingAction(candidateId: string) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) return { success: false, error: "Unauthorized" };

        // Check if candidate exists
        const cand = await db.query.candidate.findFirst({
            where: eq(candidate.id, candidateId)
        });
        if (!cand) return { success: false, error: "Candidate not found" };

        // Check authorization: User must be a member of an organization that has an application from this candidate
        const apps = await db.query.application.findMany({
            where: eq(application.candidateId, candidateId),
            with: {
                jobPosting: {
                    columns: {
                        id: true,
                        title: true,
                        slug: true,
                        description: true,
                        location: true,
                        type: true,
                        salaryRange: true,
                        status: true,
                        parsedRequirements: true,
                        organizationId: true,
                        createdAt: true,
                        updatedAt: true,
                    }
                }
            }
        });

        if (apps.length === 0) {
            return { success: false, error: "No applications found for this candidate" };
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
            return { success: false, error: "You are not authorized to perform this action" };
        }

        if (!process.env.N8N_PARSING_WEBHOOK_URL) {
            console.warn("N8N_PARSING_WEBHOOK_URL not configured. Skipping webhook call.");
            return { success: false, error: "N8N_PARSING_WEBHOOK_URL not configured" };
        }

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
                return { success: false, error: `N8N webhook failed: ${response.statusText} - ${text}` };
        }

        // Revalidate relevant paths
        revalidatePath("/[locale]/dashboard/candidate/profile");
        for (const app of apps) {
            revalidatePath(`/[locale]/dashboard/${app.jobPosting.organizationId}/jobs/${app.jobPosting.id}/applications`);
            revalidatePath(`/[locale]/dashboard/${app.jobPosting.organizationId}/jobs/${app.jobPosting.id}/pipeline`);
        }

        return { success: true };
    } catch (error) {
        console.error("triggerCandidateParsingAction failed:", error);
        return { success: false, error: error instanceof Error ? error.message : "Failed to trigger parsing workflow" };
    }
}

/**
 * Attiva il workflow asincrono (n8n) per l'analisi di una Job Posting.
 * Invia i dettagli dell'offerta al webhook per generare embedding e strutturare i requisiti,
 * aggiornando poi il database.
 */
export async function triggerJobParsingAction(jobId: string) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) return { success: false, error: "Unauthorized" };

        const job = await db.query.jobPosting.findFirst({
            where: eq(jobPosting.id, jobId)
        });

        if (!job) return { success: false, error: "Job not found" };

        const membership = await db.query.organizationMember.findFirst({
            where: and(
                eq(organizationMember.organizationId, job.organizationId),
                eq(organizationMember.userId, session.user.id)
            )
        });

        if (!membership) return { success: false, error: "Unauthorized" };

         if (!process.env.N8N_PARSING_WEBHOOK_URL) {
            console.warn("N8N_PARSING_WEBHOOK_URL not configured. Skipping webhook call.");
            return { success: false, error: "N8N_PARSING_WEBHOOK_URL not configured" };
        }

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
             return { success: false, error: `N8N webhook failed: ${response.statusText} - ${text}` };
        }

        revalidatePath(`/[locale]/dashboard/${job.organizationId}/jobs/${job.id}`);
        revalidatePath(`/[locale]/dashboard/${job.organizationId}/jobs/${job.id}/suggestions`);

        return { success: true };
    } catch (error) {
        console.error("triggerJobParsingAction failed:", error);
        return { success: false, error: error instanceof Error ? error.message : "Failed to trigger parsing workflow" };
    }
}
