ALTER TABLE "orders" ADD COLUMN "ticket_tier_id" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "quantity" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_ticket_tier_id_ticket_tiers_id_fk" FOREIGN KEY ("ticket_tier_id") REFERENCES "public"."ticket_tiers"("id") ON DELETE set null ON UPDATE no action;