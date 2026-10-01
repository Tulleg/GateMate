"use client";

import { useState } from "react";
import { Send, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { submitContactForm } from "@/app/actions/contact";

export function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ success?: boolean; message?: string; error?: string } | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    const formData = new FormData(e.currentTarget);
    const res = await submitContactForm(formData);

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

      <form onSubmit={handleSubmit} className="space-y-5 text-xs sm:text-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-300 block">Dein Name *</label>
            <input
              type="text"
              name="name"
              required
              placeholder="Vor- und Nachname"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-slate-300 block">Deine E-Mail-Adresse *</label>
            <input
              type="email"
              name="email"
              required
              placeholder="deine.email@domain.de"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="font-semibold text-slate-300 block">Kategorie der Anfrage *</label>
          <select
            name="category"
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="general">Allgemeine Anfrage / Fragen zur Plattform</option>
            <option value="organizer_support">Veranstalter Support & Onboarding</option>
            <option value="buyer_support">Ticketkäufer Fragen & Hilfe</option>
            <option value="billing">Abrechnung & Stripe Payments</option>
            <option value="legal_dsa">Rechtliches & Datenschutz</option>
            <option value="other">Sonstiges</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="font-semibold text-slate-300 block">Betreff *</label>
          <input
            type="text"
            name="subject"
            required
            placeholder="Kurze Zusammenfassung deines Anliegens"
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="space-y-1.5">
          <label className="font-semibold text-slate-300 block">Nachricht *</label>
          <textarea
            name="message"
            rows={5}
            required
            placeholder="Beschreibe dein Anliegen so detailliert wie möglich..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-sans"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-extrabold text-sm shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Nachricht wird gesendet...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" /> Nachricht absenden
            </>
          )}
        </button>
      </form>
    </div>
  );
}
