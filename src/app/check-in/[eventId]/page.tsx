"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  QrCode,
  Search,
  UserCheck,
  Shield,
  Camera,
} from "lucide-react";
import { QrScanner, ScanResultPayload } from "@/components/scanner/qr-scanner";
import { triggerScanFeedback } from "@/lib/scan-feedback";

interface Attendee {
  id: string;
  attendeeName: string;
  attendeeEmail: string;
  tierName: string;
  status: "valid" | "used" | "cancelled";
}

export default function CheckInScannerPage() {
  const params = useParams();
  const eventId = (params?.eventId || params?.id || "") as string;

  const [activeTab, setActiveTab] = useState<"camera" | "manual">("camera");

  // Manual Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Attendee[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [manualResult, setManualResult] = useState<ScanResultPayload | null>(null);

  // Handle Token Verification API call for camera scanner & manual checkin
  const handleVerifyToken = async (tokenOrId: string, isDirectTicketId = false): Promise<ScanResultPayload> => {
    try {
      const payload = isDirectTicketId ? { ticketId: tokenOrId } : { token: tokenOrId };

      const res = await fetch(`/api/events/${eventId}/verify-ticket`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      let resultPayload: ScanResultPayload;

      if (res.ok && data.success) {
        resultPayload = {
          status: "success",
          message: data.message || "CHECK-IN ERFOLGREICH",
          ticket: data.ticket,
        };
      } else if (res.status === 409 || data.isDuplicate) {
        resultPayload = {
          status: "duplicate",
          message: data.message || "TICKET BEREITS EINGELÖST",
          ticket: data.ticket,
        };
      } else {
        resultPayload = {
          status: "error",
          message: data.message || "UNGÜLTIGES ODER STORNIERTES TICKET",
          ticket: data.ticket,
        };
      }

      if (isDirectTicketId) {
        setManualResult(resultPayload);
        triggerScanFeedback(resultPayload.status === "success" ? "success" : resultPayload.status === "duplicate" ? "duplicate" : "error");
        if (searchQuery) handleManualSearch(searchQuery);
      }

      return resultPayload;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Netzwerkfehler bei Verifizierung.";
      const errorPayload: ScanResultPayload = {
        status: "error",
        message: "Netzwerkfehler: " + msg,
      };
      if (isDirectTicketId) {
        setManualResult(errorPayload);
        triggerScanFeedback("error");
      }
      return errorPayload;
    }
  };

  // Handle Manual Attendee Search
  const handleManualSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}/attendees?query=${encodeURIComponent(query)}`);
      const data = await res.json();
      setSearchResults(data.attendees || []);
    } catch (err) {
      console.error("Attendee search error:", err);
    } finally {
      setSearchLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Header Bar */}
      <header className="px-4 py-3 border-b border-slate-800 bg-slate-900 flex items-center justify-between sticky top-0 z-30">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="p-1.5 rounded-lg bg-indigo-600 text-white">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-base leading-none text-white">GateMate Check-In</h1>
            <p className="text-[10px] text-slate-400 mt-0.5">Event ID: {eventId}</p>
          </div>
        </Link>

        <span className="text-[11px] px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium flex items-center gap-1">
          <Shield className="w-3 h-3" /> Gate Mode Active
        </span>
      </header>

      {/* Mode Tabs Switcher */}
      <div className="flex border-b border-slate-800 bg-slate-900/50 p-1">
        <button
          onClick={() => setActiveTab("camera")}
          className={`flex-1 py-3 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all min-h-[44px] ${
            activeTab === "camera"
              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Camera className="w-4 h-4" /> Camera Scanner
        </button>
        <button
          onClick={() => setActiveTab("manual")}
          className={`flex-1 py-3 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all min-h-[44px] ${
            activeTab === "manual"
              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Search className="w-4 h-4" /> Manuelle Suche
        </button>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 p-4 max-w-md mx-auto w-full flex flex-col justify-start space-y-6">
        {activeTab === "camera" ? (
          <QrScanner onVerifyToken={(token) => handleVerifyToken(token, false)} />
        ) : (
          /* Manual Fallback Search View */
          <div className="space-y-4">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleManualSearch(e.target.value)}
                placeholder="Teilnehmer nach Name oder E-Mail suchen..."
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-base sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {searchLoading && (
              <p className="text-xs text-slate-400 text-center py-4">Teilnehmer-Datenbank wird durchsucht...</p>
            )}

            <div className="space-y-2">
              {searchResults.map((attendee) => {
                const isCheckedIn = attendee.status === "used";

                return (
                  <div
                    key={attendee.id}
                    className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3"
                  >
                    <div>
                      <h4 className="font-bold text-sm text-white">{attendee.attendeeName}</h4>
                      <p className="text-xs text-slate-400 font-mono">{attendee.attendeeEmail}</p>
                      <span className="inline-block mt-1 text-[10px] font-semibold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                        {attendee.tierName}
                      </span>
                    </div>

                    <button
                      disabled={isCheckedIn}
                      onClick={() => handleVerifyToken(attendee.id, true)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                        isCheckedIn
                          ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
                          : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20"
                      }`}
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      {isCheckedIn ? "Eingecheckt" : "Einchecken"}
                    </button>
                  </div>
                );
              })}

              {searchQuery && !searchLoading && searchResults.length === 0 && (
                <div className="p-6 text-center bg-slate-900/40 rounded-2xl border border-slate-800 text-xs text-slate-400">
                  Keine Teilnehmer für &quot;{searchQuery}&quot; gefunden.
                </div>
              )}
            </div>

            {manualResult && (
              <div
                className={`p-4 rounded-2xl border text-xs space-y-1 ${
                  manualResult.status === "success"
                    ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-200"
                    : manualResult.status === "duplicate"
                    ? "bg-amber-950/60 border-amber-500/40 text-amber-200"
                    : "bg-rose-950/60 border-rose-500/40 text-rose-200"
                }`}
              >
                <strong className="block text-sm font-bold text-white">{manualResult.message}</strong>
                {manualResult.ticket && (
                  <p>Gast: {manualResult.ticket.attendeeName} ({manualResult.ticket.tierName})</p>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
