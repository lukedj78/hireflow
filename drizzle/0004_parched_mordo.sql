DROP INDEX IF EXISTS "account_userId_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "job_posting_slug_unique";--> statement-breakpoint
DROP INDEX IF EXISTS "organization_slug_unique";--> statement-breakpoint
DROP INDEX IF EXISTS "organization_invitation_token_unique";--> statement-breakpoint
DROP INDEX IF EXISTS "password_reset_token_token_unique";--> statement-breakpoint
DROP INDEX IF EXISTS "session_token_unique";--> statement-breakpoint
DROP INDEX IF EXISTS "session_userId_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "user_email_unique";--> statement-breakpoint
DROP INDEX IF EXISTS "verification_identifier_idx";--> statement-breakpoint
ALTER TABLE `user` ALTER COLUMN "role" TO "role" text NOT NULL;--> statement-breakpoint
CREATE INDEX `account_userId_idx` ON `account` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `candidate_email_unique` ON `candidate` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `job_posting_slug_unique` ON `job_posting` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `organization_slug_unique` ON `organization` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `organization_invitation_token_unique` ON `organization_invitation` (`token`);--> statement-breakpoint
CREATE UNIQUE INDEX `password_reset_token_token_unique` ON `password_reset_token` (`token`);--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE INDEX `session_userId_idx` ON `session` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE INDEX `verification_identifier_idx` ON `verification` (`identifier`);