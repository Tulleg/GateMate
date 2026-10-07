"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  Calendar,
  MapPin,
  Image,
  Ticket,
  Loader2,
  Globe,
  EyeOff,
  AlertTriangle,
  ShieldCheck,
  FileText,
  Accessibility,
  Clock,
  Euro,
} from "lucide-react";
import Link from "next/link";
import { OrganizerLegalProfile } from "@/lib/legal";
import { validateEventForPublication, EventPublicationValidationResult } from "@/lib/validation";
import { PublishLegalChecklistModal } from "./publish-legal-checklist-modal";
import { ImageUpload } from "./image-upload";
import { DatePicker } from "@/components/ui/date-picker";

interface TicketTierInput {
  name: string;
  price: string;
  fee: string;
  quantityAvailable: string;
  includedServices: string;
  ticketTerms: string;
}

interface EventFormProps {
  platformFeePercent?: number;
}

export function EventForm({ platformFeePercent }: EventFormProps) {
  const activeFeePercent = typeof platformFeePercent === "number" && !isNaN(platformFeePercent) ? platformFeePercent : 10;
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Form State
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
  const [startDate, setStartDate] = useState("2026-11-20T09:00");
  const [endDate, setEndDate] = useState("2026-11-20T18:00");
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

  // Ticket Tiers
  const [tiers, setTiers] = useState<TicketTierInput[]>([
    {
      name: "Standard-Eintritt",
      price: "49.00",
      fee: "4.90",
      quantityAvailable: "200",
      includedServices: "Standard Einlass, MVV-Ticket inklusive",
      ticketTerms: "Personengebunden",
    },
  ]);

  // Organizer Legal Profile State
  const [organizerProfile, setOrganizerProfile] = useState<OrganizerLegalProfile | null>(null);
  const [validationResult, setValidationResult] = useState<EventPublicationValidationResult | null>(null);

  // Modal State
  const [isChecklistOpen, setIsChecklistOpen] = useState(false);

  useEffect(() => {
    fetchLegalStatus();
  }, []);

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

  const handleTitleChange = (val: string) => {
    setTitle(val);
    setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
  };

  const addTier = () => {
    setTiers([
      ...tiers,
      {
        name: "",
        price: "0.00",
        fee: "0.00",
        quantityAvailable: "50",
        includedServices: "",
        ticketTerms: "",
      },
    ]);
  };

  const removeTier = (index: number) => {
    if (tiers.length === 1) return;
    setTiers(tiers.filter((_, i) => i !== index));
  };

  const updateTier = (index: number, field: keyof TicketTierInput, value: string) => {
    const updated = [...tiers];
    updated[index][field] = value;
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
    name: t.name || "Standard Pass",
    priceCents: Math.round(parseFloat(t.price || "0") * 100),
    feeCents: Math.round(parseFloat(t.fee || "0") * 100),
    quantityAvailable: parseInt(t.quantityAvailable || "0", 10),
    includedServices: t.includedServices,
    ticketTerms: t.ticketTerms,
  }));

  const handleOpenPublishChecklist = (e: React.FormEvent) => {
    e.preventDefault();
    const result = validateEventForPublication(organizerProfile, currentEventData, currentFormattedTiers);
    setValidationResult(result);
    setIsChecklistOpen(true);
  };

  const handleFinalPublish = async () => {
    await executeSaveEvent(true, true);
  };

  const handleSaveDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    await executeSaveEvent(false, false);
  };

  const executeSaveEvent = async (publish: boolean, legalChecklistConfirmed: boolean) => {
    setLoading(true);

    try {
      const res = await fetch("/api/events", {
        method: "POST",
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
        router.push("/organizer/events");
        router.refresh();
      } else {
        alert(data.error || "Event konnte nicht erstellt werden.");
      }
    } catch (err: any) {
      alert("Fehler beim Speichern: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const quickValidation = validateEventForPublication(organizerProfile, currentEventData, currentFormattedTiers);

  return (
    <>
      <form className="w-full max-w-[1600px] pb-12">
        {/* Sticky Header Bar mit Titel & Dauerhaft Sichtbaren Aktions-Buttons */}
        <div className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md -mt-4 sm:-mt-6 lg:-mt-8 -mx-4 sm:-mx-6 lg:-mx-8 p-4 sm:p-6 lg:px-8 border-b border-slate-800/80 shadow-2xl mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">Neues Event erstellen</h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Event-Details, Veranstaltungsort, Bannerbild und Ticket-Kategorien konfigurieren.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-medium text-slate-400 border border-slate-800 transition-colors"
            >
              Abbrechen
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={handleSaveDraft}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 font-bold text-xs border border-amber-500/20 flex items-center gap-1.5 transition-all shadow-md"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Als Entwurf speichern"}
            </button>

            <button
              type="button"
              disabled={loading || !quickValidation.canPublish}
              onClick={handleOpenPublishChecklist}
              className={`px-4 py-2 rounded-xl font-bold text-xs shadow-lg flex items-center gap-1.5 transition-all ${
                !quickValidation.canPublish
                  ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
                  : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20"
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Verarbeite...
                </>
              ) : !quickValidation.canPublish ? (
                <>
                  <AlertTriangle className="w-4 h-4 text-amber-400" /> Veröffentlichung blockiert
                </>
              ) : (
                "Event Veröffentlichen"
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Left Column (7-8 cols): Basic Info, Tickets, Conditions */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-8">
            {/* Section 1: Basic Event Information */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-5">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-400" /> 1. Allgemeine Veranstaltungsdaten
              </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300 block">Veranstaltungstitel *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="z.B. Summer Music Festival 2026"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300 block">URL-Slug</label>
              <div className="flex rounded-xl bg-slate-950 border border-slate-800 overflow-hidden font-mono">
                <span className="px-3 py-2.5 bg-slate-900 text-slate-500 text-xs flex items-center border-r border-slate-800">
                  /e/
                </span>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full px-3 py-2.5 bg-transparent text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <label className="font-semibold text-slate-300 block">Beschreibung (Wesentliche Leistung) *</label>
              <textarea
                rows={4}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Beschreibung der Veranstaltung, des Programms und der enthaltenen Leistungen..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="md:col-span-2">
              <ImageUpload
                value={bannerUrl}
                onChange={setBannerUrl}
                disabled={loading}
              />
            </div>
          </div>
        </div>

            {/* Section 4: Ticket Tiers, Prices & Fees */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-5">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Ticket className="w-5 h-5 text-indigo-400" /> 4. Ticketkategorien, Preise &amp; Gebühren
                </h3>
                <button
                  type="button"
                  onClick={addTier}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Kategorie Hinzufügen
                </button>
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
                          {tiers.length > 1 && (
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
                            value={tier.name}
                            onChange={(e) => updateTier(idx, "name", e.target.value)}
                            placeholder="z.B. VIP Pass / Standard Ticket"
                            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="font-medium text-slate-400 block mb-1">Ticket Grundpreis (Brutto in €) *</label>
                          <input
                            type="number"
                            step="0.01"
                            required
                            value={tier.price}
                            onChange={(e) => updateTier(idx, "price", e.target.value)}
                            placeholder="49.00"
                            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                          />
                        </div>

                        <div>
                          <label className="font-medium text-slate-400 block mb-1">System-/Servicegebühr ({activeFeePercent}% - EUR €)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={tier.fee}
                            onChange={(e) => updateTier(idx, "fee", e.target.value)}
                            placeholder="2.50"
                            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                          />
                        </div>

                        <div>
                          <label className="font-medium text-slate-400 block mb-1">Kontingent (Kapazität) *</label>
                          <input
                            type="number"
                            required
                            value={tier.quantityAvailable}
                            onChange={(e) => updateTier(idx, "quantityAvailable", e.target.value)}
                            placeholder="200"
                            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                          />
                        </div>

                        <div>
                          <label className="font-medium text-slate-400 block mb-1">Enthaltene Leistungen (optional)</label>
                          <input
                            type="text"
                            value={tier.includedServices}
                            onChange={(e) => updateTier(idx, "includedServices", e.target.value)}
                            placeholder="z.B. Inkl. 1 Freigetränk & ÖPNV"
                            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="font-medium text-slate-400 block mb-1">Besondere Ticketbedingungen</label>
                          <input
                            type="text"
                            value={tier.ticketTerms}
                            onChange={(e) => updateTier(idx, "ticketTerms", e.target.value)}
                            placeholder="z.B. Personengebunden, nicht übertragbar"
                            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Section 5: Specific Rules & Legal Text Overrides */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-5">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" /> 5. Event-Bedingungen, Barrierefreiheit &amp; Hausordnung
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300 block">Informationen zur Barrierefreiheit</label>
                  <textarea
                    rows={2}
                    value={accessibilityInfo}
                    onChange={(e) => setAccessibilityInfo(e.target.value)}
                    placeholder="z.B. Barrierefrei zugänglich, Rollstuhlplätze vorhanden..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300 block">Besondere Einlassbedingungen</label>
                  <textarea
                    rows={2}
                    value={specialAdmissionConditions}
                    onChange={(e) => setSpecialAdmissionConditions(e.target.value)}
                    placeholder="z.B. Ausweispflicht am Eingang, Taschenverbot ab DIN A4"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300 block">Hausordnung (Location-Regeln)</label>
                  <textarea
                    rows={2}
                    value={houseRules}
                    onChange={(e) => setHouseRules(e.target.value)}
                    placeholder="z.B. Rauchverbot im gesamten Gebäude..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300 block">Event-spezifische Stornobedingungen</label>
                  <textarea
                    rows={2}
                    value={cancellationPolicy}
                    onChange={(e) => setCancellationPolicy(e.target.value)}
                    placeholder="Überschreibt die allgemeinen Veranstalter-Stornobedingungen für dieses Event..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar Column (4-5 cols): Metadata, Dates, Location & Publish Actions */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-6 lg:sticky lg:top-4">
            {/* Action Controls Card (Immer an erster Stelle in der rechten Spalte) */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4 shadow-xl">
              <h4 className="text-sm font-bold text-white flex items-center justify-between">
                <span>Veröffentlichung &amp; Speichern</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-normal">Aktionen</span>
              </h4>
              
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  disabled={loading || !quickValidation.canPublish}
                  onClick={handleOpenPublishChecklist}
                  className={`w-full py-3 rounded-xl font-bold text-xs shadow-lg flex items-center justify-center gap-2 transition-all ${
                    !quickValidation.canPublish
                      ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
                      : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20"
                  }`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Verarbeite...
                    </>
                  ) : !quickValidation.canPublish ? (
                    <>
                      <AlertTriangle className="w-4 h-4 text-amber-400" /> Veröffentlichung blockiert
                    </>
                  ) : (
                    "Event Veröffentlichen"
                  )}
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={handleSaveDraft}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs border border-amber-500/20 flex items-center justify-center gap-2 transition-all"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Als Entwurf speichern"}
                </button>

                <button
                  type="button"
                  onClick={() => router.back()}
                  className="w-full py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-xs font-medium text-slate-400 transition-colors"
                >
                  Abbrechen
                </button>
              </div>
            </div>

            {/* Publication Guard Warning Banner */}
            {!quickValidation.canPublish && (
              <div className="p-6 rounded-3xl bg-amber-950/40 border border-amber-800/60 text-amber-200 space-y-3 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-amber-300 text-sm">
                    <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                    <span>Publication Guard aktiv</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                    {quickValidation.missingBlockingFields.length} fehlt
                  </span>
                </div>

                <p className="text-xs text-amber-300/90 leading-relaxed">
                  Eine Veröffentlichung ist erst möglich, wenn alle erforderlichen Veranstalter-, Event-, Preis- und Rechtstexte vorhanden sind.
                </p>

                <div className="text-xs font-semibold text-amber-200">
                  Fehlende Pflichtangaben:
                  <ul className="list-disc list-inside mt-1 space-y-0.5 font-normal text-amber-300/80">
                    {quickValidation.missingBlockingFields.map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                </div>

                <div className="pt-2">
                  <Link
                    href="/organizer/settings/legal"
                    target="_blank"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shadow-lg shadow-amber-500/20 w-full justify-center"
                  >
                    <ShieldCheck className="w-4 h-4" /> Rechtliches Profil Vervollständigen
                  </Link>
                </div>
              </div>
            )}

            {/* Section 3: Dates, Times & Sales Periods */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-5 shadow-xl">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-400" /> 3. Termine &amp; Uhrzeiten
              </h3>

              <div className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300 block">Veranstaltungsbeginn *</label>
                  <DatePicker
                    type="datetime-local"
                    required
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
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                )}

                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-white text-xs">Festes Enddatum</p>
                    <p className="text-[10px] text-slate-400">Deaktivieren für Ausstellungen / ganztägig</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={hasEndTime}
                    onChange={(e) => setHasEndTime(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 bg-slate-900 border-slate-700"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300 block">Einlassuhrzeit (optional)</label>
                  <DatePicker
                    type="datetime-local"
                    value={doorsOpenAt}
                    onChange={(e) => setDoorsOpenAt(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300 block">Altersbeschränkung *</label>
                  <select
                    value={ageRestriction}
                    onChange={(e) => setAgeRestriction(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Keine">Keine Altersbeschränkung</option>
                    <option value="Ab 18 Jahren">Ab 18 Jahren (Kein Zutritt U18)</option>
                    <option value="Ab 16 Jahren">Ab 16 Jahren (ggf. Muttizettel)</option>
                    <option value="Ab 14 Jahren">Ab 14 Jahren</option>
                    <option value="Ab 6 Jahren">Ab 6 Jahren</option>
                  </select>
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
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    placeholder="z.B. Olympic Hall Berlin"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300 block">Straße &amp; Hausnummer *</label>
                  <input
                    type="text"
                    required
                    value={venueStreet}
                    onChange={(e) => setVenueStreet(e.target.value)}
                    placeholder="z.B. Falckensteinstraße 49"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-300 block">PLZ *</label>
                    <input
                      type="text"
                      required
                      value={venueZip}
                      onChange={(e) => setVenueZip(e.target.value)}
                      placeholder="10997"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-300 block">Stadt *</label>
                    <input
                      type="text"
                      required
                      value={venueCity}
                      onChange={(e) => setVenueCity(e.target.value)}
                      placeholder="Berlin"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Interactive Publish Legal Checklist Modal */}
      <PublishLegalChecklistModal
        isOpen={isChecklistOpen}
        onClose={() => setIsChecklistOpen(false)}
        onConfirmPublish={handleFinalPublish}
        validation={validationResult}
        loading={loading}
      />
    </>
  );
}
