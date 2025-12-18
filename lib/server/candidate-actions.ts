"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { candidate, candidateFile } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import { createPresignedDownloadUrl } from "@/lib/supabase-storage";

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
                    limit: 1,
                },
            },
        });

        return candidateProfile || null;
    } catch (error) {
        console.error("Error fetching candidate profile:", error);
        return null;
    }
}

export async function updateCandidateResumeAction(data: {
    resumeUrl: string;
    resumeKey: string;
    resumeFileName: string;
    resumeSize: number;
    resumeType: string;
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
            await fetch(process.env.N8N_PARSING_WEBHOOK_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    type: "candidate",
                    id: existingCandidate.id,
                    resume: {
                        url: data.resumeUrl,
                        fileName: data.resumeFileName,
                        // We don't have base64 here easily without client sending it, 
                        // but the new N8N workflow downloads from URL, so URL is enough!
                    }
                }),
            });
        } catch (e) {
            console.error("Failed to trigger N8N parsing workflow:", e);
        }
    }

    revalidatePath("/dashboard/candidate/profile/resume");
    return { success: true };
}
