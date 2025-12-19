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

export const interview = sqliteTable("interview", {
    id: text("id").primaryKey(),
    applicationId: text("application_id").notNull().references(() => application.id, { onDelete: "cascade" }),
    organizerId: text("organizer_id").notNull().references(() => user.id),
    candidateId: text("candidate_id").notNull().references(() => candidate.id),
    jobId: text("job_id").notNull().references(() => jobPosting.id),
    startTime: integer("start_time", { mode: "timestamp_ms" }).notNull(),
    endTime: integer("end_time", { mode: "timestamp_ms" }).notNull(),
    status: text("status", { enum: ["scheduled", "completed", "cancelled", "rescheduled"] }).notNull().default("scheduled"),
    location: text("location"),
    meetingLink: text("meeting_link"),
    meetingProvider: text("meeting_provider"), // 'mock', 'daily', 'livekit', etc.
    meetingMetadata: text("meeting_metadata", { mode: "json" }), // JSON object for provider-specific data
    notes: text("notes"),
    feedbackReport: text("feedback_report"), // AI generated report
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
    yearsOfExperience: integer("years_of_experience"), // AI estimated years
    seniority: text("seniority"), // AI estimated level
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

export const candidateFile = sqliteTable("candidate_file", {
    id: text("id").primaryKey(),
    candidateId: text("candidate_id").notNull().references(() => candidate.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    fileKey: text("file_key").notNull(),
    fileName: text("file_name").notNull(),
    fileType: text("file_type").notNull(),
    fileSize: integer("file_size").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
        .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
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

export const communicationLog = sqliteTable("communication_log", {
    id: text("id").primaryKey(),
    type: text("type", { enum: ["email", "notification", "interest"] }).notNull(),
    candidateId: text("candidate_id").references(() => candidate.id, { onDelete: "cascade" }),
    jobPostingId: text("job_posting_id").references(() => jobPosting.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull().references(() => user.id),
    subject: text("subject"),
    content: text("content"),
    metadata: text("metadata", { mode: "json" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
        .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
        .notNull(),
    readAt: integer("read_at", { mode: "timestamp_ms" }),
});

export const userSettings = sqliteTable("user_settings", {
    userId: text("user_id").primaryKey().references(() => user.id, { onDelete: "cascade" }),
    emailNotifications: integer("email_notifications", { mode: "boolean" }).default(true).notNull(),
    inAppNotifications: integer("in_app_notifications", { mode: "boolean" }).default(true).notNull(),
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
    communications: many(communicationLog),
}));

export type JobPosting = typeof jobPosting.$inferSelect;
export type Application = typeof application.$inferSelect;
export type Candidate = typeof candidate.$inferSelect;
export type CandidateFile = typeof candidateFile.$inferSelect;
export type Interview = typeof interview.$inferSelect;
export type User = typeof user.$inferSelect;
export type CommunicationLog = typeof communicationLog.$inferSelect;

export const candidateRelations = relations(candidate, ({ one, many }) => ({
    user: one(user, {
        fields: [candidate.userId],
        references: [user.id],
    }),
    applications: many(application),
    files: many(candidateFile),
    interviews: many(interview),
    communications: many(communicationLog),
}));

export const candidateFileRelations = relations(candidateFile, ({ one }) => ({
    candidate: one(candidate, {
        fields: [candidateFile.candidateId],
        references: [candidate.id],
    }),
}));

export const applicationRelations = relations(application, ({ one, many }) => ({
    jobPosting: one(jobPosting, {
        fields: [application.jobPostingId],
        references: [jobPosting.id],
    }),
    candidate: one(candidate, {
        fields: [application.candidateId],
        references: [candidate.id],
    }),
    interviews: many(interview),
}));

export const interviewRelations = relations(interview, ({ one }) => ({
    application: one(application, {
        fields: [interview.applicationId],
        references: [application.id],
    }),
    organizer: one(user, {
        fields: [interview.organizerId],
        references: [user.id],
    }),
    candidate: one(candidate, {
        fields: [interview.candidateId],
        references: [candidate.id],
    }),
    job: one(jobPosting, {
        fields: [interview.jobId],
        references: [jobPosting.id],
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

export const communicationLogRelations = relations(communicationLog, ({ one }) => ({
    candidate: one(candidate, {
        fields: [communicationLog.candidateId],
        references: [candidate.id],
    }),
    jobPosting: one(jobPosting, {
        fields: [communicationLog.jobPostingId],
        references: [jobPosting.id],
    }),
    user: one(user, {
        fields: [communicationLog.userId],
        references: [user.id],
    }),
}));

export const userSettingsRelations = relations(userSettings, ({ one }) => ({
    user: one(user, {
        fields: [userSettings.userId],
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
    communications: many(communicationLog),
    settings: one(userSettings),
}));
