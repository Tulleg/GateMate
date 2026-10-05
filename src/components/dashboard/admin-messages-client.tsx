"use client";

import { useState } from "react";
import {
  Inbox,
  ShieldAlert,
  Mail,
  CheckCircle2,
  Clock,
  Archive,
  ExternalLink,
  MessageSquare,
  User,
  AlertTriangle,
  Search,
  Filter,
  ChevronRight,
  Send,
  Loader2,
  Check,
  CornerDownRight,
  MessageCircleReply,
} from "lucide-react";
import { updateMessageStatus, replyToContactMessage, ContactReplyItem } from "@/app/actions/contact";

export interface ContactMessageItem {
  id: string;
  type: "general" | "dsa_notice";
  name: string;
  email: string;
  category: "general" | "organizer_support" | "buyer_support" | "billing" | "legal_dsa" | "other";
  subject: string;
  message: string;
  targetUrl: string | null;
  violationType: string | null;
  legalReason: string | null;
  dsaDeclaration: boolean | null;
  status: "new" | "in_progress" | "replied" | "archived";
  adminNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export function AdminMessagesClient({
  initialMessages,
  initialReplies = {},
}: {
  initialMessages: ContactMessageItem[];
  initialReplies?: Record<string, ContactReplyItem[]>;
}) {
  const [messages, setMessages] = useState<ContactMessageItem[]>(initialMessages);
  const [repliesMap, setRepliesMap] = useState<Record<string, ContactReplyItem[]>>(initialReplies);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessageItem | null>(
    initialMessages.length > 0 ? initialMessages[0] : null
  );
  const [filter, setFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [adminNotesInput, setAdminNotesInput] = useState(selectedMessage?.adminNotes || "");
  const [replyInput, setReplyInput] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [replyFeedback, setReplyFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const filteredMessages = messages.filter((msg) => {
    // Filter by tab
    if (filter === "new" && msg.status !== "new") return false;
    if (filter === "dsa" && msg.type !== "dsa_notice") return false;
    if (filter === "in_progress" && msg.status !== "in_progress") return false;
    if (filter === "replied" && msg.status !== "replied") return false;
    if (filter === "archived" && msg.status !== "archived") return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        msg.name.toLowerCase().includes(q) ||
        msg.email.toLowerCase().includes(q) ||
        msg.subject.toLowerCase().includes(q) ||
        msg.message.toLowerCase().includes(q)
      );
    }

    return true;
  });

  const handleSelectMessage = (msg: ContactMessageItem) => {
    setSelectedMessage(msg);
    setAdminNotesInput(msg.adminNotes || "");
    setReplyInput("");
    setReplyFeedback(null);
  };

  const handleStatusChange = async (newStatus: "new" | "in_progress" | "replied" | "archived") => {
    if (!selectedMessage) return;
    setIsUpdating(true);

    const res = await updateMessageStatus(selectedMessage.id, newStatus, adminNotesInput);
    setIsUpdating(false);

    if (res.success) {
      const updatedList = messages.map((m) =>
        m.id === selectedMessage.id ? { ...m, status: newStatus, adminNotes: adminNotesInput, updatedAt: new Date() } : m
      );
      setMessages(updatedList);
      setSelectedMessage({ ...selectedMessage, status: newStatus, adminNotes: adminNotesInput, updatedAt: new Date() });
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedMessage) return;
    setIsUpdating(true);

    const res = await updateMessageStatus(selectedMessage.id, selectedMessage.status, adminNotesInput);
    setIsUpdating(false);

    if (res.success) {
      const updatedList = messages.map((m) =>
        m.id === selectedMessage.id ? { ...m, adminNotes: adminNotesInput } : m
      );
      setMessages(updatedList);
      setSelectedMessage({ ...selectedMessage, adminNotes: adminNotesInput });
    }
  };

  const handleSendReply = async () => {
    if (!selectedMessage || !replyInput.trim()) return;
    setIsSendingReply(true);
    setReplyFeedback(null);

    const res = await replyToContactMessage(selectedMessage.id, replyInput);
    setIsSendingReply(false);

    if (!res.success) {
      setReplyFeedback({ type: "error", text: res.error || "Fehler beim Senden der Antwort." });
      return;
    }

    if (res.data?.reply) {
      const newReply = res.data.reply;
      const currentReplies = repliesMap[selectedMessage.id] || [];
      const updatedReplies = [...currentReplies, newReply];

      setRepliesMap({
        ...repliesMap,
        [selectedMessage.id]: updatedReplies,
      });

      // Update message status to replied in UI
      const updatedList = messages.map((m) =>
        m.id === selectedMessage.id ? { ...m, status: "replied" as const, updatedAt: new Date() } : m
      );
      setMessages(updatedList);
      setSelectedMessage({ ...selectedMessage, status: "replied", updatedAt: new Date() });

      setReplyInput("");
      setReplyFeedback({ type: "success", text: "Antwort wurde erfolgreich per E-Mail gesendet und in der Historie gespeichert!" });
    }
  };

  const unreadCount = messages.filter((m) => m.status === "new").length;
  const dsaCount = messages.filter((m) => m.type === "dsa_notice").length;
  const currentRepliesList = selectedMessage ? repliesMap[selectedMessage.id] || [] : [];

  return (
    <div className="space-y-6">
      {/* Top Filter Tabs & Search */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
              filter === "all"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            Alle ({messages.length})
          </button>
          <button
            onClick={() => setFilter("new")}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all flex items-center gap-1.5 ${
              filter === "new"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-indigo-400" /> Neu ({unreadCount})
          </button>
          <button
            onClick={() => setFilter("dsa")}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all flex items-center gap-1.5 ${
              filter === "dsa"
                ? "bg-amber-600 text-white shadow-lg shadow-amber-600/30"
                : "bg-slate-800 text-amber-400 hover:bg-slate-700"
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" /> DSA Meldungen ({dsaCount})
          </button>
          <button
            onClick={() => setFilter("in_progress")}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
              filter === "in_progress"
                ? "bg-blue-600 text-white"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            In Bearbeitung
          </button>
          <button
            onClick={() => setFilter("replied")}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
              filter === "replied"
                ? "bg-emerald-600 text-white"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            Beantwortet
          </button>
          <button
            onClick={() => setFilter("archived")}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
              filter === "archived"
                ? "bg-slate-700 text-white"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            Archiviert
          </button>
        </div>

        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Suchen nach Name, Mail, Betreff..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-base sm:text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Main Inbox Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[500px]">
        {/* Left Column: Message List */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-3 flex flex-col space-y-2 max-h-[750px] overflow-y-auto">
          {filteredMessages.length === 0 ? (
            <div className="p-8 text-center text-slate-500 space-y-2 my-auto">
              <Inbox className="w-8 h-8 mx-auto text-slate-600" />
              <p className="text-xs">Keine Nachrichten in dieser Kategorie vorhanden.</p>
            </div>
          ) : (
            filteredMessages.map((msg) => {
              const isSelected = selectedMessage?.id === msg.id;
              const isDsa = msg.type === "dsa_notice";
              const replyCount = (repliesMap[msg.id] || []).length;

              return (
                <button
                  key={msg.id}
                  onClick={() => handleSelectMessage(msg)}
                  className={`w-full p-3.5 rounded-xl text-left transition-all border ${
                    isSelected
                      ? "bg-slate-800/90 border-indigo-500/50 shadow-md"
                      : "bg-slate-950/50 border-slate-800/80 hover:bg-slate-800/40"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-semibold text-xs text-white truncate max-w-[180px]">
                      {msg.name}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(msg.createdAt).toLocaleDateString("de-DE", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 mb-1.5">
                    {isDsa ? (
                      <span className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold flex items-center gap-1 shrink-0">
                        <ShieldAlert className="w-3 h-3" /> DSA Meldung
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-semibold shrink-0">
                        {msg.category}
                      </span>
                    )}

                    {msg.status === "new" && (
                      <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 animate-pulse" title="Ungelesen" />
                    )}
                    {msg.status === "replied" && (
                      <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-0.5">
                        <CheckCircle2 className="w-3 h-3" /> Beantwortet {replyCount > 0 ? `(${replyCount})` : ""}
                      </span>
                    )}
                  </div>

                  <p className="text-xs font-medium text-slate-200 truncate">{msg.subject}</p>
                  <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">
                    {msg.message}
                  </p>
                </button>
              );
            })
          )}
        </div>

        {/* Right Column: Message Detail View & Direct Reply */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-6">
          {!selectedMessage ? (
            <div className="p-12 text-center text-slate-500 space-y-3 my-auto">
              <MessageSquare className="w-10 h-10 mx-auto text-slate-700" />
              <p className="text-sm font-semibold text-slate-400">Wähle eine Nachricht aus der Liste aus</p>
            </div>
          ) : (
            <div className="space-y-6 overflow-y-auto max-h-[750px] pr-1">
              {/* Header Details */}
              <div className="border-b border-slate-800 pb-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {selectedMessage.type === "dsa_notice" ? (
                      <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold flex items-center gap-1.5">
                        <ShieldAlert className="w-4 h-4" /> Meldeverfahren Art. 16 DSA
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold flex items-center gap-1.5">
                        <Mail className="w-4 h-4" /> Kontaktanfrage ({selectedMessage.category})
                      </span>
                    )}
                  </div>

                  <span className="text-xs text-slate-400 font-mono">
                    Eingegangen: {new Date(selectedMessage.createdAt).toLocaleString("de-DE")}
                  </span>
                </div>

                <h2 className="text-xl font-bold text-white leading-snug">{selectedMessage.subject}</h2>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 pt-1">
                  <span className="flex items-center gap-1.5 font-semibold text-white">
                    <User className="w-4 h-4 text-indigo-400" /> {selectedMessage.name}
                  </span>
                  <a
                    href={`mailto:${selectedMessage.email}`}
                    className="font-mono text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    {selectedMessage.email} <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* DSA Details (if applicable) */}
              {selectedMessage.type === "dsa_notice" && (
                <div className="p-4 rounded-xl bg-slate-950 border border-amber-500/20 text-xs space-y-2">
                  <h3 className="font-bold text-amber-400 flex items-center gap-1.5 text-sm">
                    <AlertTriangle className="w-4 h-4" /> Angaben zur gemeldeten Rechtsverletzung
                  </h3>
                  {selectedMessage.targetUrl && (
                    <p className="text-slate-300">
                      <strong>Gemeldete Ziel-URL:</strong>{" "}
                      <a
                        href={selectedMessage.targetUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-400 hover:underline font-mono"
                      >
                        {selectedMessage.targetUrl}
                      </a>
                    </p>
                  )}
                  {selectedMessage.violationType && (
                    <p className="text-slate-300">
                      <strong>Verstoßkategorie:</strong> {selectedMessage.violationType}
                    </p>
                  )}
                  {selectedMessage.legalReason && (
                    <p className="text-slate-300">
                      <strong>Rechtliche Begründung:</strong> {selectedMessage.legalReason}
                    </p>
                  )}
                  <p className="text-[11px] text-slate-500">
                    Erklärung in gutem Glauben abgegeben: {selectedMessage.dsaDeclaration ? "Ja (Bestätigt)" : "Nein"}
                  </p>
                </div>
              )}

              {/* Message Content */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Nachrichtentext des Absenders</h3>
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-slate-200 text-sm leading-relaxed whitespace-pre-wrap font-sans">
                  {selectedMessage.message}
                </div>
              </div>

              {/* REPLY HISTORY TIMELINE */}
              {currentRepliesList.length > 0 && (
                <div className="space-y-3 border-t border-slate-800/80 pt-4">
                  <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <MessageCircleReply className="w-4 h-4" /> Gesendete Antworten &amp; Verlauf ({currentRepliesList.length})
                  </h3>
                  <div className="space-y-3">
                    {currentRepliesList.map((reply) => (
                      <div
                        key={reply.id}
                        className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 text-xs space-y-2"
                      >
                        <div className="flex items-center justify-between text-slate-400 border-b border-indigo-500/10 pb-2">
                          <span className="font-semibold text-indigo-300 flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-indigo-400" /> {reply.senderName} ({reply.senderEmail})
                          </span>
                          <span className="font-mono text-[11px] text-slate-400">
                            {new Date(reply.createdAt).toLocaleString("de-DE")}
                          </span>
                        </div>
                        <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap font-sans pt-1">
                          {reply.replyText}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* IN-APP DIRECT REPLY FORM */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5" /> Direkt im Portal per E-Mail antworten
                  </h3>
                  <span className="text-[11px] text-slate-500">Absender: GateMate Support</span>
                </div>

                <textarea
                  value={replyInput}
                  onChange={(e) => setReplyInput(e.target.value)}
                  placeholder={`Antwort an ${selectedMessage.name} (${selectedMessage.email}) verfassen...`}
                  rows={4}
                  className="w-full px-3.5 py-3 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
                />

                {replyFeedback && (
                  <div
                    className={`p-3 rounded-xl text-xs font-semibold ${
                      replyFeedback.type === "success"
                        ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                        : "bg-rose-500/10 border border-rose-500/20 text-rose-400"
                    }`}
                  >
                    {replyFeedback.text}
                  </div>
                )}

                <div className="flex items-center justify-between pt-1">
                  <a
                    href={`mailto:${selectedMessage.email}?subject=Re: ${encodeURIComponent(selectedMessage.subject)}`}
                    className="text-[11px] text-slate-500 hover:text-slate-400 underline flex items-center gap-1"
                    title="Falls du deinen lokalen Mail-Client nutzen möchtest"
                  >
                    Im externen E-Mail-Client öffnen <ExternalLink className="w-3 h-3" />
                  </a>

                  <button
                    onClick={handleSendReply}
                    disabled={isSendingReply || !replyInput.trim()}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all"
                  >
                    {isSendingReply ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> E-Mail wird gesendet...
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" /> Antwort per E-Mail Senden
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Internal Admin Notes */}
              <div className="space-y-2 border-t border-slate-800/80 pt-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Interne Notizen (Nur Superadmin)
                  </h3>
                  <button
                    onClick={handleSaveNotes}
                    disabled={isUpdating}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                  >
                    Speichern
                  </button>
                </div>
                <textarea
                  value={adminNotesInput}
                  onChange={(e) => setAdminNotesInput(e.target.value)}
                  placeholder="Hinzufügen von internen Notizen zur Bearbeitung..."
                  rows={2}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Status Toolbar */}
              <div className="border-t border-slate-800 pt-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-400">Status setzen:</span>
                  <button
                    onClick={() => handleStatusChange("new")}
                    disabled={isUpdating}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      selectedMessage.status === "new"
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    Neu
                  </button>
                  <button
                    onClick={() => handleStatusChange("in_progress")}
                    disabled={isUpdating}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      selectedMessage.status === "in_progress"
                        ? "bg-blue-600 text-white"
                        : "bg-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    In Bearbeitung
                  </button>
                  <button
                    onClick={() => handleStatusChange("replied")}
                    disabled={isUpdating}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      selectedMessage.status === "replied"
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    Beantwortet
                  </button>
                  <button
                    onClick={() => handleStatusChange("archived")}
                    disabled={isUpdating}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      selectedMessage.status === "archived"
                        ? "bg-slate-700 text-white"
                        : "bg-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    Archivieren
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

