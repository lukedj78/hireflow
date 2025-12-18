import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";
import { organizationClient } from "better-auth/client/plugins";
import { polarClient } from "@polar-sh/better-auth";
import { ac, adminRole, userRole, businessRole, candidateRole, orgOwnerRole, orgAdminRole, orgMemberRole, orgHRRole } from "./permissions";

export const authClient = createAuthClient({
    plugins: [
        adminClient({
            ac,
            roles: {
                user: userRole,
                admin: adminRole,
                business: businessRole,
                candidate: candidateRole
            }
        }),
        organizationClient({
            ac,
            roles: {
                owner: orgOwnerRole,
                admin: orgAdminRole,
                member: orgMemberRole,
                hr: orgHRRole
            },
            teams: {
                enabled: true
            }
        }),
        polarClient()
    ]
});

export const {
    signIn,
    signUp,
    useSession
} = authClient;
