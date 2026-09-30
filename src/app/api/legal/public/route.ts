import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, events } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getPublishedDocument } from "@/lib/legal-server";
import { LegalDocumentType, LEGAL_DOCUMENT_METADATA, LEGAL_MODULES } from "@/lib/legal";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const organizerSlug = searchParams.get("organizerSlug");
    const eventSlug = searchParams.get("eventSlug");
    const scope = searchParams.get("scope"); // 'platform' | 'organizer' | 'event'

    let organizerId: string | null = null;
    let eventType: string | null = null;
    let enabledModules: string[] = [];

    if (eventSlug) {
      const foundEvents = await db.select().from(events).where(eq(events.slug, eventSlug));
      const ev = foundEvents[0];
      if (ev) {
        organizerId = ev.organizerId;
        eventType = ev.eventType || "other";
        try {
          if (ev.enabledLegalModules) {
            enabledModules = typeof ev.enabledLegalModules === "string" ? JSON.parse(ev.enabledLegalModules) : ev.enabledLegalModules;
          }
        } catch (e) {}
      }
    } else if (organizerSlug) {
      const foundUsers = await db.select().from(users).where(eq(users.organizerSlug, organizerSlug));
      const org = foundUsers[0];
      if (org) {
        organizerId = org.id;
      }
    }

    if (scope === "platform") {
      const platformTypes: LegalDocumentType[] = ["platform_impressum", "platform_privacy", "platform_terms"];
      const docs: Record<string, any> = {};
      for (const t of platformTypes) {
        const d = await getPublishedDocument({ documentType: t });
        docs[t] = d || {
          title: LEGAL_DOCUMENT_METADATA[t]?.title,
          version: 1,
          content: `Standard ${LEGAL_DOCUMENT_METADATA[t]?.title} der Plattform GateMate.`,
        };
      }
      return NextResponse.json({ scope: "platform", documents: docs });
    }

    // Fetch organizer documents
    const organizerTypes: LegalDocumentType[] = [
      "organizer_impressum",
      "organizer_privacy",
      "organizer_agb",
      "event_terms",
      "ticket_terms",
      "refund_policy",
      "revocation_notice",
    ];

    const organizerDocs: Record<string, any> = {};
    for (const t of organizerTypes) {
      const d = await getPublishedDocument({ organizerId, documentType: t, eventType });
      organizerDocs[t] = d;
    }

    // Platform docs fallback for checkout
    const platformDocs: Record<string, any> = {};
    const platformTypes: LegalDocumentType[] = ["platform_impressum", "platform_privacy", "platform_terms"];
    for (const t of platformTypes) {
      const d = await getPublishedDocument({ documentType: t });
      platformDocs[t] = d;
    }

    return NextResponse.json({
      organizerId,
      eventType,
      enabledModules,
      organizerDocuments: organizerDocs,
      platformDocuments: platformDocs,
    });
  } catch (error: any) {
    console.error("GET /api/legal/public error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
