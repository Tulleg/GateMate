import Stripe from "stripe";

const stripeSecretKey =
  process.env.STRIPE_SECRET_KEY || "sk_test_dummy_build_key_placeholder";

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2024-12-18.acacia" as any,
  typescript: true,
});

export const PLATFORM_FEE_PERCENT = parseFloat(process.env.STRIPE_PLATFORM_FEE_PERCENT || "5.0");
