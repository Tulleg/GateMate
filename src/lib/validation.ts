import { OrganizerLegalProfile } from "./legal";
import { hasOrganizerStripeAccount } from "./stripe";

export interface ValidationIssue {
  id: string;
  field: string;
  label: string;
  category: "organizer" | "event" | "legal" | "tickets";
  requirementType: "statutory" | "conditional" | "optional";
  isBlocking: boolean;
  message: string;
}

export interface ChecklistItem {
  id: string;
  category: "organizer" | "event" | "legal" | "tickets";
  title: string;
  description: string;
  requirementType: "statutory" | "conditional" | "optional";
  status: "passed" | "failed" | "warning";
  details?: string;
}

export interface EventPublicationValidationResult {
  canPublish: boolean;
  isCompliant: boolean;
  issues: ValidationIssue[];
  checklist: ChecklistItem[];
  missingBlockingFields: string[];
}

// Commercial legal forms that require registration in Handelsregister/Vereinsregister
const REGISTERED_LEGAL_FORMS = ["gmbh", "ug", "ag", "e.v.", "ev", "kgaa", "ohg", "kg", "eg"];

export function validateEventForPublication(
  organizer: OrganizerLegalProfile | null | undefined,
  event: {
    title?: string | null;
    description?: string | null;
    venue?: string | null;
    venueStreet?: string | null;
    venueZip?: string | null;
    venueCity?: string | null;
    venueCountry?: string | null;
    startDate?: string | Date | null;
    endDate?: string | Date | null;
    hasEndTime?: boolean | null;
    ageRestriction?: string | null;
    accessibilityInfo?: string | null;
    houseRules?: string | null;
    specialAdmissionConditions?: string | null;
    eventTerms?: string | null;
    cancellationPolicy?: string | null;
    salesStartDate?: string | Date | null;
    salesEndDate?: string | Date | null;
  } | null | undefined,
  tiers: Array<{
    name?: string | null;
    priceCents?: number | null;
    quantityAvailable?: number | null;
    feeCents?: number | null;
    includedServices?: string | null;
    ticketTerms?: string | null;
  }> | null | undefined
): EventPublicationValidationResult {
  const issues: ValidationIssue[] = [];
  const checklist: ChecklistItem[] = [];

  // ==========================================
  // 1. ORGANIZER & LEGAL PROFILE VALIDATION
  // ==========================================
  if (!organizer) {
    issues.push({
      id: "org_missing",
      field: "organizer",
      label: "Veranstalter-Stammdaten",
      category: "organizer",
      requirementType: "statutory",
      isBlocking: true,
      message: "Veranstalter-Stammdaten fehlen vollständig.",
    });
  } else {
    // A. Name / Firma
    if (!organizer.legalName || !organizer.legalName.trim()) {
      issues.push({
        id: "org_legal_name",
        field: "legalName",
        label: "Firmenname / Vollständiger Name",
        category: "organizer",
        requirementType: "statutory",
        isBlocking: true,
        message: "Firmenname / Rechtlicher Name der Einzelperson fehlt.",
      });
    }

    // B. Rechtsform
    if (!organizer.legalForm || !organizer.legalForm.trim()) {
      issues.push({
        id: "org_legal_form",
        field: "legalForm",
        label: "Rechtsform",
        category: "organizer",
        requirementType: "statutory",
        isBlocking: true,
        message: "Rechtsform (z.B. GmbH, Einzelunternehmen, e.V.) fehlt.",
      });
    }

    // C. Verantwortliche Kontaktperson / Vertreten durch
    if (!organizer.responsiblePerson || !organizer.responsiblePerson.trim()) {
      issues.push({
        id: "org_responsible_person",
        field: "responsiblePerson",
        label: "Verantwortliche Kontaktperson (Vertreten durch)",
        category: "organizer",
        requirementType: "statutory",
        isBlocking: true,
        message: "Verantwortliche Kontaktperson / Vertreten durch fehlt.",
      });
    }

    // D. Ladungsfähige Anschrift
    if (!organizer.street || !organizer.street.trim()) {
      issues.push({
        id: "org_street",
        field: "street",
        label: "Straße & Hausnummer",
        category: "organizer",
        requirementType: "statutory",
        isBlocking: true,
        message: "Ladungsfähige Anschrift: Straße & Hausnummer fehlt.",
      });
    }
    if (!organizer.zip || !organizer.zip.trim()) {
      issues.push({
        id: "org_zip",
        field: "zip",
        label: "Postleitzahl",
        category: "organizer",
        requirementType: "statutory",
        isBlocking: true,
        message: "Ladungsfähige Anschrift: Postleitzahl fehlt.",
      });
    }
    if (!organizer.city || !organizer.city.trim()) {
      issues.push({
        id: "org_city",
        field: "city",
        label: "Ort / Stadt",
        category: "organizer",
        requirementType: "statutory",
        isBlocking: true,
        message: "Ladungsfähige Anschrift: Ort/Stadt fehlt.",
      });
    }

    // E. E-Mail & Telefon
    if (!organizer.email || !organizer.email.trim()) {
      issues.push({
        id: "org_email",
        field: "email",
        label: "E-Mail-Adresse",
        category: "organizer",
        requirementType: "statutory",
        isBlocking: true,
        message: "Veranstalter-E-Mail-Adresse fehlt.",
      });
    }

    const cleanForm = (organizer.legalForm || "").toLowerCase().trim();
    const isCommercialEntity = REGISTERED_LEGAL_FORMS.some((f) => cleanForm.includes(f));

    if (!organizer.phone || !organizer.phone.trim()) {
      issues.push({
        id: "org_phone",
        field: "phone",
        label: "Telefonnummer",
        category: "organizer",
        requirementType: isCommercialEntity ? "statutory" : "conditional",
        isBlocking: isCommercialEntity,
        message: "Telefonnummer für Kundenrückfragen fehlt.",
      });
    }

    // F. Registergericht & Nummer (Konditional nach Rechtsform)
    if (isCommercialEntity) {
      if (!organizer.registrationCouncil || !organizer.registrationCouncil.trim()) {
        issues.push({
          id: "org_reg_council",
          field: "registrationCouncil",
          label: "Registergericht",
          category: "organizer",
          requirementType: "conditional",
          isBlocking: true,
          message: `Für die Rechtsform "${organizer.legalForm}" ist ein Registergericht erforderlich.`,
        });
      }
      if (!organizer.registrationNumber || !organizer.registrationNumber.trim()) {
        issues.push({
          id: "org_reg_number",
          field: "registrationNumber",
          label: "Registernummer",
          category: "organizer",
          requirementType: "conditional",
          isBlocking: true,
          message: `Für die Rechtsform "${organizer.legalForm}" ist eine Registernummer (z.B. HRB/VR) erforderlich.`,
        });
      }
    }

    // G. USt-ID vs. Kleinunternehmer
    if (!organizer.isSmallBusiness && (!organizer.vatId || !organizer.vatId.trim())) {
      issues.push({
        id: "org_vat_id",
        field: "vatId",
        label: "USt-IdNr. / Kleinunternehmer-Status",
        category: "organizer",
        requirementType: "conditional",
        isBlocking: false,
        message: "Weder USt-ID angegeben noch § 19 UStG Kleinunternehmer-Hinweis aktiviert.",
      });
    }

    // H. Impressum
    const hasImpressum =
      organizer.legalMode === "url"
        ? Boolean(organizer.impressumUrl?.trim())
        : Boolean(organizer.impressumContent?.trim() || organizer.impressumUrl?.trim());

    if (!hasImpressum) {
      issues.push({
        id: "legal_impressum",
        field: "impressumContent",
        label: "Impressum",
        category: "legal",
        requirementType: "statutory",
        isBlocking: true,
        message: "Veranstalter-Impressum fehlt (Text oder URL erforderlich).",
      });
    }

    // I. Datenschutz
    const hasPrivacy =
      organizer.legalMode === "url"
        ? Boolean(organizer.privacyUrl?.trim())
        : Boolean(organizer.privacyContent?.trim() || organizer.privacyUrl?.trim());

    if (!hasPrivacy) {
      issues.push({
        id: "legal_privacy",
        field: "privacyContent",
        label: "Datenschutzhinweise",
        category: "legal",
        requirementType: "statutory",
        isBlocking: true,
        message: "Veranstalter-Datenschutzhinweise fehlen.",
      });
    }

    // J. AGB
    const hasTerms =
      organizer.legalMode === "url"
        ? Boolean(organizer.termsUrl?.trim())
        : Boolean(organizer.termsContent?.trim() || organizer.termsUrl?.trim());

    if (!hasTerms) {
      issues.push({
        id: "legal_terms",
        field: "termsContent",
        label: "AGB (Allgemeine Geschäftsbedingungen)",
        category: "legal",
        requirementType: "statutory",
        isBlocking: true,
        message: "Veranstalter-AGB fehlen.",
      });
    }

    // K. Stornierungs-/Erstattungsbedingungen
    const hasCancellationPolicy = Boolean(
      (organizer.cancellationPolicyContent && organizer.cancellationPolicyContent.trim()) ||
        (event?.cancellationPolicy && event.cancellationPolicy.trim())
    );

    if (!hasCancellationPolicy) {
      issues.push({
        id: "legal_cancellation",
        field: "cancellationPolicyContent",
        label: "Stornierungs-/Erstattungsbedingungen",
        category: "legal",
        requirementType: "statutory",
        isBlocking: true,
        message: "Stornierungs- und Erstattungsbedingungen fehlen.",
      });
    }

    // L. Stripe Payment Account Status
    if (!hasOrganizerStripeAccount(organizer)) {
      issues.push({
        id: "org_stripe",
        field: "stripeConnectedAccountId",
        label: "Zahlungsstatus / Stripe Konto",
        category: "organizer",
        requirementType: "statutory",
        isBlocking: true,
        message: "Stripe-Zahlungskonto ist noch nicht verbunden oder Auszahlungen sind nicht aktiviert.",
      });
    }
  }

  // ==========================================
  // 2. EVENT DATA VALIDATION
  // ==========================================
  if (!event) {
    issues.push({
      id: "event_missing",
      field: "event",
      label: "Veranstaltungsdaten",
      category: "event",
      requirementType: "statutory",
      isBlocking: true,
      message: "Veranstaltungsdaten fehlen.",
    });
  } else {
    if (!event.title || !event.title.trim()) {
      issues.push({
        id: "event_title",
        field: "title",
        label: "Veranstaltungstitel",
        category: "event",
        requirementType: "statutory",
        isBlocking: true,
        message: "Veranstaltungstitel ist erforderlich.",
      });
    }

    if (!event.description || !event.description.trim()) {
      issues.push({
        id: "event_description",
        field: "description",
        label: "Beschreibung",
        category: "event",
        requirementType: "statutory",
        isBlocking: true,
        message: "Veranstaltungsbeschreibung fehlt.",
      });
    }

    if (!event.startDate) {
      issues.push({
        id: "event_start_date",
        field: "startDate",
        label: "Veranstaltungstermin (Beginn)",
        category: "event",
        requirementType: "statutory",
        isBlocking: true,
        message: "Veranstaltungsbeginn (Datum & Uhrzeit) fehlt.",
      });
    }

    const hasEndTime = event.hasEndTime ?? true;
    if (hasEndTime && !event.endDate) {
      issues.push({
        id: "event_end_date",
        field: "endDate",
        label: "Veranstaltungsende",
        category: "event",
        requirementType: "conditional",
        isBlocking: true,
        message: "Enddatum ist als relevant markiert, aber nicht angegeben.",
      });
    }

    if (!event.venue || !event.venue.trim()) {
      issues.push({
        id: "event_venue",
        field: "venue",
        label: "Veranstaltungsort (Location)",
        category: "event",
        requirementType: "statutory",
        isBlocking: true,
        message: "Veranstaltungsort (Location-Name) fehlt.",
      });
    }

    if (!event.venueStreet || !event.venueStreet.trim()) {
      issues.push({
        id: "event_venue_street",
        field: "venueStreet",
        label: "Ort: Straße & Hausnummer",
        category: "event",
        requirementType: "statutory",
        isBlocking: true,
        message: "Straße & Hausnummer des Veranstaltungsorts fehlen.",
      });
    }

    if (!event.venueZip || !event.venueZip.trim() || !event.venueCity || !event.venueCity.trim()) {
      issues.push({
        id: "event_venue_city",
        field: "venueCity",
        label: "Ort: PLZ & Stadt",
        category: "event",
        requirementType: "statutory",
        isBlocking: true,
        message: "PLZ & Stadt des Veranstaltungsorts fehlen.",
      });
    }

    if (!event.ageRestriction || !event.ageRestriction.trim()) {
      issues.push({
        id: "event_age_restriction",
        field: "ageRestriction",
        label: "Altersbeschränkung",
        category: "event",
        requirementType: "statutory",
        isBlocking: true,
        message: "Altersbeschränkung muss angegeben werden (z.B. Keine, ab 18 Jahren, ab 16).",
      });
    }

    if (!event.accessibilityInfo) {
      issues.push({
        id: "event_accessibility",
        field: "accessibilityInfo",
        label: "Barrierefreiheit",
        category: "event",
        requirementType: "optional",
        isBlocking: false,
        message: "Hinweise zur Barrierefreiheit sind nicht hinterlegt.",
      });
    }
  }

  // ==========================================
  // 3. TICKET TIERS VALIDATION
  // ==========================================
  if (!tiers || !Array.isArray(tiers) || tiers.length === 0) {
    issues.push({
      id: "tickets_none",
      field: "tiers",
      label: "Ticketkategorien",
      category: "tickets",
      requirementType: "statutory",
      isBlocking: true,
      message: "Es muss mindestens eine Ticketkategorie zum Verkauf angelegt sein.",
    });
  } else {
    tiers.forEach((t, idx) => {
      const tierName = t.name || `Kategorie #${idx + 1}`;
      if (!t.name || !t.name.trim()) {
        issues.push({
          id: `ticket_name_${idx}`,
          field: `tiers[${idx}].name`,
          label: `Ticketkategorie #${idx + 1} Name`,
          category: "tickets",
          requirementType: "statutory",
          isBlocking: true,
          message: `Name für Ticketkategorie #${idx + 1} fehlt.`,
        });
      }

      if (t.priceCents === null || t.priceCents === undefined || t.priceCents < 0) {
        issues.push({
          id: `ticket_price_${idx}`,
          field: `tiers[${idx}].priceCents`,
          label: `Ticketkategorie #${idx + 1} Preis`,
          category: "tickets",
          requirementType: "statutory",
          isBlocking: true,
          message: `Ungültiger Preis für Ticketkategorie "${tierName}".`,
        });
      }

      if (!t.quantityAvailable || t.quantityAvailable <= 0) {
        issues.push({
          id: `ticket_qty_${idx}`,
          field: `tiers[${idx}].quantityAvailable`,
          label: `Ticketkategorie #${idx + 1} Kontingent`,
          category: "tickets",
          requirementType: "statutory",
          isBlocking: true,
          message: `Kontingent für Ticketkategorie "${tierName}" muss größer 0 sein.`,
        });
      }
    });
  }

  // ==========================================
  // 4. BUILD CHECKLIST & SUMMARY
  // ==========================================
  const blockingIssues = issues.filter((i) => i.isBlocking);
  const canPublish = blockingIssues.length === 0;

  const hasOrgPassed = issues.filter((i) => i.category === "organizer" && i.isBlocking).length === 0;
  checklist.push({
    id: "check_organizer",
    category: "organizer",
    title: "Veranstalter-Stammdaten & Vertreten durch",
    description: "Vollständige Firma/Name, Adresse, Verantwortlicher & Kontaktangaben",
    requirementType: "statutory",
    status: hasOrgPassed ? "passed" : "failed",
    details: hasOrgPassed
      ? "Stammdaten vollständig"
      : issues
          .filter((i) => i.category === "organizer" && i.isBlocking)
          .map((i) => i.label)
          .join(", "),
  });

  const hasPaymentPassed = !issues.some((i) => i.id === "org_stripe");
  checklist.push({
    id: "check_payment",
    category: "organizer",
    title: "Zahlungsverbindung (Stripe Connect / Keys)",
    description: "Konto für die sichere Auszahlung von Ticketverkäufen",
    requirementType: "statutory",
    status: hasPaymentPassed ? "passed" : "failed",
    details: hasPaymentPassed ? "Stripe-Zahlungskonto ist aktiv" : "Zahlungskonto nicht verbunden",
  });

  const hasEventPassed = issues.filter((i) => i.category === "event" && i.isBlocking).length === 0;
  checklist.push({
    id: "check_event",
    category: "event",
    title: "Veranstaltungsdetails & Veranstaltungsort",
    description: "Titel, Beschreibung, Datum, Uhrzeit, Location & vollständige Adresse",
    requirementType: "statutory",
    status: hasEventPassed ? "passed" : "failed",
    details: hasEventPassed
      ? "Veranstaltungsdaten vollständig"
      : issues
          .filter((i) => i.category === "event" && i.isBlocking)
          .map((i) => i.label)
          .join(", "),
  });

  const hasTicketsPassed = issues.filter((i) => i.category === "tickets" && i.isBlocking).length === 0;
  checklist.push({
    id: "check_tickets",
    category: "tickets",
    title: "Ticketkategorien, Kontingente & Preise",
    description: "Mindestens eine gültige Ticketkategorie mit Preis & Kapazität",
    requirementType: "statutory",
    status: hasTicketsPassed ? "passed" : "failed",
    details: hasTicketsPassed ? "Ticketkategorien konfiguriert" : "Ticketkategorien unvollständig",
  });

  const hasLegalPassed = issues.filter((i) => i.category === "legal" && i.isBlocking).length === 0;
  checklist.push({
    id: "check_legal",
    category: "legal",
    title: "Rechtstexte (Impressum, Datenschutz, AGB, Storno & Widerruf)",
    description: "Gesetzlich geforderte Rechtstexte & Verbraucherinformationen",
    requirementType: "statutory",
    status: hasLegalPassed ? "passed" : "failed",
    details: hasLegalPassed
      ? "Alle Rechtstexte hinterlegt"
      : issues
          .filter((i) => i.category === "legal" && i.isBlocking)
          .map((i) => i.label)
          .join(", "),
  });

  return {
    canPublish,
    isCompliant: canPublish,
    issues,
    checklist,
    missingBlockingFields: blockingIssues.map((i) => i.label),
  };
}

// ==========================================
// ONBOARDING ZOD SCHEMAS & TYPES
// ==========================================
import { z } from "zod";

export const onboardingStep1Schema = z.discriminatedUnion("stripeAccountType", [
  z.object({
    stripeAccountType: z.literal("standard"),
  }),
  z.object({
    stripeAccountType: z.literal("express"),
  }),
  z.object({
    stripeAccountType: z.literal("custom_keys"),
    stripePublishableKey: z
      .string()
      .trim()
      .min(1, "Bitte gib deinen Publishable Key ein.")
      .startsWith("pk_", "Ein Publishable Key muss mit 'pk_' beginnen."),
    stripeSecretKey: z
      .string()
      .trim()
      .min(1, "Bitte gib deinen Secret Key ein.")
      .refine(
        (val) => val.startsWith("sk_") || val.startsWith("rk_"),
        "Ein Secret Key muss mit 'sk_' oder 'rk_' beginnen."
      ),
  }),
]);

export type OnboardingStep1Input = z.infer<typeof onboardingStep1Schema>;

export const onboardingStep2Schema = z.object({
  legalCompanyName: z
    .string()
    .trim()
    .min(2, "Firmenname / Rechnungsname muss mindestens 2 Zeichen lang sein."),
  legalVatId: z
    .string()
    .trim()
    .min(3, "Steuernummer / USt-IdNr. ist erforderlich."),
  street: z
    .string()
    .trim()
    .min(3, "Straße und Hausnummer sind erforderlich."),
  zip: z
    .string()
    .trim()
    .min(3, "Postleitzahl ist erforderlich."),
  city: z
    .string()
    .trim()
    .min(2, "Ort / Stadt ist erforderlich."),
  country: z
    .string()
    .trim()
    .min(2, "Land ist erforderlich.")
    .default("Deutschland"),
});

export type OnboardingStep2Input = z.infer<typeof onboardingStep2Schema>;

export const onboardingStep3Schema = z.object({
  termsAccepted: z
    .boolean()
    .refine((val) => val === true, "Du musst den AGB zustimmen."),
  privacyAccepted: z
    .boolean()
    .refine((val) => val === true, "Du musst der Datenschutzerklärung zustimmen."),
  avvAccepted: z
    .boolean()
    .refine((val) => val === true, "Du musst dem Auftragsverarbeitungsvertrag (AVV) zustimmen."),
});

export type OnboardingStep3Input = z.infer<typeof onboardingStep3Schema>;

// ==========================================
// TICKET & ORDER VALIDATION SCHEMAS
// ==========================================

export const orderCreateSchema = z.object({
  eventId: z.string().min(1, "Event ID ist erforderlich."),
  ticketTierId: z.string().min(1, "Ticketkategorie ist erforderlich."),
  quantity: z.number().int().min(1, "Mindestens 1 Ticket.").max(50, "Maximal 50 Tickets pro Bestellung."),
  customerEmail: z.string().trim().email("Ungültige E-Mail-Adresse."),
  customerName: z.string().trim().min(2, "Vollständiger Name ist erforderlich."),
  termsAccepted: z.boolean().refine((val) => val === true, "AGB-Zustimmung erforderlich."),
  privacyAccepted: z.boolean().refine((val) => val === true, "Datenschutz-Zustimmung erforderlich."),
  revocationExemptionAccepted: z.boolean().optional().default(true),
});

export type OrderCreateInput = z.infer<typeof orderCreateSchema>;

export const ticketCheckInSchema = z.object({
  qrToken: z.string().min(1, "QR Token / Hash ist erforderlich."),
  scannedByUserId: z.string().optional(),
  deviceInfo: z.string().optional(),
  allowDuplicateCheckIn: z.boolean().default(false),
});

export type TicketCheckInInput = z.infer<typeof ticketCheckInSchema>;

export const ticketStatusUpdateSchema = z.object({
  status: z.enum(["valid", "used", "cancelled"]),
  reason: z.string().optional(),
});

export type TicketStatusUpdateInput = z.infer<typeof ticketStatusUpdateSchema>;

// ==========================================
// EVENT & TICKET TIER SCHEMAS
// ==========================================

export const ticketTierSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, "Name der Ticketkategorie ist erforderlich."),
  priceCents: z.number().int().min(0, "Preis darf nicht negativ sein."),
  feeCents: z.number().int().min(0).default(0),
  quantityAvailable: z.number().int().min(1, "Kontingent muss mindestens 1 betragen."),
  includedServices: z.string().nullable().optional(),
  ticketTerms: z.string().nullable().optional(),
});

export type TicketTierInput = z.infer<typeof ticketTierSchema>;

export const eventCreateSchema = z.object({
  title: z.string().trim().min(3, "Titel muss mindestens 3 Zeichen lang sein."),
  slug: z.string().trim().min(3).regex(/^[a-z0-9-]+$/, "Slug darf nur Kleinbuchstaben, Zahlen und Bindestriche enthalten."),
  description: z.string().trim().nullable().optional(),
  eventType: z.enum(["concert", "sports", "club_association", "workshop", "festival", "other"]).default("other"),
  bannerUrl: z.string().url("Ungültige Bild-URL").nullable().optional().or(z.literal("")),
  venue: z.string().trim().min(2, "Veranstaltungsort (Location) ist erforderlich."),
  venueStreet: z.string().trim().min(2, "Straße ist erforderlich."),
  venueZip: z.string().trim().min(2, "Postleitzahl ist erforderlich."),
  venueCity: z.string().trim().min(2, "Stadt ist erforderlich."),
  venueCountry: z.string().trim().default("Deutschland"),
  startDate: z.coerce.date({ invalid_type_error: "Gültiges Startdatum erforderlich." }),
  endDate: z.coerce.date({ invalid_type_error: "Gültiges Enddatum erforderlich." }),
  hasEndTime: z.boolean().default(true),
  isFixedDateEvent: z.boolean().default(true),
  doorsOpenAt: z.coerce.date().nullable().optional(),
  ageRestriction: z.string().trim().min(1, "Altersbeschränkung ist erforderlich."),
  accessibilityInfo: z.string().nullable().optional(),
  houseRules: z.string().nullable().optional(),
  specialAdmissionConditions: z.string().nullable().optional(),
  eventTerms: z.string().nullable().optional(),
  cancellationPolicy: z.string().nullable().optional(),
  salesStartDate: z.coerce.date().nullable().optional(),
  salesEndDate: z.coerce.date().nullable().optional(),
  isPublished: z.boolean().default(false),
  isListedInDirectory: z.boolean().default(true),
  tiers: z.array(ticketTierSchema).min(1, "Mindestens 1 Ticketkategorie erforderlich."),
});

export type EventCreateInput = z.infer<typeof eventCreateSchema>;

export const eventUpdateSchema = eventCreateSchema.partial().extend({
  id: z.string().min(1),
});

export type EventUpdateInput = z.infer<typeof eventUpdateSchema>;

// ==========================================
// SCANNER & CHECK-IN SCHEMAS
// ==========================================

export const scanRequestSchema = z.object({
  qrToken: z.string().min(1, "QR-Code Token erforderlich."),
  eventId: z.string().optional(),
  deviceInfo: z.string().optional(),
});

export type ScanRequestInput = z.infer<typeof scanRequestSchema>;

// ==========================================
// STRIPE WEBHOOK EVENT SCHEMA
// ==========================================

export const stripeWebhookEventSchema = z.object({
  id: z.string(),
  type: z.string(),
  data: z.object({
    object: z.record(z.any()),
  }),
});

export type StripeWebhookPayload = z.infer<typeof stripeWebhookEventSchema>;

// ==========================================
// CONTACT & DSA NOTICE SCHEMAS
// ==========================================

export const contactMessageSchema = z.object({
  name: z.string().trim().min(2, "Name muss mindestens 2 Zeichen lang sein."),
  email: z.string().trim().email("Gültige E-Mail-Adresse erforderlich."),
  category: z.enum(["general", "organizer_support", "buyer_support", "billing", "legal_dsa", "other"]).default("general"),
  subject: z.string().trim().min(3, "Betreff muss mindestens 3 Zeichen lang sein."),
  message: z.string().trim().min(10, "Nachricht muss mindestens 10 Zeichen lang sein."),
  type: z.enum(["general", "dsa_notice"]).default("general"),
  targetUrl: z.string().url("Ungültige URL.").optional().or(z.literal("")),
  violationType: z.string().optional(),
  legalReason: z.string().optional(),
  dsaDeclaration: z.boolean().optional(),
});

export type ContactMessageInput = z.infer<typeof contactMessageSchema>;


