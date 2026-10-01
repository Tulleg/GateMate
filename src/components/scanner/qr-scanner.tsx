"use client";

import { useState, useCallback } from "react";
import {
  Camera,
  SwitchCamera,
  VideoOff,
  RefreshCw,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  Smartphone,
} from "lucide-react";
import { useQrScanner } from "@/hooks/use-qr-scanner";
import { triggerScanFeedback, FeedbackType } from "@/lib/scan-feedback";
import { Button } from "@/components/ui/button";

export interface ScanResultPayload {
  status: "idle" | "success" | "duplicate" | "error";
  message: string;
  ticket?: {
    id: string;
    attendeeName: string;
    attendeeEmail: string;
    tierName: string;
    checkedInAt?: string;
  };
}

export interface QrScannerProps {
  onVerifyToken: (token: string) => Promise<ScanResultPayload>;
  autoStart?: boolean;
}

export function QrScanner({ onVerifyToken, autoStart = false }: QrScannerProps) {
  const [lastFeedback, setLastFeedback] = useState<FeedbackType | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [latestResult, setLatestResult] = useState<ScanResultPayload | null>(null);

  const handleScanSuccess = useCallback(
    async (decodedText: string) => {
      if (verifying) return;

      setVerifying(true);
      try {
        const result = await onVerifyToken(decodedText);
        setLatestResult(result);

        let feedback: FeedbackType = "error";
        if (result.status === "success") {
          feedback = "success";
        } else if (result.status === "duplicate") {
          feedback = "duplicate";
        }

        setLastFeedback(feedback);
        triggerScanFeedback(feedback);

        // Reset visual flash feedback after 2 seconds
        setTimeout(() => {
          setLastFeedback(null);
        }, 2000);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Fehler bei der Ticket-Verifizierung.";
        setLatestResult({ status: "error", message: msg });
        setLastFeedback("error");
        triggerScanFeedback("error");
        setTimeout(() => setLastFeedback(null), 2000);
      } finally {
        setVerifying(false);
      }
    },
    [onVerifyToken, verifying]
  );

  const {
    scanning,
    cameraInitializing,
    cameraError,
    facingMode,
    hasCameraPermission,
    availableCameras,
    activeCameraId,
    startScanner,
    stopScanner,
    toggleFacingMode,
    switchCamera,
    clearError,
  } = useQrScanner({
    containerId: "qr-reader-container",
    onScanSuccess: handleScanSuccess,
    debounceMs: 2500,
  });

  return (
    <div className="space-y-4">
      {/* Visual Feedback Overlay Wrapper */}
      <div
        className={`relative rounded-3xl overflow-hidden bg-slate-900 border transition-all duration-300 shadow-2xl ${
          lastFeedback === "success"
            ? "border-emerald-500 bg-emerald-950/30 ring-4 ring-emerald-500/40 scale-[1.01]"
            : lastFeedback === "duplicate"
            ? "border-amber-500 bg-amber-950/30 ring-4 ring-amber-500/40 scale-[1.01]"
            : lastFeedback === "error"
            ? "border-rose-500 bg-rose-950/30 ring-4 ring-rose-500/40 scale-[1.01]"
            : "border-slate-800"
        }`}
      >
        {/* Scanner Viewfinder Box */}
        <div className="relative aspect-square max-w-md mx-auto flex flex-col items-center justify-center bg-slate-950/90 overflow-hidden">
          {/* HTML5 QR Code Container Mount Point */}
          <div
            id="qr-reader-container"
            className={`w-full h-full overflow-hidden ${!scanning ? "hidden" : "block"}`}
          />

          {/* Idle / Unstarted Camera State */}
          {!scanning && !cameraInitializing && (
            <div className="p-6 text-center space-y-4 max-w-xs">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/10">
                <Camera className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-white font-bold text-base">Einlass-Kamera Bereit</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Starte den Kamera-Stream, um QR-Codes von Tickets in Echtzeit zu scannen.
                </p>
              </div>
              <Button
                onClick={() => startScanner()}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3 rounded-2xl shadow-xl shadow-indigo-600/20"
              >
                <Camera className="w-4 h-4 mr-2" /> Kamera-Stream Starten
              </Button>
            </div>
          )}

          {/* Camera Initializing Loader */}
          {cameraInitializing && (
            <div className="p-6 text-center space-y-3">
              <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mx-auto" />
              <p className="text-xs text-slate-300 font-medium">Initialisiere Kamera-Hardware...</p>
            </div>
          )}

          {/* Verification Spinner Overlay */}
          {verifying && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-30 flex flex-col items-center justify-center text-white space-y-2 animate-fade-in">
              <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
              <span className="text-xs font-semibold text-emerald-300">Prüfe Ticket-Krypto...</span>
            </div>
          )}

          {/* Live Scanner Controls Overlay when scanning */}
          {scanning && !cameraInitializing && (
            <div className="absolute top-3 right-3 left-3 z-20 flex items-center justify-between pointer-events-auto">
              <span className="px-3 py-1 rounded-full bg-slate-900/90 text-[11px] font-semibold text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Live Scanning
              </span>

              <div className="flex items-center gap-2">
                {availableCameras.length > 1 && (
                  <button
                    onClick={toggleFacingMode}
                    title="Kamera wechseln (Vorne / Hinten)"
                    className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700/80 transition-colors backdrop-blur-md min-h-[44px] min-w-[44px] flex items-center justify-center"
                  >
                    <SwitchCamera className="w-5 h-5" />
                  </button>
                )}
                <button
                  onClick={stopScanner}
                  title="Kamera stoppen"
                  className="p-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 transition-colors backdrop-blur-md min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <VideoOff className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Camera Permission / Error Alert Box */}
        {cameraError && (
          <div className="p-4 bg-rose-950/40 border-t border-rose-800/40 text-rose-300 text-xs space-y-3">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-white font-semibold mb-0.5">Kamera-Fehler:</strong>
                <p className="leading-relaxed">{cameraError}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  clearError();
                  startScanner();
                }}
                className="text-xs border-rose-700 text-rose-200 hover:bg-rose-900/50"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Erneut versuchen
              </Button>
            </div>
          </div>
        )}

        {/* Mobile Camera Switcher Dropdown (if multiple cameras detected) */}
        {scanning && availableCameras.length > 1 && (
          <div className="p-3 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between text-xs px-4">
            <span className="text-slate-400 font-medium">Aktive Kamera:</span>
            <select
              value={activeCameraId || ""}
              onChange={(e) => switchCamera(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
            >
              {availableCameras.map((cam) => (
                <option key={cam.id} value={cam.id}>
                  {cam.label || `Kamera ${cam.id.slice(0, 6)}...`}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Immediate Visual Result Card */}
      {latestResult && (
        <div
          className={`p-5 rounded-2xl border transition-all duration-300 shadow-lg ${
            latestResult.status === "success"
              ? "bg-emerald-950/30 border-emerald-500/50 text-emerald-200"
              : latestResult.status === "duplicate"
              ? "bg-amber-950/30 border-amber-500/50 text-amber-200"
              : "bg-rose-950/30 border-rose-500/50 text-rose-200"
          }`}
        >
          <div className="flex items-start gap-3">
            {latestResult.status === "success" && (
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
            )}
            {latestResult.status === "duplicate" && (
              <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
            )}
            {latestResult.status === "error" && (
              <XCircle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
            )}

            <div className="space-y-1 text-xs">
              <h4 className="font-bold text-sm text-white">{latestResult.message}</h4>
              {latestResult.ticket && (
                <div className="pt-2 text-slate-300 space-y-1">
                  <p>
                    <strong className="text-white font-semibold">Gast:</strong>{" "}
                    {latestResult.ticket.attendeeName} ({latestResult.ticket.attendeeEmail})
                  </p>
                  <p>
                    <strong className="text-white font-semibold">Kategorie:</strong>{" "}
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-indigo-300 font-mono text-[11px]">
                      {latestResult.ticket.tierName}
                    </span>
                  </p>
                  {latestResult.ticket.checkedInAt && (
                    <p className="text-[11px] text-slate-400">
                      Eingecheckt um: {new Date(latestResult.ticket.checkedInAt).toLocaleTimeString("de-DE")}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
