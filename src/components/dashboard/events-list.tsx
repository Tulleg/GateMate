"use client";

import { useState } from "react";
import Link from "next/link";
import { ExternalLink, Code, Ticket, QrCode, Calendar, MapPin, Edit3 } from "lucide-react";
import { EmbedModal } from "@/components/dashboard/embed-modal";
import { formatCurrency } from "@/lib/utils";

interface Tier {
  id: string;
  name: string;
  priceCents: number;
  quantityAvailable: number;
  quantitySold: number;
}

interface EventItem {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  venue: string | null;
  bannerUrl: string | null;
  startDate: string | Date;
  endDate: string | Date;
  isPublished: boolean;
  isCancelled?: boolean;
  cancelReason?: string | null;
  tiers: Tier[];
  eventRevenue: number;
  eventSold: number;
}

export function EventsList({ events }: { events: EventItem[] }) {
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const openEmbedModal = (evt: EventItem) => {
    setSelectedEvent(evt);
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6">
        {events.map((evt) => (
          <div key={evt.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
              <div className="flex items-center gap-4">
                {evt.bannerUrl && (
                  <img
                    src={evt.bannerUrl}
                    alt={evt.title}
                    className="w-16 h-16 rounded-xl object-cover border border-slate-800 shrink-0"
                  />
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-white">{evt.title}</h3>
                    {evt.isCancelled ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-semibold">
                        Storniert
                      </span>
                    ) : evt.isPublished ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold">
                        Veröffentlicht
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-semibold">
                        Entwurf
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-slate-500" /> {evt.venue || "Online Venue"}</span>
                    <span>&bull;</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-slate-500" /> {new Date(evt.startDate).toLocaleDateString()}</span>
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <Link
                  href={`/organizer/events/${evt.id}/edit`}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 flex items-center gap-1.5 transition-colors"
                >
                  <Edit3 className="w-4 h-4 text-amber-400" /> Bearbeiten
                </Link>
                <Link
                  href={`/check-in/${evt.id}`}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 flex items-center gap-1.5 transition-colors"
                >
                  <QrCode className="w-4 h-4 text-indigo-400" /> Gate Scanner
                </Link>
                <button
                  onClick={() => openEmbedModal(evt)}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-300 border border-indigo-500/20 text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Code className="w-4 h-4 text-indigo-400" /> Share & Embed
                </button>
                <Link
                  href={`/e/${evt.slug}`}
                  target="_blank"
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center gap-1.5 transition-colors"
                >
                  Public Page <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Ticket Tiers Sub-Grid */}
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Ticket Tiers & Inventory</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {evt.tiers.map((tier) => (
                  <div key={tier.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                    <div>
                      <p className="text-xs font-semibold text-white">{tier.name}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {tier.quantitySold} / {tier.quantityAvailable} sold
                      </p>
                    </div>
                    <span className="text-sm font-bold text-indigo-400">
                      {formatCurrency(tier.priceCents)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedEvent && (
        <EmbedModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          eventId={selectedEvent.id}
          eventSlug={selectedEvent.slug}
          eventTitle={selectedEvent.title}
        />
      )}
    </div>
  );
}
