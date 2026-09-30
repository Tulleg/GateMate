import type { Metadata } from "next";
import Link from "next/link";
import { Ticket, ArrowLeft, Building2, Mail, Phone, Scale, Hash } from "lucide-react";
import { PlatformFooter } from "@/components/public/platform-footer";
import { getPublishedDocument } from "@/lib/legal-server";

export const metadata: Metadata = {
  title: "Impressum | GateMate Event Ticketing Platform",
  description: "Anbieterkennzeichnung und rechtliche Informationen gemäß § 5 DDG (Telemediengesetz) der Plattform GateMate.",
};

export default async function PlatformImpressumPage() {
  const doc = await getPublishedDocument({ documentType: "platform_impressum" });

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
            <Scale className="w-3.5 h-3.5" /> Anbieterkennzeichnung gemäß § 5 DDG
          </div>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white">Plattform-Impressum</h1>
            {doc && (
              <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-mono">
                Version {doc.version}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-400">
            Rechtliche Informationen und Kontaktangaben des Betreibers der Software-Plattform GateMate.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-8 shadow-xl">
          {doc?.content ? (
            <div className="prose prose-invert max-w-none text-sm leading-relaxed whitespace-pre-wrap font-sans">
              {doc.content}
            </div>
          ) : (
            <>
              {/* Default Fallback Content */}
              <section className="space-y-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                  <Building2 className="w-5 h-5 text-indigo-400" /> Plattformbetreiber / Diensteanbieter
                </h2>
                <div className="text-sm text-slate-300 leading-relaxed space-y-1">
                  <p className="font-semibold text-white">GateMate Ticketing Platforms GmbH</p>
                  <p>Musterstraße 42</p>
                  <p>10115 Berlin, Deutschland</p>
                </div>
              </section>

              <section className="space-y-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                  <Scale className="w-5 h-5 text-indigo-400" /> Vertretung &amp; Registereintrag
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-slate-300">
                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                    <span className="text-xs font-semibold text-slate-500 block uppercase mb-1">Vertreten durch</span>
                    <span className="font-semibold text-white">Geschäftsführung GateMate</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                    <span className="text-xs font-semibold text-slate-500 block uppercase mb-1">Handelsregister</span>
                    <span className="font-semibold text-white">Amtsgericht Berlin-Charlottenburg, HRB 123456 B</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                    <span className="text-xs font-semibold text-slate-500 block uppercase mb-1">Umsatzsteuer-ID</span>
                    <span className="font-semibold text-white">DE312345678 (§ 27a UStG)</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                    <span className="text-xs font-semibold text-slate-500 block uppercase mb-1">Inhaltlich Verantwortlicher</span>
                    <span className="font-semibold text-white">GateMate GmbH (§ 18 Abs. 2 MStV)</span>
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                  <Mail className="w-5 h-5 text-indigo-400" /> Kontaktmöglichkeiten
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-slate-300">
                    <Mail className="w-5 h-5 text-indigo-400 shrink-0" />
                    <div>
                      <span className="text-xs text-slate-500 block font-semibold">E-Mail Support</span>
                      <a href="mailto:support@gatemate.io" className="text-indigo-400 hover:underline font-semibold">
                        support@gatemate.io
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-slate-300">
                    <Phone className="w-5 h-5 text-indigo-400 shrink-0" />
                    <div>
                      <span className="text-xs text-slate-500 block font-semibold">Telefon</span>
                      <span className="font-semibold text-white">+49 (0) 30 12345678</span>
                    </div>
                  </div>
                </div>
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
