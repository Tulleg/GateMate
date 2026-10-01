"use client";

import { useState } from "react";
import { Copy, Check, Code, ExternalLink, X } from "lucide-react";

interface EmbedModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  eventSlug: string;
  eventTitle: string;
}

export function EmbedModal({ isOpen, onClose, eventId, eventSlug, eventTitle }: EmbedModalProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [activeTab, setActiveTab] = useState<"link" | "iframe">("link");

  if (!isOpen) return null;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const publicUrl = `${appUrl}/e/${eventSlug}`;
  const embedUrl = `${appUrl}/embed/${eventId}`;
  const iframeSnippet = `<iframe src="${embedUrl}" width="100%" height="480px" frameborder="0" style="border:none; border-radius: 12px; overflow:hidden;"></iframe>`;

  const copyToClipboard = (text: string, type: "link" | "embed") => {
    navigator.clipboard.writeText(text);
    if (type === "link") {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } else {
      setCopiedEmbed(true);
      setTimeout(() => setCopiedEmbed(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <h2 className="text-xl font-bold text-white">Event teilen &amp; einbetten</h2>
          <p className="text-xs text-slate-400 mt-1">
            Bewerben Sie <span className="text-indigo-400 font-semibold">{eventTitle}</span> mit direkten Checkout-Links oder Website-Widgets.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800 mb-6">
          <button
            onClick={() => setActiveTab("link")}
            className={`pb-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === "link"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            <ExternalLink className="w-4 h-4" /> Teilbarer Link
          </button>
          <button
            onClick={() => setActiveTab("iframe")}
            className={`pb-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === "iframe"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            <Code className="w-4 h-4" /> Einbettungs-Widget (&lt;iframe&gt;)
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "link" ? (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-300 mb-1.5 block">URL der öffentlichen Ticket-Seite</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={publicUrl}
                  className="flex-1 px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono focus:outline-none"
                />
                <button
                  onClick={() => copyToClipboard(publicUrl, "link")}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center gap-1.5 transition-colors"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-4 h-4" /> Kopiert!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" /> Kopieren
                    </>
                  )}
                </button>
              </div>
            </div>
            <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800/80 text-[11px] text-slate-400">
              Teilen Sie diese URL direkt in Social-Media-Posts, E-Mail-Newslettern oder Marketingkampagnen.
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-300 mb-1.5 block">HTML-Iframe-Code zum Einbetten</label>
              <div className="relative">
                <textarea
                  readOnly
                  rows={3}
                  value={iframeSnippet}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-indigo-300 font-mono focus:outline-none resize-none"
                />
                <button
                  onClick={() => copyToClipboard(iframeSnippet, "embed")}
                  className="absolute bottom-3 right-3 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center gap-1 transition-colors"
                >
                  {copiedEmbed ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> Code kopiert!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Code kopieren
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Preview Box */}
            <div>
              <label className="text-xs font-medium text-slate-400 mb-1.5 block">Live-Vorschau des Widgets</label>
              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950 h-36 relative">
                <iframe src={embedUrl} className="w-full h-full border-0 pointer-events-none opacity-90"></iframe>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
