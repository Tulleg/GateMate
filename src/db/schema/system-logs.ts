import { pgTable, text, timestamp, pgEnum, index } from "drizzle-orm/pg-core";

export const logSeverityEnum = pgEnum("log_severity", [
  "critical",
  "warning",
  "info",
]);

export const logCategoryEnum = pgEnum("log_category", [
  "payment",
  "email",
  "check_in",
  "legal",
  "system",
]);

export const systemLogs = pgTable(
  "system_logs",
  {
    id: text("id").primaryKey(), // log_...
    severity: logSeverityEnum("severity").default("info").notNull(),
    category: logCategoryEnum("category").default("system").notNull(),
    message: text("message").notNull(),
    details: text("details"),
    relatedEntityId: text("related_entity_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("system_logs_severity_idx").on(table.severity),
    index("system_logs_category_idx").on(table.category),
    index("system_logs_created_at_idx").on(table.createdAt),
  ]
);
