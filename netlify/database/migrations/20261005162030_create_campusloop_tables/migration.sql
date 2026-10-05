CREATE TABLE "auth_rate_limits" (
	"key" text PRIMARY KEY,
	"count" integer NOT NULL,
	"expires_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_sessions" (
	"token_hash" text PRIMARY KEY,
	"user_id" text NOT NULL,
	"expires_at" text NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_users" (
	"id" text PRIMARY KEY,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" text DEFAULT 'user' NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"position" serial
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" text PRIMARY KEY,
	"listing_id" text NOT NULL,
	"buyer_id" text NOT NULL,
	"seller_id" text NOT NULL,
	"buyer_read" text DEFAULT '' NOT NULL,
	"seller_read" text DEFAULT '' NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deals" (
	"id" text PRIMARY KEY,
	"listing_id" text NOT NULL,
	"offered_id" text,
	"buyer_id" text NOT NULL,
	"seller_id" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"buyer_confirm" integer DEFAULT 0 NOT NULL,
	"seller_confirm" integer DEFAULT 0 NOT NULL,
	"created_at" text NOT NULL,
	"completed_at" text
);
--> statement-breakpoint
CREATE TABLE "listings" (
	"id" text PRIMARY KEY,
	"owner_id" text NOT NULL,
	"title" text NOT NULL,
	"category" text NOT NULL,
	"mode" text NOT NULL,
	"price" integer NOT NULL,
	"condition" text NOT NULL,
	"description" text NOT NULL,
	"location" text NOT NULL,
	"images" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"reservation_id" text,
	"sample" integer DEFAULT 0 NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" text PRIMARY KEY,
	"conversation_id" text NOT NULL,
	"sender_id" text NOT NULL,
	"body" text NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" text PRIMARY KEY,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"school" text DEFAULT 'HUIT' NOT NULL,
	"student_id" text DEFAULT '' NOT NULL,
	"bio" text DEFAULT '' NOT NULL,
	"avatar" text DEFAULT '' NOT NULL,
	"verified" integer DEFAULT 0 NOT NULL,
	"verification_status" text DEFAULT 'none' NOT NULL,
	"verification_image" text DEFAULT '' NOT NULL,
	"blocked" integer DEFAULT 0 NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" text PRIMARY KEY,
	"reporter_id" text NOT NULL,
	"listing_id" text NOT NULL,
	"reason" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"resolution" text DEFAULT '' NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" text PRIMARY KEY,
	"deal_id" text NOT NULL,
	"reviewer_id" text NOT NULL,
	"target_id" text NOT NULL,
	"score" integer NOT NULL,
	"body" text NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved" (
	"user_id" text NOT NULL,
	"listing_id" text NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "uploads" (
	"key" text PRIMARY KEY,
	"owner_id" text NOT NULL,
	"kind" text NOT NULL,
	"content_type" text NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_auth_rate_limits_expiry" ON "auth_rate_limits" ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_auth_sessions_user" ON "auth_sessions" ("user_id");--> statement-breakpoint
CREATE INDEX "idx_auth_sessions_expiry" ON "auth_sessions" ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_auth_users_email" ON "auth_users" ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_conversations_listing_buyer" ON "conversations" ("listing_id","buyer_id");--> statement-breakpoint
CREATE INDEX "idx_conversations_seller" ON "conversations" ("seller_id");--> statement-breakpoint
CREATE INDEX "idx_deals_buyer" ON "deals" ("buyer_id");--> statement-breakpoint
CREATE INDEX "idx_deals_seller" ON "deals" ("seller_id");--> statement-breakpoint
CREATE INDEX "idx_deals_listing_status" ON "deals" ("listing_id","status");--> statement-breakpoint
CREATE INDEX "idx_listings_status_created" ON "listings" ("status","created_at");--> statement-breakpoint
CREATE INDEX "idx_listings_owner" ON "listings" ("owner_id");--> statement-breakpoint
CREATE INDEX "idx_messages_conversation_time" ON "messages" ("conversation_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_reports_status" ON "reports" ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_reviews_deal_reviewer" ON "reviews" ("deal_id","reviewer_id");--> statement-breakpoint
CREATE INDEX "idx_reviews_target" ON "reviews" ("target_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_saved_user_listing" ON "saved" ("user_id","listing_id");--> statement-breakpoint
CREATE INDEX "idx_uploads_owner_created" ON "uploads" ("owner_id","created_at");--> statement-breakpoint
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_user_id_auth_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth_users"("id") ON DELETE CASCADE;