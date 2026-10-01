import type { Metadata } from "next";
import Link from "next/link";
import { Ticket, ArrowLeft, ShieldAlert, Mail } from "lucide-react";
import { PlatformFooter } from "@/components/public/platform-footer";
import { DsaReportForm } from "@/components/public/dsa-report-form";

export const metadata: Metadata = {
  title: "Meldung rechtswidriger Inhalte (Notice & Action) | GateMate Platform",
  description: "Elektronisches Meldeverfahren gemäß Art. 16 Digital Services Act (DSA - Verordnung EU 2022/2065) für rechtswidrige Inhalte auf GateMate.",
};

export default function NoticeAndActionPage() {
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
            <ShieldAlert className="w-3.5 h-3.5" /> Melde- und Abhilfeverfahren gemäß Art. 16 DSA
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
            Meldung rechtswidriger Inhalte (Notice &amp; Action)
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            Gemäß Artikel 16 der Verordnung (EU) 2022/2065 (Digital Services Act - DSA) können Einzelpersonen oder Einrichtungen mutmaßlich rechtswidrige Inhalte auf dieser Plattform an den Plattformbetreiber melden.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-8 shadow-xl">
          {/* Information Notice Box */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-2">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Mail className="w-4 h-4 text-indigo-400" /> Zentrale Kontaktstelle gemäß Art. 11 &amp; 12 DSA
            </h3>
            <p className="text-slate-400">
              Für Behörden der Mitgliedstaaten, die EU-Kommission, das Board für digitale Dienste sowie Nutzer steht folgende elektronische Kontaktstelle zur Verfügung:
            </p>
            <p className="font-mono text-indigo-400 font-bold">dsa@gatemate.io</p>
            <p className="text-[11px] text-slate-500">Kommunikationssprachen: Deutsch, Englisch.</p>
          </div>

          {/* Form */}
          <DsaReportForm />
        </div>
      </main>

      <PlatformFooter />
    </div>
  );
}
