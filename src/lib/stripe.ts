import Stripe from "stripe";

const stripeSecretKey =
  process.env.STRIPE_SECRET_KEY || "sk_test_dummy_build_key_placeholder";

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2024-12-18.acacia" as any,
  typescript: true,
});

export const PLATFORM_FEE_PERCENT = parseFloat(process.env.STRIPE_PLATFORM_FEE_PERCENT || "5.0");

export function hasPlatformStripeKey(): boolean {
  return (
    Boolean(process.env.STRIPE_SECRET_KEY) &&
    process.env.STRIPE_SECRET_KEY !== "sk_test_dummy_build_key_placeholder"
  );
}

export function getOrganizerStripeClient(organizer?: { stripeSecretKey?: string | null } | null): {
  client: Stripe;
  isDirectKey: boolean;
} {
  if (organizer?.stripeSecretKey && organizer.stripeSecretKey.trim().length > 0) {
    return {
      client: new Stripe(organizer.stripeSecretKey.trim(), {
        apiVersion: "2024-12-18.acacia" as any,
        typescript: true,
      }),
      isDirectKey: true,
    };
  }

  return {
    client: stripe,
    isDirectKey: false,
  };
}

export function hasOrganizerStripeAccount(organizer?: { stripeSecretKey?: string | null; stripeConnectedAccountId?: string | null } | null): boolean {
  if (!organizer) return false;
  const hasDirectKey = Boolean(organizer.stripeSecretKey && organizer.stripeSecretKey.trim().length > 0);
  const hasConnectedAccount = Boolean(organizer.stripeConnectedAccountId && organizer.stripeConnectedAccountId.trim().length > 0);
  return hasDirectKey || hasConnectedAccount;
}

export function getOrganizerWebhookSecret(organizer?: { stripeWebhookSecret?: string | null } | null): string | undefined {
  if (organizer?.stripeWebhookSecret && organizer.stripeWebhookSecret.trim().length > 0) {
    return organizer.stripeWebhookSecret.trim();
  }
  return process.env.STRIPE_WEBHOOK_SECRET;
}

