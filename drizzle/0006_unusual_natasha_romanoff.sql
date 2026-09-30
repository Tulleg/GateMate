ALTER TABLE "events" ADD COLUMN "venue_street" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "venue_zip" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "venue_city" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "venue_country" text DEFAULT 'Deutschland';--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "doors_open_at" timestamp;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "age_restriction" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "stripe_checkout_session_id" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "terms_snapshot" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "legal_profile_snapshot" text;