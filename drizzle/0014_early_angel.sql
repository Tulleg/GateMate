CREATE TABLE "platform_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "contact_messages_status_idx" ON "contact_messages" USING btree ("status");--> statement-breakpoint
CREATE INDEX "contact_messages_category_idx" ON "contact_messages" USING btree ("category");--> statement-breakpoint
CREATE INDEX "contact_messages_user_id_idx" ON "contact_messages" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "events_organizer_id_idx" ON "events" USING btree ("organizer_id");--> statement-breakpoint
CREATE INDEX "events_slug_idx" ON "events" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "events_start_date_idx" ON "events" USING btree ("start_date");--> statement-breakpoint
CREATE INDEX "events_is_published_idx" ON "events" USING btree ("is_published");--> statement-breakpoint
CREATE INDEX "ticket_tiers_event_id_idx" ON "ticket_tiers" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "accounts_user_id_idx" ON "accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_token_idx" ON "sessions" USING btree ("token");--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role");--> statement-breakpoint
CREATE INDEX "users_organizer_slug_idx" ON "users" USING btree ("organizer_slug");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "check_in_logs_scanned_by_idx" ON "check_in_logs" USING btree ("scanned_by_user_id");--> statement-breakpoint
CREATE INDEX "orders_event_id_idx" ON "orders" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "orders_customer_email_idx" ON "orders" USING btree ("customer_email");--> statement-breakpoint
CREATE INDEX "orders_stripe_pi_idx" ON "orders" USING btree ("stripe_payment_intent_id");--> statement-breakpoint
CREATE INDEX "orders_stripe_cs_idx" ON "orders" USING btree ("stripe_checkout_session_id");--> statement-breakpoint
CREATE INDEX "orders_status_idx" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "tickets_qr_hash_token_idx" ON "tickets" USING btree ("qr_hash_token");--> statement-breakpoint
CREATE INDEX "tickets_order_id_idx" ON "tickets" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "tickets_tier_id_idx" ON "tickets" USING btree ("ticket_tier_id");--> statement-breakpoint
CREATE INDEX "tickets_status_idx" ON "tickets" USING btree ("status");--> statement-breakpoint
CREATE INDEX "org_members_user_id_idx" ON "organization_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "org_members_org_id_idx" ON "organization_members" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "org_members_user_org_unique" ON "organization_members" USING btree ("user_id","organization_id");--> statement-breakpoint
CREATE INDEX "organizations_slug_idx" ON "organizations" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "legal_versions_org_id_idx" ON "legal_document_versions" USING btree ("organizer_id");--> statement-breakpoint
CREATE INDEX "legal_versions_event_id_idx" ON "legal_document_versions" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "legal_versions_type_idx" ON "legal_document_versions" USING btree ("document_type");--> statement-breakpoint
CREATE INDEX "legal_docs_organizer_id_idx" ON "legal_documents" USING btree ("organizer_id");--> statement-breakpoint
CREATE INDEX "legal_docs_type_idx" ON "legal_documents" USING btree ("document_type");--> statement-breakpoint
CREATE INDEX "legal_docs_status_idx" ON "legal_documents" USING btree ("status");