import { pgTable, text, timestamp, boolean, pgEnum, json, index } from "drizzle-orm/pg-core";

export const systemRoleEnum = pgEnum("system_role", ["superadmin", "organizer"]);

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  role: systemRoleEnum("role").default("organizer").notNull(),
  // Onboarding Workflow State Management
  onboardingCompleted: boolean("onboarding_completed").default(false).notNull(),
  onboardingStep: text("onboarding_step").default("stripe_connect").notNull(), // 'stripe_connect' | 'legal_info' | 'agb_terms' | 'completed'
  stripeAccountType: text("stripe_account_type").default("express"), // 'express' | 'custom_keys'
  stripeAccountId: text("stripe_account_id"),
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
  // Organizer Legal Profile & DSA KYTC Compliance (Art. 30 Digital Services Act)
  legalCompanyName: text("legal_company_name"),
  legalVatId: text("legal_vat_id"),
  legalAddress: json("legal_address"),
  termsAcceptedAt: timestamp("terms_accepted_at"),
  privacyAcceptedAt: timestamp("privacy_accepted_at"),
  avvAcceptedAt: timestamp("avv_accepted_at"),
  legalName: text("legal_name"),
  legalForm: text("legal_form"),
  responsiblePerson: text("responsible_person"),
  registrationCouncil: text("registration_council"),
  registrationNumber: text("registration_number"),
  phone: text("phone"),
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
  cancellationPolicyContent: text("cancellation_policy_content"),
  eventTermsContent: text("event_terms_content"),
  revocationNoticeCustom: text("revocation_notice_custom"),
  isVerifiedByAdmin: boolean("is_verified_by_admin").default(false).notNull(),
  kytcVerifiedAt: timestamp("kytc_verified_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("users_role_idx").on(table.role),
  index("users_organizer_slug_idx").on(table.organizerSlug),
]);

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("sessions_user_id_idx").on(table.userId),
  index("sessions_token_idx").on(table.token),
]);

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
}, (table) => [
  index("accounts_user_id_idx").on(table.userId),
]);

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("verification_identifier_idx").on(table.identifier),
]);

