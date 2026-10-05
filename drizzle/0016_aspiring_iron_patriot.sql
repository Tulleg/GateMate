CREATE TYPE "public"."log_category" AS ENUM('payment', 'email', 'check_in', 'legal', 'system');--> statement-breakpoint
CREATE TYPE "public"."log_severity" AS ENUM('critical', 'warning', 'info');--> statement-breakpoint
CREATE TABLE "system_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"severity" "log_severity" DEFAULT 'info' NOT NULL,
	"category" "log_category" DEFAULT 'system' NOT NULL,
	"message" text NOT NULL,
	"details" text,
	"related_entity_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "system_logs_severity_idx" ON "system_logs" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "system_logs_category_idx" ON "system_logs" USING btree ("category");--> statement-breakpoint
CREATE INDEX "system_logs_created_at_idx" ON "system_logs" USING btree ("created_at");