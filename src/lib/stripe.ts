import Stripe from "stripe";
import { decryptText } from "@/lib/encryption";

const stripeSecretKey =
  process.env.STRIPE_SECRET_KEY || "sk_test_dummy_build_key_placeholder";

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2025-02-24.acacia",
  typescript: true,
});

export const PLATFORM_FEE_PERCENT = parseFloat(process.env.STRIPE_PLATFORM_FEE_PERCENT || "5.0");

export function getPlatformFeePercent(): number {
  return PLATFORM_FEE_PERCENT;
}


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
  const decryptedKey = decryptText(organizer?.stripeSecretKey);

  if (decryptedKey && decryptedKey.trim().length > 0) {
    return {
      client: new Stripe(decryptedKey.trim(), {
        apiVersion: "2025-02-24.acacia",
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

export function hasOrganizerStripeAccount(organizer?: { stripeSecretKey?: string | null; stripeAccountId?: string | null; stripeConnectedAccountId?: string | null } | null): boolean {
  if (!organizer) return false;
  const decryptedKey = decryptText(organizer.stripeSecretKey);
  const hasDirectKey = Boolean(decryptedKey && decryptedKey.trim().length > 0);
  const connectedId = organizer.stripeAccountId || organizer.stripeConnectedAccountId;
  const hasConnectedAccount = Boolean(connectedId && connectedId.trim().length > 0);
  return hasDirectKey || hasConnectedAccount;
}

export function getOrganizerWebhookSecret(organizer?: { stripeWebhookSecret?: string | null } | null): string | undefined {
  const decryptedSecret = decryptText(organizer?.stripeWebhookSecret);
  if (decryptedSecret && decryptedSecret.trim().length > 0) {
    return decryptedSecret.trim();
  }
  return process.env.STRIPE_WEBHOOK_SECRET;
}
