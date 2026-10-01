ALTER TABLE "users" ADD COLUMN "onboarding_completed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "onboarding_step" text DEFAULT 'stripe_connect' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "stripe_account_type" text DEFAULT 'express';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "stripe_account_id" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "legal_company_name" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "legal_vat_id" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "legal_address" json;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "terms_accepted_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "privacy_accepted_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "avv_accepted_at" timestamp;