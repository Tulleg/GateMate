"use client";

import React, { useRef } from "react";
import { X, Printer, Download, FileText, Building2, Calendar, CheckCircle2, ShieldCheck } from "lucide-react";
import { FormatCurrencyClient } from "./format-currency";

interface OrganizerInfo {
  name: string;
  email: string;
  legalCompanyName?: string;
  vatId?: string;
  street?: string;
  zip?: string;
  city?: string;
  country?: string;
}

interface BookingTicket {
  id: string;
  attendeeName: string;
  tierName: string;
  priceCents: number;
  status: string;
}

interface Booking {
  id: string;
  eventId: string;
  eventTitle: string;
  eventStartDate: string;
  customerEmail: string;
  totalCents: number;
  status: string;
  stripePaymentIntentId: string;
  createdAt: string;
  ticketsCount: number;
  tickets: BookingTicket[];
}

interface SummaryStats {
  totalGrossCents: number;
  completedCount: number;
  refundedCount: number;
  refundedGrossCents: number;
  totalTicketsSold: number;
}

interface TaxReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizer: OrganizerInfo | null;
  bookings: Booking[];
  summary: SummaryStats;
  selectedEventTitle: string;
  dateFilterLabel: string;
}

export function TaxReportModal({
  isOpen,
  onClose,
  organizer,
  bookings,
  summary,
  selectedEventTitle,
  dateFilterLabel,
}: TaxReportModalProps) {
  const reportRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const currentDateStr = new Date().toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      {/* Container */}
      <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden print:max-h-none print:w-full print:max-w-none print:shadow-none print:border-none print:bg-white print:text-slate-900">
        
        {/* Modal Top Bar (Hidden during print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90 print:hidden shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Finanzamt-Export Preview</h3>
              <p className="text-xs text-slate-400">Druckfertige Einnahmenübersicht & Buchungsjournal</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all min-h-[44px]"
            >
              <Printer className="w-4 h-4" /> Als PDF Speichern / Drucken
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Report Content Document */}
        <div
          ref={reportRef}
          className="p-8 sm:p-12 space-y-8 overflow-y-auto print:overflow-visible print:p-0 print:text-black print:bg-white"
          id="tax-report-print-area"
        >
          {/* Header Block */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-slate-800 print:border-slate-300 pb-6">
            <div>
              <div className="flex items-center gap-2 text-indigo-400 print:text-indigo-700 font-black text-xl tracking-tight">
                <span>GateMate</span>
                <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 print:bg-indigo-100 print:text-indigo-800 font-semibold uppercase">
                  Finanzamt Beleg
                </span>
              </div>
              <h1 className="text-2xl font-bold text-white print:text-slate-900 mt-2">
                Einnahmenübersicht & Buchungsjournal
              </h1>
              <p className="text-xs text-slate-400 print:text-slate-600 mt-1">
                Generiert am: {currentDateStr} Uhr &bull; System-Referenz: GateMate Tax-ID #{Date.now().toString().slice(-6)}
              </p>
            </div>

            <div className="text-right text-xs text-slate-300 print:text-slate-700 space-y-1">
              <p className="font-bold text-sm text-white print:text-slate-900">
                {organizer?.legalCompanyName || organizer?.name || "Veranstalter"}
              </p>
              {organizer?.street && <p>{organizer.street}</p>}
              {(organizer?.zip || organizer?.city) && (
                <p>{organizer.zip} {organizer.city}</p>
              )}
              {organizer?.country && <p>{organizer.country}</p>}
              <p className="pt-1 text-slate-400 print:text-slate-500">
                USt-IdNr / St-Nr: <span className="font-mono">{organizer?.vatId || "Nicht angegeben"}</span>
              </p>
              <p className="text-slate-400 print:text-slate-500">E-Mail: {organizer?.email}</p>
            </div>
          </div>

          {/* Filter Parameters & Period Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-850 border border-slate-800 print:border-slate-300 print:bg-slate-50">
            <div>
              <p className="text-xs font-semibold uppercase text-slate-400 print:text-slate-600">Berichtszeitraum & Filter</p>
              <p className="text-sm font-semibold text-white print:text-slate-900 mt-1 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-400 print:text-indigo-600" />
                Zeitraum: {dateFilterLabel}
              </p>
              <p className="text-xs text-slate-300 print:text-slate-700 mt-1">
                Veranstaltung: <span className="font-medium">{selectedEventTitle}</span>
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-slate-400 print:text-slate-600">Zusammenfassung Finanzamt</p>
              <p className="text-sm font-bold text-emerald-400 print:text-emerald-700 mt-1">
                Brutto-Einnahmen: <FormatCurrencyClient amountCents={summary.totalGrossCents} />
              </p>
              <p className="text-xs text-slate-300 print:text-slate-700 mt-1">
                Erfolgreiche Buchungen: {summary.completedCount} &bull; Tickets: {summary.totalTicketsSold}
                {summary.refundedCount > 0 && ` • Erstattungen: ${summary.refundedCount}`}
              </p>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800 print:border-slate-300 print:bg-slate-100">
              <p className="text-[10px] uppercase font-semibold text-slate-400 print:text-slate-600">Gesamt Brutto Umsatz</p>
              <p className="text-lg font-extrabold text-white print:text-slate-900 mt-0.5">
                <FormatCurrencyClient amountCents={summary.totalGrossCents} />
              </p>
            </div>
            <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800 print:border-slate-300 print:bg-slate-100">
              <p className="text-[10px] uppercase font-semibold text-slate-400 print:text-slate-600">Gültige Buchungen</p>
              <p className="text-lg font-extrabold text-white print:text-slate-900 mt-0.5">
                {summary.completedCount}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800 print:border-slate-300 print:bg-slate-100">
              <p className="text-[10px] uppercase font-semibold text-slate-400 print:text-slate-600">Verkaufte Tickets</p>
              <p className="text-lg font-extrabold text-white print:text-slate-900 mt-0.5">
                {summary.totalTicketsSold}
              </p>
            </div>
          </div>

          {/* Bookings Ledger Table */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 print:text-slate-800">
              Einzelaufstellung der Buchungstransaktionen ({bookings.length})
            </h3>
            
            <div className="overflow-x-auto border border-slate-800 print:border-slate-300 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-800/60 print:bg-slate-200 text-slate-300 print:text-slate-800 font-semibold border-b border-slate-700 print:border-slate-300">
                    <th className="py-2.5 px-3">Datum & Uhrzeit</th>
                    <th className="py-2.5 px-3">Buchungs-ID</th>
                    <th className="py-2.5 px-3">Veranstaltung</th>
                    <th className="py-2.5 px-3">Kunde</th>
                    <th className="py-2.5 px-3">Tickets</th>
                    <th className="py-2.5 px-3">Stripe Transaktion</th>
                    <th className="py-2.5 px-3 text-right">Betrag</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 print:divide-slate-300">
                  {bookings.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-6 text-center text-slate-500 print:text-slate-600">
                        Keine Buchungen für den gewählten Filterzeitraum vorhanden.
                      </td>
                    </tr>
                  ) : (
                    bookings.map((b) => {
                      const dateObj = new Date(b.createdAt);
                      const dateStr = dateObj.toLocaleDateString("de-DE");
                      const timeStr = dateObj.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });

                      return (
                        <tr key={b.id} className="hover:bg-slate-800/30 print:hover:bg-transparent">
                          <td className="py-2 px-3 whitespace-nowrap text-slate-300 print:text-slate-800">
                            {dateStr} {timeStr}
                          </td>
                          <td className="py-2 px-3 font-mono text-[11px] text-slate-400 print:text-slate-700">
                            {b.id.slice(0, 12)}...
                          </td>
                          <td className="py-2 px-3 font-medium text-white print:text-slate-900 max-w-[150px] truncate">
                            {b.eventTitle}
                          </td>
                          <td className="py-2 px-3 text-slate-300 print:text-slate-800 max-w-[150px] truncate">
                            {b.customerEmail}
                          </td>
                          <td className="py-2 px-3 text-slate-300 print:text-slate-800">
                            {b.ticketsCount} x
                          </td>
                          <td className="py-2 px-3 font-mono text-[10px] text-slate-400 print:text-slate-600 max-w-[120px] truncate">
                            {b.stripePaymentIntentId}
                          </td>
                          <td className="py-2 px-3 text-right font-bold text-white print:text-slate-900 whitespace-nowrap">
                            <FormatCurrencyClient amountCents={b.totalCents} />
                          </td>
                          <td className="py-2 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              b.status === "completed"
                                ? "bg-emerald-500/20 text-emerald-400 print:bg-emerald-100 print:text-emerald-800"
                                : b.status === "refunded"
                                ? "bg-red-500/20 text-red-400 print:bg-red-100 print:text-red-800"
                                : "bg-amber-500/20 text-amber-400 print:bg-amber-100 print:text-amber-800"
                            }`}>
                              {b.status === "completed" ? "Bezahlt" : b.status === "refunded" ? "Erstattet" : b.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Legal / Finanzamt Disclaimer Footer */}
          <div className="pt-6 border-t border-slate-800 print:border-slate-300 text-[10px] text-slate-500 print:text-slate-600 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-slate-400 print:text-slate-700">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400 print:text-indigo-600" />
              <span>GoBD-Konformität & Ticketverkaufs-Nachweis</span>
            </div>
            <p>
              Dieser Bericht wurde von der GateMate Event-Ticketing-Plattform erstellt. Sämtliche Umsätze stammen aus direkten Stripe-Zahlungstransaktionen des Veranstalters. 
              Dieser Beleg dient als Nachweis für die Finanzbuchhaltung und das Finanzamt gem. §§ 14, 14a UStG und GoBD.
            </p>
          </div>
        </div>
      </div>

      {/* Print CSS Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #tax-report-print-area, #tax-report-print-area * {
            visibility: visible;
          }
          #tax-report-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
            background: white !important;
            color: black !important;
          }
        }
      `}</style>
    </div>
  );
}
