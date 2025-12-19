"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { candidate, candidateFile } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import { createPresignedDownloadUrl, deleteFile } from "@/lib/supabase-storage";
import { fallbackResumeParsingAction } from "./ai-actions";

/**
 * Recupera il profilo del candidato associato all'utente corrente.
 * Include l'elenco dei file (CV) caricati.
 */
export async function getCandidateProfileAction() {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) {
            return null;
        }

        const candidateProfile = await db.query.candidate.findFirst({
            where: eq(candidate.userId, session.user.id),
            with: {
                files: {
                    orderBy: (files, { desc }) => [desc(files.createdAt)],
                },
            },
        });

        return candidateProfile || null;
    } catch (error) {
        console.error("Error fetching candidate profile:", error);
        return null;
    }
}

/**
 * Imposta un file (CV) specifico come CV predefinito per il candidato.
 * Aggiorna il record del candidato con il nuovo URL e data di aggiornamento.
 */
export async function setDefaultResumeAction(fileId: string) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) throw new Error("Unauthorized");

    const existingCandidate = await db.query.candidate.findFirst({
        where: eq(candidate.userId, session.user.id),
    });

    if (!existingCandidate) throw new Error("Candidate profile not found");

    console.log(`[deleteResumeAction] Attempting to delete fileId: ${fileId} for candidate: ${existingCandidate.id}`);

    const file = await db.query.candidateFile.findFirst({
        where: eq(candidateFile.id, fileId),
    });

    if (!file) {
        console.error(`[deleteResumeAction] File not found in DB: ${fileId}`);
    } else if (file.candidateId !== existingCandidate.id) {
        console.error(`[deleteResumeAction] Access denied. File owner: ${file.candidateId}, Current candidate: ${existingCandidate.id}`);
    }

    if (!file || file.candidateId !== existingCandidate.id) {
        throw new Error("File not found or access denied");
    }

    await db.update(candidate)
        .set({
            resumeUrl: file.url,
            resumeLastUpdatedAt: new Date(),
        })
        .where(eq(candidate.id, existingCandidate.id));

    revalidatePath("/dashboard/candidate/profile/resume");
}

/**
 * Elimina un CV dal sistema (sia dal database che dallo storage).
 * Se il file eliminato era quello predefinito, cerca di impostarne un altro come nuovo default.
 */
export async function deleteResumeAction(fileId: string) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) throw new Error("Unauthorized");

    const existingCandidate = await db.query.candidate.findFirst({
        where: eq(candidate.userId, session.user.id),
    });

    if (!existingCandidate) throw new Error("Candidate profile not found");

    const file = await db.query.candidateFile.findFirst({
        where: eq(candidateFile.id, fileId),
    });

    if (!file || file.candidateId !== existingCandidate.id) {
        throw new Error("File not found or access denied");
    }

    // Delete from storage
    try {
        await deleteFile(file.fileKey);
    } catch (e) {
        console.error("Failed to delete file from storage:", e);
        // Continue to delete from DB even if storage deletion fails (to keep DB clean)
    }

    // Delete from DB
    await db.delete(candidateFile).where(eq(candidateFile.id, fileId));

    // If this was the default resume, clear it
    if (existingCandidate.resumeUrl === file.url) {
        // Try to find another file to set as default (the most recent one remaining)
        const nextFile = await db.query.candidateFile.findFirst({
            where: eq(candidateFile.candidateId, existingCandidate.id),
            orderBy: (files, { desc }) => [desc(files.createdAt)],
        });

        await db.update(candidate)
            .set({
                resumeUrl: nextFile ? nextFile.url : null,
                resumeLastUpdatedAt: new Date(),
            })
            .where(eq(candidate.id, existingCandidate.id));
    }

    revalidatePath("/dashboard/candidate/profile/resume");
}

/**
 * Carica un nuovo CV per il candidato, lo salva nel DB e avvia il processo di parsing (n8n o fallback AI).
 */
export async function updateCandidateResumeAction(data: {
    resumeUrl: string;
    resumeKey: string;
    resumeFileName: string;
    resumeType: string;
    resumeSize: number;
}) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
        throw new Error("Unauthorized");
    }

    const existingCandidate = await db.query.candidate.findFirst({
        where: eq(candidate.userId, session.user.id),
    });

    if (!existingCandidate) {
        throw new Error("Candidate profile not found");
    }

    const now = new Date();

    // Update candidate profile
    await db.update(candidate)
        .set({
            resumeUrl: data.resumeUrl,
            resumeLastUpdatedAt: now,
        })
        .where(eq(candidate.id, existingCandidate.id));

    // Save file record
    await db.insert(candidateFile).values({
        id: nanoid(),
        candidateId: existingCandidate.id,
        url: data.resumeUrl,
        fileKey: data.resumeKey,
        fileName: data.resumeFileName,
        fileType: data.resumeType,
        fileSize: data.resumeSize,
    });

    // Trigger N8N parsing workflow
    if (process.env.N8N_PARSING_WEBHOOK_URL) {
        try {
            // Generate a presigned URL for n8n to download the file
            // The file is in a private bucket, so we need a signed URL
            const signedUrl = await createPresignedDownloadUrl(data.resumeKey);
            
            if (signedUrl) {
                await fetch(process.env.N8N_PARSING_WEBHOOK_URL, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        type: "candidate",
                        id: existingCandidate.id,
                        resume: {
                            url: signedUrl,
                            fileName: data.resumeFileName,
                        }
                    }),
                });
            } else {
                console.error("Failed to generate signed URL for N8N parsing");
            }
        } catch (e) {
            console.error("Failed to trigger N8N parsing workflow:", e);
        }
    } else {
        // Fallback: Use Mistral OCR + Vercel AI SDK directly
        await fallbackResumeParsingAction(existingCandidate.id, data.resumeKey);
    }

    revalidatePath("/dashboard/candidate/profile/resume");
    return { success: true };
}

/**
 * Recupera i dettagli di un candidato tramite il suo ID.
 * Utilizzato principalmente lato HR/Azienda per visualizzare i profili.
 */
export async function getCandidateByIdAction(candidateId: string) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) {
            return { success: false, error: "Unauthorized" };
        }

        const candidateData = await db.query.candidate.findFirst({
            where: eq(candidate.id, candidateId),
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
            },
            with: {
                files: {
                    orderBy: (files, { desc }) => [desc(files.createdAt)],
                },
            },
        });

        if (!candidateData) {
            return { success: false, error: "Candidate not found" };
        }

        return { success: true, data: candidateData };
    } catch (error) {
        console.error("Error fetching candidate:", error);
        return { success: false, error: "Failed to fetch candidate" };
    }
}
