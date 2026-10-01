"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  QrCode,
  CheckCircle2,
  XCircle,
  Search,
  UserCheck,
  AlertTriangle,
  RefreshCw,
  Shield,
  Camera,
  SwitchCamera,
  VideoOff,
  Loader2,
} from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";

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
  const eventId = (params?.eventId || params?.id || "") as string;

  const [activeTab, setActiveTab] = useState<"camera" | "manual">("camera");
  const [scanning, setScanning] = useState(false);
  const [cameraInitializing, setCameraInitializing] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");

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

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const lastScannedTokenRef = useRef<{ token: string; time: number } | null>(null);

  // Stop camera scanner cleanly
  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        html5QrCodeRef.current.clear();
      } catch (e) {
        console.error("Stop scanner error:", e);
      }
      html5QrCodeRef.current = null;
    }
    setScanning(false);
    setCameraInitializing(false);
  };

  // Start camera scanner with direct getUserMedia permission request
  const startScanner = async (mode: "environment" | "user" = facingMode) => {
    setCameraError(null);
    setCameraInitializing(true);
    setScanning(true);

    // Check HTTPS / Secure Context requirement for cameras
    if (
      typeof window !== "undefined" &&
      !window.isSecureContext &&
      window.location.hostname !== "localhost" &&
      window.location.hostname !== "127.0.0.1"
    ) {
      setCameraError("Kamerazugriff erfordert eine sichere Verbindung (HTTPS). Bitte nutze HTTPS oder den manuellen Lookup.");
      setCameraInitializing(false);
      setScanning(false);
      return;
    }

    // Give DOM time to render container element #qr-reader
    await new Promise((resolve) => setTimeout(resolve, 150));

    try {
      // Clean up previous instance if existing
      if (html5QrCodeRef.current) {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        html5QrCodeRef.current.clear();
        html5QrCodeRef.current = null;
      }

      const html5QrCode = new Html5Qrcode("qr-reader");
      html5QrCodeRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: mode },
        {
          fps: 10,
          qrbox: { width: 240, height: 240 },
          aspectRatio: 1.0,
        },
        (decodedText) => handleScannedResult(decodedText),
        () => {
          // Ignore non-matching frame scans
        }
      );

      setCameraInitializing(false);
    } catch (err: any) {
      console.error("Camera start error:", err);
      setCameraInitializing(false);
      setScanning(false);

      let errorMsg = "Kamerazugriff konnte nicht gestartet werden.";
      const errStr = String(err);
      if (
        err?.name === "NotAllowedError" ||
        errStr.includes("Permission denied") ||
        errStr.includes("NotAllowedError")
      ) {
        errorMsg =
          "Kameraberechtigung wurde verweigert. Bitte erlaube den Kamerazugriff in deinen Browser-Einstellungen und klicke erneut auf 'Kamera-Stream starten'.";
      } else if (err?.name === "NotFoundError" || errStr.includes("NotFoundError")) {
        errorMsg = "Keine Kamera auf diesem Gerät gefunden.";
      } else if (err?.name === "NotReadableError" || errStr.includes("NotReadableError")) {
        errorMsg = "Kamera wird möglicherweise von einer anderen Anwendung blockiert.";
      } else if (typeof err === "string") {
        errorMsg = err;
      } else if (err?.message) {
        errorMsg = err.message;
      }

      setCameraError(errorMsg);
    }
  };

  // Toggle Camera Front/Back
  const toggleCameraFacingMode = async () => {
    const newMode = facingMode === "environment" ? "user" : "environment";
    setFacingMode(newMode);
    if (scanning) {
      await startScanner(newMode);
    }
  };

  // Debounced scan callback handler
  const handleScannedResult = (decodedText: string) => {
    const now = Date.now();
    if (
      lastScannedTokenRef.current &&
      lastScannedTokenRef.current.token === decodedText &&
      now - lastScannedTokenRef.current.time < 3000
    ) {
      return; // throttle same QR code within 3 seconds
    }
    lastScannedTokenRef.current = { token: decodedText, time: now };
    handleVerifyToken(decodedText);
  };

  // Handle Tab changes
  useEffect(() => {
    if (activeTab !== "camera" && scanning) {
      stopScanner();
    }
  }, [activeTab]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current) {
        if (html5QrCodeRef.current.isScanning) {
          html5QrCodeRef.current.stop().catch(() => {});
        }
        html5QrCodeRef.current = null;
      }
    };
  }, []);

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
          message: data.message || "CHECK-IN ERFOLGREICH",
          ticket: data.ticket,
        });
      } else if (res.status === 409 || data.isDuplicate) {
        playFeedbackAudio("error");
        setScanResult({
          status: "duplicate",
          message: data.message || "TICKET BEREITS EINGELÖST",
          ticket: data.ticket,
        });
      } else {
        playFeedbackAudio("error");
        setScanResult({
          status: "error",
          message: data.message || "UNGÜLTIGES ODER STORNIERTES TICKET",
          ticket: data.ticket,
        });
      }

      // Refresh manual search results if on manual tab
      if (searchQuery) handleManualSearch(searchQuery);
    } catch (err: any) {
      playFeedbackAudio("error");
      setScanResult({
        status: "error",
        message: "Netzwerkfehler: " + err.message,
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
      {/* Dynamic CSS override for Html5Qrcode internal video element */}
      <style jsx global>{`
        #qr-reader video {
          object-fit: cover !important;
          width: 100% !important;
          height: 100% !important;
          border-radius: 1.5rem;
        }
        #qr-reader {
          border: none !important;
        }
      `}</style>

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
          <Camera className="w-4 h-4" /> Camera Scanner
        </button>
        <button
          onClick={() => setActiveTab("manual")}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all ${
            activeTab === "manual"
              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Search className="w-4 h-4" /> Manuelle Suche
        </button>
      </div>

      {/* Main Mode View */}
      <main className="flex-1 p-4 max-w-md mx-auto w-full flex flex-col justify-start space-y-6">
        {activeTab === "camera" ? (
          <div className="space-y-4">
            {/* Viewfinder Box */}
            <div className="w-full aspect-square bg-slate-900 border-2 border-slate-800 rounded-3xl flex flex-col items-center justify-center relative overflow-hidden shadow-2xl">
              {/* Scanner Video Mount Point */}
              <div
                id="qr-reader"
                className={`w-full h-full absolute inset-0 ${scanning ? "block" : "hidden"}`}
              ></div>

              {/* Initializing Spinner */}
              {cameraInitializing && (
                <div className="absolute inset-0 bg-slate-950/90 z-20 flex flex-col items-center justify-center gap-3 p-6 text-center backdrop-blur-sm">
                  <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                  <p className="text-xs font-semibold text-slate-200">
                    Kamera wird gestartet...
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Bitte erlauben Sie den Kamera-Zugriff im Browser-Popup.
                  </p>
                </div>
              )}

              {/* Active Scanner Reticle & Laser overlay */}
              {scanning && !cameraInitializing && (
                <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
                  {/* Targeting frame */}
                  <div className="w-60 h-60 border-2 border-indigo-500/40 rounded-2xl relative">
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-indigo-400"></div>
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-indigo-400"></div>
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-indigo-400"></div>
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-indigo-400"></div>
                    {/* Animated laser line */}
                    <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-indigo-400 to-transparent shadow-[0_0_8px_rgba(99,102,241,0.8)] animate-pulse mt-28"></div>
                  </div>
                </div>
              )}

              {/* Idle State / Pre-start view */}
              {!scanning && !cameraInitializing && (
                <div className="flex flex-col items-center gap-3 p-6 text-center z-10">
                  <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                    <QrCode className="w-12 h-12" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-white">Kamera-Check-in bereit</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Kamera auf den QR-Code des Tickets richten.
                    </p>
                  </div>
                  <button
                    onClick={() => startScanner()}
                    className="mt-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 font-bold text-xs text-white shadow-xl shadow-indigo-600/30 transition-all flex items-center gap-2"
                  >
                    <Camera className="w-4 h-4" /> Kamera-Stream starten
                  </button>
                </div>
              )}
            </div>

            {/* Camera Controls Bar (When Active) */}
            {scanning && !cameraInitializing && (
              <div className="flex items-center justify-between gap-3">
                <button
                  onClick={toggleCameraFacingMode}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <SwitchCamera className="w-4 h-4 text-indigo-400" />
                  {facingMode === "environment" ? "Frontkamera" : "Hauptkamera"}
                </button>
                <button
                  onClick={stopScanner}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-red-950/40 border border-red-900/50 hover:bg-red-900/50 text-red-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <VideoOff className="w-4 h-4 text-red-400" />
                  Stream stoppen
                </button>
              </div>
            )}

            {/* Camera Error Display */}
            {cameraError && (
              <div className="p-4 rounded-2xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs space-y-2">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-bold text-red-100">Kamera-Fehler</p>
                    <p className="mt-1 leading-relaxed text-slate-300">{cameraError}</p>
                  </div>
                </div>
                <div className="pt-2 flex items-center gap-2 border-t border-red-900/50">
                  <button
                    onClick={() => startScanner()}
                    className="px-3 py-1.5 rounded-lg bg-red-800 hover:bg-red-700 text-white font-bold text-[11px] flex items-center gap-1.5 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Erneut versuchen
                  </button>
                  <button
                    onClick={() => setActiveTab("manual")}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition-colors"
                  >
                    Manuelle Suche nutzen
                  </button>
                </div>
              </div>
            )}
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
                placeholder="Teilnehmer nach Name oder E-Mail suchen..."
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                  <p><span className="font-bold">Teilnehmer:</span> {scanResult.ticket.attendeeName}</p>
                  <p><span className="font-bold">Ticket-Kategorie:</span> {scanResult.ticket.tierName}</p>
                  {scanResult.ticket.checkedInAt && (
                    <p><span className="font-bold">Zeitstempel:</span> {scanResult.ticket.checkedInAt}</p>
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

