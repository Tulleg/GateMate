import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { db } from "@/db";
import { users, orders, tickets, ticketTiers, events } from "@/db/schema";
import { eq, sql, and } from "drizzle-orm";
import { generateSignedTicketJwt } from "@/lib/qr";
import { sendTicketConfirmationEmail } from "@/lib/email";
import { formatLegalAddress } from "@/lib/legal";
import crypto from "crypto";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  let organizerId = searchParams.get("organizerId");

  let secretsToTry: string[] = [];

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

  let eventObj: any = null;
  let lastError: any = null;

  for (const sec of secretsToTry) {
    try {
      eventObj = stripe.webhooks.constructEvent(body, signature, sec);
      if (eventObj) break;
    } catch (err: any) {
      lastError = err;
    }
  }

  if (!eventObj) {
    console.error("Stripe webhook verification error:", lastError?.message);
    return NextResponse.json({ error: `Webhook Error: ${lastError?.message || "Invalid signature"}` }, { status: 400 });
  }

  try {
    switch (eventObj.type) {
      case "checkout.session.completed": {
        const session = eventObj.data.object as any;
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

        // 5. Trigger Resend Ticket Confirmation Email
        const targetEmail = buyerEmail || session.customer_details?.email;
        if (targetEmail) {
          try {
            const eventRecords = await db.select().from(events).where(eq(events.id, eventId));
            const tierRecords = await db.select().from(ticketTiers).where(eq(ticketTiers.id, tierId));

            const currentEvent = eventRecords[0];
            const currentTier = tierRecords[0];

            const organizerRecords = currentEvent?.organizerId
              ? await db.select().from(users).where(eq(users.id, currentEvent.organizerId))
              : [];
            const organizer = organizerRecords[0];

            await sendTicketConfirmationEmail({
              buyerEmail: targetEmail,
              buyerName: buyerName || session.customer_details?.name || "Kunde",
              orderId,
              eventTitle: currentEvent?.title || "GateMate Event",
              eventDate: currentEvent?.startDate,
              venue: currentEvent?.venue,
              ticketCount: numQty,
              tierName: currentTier?.name || "Standard Ticket",
              totalCents: orderRecord?.totalCents || session.amount_total || 0,
              organizerLegalName: organizer?.legalName || organizer?.name || "Veranstalter",
              organizerAddress: formatLegalAddress(organizer),
              organizerVatId: organizer?.vatId,
              isSmallBusiness: organizer?.isSmallBusiness,
            });
          } catch (mailErr: any) {
            console.error("Failed to trigger Resend confirmation email:", mailErr?.message || mailErr);
          }
        }
        break;
      }

      case "checkout.session.expired": {
        const session = eventObj.data.object as any;
        const { orderId } = session.metadata || {};

        if (orderId) {
          console.log(`[STRIPE WEBHOOK] Checkout session expired for Order ${orderId}. Marking status as failed.`);
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
        const paymentIntent = eventObj.data.object as any;
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
        const account = eventObj.data.object as any;
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
