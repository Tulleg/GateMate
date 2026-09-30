import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/db";
import { events, orders, tickets, users } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { getOrganizerStripeClient } from "@/lib/stripe";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: Request, { params }: RouteParams) {
  try {
    const { id: eventId } = await params;
    const body = await req.json().catch(() => ({}));
    const { cancelReason = "Veranstaltung abgesagt" } = body;

    const cookieStore = await cookies();
    let organizerId = cookieStore.get("gatemate_user_id")?.value;

    if (!organizerId && process.env.ENABLE_DEMO_ACCOUNTS === "true") {
      organizerId = "user_organizer_01";
    }

    // 1. Fetch Event
    const eventRecords = await db.select().from(events).where(eq(events.id, eventId));
    const event = eventRecords[0];

    if (!event) {
      return NextResponse.json({ error: "Event nicht gefunden" }, { status: 404 });
    }

    if (organizerId && event.organizerId !== organizerId && process.env.ENABLE_DEMO_ACCOUNTS !== "true") {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
    }

    if (event.isCancelled) {
      return NextResponse.json({ error: "Dieses Event wurde bereits storniert." }, { status: 400 });
    }

    // 2. Mark Event as Cancelled
    const now = new Date();
    await db
      .update(events)
      .set({
        isCancelled: true,
        cancelReason: cancelReason.trim(),
        cancelledAt: now,
        isPublished: false,
        updatedAt: now,
      })
      .where(eq(events.id, eventId));

    // 3. Fetch all orders for this event
    const eventOrders = await db.select().from(orders).where(eq(orders.eventId, eventId));
    const orderIds = eventOrders.map((o) => o.id);

    // 4. Update all tickets for these orders to "cancelled"
    let cancelledTicketsCount = 0;
    if (orderIds.length > 0) {
      const ticketsToCancel = await db.select().from(tickets).where(inArray(tickets.orderId, orderIds));
      cancelledTicketsCount = ticketsToCancel.length;

      if (cancelledTicketsCount > 0) {
        await db
          .update(tickets)
          .set({
            status: "cancelled",
            updatedAt: now,
          })
          .where(inArray(tickets.orderId, orderIds));
      }

      // Update all orders to "refunded"
      await db
        .update(orders)
        .set({
          status: "refunded",
          updatedAt: now,
        })
        .where(eq(orders.eventId, eventId));
    }

    // 5. Trigger optional Stripe Refunds for paid orders
    const organizerRecords = await db.select().from(users).where(eq(users.id, event.organizerId));
    const organizer = organizerRecords[0];
    let refundedStripeCount = 0;

    if (organizer) {
      const { client: stripeClient } = getOrganizerStripeClient(organizer);

      for (const order of eventOrders) {
        if (order.stripePaymentIntentId && order.status === "completed") {
          try {
            await stripeClient.refunds.create({
              payment_intent: order.stripePaymentIntentId,
              reason: "requested_by_customer",
            });
            refundedStripeCount++;
          } catch (stripeErr: any) {
            console.warn(`[Stripe Refund Note] Could not issue Stripe refund for order ${order.id}:`, stripeErr?.message || stripeErr);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Event wurde erfolgreich storniert.",
      eventId,
      cancelledTicketsCount,
      refundedOrdersCount: eventOrders.length,
      refundedStripeCount,
    });
  } catch (error: any) {
    console.error("Error cancelling event:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
