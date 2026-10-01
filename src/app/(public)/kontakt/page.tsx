import type { Metadata } from "next";
import Link from "next/link";
import { Ticket, ArrowLeft, Mail, MessageSquare, ShieldCheck, HelpCircle } from "lucide-react";
import { PlatformFooter } from "@/components/public/platform-footer";
import { ContactForm } from "@/components/public/contact-form";

export const metadata: Metadata = {
  title: "Kontakt & Support | GateMate Platform",
  description: "Trete direkt mit dem GateMate Support- und Plattform-Team in Kontakt für Fragen, Support oder Feedback.",
};

export default function ContactPage() {
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
            <MessageSquare className="w-3.5 h-3.5" /> Direkter Plattform-Support
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
            Kontakt &amp; Anfragen
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed max-w-2xl">
            Hast du Fragen zur Event-Erstellung, zu deinen Tickets, Abrechnungen oder benötigst Unterstützung als Veranstalter? Schreibe uns direkt eine Nachricht – unser Plattform-Team hilft dir gerne weiter.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Quick Info Cards */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <Mail className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-white text-sm">Direkte E-Mail</h3>
            <p className="text-xs text-slate-400">
              Du erreichst unser Support-Team auch direkt per E-Mail unter:
            </p>
            <p className="text-xs font-mono text-indigo-400 font-bold">support@gatemate.io</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-white text-sm">Veranstalter Support</h3>
            <p className="text-xs text-slate-400">
              Hilfe bei Stripe-Connect, Auszahlungen oder Event-Einstellungen.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <HelpCircle className="w-5 h-5 text-purple-400" />
            <h3 className="font-bold text-white text-sm">DSA-Meldungen</h3>
            <p className="text-xs text-slate-400">
              Für Rechtsverletzungen nutze unser{" "}
              <Link href="/notice-and-action" className="text-purple-400 underline font-semibold">
                DSA Meldeformular
              </Link>.
            </p>
          </div>
        </div>

        {/* Main Form Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-400" /> Nachricht an das GateMate-Team senden
          </h2>

          <ContactForm />
        </div>
      </main>

      <PlatformFooter />
    </div>
  );
}
