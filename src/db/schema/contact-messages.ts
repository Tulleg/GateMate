import { pgTable, text, timestamp, boolean, pgEnum, index } from "drizzle-orm/pg-core";
import { users } from "./users";

export const messageTypeEnum = pgEnum("message_type", [
  "general",
  "dsa_notice",
]);

export const messageCategoryEnum = pgEnum("message_category", [
  "general",
  "organizer_support",
  "buyer_support",
  "billing",
  "legal_dsa",
  "other",
]);

export const messageStatusEnum = pgEnum("message_status", [
  "new",
  "in_progress",
  "replied",
  "archived",
]);

export const contactMessages = pgTable("contact_messages", {
  id: text("id").primaryKey(), // msg_...
  type: messageTypeEnum("type").default("general").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  category: messageCategoryEnum("category").default("general").notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  // Specific fields for DSA Art. 16 Notice & Action reports
  targetUrl: text("target_url"),
  violationType: text("violation_type"),
  legalReason: text("legal_reason"),
  dsaDeclaration: boolean("dsa_declaration").default(false),
  // Processing status & Admin notes
  status: messageStatusEnum("status").default("new").notNull(),
  adminNotes: text("admin_notes"),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("contact_messages_status_idx").on(table.status),
  index("contact_messages_category_idx").on(table.category),
  index("contact_messages_user_id_idx").on(table.userId),
]);

