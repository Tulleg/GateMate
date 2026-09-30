import type { Metadata } from "next";
import Link from "next/link";
import { Ticket, ArrowLeft, Lock, ShieldCheck, Database, FileText, CheckCircle2 } from "lucide-react";
import { PlatformFooter } from "@/components/public/platform-footer";

export const metadata: Metadata = {
  title: "Datenschutzerklärung | GateMate Event Ticketing Platform",
  description: "Informationen zur Verarbeitung personenbezogener Daten gemäß Art. 13 DSGVO auf der Plattform GateMate.",
};

export default function PlatformDatenschutzPage() {
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
            <Lock className="w-3.5 h-3.5" /> Datenschutz nach Art. 13 DSGVO
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white">Plattform-Datenschutzerklärung</h1>
          <p className="text-sm text-slate-400">
            Transparente Informationen über die Erhebung, Verarbeitung und Nutzung personenbezogener Daten auf gatemate.io.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-8 shadow-xl text-slate-300 text-sm leading-relaxed">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <ShieldCheck className="w-5 h-5 text-indigo-400" /> 1. Verantwortlicher
            </h2>
            <p>
              Verantwortlicher im Sinne der Datenschutz-Grundverordnung (DSGVO) und anderer nationaler Datenschutzgesetze ist:
            </p>
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs space-y-1">
              <p className="font-bold text-white text-sm">GateMate Ticketing Platforms GmbH</p>
              <p>Musterstraße 42, 10115 Berlin, Deutschland</p>
              <p>E-Mail: <a href="mailto:privacy@gatemate.io" className="text-indigo-400 hover:underline font-semibold">privacy@gatemate.io</a></p>
            </div>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Database className="w-5 h-5 text-indigo-400" /> 2. Erhebung und Speicherung personenbezogener Daten
            </h2>
            <p>
              Beim Aufrufen unserer Website gatemate.io werden durch den auf Ihrem Endgerät zum Einsatz kommenden Browser automatisch Informationen an den Server unserer Website gesendet.
            </p>
            <ul className="list-disc pl-5 space-y-2 text-xs text-slate-400">
              <li>IP-Adresse des anfragenden Rechners, Datum und Uhrzeit des Zugriffs</li>
              <li>Name und URL der abgerufenen Datei</li>
              <li>Website, von der aus der Zugriff erfolgt (Referrer-URL)</li>
              <li>Verwendeter Browser und ggf. das Betriebssystem Ihres Rechners</li>
            </ul>
            <p className="pt-2">
              Rechtsgrundlage für die Datenverarbeitung ist Art. 6 Abs. 1 S. 1 lit. f DSGVO (berechtigtes Interesse an der Gewährleistung eines reibungslosen Verbindungsaufbaus und der Systemsicherheit).
            </p>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <FileText className="w-5 h-5 text-indigo-400" /> 3. Datenverarbeitung bei Ticketkauf &amp; Zahlungsabwicklung
            </h2>
            <p>
              Im Rahmen des Ticketkaufs verarbeiten wir personenbezogene Daten (Name, E-Mail-Adresse, Bestelldaten), um die Erstellung und Zustellung der digitalen QR-Tickets durchzuführen (Art. 6 Abs. 1 lit. b DSGVO).
            </p>
            <p>
              Zahlungsdaten werden direkt über den Zahlungsdienstleister <strong>Stripe Payments Europe, Ltd.</strong> abgewickelt. GateMate speichert selbst keine vollständigen Kreditkartendaten. Soweit bei Stripe Connect Destination Charges genutzt werden, erfolgt die Abwicklung im Namen des jeweiligen Veranstalters.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <CheckCircle2 className="w-5 h-5 text-indigo-400" /> 4. Ihre Rechte als betroffene Person
            </h2>
            <p>Sie haben gemäß DSGVO folgende Rechte bezüglich Ihrer personenbezogenen Daten:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2">
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="font-bold text-white block">Recht auf Auskunft (Art. 15 DSGVO)</span>
                <span className="text-slate-400">Auskunft über Ihre von uns verarbeiteten personenbezogenen Daten.</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="font-bold text-white block">Recht auf Berichtigung (Art. 16 DSGVO)</span>
                <span className="text-slate-400">Unverzügliche Berichtigung unrichtiger oder Vervollständigung Ihrer Daten.</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="font-bold text-white block">Recht auf Löschung (Art. 17 DSGVO)</span>
                <span className="text-slate-400">Löschung Ihrer bei uns gespeicherten personenbezogenen Daten.</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="font-bold text-white block">Beschwerderecht (Art. 77 DSGVO)</span>
                <span className="text-slate-400">Beschwerde bei einer zuständigen Datenschutz-Aufsichtsbehörde.</span>
              </div>
            </div>
          </section>
        </div>
      </main>

      <PlatformFooter />
    </div>
  );
}
