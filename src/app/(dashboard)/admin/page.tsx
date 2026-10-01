import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/db";
import { users, events, ticketTiers, orders, tickets } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { Sidebar } from "@/components/dashboard/sidebar";
import { FormatCurrencyClient } from "@/components/dashboard/format-currency";
import { Shield, Users, Calendar, Ticket, DollarSign, CheckCircle2, Scale, Mail } from "lucide-react";
import { getPlatformFeePercent } from "@/lib/platform-settings";
import { StripeFeeSettingsCard } from "@/components/dashboard/stripe-fee-settings-card";


import { CreateOrganizerModal } from "@/components/dashboard/create-organizer-modal";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export default async function SuperAdminDashboard() {
  const cookieStore = await cookies();
  const role = cookieStore.get("gatemate_role")?.value;

  // Access control: strictly restrict to superadmin
  if (role !== "superadmin") {
    redirect("/login");
  }
  async function refreshData() {
    "use server";
    revalidatePath("/admin");
  }

  // Fetch current platform Stripe fee percentage from DB
  const currentFeePercent = await getPlatformFeePercent();

  // Fetch all organizers
  const allOrganizers = await db
    .select()
    .from(users)
    .where(eq(users.role, "organizer"));

  // Fetch all events
  const allEvents = await db.select().from(events).orderBy(desc(events.createdAt));

  // Fetch all orders & tickets for platform metrics
  const allOrdersList = await db.select().from(orders);
  const allTicketsList = await db.select().from(tickets);

  const totalGrossRevenueCents = allOrdersList.reduce((acc, o) => acc + (o.status === "completed" ? o.totalCents : 0), 0);
  const platformFeeCutCents = Math.round(totalGrossRevenueCents * (currentFeePercent / 100));
  const totalTicketsIssued = allTicketsList.length;

  return (
    <div className="flex flex-col md:flex-row min-h-dvh bg-slate-950 text-slate-50 overflow-x-hidden">
      <Sidebar />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-8 overflow-y-auto min-w-0">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-extrabold tracking-tight text-white">Plattform Superadmin-Portal</h1>
              <span className="px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold flex items-center gap-1">
                <Shield className="w-3.5 h-3.5" /> Administrator-Zugriff
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Globale Plattformübersicht, Verzeichnis registrierter Veranstalter, aktive Events und Gebühreneinnahmen.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/messages"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-2 border border-indigo-500/30 transition-colors shadow-lg shadow-indigo-600/20"
            >
              <Mail className="w-4 h-4" /> Nachrichten &amp; DSA
            </Link>
            <Link
              href="/admin/users"
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center gap-2 border border-slate-700 transition-colors"
            >
              <Users className="w-4 h-4 text-indigo-400" /> Userverwaltung
            </Link>
            <Link
              href="/admin/legal"
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center gap-2 border border-slate-700 transition-colors"
            >
              <Scale className="w-4 h-4 text-emerald-400" /> Plattform-Rechtstexte
            </Link>
            <CreateOrganizerModal />
          </div>
        </div>

        {/* Dynamic Stripe Fee Configuration Card */}
        <StripeFeeSettingsCard initialFeePercent={currentFeePercent} />

        {/* Global Platform Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Veranstalter gesamt</span>
              <Users className="w-4 h-4 text-indigo-400" />
            </div>
            <p className="text-3xl font-bold text-white">{allOrganizers.length}</p>
            <p className="text-[11px] text-slate-400">Verifizierte Plattform-Veranstalter</p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Aktive Events</span>
              <Calendar className="w-4 h-4 text-purple-400" />
            </div>
            <p className="text-3xl font-bold text-white">{allEvents.length}</p>
            <p className="text-[11px] text-purple-400">Plattformweite Events</p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Ticket-Volumen</span>
              <Ticket className="w-4 h-4 text-cyan-400" />
            </div>
            <p className="text-3xl font-bold text-white">{totalTicketsIssued}</p>
            <p className="text-[11px] text-slate-400">Ausgestellte digitale Tickets</p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Plattform-Einnahmen ({currentFeePercent}%)</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-3xl font-bold text-emerald-400">
              <FormatCurrencyClient amountCents={platformFeeCutCents} />
            </p>
            <p className="text-[11px] text-emerald-400">
              Gesamtumsatz: <FormatCurrencyClient amountCents={totalGrossRevenueCents} />
            </p>
          </div>
        </div>


        {/* Section 1: Registered Organizers */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-400" /> Registrierte Veranstalter
            </h2>
            <span className="text-xs text-slate-400">{allOrganizers.length} Konto(en)</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3">Veranstalter</th>
                  <th className="p-3">E-Mail</th>
                  <th className="p-3">Rolle</th>
                  <th className="p-3">Stripe-Konto</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {allOrganizers.map((org) => (
                  <tr key={org.id} className="hover:bg-slate-800/30">
                    <td className="p-3 font-semibold text-white">{org.name || "Veranstalter"}</td>
                    <td className="p-3 text-slate-300 font-mono">{org.email}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
                        {org.role}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-slate-400">
                      {org.stripeConnectedAccountId || "Nicht verknüpft"}
                    </td>
                    <td className="p-3">
                      {org.stripeConnectedAccountId ? (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Auszahlungsbereit
                        </span>
                      ) : (
                        <span className="text-slate-500">Einrichtung ausstehend</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
