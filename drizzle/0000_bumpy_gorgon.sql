CREATE TABLE `quiz_attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`subject` text NOT NULL,
	`chapter` text NOT NULL,
	`difficulty` text NOT NULL,
	`score` integer NOT NULL,
	`total` integer NOT NULL,
	`percentage` integer NOT NULL,
	`duration_seconds` integer,
	`answers_json` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `quiz_attempts_user_created_idx` ON `quiz_attempts` (`user_id`,`created_at`);