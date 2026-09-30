import { pgTable, text, timestamp, integer, pgEnum } from "drizzle-orm/pg-core";
import { users } from "./users";

export const legalDocumentTypeEnum = pgEnum("legal_document_type", [
  // Platform Documents (organizer_id IS NULL)
  "platform_impressum",
  "platform_privacy",
  "platform_terms",
  // Organizer Documents (organizer_id IS NOT NULL)
  "organizer_impressum",
  "organizer_privacy",
  "organizer_agb",
  "event_terms",        // Teilnahmebedingungen
  "ticket_terms",       // Ticketbedingungen
  "refund_policy",      // Erstattungsbedingungen
  "revocation_notice",  // Widerrufsinformationen
]);

export const legalDocumentStatusEnum = pgEnum("legal_document_status", [
  "draft",
  "published",
  "archived",
]);

export const eventTypeEnum = pgEnum("event_type", [
  "concert",
  "sports",
  "club_association",
  "workshop",
  "festival",
  "other",
]);

export const legalDocuments = pgTable("legal_documents", {
  id: text("id").primaryKey(), // e.g. doc_...
  organizerId: text("organizer_id").references(() => users.id, { onDelete: "cascade" }), // NULL for platform docs
  documentType: legalDocumentTypeEnum("document_type").notNull(),
  title: text("title").notNull(),
  content: text("content"),
  url: text("url"), // Optional external link if legalMode = 'url'
  eventType: eventTypeEnum("event_type"), // Scope to event category (null = applies to all)
  applicableModules: text("applicable_modules"), // JSON text array e.g. '["statutory_revocation_exemption", "house_rules"]'
  version: integer("version").notNull().default(1),
  status: legalDocumentStatusEnum("status").notNull().default("draft"),
  hash: text("hash").notNull(), // SHA-256 content hash
  createdAt: timestamp("created_at").defaultNow().notNull(),
  publishedAt: timestamp("published_at"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  validFrom: timestamp("valid_from"),
  validUntil: timestamp("valid_until"),
});
