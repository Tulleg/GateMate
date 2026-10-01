import { pgTable, text, timestamp, integer, boolean, index } from "drizzle-orm/pg-core";
import { users } from "./users";
import { eventTypeEnum } from "./legal-documents";

export const events = pgTable("events", {
  id: text("id").primaryKey(),
  organizerId: text("organizer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  eventType: eventTypeEnum("event_type").default("other"),
  enabledLegalModules: text("enabled_legal_modules"),
  bannerUrl: text("banner_url"),
  venue: text("venue"),
  venueStreet: text("venue_street"),
  venueZip: text("venue_zip"),
  venueCity: text("venue_city"),
  venueCountry: text("venue_country").default("Deutschland"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  hasEndTime: boolean("has_end_time").default(true).notNull(),
  isFixedDateEvent: boolean("is_fixed_date_event").default(true).notNull(),
  doorsOpenAt: timestamp("doors_open_at"),
  ageRestriction: text("age_restriction"),
  accessibilityInfo: text("accessibility_info"),
  houseRules: text("house_rules"),
  specialAdmissionConditions: text("special_admission_conditions"),
  eventTerms: text("event_terms"),
  cancellationPolicy: text("cancellation_policy"),
  salesStartDate: timestamp("sales_start_date"),
  salesEndDate: timestamp("sales_end_date"),
  legalChecklistConfirmedAt: timestamp("legal_checklist_confirmed_at"),
  legalChecklistConfirmedBy: text("legal_checklist_confirmed_by"),
  isPublished: boolean("is_published").default(false).notNull(),
  isListedInDirectory: boolean("is_listed_in_directory").default(true).notNull(),
  isCancelled: boolean("is_cancelled").default(false).notNull(),
  cancelReason: text("cancel_reason"),
  cancelledAt: timestamp("cancelled_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("events_organizer_id_idx").on(table.organizerId),
  index("events_slug_idx").on(table.slug),
  index("events_start_date_idx").on(table.startDate),
  index("events_is_published_idx").on(table.isPublished),
]);

export const ticketTiers = pgTable("ticket_tiers", {
  id: text("id").primaryKey(),
  eventId: text("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  priceCents: integer("price_cents").notNull(),
  feeCents: integer("fee_cents").default(0).notNull(),
  includedServices: text("included_services"),
  ticketTerms: text("ticket_terms"),
  quantityAvailable: integer("quantity_available").notNull(),
  quantitySold: integer("quantity_sold").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("ticket_tiers_event_id_idx").on(table.eventId),
]);

