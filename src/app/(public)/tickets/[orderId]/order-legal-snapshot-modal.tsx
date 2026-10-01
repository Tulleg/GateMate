"use client";

import { useState } from "react";
import { FileText, ShieldCheck, Scale, Hash, X, BookOpen, Layers, CheckCircle2 } from "lucide-react";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";

interface OrderLegalSnapshotModalProps {
  orderId: string;
  rawSnapshot: string | null;
}

export function OrderLegalSnapshotModal({ orderId, rawSnapshot }: OrderLegalSnapshotModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"organizer" | "platform" | "modules">("organizer");

  if (!rawSnapshot) return null;

  let snapshot: any = null;
  try {
    snapshot = typeof rawSnapshot === "string" ? JSON.parse(rawSnapshot) : rawSnapshot;
  } catch (e) {
    console.error("Failed to parse document snapshot", e);
    return null;
  }

  const purchasedAtFormatted = snapshot.purchasedAt
    ? new Date(snapshot.purchasedAt).toLocaleString("de-DE")
    : "Kaufzeitpunkt";

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="px-4 py-2.5 rounded-2xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 text-xs font-bold flex items-center justify-center gap-2 transition-all print:hidden min-h-[44px]"
      >
        <FileText className="w-4 h-4 text-indigo-400" />
        <span>Geltende Rechtstexte zum Kaufzeitpunkt einsehen</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full p-4 sm:p-8 space-y-6 shadow-2xl max-h-[90dvh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 shrink-0">
              <div>
                <h3 className="font-extrabold text-xl text-white flex items-center gap-2">
                  <Scale className="w-5 h-5 text-indigo-400" /> Kaufvertragliche Rechtstexte
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Bestellung <span className="font-mono text-indigo-400">{orderId}</span> &bull; Akzeptiert am {purchasedAtFormatted}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Snapshot Tabs */}
            <div className="flex border-b border-slate-800 gap-2 shrink-0 text-xs">
              <button
                onClick={() => setActiveTab("organizer")}
                className={`px-4 py-2 font-bold rounded-t-xl transition-colors flex items-center gap-2 border-b-2 ${
                  activeTab === "organizer"
                    ? "border-indigo-500 text-indigo-400 bg-slate-950/50"
                    : "border-transparent text-slate-400 hover:text-white"
                }`}
              >
                <BookOpen className="w-4 h-4" /> Veranstalter-Dokumente
              </button>
              <button
                onClick={() => setActiveTab("platform")}
                className={`px-4 py-2 font-bold rounded-t-xl transition-colors flex items-center gap-2 border-b-2 ${
                  activeTab === "platform"
                    ? "border-indigo-500 text-indigo-400 bg-slate-950/50"
                    : "border-transparent text-slate-400 hover:text-white"
                }`}
              >
                <ShieldCheck className="w-4 h-4" /> Plattform-Dokumente
              </button>
              {snapshot.moduleDetails && (
                <button
                  onClick={() => setActiveTab("modules")}
                  className={`px-4 py-2 font-bold rounded-t-xl transition-colors flex items-center gap-2 border-b-2 ${
                    activeTab === "modules"
                      ? "border-indigo-500 text-indigo-400 bg-slate-950/50"
                      : "border-transparent text-slate-400 hover:text-white"
                  }`}
                >
                  <Layers className="w-4 h-4" /> Rechtsmodule
                </button>
              )}
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto space-y-6 pr-2">
              {/* TAB: ORGANIZER DOCS */}
              {activeTab === "organizer" && (
                <div className="space-y-4">
                  {/* Seller info snapshot */}
                  {snapshot.organizer && (
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                      <p className="font-bold text-white">Vertragspartner / Aussteller zum Kaufzeitpunkt:</p>
                      <p className="text-slate-300 font-semibold">{snapshot.organizer.legalName}</p>
                      <p className="text-slate-400">
                        {[
                          snapshot.organizer.legalForm,
                          snapshot.organizer.street,
                          snapshot.organizer.zip && snapshot.organizer.city
                            ? `${snapshot.organizer.zip} ${snapshot.organizer.city}`
                            : null,
                          snapshot.organizer.country,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    </div>
                  )}

                  {snapshot.organizerDocuments ? (
                    Object.entries(snapshot.organizerDocuments).map(([typeKey, doc]: [string, any]) => (
                      <div key={typeKey} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-sm text-white flex items-center gap-2">
                            <FileText className="w-4 h-4 text-indigo-400" /> {doc.title || typeKey}
                          </h4>
                          <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono text-[10px] font-bold">
                            Version {doc.version}
                          </span>
                        </div>

                        {doc.content ? (
                          <div className="p-3 rounded-xl bg-slate-900 text-xs leading-relaxed max-h-48 overflow-y-auto">
                            <MarkdownRenderer content={doc.content} />
                          </div>
                        ) : doc.url ? (
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-indigo-400 underline font-mono block"
                          >
                            {doc.url}
                          </a>
                        ) : (
                          <p className="text-xs text-slate-500 italic">Keine expliziten Zusatzangaben.</p>
                        )}

                        {doc.hash && (
                          <div className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                            <Hash className="w-3 h-3 text-indigo-400" /> SHA-256 Hash: {doc.hash}
                          </div>
                        )}
                      </div>
                    ))
                  ) : snapshot.documents ? (
                    // Legacy structure fallback
                    Object.entries(snapshot.documents).map(([typeKey, doc]: [string, any]) => (
                      <div key={typeKey} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-sm text-white capitalize">{typeKey}</h4>
                          <span className="font-mono text-xs text-indigo-400">Version {doc.version}</span>
                        </div>
                        {doc.content && (
                          <div className="p-3 rounded-xl bg-slate-900 text-xs leading-relaxed max-h-48 overflow-y-auto">
                            <MarkdownRenderer content={doc.content} />
                          </div>
                        )}
                      </div>
                    ))
                  ) : null}
                </div>
              )}

              {/* TAB: PLATFORM DOCS */}
              {activeTab === "platform" && (
                <div className="space-y-4">
                  {snapshot.platformDocuments ? (
                    Object.entries(snapshot.platformDocuments).map(([typeKey, doc]: [string, any]) => (
                      <div key={typeKey} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-sm text-white flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-emerald-400" /> {doc.title || typeKey}
                          </h4>
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono text-[10px] font-bold">
                            Version {doc.version}
                          </span>
                        </div>

                        {doc.content && (
                          <div className="p-3 rounded-xl bg-slate-900 text-xs leading-relaxed max-h-48 overflow-y-auto">
                            <MarkdownRenderer content={doc.content} />
                          </div>
                        )}

                        {doc.hash && (
                          <div className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                            <Hash className="w-3 h-3 text-indigo-400" /> SHA-256 Hash: {doc.hash}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-400">
                      Standard Plattform-Bedingungen von GateMate (Vermittler &amp; technischer Dienstleister).
                    </div>
                  )}
                </div>
              )}

              {/* TAB: MODULES */}
              {activeTab === "modules" && snapshot.moduleDetails && (
                <div className="space-y-4">
                  {Object.entries(snapshot.moduleDetails).map(([modKey, mod]: [string, any]) => (
                    <div key={modKey} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                      <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs">
                        <CheckCircle2 className="w-4 h-4" /> {mod.label}
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed font-sans">{mod.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-800 pt-4 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/30"
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
