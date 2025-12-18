"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { candidate } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function getCandidateProfileAction() {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) {
            return null;
        }

        const candidateProfile = await db.query.candidate.findFirst({
            where: eq(candidate.userId, session.user.id),
        });

        return candidateProfile || null;
    } catch (error) {
        console.error("Error fetching candidate profile:", error);
        return null;
    }
}
