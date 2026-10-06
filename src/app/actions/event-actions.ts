"use server";

import { db } from "@/db";
import { events, ticketTiers, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { eventCreateSchema, eventUpdateSchema, EventCreateInput, EventUpdateInput } from "@/lib/validation";
import { ActionResult, formatZodErrors } from "@/types";
import { getCurrentUser } from "@/lib/auth";

export async function createEventAction(input: unknown): Promise<ActionResult<{ eventId: string; slug: string }>> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return {
        success: false,
        error: "Nicht authentifiziert. Bitte melde dich an.",
      };
    }

    const userRecords = await db.select().from(users).where(eq(users.id, currentUser.id));
    const userRecord = userRecords[0];

    if (userRecord) {
      const connectedAccountId = userRecord.stripeAccountId || userRecord.stripeConnectedAccountId;
      const hasStripe = Boolean(connectedAccountId || (userRecord.stripeSecretKey && userRecord.stripeSecretKey.trim().length > 0));
      const hasLegalInfo = Boolean(userRecord.legalCompanyName && userRecord.street && userRecord.zip && userRecord.city);
      const hasTerms = Boolean(userRecord.termsAcceptedAt && userRecord.privacyAcceptedAt && userRecord.avvAcceptedAt);
      const isComplete = Boolean(userRecord.onboardingCompleted || (hasStripe && hasLegalInfo && hasTerms));

      if (!isComplete) {
        const missing: string[] = [];
        if (!hasStripe) missing.push("1. Stripe Payment");
        if (!hasLegalInfo) missing.push("2. Stammdaten & Adresse");
        if (!hasTerms) missing.push("3. AGB & Rechtstexte");

        return {
          success: false,
          error: `Event-Erstellung gesperrt: Dein Veranstalter-Onboarding ist unvollständig. Es fehlen noch Angaben: ${missing.join(", ")}. Bitte vervollständige das Onboarding unter /onboarding.`,
        };
      }
    }

    const validated = eventCreateSchema.safeParse(input);
    if (!validated.success) {
      return {
        success: false,
        error: "Fehlerhafte Veranstaltungsdaten.",
        fieldErrors: formatZodErrors(validated.error),
      };
    }

    const data: EventCreateInput = validated.data;

    // Check slug uniqueness
    const existing = await db.select({ id: events.id }).from(events).where(eq(events.slug, data.slug));
    if (existing.length > 0) {
      return {
        success: false,
        error: `Der Event-Slug "${data.slug}" wird bereits verwendet. Bitte wähle einen anderen Slug.`,
        fieldErrors: { slug: ["Slug wird bereits verwendet."] },
      };
    }

    const eventId = `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    await db.transaction(async (tx) => {
      await tx.insert(events).values({
        id: eventId,
        organizerId: currentUser.id,
        title: data.title,
        slug: data.slug,
        description: data.description || null,
        eventType: data.eventType,
        bannerUrl: data.bannerUrl || null,
        venue: data.venue,
        venueStreet: data.venueStreet,
        venueZip: data.venueZip,
        venueCity: data.venueCity,
        venueCountry: data.venueCountry,
        startDate: data.startDate,
        endDate: data.endDate,
        hasEndTime: data.hasEndTime,
        isFixedDateEvent: data.isFixedDateEvent,
        doorsOpenAt: data.doorsOpenAt || null,
        ageRestriction: data.ageRestriction,
        accessibilityInfo: data.accessibilityInfo || null,
        houseRules: data.houseRules || null,
        specialAdmissionConditions: data.specialAdmissionConditions || null,
        eventTerms: data.eventTerms || null,
        cancellationPolicy: data.cancellationPolicy || null,
        salesStartDate: data.salesStartDate || null,
        salesEndDate: data.salesEndDate || null,
        isPublished: data.isPublished,
        isListedInDirectory: data.isListedInDirectory,
      });

      const tierInserts = data.tiers.map((t, idx) => ({
        id: t.id || `tier_${eventId}_${idx + 1}`,
        eventId,
        name: t.name,
        priceCents: t.priceCents,
        feeCents: t.feeCents || 0,
        includedServices: t.includedServices || null,
        ticketTerms: t.ticketTerms || null,
        quantityAvailable: t.quantityAvailable,
        quantitySold: 0,
      }));

      if (tierInserts.length > 0) {
        await tx.insert(ticketTiers).values(tierInserts);
      }
    });

    revalidatePath("/organizer/events");
    revalidatePath(`/e/${data.slug}`);

    return {
      success: true,
      data: { eventId, slug: data.slug },
      message: "Veranstaltung erfolgreich erstellt.",
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Fehler beim Erstellen des Events.";
    console.error("[CREATE EVENT ACTION ERROR]", err);
    return {
      success: false,
      error: errorMsg,
    };
  }
}

export async function updateEventAction(input: unknown): Promise<ActionResult<{ eventId: string }>> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return {
        success: false,
        error: "Nicht authentifiziert. Bitte melde dich an.",
      };
    }

    const validated = eventUpdateSchema.safeParse(input);
    if (!validated.success) {
      return {
        success: false,
        error: "Fehlerhafte Veranstaltungsdaten.",
        fieldErrors: formatZodErrors(validated.error),
      };
    }

    const data: EventUpdateInput = validated.data;

    // Verify ownership
    const existingRecords = await db
      .select({ id: events.id, organizerId: events.organizerId })
      .from(events)
      .where(eq(events.id, data.id));

    const existingEvent = existingRecords[0];
    if (!existingEvent) {
      return {
        success: false,
        error: "Veranstaltung nicht gefunden.",
      };
    }

    if (existingEvent.organizerId !== currentUser.id && currentUser.role !== "superadmin") {
      return {
        success: false,
        error: "Keine Berechtigung zur Bearbeitung dieser Veranstaltung.",
      };
    }

    await db.transaction(async (tx) => {
      const updatePayload: Record<string, unknown> = {
        updatedAt: new Date(),
      };

      if (data.title !== undefined) updatePayload.title = data.title;
      if (data.slug !== undefined) updatePayload.slug = data.slug;
      if (data.description !== undefined) updatePayload.description = data.description || null;
      if (data.eventType !== undefined) updatePayload.eventType = data.eventType;
      if (data.bannerUrl !== undefined) updatePayload.bannerUrl = data.bannerUrl || null;
      if (data.venue !== undefined) updatePayload.venue = data.venue;
      if (data.venueStreet !== undefined) updatePayload.venueStreet = data.venueStreet;
      if (data.venueZip !== undefined) updatePayload.venueZip = data.venueZip;
      if (data.venueCity !== undefined) updatePayload.venueCity = data.venueCity;
      if (data.venueCountry !== undefined) updatePayload.venueCountry = data.venueCountry;
      if (data.startDate !== undefined) updatePayload.startDate = data.startDate;
      if (data.endDate !== undefined) updatePayload.endDate = data.endDate;
      if (data.hasEndTime !== undefined) updatePayload.hasEndTime = data.hasEndTime;
      if (data.isFixedDateEvent !== undefined) updatePayload.isFixedDateEvent = data.isFixedDateEvent;
      if (data.doorsOpenAt !== undefined) updatePayload.doorsOpenAt = data.doorsOpenAt || null;
      if (data.ageRestriction !== undefined) updatePayload.ageRestriction = data.ageRestriction;
      if (data.accessibilityInfo !== undefined) updatePayload.accessibilityInfo = data.accessibilityInfo || null;
      if (data.houseRules !== undefined) updatePayload.houseRules = data.houseRules || null;
      if (data.specialAdmissionConditions !== undefined) updatePayload.specialAdmissionConditions = data.specialAdmissionConditions || null;
      if (data.eventTerms !== undefined) updatePayload.eventTerms = data.eventTerms || null;
      if (data.cancellationPolicy !== undefined) updatePayload.cancellationPolicy = data.cancellationPolicy || null;
      if (data.salesStartDate !== undefined) updatePayload.salesStartDate = data.salesStartDate || null;
      if (data.salesEndDate !== undefined) updatePayload.salesEndDate = data.salesEndDate || null;
      if (data.isPublished !== undefined) updatePayload.isPublished = data.isPublished;
      if (data.isListedInDirectory !== undefined) updatePayload.isListedInDirectory = data.isListedInDirectory;

      await tx.update(events).set(updatePayload).where(eq(events.id, data.id));

      if (data.tiers && data.tiers.length > 0) {
        for (const t of data.tiers) {
          if (t.id) {
            await tx
              .update(ticketTiers)
              .set({
                name: t.name,
                priceCents: t.priceCents,
                feeCents: t.feeCents || 0,
                quantityAvailable: t.quantityAvailable,
                includedServices: t.includedServices || null,
                ticketTerms: t.ticketTerms || null,
                updatedAt: new Date(),
              })
              .where(eq(ticketTiers.id, t.id));
          } else {
            const tierId = `tier_${data.id}_${Math.random().toString(36).substring(2, 7)}`;
            await tx.insert(ticketTiers).values({
              id: tierId,
              eventId: data.id,
              name: t.name,
              priceCents: t.priceCents,
              feeCents: t.feeCents || 0,
              quantityAvailable: t.quantityAvailable,
              quantitySold: 0,
              includedServices: t.includedServices || null,
              ticketTerms: t.ticketTerms || null,
            });
          }
        }
      }
    });

    revalidatePath("/organizer/events");
    revalidatePath(`/organizer/events/${data.id}`);

    return {
      success: true,
      data: { eventId: data.id },
      message: "Veranstaltung erfolgreich aktualisiert.",
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Fehler beim Aktualisieren des Events.";
    console.error("[UPDATE EVENT ACTION ERROR]", err);
    return {
      success: false,
      error: errorMsg,
    };
  }
}

export async function cancelEventAction(eventId: string, cancelReason: string): Promise<ActionResult> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return {
        success: false,
        error: "Nicht authentifiziert. Bitte melde dich an.",
      };
    }

    if (!cancelReason || cancelReason.trim().length === 0) {
      return {
        success: false,
        error: "Bitte gib einen Grund für die Absage der Veranstaltung an.",
      };
    }

    const eventRecords = await db
      .select({ id: events.id, organizerId: events.organizerId })
      .from(events)
      .where(eq(events.id, eventId));

    const eventRecord = eventRecords[0];
    if (!eventRecord) {
      return {
        success: false,
        error: "Veranstaltung nicht gefunden.",
      };
    }

    if (eventRecord.organizerId !== currentUser.id && currentUser.role !== "superadmin") {
      return {
        success: false,
        error: "Keine Berechtigung zum Absagen dieser Veranstaltung.",
      };
    }

    await db
      .update(events)
      .set({
        isCancelled: true,
        cancelReason: cancelReason.trim(),
        cancelledAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(events.id, eventId));

    revalidatePath("/organizer/events");

    return {
      success: true,
      message: "Veranstaltung wurde abgesagt.",
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Fehler beim Absagen der Veranstaltung.";
    console.error("[CANCEL EVENT ACTION ERROR]", err);
    return {
      success: false,
      error: errorMsg,
    };
  }
}
