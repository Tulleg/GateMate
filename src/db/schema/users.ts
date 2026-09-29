import { pgTable, text, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";

export const systemRoleEnum = pgEnum("system_role", ["superadmin", "organizer", "attendee"]);

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  role: systemRoleEnum("role").default("attendee").notNull(),
  stripeConnectedAccountId: text("stripe_connected_account_id"),
  stripePublishableKey: text("stripe_publishable_key"),
  stripeSecretKey: text("stripe_secret_key"),
  stripeWebhookSecret: text("stripe_webhook_secret"),
  stripeMode: text("stripe_mode").default("connect"), // 'connect' | 'direct_keys'
  name: text("name"),
  organizerSlug: text("organizer_slug").unique(),
  bio: text("bio"),
  emailVerified: boolean("email_verified").default(false),
  image: text("image"),
  // Organizer Legal Profile
  legalName: text("legal_name"),
  street: text("street"),
  zip: text("zip"),
  city: text("city"),
  country: text("country").default("Deutschland"),
  vatId: text("vat_id"),
  isSmallBusiness: boolean("is_small_business").default(false).notNull(),
  legalMode: text("legal_mode").default("custom_text"), // 'url' | 'custom_text'
  impressumUrl: text("impressum_url"),
  impressumContent: text("impressum_content"),
  privacyUrl: text("privacy_url"),
  privacyContent: text("privacy_content"),
  termsUrl: text("terms_url"),
  termsContent: text("terms_content"),
  revocationNoticeCustom: text("revocation_notice_custom"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const accounts = pgTable("accounts", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  expiresAt: timestamp("expires_at"),
  password: text("password"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
