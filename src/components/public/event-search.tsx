"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, MapPin, Calendar, Ticket, ArrowRight, User } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface PublicEventCard {
  id: string;
  title: string;
  slug: string;
  venue: string | null;
  bannerUrl: string | null;
  startDate: string | Date;
  organizerName: string;
  organizerSlug: string | null;
  lowestPriceCents: number;
}

export function EventSearch({ events }: { events: PublicEventCard[] }) {
  const [searchTitle, setSearchTitle] = useState("");
  const [searchLocation, setSearchLocation] = useState("");

  const filteredEvents = events.filter((evt) => {
    const matchesTitle = !searchTitle || evt.title.toLowerCase().includes(searchTitle.toLowerCase());
    const matchesLocation =
      !searchLocation || (evt.venue && evt.venue.toLowerCase().includes(searchLocation.toLowerCase()));
    return matchesTitle && matchesLocation;
  });

  return (
    <div className="space-y-12">
      {/* Prominent Hero Search Bar */}
      <div className="p-4 sm:p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-xl max-w-4xl mx-auto space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="relative">
            <Search className="w-5 h-5 text-indigo-400 absolute left-4 top-3.5" />
            <input
              type="text"
              value={searchTitle}
              onChange={(e) => setSearchTitle(e.target.value)}
              placeholder="Search by event title or keyword..."
              className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="relative">
            <MapPin className="w-5 h-5 text-purple-400 absolute left-4 top-3.5" />
            <input
              type="text"
              value={searchLocation}
              onChange={(e) => setSearchLocation(e.target.value)}
              placeholder="Search city, venue, or location..."
              className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Upcoming Events Section */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Upcoming Public Events</h2>
            <p className="text-xs text-slate-400 mt-1">Discover & buy tickets for verified live experiences.</p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-400">
            {filteredEvents.length} Event{filteredEvents.length !== 1 ? "s" : ""}
          </span>
        </div>

        {filteredEvents.length === 0 ? (
          <div className="py-16 text-center bg-slate-900/40 rounded-3xl border border-slate-800 space-y-3">
            <Ticket className="w-12 h-12 text-slate-600 mx-auto" />
            <p className="text-base font-semibold text-slate-300">No events found matching your search</p>
            <p className="text-xs text-slate-500">Try adjusting your title or location keywords.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((evt) => (
              <div
                key={evt.id}
                className="group rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden flex flex-col justify-between hover:border-indigo-500/50 transition-all duration-300 shadow-xl hover:shadow-indigo-500/10"
              >
                <div>
                  {/* Banner Image */}
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

                  {/* Card Content */}
                  <div className="p-6 space-y-4">
                    <div className="space-y-1.5">
                      <Link
                        href={evt.organizerSlug ? `/o/${evt.organizerSlug}` : "#"}
                        className="text-[11px] font-medium text-slate-400 hover:text-indigo-400 flex items-center gap-1 transition-colors"
                      >
                        <User className="w-3 h-3 text-slate-500" /> {evt.organizerName}
                      </Link>
                      <h3 className="text-xl font-bold text-white leading-snug group-hover:text-indigo-300 transition-colors">
                        <Link href={`/e/${evt.slug}`}>{evt.title}</Link>
                      </h3>
                    </div>

                    <div className="space-y-2 text-xs text-slate-400 border-t border-slate-800/80 pt-3">
                      <p className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span>{new Date(evt.startDate).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</span>
                      </p>
                      <p className="flex items-center gap-2 truncate">
                        <MapPin className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                        <span className="truncate">{evt.venue || "Online / TBD"}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="p-6 pt-0">
                  <Link
                    href={`/e/${evt.slug}`}
                    className="w-full py-3 rounded-2xl bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white font-bold text-xs flex items-center justify-center gap-2 border border-indigo-500/20 hover:border-transparent transition-all"
                  >
                    Get Tickets <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
