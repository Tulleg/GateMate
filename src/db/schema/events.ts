import { pgTable, text, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { users } from "./users";

export const events = pgTable("events", {
  id: text("id").primaryKey(),
  organizerId: text("organizer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  bannerUrl: text("banner_url"),
  venue: text("venue"),
  venueStreet: text("venue_street"),
  venueZip: text("venue_zip"),
  venueCity: text("venue_city"),
  venueCountry: text("venue_country").default("Deutschland"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  doorsOpenAt: timestamp("doors_open_at"),
  ageRestriction: text("age_restriction"),
  isPublished: boolean("is_published").default(false).notNull(),
  isListedInDirectory: boolean("is_listed_in_directory").default(true).notNull(),
  isCancelled: boolean("is_cancelled").default(false).notNull(),
  cancelReason: text("cancel_reason"),
  cancelledAt: timestamp("cancelled_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const ticketTiers = pgTable("ticket_tiers", {
  id: text("id").primaryKey(),
  eventId: text("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  priceCents: integer("price_cents").notNull(),
  quantityAvailable: integer("quantity_available").notNull(),
  quantitySold: integer("quantity_sold").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
