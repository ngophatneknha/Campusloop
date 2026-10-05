CREATE TABLE `categories` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `conversations` (
	`id` text PRIMARY KEY NOT NULL,
	`listing_id` text NOT NULL,
	`buyer_id` text NOT NULL,
	`seller_id` text NOT NULL,
	`buyer_read` text DEFAULT '' NOT NULL,
	`seller_read` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_conversations_listing_buyer` ON `conversations` (`listing_id`,`buyer_id`);--> statement-breakpoint
CREATE INDEX `idx_conversations_seller` ON `conversations` (`seller_id`);--> statement-breakpoint
CREATE TABLE `deals` (
	`id` text PRIMARY KEY NOT NULL,
	`listing_id` text NOT NULL,
	`offered_id` text,
	`buyer_id` text NOT NULL,
	`seller_id` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`buyer_confirm` integer DEFAULT 0 NOT NULL,
	`seller_confirm` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`completed_at` text
);
--> statement-breakpoint
CREATE INDEX `idx_deals_buyer` ON `deals` (`buyer_id`);--> statement-breakpoint
CREATE INDEX `idx_deals_seller` ON `deals` (`seller_id`);--> statement-breakpoint
CREATE INDEX `idx_deals_listing_status` ON `deals` (`listing_id`,`status`);--> statement-breakpoint
CREATE TABLE `listings` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`title` text NOT NULL,
	`category` text NOT NULL,
	`mode` text NOT NULL,
	`price` integer NOT NULL,
	`condition` text NOT NULL,
	`description` text NOT NULL,
	`location` text NOT NULL,
	`images` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`reservation_id` text,
	`sample` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_listings_status_created` ON `listings` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_listings_owner` ON `listings` (`owner_id`);--> statement-breakpoint
CREATE TABLE `messages` (
	`id` text PRIMARY KEY NOT NULL,
	`conversation_id` text NOT NULL,
	`sender_id` text NOT NULL,
	`body` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_messages_conversation_time` ON `messages` (`conversation_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`school` text DEFAULT 'HUIT' NOT NULL,
	`student_id` text DEFAULT '' NOT NULL,
	`bio` text DEFAULT '' NOT NULL,
	`avatar` text DEFAULT '' NOT NULL,
	`verified` integer DEFAULT 0 NOT NULL,
	`verification_status` text DEFAULT 'none' NOT NULL,
	`verification_image` text DEFAULT '' NOT NULL,
	`blocked` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `reports` (
	`id` text PRIMARY KEY NOT NULL,
	`reporter_id` text NOT NULL,
	`listing_id` text NOT NULL,
	`reason` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`resolution` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_reports_status` ON `reports` (`status`);--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`deal_id` text NOT NULL,
	`reviewer_id` text NOT NULL,
	`target_id` text NOT NULL,
	`score` integer NOT NULL,
	`body` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_reviews_deal_reviewer` ON `reviews` (`deal_id`,`reviewer_id`);--> statement-breakpoint
CREATE INDEX `idx_reviews_target` ON `reviews` (`target_id`);--> statement-breakpoint
CREATE TABLE `saved` (
	`user_id` text NOT NULL,
	`listing_id` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_saved_user_listing` ON `saved` (`user_id`,`listing_id`);--> statement-breakpoint
CREATE TABLE `uploads` (
	`key` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`kind` text NOT NULL,
	`content_type` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_uploads_owner_created` ON `uploads` (`owner_id`,`created_at`);