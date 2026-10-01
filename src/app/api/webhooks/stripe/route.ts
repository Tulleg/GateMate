import { NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { db } from "@/db";
import { users, orders, tickets, ticketTiers } from "@/db/schema";
import { eq, sql, and } from "drizzle-orm";
import { generateSignedTicketJwt } from "@/lib/qr";
import { sendTicketConfirmationEmailAsync } from "@/lib/email-service";
import crypto from "crypto";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  const organizerId = searchParams.get("organizerId");

  const secretsToTry: string[] = [];

  if (process.env.STRIPE_WEBHOOK_SECRET && process.env.STRIPE_WEBHOOK_SECRET.trim().length > 0) {
    secretsToTry.push(process.env.STRIPE_WEBHOOK_SECRET.trim());
  }

  if (organizerId) {
    const orgRecords = await db.select().from(users).where(eq(users.id, organizerId));
    const org = orgRecords[0];
    if (org?.stripeWebhookSecret && org.stripeWebhookSecret.trim().length > 0) {
      secretsToTry.push(org.stripeWebhookSecret.trim());
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
      case "checkout.session.completed": {
        const session = eventObj.data.object as Stripe.Checkout.Session;
        const metadata = session.metadata || {};
        const { orderId, eventId, tierId, quantity, buyerEmail, buyerName } = metadata;

        if (!orderId || !eventId || !tierId) {
          console.log("[STRIPE WEBHOOK] Missing session metadata in webhook fulfillment.");
          break;
        }

        const numQty = parseInt(quantity || "1", 10);
        let shouldDispatchEmail = false;

        // Atomic & Idempotent Database Transaction
        await db.transaction(async (tx) => {
          // 1. Fetch Order Record with status check inside transaction
          const orderRecords = await tx.select().from(orders).where(eq(orders.id, orderId));
          const orderRecord = orderRecords[0];

          // Idempotency check: if already completed, do not re-process
          if (orderRecord && orderRecord.status === "completed") {
            console.log(`[STRIPE WEBHOOK] Order ${orderId} is already completed. Idempotent skip.`);
            return;
          }

          // 2. Mark Order as Completed
          const paymentIntentId = typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id || null;

          await tx
            .update(orders)
            .set({
              status: "completed",
              stripePaymentIntentId: paymentIntentId,
              updatedAt: new Date(),
            })
            .where(eq(orders.id, orderId));

          // 3. Increment Quantity Sold on Ticket Tier
          await tx
            .update(ticketTiers)
            .set({
              quantitySold: sql`${ticketTiers.quantitySold} + ${numQty}`,
              updatedAt: new Date(),
            })
            .where(eq(ticketTiers.id, tierId));

          // 4. Generate Cryptographic QR Tickets & Insert
          const ticketInserts = [];
          for (let i = 1; i <= numQty; i++) {
            const ticketId = `tkt_${orderId}_${i}`;
            const nonce = crypto.randomBytes(16).toString("hex");

            const signedJwt = await generateSignedTicketJwt({
              ticketId,
              orderId,
              eventId,
              tierId,
              organizationId: "default_org",
              issuedAt: Date.now(),
              nonce,
            });

            ticketInserts.push({
              id: ticketId,
              orderId,
              ticketTierId: tierId,
              attendeeName: buyerName || "Attendee",
              qrHashToken: signedJwt,
              status: "valid" as const,
            });
          }

          if (ticketInserts.length > 0) {
            await tx.insert(tickets).values(ticketInserts);
          }

          shouldDispatchEmail = true;
          console.log(`[TICKET FULFILLMENT SUCCESS] Issued ${numQty} tickets for Order ${orderId}`);
        });

        // 5. Decoupled Asynchronous Email Dispatch (Outside Transaction)
        if (shouldDispatchEmail) {
          const targetEmail = buyerEmail || session.customer_details?.email;
          if (targetEmail) {
            sendTicketConfirmationEmailAsync({
              orderId,
              eventId,
              tierId,
              targetEmail,
              buyerName: buyerName || session.customer_details?.name || "Kunde",
              ticketCount: numQty,
              amountTotal: session.amount_total || 0,
            }).catch((emailErr) => {
              console.error("[DECOUPLED EMAIL DISPATCH ERROR]", emailErr);
            });
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
