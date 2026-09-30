ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE IF EXISTS "public"."system_role" CASCADE;--> statement-breakpoint
CREATE TYPE "public"."system_role" AS ENUM('superadmin', 'organizer');--> statement-breakpoint
UPDATE "users" SET "role" = 'organizer' WHERE "role" NOT IN ('superadmin', 'organizer');--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE "public"."system_role" USING "role"::"public"."system_role";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'organizer'::"public"."system_role";--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "is_fixed_date_event" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_verified_by_admin" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "kytc_verified_at" timestamp;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "ip_address" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "user_agent" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "accepted_at" timestamp DEFAULT now();