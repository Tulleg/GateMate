import { pgTable, text, timestamp, pgEnum, boolean, index, uniqueIndex } from "drizzle-orm/pg-core";
import { users } from "./users";

export const orgRoleEnum = pgEnum("org_role", ["owner", "admin", "scanner"]);

export const organizations = pgTable("organizations", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  logoUrl: text("logo_url"),
  // Stripe Connect fields
  stripeAccountId: text("stripe_account_id"),
  stripeOnboardingComplete: boolean("stripe_onboarding_complete").default(false).notNull(),
  stripePayoutsEnabled: boolean("stripe_payouts_enabled").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("organizations_slug_idx").on(table.slug),
]);

export const organizationMembers = pgTable("organization_members", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: orgRoleEnum("role").default("admin").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("org_members_user_id_idx").on(table.userId),
  index("org_members_org_id_idx").on(table.organizationId),
  uniqueIndex("org_members_user_org_unique").on(table.userId, table.organizationId),
]);

