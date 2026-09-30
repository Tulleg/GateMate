import { NextResponse } from "next/server";
import { db } from "@/db";
import { tickets, orders, ticketTiers, checkInLogs, events } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyTicketJwt } from "@/lib/qr";

export async function POST(req: Request) {
  try {
    const { token, eventId, scannedByUserId = "system_scanner" } = await req.json();

    if (!token || !eventId) {
      return NextResponse.json({ success: false, message: "Missing token or eventId" }, { status: 400 });
    }

    const payload = await verifyTicketJwt(token);
    if (!payload) {
      return NextResponse.json({ success: false, message: "Ungültige oder gefälschte Ticket-Signatur" }, { status: 401 });
    }

    if (payload.eventId !== eventId) {
      return NextResponse.json({ success: false, message: "Ticket gehört zu einer anderen Veranstaltung" }, { status: 400 });
    }

    const eventRecords = await db.select().from(events).where(eq(events.id, eventId));
    if (eventRecords[0]?.isCancelled) {
      return NextResponse.json({ success: false, message: "Veranstaltung wurde storniert" }, { status: 400 });
    }

    const ticketRecords = await db.select().from(tickets).where(eq(tickets.id, payload.ticketId));
    const ticket = ticketRecords[0];

    if (!ticket) {
      return NextResponse.json({ success: false, message: "Ticket in der Datenbank nicht gefunden" }, { status: 404 });
    }

    if (ticket.status === "used") {
      return NextResponse.json({ success: false, message: "Ticket wurde bereits entwertet", isDuplicate: true }, { status: 409 });
    }

    if (ticket.status === "cancelled") {
      return NextResponse.json({ success: false, message: "Ticket wurde storniert" }, { status: 400 });
    }

    const orderRecords = await db.select().from(orders).where(eq(orders.id, ticket.orderId));
    const tierRecords = await db.select().from(ticketTiers).where(eq(ticketTiers.id, ticket.ticketTierId));

    const now = new Date();
    await db.insert(checkInLogs).values({
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      ticketId: ticket.id,
      scannedByUserId: scannedByUserId,
      scannedAt: now,
      deviceInfo: "Scanner Web API",
    });

    await db.update(tickets).set({ status: "used", updatedAt: now }).where(eq(tickets.id, ticket.id));

    return NextResponse.json({
      success: true,
      message: "Ticket erfolgreich entwertet",
      ticket: {
        id: ticket.id,
        attendeeName: ticket.attendeeName,
        attendeeEmail: orderRecords[0]?.customerEmail || "N/A",
        tierName: tierRecords[0]?.name || "Standard",
        checkedInAt: now.toISOString(),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
