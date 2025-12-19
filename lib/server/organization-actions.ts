"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { organizationMember as memberSchema, organization, jobPosting } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { orgOwnerRole, orgAdminRole, orgMemberRole } from "@/lib/permissions";
import { APIError } from "better-auth/api";
import { cache } from "react";

/**
 * Recupera l'organizzazione attiva dalla sessione corrente.
 * Utilizza la cache di React.
 */
export const getActiveOrganizationAction = cache(async () => {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    if (!session?.session.activeOrganizationId) return null;
    
    return await auth.api.getFullOrganization({
        query: {
            organizationId: session.session.activeOrganizationId
        },
        headers: await headers()
    });
});

/**
 * Recupera i dettagli di un'organizzazione specifica tramite ID.
 * Utilizza la cache di React.
 */
export const getOrganizationAction = cache(async (organizationId: string) => {
    return await auth.api.getFullOrganization({
        query: {
            organizationId
        },
        headers: await headers()
    });
});

async function checkOrgPermission(organizationId: string, permission: Record<string, string[]>) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) throw new APIError("UNAUTHORIZED", { message: "Not authenticated" });

    if (session.user.role === "admin") return;

    const currentMember = await db.query.organizationMember.findFirst({
        where: and(
            eq(memberSchema.organizationId, organizationId),
            eq(memberSchema.userId, session.user.id)
        )
    });

    if (!currentMember) {
         throw new APIError("FORBIDDEN", { message: "Unauthorized" });
    }

    const roleMap = {
        owner: orgOwnerRole,
        admin: orgAdminRole,
        member: orgMemberRole
    };
    const role = roleMap[currentMember.role as keyof typeof roleMap];
    
    const authorization = (role as typeof orgOwnerRole).authorize(permission as Parameters<typeof orgOwnerRole.authorize>[0]);
    if (!authorization.success) {
         throw new APIError("FORBIDDEN", { message: "Permission denied" });
    }
}

/**
 * Aggiorna i dati di un'organizzazione.
 * Richiede permessi di aggiornamento sull'organizzazione.
 */
export async function updateOrganizationAction(data: {
    organizationId: string;
    data: {
        name?: string;
        slug?: string;
        logo?: string;
        metadata?: Record<string, unknown>;
    }
}) {
    await checkOrgPermission(data.organizationId, { organization: ["update"] });
    return await auth.api.updateOrganization({
        body: {
            organizationId: data.organizationId,
            data: data.data
        },
        headers: await headers()
    })
}

/**
 * Crea una nuova organizzazione.
 */
export async function createOrganizationAction(data: {
  name: string;
  slug: string;
  logo?: string;
  metadata?: Record<string, unknown>;
}) {
  return await auth.api.createOrganization({
    body: {
        ...data,
        metadata: data.metadata || {}
    },
    headers: await headers(),
  });
}

/**
 * Verifica se uno slug per l'organizzazione è disponibile.
 */
export async function checkOrganizationSlugAction(slug: string) {
  return await auth.api.checkOrganizationSlug({
    body: { slug },
    headers: await headers()
  });
}

/**
 * Recupera un'organizzazione pubblica tramite slug.
 * Include gli annunci di lavoro pubblicati dell'organizzazione.
 */
export async function getPublicOrganizationBySlug(slug: string) {
    const org = await db.query.organization.findFirst({
        where: eq(organization.slug, slug),
    });

    if (!org) return undefined;

    const jobs = await db.query.jobPosting.findMany({
        where: and(
            eq(jobPosting.organizationId, org.id),
            eq(jobPosting.status, "published")
        ),
        orderBy: [desc(jobPosting.createdAt)]
    });

    return {
        ...org,
        jobPostings: jobs
    };
}

/**
 * Elenca le organizzazioni a cui appartiene l'utente corrente.
 * Supporta paginazione, ricerca e ordinamento.
 * Utilizza la cache di React.
 */
export const listOrganizationsAction = cache(async (query?: {
    limit?: number;
    offset?: number;
    searchValue?: string;
    sortBy?: string;
    sortDirection?: "asc" | "desc";
}) => {
    return await auth.api.listOrganizations({
        query: query || {},
        headers: await headers()
    })
});

/**
 * Aggiunge un membro direttamente all'organizzazione.
 * Richiede permessi di creazione membri.
 */
export async function addMemberAction(data: {
    organizationId: string;
    userId: string;
    role: "owner" | "admin" | "member";
}) {
    await checkOrgPermission(data.organizationId, { member: ["create"] });
    return await auth.api.addMember({
        body: data,
        headers: await headers()
    })
}

/**
 * Invia un invito via email per unirsi all'organizzazione.
 * Richiede permessi di creazione inviti.
 */
export async function inviteMemberAction(data: {
    organizationId: string;
    email: string;
    role: "owner" | "admin" | "member";
}) {
    await checkOrgPermission(data.organizationId, { invitation: ["create"] });
    return await auth.api.createInvitation({
        body: data,
        headers: await headers()
    })
}

/**
 * Rimuove un membro dall'organizzazione.
 * Richiede permessi di rimozione membri.
 */
export async function removeMemberAction(data: {
    organizationId: string;
    memberIdOrEmail: string;
}) {
    await checkOrgPermission(data.organizationId, { member: ["delete"] });
    return await auth.api.removeMember({
        body: data,
        headers: await headers()
    })
}

/**
 * Aggiorna il ruolo di un membro dell'organizzazione.
 * Richiede permessi di aggiornamento membri.
 */
export async function updateMemberRoleAction(data: {
    organizationId: string;
    memberId: string;
    role: "owner" | "admin" | "member";
}) {
    await checkOrgPermission(data.organizationId, { member: ["update"] });
    return await auth.api.updateMemberRole({
        body: data,
        headers: await headers()
    })
}

/**
 * Imposta l'organizzazione attiva per la sessione corrente.
 * Richiede permessi di lettura sull'organizzazione.
 */
export async function setActiveOrganizationAction(organizationId: string) {
    await checkOrgPermission(organizationId, { organization: ["read"] });
    return await auth.api.setActiveOrganization({
        body: {
            organizationId
        },
        headers: await headers()
    })
}

export const getOrganizationMemberAction = cache(async (organizationId: string, memberId: string) => {
    const member = await db.query.organizationMember.findFirst({
        where: and(
            eq(memberSchema.id, memberId),
            eq(memberSchema.organizationId, organizationId)
        ),
        with: {
            user: true
        }
    });
    return member;
});

export async function createTeamAction(data: {
    organizationId: string;
    name: string;
}) {
    await checkOrgPermission(data.organizationId, { team: ["create"] });
    return await auth.api.createTeam({
        body: data,
        headers: await headers()
    })
}

/**
 * Elimina un team dall'organizzazione.
 * Richiede permessi di eliminazione team.
 */
export async function deleteTeamAction(data: {
    organizationId: string;
    teamId: string;
}) {
    await checkOrgPermission(data.organizationId, { team: ["delete"] });
    return await auth.api.removeTeam({
        body: data,
        headers: await headers()
    })
}

export const listTeamsAction = cache(async (organizationId: string) => {
    await checkOrgPermission(organizationId, { team: ["read"] });
    return await auth.api.listOrganizationTeams({
        query: {
            organizationId
        },
        headers: await headers()
    })
});

/**
 * Aggiunge un utente a un team.
 * Richiede permessi di aggiornamento team.
 */
export async function addTeamMemberAction(data: {
    teamId: string;
    userId: string;
    role?: string;
    organizationId: string;
}) {
    await checkOrgPermission(data.organizationId, { team: ["update"] });
    return await auth.api.addTeamMember({
        body: data,
        headers: await headers()
    })
}



export async function cancelInvitationAction(invitationId: string) {
    const invitation = await auth.api.getInvitation({
        query: {
            id: invitationId
        },
        headers: await headers()
    });

    if (invitation) {
        await checkOrgPermission(invitation.organizationId, { invitation: ["cancel"] });
    }

    return await auth.api.cancelInvitation({
        body: {
            invitationId
        },
        headers: await headers()
    })
}

/**
 * Accetta un invito a unirsi a un'organizzazione.
 */
export async function acceptInvitationAction(invitationId: string) {
    return await auth.api.acceptInvitation({
        body: {
            invitationId
        },
        headers: await headers()
    })
}

export async function rejectInvitationAction(invitationId: string) {
    return await auth.api.rejectInvitation({
        body: {
            invitationId
        },
        headers: await headers()
    })
}

export async function getInvitationAction(invitationId: string) {
    return await auth.api.getInvitation({
        query: {
            id: invitationId
        },
        headers: await headers()
    })
}

/**
 * Elenca gli inviti pendenti di un'organizzazione.
 * Richiede permessi di lettura inviti.
 */
export async function listInvitationsAction(organizationId: string) {
    await checkOrgPermission(organizationId, { invitation: ["read"] });
    return await auth.api.listInvitations({
        query: {
            organizationId
        },
        headers: await headers()
    })
}

/**
 * Rimuove un membro da un team.
 * Richiede permessi di aggiornamento team.
 */
export async function removeTeamMemberAction(data: {
    teamId: string;
    userId: string;
    organizationId: string;
}) {
    await checkOrgPermission(data.organizationId, { team: ["update"] });
    return await auth.api.removeTeamMember({
        body: data,
        headers: await headers()
    })
}

/**
 * Permette all'utente corrente di lasciare un'organizzazione.
 * Richiede permessi di "leave" sull'organizzazione.
 */
export async function leaveOrganizationAction(organizationId: string) {
    await checkOrgPermission(organizationId, { organization: ["leave"] });
    const session = await auth.api.getSession({
        headers: await headers()
    });
    if (!session) {
        throw new Error("Not authenticated");
    }
    return await auth.api.removeMember({
        body: {
            organizationId,
            memberIdOrEmail: session.user.id
        },
        headers: await headers()
    })
}
