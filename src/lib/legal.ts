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

export interface LegalComplianceResult {
  isCompliant: boolean;
  missingFields: string[];
  statusText: string;
}

export const STATUTORY_WITHDRAWAL_NOTICE =
  "Hinweis zum Widerrufsrecht: Bei Dienstleistungen im Zusammenhang mit Freizeitbetätigungen zu einem spezifischen Termin besteht kein Widerrufsrecht (§ 312g Abs. 2 Nr. 9 BGB).";

export const GATEMATE_PLATFORM_DISCLAIMER =
  "GateMate agiert ausschließlich als technischer Dienstleister und Vermittler.";

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
