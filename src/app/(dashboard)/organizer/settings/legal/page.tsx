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
  Loader2,
  ExternalLink,
  BookOpen,
  History,
  Layers,
  Sparkles,
  Plus,
  Lock,
  Eye,
} from "lucide-react";
import Link from "next/link";
import {
  checkOrganizerLegalCompliance,
  LegalComplianceResult,
  LEGAL_DOCUMENT_METADATA,
  LEGAL_MODULES,
  EVENT_TYPES,
  LegalDocumentType,
  EventTypeKey,
} from "@/lib/legal";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";

export default function OrganizerLegalSettingsPage() {
  const [activeTab, setActiveTab] = useState<"profile" | "documents" | "modules">("profile");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form State - Master Data
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

  // Document Content & Versions
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

  // Legal Documents Table List & Version History
  const [dbDocuments, setDbDocuments] = useState<any[]>([]);
  const [historyModalDoc, setHistoryModalDoc] = useState<any | null>(null);
  const [docHistory, setDocHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Event Types & Modules Settings
  const [selectedEventType, setSelectedEventType] = useState<EventTypeKey>("concert");
  const [enabledModules, setEnabledModules] = useState<string[]>([
    "statutory_revocation_exemption",
    "house_rules_and_safety",
  ]);

  const [compliance, setCompliance] = useState<LegalComplianceResult>({
    isCompliant: false,
    missingFields: [],
    statusText: "Lade Compliance Status...",
  });

  useEffect(() => {
    fetchLegalProfile();
    fetchDocumentsList();
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

  const fetchDocumentsList = async () => {
    try {
      const res = await fetch(`/api/legal/documents`);
      const data = await res.json();
      if (res.ok && data.documents) {
        setDbDocuments(data.documents);
      }
    } catch (e) {
      console.error("Failed to load documents list", e);
    }
  };

  const openHistoryModal = async (doc: any) => {
    setHistoryModalDoc(doc);
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/legal/documents/${doc.id}`);
      const data = await res.json();
      if (res.ok && data.history) {
        setDocHistory(data.history);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setHistoryLoading(false);
    }
  };

  const toggleModule = (moduleKey: string) => {
    if (enabledModules.includes(moduleKey)) {
      setEnabledModules(enabledModules.filter((m) => m !== moduleKey));
    } else {
      setEnabledModules([...enabledModules, moduleKey]);
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

      // Publish new document versions for organizer documents
      await publishDocHelper("organizer_impressum", "Veranstalter-Impressum", impressumContent, impressumUrl);
      await publishDocHelper("organizer_privacy", "Veranstalter-Datenschutzerklärung", privacyContent, privacyUrl);
      await publishDocHelper("organizer_agb", "Veranstalter-AGB", termsContent, termsUrl);
      await publishDocHelper("refund_policy", "Erstattungsbedingungen", cancellationPolicyContent);
      await publishDocHelper("event_terms", "Teilnahmebedingungen", eventTermsContent);
      await publishDocHelper("revocation_notice", "Widerrufsinformationen", revocationNoticeCustom);

      setSuccess("Rechtliche Einstellungen und Dokument-Versionen erfolgreich gespeichert!");
      if (data.compliance) {
        setCompliance(data.compliance);
      }
      fetchDocumentsList();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const publishDocHelper = async (documentType: LegalDocumentType, title: string, content?: string, url?: string) => {
    if ((!content || !content.trim()) && (!url || !url.trim())) return;
    try {
      await fetch("/api/legal/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentType,
          title,
          content,
          url,
          eventType: selectedEventType,
          applicableModules: enabledModules,
          status: "published",
        }),
      });
    } catch (e) {
      console.error("Failed to publish document helper", e);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col md:flex-row min-h-dvh md:h-dvh md:overflow-hidden bg-slate-950 text-slate-50">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 flex items-center justify-center min-w-0 md:h-full">
          <div className="flex items-center gap-3 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
            <span>Lade Rechtliche Einstellungen...</span>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row min-h-dvh md:h-dvh md:overflow-hidden bg-slate-950 text-slate-50">
      <Sidebar />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-8 overflow-y-auto max-w-[1400px] min-w-0 md:h-full">
        {/* Header Bar */}
        <div className="border-b border-slate-800/80 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              Rechtliche Profil- &amp; Dokumenten-Verwaltung <Scale className="w-6 h-6 text-indigo-400" />
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Veranstalter-Stammdaten, getrennte Plattform- &amp; Veranstalter-Dokumente, Versionierung und Event-Typ Module.
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

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 gap-2">
          <button
            onClick={() => setActiveTab("profile")}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-colors flex items-center gap-2 border-b-2 ${
              activeTab === "profile"
                ? "border-indigo-500 text-indigo-400 bg-slate-900/60"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Building2 className="w-4 h-4" /> Stammdaten &amp; Aussteller-Profil
          </button>
          <button
            onClick={() => setActiveTab("documents")}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-colors flex items-center gap-2 border-b-2 ${
              activeTab === "documents"
                ? "border-indigo-500 text-indigo-400 bg-slate-900/60"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <FileText className="w-4 h-4" /> Rechtstexte &amp; Versionen ({dbDocuments.length})
          </button>
          <button
            onClick={() => setActiveTab("modules")}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-colors flex items-center gap-2 border-b-2 ${
              activeTab === "modules"
                ? "border-indigo-500 text-indigo-400 bg-slate-900/60"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Layers className="w-4 h-4" /> Event-Typen &amp; Rechtsmodule
          </button>
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
          {/* TAB 1: PROFILE & MASTER DATA */}
          {activeTab === "profile" && (
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

              {/* AVV Agreement Status Card */}
              <div className="p-5 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-white flex items-center gap-2">
                    <ShieldCheck className="w-4.5 h-4.5 text-indigo-400" />
                    Vertrag zur Auftragsverarbeitung (AVV gem. Art. 28 DSGVO)
                  </h3>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Vertrag Aktiv
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Mit der Registrierung auf GateMate und der Akzeptanz der Plattform-AGB wurde der Vertrag zur Auftragsverarbeitung (AVV gemäß Art. 28 Abs. 3 DSGVO) zwischen Ihnen als Verantwortlichem und GateMate als Auftragsverarbeiter elektronisch wirksam geschlossen.
                </p>
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
                  <label className="font-semibold text-slate-300 block">Verantwortliche Kontaktperson (Vertreten durch) *</label>
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
          )}

          {/* TAB 2: VERANSTALTERDOKUMENTE & VERSIONEN */}
          {activeTab === "documents" && (
            <div className="space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white">Veranstalter-Rechtstexte (Impressum, Datenschutz, AGB)</h2>
                      <p className="text-xs text-slate-400">
                        Jedes Speichern erzeugt eine neue versionierte Fassung mit SHA-256 Hash.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Document 1: Impressum */}
                <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-white flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-indigo-400" /> Veranstalter-Impressum *
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
                        rows={4}
                        placeholder="Angaben gemäß § 5 DDG..."
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
                      <ShieldCheck className="w-4 h-4 text-emerald-400" /> Veranstalter-Datenschutzerklärung *
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
                        rows={4}
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
                      <FileText className="w-4 h-4 text-purple-400" /> Veranstalter-AGB *
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
                        rows={4}
                        placeholder="Allgemeine Geschäftsbedingungen für den Ticketkauf..."
                        value={termsContent}
                        onChange={(e) => setTermsContent(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
                      />
                    </div>
                  )}
                </div>

                {/* Document 4: Erstattungsbedingungen */}
                <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <h3 className="font-bold text-sm text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-amber-400" /> Erstattungsbedingungen *
                  </h3>
                  <textarea
                    rows={3}
                    placeholder="Tickets sind grundsätzlich von der Rückgabe ausgeschlossen..."
                    value={cancellationPolicyContent}
                    onChange={(e) => setCancellationPolicyContent(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
                  />
                </div>

                {/* Document 5: Teilnahmebedingungen */}
                <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <h3 className="font-bold text-sm text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-cyan-400" /> Teilnahmebedingungen
                  </h3>
                  <textarea
                    rows={3}
                    placeholder="Besondere Hinweise für die Teilnahme..."
                    value={eventTermsContent}
                    onChange={(e) => setEventTermsContent(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
                  />
                </div>
              </div>

              {/* Version History Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <History className="w-5 h-5 text-indigo-400" /> Publizierte Dokument-Versionen
                </h3>
                {dbDocuments.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">Noch keine versionierten Dokumente in der Datenbank gespeichert.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400">
                          <th className="py-2.5 px-3">Dokumenttyp</th>
                          <th className="py-2.5 px-3">Titel</th>
                          <th className="py-2.5 px-3">Version</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3">SHA-256 Hash</th>
                          <th className="py-2.5 px-3 text-right">Historie</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {dbDocuments.map((doc) => (
                          <tr key={doc.id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="py-2.5 px-3 font-mono text-[11px] text-indigo-400">{doc.documentType}</td>
                            <td className="py-2.5 px-3 font-semibold text-white">{doc.title}</td>
                            <td className="py-2.5 px-3 font-mono">v{doc.version}</td>
                            <td className="py-2.5 px-3">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                {doc.status}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-mono text-[10px] text-slate-400 truncate max-w-[150px]">
                              {doc.hash}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <button
                                type="button"
                                onClick={() => openHistoryModal(doc)}
                                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold flex items-center gap-1 ml-auto"
                              >
                                <Eye className="w-3 h-3 text-indigo-400" /> Versionen
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: EVENT TYPES & MODULES */}
          {activeTab === "modules" && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-8">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-400" /> Event-Kategorien &amp; Optionale Rechtsmodule
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Die Plattform behauptet nicht automatisch pauschale Pflichten, wenn diese vom konkreten Veranstaltungstyp abhängen. Wählen Sie die passenden Bausteine.
                </p>
              </div>

              {/* Event Category Selector */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-300 block">Veranstaltungstyp wählen</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {Object.values(EVENT_TYPES).map((et) => {
                    const isSelected = selectedEventType === et.key;
                    return (
                      <div
                        key={et.key}
                        onClick={() => {
                          setSelectedEventType(et.key);
                          // Auto apply recommended modules
                          const newMods = Array.from(new Set([...enabledModules, ...et.recommendedModules]));
                          setEnabledModules(newMods);
                        }}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                          isSelected
                            ? "bg-indigo-600/10 border-indigo-500 text-white"
                            : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                        }`}
                      >
                        <p className="font-bold text-sm text-white">{et.label}</p>
                        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{et.description}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Modules Toggles */}
              <div className="space-y-4 border-t border-slate-800 pt-6">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" /> Aktivierte Rechtsbausteine (Module) für {EVENT_TYPES[selectedEventType]?.label}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.values(LEGAL_MODULES).map((mod) => {
                    const isChecked = enabledModules.includes(mod.key);
                    return (
                      <div
                        key={mod.key}
                        onClick={() => toggleModule(mod.key)}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                          isChecked
                            ? "bg-slate-950 border-indigo-500/80 shadow-md"
                            : "bg-slate-950/50 border-slate-800/80 opacity-70 hover:opacity-100"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="mt-1 w-4 h-4 text-indigo-600 rounded border-slate-700 bg-slate-900 focus:ring-indigo-500"
                        />
                        <div className="space-y-1">
                          <p className="font-bold text-xs text-white">{mod.label}</p>
                          <p className="text-[11px] text-slate-400">{mod.description}</p>
                          <p className="text-[10px] text-indigo-300/80 italic border-l-2 border-indigo-500/40 pl-2 mt-1">
                            &quot;{mod.defaultText}&quot;
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-xl shadow-indigo-600/30"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Speichere &amp; Publizierte Versionen...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Rechtliche Angaben &amp; Versionen Speichern
                </>
              )}
            </button>
          </div>
        </form>

        {/* History Modal */}
        {historyModalDoc && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 space-y-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h3 className="font-bold text-lg text-white">Versionshistorie: {historyModalDoc.title}</h3>
                  <p className="text-xs text-indigo-400 font-mono">{historyModalDoc.documentType}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setHistoryModalDoc(null)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Schließen
                </button>
              </div>

              {historyLoading ? (
                <div className="py-8 flex justify-center text-slate-400 text-xs gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-400" /> Lade Historie...
                </div>
              ) : (
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                  {docHistory.map((h) => (
                    <div key={h.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">Version {h.version}</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(h.createdAt).toLocaleString("de-DE")}
                        </span>
                      </div>
                      <p className="font-mono text-[10px] text-slate-400 break-all bg-slate-900 p-2 rounded-lg border border-slate-800">
                        SHA-256 Hash: {h.hash}
                      </p>
                      {h.content && (
                        <div className="p-3 rounded-xl bg-slate-900/60 text-slate-300 text-[11px] max-h-32 overflow-y-auto">
                          <MarkdownRenderer content={h.content} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
