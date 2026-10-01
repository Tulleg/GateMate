"use client";

import { useState } from "react";
import Link from "next/link";
import { CreditCard, CheckCircle2, ArrowRight, Loader2, AlertCircle, Settings } from "lucide-react";

interface StripeConnectCardProps {
  userId: string;
  isConnected: boolean;
  accountId?: string | null;
}

export function StripeConnectCard({ userId, isConnected, accountId }: StripeConnectCardProps) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleConnectStripe = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/stripe/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (data.url) {
        window.open(data.url, "_blank", "noopener,noreferrer");
      } else {
        setErrorMsg(data.error || "Onboarding konnte nicht gestartet werden.");
      }
    } catch (err: any) {
      setErrorMsg("Fehler: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (isConnected) {
    return (
      <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/40 to-slate-900 border border-emerald-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              Stripe Connect Bereit
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                Express Payouts Aktiv
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Ticket-Auszahlungen werden automatisch auf Ihr verbundenes Konto <code className="text-emerald-300 font-mono">{accountId}</code> überwiesen.
            </p>
          </div>
        </div>
        <button
          onClick={handleConnectStripe}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition-colors self-start sm:self-auto"
        >
          {loading ? "Weiterleiten..." : "Stripe Dashboard verwalten"}
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-900 border border-indigo-800/40 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">Direkte Auszahlungen mit Stripe Connect</h3>
            <p className="text-xs text-slate-400 mt-1">
              Verknüpfen Sie Ihr Bankkonto via Stripe Express für direkte Ticket-Auszahlungen.
            </p>
          </div>
        </div>
        <button
          onClick={handleConnectStripe}
          disabled={loading}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-all self-start sm:self-auto shrink-0"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Verbinde mit Stripe...
            </>
          ) : (
            <>
              Stripe Express verbinden <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p>{errorMsg}</p>
            <Link
              href="/organizer/settings"
              className="inline-flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 font-semibold underline text-[11px]"
            >
              <Settings className="w-3.5 h-3.5" /> In den Einstellungen eigene Stripe-Keys eingeben
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
