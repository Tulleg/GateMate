"use client";

import { useState } from "react";
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Building2,
  CreditCard,
  MapPin,
  Ticket,
  FileText,
  Loader2,
  X,
  Lock,
} from "lucide-react";
import Link from "next/link";
import { EventPublicationValidationResult } from "@/lib/validation";

interface PublishLegalChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmPublish: () => void;
  validation: EventPublicationValidationResult | null;
  loading: boolean;
}

export function PublishLegalChecklistModal({
  isOpen,
  onClose,
  onConfirmPublish,
  validation,
  loading,
}: PublishLegalChecklistModalProps) {
  const [confirmedAffirmation, setConfirmedAffirmation] = useState(false);

  if (!isOpen) return null;

  const canPublish = validation?.canPublish ?? false;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "organizer":
        return <Building2 className="w-4 h-4" />;
      case "payment":
        return <CreditCard className="w-4 h-4" />;
      case "event":
        return <MapPin className="w-4 h-4" />;
      case "tickets":
        return <Ticket className="w-4 h-4" />;
      case "legal":
        return <FileText className="w-4 h-4" />;
      default:
        return <ShieldCheck className="w-4 h-4" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl space-y-0 flex flex-col max-h-[90dvh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Rechtliche Veröffentlichungs-Checkliste
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Prüfung aller erforderlichen Veranstalter-, Event- &amp; Ticketangaben vor der Freischaltung
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Status Banner */}
          {canPublish ? (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm">Event zur Veröffentlichung bereit!</p>
                <p className="text-emerald-300/80 text-[11px] mt-0.5">
                  Alle gesetzlichen &amp; technischen Voraussetzungen sind erfüllt. Bitte bestätigen Sie noch die Haftungserklärung unten.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm">Veröffentlichung blockiert (Publication Guard)</p>
                <p className="text-amber-300/80 text-[11px] mt-0.5">
                  Es fehlen noch erforderliche Pflichtangaben. Bitte vervollständigen Sie die rot markierten Bereiche.
                </p>
              </div>
            </div>
          )}

          {/* Checklist Items */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">
              Prüfkriterien Status
            </h3>

            {validation?.checklist.map((item) => (
              <div
                key={item.id}
                className={`p-4 rounded-2xl border flex items-start justify-between gap-3 transition-all ${
                  item.status === "passed"
                    ? "bg-slate-950/60 border-slate-800 text-slate-200"
                    : "bg-red-950/20 border-red-800/40 text-red-300"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-xl border shrink-0 mt-0.5 ${
                      item.status === "passed"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-red-500/10 text-red-400 border-red-500/20"
                    }`}
                  >
                    {getCategoryIcon(item.category)}
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-xs text-white">{item.title}</p>
                    <p className="text-[11px] text-slate-400">{item.description}</p>
                    {item.details && (
                      <p
                        className={`text-[10px] font-semibold ${
                          item.status === "passed" ? "text-emerald-400/90" : "text-red-400"
                        }`}
                      >
                        {item.details}
                      </p>
                    )}
                  </div>
                </div>

                <div className="shrink-0">
                  {item.status === "passed" ? (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold text-[10px] flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Erfüllt
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 font-bold text-[10px] flex items-center gap-1">
                      <XCircle className="w-3.5 h-3.5" /> Fehlt
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Quick link to legal profile if missing */}
          {!canPublish && (
            <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-800/40 flex items-center justify-between">
              <span className="text-slate-300 font-medium">Rechtsprofil-Einstellungen öffnen:</span>
              <Link
                href="/organizer/settings/legal"
                target="_blank"
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors shadow-lg shadow-indigo-600/20"
              >
                Rechtsprofil bearbeiten
              </Link>
            </div>
          )}

          {/* Mandatory Affirmation Checkbox (Requirement 8) */}
          {canPublish && (
            <div className="p-4 rounded-2xl bg-slate-950 border border-indigo-500/30 space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmedAffirmation}
                  onChange={(e) => setConfirmedAffirmation(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-900 border-slate-700 shrink-0"
                />
                <span className="text-xs text-slate-200 leading-relaxed font-semibold">
                  &quot;Ich bin für die Richtigkeit und Rechtmäßigkeit der von mir bereitgestellten Veranstaltungs-, Preis-, Ticket- und Rechtstexte verantwortlich.&quot; *
                </span>
              </label>
              <p className="text-[10px] text-slate-400 leading-relaxed pl-7">
                Durch das Aktivieren bestätigen Sie gemäß Vertrages mit GateMate die Vollständigkeit und wettbewerbsrechtliche Konformität Ihrer Angaben.
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-slate-800 flex items-center justify-between bg-slate-950/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
          >
            Abbrechen
          </button>

          <button
            type="button"
            disabled={!canPublish || !confirmedAffirmation || loading}
            onClick={onConfirmPublish}
            className={`px-6 py-2.5 rounded-xl font-bold text-xs shadow-xl flex items-center gap-2 transition-all ${
              canPublish && confirmedAffirmation && !loading
                ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30"
                : "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Veröffentliche Event...
              </>
            ) : !canPublish ? (
              <>
                <Lock className="w-4 h-4 text-slate-500" /> Veröffentlichung blockiert
              </>
            ) : !confirmedAffirmation ? (
              <>
                <Lock className="w-4 h-4 text-slate-500" /> Bitte Haftung bestätigen
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" /> Verbindlich Veröffentlichen
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
