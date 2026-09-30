import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users, events, ticketTiers, orders } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { Sidebar } from "@/components/dashboard/sidebar";
import { StripeConnectCard } from "@/components/dashboard/stripe-connect-card";
import { FormatCurrencyClient } from "@/components/dashboard/format-currency";
import Link from "next/link";
import { Calendar, DollarSign, Ticket, TrendingUp, PlusCircle, ArrowUpRight } from "lucide-react";

import { stripe, hasPlatformStripeKey } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export default async function OrganizerDashboardPage() {
  const cookieStore = await cookies();
  const role = cookieStore.get("gatemate_role")?.value;
  if (role === "superadmin") {
    redirect("/admin");
  }

  let organizerId = cookieStore.get("gatemate_user_id")?.value;

  if (!organizerId) {
    if (process.env.ENABLE_DEMO_ACCOUNTS === "true") {
      organizerId = "user_organizer_01";
    } else {
      redirect("/login");
    }
  }

  // Fetch organizer user record
  const organizerRecords = await db.select().from(users).where(eq(users.id, organizerId));
  const organizer = organizerRecords[0] || { id: organizerId, stripeConnectedAccountId: null, stripeSecretKey: null };

  // Check if Stripe is connected and onboarding completed
  let isStripeConnected = false;
  if (organizer.stripeConnectedAccountId && hasPlatformStripeKey()) {
    try {
      const acc = await stripe.accounts.retrieve(organizer.stripeConnectedAccountId);
      isStripeConnected = Boolean(acc.details_submitted);
    } catch {
      isStripeConnected = false;
    }
  } else if (organizer.stripeSecretKey && organizer.stripeSecretKey.trim().length > 0) {
    isStripeConnected = true;
  }

  // Fetch organizer events
  const organizerEvents = await db
    .select()
    .from(events)
    .where(eq(events.organizerId, organizerId))
    .orderBy(desc(events.createdAt));


  // Compute analytics
  let totalRevenueCents = 0;
  let totalTicketsSold = 0;

  const eventsWithStats = await Promise.all(
    organizerEvents.map(async (event) => {
      const tiers = await db.select().from(ticketTiers).where(eq(ticketTiers.eventId, event.id));
      const eventOrders = await db.select().from(orders).where(eq(orders.eventId, event.id));

      const eventRevenue = eventOrders.reduce((acc, o) => acc + (o.status === "completed" ? o.totalCents : 0), 0);
      const eventSold = tiers.reduce((acc, t) => acc + t.quantitySold, 0);

      totalRevenueCents += eventRevenue;
      totalTicketsSold += eventSold;

      return {
        ...event,
        tiersCount: tiers.length,
        eventRevenue,
        eventSold,
      };
    })
  );

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-50">
      <Sidebar />

      <main className="flex-1 p-8 space-y-8 overflow-y-auto">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">Organizer Dashboard</h1>
            <p className="text-sm text-slate-400 mt-1">
              Real-time ticket sales overview, revenue analytics, and gate check-in status.
            </p>
          </div>
          <Link
            href="/organizer/events/new"
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all self-start md:self-auto"
          >
            <PlusCircle className="w-4 h-4" /> Create New Event
          </Link>
        </div>

        {/* Stripe Connect Banner */}
        <StripeConnectCard
          userId={organizer.id}
          isConnected={isStripeConnected}
          accountId={organizer.stripeConnectedAccountId}
        />

        {/* Analytics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Gross Revenue</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-3xl font-bold text-white">
              <FormatCurrencyClient amountCents={totalRevenueCents} />
            </p>
            <p className="text-[11px] text-emerald-400 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Direct Stripe Payouts
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Tickets Issued</span>
              <Ticket className="w-4 h-4 text-indigo-400" />
            </div>
            <p className="text-3xl font-bold text-white">{totalTicketsSold}</p>
            <p className="text-[11px] text-indigo-400 flex items-center gap-1">
              Confirmed Attendee Orders
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Active Events</span>
              <Calendar className="w-4 h-4 text-purple-400" />
            </div>
            <p className="text-3xl font-bold text-white">{organizerEvents.length}</p>
            <p className="text-[11px] text-purple-400">Published & Accepting Buyers</p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Gate Check-In</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            </div>
            <p className="text-3xl font-bold text-white">Ready</p>
            <p className="text-[11px] text-slate-400">PWA Mobile Scanner Active</p>
          </div>
        </div>

        {/* Events Table / List */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-white">Your Hosted Events</h2>
              <p className="text-xs text-slate-400">Manage ticket tiers, share public links, and grab embed widgets.</p>
            </div>
            <Link
              href="/organizer/events"
              className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              View All <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-800/80">
            {eventsWithStats.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-sm">
                No events created yet. Click "Create New Event" to launch your first ticket sale.
              </div>
            ) : (
              eventsWithStats.map((event) => (
                <div key={event.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    {event.bannerUrl && (
                      <img
                        src={event.bannerUrl}
                        alt={event.title}
                        className="w-14 h-14 rounded-xl object-cover border border-slate-800 shrink-0"
                      />
                    )}
                    <div>
                      <h4 className="font-semibold text-white text-base">{event.title}</h4>
                      <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>{event.venue || "Online / TBD"}</span>
                        <span>&bull;</span>
                        <span>{new Date(event.startDate).toLocaleDateString()}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 self-end sm:self-auto">
                    <div className="text-right">
                      <p className="text-xs text-slate-400">Sales / Revenue</p>
                      <p className="text-sm font-bold text-white">
                        {event.eventSold} tickets &bull; <FormatCurrencyClient amountCents={event.eventRevenue} />
                      </p>
                    </div>
                    <Link
                      href={`/e/${event.slug}`}
                      target="_blank"
                      className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-medium transition-colors"
                    >
                      Public Page
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
