import { NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { db } from "@/db";
import { users, orders } from "@/db/schema";
import { eq, and, isNotNull } from "drizzle-orm";
import { decryptText } from "@/lib/encryption";
import { fulfillOrder } from "@/lib/order-fulfillment";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  let organizerId = searchParams.get("organizerId");

  // Attempt to parse unverified payload for auto-detecting organizer / order details
  let unverifiedPayload: any = null;
  try {
    unverifiedPayload = JSON.parse(body);
  } catch {
    // Ignore JSON parse errors for invalid payloads
  }

  const secretsToTry: string[] = [];

  if (process.env.STRIPE_WEBHOOK_SECRET && process.env.STRIPE_WEBHOOK_SECRET.trim().length > 0) {
    secretsToTry.push(process.env.STRIPE_WEBHOOK_SECRET.trim());
  }

  // 1. Try resolving organizerId from payload metadata or Connect account ID if not in searchParams
  if (!organizerId && unverifiedPayload) {
    const metadata = unverifiedPayload.data?.object?.metadata;
    if (metadata?.organizerId) {
      organizerId = metadata.organizerId;
    } else if (metadata?.orderId) {
      const orderRecords = await db.select().from(orders).where(eq(orders.id, metadata.orderId));
      if (orderRecords[0]?.eventId) {
        const eventRecords = await db.select().from(orders).where(eq(orders.id, metadata.orderId));
        // We can get organizerId from user query via connected account if available
      }
    }
  }

  // 2. Fetch specific organizer secret if organizerId is known
  if (organizerId) {
    const orgRecords = await db.select().from(users).where(eq(users.id, organizerId));
    const org = orgRecords[0];
    const decryptedSecret = decryptText(org?.stripeWebhookSecret);
    if (decryptedSecret && decryptedSecret.trim().length > 0) {
      secretsToTry.push(decryptedSecret.trim());
    }
  }

  // 3. Fallback: If payload came from a Connect account, check connected account user
  if (unverifiedPayload?.account) {
    const connectOrgRecords = await db
      .select()
      .from(users)
      .where(eq(users.stripeConnectedAccountId, unverifiedPayload.account));
    const connectOrg = connectOrgRecords[0];
    const decryptedSecret = decryptText(connectOrg?.stripeWebhookSecret);
    if (decryptedSecret && decryptedSecret.trim().length > 0 && !secretsToTry.includes(decryptedSecret.trim())) {
      secretsToTry.push(decryptedSecret.trim());
    }
  }

  // 4. Ultimate Fallback: Add all non-null organizer webhook secrets from DB
  const allOrgsWithWebhooks = await db
    .select({ stripeWebhookSecret: users.stripeWebhookSecret })
    .from(users)
    .where(isNotNull(users.stripeWebhookSecret));

  for (const org of allOrgsWithWebhooks) {
    const decrypted = decryptText(org.stripeWebhookSecret);
    if (decrypted && decrypted.trim().length > 0 && !secretsToTry.includes(decrypted.trim())) {
      secretsToTry.push(decrypted.trim());
    }
  }

  if (secretsToTry.length === 0) {
    console.error("Missing Stripe Webhook Secret (neither platform secret nor organizer secret configured).");
    return NextResponse.json(
      { error: "Server configuration error: missing Stripe webhook secret" },
      { status: 500 }
    );
  }

  let eventObj: Stripe.Event | null = null;
  let lastError: Error | null = null;

  for (const sec of secretsToTry) {
    try {
      eventObj = stripe.webhooks.constructEvent(body, signature, sec);
      if (eventObj) break;
    } catch (err: unknown) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  if (!eventObj) {
    console.error("Stripe webhook verification error:", lastError?.message);
    return NextResponse.json({ error: `Webhook Error: ${lastError?.message || "Invalid signature"}` }, { status: 400 });
  }

  try {
    switch (eventObj.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = eventObj.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.orderId;

        if (!orderId) {
          // If orderId is missing in metadata, attempt lookup by checkout session id
          if (session.id) {
            const orderRecords = await db.select().from(orders).where(eq(orders.stripeCheckoutSessionId, session.id));
            if (orderRecords[0]) {
              const paymentIntentId = typeof session.payment_intent === "string"
                ? session.payment_intent
                : session.payment_intent?.id || null;
              await fulfillOrder(orderRecords[0].id, paymentIntentId);
            }
          }
          break;
        }

        const paymentIntentId = typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id || null;

        await fulfillOrder(orderId, paymentIntentId);
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = eventObj.data.object as Stripe.PaymentIntent;
        const orderId = paymentIntent.metadata?.orderId;
        if (orderId) {
          await fulfillOrder(orderId, paymentIntent.id);
        } else if (paymentIntent.id) {
          const orderRecords = await db.select().from(orders).where(eq(orders.stripePaymentIntentId, paymentIntent.id));
          if (orderRecords[0]) {
            await fulfillOrder(orderRecords[0].id, paymentIntent.id);
          }
        }
        break;
      }

      case "checkout.session.expired": {
        const session = eventObj.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.orderId;

        if (orderId) {
          console.log(`[STRIPE WEBHOOK] Checkout session expired for Order ${orderId}.`);
          await db
            .update(orders)
            .set({ status: "failed", updatedAt: new Date() })
            .where(and(eq(orders.id, orderId), eq(orders.status, "pending")));
        } else if (session.id) {
          await db
            .update(orders)
            .set({ status: "failed", updatedAt: new Date() })
            .where(and(eq(orders.stripeCheckoutSessionId, session.id), eq(orders.status, "pending")));
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = eventObj.data.object as Stripe.PaymentIntent;
        console.log(`[STRIPE WEBHOOK] Payment intent failed: ${paymentIntent.id}`);
        if (paymentIntent.id) {
          await db
            .update(orders)
            .set({ status: "failed", updatedAt: new Date() })
            .where(and(eq(orders.stripePaymentIntentId, paymentIntent.id), eq(orders.status, "pending")));
        }
        break;
      }

      case "account.updated": {
        const account = eventObj.data.object as Stripe.Account;
        console.log(`Stripe Account Updated: ${account.id}`);
        if (account.id) {
          await db
            .update(users)
            .set({ stripeConnectedAccountId: account.id, updatedAt: new Date() })
            .where(eq(users.stripeConnectedAccountId, account.id));
        }
        break;
      }

      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Unbekannter Verarbeitungsfehler";
    console.error("Stripe webhook processing error:", errorMsg);
    return NextResponse.json({ error: `Webhook Processing Error: ${errorMsg}` }, { status: 500 });
  }
}

