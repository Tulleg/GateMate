"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/dashboard/sidebar";
import {
  Scale,
  Building2,
  FileText,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Save,
  Globe,
  Loader2,
  Info,
  ExternalLink,
  BookOpen,
} from "lucide-react";
import Link from "next/link";
import { checkOrganizerLegalCompliance, LegalComplianceResult } from "@/lib/legal";

export default function OrganizerLegalSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form State
  const [legalName, setLegalName] = useState("");
  const [legalForm, setLegalForm] = useState("");
  const [responsiblePerson, setResponsiblePerson] = useState("");
  const [registrationCouncil, setRegistrationCouncil] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [street, setStreet] = useState("");
  const [zip, setZip] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("Deutschland");
  const [vatId, setVatId] = useState("");
  const [isSmallBusiness, setIsSmallBusiness] = useState(false);
  const [legalMode, setLegalMode] = useState<"url" | "custom_text">("custom_text");

  // Document Modes & Content
  const [impressumType, setImpressumType] = useState<"url" | "text">("text");
  const [impressumUrl, setImpressumUrl] = useState("");
  const [impressumContent, setImpressumContent] = useState("");

  const [privacyType, setPrivacyType] = useState<"url" | "text">("text");
  const [privacyUrl, setPrivacyUrl] = useState("");
  const [privacyContent, setPrivacyContent] = useState("");

  const [termsType, setTermsType] = useState<"url" | "text">("text");
  const [termsUrl, setTermsUrl] = useState("");
  const [termsContent, setTermsContent] = useState("");

  const [cancellationPolicyContent, setCancellationPolicyContent] = useState("");
  const [eventTermsContent, setEventTermsContent] = useState("");
  const [revocationNoticeCustom, setRevocationNoticeCustom] = useState("");
  const [organizerSlug, setOrganizerSlug] = useState("organizer");

  const [compliance, setCompliance] = useState<LegalComplianceResult>({
    isCompliant: false,
    missingFields: [],
    statusText: "Lade Compliance Status...",
  });

  useEffect(() => {
    fetchLegalProfile();
  }, []);

  const fetchLegalProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/organizer/legal`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Fehler beim Laden des Rechtsprofils");

      const org = data.organizer || {};
      setLegalName(org.legalName || "");
      setLegalForm(org.legalForm || "");
      setResponsiblePerson(org.responsiblePerson || "");
      setRegistrationCouncil(org.registrationCouncil || "");
      setRegistrationNumber(org.registrationNumber || "");
      setPhone(org.phone || "");
      setStreet(org.street || "");
      setZip(org.zip || "");
      setCity(org.city || "");
      setCountry(org.country || "Deutschland");
      setVatId(org.vatId || "");
      setIsSmallBusiness(Boolean(org.isSmallBusiness));
      setLegalMode(org.legalMode || "custom_text");

      setImpressumUrl(org.impressumUrl || "");
      setImpressumContent(org.impressumContent || "");
      setImpressumType(org.impressumUrl ? "url" : "text");

      setPrivacyUrl(org.privacyUrl || "");
      setPrivacyContent(org.privacyContent || "");
      setPrivacyType(org.privacyUrl ? "url" : "text");

      setTermsUrl(org.termsUrl || "");
      setTermsContent(org.termsContent || "");
      setTermsType(org.termsUrl ? "url" : "text");

      setCancellationPolicyContent(org.cancellationPolicyContent || "");
      setEventTermsContent(org.eventTermsContent || "");
      setRevocationNoticeCustom(org.revocationNoticeCustom || "");
      if (org.organizerSlug) setOrganizerSlug(org.organizerSlug);

      if (data.compliance) {
        setCompliance(data.compliance);
      } else {
        setCompliance(checkOrganizerLegalCompliance(org));
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        legalName,
        legalForm,
        responsiblePerson,
        registrationCouncil,
        registrationNumber,
        phone,
        street,
        zip,
        city,
        country,
        vatId,
        isSmallBusiness,
        legalMode,
        impressumUrl: impressumType === "url" ? impressumUrl : "",
        impressumContent: impressumType === "text" ? impressumContent : "",
        privacyUrl: privacyType === "url" ? privacyUrl : "",
        privacyContent: privacyType === "text" ? privacyContent : "",
        termsUrl: termsType === "url" ? termsUrl : "",
        termsContent: termsType === "text" ? termsContent : "",
        cancellationPolicyContent,
        eventTermsContent,
        revocationNoticeCustom,
      };

      const res = await fetch("/api/organizer/legal", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Fehler beim Speichern");

      setSuccess("Rechtliche Einstellungen erfolgreich gespeichert!");
      if (data.compliance) {
        setCompliance(data.compliance);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-950 text-slate-50">
        <Sidebar />
        <main className="flex-1 p-8 flex items-center justify-center">
          <div className="flex items-center gap-3 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
            <span>Lade Rechtliche Einstellungen...</span>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-50">
      <Sidebar />

      <main className="flex-1 p-8 space-y-8 overflow-y-auto max-w-5xl">
        {/* Header Bar */}
        <div className="border-b border-slate-800/80 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              Rechtliche Profil-Einstellungen <Scale className="w-6 h-6 text-indigo-400" />
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Veranstalter-Stammdaten, Impressum, Datenschutz & § 312j BGB Konformität für Ticket-Verkäufe.
            </p>
          </div>

          {/* Compliance Status Badge */}
          <div
            className={`px-4 py-2.5 rounded-2xl border text-xs font-bold flex items-center gap-2.5 shrink-0 ${
              compliance.isCompliant
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                : "bg-amber-500/10 text-amber-400 border-amber-500/30"
            }`}
          >
            {compliance.isCompliant ? (
              <>
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <div>
                  <p className="font-extrabold">Rechtlich konform</p>
                  <p className="text-[10px] text-emerald-400/80 font-normal">Event-Veröffentlichung freigeschaltet</p>
                </div>
              </>
            ) : (
              <>
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <div>
                  <p className="font-extrabold">Rechtlich unvollständig</p>
                  <p className="text-[10px] text-amber-400/80 font-normal">
                    {compliance.missingFields.length} Angabe(n) fehlen
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Warning Banner if incomplete */}
        {!compliance.isCompliant && (
          <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-800/50 text-amber-300 text-xs space-y-1.5 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm">Veröffentlichungsschutz aktiv (Publication Guard)</p>
              <p className="text-amber-300/80">
                Sie können keine Events auf <span className="font-mono">is_published = true</span> schalten, bevor die folgenden Angaben vervollständigt sind:
              </p>
              <ul className="list-disc list-inside mt-1 font-semibold text-amber-200">
                {compliance.missingFields.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-8">
          {/* Section 1: Master Data */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Veranstalter Stammdaten (Vertragspartner)</h2>
                <p className="text-xs text-slate-400">
                  Diese Adresse wird Käufern im Checkout und auf PDF-Tickets als rechtlicher Aussteller angezeigt.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5 md:col-span-2">
                <label className="font-semibold text-slate-300 block">
                  Firmenname / Rechtlicher Name der Einzelperson *
                </label>
                <input
                  type="text"
                  required
                  placeholder="z.B. Demo Events GmbH oder Max Mustermann Veranstaltungsservice"
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300 block">Rechtsform (DSA Art. 30 KYTC) *</label>
                <input
                  type="text"
                  required
                  placeholder="z.B. GmbH, UG (haftungsbeschränkt), Einzelunternehmen, e.V."
                  value={legalForm}
                  onChange={(e) => setLegalForm(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300 block">Verantwortliche Kontaktperson (Vertreten durch / Inhaber) *</label>
                <input
                  type="text"
                  required
                  placeholder="z.B. Erika Mustermann (Geschäftsführerin / Inhaberin)"
                  value={responsiblePerson}
                  onChange={(e) => setResponsiblePerson(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300 block">Telefonnummer für Rückfragen</label>
                <input
                  type="text"
                  placeholder="z.B. +49 30 12345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300 block">Handelsregister / Amtsgericht (falls eintr.)</label>
                <input
                  type="text"
                  placeholder="z.B. Amtsgericht Berlin-Charlottenburg"
                  value={registrationCouncil}
                  onChange={(e) => setRegistrationCouncil(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300 block">Registernummer (HRB / HRA / VR)</label>
                <input
                  type="text"
                  placeholder="z.B. HRB 123456 B"
                  value={registrationNumber}
                  onChange={(e) => setRegistrationNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="font-semibold text-slate-300 block">Straße &amp; Hausnummer *</label>
                <input
                  type="text"
                  required
                  placeholder="z.B. Friedrichstraße 100"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300 block">Postleitzahl (PLZ) *</label>
                <input
                  type="text"
                  required
                  placeholder="z.B. 10117"
                  value={zip}
                  onChange={(e) => setZip(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300 block">Stadt / Ort *</label>
                <input
                  type="text"
                  required
                  placeholder="z.B. Berlin"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300 block">Land</label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300 block">USt-IdNr. / Umsatzsteuer-ID (optional)</label>
                <input
                  type="text"
                  placeholder="z.B. DE123456789"
                  value={vatId}
                  onChange={(e) => setVatId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>
            </div>

            {/* Kleinunternehmer § 19 UStG Checkbox */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-start gap-3">
              <input
                type="checkbox"
                id="isSmallBusiness"
                checked={isSmallBusiness}
                onChange={(e) => setIsSmallBusiness(e.target.checked)}
                className="mt-1 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-900 border-slate-700"
              />
              <label htmlFor="isSmallBusiness" className="text-xs cursor-pointer space-y-0.5">
                <span className="font-bold text-white block">
                  Kleinunternehmerregelung gemäß § 19 UStG anwenden
                </span>
                <span className="text-slate-400 block">
                  Wenn aktiviert, wird im Checkout und auf PDF-Rechnungen der Vermerk &quot;Gemäß § 19 UStG wird keine Umsatzsteuer berechnet&quot; angezeigt.
                </span>
              </label>
            </div>
          </div>

          {/* Section 2: Legal Documents Manager (Impressum, Datenschutz, AGB) */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Rechtliche Dokumente (Impressum, Datenschutz, AGB)</h2>
                <p className="text-xs text-slate-400">
                  Verlinken Sie Ihre eigene Website oder hosten Sie die Texte direkt auf GateMate unter <span className="font-mono text-indigo-400">/o/{organizerSlug}/...</span>
                </p>
              </div>
            </div>

            {/* Global Legal Page Quick Links preview */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-wrap items-center gap-3 text-xs">
              <span className="font-bold text-slate-300">Öffentliche Links:</span>
              <Link
                href={`/o/${organizerSlug}/impressum`}
                target="_blank"
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-indigo-400 hover:text-white flex items-center gap-1 font-mono text-[11px]"
              >
                /o/{organizerSlug}/impressum <ExternalLink className="w-3 h-3" />
              </Link>
              <Link
                href={`/o/${organizerSlug}/datenschutz`}
                target="_blank"
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-indigo-400 hover:text-white flex items-center gap-1 font-mono text-[11px]"
              >
                /o/{organizerSlug}/datenschutz <ExternalLink className="w-3 h-3" />
              </Link>
              <Link
                href={`/o/${organizerSlug}/agb`}
                target="_blank"
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-indigo-400 hover:text-white flex items-center gap-1 font-mono text-[11px]"
              >
                /o/{organizerSlug}/agb <ExternalLink className="w-3 h-3" />
              </Link>
            </div>

            {/* Document 1: Impressum */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-400" /> Impressum *
                </h3>
                <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
                  <button
                    type="button"
                    onClick={() => setImpressumType("text")}
                    className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                      impressumType === "text" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Auf GateMate hosten
                  </button>
                  <button
                    type="button"
                    onClick={() => setImpressumType("url")}
                    className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                      impressumType === "url" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Link zur Website
                  </button>
                </div>
              </div>

              {impressumType === "url" ? (
                <div className="space-y-1.5 text-xs">
                  <label className="font-semibold text-slate-300">Impressum URL auf Ihrer Website</label>
                  <input
                    type="url"
                    placeholder="https://ihre-website.de/impressum"
                    value={impressumUrl}
                    onChange={(e) => setImpressumUrl(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
              ) : (
                <div className="space-y-1.5 text-xs">
                  <label className="font-semibold text-slate-300">Impressum Inhalt (Markdown / Text)</label>
                  <textarea
                    rows={5}
                    placeholder="Angaben gemäß § 5 TMG..."
                    value={impressumContent}
                    onChange={(e) => setImpressumContent(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
                  />
                </div>
              )}
            </div>

            {/* Document 2: Datenschutz */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> Datenschutzerklärung *
                </h3>
                <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
                  <button
                    type="button"
                    onClick={() => setPrivacyType("text")}
                    className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                      privacyType === "text" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Auf GateMate hosten
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrivacyType("url")}
                    className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                      privacyType === "url" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Link zur Website
                  </button>
                </div>
              </div>

              {privacyType === "url" ? (
                <div className="space-y-1.5 text-xs">
                  <label className="font-semibold text-slate-300">Datenschutz URL auf Ihrer Website</label>
                  <input
                    type="url"
                    placeholder="https://ihre-website.de/datenschutz"
                    value={privacyUrl}
                    onChange={(e) => setPrivacyUrl(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
              ) : (
                <div className="space-y-1.5 text-xs">
                  <label className="font-semibold text-slate-300">Datenschutzerklärung Inhalt (Markdown / Text)</label>
                  <textarea
                    rows={5}
                    placeholder="Informationen zur Verarbeitung personenbezogener Daten..."
                    value={privacyContent}
                    onChange={(e) => setPrivacyContent(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
                  />
                </div>
              )}
            </div>

            {/* Document 3: AGB */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-purple-400" /> Allgemeine Geschäftsbedingungen (AGB)
                </h3>
                <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
                  <button
                    type="button"
                    onClick={() => setTermsType("text")}
                    className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                      termsType === "text" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Auf GateMate hosten
                  </button>
                  <button
                    type="button"
                    onClick={() => setTermsType("url")}
                    className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                      termsType === "url" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Link zur Website
                  </button>
                </div>
              </div>

              {termsType === "url" ? (
                <div className="space-y-1.5 text-xs">
                  <label className="font-semibold text-slate-300">AGB URL auf Ihrer Website</label>
                  <input
                    type="url"
                    placeholder="https://ihre-website.de/agb"
                    value={termsUrl}
                    onChange={(e) => setTermsUrl(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
              ) : (
                <div className="space-y-1.5 text-xs">
                  <label className="font-semibold text-slate-300">AGB Inhalt (Markdown / Text)</label>
                  <textarea
                    rows={5}
                    placeholder="Allgemeine Geschäftsbedingungen für den Ticketkauf..."
                    value={termsContent}
                    onChange={(e) => setTermsContent(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
                  />
                </div>
              )}
            </div>

            {/* Document 4: Stornierungs-/Erstattungsbedingungen */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" /> Stornierungs- &amp; Erstattungsbedingungen *
              </h3>
              <p className="text-[11px] text-slate-400">
                Informieren Sie Käufer darüber, ob und unter welchen Bedingungen Tickets umgetauscht, storniert oder übertragen werden können.
              </p>
              <textarea
                rows={3}
                required
                placeholder="z.B. Tickets sind grundsätzlich von der Rückgabe ausgeschlossen, es sei denn, das Event wird abgesagt..."
                value={cancellationPolicyContent}
                onChange={(e) => setCancellationPolicyContent(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
              />
            </div>

            {/* Document 5: Allgemeine Teilnahmebedingungen */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <label className="font-semibold text-xs text-white block flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" /> Allgemeine Teilnahmebedingungen des Veranstalters (optional)
              </label>
              <p className="text-[11px] text-slate-400">
                Standard-Teilnahmebedingungen für alle Ihre Events (z.B. Verhalten vor Ort, Haftungsausschluss, Bildrechte).
              </p>
              <textarea
                rows={3}
                placeholder="Optionaler Text für allgemeine Teilnahme- &amp; Verhaltensregeln..."
                value={eventTermsContent}
                onChange={(e) => setEventTermsContent(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
              />
            </div>

            {/* Custom Revocation Notice */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <label className="font-semibold text-xs text-slate-300 block">
                Zusätzlicher / Spezifischer Widerrufsbelehrungs-Hinweis (optional)
              </label>
              <p className="text-[11px] text-slate-400">
                Standardmäßig wird im Checkout der gesetzliche Hinweis gemäß § 312g Abs. 2 Nr. 9 BGB angezeigt (&quot;Kein Widerrufsrecht bei datierten Freizeitveranstaltungen&quot;).
              </p>
              <textarea
                rows={2}
                placeholder="Optionaler individueller Zusatz-Hinweis zur Stornierung..."
                value={revocationNoticeCustom}
                onChange={(e) => setRevocationNoticeCustom(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-xl shadow-indigo-600/30"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Speichere...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Rechtliche Angaben Speichern
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
