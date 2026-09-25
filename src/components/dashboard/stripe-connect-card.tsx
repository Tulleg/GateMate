"use client";

import { useState } from "react";
import { CreditCard, CheckCircle2, ArrowRight, Loader2 } from "lucide-react";

interface StripeConnectCardProps {
  userId: string;
  isConnected: boolean;
  accountId?: string | null;
}

export function StripeConnectCard({ userId, isConnected, accountId }: StripeConnectCardProps) {
  const [loading, setLoading] = useState(false);

  const handleConnectStripe = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Failed to initiate Stripe Express onboarding.");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
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
              Stripe Connect Ready
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                Express Payouts Active
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Ticket payouts are automatically deposited to connected account <code className="text-emerald-300 font-mono">{accountId}</code>.
            </p>
          </div>
        </div>
        <button
          onClick={handleConnectStripe}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition-colors self-start sm:self-auto"
        >
          {loading ? "Redirecting..." : "Manage Stripe Dashboard"}
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-900 border border-indigo-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
          <CreditCard className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-white">Setup Direct Payouts with Stripe Connect</h3>
          <p className="text-xs text-slate-400 mt-1">
            Connect your bank account via Stripe Express to receive instant payouts from ticket sales.
          </p>
        </div>
      </div>
      <button
        onClick={handleConnectStripe}
        disabled={loading}
        className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-all self-start sm:self-auto"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> Redirecting to Stripe...
          </>
        ) : (
          <>
            Connect Stripe Express <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
    </div>
  );
}
