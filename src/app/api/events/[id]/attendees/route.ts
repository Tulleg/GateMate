import { NextResponse } from "next/server";
import { db } from "@/db";
import { tickets, ticketTiers, orders } from "@/db/schema";
import { eq, ilike, or, and } from "drizzle-orm";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, { params }: RouteParams) {
  try {
    const { id: eventId } = await params;
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query") || "";

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ attendees: [] });
    }

    const searchTerm = `%${query.trim()}%`;

    // Fetch matching tickets by joining orders table
    const matchedRecords = await db
      .select({
        ticketId: tickets.id,
        attendeeName: tickets.attendeeName,
        status: tickets.status,
        ticketTierId: tickets.ticketTierId,
        customerEmail: orders.customerEmail,
      })
      .from(tickets)
      .innerJoin(orders, eq(tickets.orderId, orders.id))
      .where(
        and(
          eq(orders.eventId, eventId),
          or(
            ilike(tickets.attendeeName, searchTerm),
            ilike(orders.customerEmail, searchTerm)
          )
        )
      )
      .limit(10);

    const attendees = await Promise.all(
      matchedRecords.map(async (record) => {
        const tierRecords = await db.select().from(ticketTiers).where(eq(ticketTiers.id, record.ticketTierId));
        const tier = tierRecords[0];

        return {
          id: record.ticketId,
          attendeeName: record.attendeeName,
          attendeeEmail: record.customerEmail,
          status: record.status,
          tierName: tier?.name || "Standard-Eintritt",
        };
      })
    );

    return NextResponse.json({ attendees });
  } catch (error: any) {
    console.error("Attendee search error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
