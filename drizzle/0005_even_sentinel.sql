ALTER TABLE `candidate` ADD `user_id` text REFERENCES user(id);--> statement-breakpoint
CREATE UNIQUE INDEX `candidate_user_id_unique` ON `candidate` (`user_id`);