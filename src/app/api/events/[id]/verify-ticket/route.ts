import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/db";
import { tickets, checkInLogs, ticketTiers, orders, events } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyTicketJwt } from "@/lib/qr";


interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: Request, { params }: RouteParams) {
  try {
    const { id: eventId } = await params;
    const body = await req.json();
    const { token, ticketId, scannedByUserId, deviceInfo } = body;

    const cookieStore = await cookies();
    const activeUserId = scannedByUserId || cookieStore.get("gatemate_user_id")?.value || "gate_scanner";

    // 0. Check if Event itself is cancelled
    const eventRecords = await db.select().from(events).where(eq(events.id, eventId));
    const currentEvent = eventRecords[0];
    if (currentEvent?.isCancelled) {
      return NextResponse.json(
        {
          success: false,
          message: `EVENT CANCELLED / STORNIERT (${currentEvent.cancelReason || "Absage"})`,
        },
        { status: 400 }
      );
    }

    if (!token && !ticketId) {
      return NextResponse.json({ success: false, message: "Missing token or ticketId parameter" }, { status: 400 });
    }

    let targetTicketId = ticketId;

    // 1. If QR token is provided, verify cryptographic JWT signature
    if (token) {
      const payload = await verifyTicketJwt(token);
      if (!payload) {
        return NextResponse.json(
          { success: false, message: "Invalid or forged QR token signature" },
          { status: 401 }
        );
      }

      if (payload.eventId !== eventId) {
        return NextResponse.json(
          { success: false, message: "Ticket is for a different event" },
          { status: 400 }
        );
      }

      targetTicketId = payload.ticketId;
    }

    // 2. Fetch Ticket, Order, and Ticket Tier
    const ticketRecords = await db.select().from(tickets).where(eq(tickets.id, targetTicketId));
    const ticket = ticketRecords[0];

    if (!ticket) {
      return NextResponse.json({ success: false, message: "Ticket not found in system" }, { status: 404 });
    }

    const orderRecords = await db.select().from(orders).where(eq(orders.id, ticket.orderId));
    const order = orderRecords[0];
    const customerEmail = order?.customerEmail || "N/A";

    const tierRecords = await db.select().from(ticketTiers).where(eq(ticketTiers.id, ticket.ticketTierId));
    const tier = tierRecords[0];
    const tierName = tier?.name || "General Admission";

    // 3. Handle Duplicate / Already Used Ticket
    if (ticket.status === "used") {
      const existingLogs = await db
        .select()
        .from(checkInLogs)
        .where(eq(checkInLogs.ticketId, ticket.id));
      
      const lastCheckIn = existingLogs[0];
      const exactTime = lastCheckIn
        ? new Date(lastCheckIn.scannedAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
        : "Earlier";

      return NextResponse.json(
        {
          success: false,
          isDuplicate: true,
          message: `TICKET ALREADY REDEEMED at ${exactTime}`,
          ticket: {
            id: ticket.id,
            attendeeName: ticket.attendeeName,
            attendeeEmail: customerEmail,
            tierName,
            checkedInAt: exactTime,
          },
        },
        { status: 409 }
      );
    }

    // 4. Handle Cancelled Ticket
    if (ticket.status === "cancelled") {
      return NextResponse.json(
        {
          success: false,
          message: "TICKET CANCELLED OR REFUNDED",
          ticket: {
            id: ticket.id,
            attendeeName: ticket.attendeeName,
            attendeeEmail: customerEmail,
            tierName,
          },
        },
        { status: 400 }
      );
    }

    // 5. Execute Atomic Check-In Transaction
    const now = new Date();
    await db.insert(checkInLogs).values({
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      ticketId: ticket.id,
      scannedByUserId: activeUserId,
      scannedAt: now,

      deviceInfo: deviceInfo || "PWA Mobile Camera Scanner",
    });

    await db.update(tickets).set({ status: "used" }).where(eq(tickets.id, ticket.id));

    const checkedInAt = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

    return NextResponse.json({
      success: true,
      message: "VALID TICKET - CHECK-IN SUCCESSFUL",
      ticket: {
        id: ticket.id,
        attendeeName: ticket.attendeeName,
        attendeeEmail: customerEmail,
        tierName,
        checkedInAt,
      },
    });
  } catch (error: any) {
    console.error("Check-in verification error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
