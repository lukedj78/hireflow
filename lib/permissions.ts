import { createAccessControl } from "better-auth/plugins/access";

export const statement = {
    // Admin resources
    user: ["create", "list", "read", "update", "delete", "ban", "unban", "impersonate", "unlink-account"],
    
    // Organization resources
    organization: ["create", "read", "update", "delete", "leave"],
    member: ["create", "read", "update", "delete"],
    invitation: ["create", "read", "cancel", "accept", "reject"],
    team: ["create", "read", "update", "delete"],

    // Project resources (Example/New)
    project: ["create", "share", "update", "delete"],
} as const;

export const ac = createAccessControl(statement);

export const globalAdminRole = ac.newRole({
    user: ["create", "list", "read", "update", "delete", "ban", "unban", "impersonate", "unlink-account"],
    organization: ["create", "read", "update", "delete", "leave"],
    member: ["create", "read", "update", "delete"],
    invitation: ["create", "read", "cancel", "accept", "reject"],
    team: ["create", "read", "update", "delete"],
    project: ["create", "share", "update", "delete"],
});

export const orgOwnerRole = ac.newRole({
    organization: ["read", "update", "delete", "leave"],
    member: ["create", "read", "update", "delete"],
    invitation: ["create", "read", "cancel"],
    team: ["create", "read", "update", "delete"],
    project: ["create", "share", "update", "delete"],
});

export const orgAdminRole = ac.newRole({
    organization: ["read", "update", "leave"],
    member: ["create", "read", "update", "delete"],
    invitation: ["create", "read", "cancel"],
    team: ["create", "read", "update", "delete"],
    project: ["create", "share", "update"],
});

export const orgMemberRole = ac.newRole({
    organization: ["read", "leave"],
    member: ["read"],
    team: ["read"],
    project: ["create"],
});

// Example roles from user request
export const userRole = ac.newRole({
    organization: ["create"],
    invitation: ["read", "accept", "reject"],
});

export const adminRole = ac.newRole({
    project: ["create", "update"],
});

export const myCustomRole = ac.newRole({
    project: ["create", "update", "delete"],
    user: ["ban"],
});
