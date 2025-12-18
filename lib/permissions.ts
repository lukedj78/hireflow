import { createAccessControl } from "better-auth/plugins/access";

export const statement = {
    // Admin resources
    user: ["create", "list", "read", "update", "delete", "ban", "unban", "impersonate", "unlink-account"],

    // Organization resources
    organization: ["create", "read", "update", "delete", "leave"],
    member: ["create", "read", "update", "delete"],
    invitation: ["create", "read", "cancel", "accept", "reject"],
    team: ["create", "read", "update", "delete"],

    application: ["create", "read", "update", "delete", "status", "reject", "accept"],

} as const;

export const ac = createAccessControl(statement);

export const orgOwnerRole = ac.newRole({
    organization: ["read", "update", "delete", "leave"],
    member: ["create", "read", "update", "delete"],
    invitation: ["create", "read", "cancel"],
    team: ["create", "read", "update", "delete"],
});

export const orgAdminRole = ac.newRole({
    organization: ["read", "update", "leave"],
    member: ["create", "read", "update", "delete"],
    invitation: ["create", "read", "cancel"],
    team: ["create", "read", "update", "delete"]
});

export const orgMemberRole = ac.newRole({
    organization: ["read", "leave"],
    member: ["read"],
    team: ["read"]
});

export const orgHRRole = ac.newRole({
    organization: ["read", "update", "leave"],
    application: ["read", "status", "reject", "accept"],
});

// Example roles from user request
export const userRole = ac.newRole({
    organization: ["create"],
    invitation: ["read", "accept", "reject"],
});

export const adminRole = ac.newRole({
    user: ["create", "list", "read", "update", "delete", "ban", "unban", "impersonate", "unlink-account"],
    organization: ["create", "read", "update", "delete", "leave"],
    member: ["create", "read", "update", "delete"],
    invitation: ["create", "read", "cancel", "accept", "reject"],
    team: ["create", "read", "update", "delete"]
});

export const businessRole = ac.newRole({
    organization: ["create", "update", "delete", "leave"],
    member: ["create", "read", "update", "delete"],
    invitation: ["create", "read", "cancel", "accept", "reject"],
    team: ["create", "read", "update", "delete"]
});

export const candidateRole = ac.newRole({
    application: ["create", "read", "update", "delete"],
});
