import { NextResponse } from "next/server";
import { stripe, PLATFORM_FEE_PERCENT, getOrganizerStripeClient, hasPlatformStripeKey } from "@/lib/stripe";
import { db } from "@/db";
import { events, ticketTiers, users, orders } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
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

    // Check capacity
    if (tier.quantitySold + numQuantity > tier.quantityAvailable) {
      return NextResponse.json({ error: "Requested quantity exceeds remaining ticket capacity" }, { status: 400 });
    }

    // 3. Fetch Organizer
    const organizerRecords = await db.select().from(users).where(eq(users.id, event.organizerId));
    const organizer = organizerRecords[0];

    // Determine Stripe Client and method
    const { client: activeStripe, isDirectKey } = getOrganizerStripeClient(organizer);

    if (!isDirectKey && !organizer?.stripeConnectedAccountId && !hasPlatformStripeKey()) {
      return NextResponse.json(
        {
          error:
            "Der Veranstalter hat bisher keine Stripe Zahlungsdaten hinterlegt und auf dem Server ist kein Plattform-Key gesetzt.",
        },
        { status: 400 }
      );
    }

    const totalCents = tier.priceCents * numQuantity;
    const platformFeeCents = Math.round(totalCents * (PLATFORM_FEE_PERCENT / 100));

    // 4. Create Order in Database (status: pending)
    const orderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    await db.insert(orders).values({
      id: orderId,
      eventId: event.id,
      customerEmail: buyerEmail,
      totalCents: totalCents,
      status: "pending",
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const stripeAccountId = organizer?.stripeConnectedAccountId;

    // 5. Build Stripe Checkout Session options
    const sessionOptions: any = {
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: `${event.title} - ${tier.name}`,
              description: `Entry pass for ${event.title} at ${event.venue || "Venue"}`,
              images: event.bannerUrl ? [event.bannerUrl] : [],
            },
            unit_amount: tier.priceCents,
          },
          quantity: numQuantity,
        },
      ],
      mode: "payment",
      customer_email: buyerEmail,
      metadata: {
        orderId,
        eventId: event.id,
        tierId: tier.id,
        quantity: numQuantity.toString(),
        buyerEmail,
        buyerName,
        organizerId: event.organizerId,
      },
      success_url: `${appUrl}/tickets/${orderId}?success=true`,
      cancel_url: `${appUrl}/e/${event.slug}?canceled=true`,
    };

    // Apply Stripe Connect Destination Charge & Platform Fee only if using Connect platform account
    if (!isDirectKey && stripeAccountId) {
      sessionOptions.payment_intent_data = {
        application_fee_amount: platformFeeCents,
        transfer_data: {
          destination: stripeAccountId,
        },
      };
    }

    const session = await activeStripe.checkout.sessions.create(sessionOptions);

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
