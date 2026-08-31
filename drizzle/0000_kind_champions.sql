CREATE TABLE `alerts` (
	`id` text PRIMARY KEY NOT NULL,
	`district` text NOT NULL,
	`risk` text NOT NULL,
	`channel` text NOT NULL,
	`language` text NOT NULL,
	`message` text NOT NULL,
	`status` text DEFAULT 'sent' NOT NULL,
	`acknowledged_at` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_alerts_district_created` ON `alerts` (`district`,`created_at`);--> statement-breakpoint
CREATE TABLE `incidents` (
	`id` text PRIMARY KEY NOT NULL,
	`district` text NOT NULL,
	`incident_type` text NOT NULL,
	`severity` text NOT NULL,
	`description` text NOT NULL,
	`reporter` text DEFAULT 'anonymous' NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_incidents_district_created` ON `incidents` (`district`,`created_at`);--> statement-breakpoint
CREATE TABLE `observations` (
	`id` text PRIMARY KEY NOT NULL,
	`district` text NOT NULL,
	`temperature` real NOT NULL,
	`humidity` real NOT NULL,
	`htsi` real NOT NULL,
	`risk` text NOT NULL,
	`source` text NOT NULL,
	`observed_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_observations_district_time` ON `observations` (`district`,`observed_at`);--> statement-breakpoint
CREATE TABLE `predictions` (
	`id` text PRIMARY KEY NOT NULL,
	`district` text NOT NULL,
	`horizon_hours` real NOT NULL,
	`probability` real NOT NULL,
	`predicted_class` text NOT NULL,
	`source` text NOT NULL,
	`predicted_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_predictions_district_time` ON `predictions` (`district`,`predicted_at`);