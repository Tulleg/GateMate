"use client";

import { useActionState } from "react";
import { Send, CheckCircle2, AlertCircle } from "lucide-react";
import { submitDsaReportForm } from "@/app/actions/contact";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ActionResult } from "@/types";

export function DsaReportForm() {
  const [state, formAction, isPending] = useActionState<ActionResult<{ messageId: string }>, FormData>(
    async (_prevState, formData) => {
      return await submitDsaReportForm(formData);
    },
    { success: false, error: "" }
  );

  const fieldErrors = !state.success ? state.fieldErrors : undefined;

  return (
    <div className="space-y-6">
      {state.success && state.message && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs sm:text-sm flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-400" />
          <p>{state.message}</p>
        </div>
      )}

      {!state.success && state.error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs sm:text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-400" />
          <p>{state.error}</p>
        </div>
      )}

      <form action={formAction} className="space-y-6 text-xs">
        <div className="space-y-4">
          <h2 className="text-base font-bold text-white border-b border-slate-800 pb-2">
            1. Angaben zur meldenden Person / Einrichtung
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300 block">Name / Name der Organisation *</label>
              <Input
                type="text"
                name="name"
                required
                placeholder="Vor- und Nachname oder Behörde/Firma"
                error={Boolean(fieldErrors?.name)}
              />
              {fieldErrors?.name && (
                <p className="text-xs text-rose-400">{fieldErrors.name[0]}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300 block">E-Mail-Adresse für Rückfragen *</label>
              <Input
                type="email"
                name="email"
                required
                placeholder="name@domain.de"
                error={Boolean(fieldErrors?.email)}
              />
              {fieldErrors?.email && (
                <p className="text-xs text-rose-400">{fieldErrors.email[0]}</p>
              )}
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
              <Input
                type="url"
                name="targetUrl"
                required
                placeholder="https://gatemate.io/e/event-slug"
                error={Boolean(fieldErrors?.targetUrl)}
              />
              {fieldErrors?.targetUrl && (
                <p className="text-xs text-rose-400">{fieldErrors.targetUrl[0]}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300 block">Art des mutmaßlich rechtswidrigen Inhalts *</label>
              <select
                name="violationType"
                className="w-full h-11 px-4 py-2.5 rounded-xl bg-slate-900/60 border border-slate-700/80 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900/60 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-sans"
              />
              {fieldErrors?.legalReason && (
                <p className="text-xs text-rose-400">{fieldErrors.legalReason[0]}</p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-base font-bold text-white border-b border-slate-800 pb-2">
            3. Erklärungen & Absenden
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

          <Button type="submit" isLoading={isPending} className="w-full py-4 text-sm font-extrabold">
            <Send className="w-4 h-4 mr-2" /> Meldung gemäß Art. 16 DSA einreichen
          </Button>
        </div>
      </form>
    </div>
  );
}
