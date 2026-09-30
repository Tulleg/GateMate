ALTER TABLE "events" ADD COLUMN "is_cancelled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "cancel_reason" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "cancelled_at" timestamp;