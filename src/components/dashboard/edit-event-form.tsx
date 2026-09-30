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
} from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

interface TierInput {
  id?: string;
  name: string;
  price: string;
  quantityAvailable: string;
  quantitySold: number;
}

interface EditEventFormProps {
  eventId: string;
}

export function EditEventForm({ eventId }: EditEventFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("Veranstaltung abgesagt");

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [venue, setVenue] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isListedInDirectory, setIsListedInDirectory] = useState(true);
  const [isPublished, setIsPublished] = useState(true);
  const [isCancelled, setIsCancelled] = useState(false);
  const [cancelReasonText, setCancelReasonText] = useState("");

  const [tiers, setTiers] = useState<TierInput[]>([]);

  useEffect(() => {
    fetchEventDetails();
  }, [eventId]);

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
        setBannerUrl(evt.bannerUrl || "");

        if (evt.startDate) {
          const sDate = new Date(evt.startDate);
          setStartDate(sDate.toISOString().slice(0, 16));
        }
        if (evt.endDate) {
          const eDate = new Date(evt.endDate);
          setEndDate(eDate.toISOString().slice(0, 16));
        }

        setIsListedInDirectory(Boolean(evt.isListedInDirectory));
        setIsPublished(Boolean(evt.isPublished));
        setIsCancelled(Boolean(evt.isCancelled));
        setCancelReasonText(evt.cancelReason || "");

        if (Array.isArray(evt.tiers)) {
          setTiers(
            evt.tiers.map((t: any) => ({
              id: t.id,
              name: t.name,
              price: (t.priceCents / 100).toFixed(2),
              quantityAvailable: String(t.quantityAvailable),
              quantitySold: t.quantitySold || 0,
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
    setTiers([...tiers, { name: "", price: "0.00", quantityAvailable: "50", quantitySold: 0 }]);
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
    setTiers(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !startDate || !endDate) {
      alert("Bitte füllen Sie alle Pflichtfelder aus.");
      return;
    }

    setSaving(true);

    try {
      const formattedTiers = tiers.map((t) => ({
        id: t.id,
        name: t.name || "Ticket Kategorie",
        priceCents: Math.round(parseFloat(t.price || "0") * 100),
        quantityAvailable: parseInt(t.quantityAvailable || "0", 10),
      }));

      const res = await fetch(`/api/events/${eventId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          slug,
          description,
          venue,
          bannerUrl,
          startDate,
          endDate,
          isListedInDirectory,
          isPublished,
          tiers: formattedTiers,
        }),
      });

      const data = await res.json();
      if (data.success) {
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
    <div className="space-y-8 max-w-4xl">
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

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Main Details Card */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-400" /> Event-Stammdaten
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Event-Titel *</label>
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
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">URL-Slug *</label>
              <div className="flex rounded-xl bg-slate-950 border border-slate-800 overflow-hidden text-sm">
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
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">Beschreibung</label>
            <textarea
              rows={3}
              disabled={isCancelled}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none disabled:opacity-50"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Veranstaltungsort / Adresse</label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  disabled={isCancelled}
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Banner-Bild URL</label>
              <div className="relative">
                <ImageIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="url"
                  disabled={isCancelled}
                  value={bannerUrl}
                  onChange={(e) => setBannerUrl(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Startdatum &amp; Uhrzeit *</label>
              <input
                type="datetime-local"
                required
                disabled={isCancelled}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Enddatum &amp; Uhrzeit *</label>
              <input
                type="datetime-local"
                required
                disabled={isCancelled}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
              />
            </div>
          </div>

          {/* Visibility Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isPublished ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}>
                  {isPublished ? <CheckCircle2 className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Veröffentlichungs-Status</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {isPublished ? "Event ist veröffentlicht & aktiv" : "Event ist ein Entwurf (nicht öffentlich)"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={isCancelled}
                onClick={() => setIsPublished(!isPublished)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  isPublished ? "bg-emerald-600 text-white" : "bg-amber-600/20 text-amber-300 border border-amber-500/30"
                } disabled:opacity-50`}
              >
                {isPublished ? "Veröffentlicht" : "Entwurf"}
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isListedInDirectory ? "bg-indigo-500/10 text-indigo-400" : "bg-slate-800 text-slate-400"}`}>
                  {isListedInDirectory ? <Globe className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                </div>
                <div>
                  <p className="text-xs font-bold text-white">GateMate Katalog-Sichtbarkeit</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {isListedInDirectory ? "Öffentlich im Katalog gelistet" : "Ungelistet (nur per Direktlink)"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={isCancelled}
                onClick={() => setIsListedInDirectory(!isListedInDirectory)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  isListedInDirectory ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-400"
                } disabled:opacity-50`}
              >
                {isListedInDirectory ? "Gelistet" : "Ungelistet"}
              </button>
            </div>
          </div>
        </div>

        {/* Ticket Tiers Section */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Ticket className="w-5 h-5 text-indigo-400" /> Ticket-Kategorien &amp; Kontingente
            </h3>
            {!isCancelled && (
              <button
                type="button"
                onClick={addTier}
                className="px-3 py-1.5 rounded-lg bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 text-xs font-medium flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Kategorie Hinzufügen
              </button>
            )}
          </div>

          <div className="space-y-3">
            {tiers.map((tier, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center gap-3">
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-medium text-slate-400 block mb-1">Kategorie Name</label>
                    <input
                      type="text"
                      required
                      disabled={isCancelled}
                      value={tier.name}
                      onChange={(e) => updateTier(idx, "name", e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-medium text-slate-400 block mb-1">Preis (EUR €)</label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1.5 text-xs text-slate-500">€</span>
                      <input
                        type="number"
                        step="0.01"
                        required
                        disabled={isCancelled}
                        value={tier.price}
                        onChange={(e) => updateTier(idx, "price", e.target.value)}
                        className="w-full pl-6 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-medium text-slate-400 block mb-1">
                      Kapazität (Verkauft: {tier.quantitySold})
                    </label>
                    <input
                      type="number"
                      required
                      min={tier.quantitySold}
                      disabled={isCancelled}
                      value={tier.quantityAvailable}
                      onChange={(e) => updateTier(idx, "quantityAvailable", e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                    />
                  </div>
                </div>

                {!isCancelled && tier.quantitySold === 0 && tiers.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeTier(idx)}
                    className="p-2 text-slate-500 hover:text-red-400 hover:bg-slate-900 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Action Controls */}
        {!isCancelled && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setShowCancelModal(true)}
              className="px-4 py-2.5 rounded-xl bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/20 text-xs font-semibold flex items-center gap-2 transition-colors w-full sm:w-auto"
            >
              <Ban className="w-4 h-4" /> Event Stornieren / Absagen
            </button>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <Link
                href="/organizer/events"
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition-colors"
              >
                Abbrechen
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 flex items-center gap-2 transition-all"
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
            </div>
          </div>
        )}
      </form>

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
  );
}
