"use client";

import { useActionState } from "react";
import { Send, CheckCircle2, AlertCircle } from "lucide-react";
import { submitContactForm } from "@/app/actions/contact";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ActionResult } from "@/types";

export function ContactForm() {
  const [state, formAction, isPending] = useActionState<ActionResult<{ messageId: string }>, FormData>(
    async (_prevState, formData) => {
      return await submitContactForm(formData);
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

      <form action={formAction} className="space-y-5 text-xs sm:text-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-300 block">Dein Name *</label>
            <Input
              type="text"
              name="name"
              required
              placeholder="Vor- und Nachname"
              error={Boolean(fieldErrors?.name)}
            />
            {fieldErrors?.name && (
              <p className="text-xs text-rose-400">{fieldErrors.name[0]}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-300 block">Deine E-Mail-Adresse *</label>
            <Input
              type="email"
              name="email"
              required
              placeholder="deine.email@domain.de"
              error={Boolean(fieldErrors?.email)}
            />
            {fieldErrors?.email && (
              <p className="text-xs text-rose-400">{fieldErrors.email[0]}</p>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="font-semibold text-slate-300 block">Kategorie der Anfrage *</label>
          <select
            name="category"
            className="w-full h-11 px-4 py-2.5 rounded-xl bg-slate-900/60 border border-slate-700/80 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="general">Allgemeine Anfrage / Plattform-Software</option>
            <option value="organizer_support">Veranstalter Support & Onboarding</option>
            <option value="buyer_support">Technisches Problem mit der Webseite / Plattform</option>
            <option value="billing">Abrechnung & Stripe Payments (Veranstalter)</option>
            <option value="legal_dsa">Rechtliches & Datenschutz</option>
            <option value="other">Sonstiges</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="font-semibold text-slate-300 block">Betreff *</label>
          <Input
            type="text"
            name="subject"
            required
            placeholder="Kurze Zusammenfassung deines Anliegens"
            error={Boolean(fieldErrors?.subject)}
          />
          {fieldErrors?.subject && (
            <p className="text-xs text-rose-400">{fieldErrors.subject[0]}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="font-semibold text-slate-300 block">Nachricht *</label>
          <textarea
            name="message"
            rows={5}
            required
            placeholder="Beschreibe dein Anliegen so detailliert wie möglich..."
            className="w-full px-4 py-2.5 rounded-xl bg-slate-900/60 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-sans"
          />
          {fieldErrors?.message && (
            <p className="text-xs text-rose-400">{fieldErrors.message[0]}</p>
          )}
        </div>

        <Button type="submit" isLoading={isPending} className="w-full">
          <Send className="w-4 h-4 mr-2" /> Nachricht absenden
        </Button>
      </form>
    </div>
  );
}
