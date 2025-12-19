"use server";

import { db } from "@/lib/db";
import { verification, user as userTable } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * Verifica l'indirizzo email di un utente tramite un token.
 * Controlla la validità e la scadenza del token.
 * Se valido, segna l'email come verificata e rimuove il token.
 */
export async function verifyEmailAction(token: string) {
  try {
    const tokenData = await db.query.verification.findFirst({
      where: eq(verification.value, token),
    });



    if (!tokenData) {
      throw new Error("Invalid verification token.");
    }

    if (tokenData.expiresAt < new Date()) {
      throw new Error("Verification token has expired.");
    }

    await db
      .update(userTable)
      .set({ emailVerified: true })
      .where(eq(userTable.email, tokenData.identifier));

    await db.delete(verification).where(eq(verification.value, token));

    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to verify email" };
  }
}
