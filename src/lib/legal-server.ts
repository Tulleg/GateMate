import crypto from "crypto";
import { db } from "@/db";
import { legalDocumentVersions } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { OrganizerLegalProfile, STATUTORY_WITHDRAWAL_NOTICE } from "./legal";

export function generateHash(content: string): string {
  return crypto.createHash("sha256").update(content || "").digest("hex");
}

/**
 * Creates a version snapshot for a legal document type if content changed
 */
export async function snapshotDocumentVersion(params: {
  organizerId: string;
  eventId?: string | null;
  documentType: "impressum" | "privacy" | "terms" | "event_terms" | "ticket_terms" | "revocation_notice" | "cancellation_policy";
  content?: string | null;
  url?: string | null;
}): Promise<number> {
  const { organizerId, eventId, documentType, content, url } = params;
  const rawString = `${content || ""}|${url || ""}`;
  const hash = generateHash(rawString);

  // Fetch latest version for this documentType & organizer
  const existing = await db
    .select()
    .from(legalDocumentVersions)
    .where(
      and(
        eq(legalDocumentVersions.organizerId, organizerId),
        eq(legalDocumentVersions.documentType, documentType)
      )
    )
    .orderBy(desc(legalDocumentVersions.version));

  const latest = existing[0];

  if (latest && latest.hash === hash) {
    return latest.version; // No change, return existing version
  }

  const nextVersion = (latest?.version || 0) + 1;
  const newId = `docver_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  await db.insert(legalDocumentVersions).values({
    id: newId,
    organizerId,
    eventId: eventId || null,
    documentType,
    version: nextVersion,
    content: content || null,
    url: url || null,
    hash,
    createdAt: new Date(),
  });

  return nextVersion;
}

export interface OrderDocumentSnapshot {
  purchasedAt: string;
  organizer: {
    legalName: string;
    legalForm: string | null;
    responsiblePerson: string | null;
    street: string | null;
    zip: string | null;
    city: string | null;
    country: string;
    vatId: string | null;
    isSmallBusiness: boolean;
  };
  documents: {
    impressum: { version: number; content: string | null; url: string | null; hash: string };
    privacy: { version: number; content: string | null; url: string | null; hash: string };
    terms: { version: number; content: string | null; url: string | null; hash: string };
    eventTerms: { version: number; content: string | null; hash: string };
    ticketTerms: { version: number; content: string | null; tierName: string; hash: string };
    revocationNotice: { version: number; content: string; hash: string };
    cancellationPolicy: { version: number; content: string | null; hash: string };
  };
}

/**
 * Freezes the current active document versions into a JSON snapshot string for an order
 */
export async function createOrderLegalSnapshot(params: {
  organizer: OrganizerLegalProfile;
  event?: any;
  tier?: any;
}): Promise<string> {
  const { organizer, event, tier } = params;
  const organizerId = organizer.id || organizer.userId || "organizer_default";

  // Snapshot or get versions
  const impressumVersion = await snapshotDocumentVersion({
    organizerId,
    documentType: "impressum",
    content: organizer.impressumContent,
    url: organizer.impressumUrl,
  });

  const privacyVersion = await snapshotDocumentVersion({
    organizerId,
    documentType: "privacy",
    content: organizer.privacyContent,
    url: organizer.privacyUrl,
  });

  const termsVersion = await snapshotDocumentVersion({
    organizerId,
    documentType: "terms",
    content: organizer.termsContent,
    url: organizer.termsUrl,
  });

  const eventTermsContent = event?.eventTerms || organizer.eventTermsContent || "Es gelten die allgemeinen Teilnahmebedingungen des Veranstalters.";
  const eventTermsVersion = await snapshotDocumentVersion({
    organizerId,
    eventId: event?.id,
    documentType: "event_terms",
    content: eventTermsContent,
  });

  const ticketTermsContent = tier?.ticketTerms || "Keine besonderen Ticketbedingungen.";
  const ticketTermsVersion = await snapshotDocumentVersion({
    organizerId,
    eventId: event?.id,
    documentType: "ticket_terms",
    content: ticketTermsContent,
  });

  const revocationContent = organizer.revocationNoticeCustom
    ? `${STATUTORY_WITHDRAWAL_NOTICE}\n\nZusatzhinweis des Veranstalters: ${organizer.revocationNoticeCustom}`
    : STATUTORY_WITHDRAWAL_NOTICE;

  const revocationVersion = await snapshotDocumentVersion({
    organizerId,
    documentType: "revocation_notice",
    content: revocationContent,
  });

  const cancellationContent = event?.cancellationPolicy || organizer.cancellationPolicyContent || "Tickets sind grundsätzlich vom Umtausch und von der Rückgabe ausgeschlossen, es sei denn, die Veranstaltung wird abgesagt oder verlegt.";
  const cancellationVersion = await snapshotDocumentVersion({
    organizerId,
    eventId: event?.id,
    documentType: "cancellation_policy",
    content: cancellationContent,
  });

  const snapshot: OrderDocumentSnapshot = {
    purchasedAt: new Date().toISOString(),
    organizer: {
      legalName: organizer.legalName || organizer.name || "Veranstalter",
      legalForm: organizer.legalForm || null,
      responsiblePerson: organizer.responsiblePerson || null,
      street: organizer.street || null,
      zip: organizer.zip || null,
      city: organizer.city || null,
      country: organizer.country || "Deutschland",
      vatId: organizer.vatId || null,
      isSmallBusiness: Boolean(organizer.isSmallBusiness),
    },
    documents: {
      impressum: {
        version: impressumVersion,
        content: organizer.impressumContent || null,
        url: organizer.impressumUrl || null,
        hash: generateHash(`${organizer.impressumContent || ""}|${organizer.impressumUrl || ""}`),
      },
      privacy: {
        version: privacyVersion,
        content: organizer.privacyContent || null,
        url: organizer.privacyUrl || null,
        hash: generateHash(`${organizer.privacyContent || ""}|${organizer.privacyUrl || ""}`),
      },
      terms: {
        version: termsVersion,
        content: organizer.termsContent || null,
        url: organizer.termsUrl || null,
        hash: generateHash(`${organizer.termsContent || ""}|${organizer.termsUrl || ""}`),
      },
      eventTerms: {
        version: eventTermsVersion,
        content: eventTermsContent,
        hash: generateHash(eventTermsContent),
      },
      ticketTerms: {
        version: ticketTermsVersion,
        content: ticketTermsContent,
        tierName: tier?.name || "Standard Pass",
        hash: generateHash(ticketTermsContent),
      },
      revocationNotice: {
        version: revocationVersion,
        content: revocationContent,
        hash: generateHash(revocationContent),
      },
      cancellationPolicy: {
        version: cancellationVersion,
        content: cancellationContent,
        hash: generateHash(cancellationContent),
      },
    },
  };

  return JSON.stringify(snapshot);
}
