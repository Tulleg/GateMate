"use client";

import { useState } from "react";
import { Send, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { submitDsaReportForm } from "@/app/actions/contact";

export function DsaReportForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ success?: boolean; message?: string; error?: string } | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    const formData = new FormData(e.currentTarget);
    const res = await submitDsaReportForm(formData);

    setIsSubmitting(false);
    setFeedback(res);

    if (res.success) {
      (e.target as HTMLFormElement).reset();
    }
  }

  return (
    <div className="space-y-6">
      {feedback?.success && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs sm:text-sm flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-400" />
          <p>{feedback.message}</p>
        </div>
      )}

      {feedback?.error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs sm:text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-400" />
          <p>{feedback.error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 text-xs">
        <div className="space-y-4">
          <h2 className="text-base font-bold text-white border-b border-slate-800 pb-2">
            1. Angaben zur meldenden Person / Einrichtung
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300 block">Name / Name der Organisation *</label>
              <input
                type="text"
                name="name"
                required
                placeholder="Vor- und Nachname oder Behörde/Firma"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300 block">E-Mail-Adresse für Rückfragen *</label>
              <input
                type="email"
                name="email"
                required
                placeholder="name@domain.de"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-base font-bold text-white border-b border-slate-800 pb-2">
            2. Angaben zum gemeldeten Inhalt
          </h2>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300 block">Exakte URL der Eventseite / des Inhalts *</label>
              <input
                type="url"
                name="targetUrl"
                required
                placeholder="https://gatemate.io/e/event-slug"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300 block">Art des mutmaßlich rechtswidrigen Inhalts *</label>
              <select
                name="violationType"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Gefälschte Veranstaltung / Betrugsverdacht">Gefälschte Veranstaltung / Betrugsverdacht</option>
                <option value="Urheberrechts- oder Markenrechtsverletzung">Urheberrechts- oder Markenrechtsverletzung</option>
                <option value="Jugendschutzverstoß / Unzulässige Inhalte">Jugendschutzverstoß / Unzulässige Inhalte</option>
                <option value="Persönlichkeitsrechtsverletzung / Beleidigung">Persönlichkeitsrechtsverletzung / Beleidigung</option>
                <option value="Sonstiger rechtswidriger Inhalt">Sonstiger rechtswidriger Inhalt</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300 block">Begründung der Rechtswidrigkeit *</label>
              <textarea
                name="legalReason"
                rows={5}
                required
                placeholder="Bitte erläutern Sie genau, aus welchen Gründen Sie den Inhalt für rechtswidrig halten..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-sans"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-base font-bold text-white border-b border-slate-800 pb-2">
            3. Erklärungen &amp; Absenden
          </h2>
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="dsaDeclaration"
                required
                className="mt-0.5 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-900 border-slate-700"
              />
              <span className="text-slate-300 text-[11px] leading-relaxed">
                Ich erkläre in gutem Glauben, dass die in dieser Meldung enthaltenen Informationen und Angaben genau und vollständig sind.
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-extrabold text-sm shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Meldung wird eingereicht...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" /> Meldung gemäß Art. 16 DSA einreichen
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
