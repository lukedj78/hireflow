"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { userSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function getUserSettingsAction() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return null;

    const settings = await db.query.userSettings.findFirst({
        where: eq(userSettings.userId, session.user.id)
    });

    if (!settings) {
        // Return defaults if no settings found
        return {
            emailNotifications: true,
            inAppNotifications: true
        };
    }

    return settings;
}

export async function updateUserSettingsAction(data: {
    emailNotifications?: boolean;
    inAppNotifications?: boolean;
}) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return { success: false, error: "Unauthorized" };

    try {
        const existingSettings = await db.query.userSettings.findFirst({
            where: eq(userSettings.userId, session.user.id)
        });

        if (existingSettings) {
            await db.update(userSettings)
                .set({
                    ...data,
                    updatedAt: new Date() // Will be handled by schema but good to be explicit or if schema needs it
                })
                .where(eq(userSettings.userId, session.user.id));
        } else {
            await db.insert(userSettings).values({
                userId: session.user.id,
                emailNotifications: data.emailNotifications ?? true,
                inAppNotifications: data.inAppNotifications ?? true,
            });
        }

        return { success: true };
    } catch (error) {
        console.error("Failed to update settings:", error);
        return { success: false, error: "Failed to update settings" };
    }
}
