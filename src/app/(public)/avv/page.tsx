import type { Metadata } from "next";
import Link from "next/link";
import { Ticket, ArrowLeft, ShieldCheck, FileCheck, Hash } from "lucide-react";
import { PlatformFooter } from "@/components/public/platform-footer";
import { getPublishedDocument } from "@/lib/legal-server";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";

export const metadata: Metadata = {
  title: "AVV (Auftragsverarbeitung Art. 28 DSGVO) | GateMate Event Ticketing Platform",
  description: "Vertrag zur Auftragsverarbeitung (AVV) gemäß Art. 28 DSGVO zwischen der Plattform GateMate und den Veranstaltern.",
};

export const dynamic = "force-dynamic";

export default async function PlatformAVVPage() {
  const doc = await getPublishedDocument({ documentType: "platform_avv" });

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
      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-8 py-12 space-y-8">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
            <FileCheck className="w-3.5 h-3.5" /> Auftragsverarbeitung gem. Art. 28 DSGVO
          </div>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white">Vertrag zur Auftragsverarbeitung (AVV)</h1>
            {doc && (
              <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-mono">
                Version {doc.version}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-400">
            Rechtliche Vereinbarung zwischen GateMate (Auftragsverarbeiter) und den Veranstaltern (Verantwortlicher).
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-8 shadow-xl text-slate-300 text-sm leading-relaxed">
          {doc?.content ? (
            <MarkdownRenderer content={doc.content} />
          ) : (
            <>
              {/* Fallback Content */}
              <section className="space-y-3">
                <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                  <ShieldCheck className="w-5 h-5 text-indigo-400" /> 1. Gegenstand &amp; Dauer der Verarbeitung
                </h2>
                <p>
                  GateMate (Auftragsverarbeiter) verarbeitet im Auftrag des Veranstalters (Verantwortlicher) personenbezogene Daten der Ticketkäufer (Namen, E-Mail-Adresse, Bestell- und Ticketdaten) ausschließlich zum Zweck der Bereitstellung der SaaS-Ticketingplattform, der Ticketausstellung und der Einlasskontrolle.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                  <FileCheck className="w-5 h-5 text-indigo-400" /> 2. Pflichten von GateMate
                </h2>
                <ul className="list-disc pl-5 space-y-2 text-xs text-slate-400">
                  <li>Datenverarbeitung erfolgt ausschließlich gemäß dokumentierter Weisung des Veranstalters.</li>
                  <li>Alle mit der Verarbeitung befassten Mitarbeiter sind zur Vertraulichkeit verpflichtet.</li>
                  <li>Technische und organisatorische Maßnahmen (TOMs) werden auf dem aktuellen Stand der Technik aufrechterhalten.</li>
                  <li>Unterstützung des Veranstalters bei der Beantwortung von Betroffenenrechten (Art. 15–22 DSGVO).</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                  <ShieldCheck className="w-5 h-5 text-indigo-400" /> 3. Technische &amp; Organisatorische Maßnahmen (TOMs)
                </h2>
                <p>
                  GateMate setzt angemessene Schutzmaßnahmen ein, darunter TLS 1.3/HTTPS Verschlüsselung, rollenbasierte Zugriffskontrollen (RBAC), regelmäßige Sicherheits-Backups und Protokollierung von Systemzugriffen.
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
