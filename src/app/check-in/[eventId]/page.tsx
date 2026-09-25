"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { QrCode, CheckCircle2, XCircle, Search, UserCheck, AlertTriangle, RefreshCw, Volume2, Shield } from "lucide-react";
import { Html5QrcodeScanner } from "html5-qrcode";

// Web Audio API Audio Feedback Synthesizer
function playFeedbackAudio(type: "success" | "error") {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    if (type === "success") {
      // High-pitch dual chime
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc1.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.1); // E5
      gain1.gain.setValueAtTime(0.3, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.3);
    } else {
      // Low-pitch error buzz
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    }
  } catch (err) {
    console.error("Audio feedback error:", err);
  }
}

interface Attendee {
  id: string;
  attendeeName: string;
  attendeeEmail: string;
  tierName: string;
  status: "valid" | "used" | "cancelled";
}

export default function CheckInScannerPage() {
  const params = useParams();
  const eventId = (params?.eventId || params?.id || "evt_tech_conf_2026") as string;

  const [scanning, setScanning] = useState(false);
  const [activeTab, setActiveTab] = useState<"camera" | "manual">("camera");

  // Scan Status State
  const [scanResult, setScanResult] = useState<{
    status: "idle" | "success" | "duplicate" | "error";
    message: string;
    ticket?: {
      id: string;
      attendeeName: string;
      attendeeEmail: string;
      tierName: string;
      checkedInAt?: string;
    };
  }>({ status: "idle", message: "" });

  // Manual Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Attendee[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  // Initialize camera scanner
  useEffect(() => {
    if (activeTab === "camera" && scanning && !scannerRef.current) {
      const scanner = new Html5QrcodeScanner(
        "qr-reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );

      scanner.render(
        (decodedText) => handleVerifyToken(decodedText),
        (error) => {
          // Ignore minor scan frames
        }
      );

      scannerRef.current = scanner;
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
        scannerRef.current = null;
      }
    };
  }, [activeTab, scanning]);

  // Handle Token Verification API call
  const handleVerifyToken = async (tokenOrId: string, isDirectTicketId = false) => {
    try {
      const payload = isDirectTicketId ? { ticketId: tokenOrId } : { token: tokenOrId };

      const res = await fetch(`/api/events/${eventId}/verify-ticket`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        playFeedbackAudio("success");
        setScanResult({
          status: "success",
          message: data.message || "CHECK-IN SUCCESSFUL",
          ticket: data.ticket,
        });
      } else if (res.status === 409 || data.isDuplicate) {
        playFeedbackAudio("error");
        setScanResult({
          status: "duplicate",
          message: data.message || "TICKET ALREADY REDEEMED",
          ticket: data.ticket,
        });
      } else {
        playFeedbackAudio("error");
        setScanResult({
          status: "error",
          message: data.message || "INVALID OR CANCELLED TICKET",
          ticket: data.ticket,
        });
      }

      // Refresh manual search results if on manual tab
      if (searchQuery) handleManualSearch(searchQuery);
    } catch (err: any) {
      playFeedbackAudio("error");
      setScanResult({
        status: "error",
        message: "Network Error: " + err.message,
      });
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
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-600 text-white">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-base leading-none">GateMate Check-In</h1>
            <p className="text-[10px] text-slate-400 mt-0.5">Event ID: {eventId}</p>
          </div>
        </div>

        <span className="text-[11px] px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium flex items-center gap-1">
          <Shield className="w-3 h-3" /> Gate Mode Active
        </span>
      </header>

      {/* Tabs Switcher */}
      <div className="flex border-b border-slate-800 bg-slate-900/50 p-1">
        <button
          onClick={() => setActiveTab("camera")}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all ${
            activeTab === "camera"
              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <QrCode className="w-4 h-4" /> Camera Scanner
        </button>
        <button
          onClick={() => setActiveTab("manual")}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all ${
            activeTab === "manual"
              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Search className="w-4 h-4" /> Manual Lookup
        </button>
      </div>

      {/* Main Mode View */}
      <main className="flex-1 p-4 max-w-md mx-auto w-full flex flex-col justify-start space-y-6">
        {activeTab === "camera" ? (
          <div className="space-y-4">
            {/* Viewfinder Box */}
            <div className="w-full aspect-square bg-slate-900 border-2 border-dashed border-slate-800 rounded-3xl flex flex-col items-center justify-center relative overflow-hidden shadow-2xl">
              <div id="qr-reader" className="w-full h-full"></div>
              {!scanning && (
                <div className="flex flex-col items-center gap-3 p-6 text-center">
                  <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                    <QrCode className="w-12 h-12 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-white">Camera Check-In Ready</h3>
                    <p className="text-xs text-slate-400 mt-1">Point device camera at attendee ticket QR code.</p>
                  </div>
                  <button
                    onClick={() => setScanning(true)}
                    className="mt-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 font-bold text-xs text-white shadow-xl shadow-indigo-600/30 transition-all"
                  >
                    Start Camera Stream
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Manual Fallback Search View */
          <div className="space-y-4">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleManualSearch(e.target.value)}
                placeholder="Search attendee by name or email..."
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {searchLoading && (
              <p className="text-xs text-slate-400 text-center py-4">Searching attendee database...</p>
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
                      {isCheckedIn ? "Checked In" : "Check In"}
                    </button>
                  </div>
                );
              })}

              {searchQuery && !searchLoading && searchResults.length === 0 && (
                <div className="p-6 text-center bg-slate-900/40 rounded-2xl border border-slate-800 text-xs text-slate-400">
                  No matching attendees found for "{searchQuery}".
                </div>
              )}
            </div>
          </div>
        )}

        {/* Scan Status Overlay & Feedback Display */}
        {scanResult.status !== "idle" && (
          <div
            className={`p-5 rounded-2xl border flex items-start gap-4 transition-all animate-in zoom-in-95 ${
              scanResult.status === "success"
                ? "bg-emerald-950/80 border-emerald-500 text-emerald-100 shadow-2xl shadow-emerald-900/40"
                : scanResult.status === "duplicate"
                ? "bg-amber-950/80 border-amber-500 text-amber-100 shadow-2xl shadow-amber-900/40"
                : "bg-red-950/80 border-red-500 text-red-100 shadow-2xl shadow-red-900/40"
            }`}
          >
            {scanResult.status === "success" && <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0 mt-0.5" />}
            {scanResult.status === "duplicate" && <AlertTriangle className="w-8 h-8 text-amber-400 shrink-0 mt-0.5" />}
            {scanResult.status === "error" && <XCircle className="w-8 h-8 text-red-400 shrink-0 mt-0.5" />}

            <div className="flex-1 space-y-1">
              <h4 className="font-extrabold text-base tracking-tight">{scanResult.message}</h4>
              {scanResult.ticket && (
                <div className="text-xs space-y-0.5 opacity-90">
                  <p><span className="font-bold">Attendee:</span> {scanResult.ticket.attendeeName}</p>
                  <p><span className="font-bold">Pass Tier:</span> {scanResult.ticket.tierName}</p>
                  {scanResult.ticket.checkedInAt && (
                    <p><span className="font-bold">Timestamp:</span> {scanResult.ticket.checkedInAt}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
