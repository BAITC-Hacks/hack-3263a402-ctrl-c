CREATE TABLE `enrollments` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`publication_id` text NOT NULL,
	`course_id` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `enrollment_owner_publication` ON `enrollments` (`owner`,`publication_id`);--> statement-breakpoint
CREATE TABLE `learner_settings` (
	`owner` text PRIMARY KEY NOT NULL,
	`onboarding_version` integer DEFAULT 0 NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `public_profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`name` text NOT NULL,
	`bio` text DEFAULT '' NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `public_profile_owner` ON `public_profiles` (`owner`);--> statement-breakpoint
CREATE TABLE `publication_likes` (
	`id` text PRIMARY KEY NOT NULL,
	`publication_id` text NOT NULL,
	`owner` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `like_publication_owner` ON `publication_likes` (`publication_id`,`owner`);--> statement-breakpoint
CREATE TABLE `publications` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`course_id` text NOT NULL,
	`profile_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`subject` text NOT NULL,
	`snapshot` text NOT NULL,
	`lesson_count` integer NOT NULL,
	`stage_count` integer NOT NULL,
	`ready_count` integer NOT NULL,
	`published` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `publication_owner_course` ON `publications` (`owner`,`course_id`);--> statement-breakpoint
CREATE INDEX `publication_catalog` ON `publications` (`published`,`created_at`);--> statement-breakpoint
CREATE INDEX `publication_profile` ON `publications` (`profile_id`,`published`);