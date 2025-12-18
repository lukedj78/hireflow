ALTER TABLE candidate ADD COLUMN skills text;--> statement-breakpoint
ALTER TABLE candidate ADD COLUMN experience text;--> statement-breakpoint
ALTER TABLE candidate ADD COLUMN education text;--> statement-breakpoint
ALTER TABLE candidate ADD COLUMN summary text;--> statement-breakpoint
ALTER TABLE job_posting ADD COLUMN type text DEFAULT 'onsite' NOT NULL;--> statement-breakpoint
ALTER TABLE job_posting ADD COLUMN parsed_requirements text;
