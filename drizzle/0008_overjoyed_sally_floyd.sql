CREATE TYPE "public"."event_type" AS ENUM('concert', 'sports', 'club_association', 'workshop', 'festival', 'other');--> statement-breakpoint
CREATE TYPE "public"."legal_document_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."legal_document_type" AS ENUM('platform_impressum', 'platform_privacy', 'platform_terms', 'organizer_impressum', 'organizer_privacy', 'organizer_agb', 'event_terms', 'ticket_terms', 'refund_policy', 'revocation_notice');--> statement-breakpoint
CREATE TABLE "legal_documents" (
	"id" text PRIMARY KEY NOT NULL,
	"organizer_id" text,
	"document_type" "legal_document_type" NOT NULL,
	"title" text NOT NULL,
	"content" text,
	"url" text,
	"event_type" "event_type",
	"applicable_modules" text,
	"version" integer DEFAULT 1 NOT NULL,
	"status" "legal_document_status" DEFAULT 'draft' NOT NULL,
	"hash" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"published_at" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"valid_from" timestamp,
	"valid_until" timestamp
);
--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "event_type" "event_type" DEFAULT 'other';--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "enabled_legal_modules" text;--> statement-breakpoint
ALTER TABLE "legal_documents" ADD CONSTRAINT "legal_documents_organizer_id_users_id_fk" FOREIGN KEY ("organizer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;