import crypto from "crypto";
import { db } from "@/db";
import { legalDocuments, legalDocumentVersions } from "@/db/schema";
import { eq, and, desc, isNull, or } from "drizzle-orm";
import { OrganizerLegalProfile, LegalDocumentType, STATUTORY_WITHDRAWAL_NOTICE, LEGAL_MODULES } from "./legal";

export function generateHash(content: string): string {
  return crypto.createHash("sha256").update(content || "").digest("hex");
}

/**
 * Retrieves the currently active published document for a given document type.
 * Supports both platform-level (organizerId is null) and organizer-level documents.
 */
export async function getPublishedDocument(params: {
  organizerId?: string | null;
  documentType: LegalDocumentType;
  eventType?: string | null;
}) {
  try {
    const { organizerId, documentType, eventType } = params;

    // Build query condition
    const conditions = [
      eq(legalDocuments.documentType, documentType as any),
      eq(legalDocuments.status, "published"),
    ];

    if (organizerId) {
      conditions.push(eq(legalDocuments.organizerId, organizerId));
    } else {
      conditions.push(isNull(legalDocuments.organizerId));
    }

    const docs = await db
      .select()
      .from(legalDocuments)
      .where(and(...conditions))
      .orderBy(desc(legalDocuments.version));

    // If filtered by eventType, find specific eventType doc or fallback to general doc (null eventType)
    if (eventType && docs.length > 0) {
      const specificDoc = docs.find((d) => d.eventType === eventType);
      if (specificDoc) return specificDoc;
    }

    return docs[0] || null;
  } catch (err: any) {
    console.warn(`[getPublishedDocument Note] Could not fetch document ${params.documentType} from DB:`, err?.message || err);
    return null;
  }
}

/**
 * Creates or publishes a new version of a legal document in `legalDocuments`
 */
export async function publishLegalDocument(params: {
  organizerId?: string | null;
  documentType: LegalDocumentType;
  title: string;
  content?: string | null;
  url?: string | null;
  eventType?: string | null;
  applicableModules?: string[];
  status?: "draft" | "published" | "archived";
}) {
  const { organizerId, documentType, title, content, url, eventType, applicableModules, status = "published" } = params;

  const rawString = `${content || ""}|${url || ""}|${JSON.stringify(applicableModules || [])}`;
  const hash = generateHash(rawString);

  // Fetch latest version for this doc type & organizer
  const conditions = [eq(legalDocuments.documentType, documentType as any)];
  if (organizerId) {
    conditions.push(eq(legalDocuments.organizerId, organizerId));
  } else {
    conditions.push(isNull(legalDocuments.organizerId));
  }

  const existingDocs = await db
    .select()
    .from(legalDocuments)
    .where(and(...conditions))
    .orderBy(desc(legalDocuments.version));

  const latest = existingDocs[0];
  const nextVersion = (latest?.version || 0) + 1;
  const newId = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  const modulesJson = applicableModules && applicableModules.length > 0 ? JSON.stringify(applicableModules) : null;

  await db.insert(legalDocuments).values({
    id: newId,
    organizerId: organizerId || null,
    documentType: documentType as any,
    title,
    content: content || null,
    url: url || null,
    eventType: (eventType as any) || null,
    applicableModules: modulesJson,
    version: nextVersion,
    status: status as any,
    hash,
    createdAt: new Date(),
    publishedAt: status === "published" ? new Date() : null,
    updatedAt: new Date(),
    validFrom: new Date(),
  });

  // Also record in legacy legalDocumentVersions table for backwards compatibility
  if (organizerId) {
    const legacyVerId = `docver_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    await db.insert(legalDocumentVersions).values({
      id: legacyVerId,
      organizerId,
      documentType,
      version: nextVersion,
      content: content || null,
      url: url || null,
      hash,
      createdAt: new Date(),
    }).catch(() => {});
  }

  return { id: newId, version: nextVersion, hash };
}

export interface DetailedOrderDocumentSnapshot {
  purchasedAt: string;
  eventType: string;
  enabledModules: string[];
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
  platformDocuments: Record<
    string,
    { title: string; version: number; content: string | null; url: string | null; hash: string }
  >;
  organizerDocuments: Record<
    string,
    { title: string; version: number; content: string | null; url: string | null; hash: string }
  >;
  moduleDetails: Record<string, { label: string; text: string }>;
}

/**
 * Freezes the current active document versions into a comprehensive JSON snapshot string for an order
 */
export async function createOrderLegalSnapshot(params: {
  organizer: OrganizerLegalProfile;
  event?: any;
  tier?: any;
}): Promise<string> {
  const { organizer, event, tier } = params;
  const organizerId = organizer.id || organizer.userId || "organizer_default";
  const eventType = event?.eventType || "other";

  // Parse enabled legal modules
  let enabledModules: string[] = [];
  try {
    if (event?.enabledLegalModules) {
      enabledModules = typeof event.enabledLegalModules === "string" ? JSON.parse(event.enabledLegalModules) : event.enabledLegalModules;
    }
  } catch (e) {
    enabledModules = [];
  }
  if (!enabledModules.includes("statutory_revocation_exemption")) {
    enabledModules.push("statutory_revocation_exemption");
  }

  // 1. Fetch Platform Documents
  const platformTypes: LegalDocumentType[] = ["platform_impressum", "platform_privacy", "platform_terms"];
  const platformDocuments: Record<string, { title: string; version: number; content: string | null; url: string | null; hash: string }> = {};

  for (const docType of platformTypes) {
    const doc = await getPublishedDocument({ documentType: docType });
    const content = doc?.content || `Plattform-Dokument ${docType} der Plattform GateMate.`;
    platformDocuments[docType] = {
      title: doc?.title || docType,
      version: doc?.version || 1,
      content,
      url: doc?.url || null,
      hash: doc?.hash || generateHash(content),
    };
  }

  // 2. Fetch or fallback Organizer Documents
  const organizerTypes: LegalDocumentType[] = [
    "organizer_impressum",
    "organizer_privacy",
    "organizer_agb",
    "event_terms",
    "ticket_terms",
    "refund_policy",
    "revocation_notice",
  ];

  const organizerDocuments: Record<string, { title: string; version: number; content: string | null; url: string | null; hash: string }> = {};

  for (const docType of organizerTypes) {
    const doc = await getPublishedDocument({ organizerId, documentType: docType, eventType });

    let content: string | null = doc?.content || null;
    let url: string | null = doc?.url || null;

    // Fallbacks from Organizer / Event / Tier profile if no document entry exists yet
    if (!content && !url) {
      if (docType === "organizer_impressum") {
        content = organizer.impressumContent || null;
        url = organizer.impressumUrl || null;
      } else if (docType === "organizer_privacy") {
        content = organizer.privacyContent || null;
        url = organizer.privacyUrl || null;
      } else if (docType === "organizer_agb") {
        content = organizer.termsContent || null;
        url = organizer.termsUrl || null;
      } else if (docType === "event_terms") {
        content = event?.eventTerms || organizer.eventTermsContent || "Es gelten die allgemeinen Teilnahmebedingungen des Veranstalters.";
      } else if (docType === "ticket_terms") {
        content = tier?.ticketTerms || "Standard-Ticketbedingungen. Tickets sind nach Personalisierung nicht übertragbar.";
      } else if (docType === "refund_policy") {
        content = event?.cancellationPolicy || organizer.cancellationPolicyContent || "Tickets sind grundsätzlich vom Umtausch ausgeschlossen.";
      } else if (docType === "revocation_notice") {
        content = organizer.revocationNoticeCustom
          ? `${STATUTORY_WITHDRAWAL_NOTICE}\n\nZusatzhinweis des Veranstalters: ${organizer.revocationNoticeCustom}`
          : STATUTORY_WITHDRAWAL_NOTICE;
      }
    }

    const rawContent = `${content || ""}|${url || ""}`;
    organizerDocuments[docType] = {
      title: doc?.title || docType,
      version: doc?.version || 1,
      content,
      url,
      hash: doc?.hash || generateHash(rawContent),
    };
  }

  // 3. Compile Enabled Legal Modules
  const moduleDetails: Record<string, { label: string; text: string }> = {};
  for (const modKey of enabledModules) {
    const modConfig = LEGAL_MODULES[modKey];
    if (modConfig) {
      moduleDetails[modKey] = {
        label: modConfig.label,
        text: modConfig.defaultText,
      };
    }
  }

  const snapshot: DetailedOrderDocumentSnapshot = {
    purchasedAt: new Date().toISOString(),
    eventType,
    enabledModules,
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
    platformDocuments,
    organizerDocuments,
    moduleDetails,
  };

  return JSON.stringify(snapshot);
}

export async function snapshotDocumentVersion(params: {
  organizerId: string;
  eventId?: string | null;
  documentType: any;
  content?: string | null;
  url?: string | null;
}): Promise<number> {
  const result = await publishLegalDocument({
    organizerId: params.organizerId,
    documentType: params.documentType,
    title: params.documentType,
    content: params.content,
    url: params.url,
  });
  return result.version;
}


