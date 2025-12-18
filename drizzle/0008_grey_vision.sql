ALTER TABLE `user` ADD `onboarding_completed` integer DEFAULT false;--> statement-breakpoint
ALTER TABLE `user` ADD `onboarding_type` text;--> statement-breakpoint
ALTER TABLE `user` ADD `onboarding_step` integer DEFAULT 0;