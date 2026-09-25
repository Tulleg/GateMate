ALTER TABLE "events" ADD COLUMN "is_listed_in_directory" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "organizer_slug" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "bio" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "legal_name" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "street" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "zip" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "city" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "country" text DEFAULT 'Deutschland';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "vat_id" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_small_business" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "legal_mode" text DEFAULT 'custom_text';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "impressum_url" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "impressum_content" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "privacy_url" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "privacy_content" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "terms_url" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "terms_content" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "revocation_notice_custom" text;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_organizer_slug_unique" UNIQUE("organizer_slug");