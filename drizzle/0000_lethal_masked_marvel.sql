CREATE TABLE `ai_usage` (
	`id` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`course_id` text NOT NULL,
	`lesson_id` text NOT NULL,
	`question_key` text NOT NULL,
	`answer` text NOT NULL,
	`correct` integer NOT NULL,
	`resolved` integer DEFAULT 0 NOT NULL,
	`snapshot` text NOT NULL,
	`remediate_for` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `attempts_owner_course` ON `attempts` (`owner`,`course_id`);--> statement-breakpoint
CREATE TABLE `chats` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`attempt_id` text NOT NULL,
	`role` text NOT NULL,
	`body` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `chats_owner_attempt` ON `chats` (`owner`,`attempt_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `courses` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`data` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `courses_owner` ON `courses` (`owner`);--> statement-breakpoint
CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`course_id` text NOT NULL,
	`level_id` text NOT NULL,
	`body` text NOT NULL,
	`status` text NOT NULL,
	`feedback` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `projects_owner_course_level` ON `projects` (`owner`,`course_id`,`level_id`);