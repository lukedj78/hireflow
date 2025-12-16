import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";
import { organizationClient } from "better-auth/client/plugins";
import { polarClient } from "@polar-sh/better-auth";
import { ac, adminRole, userRole, myCustomRole, orgOwnerRole, orgAdminRole, orgMemberRole } from "./permissions";

export const authClient = createAuthClient({
    plugins: [
        adminClient({
            ac,
            roles: {
                user: userRole,
                admin: adminRole,
                myCustomRole
            }
        }),
        organizationClient({
            ac,
            roles: {
                owner: orgOwnerRole,
                admin: orgAdminRole,
                member: orgMemberRole
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
