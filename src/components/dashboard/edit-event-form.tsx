"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  Calendar,
  MapPin,
  Image as ImageIcon,
  Ticket,
  Loader2,
  Globe,
  EyeOff,
  AlertOctagon,
  ArrowLeft,
  Save,
  Ban,
  CheckCircle2,
  FileText,
  Clock,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { OrganizerLegalProfile } from "@/lib/legal";
import { validateEventForPublication, EventPublicationValidationResult } from "@/lib/validation";
import { PublishLegalChecklistModal } from "./publish-legal-checklist-modal";
import { ImageUpload } from "./image-upload";
import { DatePicker } from "@/components/ui/date-picker";

interface TierInput {
  id?: string;
  name: string;
  price: string;
  fee: string;
  quantityAvailable: string;
  quantitySold: number;
  includedServices: string;
  ticketTerms: string;
}

interface EditEventFormProps {
  eventId: string;
  platformFeePercent?: number;
}

export function EditEventForm({ eventId, platformFeePercent }: EditEventFormProps) {
  const activeFeePercent = typeof platformFeePercent === "number" && !isNaN(platformFeePercent) ? platformFeePercent : 10;
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("Veranstaltung abgesagt");

  // Basic Form State
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");

  // Location & Venue
  const [venue, setVenue] = useState("");
  const [venueStreet, setVenueStreet] = useState("");
  const [venueZip, setVenueZip] = useState("");
  const [venueCity, setVenueCity] = useState("");
  const [venueCountry, setVenueCountry] = useState("Deutschland");

  // Dates & Times
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [hasEndTime, setHasEndTime] = useState(true);
  const [doorsOpenAt, setDoorsOpenAt] = useState("");
  const [salesStartDate, setSalesStartDate] = useState("");
  const [salesEndDate, setSalesEndDate] = useState("");

  // Special conditions
  const [ageRestriction, setAgeRestriction] = useState("Keine");
  const [accessibilityInfo, setAccessibilityInfo] = useState("");
  const [houseRules, setHouseRules] = useState("");
  const [specialAdmissionConditions, setSpecialAdmissionConditions] = useState("");
  const [eventTerms, setEventTerms] = useState("");
  const [cancellationPolicy, setCancellationPolicy] = useState("");

  const [isListedInDirectory, setIsListedInDirectory] = useState(true);
  const [isPublished, setIsPublished] = useState(true);
  const [initialIsPublished, setInitialIsPublished] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);
  const [cancelReasonText, setCancelReasonText] = useState("");

  const [tiers, setTiers] = useState<TierInput[]>([]);

  // Organizer Legal Profile State
  const [organizerProfile, setOrganizerProfile] = useState<OrganizerLegalProfile | null>(null);
  const [validationResult, setValidationResult] = useState<EventPublicationValidationResult | null>(null);

  // Modal State
  const [isChecklistOpen, setIsChecklistOpen] = useState(false);

  useEffect(() => {
    fetchEventDetails();
    fetchLegalStatus();
  }, [eventId]);

  const fetchLegalStatus = async () => {
    try {
      const res = await fetch("/api/organizer/legal");
      const data = await res.json();
      if (data.organizer) {
        setOrganizerProfile(data.organizer);
      }
    } catch (err) {
      console.error("Failed to fetch legal status", err);
    }
  };

  const fetchEventDetails = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}`);
      const data = await res.json();
      if (data.event) {
        const evt = data.event;
        setTitle(evt.title || "");
        setSlug(evt.slug || "");
        setDescription(evt.description || "");
        setVenue(evt.venue || "");
        setVenueStreet(evt.venueStreet || "");
        setVenueZip(evt.venueZip || "");
        setVenueCity(evt.venueCity || "");
        setVenueCountry(evt.venueCountry || "Deutschland");
        setBannerUrl(evt.bannerUrl || "");

        if (evt.startDate) {
          const sDate = new Date(evt.startDate);
          setStartDate(sDate.toISOString().slice(0, 16));
        }
        if (evt.endDate) {
          const eDate = new Date(evt.endDate);
          setEndDate(eDate.toISOString().slice(0, 16));
        }

        setHasEndTime(evt.hasEndTime ?? true);
        if (evt.doorsOpenAt) {
          const dDate = new Date(evt.doorsOpenAt);
          setDoorsOpenAt(dDate.toISOString().slice(0, 16));
        }

        setAgeRestriction(evt.ageRestriction || "Keine");
        setAccessibilityInfo(evt.accessibilityInfo || "");
        setHouseRules(evt.houseRules || "");
        setSpecialAdmissionConditions(evt.specialAdmissionConditions || "");
        setEventTerms(evt.eventTerms || "");
        setCancellationPolicy(evt.cancellationPolicy || "");

        if (evt.salesStartDate) {
          const ssDate = new Date(evt.salesStartDate);
          setSalesStartDate(ssDate.toISOString().slice(0, 16));
        }
        if (evt.salesEndDate) {
          const seDate = new Date(evt.salesEndDate);
          setSalesEndDate(seDate.toISOString().slice(0, 16));
        }

        setIsListedInDirectory(Boolean(evt.isListedInDirectory));
        setIsPublished(Boolean(evt.isPublished));
        setInitialIsPublished(Boolean(evt.isPublished));
        setIsCancelled(Boolean(evt.isCancelled));
        setCancelReasonText(evt.cancelReason || "");

        if (Array.isArray(evt.tiers)) {
          setTiers(
            evt.tiers.map((t: any) => ({
              id: t.id,
              name: t.name,
              price: (t.priceCents / 100).toFixed(2),
              fee: ((t.feeCents || 0) / 100).toFixed(2),
              quantityAvailable: String(t.quantityAvailable),
              quantitySold: t.quantitySold || 0,
              includedServices: t.includedServices || "",
              ticketTerms: t.ticketTerms || "",
            }))
          );
        }
      } else {
        alert(data.error || "Event konnte nicht geladen werden.");
      }
    } catch (err: any) {
      console.error("Failed to load event", err);
    } finally {
      setLoading(false);
    }
  };

  const addTier = () => {
    setTiers([
      ...tiers,
      {
        name: "",
        price: "0.00",
        fee: "0.00",
        quantityAvailable: "50",
        quantitySold: 0,
        includedServices: "",
        ticketTerms: "",
      },
    ]);
  };

  const removeTier = (index: number) => {
    const tier = tiers[index];
    if (tier.quantitySold > 0) {
      alert("Diese Kategorie kann nicht gelöscht werden, da bereits Tickets dafür verkauft wurden.");
      return;
    }
    setTiers(tiers.filter((_, i) => i !== index));
  };

  const updateTier = (index: number, field: keyof TierInput, value: string) => {
    const updated = [...tiers];
    (updated[index] as any)[field] = value;
    if (field === "price") {
      const parsedPrice = parseFloat(value || "0");
      if (!isNaN(parsedPrice) && parsedPrice >= 0) {
        updated[index].fee = (parsedPrice * (activeFeePercent / 100)).toFixed(2);
      }
    }
    setTiers(updated);
  };

  const currentEventData = {
    title,
    description,
    venue,
    venueStreet,
    venueZip,
    venueCity,
    venueCountry,
    startDate,
    endDate,
    hasEndTime,
    ageRestriction,
    accessibilityInfo,
    houseRules,
    specialAdmissionConditions,
    eventTerms,
    cancellationPolicy,
    salesStartDate,
    salesEndDate,
  };

  const currentFormattedTiers = tiers.map((t) => ({
    id: t.id,
    name: t.name || "Ticket Kategorie",
    priceCents: Math.round(parseFloat(t.price || "0") * 100),
    feeCents: Math.round(parseFloat(t.fee || "0") * 100),
    quantityAvailable: parseInt(t.quantityAvailable || "0", 10),
    includedServices: t.includedServices,
    ticketTerms: t.ticketTerms,
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // If attempting to switch from draft to published, run publication guard check first
    if (isPublished && !initialIsPublished) {
      const validation = validateEventForPublication(organizerProfile, currentEventData, currentFormattedTiers);
      setValidationResult(validation);
      setIsChecklistOpen(true);
      return;
    }

    await executeSaveEvent(isPublished, false);
  };

  const handleFinalPublish = async () => {
    await executeSaveEvent(true, true);
  };

  const executeSaveEvent = async (publish: boolean, legalChecklistConfirmed: boolean) => {
    if (!title || !startDate) {
      alert("Bitte füllen Sie alle Pflichtfelder aus.");
      return;
    }

    setSaving(true);

    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          slug,
          description,
          venue,
          venueStreet,
          venueZip,
          venueCity,
          venueCountry,
          bannerUrl,
          startDate,
          endDate: hasEndTime ? endDate : startDate,
          hasEndTime,
          doorsOpenAt: doorsOpenAt || null,
          ageRestriction,
          accessibilityInfo,
          houseRules,
          specialAdmissionConditions,
          eventTerms,
          cancellationPolicy,
          salesStartDate: salesStartDate || null,
          salesEndDate: salesEndDate || null,
          isListedInDirectory,
          isPublished: publish,
          legalChecklistConfirmed,
          tiers: currentFormattedTiers,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIsChecklistOpen(false);
        alert("Event erfolgreich aktualisiert!");
        router.push("/organizer/events");
        router.refresh();
      } else {
        alert(data.error || "Event konnte nicht aktualisiert werden.");
      }
    } catch (err: any) {
      alert("Fehler beim Speichern: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEvent = async () => {
    setCancelling(true);
    try {
      const res = await fetch(`/api/events/${eventId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cancelReason }),
      });

      const data = await res.json();
      if (data.success) {
        alert(`Event storniert! ${data.cancelledTicketsCount} Ticket(s) storniert, ${data.refundedOrdersCount} Bestellung(en) zurückerstattet.`);
        setShowCancelModal(false);
        fetchEventDetails();
      } else {
        alert(data.error || "Event konnte nicht storniert werden.");
      }
    } catch (err: any) {
      alert("Fehler bei der Stornierung: " + err.message);
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-400 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
        <span>Event-Daten werden geladen...</span>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-8 w-full max-w-[1600px] pb-24 lg:pb-12">
        <Link
          href="/organizer/events"
          className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Zurück zur Event-Übersicht
        </Link>

        {/* Cancelled Banner */}
        {isCancelled && (
          <div className="p-6 rounded-2xl bg-red-950/60 border border-red-800 text-red-200 space-y-2">
            <div className="flex items-center gap-2 font-bold text-red-400 text-lg">
              <AlertOctagon className="w-6 h-6 shrink-0" />
              <span>Dieses Event wurde storniert</span>
            </div>
            <p className="text-xs text-red-300 leading-relaxed">
              Stornierungsgrund: <span className="font-semibold text-white">{cancelReasonText || "Veranstaltung abgesagt"}</span>
            </p>
            <p className="text-[11px] text-red-400/80">
              Alle zugehörigen Tickets wurden entwertet und die Bestellungen auf zurückerstattet gesetzt. Ein storniertes Event kann nicht mehr bearbeitet werden.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column (7-8 cols): Main Content & Tickets */}
            <div className="lg:col-span-7 xl:col-span-8 space-y-8">
              {/* Section 1: Main Details */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-5">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-400" /> 1. Event-Stammdaten
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300 block">Event-Titel *</label>
                <input
                  type="text"
                  required
                  disabled={isCancelled}
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (!slug) {
                      setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
                    }
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300 block">URL-Slug *</label>
                <div className="flex rounded-xl bg-slate-950 border border-slate-800 overflow-hidden font-mono">
                  <span className="px-3 py-2.5 bg-slate-900 text-slate-500 text-xs flex items-center border-r border-slate-800">
                    /e/
                  </span>
                  <input
                    type="text"
                    required
                    disabled={isCancelled}
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full px-3 py-2.5 bg-transparent text-white focus:outline-none disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <label className="font-semibold text-slate-300 block">Beschreibung (Wesentliche Leistung) *</label>
                <textarea
                  rows={4}
                  required
                  disabled={isCancelled}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none disabled:opacity-50"
                />
              </div>

              <div className="md:col-span-2">
                <ImageUpload
                  value={bannerUrl}
                  onChange={setBannerUrl}
                  disabled={loading || isCancelled}
                />
              </div>
            </div>
          </div>

            {/* Section 4: Ticket Tiers */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-5">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Ticket className="w-5 h-5 text-indigo-400" /> 4. Ticket-Kategorien &amp; Preise
                </h3>
                {!isCancelled && (
                  <button
                    type="button"
                    onClick={addTier}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Kategorie Hinzufügen
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {tiers.map((tier, idx) => {
                  const basePrice = parseFloat(tier.price || "0");
                  const feePrice = parseFloat(tier.fee || "0");
                  const totalPrice = (basePrice + feePrice).toFixed(2);

                  return (
                    <div key={idx} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 text-xs">
                      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                        <span className="font-bold text-white text-sm">Ticketkategorie #{idx + 1}</span>
                        <div className="flex items-center gap-3">
                          <span className="px-3 py-1 rounded-xl bg-indigo-500/10 text-indigo-400 font-mono font-bold text-xs">
                            Gesamtpreis: {totalPrice} € (inkl. {feePrice.toFixed(2)} € Gebühren)
                          </span>
                          {!isCancelled && tier.quantitySold === 0 && tiers.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeTier(idx)}
                              className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-900 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="font-medium text-slate-400 block mb-1">Kategorie Name *</label>
                          <input
                            type="text"
                            required
                            disabled={isCancelled}
                            value={tier.name}
                            onChange={(e) => updateTier(idx, "name", e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                          />
                        </div>

                        <div>
                          <label className="font-medium text-slate-400 block mb-1">Ticket Grundpreis (Brutto in €) *</label>
                          <input
                            type="number"
                            step="0.01"
                            required
                            disabled={isCancelled}
                            value={tier.price}
                            onChange={(e) => updateTier(idx, "price", e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono disabled:opacity-50"
                          />
                        </div>

                        <div>
                          <label className="font-medium text-slate-400 block mb-1">System-/Servicegebühr ({activeFeePercent}% - EUR €)</label>
                          <input
                            type="number"
                            step="0.01"
                            disabled={isCancelled}
                            value={tier.fee}
                            onChange={(e) => updateTier(idx, "fee", e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono disabled:opacity-50"
                          />
                        </div>

                        <div>
                          <label className="font-medium text-slate-400 block mb-1">
                            Kapazität (Verkauft: {tier.quantitySold}) *
                          </label>
                          <input
                            type="number"
                            required
                            min={tier.quantitySold}
                            disabled={isCancelled}
                            value={tier.quantityAvailable}
                            onChange={(e) => updateTier(idx, "quantityAvailable", e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono disabled:opacity-50"
                          />
                        </div>

                        <div>
                          <label className="font-medium text-slate-400 block mb-1">Enthaltene Leistungen (optional)</label>
                          <input
                            type="text"
                            disabled={isCancelled}
                            value={tier.includedServices}
                            onChange={(e) => updateTier(idx, "includedServices", e.target.value)}
                            placeholder="z.B. MVV-Ticket inklusive"
                            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                          />
                        </div>

                        <div>
                          <label className="font-medium text-slate-400 block mb-1">Ticketbedingungen</label>
                          <input
                            type="text"
                            disabled={isCancelled}
                            value={tier.ticketTerms}
                            onChange={(e) => updateTier(idx, "ticketTerms", e.target.value)}
                            placeholder="z.B. Personengebunden"
                            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Section 5: Specific Rules */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-5">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" /> 5. Event-Bedingungen, Barrierefreiheit &amp; Hausordnung
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300 block">Barrierefreiheit</label>
                  <textarea
                    rows={2}
                    disabled={isCancelled}
                    value={accessibilityInfo}
                    onChange={(e) => setAccessibilityInfo(e.target.value)}
                    placeholder="Rollstuhlgerecht..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300 block">Besondere Einlassbedingungen</label>
                  <textarea
                    rows={2}
                    disabled={isCancelled}
                    value={specialAdmissionConditions}
                    onChange={(e) => setSpecialAdmissionConditions(e.target.value)}
                    placeholder="Ausweispflicht..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300 block">Hausordnung</label>
                  <textarea
                    rows={2}
                    disabled={isCancelled}
                    value={houseRules}
                    onChange={(e) => setHouseRules(e.target.value)}
                    placeholder="Rauchverbot..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300 block">Event Stornobedingungen</label>
                  <textarea
                    rows={2}
                    disabled={isCancelled}
                    value={cancellationPolicy}
                    onChange={(e) => setCancellationPolicy(e.target.value)}
                    placeholder="Spezifische Stornobedingungen für dieses Event..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (4-5 cols): Metadata, Dates, Location & Status Controls */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-6 lg:sticky lg:top-4">
            {/* Action Controls Card (Immer an erster Stelle in der rechten Spalte) */}
            {!isCancelled && (
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4 shadow-xl">
                <h4 className="text-sm font-bold text-white flex items-center justify-between">
                  <span>Änderungen Speichern</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-normal">Aktionen</span>
                </h4>

                <div className="flex flex-col gap-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Speichere...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" /> Änderungen Speichern
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowCancelModal(true)}
                    className="w-full py-2.5 rounded-xl bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/20 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                  >
                    <Ban className="w-4 h-4" /> Event Stornieren
                  </button>

                  <Link
                    href="/organizer/events"
                    className="w-full py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-xs font-medium text-slate-400 transition-colors text-center"
                  >
                    Abbrechen
                  </Link>
                </div>
              </div>
            )}

            {/* Section 3: Dates & Times */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-5 shadow-xl">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-400" /> 3. Termine, Uhrzeiten &amp; Status
              </h3>

              <div className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300 block">Veranstaltungsbeginn *</label>
                  <DatePicker
                    type="datetime-local"
                    required
                    disabled={isCancelled}
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>

                {hasEndTime && (
                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-300 block">Veranstaltungsende *</label>
                    <DatePicker
                      type="datetime-local"
                      required={hasEndTime}
                      disabled={isCancelled}
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                )}

                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-white text-xs">Festes Enddatum</p>
                    <p className="text-[10px] text-slate-400">Für Ausstellungen / ganztägig deaktivieren</p>
                  </div>
                  <input
                    type="checkbox"
                    disabled={isCancelled}
                    checked={hasEndTime}
                    onChange={(e) => setHasEndTime(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 bg-slate-900 border-slate-700"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300 block">Altersbeschränkung *</label>
                  <select
                    disabled={isCancelled}
                    value={ageRestriction}
                    onChange={(e) => setAgeRestriction(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    <option value="Keine">Keine Altersbeschränkung</option>
                    <option value="Ab 18 Jahren">Ab 18 Jahren</option>
                    <option value="Ab 16 Jahren">Ab 16 Jahren</option>
                    <option value="Ab 14 Jahren">Ab 14 Jahren</option>
                    <option value="Ab 6 Jahren">Ab 6 Jahren</option>
                  </select>
                </div>
              </div>

              {/* Visibility Toggles */}
              <div className="space-y-3 pt-2 border-t border-slate-800/80">
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-1.5 rounded-lg ${isPublished ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}>
                      {isPublished ? <CheckCircle2 className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Status</p>
                      <p className="text-[10px] text-slate-400">{isPublished ? "Veröffentlicht" : "Entwurf"}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isCancelled}
                    onClick={() => setIsPublished(!isPublished)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                      isPublished ? "bg-emerald-600 text-white" : "bg-amber-600/20 text-amber-300 border border-amber-500/30"
                    } disabled:opacity-50`}
                  >
                    {isPublished ? "Aktiv" : "Entwurf"}
                  </button>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-1.5 rounded-lg ${isListedInDirectory ? "bg-indigo-500/10 text-indigo-400" : "bg-slate-800 text-slate-400"}`}>
                      {isListedInDirectory ? <Globe className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Katalog-Sichtbarkeit</p>
                      <p className="text-[10px] text-slate-400">{isListedInDirectory ? "Gelistet" : "Ungelistet"}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isCancelled}
                    onClick={() => setIsListedInDirectory(!isListedInDirectory)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                      isListedInDirectory ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-400"
                    } disabled:opacity-50`}
                  >
                    {isListedInDirectory ? "Gelistet" : "Ungelistet"}
                  </button>
                </div>
              </div>
            </div>

            {/* Section 2: Location & Address */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-5 shadow-xl">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-indigo-400" /> 2. Veranstaltungsort &amp; Adresse
              </h3>

              <div className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300 block">Location Name *</label>
                  <input
                    type="text"
                    required
                    disabled={isCancelled}
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300 block">Straße &amp; Hausnummer *</label>
                  <input
                    type="text"
                    required
                    disabled={isCancelled}
                    value={venueStreet}
                    onChange={(e) => setVenueStreet(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-300 block">PLZ *</label>
                    <input
                      type="text"
                      required
                      disabled={isCancelled}
                      value={venueZip}
                      onChange={(e) => setVenueZip(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-300 block">Stadt *</label>
                    <input
                      type="text"
                      required
                      disabled={isCancelled}
                      value={venueCity}
                      onChange={(e) => setVenueCity(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Mobile Sticky Bottom Action Bar */}
      {!isCancelled && (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 p-3 sm:px-6 shadow-2xl flex items-center justify-between gap-3 lg:hidden">
          <Link
            href="/organizer/events"
            className="py-2.5 px-4 rounded-xl bg-slate-950 hover:bg-slate-800 text-xs font-medium text-slate-400 transition-colors"
          >
            Abbrechen
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowCancelModal(true)}
              className="py-2.5 px-3 rounded-xl bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/20 text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <Ban className="w-3.5 h-3.5" /> Stornieren
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => {
                const formEl = document.querySelector("form");
                if (formEl) formEl.requestSubmit();
              }}
              className="py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 flex items-center gap-1.5 transition-all"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>Speichern</span>
            </button>
          </div>
        </div>
      )}

        {/* Cancellation Confirmation Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-red-800/80 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-6 shadow-2xl animate-in fade-in zoom-in duration-200">
              <div className="flex items-center gap-3 text-red-400">
                <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20">
                  <AlertOctagon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-white">Event Stornieren?</h3>
                  <p className="text-xs text-slate-400">Diese Aktion kann nicht rückgängig gemacht werden!</p>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-4 rounded-2xl border border-slate-800">
                Beim Stornieren werden <span className="font-bold text-white">alle verkauften Tickets entwertet</span>, die eventuellen Zahlungen als zurückerstattet markiert und der Ticketverkauf sofort gestoppt.
              </p>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Grund der Stornierung</label>
                <input
                  type="text"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="z.B. Wetterbedingt, Absage durch Künstler"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={cancelling}
                  onClick={() => setShowCancelModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  type="button"
                  disabled={cancelling}
                  onClick={handleCancelEvent}
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-600/30 flex items-center gap-2 transition-all"
                >
                  {cancelling ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Storniere...
                    </>
                  ) : (
                    <>
                      <Ban className="w-4 h-4" /> Ja, Event Endgültig Stornieren
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Publish Legal Checklist Modal */}
      <PublishLegalChecklistModal
        isOpen={isChecklistOpen}
        onClose={() => setIsChecklistOpen(false)}
        onConfirmPublish={handleFinalPublish}
        validation={validationResult}
        loading={saving}
      />
    </>
  );
}
