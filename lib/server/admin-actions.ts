"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { APIError } from "better-auth/api";
import { db } from "@/lib/db";
import { account, user, organization, team } from "@/lib/db/schema";
import { eq, and, count, sql } from "drizzle-orm";
import { adminRole } from "@/lib/permissions";
import { cache } from "react";
import { NotificationService } from "@/lib/services/notification-service";

async function checkAdminPermission(permission: Record<string, string[]>) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) throw new APIError("UNAUTHORIZED", { message: "Not authenticated" });
    
    if (session.user.role !== "admin") {
        throw new APIError("FORBIDDEN", { message: "You must be an admin to perform this action" });
    }

    const authorization = adminRole.authorize(permission as Parameters<typeof adminRole.authorize>[0]);
    if (!authorization.success) {
        throw new APIError("FORBIDDEN", { message: "Permission denied" });
    }
}

/**
 * Crea un nuovo utente nel sistema.
 * Richiede permessi di amministratore.
 */
export async function createUserAction(data: {
  email: string;
  password: string;
  name: string;
  role?: "user" | "admin";
  data?: Record<string, unknown>;
}) {
  await checkAdminPermission({ user: ["create"] });
  return await auth.api.createUser({
    body: {
        ...data,
        data: data.data || {},
        role: data.role || "user"
    },
    headers: await headers(),
  });
}

/**
 * Recupera la lista degli utenti con supporto a paginazione, ricerca e ordinamento.
 * Richiede permessi di amministratore.
 */
export const listUsersAction = cache(async (query?: {
  limit?: number;
  offset?: number;
  searchValue?: string;
  searchField?: "email" | "name";
  sortBy?: string;
  sortDirection?: "asc" | "desc";
}) => {
  await checkAdminPermission({ user: ["list"] });
  return await auth.api.listUsers({
    query: query || {},
    headers: await headers(),
  });
});

/**
 * Recupera i dettagli di un singolo utente.
 * Richiede permessi di amministratore.
 */
export const getUserAction = cache(async (userId: string) => {
    await checkAdminPermission({ user: ["read"] });
    const [foundUser] = await db.select().from(user).where(eq(user.id, userId));
    return foundUser;
});

/**
 * Banna un utente dal sistema, impedendogli l'accesso.
 * Richiede permessi di amministratore.
 */
export async function banUserAction(userId: string, reason?: string) {
  await checkAdminPermission({ user: ["ban"] });
  return await auth.api.banUser({
    body: {
      userId,
      banReason: reason,
    },
    headers: await headers(),
  });
}

/**
 * Rimuove il ban da un utente, ripristinandone l'accesso.
 * Richiede permessi di amministratore.
 */
export async function unbanUserAction(userId: string) {
  await checkAdminPermission({ user: ["unban"] });
  return await auth.api.unbanUser({
    body: {
      userId,
    },
    headers: await headers(),
  });
}

/**
 * Elimina definitivamente un utente dal sistema.
 * Richiede permessi di amministratore.
 */
export async function removeUserAction(userId: string) {
  await checkAdminPermission({ user: ["delete"] });
  return await auth.api.removeUser({
    body: {
      userId,
    },
    headers: await headers(),
  });
}

/**
 * Scollega un account provider (es. Google, GitHub) da un utente specifico.
 * Richiede permessi di amministratore.
 */
export async function adminUnlinkUserAccountAction(userId: string, providerId: string) {
    await checkAdminPermission({ user: ["unlink-account"] });
    await db.delete(account).where(and(eq(account.userId, userId), eq(account.providerId, providerId)));
    return { success: true };
}

/**
 * Permette a un amministratore di accedere come se fosse un altro utente (Impersonation).
 * Utile per debug e supporto.
 */
export async function impersonateUserAction(userId: string) {
  await checkAdminPermission({ user: ["impersonate"] });
  return await auth.api.impersonateUser({
    body: {
      userId,
    },
    headers: await headers(),
  });
}

/**
 * Verifica se un utente specifico possiede determinati permessi.
 * Richiede permessi di amministratore.
 */
export async function checkUserPermissionAction(userId: string, permission: Record<string, string[]>) {
    await checkAdminPermission({ user: ["read"] });
    return await auth.api.userHasPermission({
        body: {
            userId,
            permission,
        },
        headers: await headers()
    });
}

/**
 * Recupera la lista degli account collegati (es. Google, Email) di un utente.
 * Richiede permessi di amministratore.
 */
export const listUserAccountsAction = cache(async (userId: string) => {
    await checkAdminPermission({ user: ["read"] });
    const accounts = await db.select().from(account).where(eq(account.userId, userId));
    return { data: accounts, error: null };
});

/**
 * Recupera le statistiche generali del sistema per la dashboard amministrativa.
 * Include conteggi di utenti, organizzazioni, team e utenti premium.
 */
export const getAdminStatsAction = cache(async () => {
    // We reuse a permission check, e.g. listing users, to verify admin access
    await checkAdminPermission({ user: ["list"] });

    const [userCount] = await db.select({ value: count() }).from(user);
    const [orgCount] = await db.select({ value: count() }).from(organization);
    const [teamCount] = await db.select({ value: count() }).from(team);
    const [premiumUserCount] = await db.select({ value: count() }).from(user).where(eq(user.isPremium, true));

    // Get recent users (last 5)
    const recentUsers = await db.select().from(user).orderBy(sql`${user.createdAt} DESC`).limit(5);

    return {
        users: userCount?.value || 0,
        organizations: orgCount?.value || 0,
        teams: teamCount?.value || 0,
        premiumUsers: premiumUserCount?.value || 0,
        recentUsers
    };
});
