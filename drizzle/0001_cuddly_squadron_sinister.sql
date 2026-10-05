CREATE TABLE `auth_rate_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`expires_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_auth_rate_limits_expiry` ON `auth_rate_limits` (`expires_at`);--> statement-breakpoint
CREATE TABLE `auth_sessions` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `auth_users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_auth_sessions_user` ON `auth_sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_auth_sessions_expiry` ON `auth_sessions` (`expires_at`);--> statement-breakpoint
CREATE TABLE `auth_users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`role` text DEFAULT 'user' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_auth_users_email` ON `auth_users` (`email`);