"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { APIError } from "better-auth/api";
import { db } from "@/lib/db";
import { account, user, organization, team } from "@/lib/db/schema";
import { eq, and, count, sql } from "drizzle-orm";
import { globalAdminRole } from "@/lib/permissions";
import { cache } from "react";

async function checkAdminPermission(permission: Record<string, string[]>) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) throw new APIError("UNAUTHORIZED", { message: "Not authenticated" });
    
    if (session.user.role !== "admin") {
        throw new APIError("FORBIDDEN", { message: "You must be an admin to perform this action" });
    }

    const authorization = globalAdminRole.authorize(permission as Parameters<typeof globalAdminRole.authorize>[0]);
    if (!authorization.success) {
        throw new APIError("FORBIDDEN", { message: "Permission denied" });
    }
}

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

export async function unbanUserAction(userId: string) {
  await checkAdminPermission({ user: ["unban"] });
  return await auth.api.unbanUser({
    body: {
      userId,
    },
    headers: await headers(),
  });
}

export async function removeUserAction(userId: string) {
  await checkAdminPermission({ user: ["delete"] });
  return await auth.api.removeUser({
    body: {
      userId,
    },
    headers: await headers(),
  });
}

export async function adminUnlinkUserAccountAction(userId: string, providerId: string) {
    await checkAdminPermission({ user: ["unlink-account"] });
    await db.delete(account).where(and(eq(account.userId, userId), eq(account.providerId, providerId)));
    return { success: true };
}

export async function impersonateUserAction(userId: string) {
  await checkAdminPermission({ user: ["impersonate"] });
  return await auth.api.impersonateUser({
    body: {
      userId,
    },
    headers: await headers(),
  });
}

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

export const listUserAccountsAction = cache(async (userId: string) => {
    await checkAdminPermission({ user: ["read"] });
    const accounts = await db.select().from(account).where(eq(account.userId, userId));
    return { data: accounts, error: null };
});

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
