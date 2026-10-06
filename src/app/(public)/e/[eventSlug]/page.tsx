import type { Metadata } from "next";
import { db } from "@/db";
import { events, ticketTiers, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { CheckoutWidget } from "@/components/public/checkout-widget";
import { Calendar, MapPin, Ticket, ShieldCheck, ArrowLeft, User, AlertOctagon, Ban, Clock, ShieldAlert, Building2, FileText, Info } from "lucide-react";
import { formatLegalAddress, getOrganizerSellerLabel, GATEMATE_PLATFORM_DISCLAIMER_EXTENDED } from "@/lib/legal";
import { getPlatformFeePercent } from "@/lib/platform-settings";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ eventSlug: string }>;
  searchParams?: Promise<{ canceled?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { eventSlug } = await params;

  const eventRecords = await db.select().from(events).where(eq(events.slug, eventSlug));
  const event = eventRecords[0];

  if (!event) {
    return {
      title: "Event Not Found | GateMate",
    };
  }

  const organizerRecords = await db.select().from(users).where(eq(users.id, event.organizerId));
  const organizer = organizerRecords[0];

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://gatemate.io";
  const eventUrl = `${appUrl}/e/${event.slug}`;
  const banner = event.bannerUrl || "https://images.unsplash.com/photo-1540575467063-178a50c2df87";
  const sellerName = getOrganizerSellerLabel(organizer);

  return {
    title: `${event.title} ${event.isCancelled ? "(STORNIERT) " : ""}| Offizieller Ticketverkauf - ${sellerName}`,
    description: event.description || `Offizieller Ticketverkauf des Veranstalters ${sellerName} für ${event.title} in ${event.venue || "Location"}.`,
    openGraph: {
      title: `${event.title} - Offizielle Tickets (Veranstalter: ${sellerName})`,
      description: event.description || `Tickets für ${event.title}. Verkäufer und Vertragspartner: ${sellerName}.`,
      url: eventUrl,
      siteName: "GateMate Ticketing Service",
      images: [
        {
          url: banner,
          width: 1200,
          height: 630,
          alt: event.title,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${event.title} | Ticketverkauf: ${sellerName}`,
      description: event.description || `Offizieller Ticketverkauf für ${event.title}.`,
      images: [banner],
    },
  };
}

export default async function PublicEventPage({ params, searchParams }: PageProps) {
  const { eventSlug } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const isCheckoutCanceled = resolvedSearchParams.canceled === "true";

  // 1. Fetch Event by slug
  const eventRecords = await db.select().from(events).where(eq(events.slug, eventSlug));
  const event = eventRecords[0];

  if (!event) {
    notFound();
  }

  // 2. Fetch Ticket Tiers & Global Platform Fee Percentage
  const tiers = await db.select().from(ticketTiers).where(eq(ticketTiers.eventId, event.id));
  const platformFeePercent = await getPlatformFeePercent();

  // 3. Fetch Organizer info
  const organizerRecords = await db.select().from(users).where(eq(users.id, event.organizerId));
  const organizer = organizerRecords[0] || { name: "Veranstalter", organizerSlug: "demo-organizer" };
  const organizerLegalName = getOrganizerSellerLabel(organizer);
  const organizerAddress = formatLegalAddress(organizer);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 selection:bg-indigo-500 selection:text-white pb-20">
      {/* Header Bar */}
      <header className="px-6 py-4 border-b border-slate-800/80 bg-slate-900/50 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-white text-xs font-medium transition-colors">
          <ArrowLeft className="w-4 h-4" /> Startseite
        </Link>
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Ticket className="w-5 h-5 text-indigo-400" />
          <span className="font-bold text-white text-base">GateMate <span className="text-xs text-slate-400 font-normal">| Technical Infrastructure</span></span>
        </Link>
      </header>

      {/* Main Content Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 space-y-12">
        {/* Checkout Canceled Notice Banner */}
        {isCheckoutCanceled && (
          <div className="p-5 rounded-3xl bg-blue-950/60 border border-blue-800/70 text-blue-200 shadow-2xl flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30 shrink-0">
              <Info className="w-6 h-6" />
            </div>
            <div className="space-y-0.5">
              <h3 className="text-base font-bold text-white">Bestellvorgang abgebrochen</h3>
              <p className="text-xs text-blue-200/90">
                Sie haben den Bezahlvorgang bei Stripe abgebrochen. Es wurden keine Tickets reserviert und keine Zahlungen abgebucht. Sie können Ihre Bestellung jederzeit erneut starten.
              </p>
            </div>
          </div>
        )}

        {/* Event Cancellation Alert Banner */}
        {event.isCancelled && (
          <div className="p-6 rounded-3xl bg-red-950/70 border border-red-800/80 text-red-200 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="p-3 rounded-2xl bg-red-500/20 text-red-400 border border-red-500/30 shrink-0">
              <Ban className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-white tracking-tight">VERANSTALTUNG ABGESAGT / STORNIERT</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 text-[10px] font-bold uppercase">
                  Absage
                </span>
              </div>
              <p className="text-sm text-red-200/90">
                Grund der Stornierung: <span className="font-bold text-white">{event.cancelReason || "Keine näheren Angaben."}</span>
              </p>
              <p className="text-xs text-red-300/80">
                Ticketkäufe wurden gestoppt. Bereites erworbene Tickets wurden storniert und erstatten.
              </p>
            </div>
          </div>
        )}

        {/* Event Draft Mode Alert Banner */}
        {!event.isPublished && !event.isCancelled && (
          <div className="p-6 rounded-3xl bg-amber-950/60 border border-amber-800/70 text-amber-200 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
              <AlertOctagon className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-white tracking-tight">ENTWURFSMODUS (VORSCHAU)</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold uppercase">
                  Entwurf
                </span>
              </div>
              <p className="text-sm text-amber-200/90">
                Dieses Event wurde noch nicht offiziell veröffentlicht.
              </p>
              <p className="text-xs text-amber-300/80">
                Der Ticketkauf ist deaktiviert, solange sich das Event im Entwurfsmodus befindet.
              </p>
            </div>
          </div>
        )}

        {/* Banner Hero Image */}
        {event.bannerUrl && (
          <div className="w-full h-64 sm:h-96 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl relative">
            <img src={event.bannerUrl} alt={event.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left Column: Event Details */}
          <div className="lg:col-span-7 space-y-8">
            <div className="space-y-4">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 ${
                event.isCancelled
                  ? "bg-red-500/10 border border-red-500/20 text-red-400"
                  : "bg-indigo-500/10 border border-indigo-500/20 text-indigo-400"
              }`}>
                {event.isCancelled ? <Ban className="w-3.5 h-3.5 text-red-400" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                {event.isCancelled ? "Event Storniert" : "Offizieller Ticketverkauf des Veranstalters"}
              </span>
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
                {event.title}
              </h1>

              {/* Explicit Legal Seller & Contract Partner Notice (§ 312j BGB) */}
              <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-indigo-300">
                  <Building2 className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Vertragspartner &amp; Verkäufer dieser Tickets:</span>
                </div>
                <div className="pl-6 space-y-1 text-slate-200">
                  <p className="font-semibold text-white text-sm">
                    {organizerLegalName}
                  </p>
                  <p className="text-xs text-slate-300">
                    {organizerAddress}
                    {organizer?.vatId && ` • USt-ID: ${organizer.vatId}`}
                  </p>
                  <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-medium">
                    <Link
                      href={organizer.organizerSlug ? `/o/${organizer.organizerSlug}/impressum` : `/o/${organizer.organizerSlug}`}
                      className="text-indigo-400 hover:underline flex items-center gap-1"
                    >
                      <FileText className="w-3.5 h-3.5" /> Impressum des Veranstalters
                    </Link>
                    <Link
                      href={organizer.organizerSlug ? `/o/${organizer.organizerSlug}/agb` : `/agb`}
                      className="text-indigo-400 hover:underline flex items-center gap-1"
                    >
                      <FileText className="w-3.5 h-3.5" /> Veranstalter AGB
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Date & Location Info Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Datum &amp; Uhrzeit</h4>
                  <p className="text-sm font-bold text-white mt-1">
                    {new Date(event.startDate).toLocaleDateString("de-DE", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {new Date(event.startDate).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })} -{" "}
                    {new Date(event.endDate).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })} Uhr
                  </p>
                  {event.doorsOpenAt && (
                    <p className="text-[11px] text-indigo-300 mt-1 font-semibold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> Einlass ab: {new Date(event.doorsOpenAt).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })} Uhr
                    </p>
                  )}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-purple-600/10 border border-purple-500/20 text-purple-400 shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Veranstaltungsort</h4>
                  <p className="text-sm font-bold text-white mt-1">{event.venue || "Online Event"}</p>
                  {(event.venueStreet || event.venueCity) && (
                    <p className="text-xs text-slate-400 mt-0.5">
                      {[event.venueStreet, [event.venueZip, event.venueCity].filter(Boolean).join(" ")].filter(Boolean).join(", ")}
                    </p>
                  )}
                  {event.ageRestriction && (
                    <p className="text-[11px] text-amber-300 mt-1 font-semibold flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-400" /> Altersbeschränkung: {event.ageRestriction}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Event Description */}
            <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-3xl space-y-3">
              <h3 className="text-base font-bold text-white">Beschreibung der Veranstaltung</h3>
              <p className="text-sm text-slate-300 whitespace-pre-line leading-relaxed">
                {event.description || "Für diese Veranstaltung liegt keine gesonderte Beschreibung vor."}
              </p>
            </div>

            {/* Platform Role Disclaimer Notice */}
            <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80 text-[11px] text-slate-400 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              <p>{GATEMATE_PLATFORM_DISCLAIMER_EXTENDED}</p>
            </div>
          </div>

          {/* Right Column: Sticky Checkout Widget */}
          <div className="lg:col-span-5">
            <div className="sticky top-24">
              <CheckoutWidget
                eventId={event.id}
                eventTitle={event.title}
                tiers={tiers}
                organizer={organizer}
                isCancelled={Boolean(event.isCancelled)}
                cancelReason={event.cancelReason}
                isPublished={Boolean(event.isPublished)}
                platformFeePercent={platformFeePercent}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

