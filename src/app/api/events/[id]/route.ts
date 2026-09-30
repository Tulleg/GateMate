import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/db";
import { events, ticketTiers, orders, users } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { checkOrganizerLegalCompliance } from "@/lib/legal";
import { hasOrganizerStripeAccount } from "@/lib/stripe";
import { validateEventForPublication } from "@/lib/validation";
import { snapshotDocumentVersion } from "@/lib/legal-server";

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

    if (!title || !slug || !startDate) {
      return NextResponse.json({ error: "Pflichtfelder fehlen (Titel, Slug, Startdatum)" }, { status: 400 });
    }

    const organizerRecords = await db.select().from(users).where(eq(users.id, existingEvent.organizerId));
    const organizer = organizerRecords[0];

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

    const incomingTiersInput = Array.isArray(tiers)
      ? tiers.map((tier: any) => ({
          id: tier.id,
          name: tier.name,
          priceCents: Number(tier.priceCents) || 0,
          feeCents: Number(tier.feeCents) || 0,
          includedServices: tier.includedServices || null,
          ticketTerms: tier.ticketTerms || null,
          quantityAvailable: Number(tier.quantityAvailable) || 0,
        }))
      : [];

    // Publication Guard Check: If publishing, run full publication validation
    if (isPublished) {
      const validation = validateEventForPublication(organizer, eventInput, incomingTiersInput);
      if (!validation.canPublish) {
        return NextResponse.json(
          {
            error: `Veröffentlichung blockiert! Folgende Angaben fehlen oder sind unvollständig: ${validation.missingBlockingFields.join(", ")}`,
            validation,
          },
          { status: 400 }
        );
      }

      if (!legalChecklistConfirmed && !existingEvent.isPublished) {
        return NextResponse.json(
          {
            error: "Veröffentlichung blockiert! Sie müssen die rechtliche Haftungsbestätigung vor der Veröffentlichung anhaken.",
          },
          { status: 400 }
        );
      }
    }

    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, "-");

    // Check slug uniqueness if changed
    if (cleanSlug !== existingEvent.slug) {
      const existingSlug = await db.select().from(events).where(eq(events.slug, cleanSlug));
      if (existingSlug.length > 0) {
        return NextResponse.json({ error: "Dieser URL-Slug wird bereits verwendet." }, { status: 400 });
      }
    }

    const isNewlyPublished = Boolean(isPublished) && !existingEvent.isPublished;

    // 2. Update Event details
    await db
      .update(events)
      .set({
        title,
        slug: cleanSlug,
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
        legalChecklistConfirmedAt: isNewlyPublished && legalChecklistConfirmed ? new Date() : existingEvent.legalChecklistConfirmedAt,
        legalChecklistConfirmedBy: isNewlyPublished && legalChecklistConfirmed ? cleanOrganizerId : existingEvent.legalChecklistConfirmedBy,
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
              feeCents: Number(tier.feeCents) || 0,
              includedServices: tier.includedServices || null,
              ticketTerms: tier.ticketTerms || null,
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
            feeCents: Number(tier.feeCents) || 0,
            includedServices: tier.includedServices || null,
            ticketTerms: tier.ticketTerms || null,
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

    // 4. Freeze document versions if newly published
    if (isNewlyPublished && organizer) {
      await snapshotDocumentVersion({ organizerId: existingEvent.organizerId, documentType: "impressum", content: organizer.impressumContent, url: organizer.impressumUrl });
      await snapshotDocumentVersion({ organizerId: existingEvent.organizerId, documentType: "privacy", content: organizer.privacyContent, url: organizer.privacyUrl });
      await snapshotDocumentVersion({ organizerId: existingEvent.organizerId, documentType: "terms", content: organizer.termsContent, url: organizer.termsUrl });
      if (eventTerms) {
        await snapshotDocumentVersion({ organizerId: existingEvent.organizerId, eventId, documentType: "event_terms", content: eventTerms });
      }
      if (cancellationPolicy) {
        await snapshotDocumentVersion({ organizerId: existingEvent.organizerId, eventId, documentType: "cancellation_policy", content: cancellationPolicy });
      }
    }

    return NextResponse.json({ success: true, eventId, slug: cleanSlug });
  } catch (error: any) {
    console.error("Error updating event:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
