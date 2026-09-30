import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/db";
import { events, ticketTiers, orders } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, { params }: RouteParams) {
  try {
    const { id: eventId } = await params;
    const cookieStore = await cookies();
    let organizerId = cookieStore.get("gatemate_user_id")?.value;

    if (!organizerId && process.env.ENABLE_DEMO_ACCOUNTS === "true") {
      organizerId = "user_organizer_01";
    }

    const eventRecords = await db.select().from(events).where(eq(events.id, eventId));
    const event = eventRecords[0];

    if (!event) {
      return NextResponse.json({ error: "Event nicht gefunden" }, { status: 404 });
    }

    if (organizerId && event.organizerId !== organizerId && process.env.ENABLE_DEMO_ACCOUNTS !== "true") {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
    }

    const tiers = await db.select().from(ticketTiers).where(eq(ticketTiers.eventId, eventId));
    const eventOrders = await db.select().from(orders).where(eq(orders.eventId, eventId));

    return NextResponse.json({
      event: {
        ...event,
        tiers,
        totalOrders: eventOrders.length,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: RouteParams) {
  try {
    const { id: eventId } = await params;
    const body = await req.json();
    const cookieStore = await cookies();
    let cleanOrganizerId = cookieStore.get("gatemate_user_id")?.value;

    if (!cleanOrganizerId && process.env.ENABLE_DEMO_ACCOUNTS === "true") {
      cleanOrganizerId = "user_organizer_01";
    }

    // 1. Fetch Event
    const eventRecords = await db.select().from(events).where(eq(events.id, eventId));
    const existingEvent = eventRecords[0];

    if (!existingEvent) {
      return NextResponse.json({ error: "Event nicht gefunden" }, { status: 404 });
    }

    if (cleanOrganizerId && existingEvent.organizerId !== cleanOrganizerId && process.env.ENABLE_DEMO_ACCOUNTS !== "true") {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
    }

    if (existingEvent.isCancelled) {
      return NextResponse.json({ error: "Ein storniertes Event kann nicht mehr bearbeitet werden." }, { status: 400 });
    }

    const {
      title,
      slug,
      description,
      venue,
      bannerUrl,
      startDate,
      endDate,
      isListedInDirectory = true,
      isPublished = true,
      tiers,
    } = body;

    if (!title || !slug || !startDate || !endDate) {
      return NextResponse.json({ error: "Pflichtfelder fehlen (Titel, Slug, Start- & Enddatum)" }, { status: 400 });
    }

    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, "-");

    // Check slug uniqueness if changed
    if (cleanSlug !== existingEvent.slug) {
      const existingSlug = await db.select().from(events).where(eq(events.slug, cleanSlug));
      if (existingSlug.length > 0) {
        return NextResponse.json({ error: "Dieser URL-Slug wird bereits verwendet." }, { status: 400 });
      }
    }

    // 2. Update Event details
    await db
      .update(events)
      .set({
        title,
        slug: cleanSlug,
        description,
        venue,
        bannerUrl: bannerUrl || "https://images.unsplash.com/photo-1540575467063-178a50c2df87",
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isListedInDirectory: Boolean(isListedInDirectory),
        isPublished: Boolean(isPublished),
        updatedAt: new Date(),
      })
      .where(eq(events.id, eventId));

    // 3. Process Ticket Tiers if provided
    if (Array.isArray(tiers)) {
      const currentTiers = await db.select().from(ticketTiers).where(eq(ticketTiers.eventId, eventId));
      const currentTierMap = new Map(currentTiers.map((t) => [t.id, t]));

      const incomingTierIds = new Set<string>();

      for (let idx = 0; idx < tiers.length; idx++) {
        const tier = tiers[idx];
        if (tier.id && currentTierMap.has(tier.id)) {
          incomingTierIds.add(tier.id);
          const existingTier = currentTierMap.get(tier.id)!;
          const newQtyAvailable = Math.max(existingTier.quantitySold, Number(tier.quantityAvailable) || 0);

          await db
            .update(ticketTiers)
            .set({
              name: tier.name,
              priceCents: Number(tier.priceCents) || 0,
              quantityAvailable: newQtyAvailable,
              updatedAt: new Date(),
            })
            .where(eq(ticketTiers.id, tier.id));
        } else {
          // Insert new tier
          const newTierId = `tier_${eventId}_${Date.now()}_${idx + 1}`;
          await db.insert(ticketTiers).values({
            id: newTierId,
            eventId,
            name: tier.name || `Kategorie ${idx + 1}`,
            priceCents: Number(tier.priceCents) || 0,
            quantityAvailable: Number(tier.quantityAvailable) || 0,
            quantitySold: 0,
          });
        }
      }

      // Delete tiers that were removed AND have 0 quantity sold
      const tiersToDelete = currentTiers.filter((t) => !incomingTierIds.has(t.id) && t.quantitySold === 0);
      if (tiersToDelete.length > 0) {
        const deleteIds = tiersToDelete.map((t) => t.id);
        await db.delete(ticketTiers).where(inArray(ticketTiers.id, deleteIds));
      }
    }

    return NextResponse.json({ success: true, eventId, slug: cleanSlug });
  } catch (error: any) {
    console.error("Error updating event:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
