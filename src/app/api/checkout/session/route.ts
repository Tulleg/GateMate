import { NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe, getOrganizerStripeClient, hasOrganizerStripeAccount } from "@/lib/stripe";
import { getPlatformFeePercent } from "@/lib/platform-settings";
import { db } from "@/db";

import { events, ticketTiers, users, orders } from "@/db/schema";
import { eq, and, gt, sql } from "drizzle-orm";
import { createOrderLegalSnapshot } from "@/lib/legal-server";
import { cleanupExpiredOrders } from "@/lib/orders-cleanup";


export async function POST(req: Request) {
  try {
    // 0. Auto-clean expired pending reservations before processing checkout
    await cleanupExpiredOrders();

    const { eventId, tierId, quantity = 1, buyerEmail, buyerName } = await req.json();

    if (!eventId || !tierId || !buyerEmail || !buyerName) {
      return NextResponse.json({ error: "Missing required checkout parameters" }, { status: 400 });
    }

    const numQuantity = Math.max(1, parseInt(quantity, 10));

    // 1. Fetch Event
    const eventRecords = await db.select().from(events).where(eq(events.id, eventId));
    const event = eventRecords[0];
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // 2. Fetch Ticket Tier
    const tierRecords = await db.select().from(ticketTiers).where(eq(ticketTiers.id, tierId));
    const tier = tierRecords[0];
    if (!tier) {
      return NextResponse.json({ error: "Ticket tier not found" }, { status: 404 });
    }

    // Calculate active pending reserved tickets for this tier
    const reservedRecords = await db
      .select({
        totalReserved: sql<number>`COALESCE(SUM(${orders.quantity}), 0)`,
      })
      .from(orders)
      .where(
        and(
          eq(orders.ticketTierId, tier.id),
          eq(orders.status, "pending"),
          gt(orders.expiresAt, new Date())
        )
      );

    const activeReservedQuantity = Number(reservedRecords[0]?.totalReserved || 0);

    // Check total capacity including active pending reservations
    if (tier.quantitySold + activeReservedQuantity + numQuantity > tier.quantityAvailable) {
      return NextResponse.json(
        {
          error:
            "Ticketkauf derzeit nicht möglich: Das verfügbare Kontingent ist aktuell durch ausstehende Kaufvorgänge reserviert. Bitte versuche es in wenigen Minuten erneut.",
        },
        { status: 400 }
      );
    }

    // 3. Fetch Organizer
    const organizerRecords = await db.select().from(users).where(eq(users.id, event.organizerId));
    const organizer = organizerRecords[0];

    // Determine Stripe Client and method
    const { client: activeStripe, isDirectKey } = getOrganizerStripeClient(organizer);

    if (!hasOrganizerStripeAccount(organizer)) {
      return NextResponse.json(
        {
          error:
            "Ticketkauf derzeit nicht möglich: Der Veranstalter hat noch kein Zahlungskonto eingerichtet.",
        },
        { status: 400 }
      );
    }

    const platformFeePercent = await getPlatformFeePercent();
    const unitFeeCents = Math.round(tier.priceCents * (platformFeePercent / 100));
    const unitPriceCents = tier.priceCents + unitFeeCents;
    const totalCents = unitPriceCents * numQuantity;
    const platformFeeCents = Math.round((tier.priceCents * numQuantity) * (platformFeePercent / 100));


    const legalProfileSnapshot = JSON.stringify({
      legalName: organizer?.legalName || organizer?.name || "Veranstalter",
      legalForm: organizer?.legalForm || null,
      responsiblePerson: organizer?.responsiblePerson || null,
      registrationCouncil: organizer?.registrationCouncil || null,
      registrationNumber: organizer?.registrationNumber || null,
      phone: organizer?.phone || null,
      street: organizer?.street || null,
      zip: organizer?.zip || null,
      city: organizer?.city || null,
      country: organizer?.country || "Deutschland",
      vatId: organizer?.vatId || null,
      isSmallBusiness: Boolean(organizer?.isSmallBusiness),
      impressumUrl: organizer?.impressumUrl || null,
      privacyUrl: organizer?.privacyUrl || null,
      termsUrl: organizer?.termsUrl || null,
      purchasedAt: new Date().toISOString(),
    });

    const termsSnapshot =
      organizer?.termsContent ||
      organizer?.termsUrl ||
      `AGB von ${organizer?.legalName || organizer?.name || "dem Veranstalter"} wurden beim Ticketkauf am ${new Date().toLocaleDateString("de-DE")} akzeptiert.`;

    const documentVersionsSnapshot = await createOrderLegalSnapshot({ organizer: organizer as any, event, tier });

    // Extract client IP and User-Agent for audit log
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip") || null;
    const userAgent = req.headers.get("user-agent") || null;

    // 30 Minutes Reservation Window
    const RESERVATION_MINUTES = 30;
    const expiresAt = new Date(Date.now() + RESERVATION_MINUTES * 60 * 1000);

    // 4. Create Order in Database (status: pending)
    const orderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    await db.insert(orders).values({
      id: orderId,
      eventId: event.id,
      ticketTierId: tier.id,
      quantity: numQuantity,
      customerEmail: buyerEmail,
      totalCents: totalCents,
      status: "pending",
      expiresAt: expiresAt,
      termsSnapshot,
      legalProfileSnapshot,
      documentVersionsSnapshot,
      ipAddress: clientIp,
      userAgent,
      acceptedAt: new Date(),
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const connectedAccountId = organizer?.stripeAccountId || organizer?.stripeConnectedAccountId;
    const organizerLegalName = organizer?.legalName || organizer?.name || "Veranstalter";

    // 5. Build Stripe Checkout Session options
    const sessionOptions: any = {
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: `${event.title} - ${tier.name} (Verkäufer: ${organizerLegalName})`,
              description: `Eintrittskarte für ${event.title}. Vertragspartner & Verkäufer: ${organizerLegalName}`,
              images: event.bannerUrl ? [event.bannerUrl] : [],
            },
            unit_amount: unitPriceCents,
          },
          quantity: numQuantity,
        },
      ],
      mode: "payment",
      customer_email: buyerEmail,
      expires_at: Math.floor(expiresAt.getTime() / 1000),
      custom_text: {
        submit: {
          message: `Vertragspartner und Verkäufer dieser Tickets ist ${organizerLegalName}. GateMate agiert ausschließlich als technischer Dienstleister.`,
        },
      },
      metadata: {
        orderId,
        eventId: event.id,
        tierId: tier.id,
        quantity: numQuantity.toString(),
        buyerEmail,
        buyerName,
        organizerId: event.organizerId,
        organizerLegalName,
      },
      success_url: `${appUrl}/tickets/${orderId}?success=true`,
      cancel_url: `${appUrl}/e/${event.slug}?canceled=true`,
    };

    // Apply Stripe Connect Direct Charge & Platform Fee if connected account exists
    let stripeRequestOptions: Stripe.RequestOptions | undefined = undefined;

    if (!isDirectKey && connectedAccountId) {
      sessionOptions.payment_intent_data = {
        ...(platformFeeCents > 0 ? { application_fee_amount: platformFeeCents } : {}),
        description: `Ticketkauf bei ${organizerLegalName} für ${event.title}`,
      };
      stripeRequestOptions = { stripeAccount: connectedAccountId };
    } else if (!isDirectKey) {
      return NextResponse.json(
        { error: "Fehler beim Checkout: Veranstalter besitzt kein verknüpftes Stripe-Konto." },
        { status: 400 }
      );
    } else {
      sessionOptions.payment_intent_data = {
        description: `Ticketkauf bei ${organizerLegalName} für ${event.title}`,
      };
    }

    const session = await activeStripe.checkout.sessions.create(sessionOptions, stripeRequestOptions);

    // Update order with Stripe Checkout Session ID
    await db.update(orders).set({ stripeCheckoutSessionId: session.id } as any).where(eq(orders.id, orderId));

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
      orderId,
    });
  } catch (error: any) {
    console.error("Checkout session creation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
