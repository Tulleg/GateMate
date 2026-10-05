import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { contactMessages, contactMessageReplies } from "@/db/schema";
import { desc, asc } from "drizzle-orm";
import { Sidebar } from "@/components/dashboard/sidebar";
import { AdminMessagesClient, ContactMessageItem } from "@/components/dashboard/admin-messages-client";
import { ContactReplyItem } from "@/app/actions/contact";
import { MessageSquare, ShieldAlert, Mail, Inbox } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminMessagesPage() {
  const cookieStore = await cookies();
  const role = cookieStore.get("gatemate_role")?.value;

  if (role !== "superadmin") {
    redirect("/login");
  }

  const rawMessages = await db
    .select()
    .from(contactMessages)
    .orderBy(desc(contactMessages.createdAt));

  const rawReplies = await db
    .select()
    .from(contactMessageReplies)
    .orderBy(asc(contactMessageReplies.createdAt))
    .catch(() => []);

  const repliesByMessageId: Record<string, ContactReplyItem[]> = {};
  for (const r of rawReplies) {
    if (!repliesByMessageId[r.messageId]) {
      repliesByMessageId[r.messageId] = [];
    }
    repliesByMessageId[r.messageId].push({
      id: r.id,
      messageId: r.messageId,
      senderName: r.senderName,
      senderEmail: r.senderEmail,
      replyText: r.replyText,
      createdAt: r.createdAt,
    });
  }

  const messages: ContactMessageItem[] = rawMessages.map((m) => ({
    id: m.id,
    type: m.type as "general" | "dsa_notice",
    name: m.name,
    email: m.email,
    category: m.category as any,
    subject: m.subject,
    message: m.message,
    targetUrl: m.targetUrl,
    violationType: m.violationType,
    legalReason: m.legalReason,
    dsaDeclaration: m.dsaDeclaration,
    status: m.status as "new" | "in_progress" | "replied" | "archived",
    adminNotes: m.adminNotes,
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
  }));

  const totalCount = messages.length;
  const unreadCount = messages.filter((m) => m.status === "new").length;
  const dsaCount = messages.filter((m) => m.type === "dsa_notice").length;
  const repliedCount = messages.filter((m) => m.status === "replied").length;

  return (
    <div className="flex flex-col md:flex-row min-h-dvh bg-slate-950 text-slate-50 overflow-x-hidden">
      <Sidebar />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-8 overflow-y-auto min-w-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-extrabold tracking-tight text-white">Nachrichten- &amp; Supportzentrale</h1>
              {unreadCount > 0 && (
                <span className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
                  {unreadCount} Neu
                </span>
              )}
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Verwaltung aller eingehenden Kontaktanfragen, Veranstalter-Supportanfragen und DSA Art. 16 Meldeverfahren.
            </p>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Gesamt Anfragen</span>
              <Inbox className="w-4 h-4 text-indigo-400" />
            </div>
            <p className="text-3xl font-bold text-white">{totalCount}</p>
            <p className="text-[11px] text-slate-400">Eingegangene Anfragen</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Ungelesen</span>
              <Mail className="w-4 h-4 text-indigo-400" />
            </div>
            <p className="text-3xl font-bold text-indigo-400">{unreadCount}</p>
            <p className="text-[11px] text-indigo-400">Offene Nachrichten</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">DSA Meldungen</span>
              <ShieldAlert className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-3xl font-bold text-amber-400">{dsaCount}</p>
            <p className="text-[11px] text-amber-400">Art. 16 DSA Meldeverfahren</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Beantwortet</span>
              <MessageSquare className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-3xl font-bold text-emerald-400">{repliedCount}</p>
            <p className="text-[11px] text-emerald-400">Bearbeitete Anfragen</p>
          </div>
        </div>

        {/* Client Interactive Inbox */}
        <AdminMessagesClient initialMessages={messages} initialReplies={repliesByMessageId} />
      </main>
    </div>
  );
}
