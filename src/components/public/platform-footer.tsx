import Link from "next/link";
import { Ticket, ShieldCheck, FileText, Lock, ShieldAlert, Mail, FileCheck } from "lucide-react";

export function PlatformFooter() {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950 text-slate-400 py-12 px-6">
      <div className="max-w-[1400px] mx-auto space-y-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-slate-800/60 pb-8">
          <div className="space-y-2">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <Ticket className="w-6 h-6 text-indigo-400" />
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                GateMate
              </span>
            </Link>
            <p className="text-xs text-slate-400 max-w-md">
              Moderne Multi-Tenant Event-Ticketing &amp; Express QR-Check-In Plattform für unabhängige Veranstalter.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs font-medium">
            <Link href="/kontakt" className="hover:text-indigo-400 transition-colors flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-500" /> Kontakt &amp; Support
            </Link>
            <Link href="/impressum" className="hover:text-indigo-400 transition-colors flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-500" /> Impressum
            </Link>
            <Link href="/datenschutz" className="hover:text-indigo-400 transition-colors flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-500" /> Datenschutz
            </Link>
            <Link href="/agb" className="hover:text-indigo-400 transition-colors flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-500" /> AGB &amp; Nutzungsbedingungen
            </Link>
            <Link href="/avv" className="hover:text-indigo-400 transition-colors flex items-center gap-1.5">
              <FileCheck className="w-3.5 h-3.5 text-slate-500" /> AVV (Art. 28 DSGVO)
            </Link>
            <Link href="/notice-and-action" className="hover:text-amber-400 transition-colors flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-500" /> Inhalte melden (DSA)
            </Link>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>&copy; {new Date().getFullYear()} GateMate Platform. Alle Rechte vorbehalten.</p>
          <p className="text-[11px] text-slate-600">
            GateMate agiert ausschließlich als technischer Dienstleister und Software-Plattform.
          </p>
        </div>
      </div>
    </footer>
  );
}
