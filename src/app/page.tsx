import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { db } from "@/db";
import { events, ticketTiers, users } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { EventSearch } from "@/components/public/event-search";
import { PlatformFooter } from "@/components/public/platform-footer";
import { Ticket, ShieldCheck, Zap, QrCode, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "GateMate | Events entdecken & Mobile QR-Tickets",
  description: "Entdecken Sie bevorstehende Live-Events, kaufen Sie verifizierte Tickets mit sofortigem Stripe-Checkout und checken Sie nahtlos mit kryptographischen mobilen QR-Pässen ein.",
  openGraph: {
    title: "GateMate | Moderne Event-Ticketing-Plattform",
    description: "Entdecken Sie bevorstehende Events, kaufen Sie Tickets mit direkter Auszahlung und scannen Sie QR-Passes.",
    url: "https://gatemate.io",
    siteName: "GateMate",
    images: [
      {
        url: "https://images.unsplash.com/photo-1540575467063-178a50c2df87",
        width: 1200,
        height: 630,
        alt: "GateMate Events",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "GateMate | Events entdecken & Mobile QR-Tickets",
    description: "Entdecken Sie bevorstehende Live-Events und kaufen Sie verifizierte Tickets.",
  },
};

export default async function LandingPage() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("gatemate_user_id")?.value;
  const isLoggedIn = Boolean(userId);

  // Query all published & listed events
  const publicEvents = await db
    .select()
    .from(events)
    .where(and(eq(events.isPublished, true), eq(events.isListedInDirectory, true)))
    .orderBy(desc(events.startDate));

  const eventsWithData = await Promise.all(
    publicEvents.map(async (event) => {
      const tiers = await db.select().from(ticketTiers).where(eq(ticketTiers.eventId, event.id));
      const lowestPriceCents = tiers.length > 0 ? Math.min(...tiers.map((t) => t.priceCents)) : 0;

      const organizerRecords = await db.select().from(users).where(eq(users.id, event.organizerId));
      const organizer = organizerRecords[0];

      return {
        id: event.id,
        title: event.title,
        slug: event.slug,
        venue: event.venue,
        bannerUrl: event.bannerUrl,
        startDate: event.startDate,
        organizerName: organizer?.name || "GateMate Veranstalter",
        organizerSlug: organizer?.organizerSlug || "demo-organizer",
        lowestPriceCents,
      };
    })
  );

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-50 selection:bg-indigo-500 selection:text-white">
      {/* Header */}
      <header className="px-4 sm:px-6 py-4 border-b border-slate-800/80 bg-slate-900/50 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Ticket className="w-6 h-6 text-indigo-400" />
          <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            GateMate
          </span>
        </Link>
        <nav className="flex items-center gap-4">
          {isLoggedIn ? (
            <Link
              href="/organizer"
              className="text-xs px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold text-white shadow-lg shadow-indigo-600/20 transition-all min-h-[44px] flex items-center justify-center"
            >
              Veranstalter-Hub
            </Link>
          ) : (
            <Link href="/login" className="text-sm text-slate-300 hover:text-white transition-colors py-2 px-3 min-h-[44px] flex items-center">
              Anmelden
            </Link>
          )}
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12 pb-24 space-y-12 sm:space-y-16">
        {/* Hero Banner */}
        <div className="text-center max-w-3xl mx-auto space-y-4 sm:space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
            <Zap className="w-3.5 h-3.5 text-indigo-400" /> Multi-Tenant Event-Ticketing & QR-Check-In
          </div>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Entdecke Live-Events & <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Mobile QR-Tickets
            </span>
          </h1>
          <p className="text-base text-slate-400 max-w-2xl mx-auto">
            Buche verifizierte Tickets sofort mit direkter Stripe-Auszahlung. Erhalte kryptographische digitale Tickets bereit für den Check-in.
          </p>
        </div>

        {/* Discovery Search & Grid */}
        <EventSearch events={eventsWithData} />

        {/* Platform Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
            <ShieldCheck className="w-8 h-8 text-indigo-400" />
            <h3 className="text-lg font-semibold text-white">Stripe Express Auszahlungen</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Direkte Auszahlungen ohne Wartezeiten direkt auf das Bankkonto des Veranstalters.
            </p>
          </div>
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
            <QrCode className="w-8 h-8 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">Kryptographische QR-Passes</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Signierte JWT-QR-Tokens mit atomarer Einlassverifizierung und offline-fähigem PWA-Kamera-Scanner.
            </p>
          </div>
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
            <Ticket className="w-8 h-8 text-cyan-400" />
            <h3 className="text-lg font-semibold text-white">Einbettbare Widgets</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              1-Klick teilbare Checkout-URLs und Iframe-Widget-Code für jede eigene Website.
            </p>
          </div>
        </div>
      </main>

      <PlatformFooter />
    </div>
  );
}
