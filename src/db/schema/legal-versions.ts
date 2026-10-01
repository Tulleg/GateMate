import { pgTable, text, timestamp, integer, index } from "drizzle-orm/pg-core";
import { users } from "./users";
import { events } from "./events";

export const legalDocumentVersions = pgTable("legal_document_versions", {
  id: text("id").primaryKey(),
  organizerId: text("organizer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  eventId: text("event_id").references(() => events.id, { onDelete: "cascade" }),
  documentType: text("document_type").notNull(), // 'impressum' | 'privacy' | 'terms' | 'event_terms' | 'ticket_terms' | 'revocation_notice' | 'cancellation_policy'
  version: integer("version").notNull().default(1),
  content: text("content"),
  url: text("url"),
  hash: text("hash").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("legal_versions_org_id_idx").on(table.organizerId),
  index("legal_versions_event_id_idx").on(table.eventId),
  index("legal_versions_type_idx").on(table.documentType),
]);

