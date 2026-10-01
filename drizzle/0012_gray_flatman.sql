CREATE TYPE "public"."message_category" AS ENUM('general', 'organizer_support', 'buyer_support', 'billing', 'legal_dsa', 'other');--> statement-breakpoint
CREATE TYPE "public"."message_status" AS ENUM('new', 'in_progress', 'replied', 'archived');--> statement-breakpoint
CREATE TYPE "public"."message_type" AS ENUM('general', 'dsa_notice');--> statement-breakpoint
CREATE TABLE "contact_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"type" "message_type" DEFAULT 'general' NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"category" "message_category" DEFAULT 'general' NOT NULL,
	"subject" text NOT NULL,
	"message" text NOT NULL,
	"target_url" text,
	"violation_type" text,
	"legal_reason" text,
	"dsa_declaration" boolean DEFAULT false,
	"status" "message_status" DEFAULT 'new' NOT NULL,
	"admin_notes" text,
	"user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "contact_messages" ADD CONSTRAINT "contact_messages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;