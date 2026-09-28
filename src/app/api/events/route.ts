import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/db";
import { events, ticketTiers, orders, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { checkOrganizerLegalCompliance } from "@/lib/legal";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const cookieStore = await cookies();
    let organizerId = searchParams.get("organizerId") || cookieStore.get("gatemate_user_id")?.value;

    if (!organizerId) {
      if (process.env.ENABLE_DEMO_ACCOUNTS === "true") {
        organizerId = "user_organizer_01";
      } else {
        return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
      }
    }

    const organizerEvents = await db
      .select()
      .from(events)
      .where(eq(events.organizerId, organizerId))
      .orderBy(desc(events.createdAt));

    const eventsWithTiers = await Promise.all(
      organizerEvents.map(async (event) => {
        const tiers = await db
          .select()
          .from(ticketTiers)
          .where(eq(ticketTiers.eventId, event.id));

        const eventOrders = await db
          .select()
          .from(orders)
          .where(eq(orders.eventId, event.id));

        const totalRevenueCents = eventOrders.reduce((acc, order) => acc + (order.status === "completed" ? order.totalCents : 0), 0);
        const totalTicketsSold = tiers.reduce((acc, tier) => acc + tier.quantitySold, 0);

        return {
          ...event,
          tiers,
          totalRevenueCents,
          totalTicketsSold,
        };
      })
    );

    return NextResponse.json({ events: eventsWithTiers });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const cookieStore = await cookies();
    let cleanOrganizerId = body.organizerId || cookieStore.get("gatemate_user_id")?.value;

    if (!cleanOrganizerId) {
      if (process.env.ENABLE_DEMO_ACCOUNTS === "true") {
        cleanOrganizerId = "user_organizer_01";
      } else {
        return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
      }
    }

    const { title, slug, description, venue, bannerUrl, startDate, endDate, isListedInDirectory = true, tiers } = body;

    if (!title || !slug || !startDate || !endDate || !tiers || !Array.isArray(tiers)) {
      return NextResponse.json({ error: "Pflichtfelder fehlen oder ungültige Ticket-Kategorien" }, { status: 400 });
    }

    // Publication Guard Check: Fetch organizer and check legal compliance
    const organizerRecords = await db.select().from(users).where(eq(users.id, cleanOrganizerId));
    const organizer = organizerRecords[0];

    const compliance = checkOrganizerLegalCompliance(organizer);
    if (!compliance.isCompliant) {
      return NextResponse.json(
        {
          error: `Veröffentlichung blockiert! Ihr Veranstalter-Rechtsprofil ist unvollständig (${compliance.missingFields.join(
            ", "
          )}). Bitte füllen Sie das Rechtsprofil unter /organizer/settings/legal aus.`,
          missingFields: compliance.missingFields,
        },
        { status: 400 }
      );
    }

    const eventId = `evt_${Date.now()}`;

    // 1. Insert Event
    await db.insert(events).values({
      id: eventId,
      organizerId: cleanOrganizerId,
      title,
      slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
      description,
      venue,
      bannerUrl: bannerUrl || "https://images.unsplash.com/photo-1540575467063-178a50c2df87",
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      isPublished: true,
      isListedInDirectory: Boolean(isListedInDirectory),
    });

    // 2. Insert Ticket Tiers
    const tierRecords = tiers.map((tier: { name: string; priceCents: number; quantityAvailable: number }, idx: number) => ({
      id: `tier_${eventId}_${idx + 1}`,
      eventId: eventId,
      name: tier.name,
      priceCents: tier.priceCents,
      quantityAvailable: tier.quantityAvailable,
      quantitySold: 0,
    }));

    if (tierRecords.length > 0) {
      await db.insert(ticketTiers).values(tierRecords);
    }

    return NextResponse.json({ success: true, eventId, slug });
  } catch (error: any) {
    console.error("Error creating event:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
