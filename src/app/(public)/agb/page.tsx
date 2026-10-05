import type { Metadata } from "next";
import Link from "next/link";
import { Ticket, ArrowLeft, ShieldCheck, FileText, Building2, Scale, AlertCircle, Hash } from "lucide-react";
import { PlatformFooter } from "@/components/public/platform-footer";
import { getPublishedDocument } from "@/lib/legal-server";

import { MarkdownRenderer } from "@/components/ui/markdown-renderer";

export const metadata: Metadata = {
  title: "AGB & Nutzungsbedingungen | GateMate Event Ticketing Platform",
  description: "Allgemeine Nutzungsbedingungen für die Software-Plattform GateMate und Rollentrennung zwischen Plattform und Veranstalter.",
};

export const dynamic = "force-dynamic";

export default async function PlatformAGBPage() {
  const doc = await getPublishedDocument({ documentType: "platform_terms" });

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-50 selection:bg-indigo-500 selection:text-white">
      {/* Header */}
      <header className="px-6 py-4 border-b border-slate-800/80 bg-slate-900/50 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Ticket className="w-6 h-6 text-indigo-400" />
          <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            GateMate
          </span>
        </Link>
        <Link
          href="/"
          className="text-xs px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Zurück zur Startseite
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" /> Allgemeine Nutzungsbedingungen
          </div>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white">Plattform AGB &amp; Nutzungsbedingungen</h1>
            {doc && (
              <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-mono">
                Version {doc.version}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-400">
            Regelungen zur Nutzung der GateMate Software-Plattform für Ticketkäufer und Veranstalter.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-8 shadow-xl text-slate-300 text-sm leading-relaxed">
          {/* Important Notice */}
          <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-indigo-300">
              <AlertCircle className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>Wichtiger Hinweis zur Rolle von GateMate:</span>
            </div>
            <p className="text-indigo-200/90 leading-relaxed">
              GateMate agiert ausschließlich als technischer Dienstleister und Software-Plattform. Verträge über die Teilnahme an Veranstaltungen kommen ausschließlich direkt zwischen dem jeweiligen Veranstalter und dem Ticketkäufer zustande.
            </p>
          </div>

          {doc?.content ? (
            <MarkdownRenderer content={doc.content} />
          ) : (
            <>
              {/* Fallback Content */}
              <section className="space-y-3">
                <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                  <Building2 className="w-5 h-5 text-indigo-400" /> § 1 Geltungsbereich &amp; Vertragsgegenstand
                </h2>
                <p>
                  Diese Allgemeinen Nutzungsbedingungen gelten für die Nutzung der Software-Plattform GateMate (gatemate.io).
                </p>
                <p>
                  GateMate bietet Veranstaltern eine technische Lösung zur Erstellung von Event-Seiten, zum Verkauf von Eintrittskarten sowie zur Einlasskontrolle mittels QR-Code-Scanning an.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                  <Scale className="w-5 h-5 text-indigo-400" /> § 2 Rolle der Plattform &amp; Vertragsbeziehungen
                </h2>
                <p>
                  (1) Beim Kauf von Eintrittskarten über die Plattform kommt ein Kaufvertrag ausschließlich zwischen dem Ticketkäufer und dem veranstaltenden Unternehmen/Organisator zustande.
                </p>
                <p>
                  (2) GateMate ist nicht Veranstalter der angebotenen Events, übernimmt keine Gewährleistung für die Durchführung oder Qualität der Veranstaltungen und haftet nicht für Event-Absagen oder Terminverschiebungen durch den Veranstalter.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                  <FileText className="w-5 h-5 text-indigo-400" /> § 3 Zahlungsabwicklung &amp; Gebühren
                </h2>
                <p>
                  (1) Die Zahlungsabwicklung für Ticketverkäufe erfolgt direkt über das Stripe-Konto (Stripe Connect Standard oder direkte API-Schlüssel) des jeweiligen Veranstalters. Der Vertragspartner und vertragliche Zahlungsempfänger für den Ticketkauf ist ausschließlich der jeweilige Veranstalter (Merchant of Record).
                </p>
                <p>
                  (2) Etwaige Plattform- und Vermittlungsgebühren werden im Zahlungsfluss transparent ausgewiesen und automatisch gemäß Vereinbarung mit dem Veranstalter einbehalten.
                </p>
                <p>
                  (3) Der Veranstalter trägt die alleinige finanzielle und rechtliche Verantwortung für etwaige Rückbuchungen (Chargebacks), Zahlungsausfälle, Kundenreklamationen und Stornierungen im Zusammenhang mit seinen Veranstaltungen.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                  <ShieldCheck className="w-5 h-5 text-indigo-400" /> § 4 Pflichten der Veranstalter
                </h2>
                <p>
                  (1) Veranstalter verpflichten sich, auf ihren Event-Seiten ein eigenes, vollständiges Impressum sowie alle gesetzlich erforderlichen Pflichtangaben (insbesondere Verbraucherinformationen und Widerrufsbelehrungen nach § 312g BGB) bereitzustellen.
                </p>
                <p>
                  (2) Veranstalter sind verpflichtet, vor der Veröffentlichung von Events ein eigenes Stripe-Zahlungskonto (Stripe Connect Standard) anzubinden.
                </p>
              </section>
            </>
          )}

          {doc?.hash && (
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[10px] text-slate-500 font-mono flex items-center gap-2">
              <Hash className="w-3.5 h-3.5 text-indigo-400 shrink-0" /> SHA-256 Hash: {doc.hash}
            </div>
          )}
        </div>
      </main>

      <PlatformFooter />
    </div>
  );
}

