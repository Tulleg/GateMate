CREATE TABLE "legal_document_versions" (
	"id" text PRIMARY KEY NOT NULL,
	"organizer_id" text NOT NULL,
	"event_id" text,
	"document_type" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"content" text,
	"url" text,
	"hash" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "has_end_time" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "accessibility_info" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "house_rules" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "special_admission_conditions" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "event_terms" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "cancellation_policy" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "sales_start_date" timestamp;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "sales_end_date" timestamp;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "legal_checklist_confirmed_at" timestamp;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "legal_checklist_confirmed_by" text;--> statement-breakpoint
ALTER TABLE "ticket_tiers" ADD COLUMN "fee_cents" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "ticket_tiers" ADD COLUMN "included_services" text;--> statement-breakpoint
ALTER TABLE "ticket_tiers" ADD COLUMN "ticket_terms" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "responsible_person" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "cancellation_policy_content" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "event_terms_content" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "document_versions_snapshot" text;--> statement-breakpoint
ALTER TABLE "legal_document_versions" ADD CONSTRAINT "legal_document_versions_organizer_id_users_id_fk" FOREIGN KEY ("organizer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "legal_document_versions" ADD CONSTRAINT "legal_document_versions_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;