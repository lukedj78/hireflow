import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { organizationMember as memberSchema } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { orgOwnerRole, orgAdminRole, orgMemberRole, orgHRRole } from "@/lib/permissions";
import { APIError } from "better-auth/api";

export async function checkOrgPermission(organizationId: string, permission: Record<string, string[]>) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) throw new APIError("UNAUTHORIZED", { message: "Not authenticated" });

    // Admins have full access to everything
    if (session.user.role === "admin") return;

    const currentMember = await db.query.organizationMember.findFirst({
        where: and(
            eq(memberSchema.organizationId, organizationId),
            eq(memberSchema.userId, session.user.id)
        )
    });

    if (!currentMember) {
         throw new APIError("FORBIDDEN", { message: "You are not a member of this organization" });
    }

    const roleMap = {
        owner: orgOwnerRole,
        admin: orgAdminRole,
        member: orgMemberRole,
        hr: orgHRRole
    };
    
    const role = roleMap[currentMember.role as keyof typeof roleMap];
    if (!role) {
        throw new APIError("FORBIDDEN", { message: "Invalid role" });
    }
    
    // We use the inferred type from one of the roles to ensure type safety
    const authorization = (role as typeof orgOwnerRole).authorize(permission as Parameters<typeof orgOwnerRole.authorize>[0]);
    if (!authorization.success) {
         throw new APIError("FORBIDDEN", { message: "Permission denied" });
    }
    
    return currentMember;
}
