"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { APIError } from "better-auth/api";
import { db } from "@/lib/db";
import { user, candidate, organization, organizationMember, candidateFile } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { triggerWorkflow } from "@/lib/events";
import { createPresignedDownloadUrl } from "@/lib/supabase-storage";

async function getSession() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) throw new APIError("UNAUTHORIZED", { message: "Not authenticated" });
    return session;
}

/**
 * Recupera lo stato di onboarding dell'utente corrente.
 * Restituisce se l'onboarding è completato e il ruolo dell'utente.
 */
export async function getOnboardingStatusAction() {
    const session = await getSession();
    
    const dbUser = await db.query.user.findFirst({
        where: eq(user.id, session.user.id),
        columns: {
            onboardingCompleted: true,
            role: true
        }
    });

    return dbUser;
}

/**
 * Seleziona il tipo di account (business o candidato) per l'onboarding.
 * Imposta lo step di onboarding a 1.
 */
export async function selectOnboardingTypeAction(type: "business" | "candidate") {
    const session = await getSession();
    
    await db.update(user)
        .set({ onboardingType: type, onboardingStep: 1 })
        .where(eq(user.id, session.user.id));
        
    return { success: true };
}

export async function updateOnboardingStepAction(step: number) {
    const session = await getSession();
    
    await db.update(user)
        .set({ onboardingStep: step })
        .where(eq(user.id, session.user.id));
        
    return { success: true };
}

/**
 * Completa l'onboarding per un candidato.
 * Crea il profilo del candidato, salva eventuali file caricati e aggiorna il ruolo utente.
 * Se presente un curriculum, attiva il workflow n8n per il parsing.
 */
export async function completeCandidateOnboardingAction(data: {
    phone?: string;
    resumeUrl?: string;
    resumeBase64?: string;
    resumeFileName?: string;
    resumeKey?: string;
    resumeSize?: number;
    resumeType?: string;
    skills?: string[];
    experience?: {
        company: string;
        position: string;
        startDate: string;
        endDate?: string;
        description?: string;
    }[];
    education?: {
        institution: string;
        degree: string;
        startDate: string;
        endDate?: string;
    }[];
}) {
    const session = await getSession();
    const candidateId = nanoid();
    const now = new Date();
    
    // Create candidate profile
    const [newCandidate] = await db.insert(candidate).values({
        id: candidateId,
        userId: session.user.id,
        name: session.user.name,
        email: session.user.email,
        phone: data.phone,
        resumeUrl: data.resumeUrl,
        skills: JSON.stringify(data.skills || []),
        experience: JSON.stringify(data.experience || []),
        education: JSON.stringify(data.education || []),
        resumeLastUpdatedAt: (data.resumeUrl || data.resumeBase64) ? now : null,
    }).returning();

    // Save candidate file if Storage upload was used
    if (data.resumeKey && data.resumeUrl && data.resumeFileName) {
        await db.insert(candidateFile).values({
            id: nanoid(),
            candidateId: candidateId,
            url: data.resumeUrl,
            fileKey: data.resumeKey,
            fileName: data.resumeFileName,
            fileType: data.resumeType || "application/pdf", // Default or passed
            fileSize: data.resumeSize || 0,
        });
    }
    
    // Update user role and status
    await db.update(user)
        .set({ 
            role: "candidate", 
            onboardingCompleted: true,
            onboardingStep: 3 // Completed
        })
        .where(eq(user.id, session.user.id));
    
    // Trigger N8N parsing workflow if resume is provided
    if (data.resumeUrl || data.resumeBase64) {
        if (process.env.N8N_PARSING_WEBHOOK_URL) {
            try {
                await fetch(process.env.N8N_PARSING_WEBHOOK_URL, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        type: "candidate",
                        id: candidateId,
                        resume: {
                            url: data.resumeUrl,
                            fileName: data.resumeFileName,
                            content: data.resumeBase64,
                        }
                    }),
                });
            } catch (e) {
                console.error("Failed to trigger N8N parsing workflow:", e);
                // We don't fail the request here, just log the error
            }
        } else {
             console.warn("N8N_PARSING_WEBHOOK_URL not configured. Skipping webhook call.");
        }
    }
        
    return { success: true };
}

export async function completeBusinessOnboardingAction(data: {
    companyName: string;
    companySlug?: string;
}) {
    const session = await getSession();
    
    const slug = data.companySlug || data.companyName.toLowerCase().replace(/[^a-z0-9]/g, '-') + "-" + nanoid(4);
    const orgId = nanoid();
    
    // Create organization
    await db.insert(organization).values({
        id: orgId,
        name: data.companyName,
        slug: slug,
    });
    
    // Add user as owner
    await db.insert(organizationMember).values({
        id: nanoid(),
        organizationId: orgId,
        userId: session.user.id,
        role: "owner",
    });
    
    // Update user role and status
    await db.update(user)
        .set({ 
            role: "business", 
            onboardingCompleted: true, 
            onboardingStep: 3 
        })
        .where(eq(user.id, session.user.id));
        
    return { success: true, organizationId: orgId };
}
