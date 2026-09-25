import type { Metadata } from "next";
import { db } from "@/db";
import { users, events, ticketTiers } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import Link from "next/link";
import { Calendar, MapPin, Ticket, ShieldCheck, User, ArrowLeft, ExternalLink } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ organizerSlug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { organizerSlug } = await params;

  const organizerRecords = await db.select().from(users).where(eq(users.organizerSlug, organizerSlug));
  const organizer = organizerRecords[0];

  if (!organizer) {
    return {
      title: "Organizer Not Found | GateMate",
    };
  }

  return {
    title: `${organizer.name || "Organizer"} | GateMate Events`,
    description: organizer.bio || `Explore upcoming live events hosted by ${organizer.name}.`,
    openGraph: {
      title: `${organizer.name} - GateMate Organizer Profile`,
      description: organizer.bio || `Explore upcoming live events hosted by ${organizer.name}.`,
      images: [
        {
          url: organizer.image || "https://images.unsplash.com/photo-1540575467063-178a50c2df87",
          width: 1200,
          height: 630,
          alt: organizer.name || "Organizer Profile",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${organizer.name} - GateMate Events`,
      description: organizer.bio || `Explore upcoming live events.`,
    },
  };
}

export default async function OrganizerProfilePage({ params }: PageProps) {
  const { organizerSlug } = await params;

  // 1. Fetch Organizer
  const organizerRecords = await db.select().from(users).where(eq(users.organizerSlug, organizerSlug));
  const organizer = organizerRecords[0];

  if (!organizer) {
    notFound();
  }

  // 2. Fetch Organizer's Published Events
  const organizerEvents = await db
    .select()
    .from(events)
    .where(and(eq(events.organizerId, organizer.id), eq(events.isPublished, true)))
    .orderBy(desc(events.startDate));

  const eventsWithPrices = await Promise.all(
    organizerEvents.map(async (event) => {
      const tiers = await db.select().from(ticketTiers).where(eq(ticketTiers.eventId, event.id));
      const lowestPriceCents = tiers.length > 0 ? Math.min(...tiers.map((t) => t.priceCents)) : 0;

      return {
        ...event,
        lowestPriceCents,
      };
    })
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 selection:bg-indigo-500 selection:text-white pb-24">
      {/* Header Bar */}
      <header className="px-6 py-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-white text-xs font-medium transition-colors">
          <ArrowLeft className="w-4 h-4" /> Home Directory
        </Link>
        <div className="flex items-center gap-2">
          <Ticket className="w-5 h-5 text-indigo-400" />
          <span className="font-bold text-white text-base">GateMate Organizer Profile</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 space-y-12">
        {/* Organizer Header Banner */}
        <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-900 border border-indigo-800/40 shadow-2xl flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-extrabold text-3xl text-white shadow-xl shrink-0">
            {organizer.name ? organizer.name.substring(0, 2).toUpperCase() : "EO"}
          </div>

          <div className="space-y-2 flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h1 className="text-3xl font-extrabold text-white">{organizer.name || "Event Organizer"}</h1>
              <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-semibold self-center sm:self-auto flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Verified Organizer
              </span>
            </div>

            <p className="text-sm text-slate-300 max-w-2xl">
              {organizer.bio || "Hosting world-class live events, summits, and festivals."}
            </p>

            <div className="pt-2 flex items-center justify-center sm:justify-start gap-4 text-xs text-slate-400">
              <span className="font-semibold text-indigo-400">{eventsWithPrices.length}</span> Active Event(s)
            </div>
          </div>
        </div>

        {/* Organizer Events Grid */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white">Upcoming Events by {organizer.name}</h2>

          {eventsWithPrices.length === 0 ? (
            <div className="p-12 text-center bg-slate-900/40 border border-slate-800 rounded-3xl text-slate-400 text-sm">
              No upcoming public events scheduled.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {eventsWithPrices.map((evt) => (
                <div
                  key={evt.id}
                  className="group rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden flex flex-col justify-between hover:border-indigo-500/50 transition-all duration-300 shadow-xl"
                >
                  <div>
                    <div className="h-48 w-full relative overflow-hidden bg-slate-950">
                      <img
                        src={evt.bannerUrl || "https://images.unsplash.com/photo-1540575467063-178a50c2df87"}
                        alt={evt.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md text-[11px] font-bold text-indigo-300 border border-slate-800">
                        From {formatCurrency(evt.lowestPriceCents)}
                      </div>
                    </div>

                    <div className="p-6 space-y-3">
                      <h3 className="text-xl font-bold text-white group-hover:text-indigo-300 transition-colors">
                        <Link href={`/e/${evt.slug}`}>{evt.title}</Link>
                      </h3>

                      <div className="space-y-1.5 text-xs text-slate-400">
                        <p className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                          <span>{new Date(evt.startDate).toLocaleDateString()}</span>
                        </p>
                        <p className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-purple-400" />
                          <span>{evt.venue || "Online / TBD"}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 pt-0">
                    <Link
                      href={`/e/${evt.slug}`}
                      className="w-full py-3 rounded-2xl bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white font-bold text-xs flex items-center justify-center gap-2 border border-indigo-500/20 hover:border-transparent transition-all"
                    >
                      Get Tickets <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
