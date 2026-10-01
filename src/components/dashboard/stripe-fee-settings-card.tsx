"use client";

import { useState } from "react";
import { Percent, Settings, Save, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { updatePlatformFeeAction } from "@/app/actions/admin-settings-actions";

interface StripeFeeSettingsCardProps {
  initialFeePercent: number;
}

export function StripeFeeSettingsCard({ initialFeePercent }: StripeFeeSettingsCardProps) {
  const [feePercent, setFeePercent] = useState<string>(initialFeePercent.toString());
  const [currentDisplayFee, setCurrentDisplayFee] = useState<number>(initialFeePercent);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const parsed = parseFloat(feePercent.replace(",", "."));
    if (isNaN(parsed) || parsed < 0 || parsed > 100) {
      setErrorMsg("Bitte gib eine gültige Prozentzahl zwischen 0 und 100 ein.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await updatePlatformFeeAction(parsed);
      if (res.success) {
        const newFee = res.data?.feePercent ?? parsed;
        setCurrentDisplayFee(newFee);
        setFeePercent(newFee.toString());
        setSuccessMsg(`Stripe-Plattformgebühr erfolgreich auf ${newFee}% aktualisiert.`);
        setIsEditing(false);
      } else {
        setErrorMsg(res.error);
      }


    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Ein unerwarteter Fehler ist aufgetreten.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Percent className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Stripe-Plattformgebühr</h3>
            <p className="text-xs text-slate-400">Prozentualer Einbehalt bei Ticketverkäufen</p>
          </div>
        </div>

        {!isEditing && (
          <button
            onClick={() => {
              setIsEditing(true);
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-semibold border border-slate-700 transition-colors flex items-center gap-1.5"
          >
            <Settings className="w-3.5 h-3.5 text-indigo-400" /> Bearbeiten
          </button>
        )}
      </div>

      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {isEditing ? (
        <form onSubmit={handleSave} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
          <div className="relative flex-1">
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={feePercent}
              onChange={(e) => setFeePercent(e.target.value)}
              placeholder="z.B. 5.0"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500 font-mono pr-8"
              disabled={isLoading}
              required
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">%</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Speichern
            </button>

            <button
              type="button"
              disabled={isLoading}
              onClick={() => {
                setIsEditing(false);
                setFeePercent(currentDisplayFee.toString());
                setErrorMsg(null);
              }}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 font-semibold text-xs transition-colors"
            >
              Abbrechen
            </button>
          </div>
        </form>
      ) : (
        <div className="flex items-baseline gap-2 pt-1">
          <span className="text-3xl font-extrabold text-white font-mono">{currentDisplayFee.toFixed(2)}%</span>
          <span className="text-xs text-slate-400">Plattform-Gebühr (application_fee_amount)</span>
        </div>
      )}
    </div>
  );
}
