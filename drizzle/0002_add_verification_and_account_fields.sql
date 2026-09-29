CREATE TABLE IF NOT EXISTS "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "password" text;--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "id_token" text;--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "access_token_expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "refresh_token_expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN IF NOT EXISTS "scope" text;
