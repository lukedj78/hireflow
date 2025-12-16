import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

export const db = drizzle(client, { 
  schema: {
    ...schema,
    member: schema.organizationMember,
    invitation: schema.organizationInvitation,
    memberRelations: schema.organizationMemberRelations,
    invitationRelations: schema.organizationInvitationRelations,
  } 
});
