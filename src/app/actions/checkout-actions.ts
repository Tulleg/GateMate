"use server";

import Stripe from "stripe";
import { db } from "@/db";
import { events, ticketTiers, orders, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { orderCreateSchema, OrderCreateInput } from "@/lib/validation";
import { ActionResult, formatZodErrors } from "@/types";
import { getOrganizerStripeClient, PLATFORM_FEE_PERCENT } from "@/lib/stripe";
import { formatLegalAddress } from "@/lib/legal";

export async function createCheckoutSessionAction(
  input: unknown
): Promise<ActionResult<{ checkoutUrl: string; orderId: string }>> {
  try {
    const validated = orderCreateSchema.safeParse(input);
    if (!validated.success) {
      return {
        success: false,
        error: "Ungültige Bestellangaben.",
        fieldErrors: formatZodErrors(validated.error),
      };
    }

    const data: OrderCreateInput = validated.data;

    // 1. Fetch Event & Tier
    const eventRecords = await db.select().from(events).where(eq(events.id, data.eventId));
    const eventRecord = eventRecords[0];

    if (!eventRecord || !eventRecord.isPublished || eventRecord.isCancelled) {
      return {
        success: false,
        error: "Dieses Event ist aktuell nicht für den Ticketkauf verfügbar.",
      };
    }

    const tierRecords = await db.select().from(ticketTiers).where(eq(ticketTiers.id, data.ticketTierId));
    const tierRecord = tierRecords[0];

    if (!tierRecord) {
      return {
        success: false,
        error: "Die gewählte Ticketkategorie existiert nicht.",
      };
    }

    const available = tierRecord.quantityAvailable - tierRecord.quantitySold;
    if (available < data.quantity) {
      return {
        success: false,
        error: `Leider sind nur noch ${available} Tickets in dieser Kategorie verfügbar.`,
      };
    }

    // 2. Fetch Organizer
    const organizerRecords = await db.select().from(users).where(eq(users.id, eventRecord.organizerId));
    const organizer = organizerRecords[0];

    const { client: stripeClient, isDirectKey } = getOrganizerStripeClient(organizer);

    const unitPriceCents = tierRecord.priceCents + (tierRecord.feeCents || 0);
    const totalCents = unitPriceCents * data.quantity;

    const orderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes reservation window

    // Legal & Terms Snapshot
    const termsSnapshot = JSON.stringify({
      acceptedAt: new Date().toISOString(),
      eventTerms: eventRecord.eventTerms,
      ticketTerms: tierRecord.ticketTerms,
      cancellationPolicy: eventRecord.cancellationPolicy,
    });

    const legalProfileSnapshot = JSON.stringify({
      legalName: organizer?.legalName || organizer?.name || "Veranstalter",
      legalAddress: formatLegalAddress(organizer),
      vatId: organizer?.vatId,
      isSmallBusiness: organizer?.isSmallBusiness,
    });

    // 3. Create Pending Order Record
    await db.insert(orders).values({
      id: orderId,
      eventId: data.eventId,
      ticketTierId: data.ticketTierId,
      quantity: data.quantity,
      customerEmail: data.customerEmail.toLowerCase().trim(),
      totalCents,
      status: "pending",
      termsSnapshot,
      legalProfileSnapshot,
      expiresAt,
    });

    // 4. Build Stripe Checkout Session
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const successUrl = `${appUrl}/tickets/${orderId}?success=true`;
    const cancelUrl = `${appUrl}/e/${eventRecord.slug}?canceled=true`;

    const metadata: Record<string, string> = {
      orderId,
      eventId: data.eventId,
      tierId: data.ticketTierId,
      quantity: data.quantity.toString(),
      buyerEmail: data.customerEmail,
      buyerName: data.customerName,
    };

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      {
        price_data: {
          currency: "eur",
          product_data: {
            name: `${eventRecord.title} – ${tierRecord.name}`,
            description: `Ticket für ${eventRecord.title} (Veranstalter: ${organizer?.legalName || organizer?.name || "Veranstalter"})`,
          },
          unit_amount: unitPriceCents,
        },
        quantity: data.quantity,
      },
    ];

    const sessionOptions: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      customer_email: data.customerEmail,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata,
      expires_at: Math.floor(expiresAt.getTime() / 1000),
    };

    if (!isDirectKey && organizer?.stripeConnectedAccountId) {
      const applicationFeeAmount = Math.round(totalCents * (PLATFORM_FEE_PERCENT / 100));
      sessionOptions.payment_intent_data = {
        application_fee_amount: applicationFeeAmount,
        transfer_data: {
          destination: organizer.stripeConnectedAccountId,
        },
      };
    }

    const session = await stripeClient.checkout.sessions.create(sessionOptions);

    if (!session.url) {
      return {
        success: false,
        error: "Fehler beim Erstellen der Stripe-Checkout-Session.",
      };
    }

    // Update order with checkout session id
    await db
      .update(orders)
      .set({ stripeCheckoutSessionId: session.id })
      .where(eq(orders.id, orderId));

    return {
      success: true,
      data: {
        checkoutUrl: session.url,
        orderId,
      },
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Fehler beim Erstellen der Bestellung.";
    console.error("[CREATE CHECKOUT SESSION ACTION ERROR]", err);
    return {
      success: false,
      error: errorMsg,
    };
  }
}
