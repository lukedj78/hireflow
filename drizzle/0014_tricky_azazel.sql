CREATE TABLE `communication_log` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`candidate_id` text NOT NULL,
	`job_posting_id` text,
	`user_id` text NOT NULL,
	`subject` text,
	`content` text,
	`metadata` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`read_at` integer,
	FOREIGN KEY (`candidate_id`) REFERENCES `candidate`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`job_posting_id`) REFERENCES `job_posting`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `interview` ADD `meeting_provider` text;--> statement-breakpoint
ALTER TABLE `interview` ADD `meeting_metadata` text;--> statement-breakpoint
ALTER TABLE `interview` ADD `feedback_report` text;