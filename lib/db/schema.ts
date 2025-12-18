import { relations, sql } from "drizzle-orm";
import { sqliteTable, text, integer, index, customType } from "drizzle-orm/sqlite-core";

const float32Array = customType<{ data: number[]; driverData: Buffer }>({
  dataType() {
    return "F32_BLOB";
  },
  fromDriver(value: Buffer) {
    return Array.from(new Float32Array(value.buffer));
  },
  toDriver(value: number[]) {
    return Buffer.from(new Float32Array(value).buffer);
  },
});

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" })
    .default(false)
    .notNull(),
  image: text("image").default(sql`NULL`),
  isPremium: integer("is_premium", { mode: "boolean" }).default(false),
  subscriptionStatus: text("subscription_status"),
  subscriptionId: text("subscription_id"),
  subscriptionPeriodEnd: integer("subscription_period_end", { mode: "timestamp_ms" }),
  role: text("role", { enum: ["user", "admin", "business", "candidate"] }).notNull(),
  onboardingCompleted: integer("onboarding_completed", { mode: "boolean" }).default(false),
  onboardingType: text("onboarding_type", { enum: ["business", "candidate"] }),
  onboardingStep: integer("onboarding_step").default(0),
  banned: integer("banned", { mode: "boolean" }),
  banReason: text("ban_reason"),
  banExpires: integer("ban_expires", { mode: "timestamp_ms" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .$onUpdate(() => new Date())
    .notNull(),
});

export const session = sqliteTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    token: text("token").notNull().unique(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .$onUpdate(() => new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = sqliteTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: integer("access_token_expires_at", {
      mode: "timestamp_ms",
    }),
    refreshTokenExpiresAt: integer("refresh_token_expires_at", {
      mode: "timestamp_ms",
    }),
    scope: text("scope"),
    password: text("password"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = sqliteTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const passwordResetTokens = sqliteTable("password_reset_token", {
  identifier: text("identifier").notNull(),
  token: text("token").notNull().unique(),
  expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
});

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const organization = sqliteTable("organization", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    logo: text("logo"),
    metadata: text("metadata", { mode: "json" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
        .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
        .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
        .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
        .$onUpdate(() => new Date())
        .notNull(),
});

export const organizationMember = sqliteTable("organization_member", {
    id: text("id").primaryKey(),
    role: text("role", { enum: ["owner", "admin", "member"] }).notNull(),
    organizationId: text("organization_id").notNull().references(() => organization.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
        .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
        .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
        .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
        .$onUpdate(() => new Date())
        .notNull(),
});

export const organizationInvitation = sqliteTable("organization_invitation", {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    role: text("role", { enum: ["owner", "admin", "member"] }).notNull(),
    token: text("token").notNull().unique(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    organizationId: text("organization_id").notNull().references(() => organization.id, { onDelete: "cascade" }),
    inviterId: text("inviter_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
        .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
        .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
        .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
        .$onUpdate(() => new Date())
        .notNull(),
});

export const team = sqliteTable("team", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    organizationId: text("organization_id").notNull().references(() => organization.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
        .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
        .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
        .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
        .$onUpdate(() => new Date())
        .notNull(),
});

export const teamMember = sqliteTable("team_member", {
    id: text("id").primaryKey(),
    teamId: text("team_id").notNull().references(() => team.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    role: text("role").notNull().default("member"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
        .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
        .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
        .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
        .$onUpdate(() => new Date())
        .notNull(),
});

export const organizationRelations = relations(organization, ({ many }) => ({
    members: many(organizationMember),
    invitations: many(organizationInvitation),
    teams: many(team),
    jobPostings: many(jobPosting),
}));

export const jobPosting = sqliteTable("job_posting", {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    location: text("location"),
    type: text("type", { enum: ["remote", "onsite", "hybrid"] }).notNull().default("onsite"),
    salaryRange: text("salary_range"),
    status: text("status", { enum: ["draft", "published", "closed"] }).notNull().default("draft"),
    parsedRequirements: text("parsed_requirements"), // JSON object with skills, experience level, etc.
    embedding: float32Array("embedding"),
    organizationId: text("organization_id").notNull().references(() => organization.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
        .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
        .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
        .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
        .$onUpdate(() => new Date())
        .notNull(),
});

export const candidate = sqliteTable("candidate", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    phone: text("phone"),
    resumeUrl: text("resume_url"),
    skills: text("skills"), // JSON array of strings
    experience: text("experience"), // JSON array of experience objects
    education: text("education"), // JSON array of education objects
    summary: text("summary"), // AI generated summary
    resumeLastUpdatedAt: integer("resume_last_updated_at", { mode: "timestamp_ms" }),
    embedding: float32Array("embedding"),
    userId: text("user_id").unique().references(() => user.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
        .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
        .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
        .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
        .$onUpdate(() => new Date())
        .notNull(),
});

export const application = sqliteTable("application", {
    id: text("id").primaryKey(),
    jobPostingId: text("job_posting_id").notNull().references(() => jobPosting.id, { onDelete: "cascade" }),
    candidateId: text("candidate_id").notNull().references(() => candidate.id, { onDelete: "cascade" }),
    status: text("status", { enum: ["applied", "screening", "interview", "offer", "hired", "rejected"] }).notNull().default("applied"),
    aiScore: integer("ai_score"),
    aiFeedback: text("ai_feedback"),
    aiAnalysis: text("ai_analysis"), // JSON object with pros, cons, skills_matched
    createdAt: integer("created_at", { mode: "timestamp_ms" })
        .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
        .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
        .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
        .$onUpdate(() => new Date())
        .notNull(),
});

export const jobPostingRelations = relations(jobPosting, ({ one, many }) => ({
    organization: one(organization, {
        fields: [jobPosting.organizationId],
        references: [organization.id],
    }),
    applications: many(application),
}));

export type JobPosting = typeof jobPosting.$inferSelect;
export type Application = typeof application.$inferSelect;
export type Candidate = typeof candidate.$inferSelect;

export const candidateRelations = relations(candidate, ({ one, many }) => ({
    user: one(user, {
        fields: [candidate.userId],
        references: [user.id],
    }),
    applications: many(application),
}));

export const applicationRelations = relations(application, ({ one }) => ({
    jobPosting: one(jobPosting, {
        fields: [application.jobPostingId],
        references: [jobPosting.id],
    }),
    candidate: one(candidate, {
        fields: [application.candidateId],
        references: [candidate.id],
    }),
}));


export const teamRelations = relations(team, ({ one, many }) => ({
    organization: one(organization, {
        fields: [team.organizationId],
        references: [organization.id],
    }),
    members: many(teamMember),
}));

export const teamMemberRelations = relations(teamMember, ({ one }) => ({
    team: one(team, {
        fields: [teamMember.teamId],
        references: [team.id],
    }),
    user: one(user, {
        fields: [teamMember.userId],
        references: [user.id],
    }),
}));

export const organizationMemberRelations = relations(organizationMember, ({ one }) => ({
    organization: one(organization, {
        fields: [organizationMember.organizationId],
        references: [organization.id],
    }),
    user: one(user, {
        fields: [organizationMember.userId],
        references: [user.id],
    }),
}));

export const organizationInvitationRelations = relations(organizationInvitation, ({ one }) => ({
    organization: one(organization, {
        fields: [organizationInvitation.organizationId],
        references: [organization.id],
    }),
    inviter: one(user, {
        fields: [organizationInvitation.inviterId],
        references: [user.id],
    }),
}));

export const userRelations = relations(user, ({ one, many }) => ({
    sessions: many(session),
    accounts: many(account),
    members: many(organizationMember),
    invitations: many(organizationInvitation),
    teamMembers: many(teamMember),
    candidate: one(candidate),
}));
