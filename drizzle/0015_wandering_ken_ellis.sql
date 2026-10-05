CREATE TABLE "contact_message_replies" (
	"id" text PRIMARY KEY NOT NULL,
	"message_id" text NOT NULL,
	"sender_name" text NOT NULL,
	"sender_email" text NOT NULL,
	"reply_text" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "contact_message_replies" ADD CONSTRAINT "contact_message_replies_message_id_contact_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."contact_messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "contact_message_replies_message_id_idx" ON "contact_message_replies" USING btree ("message_id");