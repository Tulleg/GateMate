"use client";

import React, { useEffect, useState, useTransition } from "react";
import {
  Receipt,
  Download,
  FileText,
  Calendar,
  Filter,
  Search,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Ticket,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ExternalLink,
} from "lucide-react";
import { FormatCurrencyClient } from "./format-currency";
import { TaxReportModal } from "./tax-report-modal";

interface EventOption {
  id: string;
  title: string;
  startDate: string;
  venue?: string | null;
}

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
  stripeCheckoutSessionId: string;
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

export function BookingsClient() {
  const [loading, setLoading] = useState(true);
  const [organizer, setOrganizer] = useState<OrganizerInfo | null>(null);
  const [events, setEvents] = useState<EventOption[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [summary, setSummary] = useState<SummaryStats>({
    totalGrossCents: 0,
    completedCount: 0,
    refundedCount: 0,
    refundedGrossCents: 0,
    totalTicketsSold: 0,
  });

  // Filter States
  const [selectedEventId, setSelectedEventId] = useState<string>("all");
  const [datePreset, setDatePreset] = useState<string>("all"); // 'all' | 'this_month' | 'last_month' | 'this_year' | 'custom'
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Expandable row state
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null);

  // PDF Tax Report Modal State
  const [showTaxModal, setShowTaxModal] = useState(false);

  // Helper: compute dates based on preset
  const handlePresetChange = (preset: string) => {
    setDatePreset(preset);
    const now = new Date();

    if (preset === "all") {
      setStartDate("");
      setEndDate("");
    } else if (preset === "this_month") {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(firstDay.toISOString().slice(0, 10));
      setEndDate(now.toISOString().slice(0, 10));
    } else if (preset === "last_month") {
      const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      setStartDate(firstDayLastMonth.toISOString().slice(0, 10));
      setEndDate(lastDayLastMonth.toISOString().slice(0, 10));
    } else if (preset === "this_year") {
      const firstDayYear = new Date(now.getFullYear(), 0, 1);
      setStartDate(firstDayYear.toISOString().slice(0, 10));
      setEndDate(now.toISOString().slice(0, 10));
    }
  };

  // Fetch Data Function
  const fetchBookings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedEventId && selectedEventId !== "all") params.set("eventId", selectedEventId);
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);
      if (searchTerm) params.set("search", searchTerm);

      const res = await fetch(`/api/organizer/bookings?${params.toString()}`);
      if (!res.ok) throw new Error("Fehler beim Laden der Buchungen");

      const data = await res.json();
      setOrganizer(data.organizer);
      setEvents(data.events || []);
      setBookings(data.bookings || []);
      setSummary(data.summary || {
        totalGrossCents: 0,
        completedCount: 0,
        refundedCount: 0,
        refundedGrossCents: 0,
        totalTicketsSold: 0,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [selectedEventId, startDate, endDate, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBookings();
  };

  // CSV Export Trigger
  const handleExportCsv = () => {
    const params = new URLSearchParams();
    if (selectedEventId && selectedEventId !== "all") params.set("eventId", selectedEventId);
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);
    if (searchTerm) params.set("search", searchTerm);
    params.set("format", "csv");

    window.open(`/api/organizer/bookings?${params.toString()}`, "_blank");
  };

  // Compute label for Tax Report Modal
  const selectedEventTitle =
    selectedEventId === "all"
      ? "Alle Veranstaltungen"
      : events.find((e) => e.id === selectedEventId)?.title || "Ausgewählte Veranstaltung";

  const getDateFilterLabel = () => {
    if (datePreset === "all" && !startDate && !endDate) return "Gesamter Zeitraum";
    if (datePreset === "this_month") return "Aktueller Monat";
    if (datePreset === "last_month") return "Letzter Monat";
    if (datePreset === "this_year") return "Aktuelles Kalenderjahr";
    if (startDate || endDate) return `${startDate || "Anfang"} bis ${endDate || "Heute"}`;
    return "Benutzerdefiniert";
  };

  return (
    <div className="space-y-8">
      {/* Top Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <Receipt className="w-8 h-8 text-indigo-500" />
            Buchungen & Finanzamt-Exporte
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Vollständige Einnahmenübersicht, GoBD-konforme Einzeltransaktionen, CSV & PDF Export für Buchhaltung und Steuerberater.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          <button
            onClick={handleExportCsv}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs flex items-center gap-2 border border-slate-700 transition-all hover:border-slate-600"
          >
            <Download className="w-4 h-4 text-emerald-400" /> CSV (Finanzamt / DATEV)
          </button>
          <button
            onClick={() => setShowTaxModal(true)}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all"
          >
            <FileText className="w-4 h-4" /> PDF Finanzbericht
          </button>
        </div>
      </div>

      {/* Summary KPI Analytics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 relative overflow-hidden">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Brutto-Gesamteinnahmen</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-bold text-white">
            <FormatCurrencyClient amountCents={summary.totalGrossCents} />
          </p>
          <p className="text-[11px] text-emerald-400 flex items-center gap-1">
            Abgeschlossene Verkäufe
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Abgeschlossene Buchungen</span>
            <CheckCircle2 className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-3xl font-bold text-white">{summary.completedCount}</p>
          <p className="text-[11px] text-indigo-400">Erfolgreich abgewickelt</p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Erstattungen & Stornos</span>
            <XCircle className="w-4 h-4 text-red-400" />
          </div>
          <p className="text-3xl font-bold text-white">{summary.refundedCount}</p>
          <p className="text-[11px] text-red-400">
            <FormatCurrencyClient amountCents={summary.refundedGrossCents} /> zurückerstattet
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Ausgegebene Tickets</span>
            <Ticket className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-3xl font-bold text-white">{summary.totalTicketsSold}</p>
          <p className="text-[11px] text-purple-400">Gültige Eintrittskarten</p>
        </div>
      </div>

      {/* Filter Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Filter className="w-4 h-4 text-indigo-400" /> Buchungsfilter
          </h2>
          <button
            onClick={() => {
              setSelectedEventId("all");
              handlePresetChange("all");
              setStatusFilter("all");
              setSearchTerm("");
            }}
            className="text-xs text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Filter zurücksetzen
          </button>
        </div>

        {/* Filter Controls Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Event Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Veranstaltung</label>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
            >
              <option value="all">Alle Veranstaltungen ({events.length})</option>
              {events.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.title} ({new Date(e.startDate).toLocaleDateString("de-DE")})
                </option>
              ))}
            </select>
          </div>

          {/* Quick Date Presets */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Zeitraum Schnellauswahl</label>
            <select
              value={datePreset}
              onChange={(e) => handlePresetChange(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
            >
              <option value="all">Gesamter Zeitraum</option>
              <option value="this_month">Diesen Monat</option>
              <option value="last_month">Letzten Monat</option>
              <option value="this_year">Dieses Kalenderjahr</option>
              <option value="custom">Benutzerdefiniert</option>
            </select>
          </div>

          {/* Custom Start Date */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Von Datum</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setDatePreset("custom");
              }}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Custom End Date */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Bis Datum</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setDatePreset("custom");
              }}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Status Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
            >
              <option value="all">Alle Status</option>
              <option value="completed">Abgeschlossen (Bezahlt)</option>
              <option value="refunded">Erstattet / Storniert</option>
              <option value="pending">Ausstehend (Pending)</option>
              <option value="failed">Fehlgeschlagen</option>
            </select>
          </div>
        </div>

        {/* Search Bar Row */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Suche nach Buchungs-ID, Kunden-E-Mail oder Stripe Payment Intent ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 placeholder:text-slate-600"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            Suchen
          </button>
        </form>
      </div>

      {/* Bookings Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-white">Buchungstransaktionen</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {loading ? "Lade Daten..." : `${bookings.length} Transaktionen für den ausgewählten Filter gefunden`}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-800/80 rounded-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Datum & Uhrzeit</th>
                <th className="py-3 px-4">Buchungs-ID</th>
                <th className="py-3 px-4">Veranstaltung</th>
                <th className="py-3 px-4">Kunde (E-Mail)</th>
                <th className="py-3 px-4">Tickets</th>
                <th className="py-3 px-4">Stripe Intent ID</th>
                <th className="py-3 px-4 text-right">Gesamtbetrag</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-500 mb-2" />
                    Buchungen werden geladen...
                  </td>
                </tr>
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    Keine Buchungen entsprechen deinen Filterkriterien.
                  </td>
                </tr>
              ) : (
                bookings.map((booking) => {
                  const dateObj = new Date(booking.createdAt);
                  const dateStr = dateObj.toLocaleDateString("de-DE");
                  const timeStr = dateObj.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
                  const isExpanded = expandedBookingId === booking.id;

                  return (
                    <React.Fragment key={booking.id}>
                      <tr
                        onClick={() => setExpandedBookingId(isExpanded ? null : booking.id)}
                        className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                      >
                        <td className="py-3 px-4 text-slate-300 whitespace-nowrap">
                          {dateStr} <span className="text-slate-500 text-[11px]">{timeStr}</span>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                          {booking.id}
                        </td>
                        <td className="py-3 px-4 font-medium text-white max-w-[160px] truncate">
                          {booking.eventTitle}
                        </td>
                        <td className="py-3 px-4 text-slate-300 max-w-[180px] truncate">
                          {booking.customerEmail}
                        </td>
                        <td className="py-3 px-4 text-slate-300 font-medium">
                          {booking.ticketsCount} Ticket{booking.ticketsCount > 1 ? "s" : ""}
                        </td>
                        <td className="py-3 px-4 font-mono text-[10px] text-slate-400 max-w-[140px] truncate">
                          {booking.stripePaymentIntentId}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-white whitespace-nowrap">
                          <FormatCurrencyClient amountCents={booking.totalCents} />
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border ${
                              booking.status === "completed"
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                : booking.status === "refunded"
                                ? "bg-red-500/10 text-red-400 border-red-500/20"
                                : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            }`}
                          >
                            {booking.status === "completed"
                              ? "Bezahlt"
                              : booking.status === "refunded"
                              ? "Erstattet"
                              : booking.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center text-slate-400">
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 mx-auto text-indigo-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 mx-auto hover:text-white" />
                          )}
                        </td>
                      </tr>

                      {/* Expandable Ticket Details Row */}
                      {isExpanded && (
                        <tr className="bg-slate-950/90 border-b border-slate-800">
                          <td colSpan={9} className="p-4">
                            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                              <div className="flex justify-between items-center">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
                                  <Ticket className="w-3.5 h-3.5" />
                                  Ticket-Einzelaufstellung für Buchung #{booking.id}
                                </h4>
                                <span className="text-[11px] text-slate-400">
                                  Stripe Checkout Session: <span className="font-mono text-slate-300">{booking.stripeCheckoutSessionId}</span>
                                </span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                                {booking.tickets.map((t) => (
                                  <div
                                    key={t.id}
                                    className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex justify-between items-center"
                                  >
                                    <div>
                                      <p className="text-xs font-semibold text-white">{t.attendeeName}</p>
                                      <p className="text-[10px] text-slate-400">{t.tierName}</p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-xs font-bold text-indigo-300">
                                        <FormatCurrencyClient amountCents={t.priceCents} />
                                      </p>
                                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 uppercase">
                                        {t.status}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tax Report Printable Preview Modal */}
      <TaxReportModal
        isOpen={showTaxModal}
        onClose={() => setShowTaxModal(false)}
        organizer={organizer}
        bookings={bookings}
        summary={summary}
        selectedEventTitle={selectedEventTitle}
        dateFilterLabel={getDateFilterLabel()}
      />
    </div>
  );
}
