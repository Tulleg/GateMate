import { relations } from "drizzle-orm";
import { users, sessions, accounts } from "./users";
import { organizations, organizationMembers } from "./organizations";
import { events, ticketTiers } from "./events";
import { orders, tickets, checkInLogs } from "./tickets";
import { legalDocuments } from "./legal-documents";
import { legalDocumentVersions } from "./legal-versions";
import { contactMessages } from "./contact-messages";

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  accounts: many(accounts),
  organizationMemberships: many(organizationMembers),
  events: many(events),
  scannedLogs: many(checkInLogs),
  legalDocuments: many(legalDocuments),
  legalDocumentVersions: many(legalDocumentVersions),
  contactMessages: many(contactMessages),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const organizationsRelations = relations(organizations, ({ many }) => ({
  members: many(organizationMembers),
}));

export const organizationMembersRelations = relations(organizationMembers, ({ one }) => ({
  organization: one(organizations, {
    fields: [organizationMembers.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [organizationMembers.userId],
    references: [users.id],
  }),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  organizer: one(users, {
    fields: [events.organizerId],
    references: [users.id],
  }),
  ticketTiers: many(ticketTiers),
  orders: many(orders),
  legalDocumentVersions: many(legalDocumentVersions),
}));

export const ticketTiersRelations = relations(ticketTiers, ({ one, many }) => ({
  event: one(events, {
    fields: [ticketTiers.eventId],
    references: [events.id],
  }),
  tickets: many(tickets),
  orders: many(orders),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  event: one(events, {
    fields: [orders.eventId],
    references: [events.id],
  }),
  ticketTier: one(ticketTiers, {
    fields: [orders.ticketTierId],
    references: [ticketTiers.id],
  }),
  tickets: many(tickets),
}));

export const ticketsRelations = relations(tickets, ({ one, many }) => ({
  order: one(orders, {
    fields: [tickets.orderId],
    references: [orders.id],
  }),
  tier: one(ticketTiers, {
    fields: [tickets.ticketTierId],
    references: [ticketTiers.id],
  }),
  checkInLogs: many(checkInLogs),
}));

export const checkInLogsRelations = relations(checkInLogs, ({ one }) => ({
  ticket: one(tickets, {
    fields: [checkInLogs.ticketId],
    references: [tickets.id],
  }),
  scannedBy: one(users, {
    fields: [checkInLogs.scannedByUserId],
    references: [users.id],
  }),
}));

export const legalDocumentsRelations = relations(legalDocuments, ({ one }) => ({
  organizer: one(users, {
    fields: [legalDocuments.organizerId],
    references: [users.id],
  }),
}));

export const legalDocumentVersionsRelations = relations(legalDocumentVersions, ({ one }) => ({
  organizer: one(users, {
    fields: [legalDocumentVersions.organizerId],
    references: [users.id],
  }),
  event: one(events, {
    fields: [legalDocumentVersions.eventId],
    references: [events.id],
  }),
}));

export const contactMessagesRelations = relations(contactMessages, ({ one }) => ({
  user: one(users, {
    fields: [contactMessages.userId],
    references: [users.id],
  }),
}));
