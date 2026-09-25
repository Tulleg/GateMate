"use client";

import { useState } from "react";
import Link from "next/link";
import { Ticket, ArrowLeft, KeyRound, CheckCircle2, AlertCircle, Send } from "lucide-react";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Simulate reset email link request / direct reset prompt
      await new Promise((resolve) => setTimeout(resolve, 800));
      setSubmitted(true);
    } catch (err: any) {
      setError("Fehler beim Anfordern des Passwort-Resets.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-slate-950 text-slate-50">
      <div className="w-full max-w-md space-y-6 bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-2xl">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Zurück zum Login
        </Link>

        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 mb-2">
            <KeyRound className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Passwort zurücksetzen</h2>
          <p className="text-xs text-slate-400">
            Geben Sie Ihre E-Mail-Adresse ein. Wir senden Ihnen Anweisungen zum Zurücksetzen Ihres Passworts.
          </p>
        </div>

        {submitted ? (
          <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800 text-center space-y-4">
            <div className="inline-flex p-3 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white">Reset-Anweisung versendet!</h3>
              <p className="text-xs text-slate-400">
                Falls ein Konto mit der E-Mail <span className="font-mono text-indigo-400">{email}</span> existiert, haben wir Anweisungen zum Festlegen eines neuen Passworts gesendet.
              </p>
            </div>
            <Link
              href="/login"
              className="inline-block w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
            >
              Zurück zur Anmeldung
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300">Ihre E-Mail-Adresse</label>
              <input
                type="email"
                required
                placeholder="organizer@beispiel.de"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
            >
              {loading ? "Sende..." : "Reset-Link anfordern"} <Send className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
