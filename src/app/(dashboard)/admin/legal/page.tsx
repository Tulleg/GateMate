"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Sidebar } from "@/components/dashboard/sidebar";
import {
  Scale,
  Building2,
  FileText,
  ShieldCheck,
  Save,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  History,
  Lock,
  Shield,
  Users,
} from "lucide-react";
import { LEGAL_DOCUMENT_METADATA } from "@/lib/legal";

export default function PlatformLegalAdminPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Platform Documents State
  const [impressumContent, setImpressumContent] = useState("");
  const [privacyContent, setPrivacyContent] = useState("");
  const [termsContent, setTermsContent] = useState("");
  const [avvContent, setAvvContent] = useState("");

  const [documents, setDocuments] = useState<any[]>([]);

  useEffect(() => {
    fetchPlatformDocs();
  }, []);

  const fetchPlatformDocs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/legal/documents?scope=platform`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Fehler beim Laden der Plattform-Rechtstexte");

      const docs = data.documents || [];
      setDocuments(docs);

      const imp = docs.find((d: any) => d.documentType === "platform_impressum");
      const priv = docs.find((d: any) => d.documentType === "platform_privacy");
      const trm = docs.find((d: any) => d.documentType === "platform_terms");
      const avv = docs.find((d: any) => d.documentType === "platform_avv");

      if (imp) setImpressumContent(imp.content || "");
      if (priv) setPrivacyContent(priv.content || "");
      if (trm) setTermsContent(trm.content || "");
      if (avv) {
        setAvvContent(avv.content || "");
      } else {
        setAvvContent(
          "Vertrag zur Auftragsverarbeitung (AVV) gemäß Art. 28 DSGVO\n\n1. Gegenstand & Dauer der Verarbeitung\nGateMate (Auftragsverarbeiter) verarbeitet im Auftrag des Veranstalters (Verantwortlicher) personenbezogene Daten der Ticketkäufer (Namen, E-Mail, Bestell- und Ticketdaten) ausschließlich zum Zweck der Bereitstellung der SaaS-Ticketingplattform, der Ticketausstellung und der Einlasskontrolle.\n\n2. Pflichten von GateMate\n- Datenverarbeitung erfolgt ausschließlich nach Weisung des Veranstalters.\n- Alle Mitarbeiter sind zur Vertraulichkeit verpflichtet.\n- Technische und organisatorische Maßnahmen (TOMs) werden auf dem aktuellen Stand der Technik aufrechterhalten.\n- Unterstützung des Veranstalters bei Betroffenenrechten (Art. 15-22 DSGVO).\n\n3. Technische & Organisatorische Maßnahmen (TOMs)\n- Verschlüsselung der Datenübertragung (TLS 1.3 / HTTPS).\n- Zugriffsbeschränkungen & Rollenkonzept (RBAC).\n- Tägliche Backups & Zugriffsprotokollierung."
        );
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
      // Publish platform docs
      await savePlatformDoc("platform_impressum", "Plattform-Impressum", impressumContent);
      await savePlatformDoc("platform_privacy", "Plattform-Datenschutzerklärung", privacyContent);
      await savePlatformDoc("platform_terms", "Plattform-Nutzungsbedingungen", termsContent);
      await savePlatformDoc("platform_avv", "Plattform-AVV (Auftragsverarbeitung gem. Art. 28 DSGVO)", avvContent);

      setSuccess("Plattform-Dokumente & AVV erfolgreich aktualisiert & versioniert!");
      fetchPlatformDocs();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const savePlatformDoc = async (documentType: string, title: string, content: string) => {
    const res = await fetch("/api/legal/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        documentType,
        title,
        content,
        isPlatform: true,
        status: "published",
      }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || `Fehler beim Speichern von ${title}`);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-950 text-slate-50">
        <Sidebar />
        <main className="flex-1 p-8 flex items-center justify-center">
          <div className="flex items-center gap-3 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
            <span>Lade Plattform-Rechtstexte...</span>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-50">
      <Sidebar />

      <main className="flex-1 p-8 space-y-8 overflow-y-auto max-w-5xl">
        {/* Header */}
        <div className="border-b border-slate-800/80 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              Plattform-Rechtstexte (Superadmin) <Lock className="w-6 h-6 text-indigo-400" />
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Verwaltung der zentralen Plattformdokumente (Impressum, Datenschutz, Nutzungsbedingungen &amp; AVV von GateMate).
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center gap-2 border border-slate-700 transition-colors shrink-0"
            >
              <Shield className="w-4 h-4 text-red-400" /> Superadmin Portal
            </Link>
            <Link
              href="/admin/users"
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center gap-2 border border-slate-700 transition-colors shrink-0"
            >
              <Users className="w-4 h-4 text-indigo-400" /> Userverwaltung
            </Link>
          </div>
        </div>

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
          {/* Document 1: Plattform-Impressum */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-400" /> Plattform-Impressum (§ 5 DDG)
            </h2>
            <textarea
              rows={6}
              value={impressumContent}
              onChange={(e) => setImpressumContent(e.target.value)}
              placeholder="GateMate Ticketing Platforms GmbH..."
              className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 font-mono text-xs focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Document 2: Plattform-Datenschutz */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" /> Plattform-Datenschutzerklärung (DSGVO)
            </h2>
            <textarea
              rows={6}
              value={privacyContent}
              onChange={(e) => setPrivacyContent(e.target.value)}
              placeholder="Datenschutzbestimmungen von GateMate..."
              className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 font-mono text-xs focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Document 3: Plattform-Nutzungsbedingungen */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-400" /> Plattform-Nutzungsbedingungen (SaaS AGB)
            </h2>
            <textarea
              rows={6}
              value={termsContent}
              onChange={(e) => setTermsContent(e.target.value)}
              placeholder="Nutzungsbedingungen der SaaS Plattform..."
              className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 font-mono text-xs focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Document 4: Plattform-AVV */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-cyan-400" /> Plattform-AVV (Auftragsverarbeitungsvertrag gem. Art. 28 DSGVO)
            </h2>
            <p className="text-xs text-slate-400">
              Vertragliche Vereinbarung zwischen GateMate (Auftragsverarbeiter) und dem Veranstalter (Verantwortlicher). Wird bei der Registrierung / AGB-Bestätigung des Veranstalters automatisch abgeschlossen.
            </p>
            <textarea
              rows={8}
              value={avvContent}
              onChange={(e) => setAvvContent(e.target.value)}
              placeholder="Vertrag zur Auftragsverarbeitung (AVV) gemäß Art. 28 DSGVO..."
              className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 font-mono text-xs focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-xl shadow-indigo-600/30"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Publizierte neue Plattform-Versionen...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Plattform-Rechtstexte Speichern
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
