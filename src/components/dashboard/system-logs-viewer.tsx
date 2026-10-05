"use client";

import { useState } from "react";
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  Trash2,
  RefreshCw,
  Search,
  Filter,
  FileText,
  X,
  CreditCard,
  Mail,
  QrCode,
  Scale,
  Server,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export interface LogItem {
  id: string;
  severity: "critical" | "warning" | "info";
  category: "payment" | "email" | "check_in" | "legal" | "system";
  message: string;
  details: string | null;
  relatedEntityId: string | null;
  createdAt: string | Date;
}

interface SystemLogsViewerProps {
  initialLogs: LogItem[];
  onClearLogs?: () => Promise<void>;
}

export function SystemLogsViewer({ initialLogs }: SystemLogsViewerProps) {
  const [logs, setLogs] = useState<LogItem[]>(initialLogs);
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedLog, setSelectedLog] = useState<LogItem | null>(null);
  const [isClearing, setIsClearing] = useState<boolean>(false);

  const filteredLogs = logs.filter((log) => {
    if (severityFilter !== "all" && log.severity !== severityFilter) return false;
    if (categoryFilter !== "all" && log.category !== categoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchMsg = log.message.toLowerCase().includes(q);
      const matchDetails = log.details?.toLowerCase().includes(q);
      const matchEntity = log.relatedEntityId?.toLowerCase().includes(q);
      if (!matchMsg && !matchDetails && !matchEntity) return false;
    }
    return true;
  });

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical":
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 font-bold text-[10px] uppercase flex items-center gap-1 w-fit">
            <AlertCircle className="w-3 h-3" /> Kritisch
          </span>
        );
      case "warning":
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold text-[10px] uppercase flex items-center gap-1 w-fit">
            <AlertTriangle className="w-3 h-3" /> Warnung
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold text-[10px] uppercase flex items-center gap-1 w-fit">
            <Info className="w-3 h-3" /> Info
          </span>
        );
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "payment":
        return <CreditCard className="w-4 h-4 text-emerald-400" />;
      case "email":
        return <Mail className="w-4 h-4 text-indigo-400" />;
      case "check_in":
        return <QrCode className="w-4 h-4 text-purple-400" />;
      case "legal":
        return <Scale className="w-4 h-4 text-cyan-400" />;
      default:
        return <Server className="w-4 h-4 text-slate-400" />;
    }
  };

  const handleClear = async () => {
    if (!confirm("Möchten Sie wirklich alle System-Logs leeren?")) return;
    setIsClearing(true);
    try {
      await fetch("/api/admin/logs/clear", { method: "DELETE" });
      setLogs([]);
    } catch (err) {
      console.error("Failed to clear logs", err);
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="flex flex-wrap items-center gap-3">
          {/* Severity Filter */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400 ml-2" />
            <button
              onClick={() => setSeverityFilter("all")}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                severityFilter === "all" ? "bg-slate-800 text-white font-bold" : "text-slate-400 hover:text-white"
              }`}
            >
              Alle ({logs.length})
            </button>
            <button
              onClick={() => setSeverityFilter("critical")}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                severityFilter === "critical" ? "bg-red-500/20 text-red-400 font-bold" : "text-slate-400 hover:text-red-400"
              }`}
            >
              Kritisch ({logs.filter((l) => l.severity === "critical").length})
            </button>
            <button
              onClick={() => setSeverityFilter("warning")}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                severityFilter === "warning" ? "bg-amber-500/20 text-amber-400 font-bold" : "text-slate-400 hover:text-amber-400"
              }`}
            >
              Warnung ({logs.filter((l) => l.severity === "warning").length})
            </button>
            <button
              onClick={() => setSeverityFilter("info")}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                severityFilter === "info" ? "bg-blue-500/20 text-blue-400 font-bold" : "text-slate-400 hover:text-blue-400"
              }`}
            >
              Info ({logs.filter((l) => l.severity === "info").length})
            </button>
          </div>

          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">Alle Kategorien</option>
            <option value="payment">Zahlung / Stripe</option>
            <option value="email">E-Mail-Versand</option>
            <option value="check_in">Gate Check-In</option>
            <option value="legal">Rechtstexte / Legal</option>
            <option value="system">System / Plattform</option>
          </select>
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Suchbegriff oder ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            onClick={handleClear}
            disabled={isClearing || logs.length === 0}
            className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 shrink-0 min-h-[36px]"
          >
            <Trash2 className="w-3.5 h-3.5" /> Logs leeren
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider border-b border-slate-800 font-mono text-[10px]">
              <tr>
                <th className="p-3">Schweregrad</th>
                <th className="p-3">Kategorie</th>
                <th className="p-3">Meldung</th>
                <th className="p-3">Referenz-ID</th>
                <th className="p-3">Zeitstempel</th>
                <th className="p-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <CheckCircle2 className="w-8 h-8 text-emerald-400/50" />
                      <p className="font-semibold text-slate-400">Keine entsprechenden System-Logs vorhanden</p>
                      <p className="text-[11px] text-slate-500">Das System läuft stabil und ohne auffällige Log-Einträge.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 shrink-0">{getSeverityBadge(log.severity)}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5 text-slate-300 font-medium capitalize">
                        {getCategoryIcon(log.category)}
                        <span>{log.category.replace("_", " ")}</span>
                      </div>
                    </td>
                    <td className="p-3 max-w-md">
                      <p className="font-semibold text-white truncate">{log.message}</p>
                    </td>
                    <td className="p-3 font-mono text-slate-400 text-[11px]">
                      {log.relatedEntityId ? (
                        <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-indigo-300">
                          {log.relatedEntityId}
                        </span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="p-3 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString("de-DE")}
                    </td>
                    <td className="p-3 text-right">
                      {log.details ? (
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 text-[11px] font-bold inline-flex items-center gap-1 transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5" /> Details
                        </button>
                      ) : (
                        <span className="text-slate-600 text-[11px]">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                {getSeverityBadge(selectedLog.severity)}
                <h3 className="font-extrabold text-lg text-white">Log Details &amp; Stacktrace</h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-500 font-semibold uppercase text-[10px]">Meldung:</span>
                <p className="font-bold text-white text-sm mt-0.5">{selectedLog.message}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px]">
                <div>
                  <span className="text-slate-500 block text-[10px]">Log-ID:</span>
                  <span className="text-indigo-400 font-bold">{selectedLog.id}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Zeitstempel:</span>
                  <span className="text-slate-300">{new Date(selectedLog.createdAt).toLocaleString("de-DE")}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-500 font-semibold uppercase text-[10px]">Detailierte Systemdaten &amp; Fehlerdetails:</span>
                <pre className="mt-1 p-4 rounded-xl bg-slate-950 border border-slate-800 text-indigo-200 font-mono text-[11px] overflow-x-auto whitespace-pre-wrap max-h-64 leading-relaxed">
                  {selectedLog.details}
                </pre>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <Button onClick={() => setSelectedLog(null)} className="px-5 py-2 rounded-xl text-xs font-bold">
                Schließen
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
