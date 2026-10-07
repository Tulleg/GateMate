import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/db";
import { systemLogs } from "@/db/schema";
import { desc } from "drizzle-orm";
import { Sidebar } from "@/components/dashboard/sidebar";
import { SystemLogsViewer } from "@/components/dashboard/system-logs-viewer";
import { getSystemHealthOverview } from "@/lib/system-logger";
import { Activity, Shield, AlertTriangle, CheckCircle2, AlertCircle, Info, ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminLogsPage() {
  const cookieStore = await cookies();
  const role = cookieStore.get("gatemate_role")?.value;

  if (role !== "superadmin") {
    redirect("/login");
  }

  const logs = await db.select().from(systemLogs).orderBy(desc(systemLogs.createdAt));
  const health = await getSystemHealthOverview();

  const formattedLogs = logs.map((l) => ({
    ...l,
    createdAt: l.createdAt.toISOString(),
  }));

  return (
    <div className="flex flex-col md:flex-row min-h-dvh md:h-dvh md:overflow-hidden bg-slate-950 text-slate-50">
      <Sidebar />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-8 overflow-y-auto min-w-0 md:h-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <Link href="/admin" className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
                <Activity className="w-7 h-7 text-indigo-400" /> System-Logs &amp; Health
              </h1>
              <span className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold flex items-center gap-1">
                <Shield className="w-3.5 h-3.5" /> Superadmin
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Live-Überwachung von Systemereignissen, Zahlungsfehlern, Resend-E-Mail-Status und Einlasskonflikten.
            </p>
          </div>
        </div>

        {/* System Health Status Banner */}
        <div className={`p-6 rounded-3xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
          health.status === "critical"
            ? "bg-red-950/40 border-red-800/50 text-red-200"
            : health.status === "warning"
            ? "bg-amber-950/40 border-amber-800/50 text-amber-200"
            : "bg-emerald-950/40 border-emerald-800/50 text-emerald-200"
        }`}>
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
              health.status === "critical"
                ? "bg-red-500/20 text-red-400 border border-red-500/30"
                : health.status === "warning"
                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
            }`}>
              {health.status === "critical" ? (
                <AlertCircle className="w-6 h-6" />
              ) : health.status === "warning" ? (
                <AlertTriangle className="w-6 h-6" />
              ) : (
                <CheckCircle2 className="w-6 h-6" />
              )}
            </div>
            <div>
              <h2 className="font-extrabold text-lg text-white">
                Plattform Status: {health.status === "critical" ? "Kritische Fehler vorhanden" : health.status === "warning" ? "Aufmerksamkeit erforderlich" : "System Betriebsbereit"}
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                {health.status === "critical"
                  ? "Es liegen kritische Systemfehler vor. Bitte prüfen Sie die rot markierten Einträge."
                  : health.status === "warning"
                  ? "System läuft, aber es wurden Warnungen im Mail- oder Checkin-Dienst aufgezeichnet."
                  : "Alle Plattformkomponenten laufen reibungslos ohne ungeklärte Systemausfälle."}
              </p>
            </div>
          </div>
        </div>

        {/* Metrics Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Kritische Fehler</span>
              <AlertCircle className="w-4 h-4 text-red-400" />
            </div>
            <p className="text-3xl font-bold text-white">{health.criticalCount}</p>
            <p className="text-[11px] text-red-400">Sehr hohe Priorität</p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Warnungen</span>
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-3xl font-bold text-white">{health.warningCount}</p>
            <p className="text-[11px] text-amber-400">Aufmerksamkeit erforderlich</p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Info Events</span>
              <Info className="w-4 h-4 text-blue-400" />
            </div>
            <p className="text-3xl font-bold text-white">{health.infoCount}</p>
            <p className="text-[11px] text-blue-400">Systemmitteilungen</p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Gesamt-Logs</span>
              <Activity className="w-4 h-4 text-indigo-400" />
            </div>
            <p className="text-3xl font-bold text-white">{health.totalCount}</p>
            <p className="text-[11px] text-slate-400">Registrierte Ereignisse</p>
          </div>
        </div>

        {/* Live Logs Viewer Component */}
        <SystemLogsViewer initialLogs={formattedLogs} />
      </main>
    </div>
  );
}
