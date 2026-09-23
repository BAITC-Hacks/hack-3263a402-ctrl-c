CREATE TABLE `card_decks` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`course_id` text NOT NULL,
	`lesson_id` text NOT NULL,
	`data` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `decks_owner_lesson` ON `card_decks` (`owner`,`course_id`,`lesson_id`);--> statement-breakpoint
CREATE TABLE `card_reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`course_id` text NOT NULL,
	`lesson_id` text NOT NULL,
	`card_id` text NOT NULL,
	`next_review_at` integer NOT NULL,
	`stage` integer DEFAULT 0 NOT NULL,
	`successful_reviews` integer DEFAULT 0 NOT NULL,
	`last_correct` integer DEFAULT 0 NOT NULL,
	`last_review_at` integer NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`last_review_id` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `review_owner_card` ON `card_reviews` (`owner`,`course_id`,`lesson_id`,`card_id`);--> statement-breakpoint
CREATE INDEX `review_owner_due` ON `card_reviews` (`owner`,`next_review_at`);--> statement-breakpoint
CREATE TABLE `xp_events` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`event_key` text NOT NULL,
	`course_id` text NOT NULL,
	`subject` text NOT NULL,
	`points` integer NOT NULL,
	`label` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `xp_owner_event` ON `xp_events` (`owner`,`event_key`);--> statement-breakpoint
CREATE INDEX `xp_owner_course` ON `xp_events` (`owner`,`course_id`);