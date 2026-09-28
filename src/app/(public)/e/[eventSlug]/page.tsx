import type { Metadata } from "next";
import { db } from "@/db";
import { events, ticketTiers, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { CheckoutWidget } from "@/components/public/checkout-widget";
import { Calendar, MapPin, Ticket, ShieldCheck, ArrowLeft, User } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ eventSlug: string }>;
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

  return {
    title: `${event.title} | GateMate Tickets`,
    description: event.description || `Get official tickets for ${event.title} at ${event.venue || "Venue"}.`,
    openGraph: {
      title: `${event.title} - Official Tickets`,
      description: event.description || `Get tickets for ${event.title}. Hosted by ${organizer?.name || "GateMate"}.`,
      url: eventUrl,
      siteName: "GateMate",
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
      title: `${event.title} | GateMate`,
      description: event.description || `Get tickets for ${event.title}.`,
      images: [banner],
    },
  };
}

export default async function PublicEventPage({ params }: PageProps) {
  const { eventSlug } = await params;

  // 1. Fetch Event by slug
  const eventRecords = await db.select().from(events).where(eq(events.slug, eventSlug));
  const event = eventRecords[0];

  if (!event) {
    notFound();
  }

  // 2. Fetch Ticket Tiers
  const tiers = await db.select().from(ticketTiers).where(eq(ticketTiers.eventId, event.id));

  // 3. Fetch Organizer info
  const organizerRecords = await db.select().from(users).where(eq(users.id, event.organizerId));
  const organizer = organizerRecords[0] || { name: "GateMate Organizer", organizerSlug: "demo-organizer" };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 selection:bg-indigo-500 selection:text-white pb-20">
      {/* Header Bar */}
      <header className="px-6 py-4 border-b border-slate-800/80 bg-slate-900/50 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-white text-xs font-medium transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to GateMate
        </Link>
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Ticket className="w-5 h-5 text-indigo-400" />
          <span className="font-bold text-white text-base">GateMate Tickets</span>
        </Link>
      </header>

      {/* Main Content Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 space-y-12">
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
              <span className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold inline-flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" /> Official Event Ticket
              </span>
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
                {event.title}
              </h1>
              <p className="text-xs text-slate-400 flex items-center gap-2">
                Hosted by{" "}
                <Link
                  href={organizer.organizerSlug ? `/o/${organizer.organizerSlug}` : "#"}
                  className="text-white font-semibold hover:text-indigo-400 flex items-center gap-1 transition-colors"
                >
                  <User className="w-3.5 h-3.5 text-indigo-400" /> {organizer.name}
                </Link>
              </p>
            </div>

            {/* Date & Location Info Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Date & Time</h4>
                  <p className="text-sm font-bold text-white mt-1">
                    {new Date(event.startDate).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {new Date(event.startDate).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })} -{" "}
                    {new Date(event.endDate).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-purple-600/10 border border-purple-500/20 text-purple-400 shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Venue Location</h4>
                  <p className="text-sm font-bold text-white mt-1">{event.venue || "Online Event"}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Verified Entry Location</p>
                </div>
              </div>
            </div>

            {/* Event Description */}
            <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-3xl space-y-3">
              <h3 className="text-base font-bold text-white">About This Event</h3>
              <p className="text-sm text-slate-300 whitespace-pre-line leading-relaxed">
                {event.description || "Join us for an incredible live experience."}
              </p>
            </div>
          </div>

          {/* Right Column: Sticky Checkout Widget */}
          <div className="lg:col-span-5">
            <div className="sticky top-24">
              <CheckoutWidget eventId={event.id} eventTitle={event.title} tiers={tiers} organizer={organizer} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
