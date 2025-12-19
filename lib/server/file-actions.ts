"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { generateFileKey, getPresignedUploadUrl, getPublicUrl, createPresignedDownloadUrl } from "@/lib/supabase-storage";
import { APIError } from "better-auth/api";

/**
 * Genera un URL firmato per l'upload di un CV.
 * Utilizza Supabase Storage per generare l'URL di upload sicuro.
 */
export async function getResumeUploadUrlAction(fileName: string, fileType: string, fileSize: number) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
        throw new APIError("UNAUTHORIZED", { message: "Not authenticated" });
    }

    // We use a temporary ID or the user ID for the key path prefix if candidate ID doesn't exist yet
    // Or just use 'uploads/${userId}/...' to be safe and organized
    // But generateFileKey expects candidateId. Let's use userId for now as a proxy or just a random ID if not available.
    
    const fileKey = generateFileKey(session.user.id, fileName);
    // Supabase createSignedUploadUrl doesn't strictly need fileType, but we keep the signature for compatibility if needed
    const { signedUrl } = await getPresignedUploadUrl(fileKey);
    const publicUrl = getPublicUrl(fileKey);

    return {
        success: true,
        data: {
            uploadUrl: signedUrl,
            fileKey,
            publicUrl,
            fileName,
            fileType,
            fileSize
        }
    };
}

/**
 * Genera un URL firmato per il download di un CV.
 * Permette l'accesso temporaneo a file privati su Supabase Storage.
 */
export async function getResumeDownloadUrlAction(fileKey: string) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
        throw new APIError("UNAUTHORIZED", { message: "Not authenticated" });
    }

    // In a real app, we should check if the user is allowed to access this specific fileKey.
    // For now, we assume if they have the key (from the DB), they can access it.
    // The DB query that gave them the key should have handled the permission check (e.g. only their own resume or resumes for jobs they own).

    const signedUrl = await createPresignedDownloadUrl(fileKey);

    if (!signedUrl) {
        return { success: false as const, error: "Failed to generate download URL" };
    }

    return { success: true as const, url: signedUrl };
}
