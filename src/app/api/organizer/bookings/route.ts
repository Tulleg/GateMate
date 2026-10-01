import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/db";
import { events, orders, tickets, ticketTiers, users } from "@/db/schema";
import { eq, inArray, and, gte, lte, ilike, or, desc } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    let organizerId = cookieStore.get("gatemate_user_id")?.value;

    if (!organizerId) {
      if (process.env.ENABLE_DEMO_ACCOUNTS === "true") {
        organizerId = "user_organizer_01";
      } else {
        return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
      }
    }

    // 1. Fetch organizer profile info for tax compliance
    const organizerRecords = await db.select().from(users).where(eq(users.id, organizerId));
    const organizer = organizerRecords[0] || null;

    // 2. Fetch all events belonging to organizer
    const organizerEvents = await db
      .select({
        id: events.id,
        title: events.title,
        startDate: events.startDate,
        venue: events.venue,
        venueCity: events.venueCity,
      })
      .from(events)
      .where(eq(events.organizerId, organizerId))
      .orderBy(desc(events.startDate));

    const organizerEventIds = organizerEvents.map((e) => e.id);

    if (organizerEventIds.length === 0) {
      return NextResponse.json({
        organizer: organizer ? {
          name: organizer.name,
          email: organizer.email,
          legalCompanyName: organizer.legalCompanyName || organizer.legalName || organizer.name,
          vatId: organizer.vatId || organizer.legalVatId || "Nicht angegeben",
          street: organizer.street,
          zip: organizer.zip,
          city: organizer.city,
          country: organizer.country || "Deutschland",
        } : null,
        events: [],
        bookings: [],
        summary: {
          totalGrossCents: 0,
          completedCount: 0,
          refundedCount: 0,
          refundedGrossCents: 0,
          totalTicketsSold: 0,
        },
      });
    }

    // Parse search parameters
    const { searchParams } = new URL(req.url);
    const eventIdParam = searchParams.get("eventId");
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");
    const statusParam = searchParams.get("status");
    const searchParam = searchParams.get("search");
    const formatParam = searchParams.get("format");

    // Build event query filter
    let targetEventIds = organizerEventIds;
    if (eventIdParam && eventIdParam !== "all") {
      if (organizerEventIds.includes(eventIdParam)) {
        targetEventIds = [eventIdParam];
      } else {
        targetEventIds = [];
      }
    }

    if (targetEventIds.length === 0) {
      return NextResponse.json({
        organizer: organizer ? {
          name: organizer.name,
          email: organizer.email,
          legalCompanyName: organizer.legalCompanyName || organizer.legalName || organizer.name,
          vatId: organizer.vatId || organizer.legalVatId || "Nicht angegeben",
          street: organizer.street,
          zip: organizer.zip,
          city: organizer.city,
          country: organizer.country || "Deutschland",
        } : null,
        events: organizerEvents,
        bookings: [],
        summary: {
          totalGrossCents: 0,
          completedCount: 0,
          refundedCount: 0,
          refundedGrossCents: 0,
          totalTicketsSold: 0,
        },
      });
    }

    // Build conditions array
    const conditions = [inArray(orders.eventId, targetEventIds)];

    if (startDateParam) {
      const start = new Date(startDateParam);
      start.setHours(0, 0, 0, 0);
      conditions.push(gte(orders.createdAt, start));
    }

    if (endDateParam) {
      const end = new Date(endDateParam);
      end.setHours(23, 59, 59, 999);
      conditions.push(lte(orders.createdAt, end));
    }

    if (statusParam && statusParam !== "all") {
      conditions.push(eq(orders.status, statusParam as any));
    }

    if (searchParam && searchParam.trim().length > 0) {
      const term = `%${searchParam.trim()}%`;
      conditions.push(
        or(
          ilike(orders.id, term),
          ilike(orders.customerEmail, term),
          ilike(orders.stripePaymentIntentId, term)
        )!
      );
    }

    // Execute database query
    const fetchedOrders = await db
      .select({
        order: orders,
        eventTitle: events.title,
        eventStartDate: events.startDate,
      })
      .from(orders)
      .innerJoin(events, eq(orders.eventId, events.id))
      .where(and(...conditions))
      .orderBy(desc(orders.createdAt));

    // Fetch ticket details per order
    const bookings = await Promise.all(
      fetchedOrders.map(async (row) => {
        const orderTickets = await db
          .select({
            ticket: tickets,
            tierName: ticketTiers.name,
            priceCents: ticketTiers.priceCents,
          })
          .from(tickets)
          .innerJoin(ticketTiers, eq(tickets.ticketTierId, ticketTiers.id))
          .where(eq(tickets.orderId, row.order.id));

        return {
          id: row.order.id,
          eventId: row.order.eventId,
          eventTitle: row.eventTitle,
          eventStartDate: row.eventStartDate,
          customerEmail: row.order.customerEmail,
          totalCents: row.order.totalCents,
          status: row.order.status,
          stripePaymentIntentId: row.order.stripePaymentIntentId || "-",
          stripeCheckoutSessionId: row.order.stripeCheckoutSessionId || "-",
          createdAt: row.order.createdAt,
          ticketsCount: orderTickets.length,
          tickets: orderTickets.map((t) => ({
            id: t.ticket.id,
            attendeeName: t.ticket.attendeeName,
            tierName: t.tierName,
            priceCents: t.priceCents,
            status: t.ticket.status,
          })),
        };
      })
    );

    // Compute Finanzamt metrics
    const summary = bookings.reduce(
      (acc, b) => {
        if (b.status === "completed") {
          acc.totalGrossCents += b.totalCents;
          acc.completedCount += 1;
          acc.totalTicketsSold += b.ticketsCount;
        } else if (b.status === "refunded") {
          acc.refundedGrossCents += b.totalCents;
          acc.refundedCount += 1;
        }
        return acc;
      },
      {
        totalGrossCents: 0,
        completedCount: 0,
        refundedCount: 0,
        refundedGrossCents: 0,
        totalTicketsSold: 0,
      }
    );

    // CSV format handling
    if (formatParam === "csv") {
      // Create UTF-8 BOM for German Excel compatibility
      const BOM = "\uFEFF";
      const csvHeaders = [
        "Buchungs-ID",
        "Datum",
        "Uhrzeit",
        "Veranstaltung",
        "Kunden-E-Mail",
        "Betrag (EUR)",
        "Status",
        "Anzahl Tickets",
        "Ticket-Kategorien",
        "Stripe Payment Intent ID",
      ].join(";");

      const csvRows = bookings.map((b) => {
        const dateObj = new Date(b.createdAt);
        const dateStr = dateObj.toLocaleDateString("de-DE");
        const timeStr = dateObj.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
        const amountEur = (b.totalCents / 100).toFixed(2).replace(".", ",");
        const ticketCategories = Array.from(new Set(b.tickets.map((t) => t.tierName))).join(", ");

        const sanitize = (text: string) => `"${(text || "").replace(/"/g, '""')}"`;

        return [
          sanitize(b.id),
          sanitize(dateStr),
          sanitize(timeStr),
          sanitize(b.eventTitle),
          sanitize(b.customerEmail),
          sanitize(amountEur),
          sanitize(b.status),
          b.ticketsCount,
          sanitize(ticketCategories),
          sanitize(b.stripePaymentIntentId),
        ].join(";");
      });

      const csvContent = BOM + csvHeaders + "\n" + csvRows.join("\n");

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="Buchungen_Finanzamt_${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }

    return NextResponse.json({
      organizer: organizer ? {
        name: organizer.name,
        email: organizer.email,
        legalCompanyName: organizer.legalCompanyName || organizer.legalName || organizer.name,
        vatId: organizer.vatId || organizer.legalVatId || "Nicht angegeben",
        street: organizer.street,
        zip: organizer.zip,
        city: organizer.city,
        country: organizer.country || "Deutschland",
      } : null,
      events: organizerEvents,
      bookings,
      summary,
    });
  } catch (error: any) {
    console.error("Error fetching organizer bookings:", error);
    return NextResponse.json({ error: error.message || "Interner Serverfehler" }, { status: 500 });
  }
}
