import { db } from "@/db";
import { orders, events, tickets, ticketTiers, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { generateQrCodeDataUrl } from "@/lib/qr";
import { formatLegalAddress, GATEMATE_PLATFORM_DISCLAIMER } from "@/lib/legal";
import { CheckCircle2, Calendar, MapPin, Ticket as TicketIcon, Printer, ArrowLeft, Building2, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PrintButton } from "./print-button";
import { OrderLegalSnapshotModal } from "./order-legal-snapshot-modal";

interface PageProps {
  params: Promise<{ orderId: string }>;
}

export default async function TicketConfirmationPage({ params }: PageProps) {
  const { orderId } = await params;

  // 1. Fetch Order
  const orderRecords = await db.select().from(orders).where(eq(orders.id, orderId));
  const order = orderRecords[0];

  if (!order) {
    notFound();
  }

  // 2. Fetch Event
  const eventRecords = await db.select().from(events).where(eq(events.id, order.eventId));
  const event = eventRecords[0];

  // 3. Fetch Organizer
  const organizerRecords = event ? await db.select().from(users).where(eq(users.id, event.organizerId)) : [];
  const organizer = organizerRecords[0];

  const legalSellerName = organizer?.legalName || organizer?.name || "Demo Events GmbH";
  const legalAddressText = formatLegalAddress(organizer);

  // 4. Fetch Tickets
  const ticketRecords = await db.select().from(tickets).where(eq(tickets.orderId, orderId));

  // 5. Resolve Tiers & QR Codes for each ticket
  const processedTickets = await Promise.all(
    ticketRecords.map(async (tkt) => {
      const tierRecords = await db.select().from(ticketTiers).where(eq(ticketTiers.id, tkt.ticketTierId));
      const tier = tierRecords[0];
      const qrDataUrl = await generateQrCodeDataUrl(tkt.qrHashToken);

      return {
        ...tkt,
        tierName: tier?.name || "Standard-Eintritt",
        qrDataUrl,
      };
    })
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 selection:bg-indigo-500 selection:text-white pb-20 print:bg-white print:text-black">
      {/* Header (Hidden when printing) */}
      <header className="px-6 py-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md flex items-center justify-between print:hidden">
        <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-white text-xs font-medium transition-colors">
          <ArrowLeft className="w-4 h-4" /> Startseite
        </Link>
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <TicketIcon className="w-5 h-5 text-indigo-400" />
          <span className="font-bold text-white text-base">GateMate <span className="text-xs text-slate-400 font-normal">| Digital Ticket Pass</span></span>
        </Link>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-8 space-y-8">
        {/* Order Confirmation Banner (Hidden when printing) */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-800/40 text-center space-y-3 print:hidden">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-white">Zahlung Bestätigt &amp; Tickets Ausgestellt!</h1>
          <p className="text-xs text-slate-300 max-w-md mx-auto">
            Bestellung <span className="font-mono text-emerald-400">{order.id}</span> abgeschlossen. Vertragspartner &amp; Verkäufer ist <strong className="text-white">{legalSellerName}</strong>. Zeigen Sie Ihren QR-Code am Einlass vor.
          </p>
          <div className="pt-2 flex justify-center flex-wrap gap-3">
            <PrintButton />
            <OrderLegalSnapshotModal orderId={order.id} rawSnapshot={order.documentVersionsSnapshot} />
          </div>
        </div>

        {/* Printable Ticket Passes List */}
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-white print:text-black flex items-center gap-2">
            <TicketIcon className="w-5 h-5 text-indigo-400 print:hidden" /> Eintrittskarten ({processedTickets.length})
          </h2>

          {processedTickets.length === 0 ? (
            <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl text-center text-slate-400 text-sm">
              Ihre Tickets werden derzeit generiert. Bitte laden Sie die Seite in wenigen Sekunden neu.
            </div>
          ) : (
            processedTickets.map((ticket, idx) => (
              <div
                key={ticket.id}
                className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col justify-between gap-6 shadow-2xl relative overflow-hidden print:bg-white print:text-black print:border-gray-400 print:shadow-none print:break-inside-avoid"
              >
                {/* Decorative border bar */}
                <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-b from-indigo-500 via-purple-500 to-cyan-500 print:bg-black"></div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                  {/* Left Pass Details */}
                  <div className="space-y-4 text-center sm:text-left flex-1">
                    <div>
                      <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-mono font-bold uppercase print:border-black print:text-black">
                        Ticket #{idx + 1} &bull; {ticket.status.toUpperCase()}
                      </span>
                      <h3 className="text-2xl font-extrabold text-white mt-2 print:text-black">
                        {event?.title || "Veranstaltung"}
                      </h3>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-300 print:text-black">
                      <p className="flex items-center justify-center sm:justify-start gap-1.5">
                        <Calendar className="w-4 h-4 text-indigo-400 print:hidden" />
                        <span>{event?.startDate ? new Date(event.startDate).toLocaleString("de-DE") : "Datum folgt"}</span>
                      </p>
                      <p className="flex items-center justify-center sm:justify-start gap-1.5">
                        <MapPin className="w-4 h-4 text-purple-400 print:hidden" />
                        <span>{event?.venue || "Online / TBD"}</span>
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 print:border-gray-300 grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase font-semibold print:text-gray-600">Teilnehmer</p>
                        <p className="font-bold text-white print:text-black mt-0.5">{ticket.attendeeName}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase font-semibold print:text-gray-600">Kategorie</p>
                        <p className="font-bold text-indigo-400 print:text-black mt-0.5">{ticket.tierName}</p>
                      </div>
                    </div>
                  </div>

                  {/* Right QR Code Image */}
                  <div className="flex flex-col items-center gap-2 bg-white p-4 rounded-2xl border border-slate-700 shrink-0 shadow-lg print:border-black">
                    <img src={ticket.qrDataUrl} alt="Ticket QR Code" className="w-36 h-36 object-contain" />
                    <span className="text-[9px] font-mono text-slate-600 truncate max-w-[140px]">
                      {ticket.id}
                    </span>
                  </div>
                </div>

                {/* Issuer / Legal Seller Section & Platform Disclaimer */}
                <div className="pt-4 border-t border-slate-800/80 print:border-gray-300 space-y-2 text-[11px]">
                  <div className="flex items-start gap-2 text-slate-300 print:text-black">
                    <Building2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5 print:hidden" />
                    <div>
                      <span className="font-bold block">Veranstalter &amp; Aussteller (Vertragspartner):</span>
                      <p className="font-semibold text-white print:text-black">{legalSellerName}</p>
                      <p className="text-slate-400 print:text-gray-700 text-[10px]">
                        {legalAddressText}
                        {organizer?.vatId && ` • USt-ID: ${organizer.vatId}`}
                      </p>
                    </div>
                  </div>

                  <div className="pt-1 text-[10px] text-slate-500 print:text-gray-600 flex items-center gap-1.5 border-t border-slate-800/40 print:border-gray-200">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 print:hidden" />
                    <span>{GATEMATE_PLATFORM_DISCLAIMER}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
