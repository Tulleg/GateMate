import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/db";
import { events, ticketTiers, orders, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { checkOrganizerLegalCompliance } from "@/lib/legal";
import { hasOrganizerStripeAccount } from "@/lib/stripe";

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

import { validateEventForPublication } from "@/lib/validation";
import { snapshotDocumentVersion } from "@/lib/legal-server";

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

    const {
      title,
      slug,
      description,
      venue,
      venueStreet,
      venueZip,
      venueCity,
      venueCountry = "Deutschland",
      bannerUrl,
      startDate,
      endDate,
      hasEndTime = true,
      doorsOpenAt,
      ageRestriction,
      accessibilityInfo,
      houseRules,
      specialAdmissionConditions,
      eventTerms,
      cancellationPolicy,
      salesStartDate,
      salesEndDate,
      legalChecklistConfirmed = false,
      isListedInDirectory = true,
      isPublished = false,
      tiers,
    } = body;

    if (!title || !slug || !startDate || !tiers || !Array.isArray(tiers)) {
      return NextResponse.json({ error: "Pflichtfelder fehlen oder ungültige Ticket-Kategorien" }, { status: 400 });
    }

    const organizerRecords = await db.select().from(users).where(eq(users.id, cleanOrganizerId));
    const organizer = organizerRecords[0];

    // Build event data object for validation
    const eventInput = {
      title,
      description,
      venue,
      venueStreet,
      venueZip,
      venueCity,
      venueCountry,
      startDate,
      endDate,
      hasEndTime: Boolean(hasEndTime),
      ageRestriction,
      accessibilityInfo,
      houseRules,
      specialAdmissionConditions,
      eventTerms,
      cancellationPolicy,
      salesStartDate,
      salesEndDate,
    };

    const formattedTiersInput = tiers.map((tier: any) => ({
      name: tier.name,
      priceCents: Number(tier.priceCents) || 0,
      feeCents: Number(tier.feeCents) || 0,
      includedServices: tier.includedServices || null,
      ticketTerms: tier.ticketTerms || null,
      quantityAvailable: Number(tier.quantityAvailable) || 0,
    }));

    // Publication Guard Check: If publishing, verify full compliance via validation engine
    if (isPublished) {
      const validation = validateEventForPublication(organizer, eventInput, formattedTiersInput);
      if (!validation.canPublish) {
        return NextResponse.json(
          {
            error: `Veröffentlichung blockiert! Folgende Angaben fehlen oder sind unvollständig: ${validation.missingBlockingFields.join(", ")}`,
            validation,
          },
          { status: 400 }
        );
      }

      if (!legalChecklistConfirmed) {
        return NextResponse.json(
          {
            error: "Veröffentlichung blockiert! Sie müssen die rechtliche Haftungsbestätigung vor der Veröffentlichung anhaken.",
          },
          { status: 400 }
        );
      }
    }

    const eventId = `evt_${Date.now()}`;

    // 1. Insert Event
    await db.insert(events).values({
      id: eventId,
      organizerId: cleanOrganizerId,
      title,
      slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
      description: description || null,
      venue: venue || null,
      venueStreet: venueStreet || null,
      venueZip: venueZip || null,
      venueCity: venueCity || null,
      venueCountry: venueCountry || "Deutschland",
      bannerUrl: bannerUrl || "https://images.unsplash.com/photo-1540575467063-178a50c2df87",
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : new Date(startDate),
      hasEndTime: Boolean(hasEndTime),
      doorsOpenAt: doorsOpenAt ? new Date(doorsOpenAt) : null,
      ageRestriction: ageRestriction || null,
      accessibilityInfo: accessibilityInfo || null,
      houseRules: houseRules || null,
      specialAdmissionConditions: specialAdmissionConditions || null,
      eventTerms: eventTerms || null,
      cancellationPolicy: cancellationPolicy || null,
      salesStartDate: salesStartDate ? new Date(salesStartDate) : null,
      salesEndDate: salesEndDate ? new Date(salesEndDate) : null,
      legalChecklistConfirmedAt: isPublished && legalChecklistConfirmed ? new Date() : null,
      legalChecklistConfirmedBy: isPublished && legalChecklistConfirmed ? cleanOrganizerId : null,
      isPublished: Boolean(isPublished),
      isListedInDirectory: Boolean(isListedInDirectory),
    });

    // 2. Insert Ticket Tiers
    const tierRecords = formattedTiersInput.map((tier, idx) => ({
      id: `tier_${eventId}_${idx + 1}`,
      eventId: eventId,
      name: tier.name || `Kategorie ${idx + 1}`,
      priceCents: tier.priceCents,
      feeCents: tier.feeCents,
      includedServices: tier.includedServices,
      ticketTerms: tier.ticketTerms,
      quantityAvailable: tier.quantityAvailable,
      quantitySold: 0,
    }));

    if (tierRecords.length > 0) {
      await db.insert(ticketTiers).values(tierRecords);
    }

    // 3. Freeze document versions on publication
    if (isPublished && organizer) {
      await snapshotDocumentVersion({ organizerId: cleanOrganizerId, documentType: "impressum", content: organizer.impressumContent, url: organizer.impressumUrl });
      await snapshotDocumentVersion({ organizerId: cleanOrganizerId, documentType: "privacy", content: organizer.privacyContent, url: organizer.privacyUrl });
      await snapshotDocumentVersion({ organizerId: cleanOrganizerId, documentType: "terms", content: organizer.termsContent, url: organizer.termsUrl });
      if (eventTerms) {
        await snapshotDocumentVersion({ organizerId: cleanOrganizerId, eventId, documentType: "event_terms", content: eventTerms });
      }
      if (cancellationPolicy) {
        await snapshotDocumentVersion({ organizerId: cleanOrganizerId, eventId, documentType: "cancellation_policy", content: cancellationPolicy });
      }
    }

    return NextResponse.json({ success: true, eventId, slug });
  } catch (error: any) {
    console.error("Error creating event:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
