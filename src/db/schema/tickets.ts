import { pgTable, text, timestamp, integer, pgEnum, uniqueIndex } from "drizzle-orm/pg-core";
import { users } from "./users";
import { events, ticketTiers } from "./events";

export const orderStatusEnum = pgEnum("order_status", ["pending", "completed", "failed", "refunded"]);
export const ticketStatusEnum = pgEnum("ticket_status", ["valid", "used", "cancelled"]);

export const orders = pgTable("orders", {
  id: text("id").primaryKey(),
  eventId: text("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  customerEmail: text("customer_email").notNull(),
  totalCents: integer("total_cents").notNull(),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  stripeCheckoutSessionId: text("stripe_checkout_session_id"),
  status: orderStatusEnum("status").default("pending").notNull(),
  termsSnapshot: text("terms_snapshot"),
  legalProfileSnapshot: text("legal_profile_snapshot"),
  documentVersionsSnapshot: text("document_versions_snapshot"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  acceptedAt: timestamp("accepted_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const tickets = pgTable("tickets", {
  id: text("id").primaryKey(),
  orderId: text("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  ticketTierId: text("ticket_tier_id").notNull().references(() => ticketTiers.id, { onDelete: "cascade" }),
  attendeeName: text("attendee_name").notNull(),
  qrHashToken: text("qr_hash_token").notNull(),
  status: ticketStatusEnum("status").default("valid").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const checkInLogs = pgTable("check_in_logs", {
  id: text("id").primaryKey(),
  ticketId: text("ticket_id").notNull().references(() => tickets.id, { onDelete: "cascade" }),
  scannedByUserId: text("scanned_by_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  scannedAt: timestamp("scanned_at").defaultNow().notNull(),
  deviceInfo: text("device_info"),
}, (table) => {
  return [
    uniqueIndex("unique_ticket_checkin_idx").on(table.ticketId),
  ];
});
