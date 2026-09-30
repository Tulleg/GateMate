export interface OrganizerLegalProfile {
  id?: string | null;
  userId?: string | null;
  legalName?: string | null;
  legalForm?: string | null;
  responsiblePerson?: string | null;
  registrationCouncil?: string | null;
  registrationNumber?: string | null;
  phone?: string | null;
  street?: string | null;
  zip?: string | null;
  city?: string | null;
  country?: string | null;
  vatId?: string | null;
  isSmallBusiness?: boolean | null;
  legalMode?: "url" | "custom_text" | string | null;
  impressumUrl?: string | null;
  impressumContent?: string | null;
  privacyUrl?: string | null;
  privacyContent?: string | null;
  termsUrl?: string | null;
  termsContent?: string | null;
  cancellationPolicyContent?: string | null;
  eventTermsContent?: string | null;
  revocationNoticeCustom?: string | null;
  stripeConnectedAccountId?: string | null;
  stripeSecretKey?: string | null;
  [key: string]: any;
}

export type PlatformDocumentType = "platform_impressum" | "platform_privacy" | "platform_terms";
export type OrganizerDocumentType =
  | "organizer_impressum"
  | "organizer_privacy"
  | "organizer_agb"
  | "event_terms"
  | "ticket_terms"
  | "refund_policy"
  | "revocation_notice";

export type LegalDocumentType = PlatformDocumentType | OrganizerDocumentType;

export type EventTypeKey = "concert" | "sports" | "club_association" | "workshop" | "festival" | "other";

export interface EventTypeConfig {
  key: EventTypeKey;
  label: string;
  description: string;
  recommendedModules: string[];
}

export const EVENT_TYPES: Record<EventTypeKey, EventTypeConfig> = {
  concert: {
    key: "concert",
    label: "Konzert / Live-Show",
    description: "Musikveranstaltungen, Live-Auftritte, Festivals oder Bühnenshows mit fester Terminbindung.",
    recommendedModules: ["statutory_revocation_exemption", "house_rules_and_safety", "photo_video_consent", "age_restriction_and_custody"],
  },
  sports: {
    key: "sports",
    label: "Sportveranstaltung",
    description: "Wettkämpfe, Turniere, Läufe oder sportliche Aktivitäten mit Haftungs- und Sicherheitsbestimmungen.",
    recommendedModules: ["statutory_revocation_exemption", "house_rules_and_safety", "photo_video_consent"],
  },
  club_association: {
    key: "club_association",
    label: "Vereinsveranstaltung",
    description: "Mitgliederversammlungen, Vereinsfeste oder interne Kurse.",
    recommendedModules: ["member_only_access", "photo_video_consent"],
  },
  workshop: {
    key: "workshop",
    label: "Workshop / Seminar",
    description: "Schulungen, Weiterbildungen oder interaktive Kurse.",
    recommendedModules: ["custom_refund_rules", "photo_video_consent"],
  },
  festival: {
    key: "festival",
    label: "Festival / Open Air",
    description: "Mehrtägige oder großflächige Open-Air Veranstaltungen mit umfassenden Platzordnungen.",
    recommendedModules: ["statutory_revocation_exemption", "house_rules_and_safety", "photo_video_consent", "age_restriction_and_custody"],
  },
  other: {
    key: "other",
    label: "Sonstige Veranstaltung",
    description: "Allgemeine Events ohne spezifische Zusatzauflagen.",
    recommendedModules: ["statutory_revocation_exemption"],
  },
};

export interface LegalModuleConfig {
  key: string;
  label: string;
  description: string;
  defaultText: string;
}

export const LEGAL_MODULES: Record<string, LegalModuleConfig> = {
  statutory_revocation_exemption: {
    key: "statutory_revocation_exemption",
    label: "§ 312g Abs. 2 Nr. 9 BGB Widerrufsausschluss",
    description: "Klarstellung, dass bei Dienstleistungen zur Freizeitbetätigung mit bestimmtem Termin kein gesetzliches Widerrufsrecht besteht.",
    defaultText: "Ausschluss des Widerrufsrechts: Gemäß § 312g Abs. 2 Nr. 9 BGB besteht bei Verträgen zur Erbringung von Dienstleistungen im Zusammenhang mit Freizeitbetätigungen, wenn der Vertrag für die Erbringung einen spezifischen Termin oder Zeitraum vorzieht, kein Widerrufsrecht.",
  },
  custom_refund_rules: {
    key: "custom_refund_rules",
    label: "Stornierungs- & Erstattungsregelung",
    description: "Individuelle Regelungen für Ticketstornierungen oder Rückerstattungen bei Terminverlegung/Absage.",
    defaultText: "Erstattungsbedingungen: Tickets sind grundsätzlich von der Rückgabe ausgeschlossen, es sei denn, die Veranstaltung wird durch den Veranstalter abgesagt oder ohne Ausweichtermin verlegt.",
  },
  house_rules_and_safety: {
    key: "house_rules_and_safety",
    label: "Hausordnung & Sicherheit am Veranstaltungsort",
    description: "Bestimmungen zum Verhalten auf dem Veranstaltungsgelände, Sicherheitskontrollen und Einlassverweigerung.",
    defaultText: "Hausordnung & Einlass: Den Anweisungen des Sicherheitspersonals ist Folge zu leisten. Das Mitführen von gefährlichen Gegenständen, eigenen Getränken oder Pyrotechnik ist untersagt.",
  },
  age_restriction_and_custody: {
    key: "age_restriction_and_custody",
    label: "Jugendschutz & Altersbeschränkungen",
    description: "Hinweise zum Jugendschutzgesetz, Mindestalter und Begleitung durch Erziehungsberechtigte.",
    defaultText: "Jugendschutz: Es gelten die Bestimmungen des Jugendschutzgesetzes (JuSchG). Jugendliche unter 16 Jahren erhalten Zutritt nur in Begleitung einer personensorgeberechtigten Person.",
  },
  photo_video_consent: {
    key: "photo_video_consent",
    label: "Foto- & Videoaufnahmen (Einwilligung)",
    description: "Hinweis auf Bild- und Tonaufnahmen während des Events und deren Nutzung zu Veröffentlichungszwecken.",
    defaultText: "Foto- und Videoaufnahmen: Auf der Veranstaltung werden Foto- und Videoaufnahmen angefertigt. Mit dem Betreten des Veranstaltungsgeländes willigen Besucher in die Veröffentlichung zur Berichterstattung und Öffentlichkeitsarbeit ein.",
  },
  member_only_access: {
    key: "member_only_access",
    label: "Vereins- & Mitglieder-Teilnahmevoraussetzungen",
    description: "Rechtlicher Hinweis für exklusive Vereins- oder Verbandsevents.",
    defaultText: "Teilnahmevoraussetzung: Diese Veranstaltung richtet sich ausschließlich an angemeldete Vereinsmitglieder und geladene Gäste.",
  },
};

export interface LegalDocumentMeta {
  type: LegalDocumentType;
  title: string;
  scope: "platform" | "organizer";
  description: string;
}

export const LEGAL_DOCUMENT_METADATA: Record<LegalDocumentType, LegalDocumentMeta> = {
  platform_impressum: {
    type: "platform_impressum",
    title: "Plattform-Impressum",
    scope: "platform",
    description: "Anbieterkennzeichnung gemäß § 5 DDG des Plattformbetreibers GateMate.",
  },
  platform_privacy: {
    type: "platform_privacy",
    title: "Plattform-Datenschutzerklärung",
    scope: "platform",
    description: "Datenschutzinformationen der Plattform GateMate für Kunden und Veranstalter.",
  },
  platform_terms: {
    type: "platform_terms",
    title: "Plattform-Nutzungsbedingungen",
    scope: "platform",
    description: "Nutzungsbedingungen der SaaS-Plattform GateMate.",
  },
  organizer_impressum: {
    type: "organizer_impressum",
    title: "Veranstalter-Impressum",
    scope: "organizer",
    description: "Anbieterkennzeichnung des jeweiligen Veranstalters als Vertragspartner des Ticketkäufers.",
  },
  organizer_privacy: {
    type: "organizer_privacy",
    title: "Veranstalter-Datenschutzerklärung",
    scope: "organizer",
    description: "Datenschutzhinweise des Veranstalters bezüglich Ticketkauf und Teilnahme.",
  },
  organizer_agb: {
    type: "organizer_agb",
    title: "Veranstalter-AGB",
    scope: "organizer",
    description: "Allgemeine Geschäftsbedingungen des Veranstalters für Ticketverkäufe.",
  },
  event_terms: {
    type: "event_terms",
    title: "Teilnahmebedingungen",
    scope: "organizer",
    description: "Besondere Bedingungen für die Teilnahme an der konkreten Veranstaltung.",
  },
  ticket_terms: {
    type: "ticket_terms",
    title: "Ticketbedingungen",
    scope: "organizer",
    description: "Nutzungs- und Übertragungsbestimmungen für Tickets (z.B. Personalisierung).",
  },
  refund_policy: {
    type: "refund_policy",
    title: "Erstattungsbedingungen",
    scope: "organizer",
    description: "Regelungen zu Stornierungen, Erstattungen und Ausfall von Events.",
  },
  revocation_notice: {
    type: "revocation_notice",
    title: "Widerrufsinformationen",
    scope: "organizer",
    description: "Informationen zum gesetzlichen Widerrufsrecht bzw. dessen Ausschluss.",
  },
};

export interface LegalComplianceResult {
  isCompliant: boolean;
  missingFields: string[];
  statusText: string;
}

export const STATUTORY_WITHDRAWAL_NOTICE =
  "Hinweis zum Widerrufsrecht: Bei Dienstleistungen im Zusammenhang mit Freizeitbetätigungen zu einem spezifischen Termin besteht kein Widerrufsrecht (§ 312g Abs. 2 Nr. 9 BGB).";

export const GATEMATE_PLATFORM_DISCLAIMER =
  "GateMate agiert ausschließlich als technischer Dienstleister und Vermittler im Auftrag des Veranstalters.";

export const GATEMATE_PLATFORM_DISCLAIMER_EXTENDED =
  "GateMate ist reine technische Infrastruktur und Vermittler. Der Kaufvertrag über Ticket und Event-Teilnahme kommt ausschließlich direkt zwischen dem Ticketkäufer und dem jeweiligen Veranstalter zustande.";

export function getOrganizerSellerLabel(organizer?: OrganizerLegalProfile | null): string {
  return organizer?.legalName || organizer?.name || "Veranstalter";
}

export function checkOrganizerLegalCompliance(organizer?: OrganizerLegalProfile | null): LegalComplianceResult {
  if (!organizer) {
    return {
      isCompliant: false,
      missingFields: ["Veranstalter-Stammdaten (Impressum & Adresse)"],
      statusText: "Rechtliche Pflichtangaben fehlen vollständig.",
    };
  }

  const missingFields: string[] = [];

  if (!organizer.legalName || !organizer.legalName.trim()) {
    missingFields.push("Firmenname / Rechtlicher Name");
  }
  if (!organizer.legalForm || !organizer.legalForm.trim()) {
    missingFields.push("Rechtsform");
  }
  if (!organizer.responsiblePerson || !organizer.responsiblePerson.trim()) {
    missingFields.push("Verantwortliche Kontaktperson (Vertreten durch)");
  }
  if (!organizer.street || !organizer.street.trim()) {
    missingFields.push("Strasse & Hausnummer");
  }
  if (!organizer.zip || !organizer.zip.trim()) {
    missingFields.push("Postleitzahl");
  }
  if (!organizer.city || !organizer.city.trim()) {
    missingFields.push("Ort / Stadt");
  }

  const mode = organizer.legalMode || "custom_text";

  const hasImpressum =
    mode === "url"
      ? Boolean(organizer.impressumUrl && organizer.impressumUrl.trim())
      : Boolean(organizer.impressumContent && organizer.impressumContent.trim()) ||
        Boolean(organizer.impressumUrl && organizer.impressumUrl.trim());

  if (!hasImpressum) {
    missingFields.push("Impressum (URL oder Text)");
  }

  const hasPrivacy =
    mode === "url"
      ? Boolean(organizer.privacyUrl && organizer.privacyUrl.trim())
      : Boolean(organizer.privacyContent && organizer.privacyContent.trim()) ||
        Boolean(organizer.privacyUrl && organizer.privacyUrl.trim());

  if (!hasPrivacy) {
    missingFields.push("Datenschutzerklärung (URL oder Text)");
  }

  const hasTerms =
    mode === "url"
      ? Boolean(organizer.termsUrl && organizer.termsUrl.trim())
      : Boolean(organizer.termsContent && organizer.termsContent.trim()) ||
        Boolean(organizer.termsUrl && organizer.termsUrl.trim());

  if (!hasTerms) {
    missingFields.push("Allgemeine Geschäftsbedingungen (AGB)");
  }

  const hasCancellationPolicy = Boolean(organizer.cancellationPolicyContent && organizer.cancellationPolicyContent.trim());
  if (!hasCancellationPolicy) {
    missingFields.push("Stornierungs-/Erstattungsbedingungen");
  }

  const isCompliant = missingFields.length === 0;

  return {
    isCompliant,
    missingFields,
    statusText: isCompliant
      ? "Rechtlich konform (Alle Angaben vollständig)"
      : `Unvollständig (${missingFields.join(", ")})`,
  };
}

export function formatLegalAddress(organizer?: OrganizerLegalProfile | null): string {
  if (!organizer) return "Veranstalteradresse nicht hinterlegt";
  const parts = [
    organizer.legalName,
    organizer.responsiblePerson ? `Vertreten durch: ${organizer.responsiblePerson}` : null,
    organizer.street,
    [organizer.zip, organizer.city].filter(Boolean).join(" "),
    organizer.country || "Deutschland",
  ].filter((p) => p && p.trim());

  return parts.length > 0 ? parts.join(", ") : "Veranstalteradresse nicht hinterlegt";
}

export function formatTaxDisclosure(isSmallBusiness?: boolean | null): string {
  if (isSmallBusiness) {
    return "Gemäß § 19 UStG wird keine Umsatzsteuer berechnet";
  }
  return "inkl. 19% MwSt.";
}

