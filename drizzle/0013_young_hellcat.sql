CREATE TABLE `interview` (
	`id` text PRIMARY KEY NOT NULL,
	`application_id` text NOT NULL,
	`organizer_id` text NOT NULL,
	`candidate_id` text NOT NULL,
	`job_id` text NOT NULL,
	`start_time` integer NOT NULL,
	`end_time` integer NOT NULL,
	`status` text DEFAULT 'scheduled' NOT NULL,
	`location` text,
	`meeting_link` text,
	`notes` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`application_id`) REFERENCES `application`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`organizer_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`candidate_id`) REFERENCES `candidate`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`job_id`) REFERENCES `job_posting`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `candidate` ADD `years_of_experience` integer;--> statement-breakpoint
ALTER TABLE `candidate` ADD `seniority` text;