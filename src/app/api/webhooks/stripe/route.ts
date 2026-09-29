import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { db } from "@/db";
import { users, orders, tickets, ticketTiers } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { generateSignedTicketJwt } from "@/lib/qr";
import crypto from "crypto";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  let organizerId = searchParams.get("organizerId");

  // If no organizerId in query param, attempt pre-parse payload metadata to get organizerId
  if (!organizerId) {
    try {
      const parsedJson = JSON.parse(body);
      organizerId = parsedJson?.data?.object?.metadata?.organizerId || null;
    } catch {}
  }

  let secretsToTry: string[] = [];

  if (organizerId) {
    const orgRecords = await db.select().from(users).where(eq(users.id, organizerId));
    const org = orgRecords[0];
    if (org?.stripeWebhookSecret && org.stripeWebhookSecret.trim().length > 0) {
      secretsToTry.push(org.stripeWebhookSecret.trim());
    }
  }

  if (process.env.STRIPE_WEBHOOK_SECRET && process.env.STRIPE_WEBHOOK_SECRET.trim().length > 0) {
    secretsToTry.push(process.env.STRIPE_WEBHOOK_SECRET.trim());
  }

  if (secretsToTry.length === 0) {
    console.error("Missing Stripe Webhook Secret (neither organizer secret nor STRIPE_WEBHOOK_SECRET configured).");
    return NextResponse.json(
      { error: "Server configuration error: missing Stripe webhook secret" },
      { status: 500 }
    );
  }

  let event: any = null;
  let lastError: any = null;

  for (const sec of secretsToTry) {
    try {
      event = stripe.webhooks.constructEvent(body, signature, sec);
      if (event) break;
    } catch (err: any) {
      lastError = err;
    }
  }

  if (!event) {
    console.error("Stripe webhook verification error:", lastError?.message);
    return NextResponse.json({ error: `Webhook Error: ${lastError?.message || "Invalid signature"}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as any;
        const { orderId, eventId, tierId, quantity, buyerEmail, buyerName } = session.metadata || {};

        if (!orderId || !eventId || !tierId) {
          console.log("Missing session metadata in webhook fulfillment.");
          break;
        }

        // 1. Fetch Order Record
        const orderRecords = await db.select().from(orders).where(eq(orders.id, orderId));
        const orderRecord = orderRecords[0];

        // Idempotency check: if already completed, ignore
        if (orderRecord && orderRecord.status === "completed") {
          console.log(`Order ${orderId} is already marked completed. Skipping.`);
          break;
        }

        // 2. Mark Order as Completed
        await db
          .update(orders)
          .set({
            status: "completed",
            stripePaymentIntentId: session.payment_intent as string,
          })
          .where(eq(orders.id, orderId));

        // 3. Increment Quantity Sold on Ticket Tier
        const numQty = parseInt(quantity || "1", 10);
        await db
          .update(ticketTiers)
          .set({
            quantitySold: sql`${ticketTiers.quantitySold} + ${numQty}`,
          })
          .where(eq(ticketTiers.id, tierId));

        // 4. Generate Cryptographic QR Ticket Tokens & Insert Tickets
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
          await db.insert(tickets).values(ticketInserts);
        }

        console.log(`[TICKET FULFILLMENT SUCCESS] Issued ${numQty} tickets for Order ${orderId}`);
        break;
      }

      case "account.updated": {
        const account = event.data.object as any;
        console.log(`Stripe Account Updated: ${account.id}`);
        if (account.id) {
          await db
            .update(users)
            .set({ stripeConnectedAccountId: account.id })
            .where(eq(users.stripeConnectedAccountId, account.id));
        }
        break;
      }

      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("Stripe webhook processing error:", err.message);
    return NextResponse.json({ error: `Webhook Processing Error: ${err.message}` }, { status: 500 });
  }
}
