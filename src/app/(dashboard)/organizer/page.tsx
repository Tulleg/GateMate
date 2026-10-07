import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users, events, ticketTiers, orders } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { Sidebar } from "@/components/dashboard/sidebar";
import { StripeConnectCard } from "@/components/dashboard/stripe-connect-card";
import { FormatCurrencyClient } from "@/components/dashboard/format-currency";
import Link from "next/link";
import {
  Calendar,
  DollarSign,
  Ticket,
  TrendingUp,
  PlusCircle,
  ArrowUpRight,
  AlertTriangle,
  CheckCircle2,
  Building2,
  CreditCard,
  FileText,
  ArrowRight,
} from "lucide-react";

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
  const organizer = organizerRecords[0] || { id: organizerId, stripeConnectedAccountId: null, stripeSecretKey: null, onboardingCompleted: false };

  // Calculate detailed onboarding requirement status
  const connectedAccountId = organizer.stripeAccountId || organizer.stripeConnectedAccountId;
  const hasStripe = Boolean(connectedAccountId || (organizer.stripeSecretKey && organizer.stripeSecretKey.trim().length > 0));
  const hasLegalInfo = Boolean((organizer.legalCompanyName || organizer.legalName) && (organizer.street || organizer.legalAddress));
  const hasTerms = Boolean(
    organizer.termsAcceptedAt ||
      organizer.privacyAcceptedAt ||
      organizer.avvAcceptedAt ||
      organizer.onboardingStep === "completed" ||
      organizer.onboardingCompleted ||
      (organizer.termsContent && organizer.termsContent.trim().length > 0) ||
      (organizer.privacyContent && organizer.privacyContent.trim().length > 0)
  );
  const isFullyCompleted = Boolean(organizer.onboardingCompleted || (hasStripe && hasLegalInfo && hasTerms));

  // Auto-sync database and cookies if all 3 steps are complete but onboardingCompleted wasn't marked true
  if (organizerRecords[0] && !organizerRecords[0].onboardingCompleted && isFullyCompleted) {
    await db.update(users).set({ onboardingCompleted: true, onboardingStep: "completed" }).where(eq(users.id, organizerId));
    cookieStore.set("gatemate_onboarding_completed", "true", {
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });
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
    <div className="flex flex-col md:flex-row min-h-dvh md:h-dvh md:overflow-hidden bg-slate-950 text-slate-50">
      <Sidebar />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-8 overflow-y-auto min-w-0 md:h-full">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">Veranstalter-Dashboard</h1>
            <p className="text-sm text-slate-400 mt-1">
              Echtzeit-Übersicht aller Ticketverkäufe, Umsatzanalysen und Gate-Check-in-Status.
            </p>
          </div>
          <Link
            href="/organizer/events/new"
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all self-start md:self-auto"
          >
            <PlusCircle className="w-4 h-4" /> Neues Event erstellen
          </Link>
        </div>

        {/* Onboarding Status Checklist Banner */}
        {!isFullyCompleted && (
          <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-950/60 via-slate-900 to-slate-900 border-2 border-amber-500/50 shadow-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0 mt-0.5">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    Freischaltung unvollständig: Ticketverkäufe &amp; Event-Erstellung ausstehend
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                      Onboarding Status
                    </span>
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                    Deine Veranstalterfunktionen sind erst vollständig freigeschaltet, sobald alle 3 Einrichtungsschritte abgeschlossen sind. Unten siehst du genau, welche Angaben noch fehlen.
                  </p>
                </div>
              </div>
              <Link
                href="/onboarding"
                className="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all shrink-0 self-start sm:self-auto"
              >
                Zum Onboarding Assistenten <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Checklist Items */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-800">
              {/* Step 1 Stripe */}
              <div
                className={`p-3.5 rounded-xl border flex items-center justify-between text-xs ${
                  hasStripe
                    ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-300"
                    : "bg-slate-950/60 border-amber-500/40 text-amber-300"
                }`}
              >
                <span className="font-semibold flex items-center gap-2">
                  <CreditCard className="w-4 h-4" /> 1. Stripe Payment
                </span>
                {hasStripe ? (
                  <span className="font-bold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Verbunden
                  </span>
                ) : (
                  <span className="font-bold text-amber-400 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" /> Fehlt noch
                  </span>
                )}
              </div>

              {/* Step 2 Legal Info */}
              <div
                className={`p-3.5 rounded-xl border flex items-center justify-between text-xs ${
                  hasLegalInfo
                    ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-300"
                    : "bg-slate-950/60 border-amber-500/40 text-amber-300"
                }`}
              >
                <span className="font-semibold flex items-center gap-2">
                  <Building2 className="w-4 h-4" /> 2. Stammdaten &amp; Adresse
                </span>
                {hasLegalInfo ? (
                  <span className="font-bold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Hinterlegt
                  </span>
                ) : (
                  <span className="font-bold text-amber-400 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" /> Fehlt noch
                  </span>
                )}
              </div>

              {/* Step 3 Terms */}
              <div
                className={`p-3.5 rounded-xl border flex items-center justify-between text-xs ${
                  hasTerms
                    ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-300"
                    : "bg-slate-950/60 border-amber-500/40 text-amber-300"
                }`}
              >
                <span className="font-semibold flex items-center gap-2">
                  <FileText className="w-4 h-4" /> 3. AGB, Privacy &amp; AVV
                </span>
                {hasTerms ? (
                  <span className="font-bold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Akzeptiert
                  </span>
                ) : (
                  <span className="font-bold text-amber-400 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" /> Fehlt noch
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Stripe Connect Banner */}
        <StripeConnectCard
          userId={organizer.id}
          isConnected={hasStripe}
          accountId={connectedAccountId}
        />

        {/* Analytics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Gesamteinnahmen</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-3xl font-bold text-white">
              <FormatCurrencyClient amountCents={totalRevenueCents} />
            </p>
            <p className="text-[11px] text-emerald-400 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Direkte Stripe-Auszahlungen
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Ausgestellte Tickets</span>
              <Ticket className="w-4 h-4 text-indigo-400" />
            </div>
            <p className="text-3xl font-bold text-white">{totalTicketsSold}</p>
            <p className="text-[11px] text-indigo-400 flex items-center gap-1">
              Bestätigte Bestellungen
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Aktive Events</span>
              <Calendar className="w-4 h-4 text-purple-400" />
            </div>
            <p className="text-3xl font-bold text-white">{organizerEvents.length}</p>
            <p className="text-[11px] text-purple-400">Veröffentlicht &amp; für Käufer verfügbar</p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Gate Check-In</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            </div>
            <p className="text-3xl font-bold text-white">Bereit</p>
            <p className="text-[11px] text-slate-400">PWA Mobile Scanner aktiv</p>
          </div>
        </div>

        {/* Events Table / List */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-white">Ihre Veranstaltungen</h2>
              <p className="text-xs text-slate-400">Ticket-Kategorien verwalten, öffentliche Links teilen und Einbettungs-Widgets nutzen.</p>
            </div>
            <Link
              href="/organizer/events"
              className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              Alle anzeigen <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-800/80">
            {eventsWithStats.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-sm">
                Noch keine Events erstellt. Klicken Sie auf &quot;Neues Event erstellen&quot;, um Ihren ersten Ticketverkauf zu starten.
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
                        <span>{event.venue || "Online / Noch offen"}</span>
                        <span>&bull;</span>
                        <span>{new Date(event.startDate).toLocaleDateString("de-DE")}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 self-end sm:self-auto">
                    <div className="text-right">
                      <p className="text-xs text-slate-400">Verkäufe / Einnahmen</p>
                      <p className="text-sm font-bold text-white">
                        {event.eventSold} Tickets &bull; <FormatCurrencyClient amountCents={event.eventRevenue} />
                      </p>
                    </div>
                    <Link
                      href={`/e/${event.slug}`}
                      target="_blank"
                      className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-medium transition-colors"
                    >
                      Öffentliche Seite
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
