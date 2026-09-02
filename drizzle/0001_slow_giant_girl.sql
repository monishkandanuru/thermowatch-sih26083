CREATE TABLE `audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_id` text,
	`actor_role` text NOT NULL,
	`action` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`details_json` text DEFAULT '{}' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_audit_logs_created` ON `audit_logs` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_audit_logs_entity` ON `audit_logs` (`entity_type`,`entity_id`);--> statement-breakpoint
CREATE TABLE `rate_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`count` real NOT NULL,
	`window_start` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `user_roles` (
	`user_id` text PRIMARY KEY NOT NULL,
	`role` text DEFAULT 'officer' NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `warning_events` (
	`id` text PRIMARY KEY NOT NULL,
	`dedupe_key` text NOT NULL,
	`district` text NOT NULL,
	`horizon_hours` real NOT NULL,
	`risk` text NOT NULL,
	`probability` real NOT NULL,
	`htsi` real NOT NULL,
	`model_version` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`valid_at` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_warning_events_dedupe` ON `warning_events` (`dedupe_key`);--> statement-breakpoint
CREATE INDEX `idx_warning_events_district_created` ON `warning_events` (`district`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_warning_events_status_created` ON `warning_events` (`status`,`created_at`);