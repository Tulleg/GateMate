"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Calendar, MapPin, Image, Ticket, Loader2, Globe, EyeOff, AlertTriangle, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { LegalComplianceResult } from "@/lib/legal";

interface TicketTierInput {
  name: string;
  price: string;
  quantityAvailable: string;
}

export function EventForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [venue, setVenue] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [startDate, setStartDate] = useState("2026-11-20T09:00");
  const [endDate, setEndDate] = useState("2026-11-20T18:00");
  const [isListedInDirectory, setIsListedInDirectory] = useState(true);

  const [tiers, setTiers] = useState<TicketTierInput[]>([
    { name: "General Admission", price: "49.00", quantityAvailable: "200" },
  ]);

  const [compliance, setCompliance] = useState<LegalComplianceResult | null>(null);
  const [checkingLegal, setCheckingLegal] = useState(true);

  useEffect(() => {
    fetchLegalStatus();
  }, []);

  const fetchLegalStatus = async () => {
    setCheckingLegal(true);
    try {
      const res = await fetch("/api/organizer/legal?organizerId=user_organizer_01");
      const data = await res.json();
      if (data.compliance) {
        setCompliance(data.compliance);
      }
    } catch (err) {
      console.error("Failed to fetch legal status", err);
    } finally {
      setCheckingLegal(false);
    }
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
  };

  const addTier = () => {
    setTiers([...tiers, { name: "", price: "0.00", quantityAvailable: "50" }]);
  };

  const removeTier = (index: number) => {
    if (tiers.length === 1) return;
    setTiers(tiers.filter((_, i) => i !== index));
  };

  const updateTier = (index: number, field: keyof TicketTierInput, value: string) => {
    const updated = [...tiers];
    updated[index][field] = value;
    setTiers(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !startDate || !endDate) {
      alert("Bitte füllen Sie den Titel und die Daten des Events aus.");
      return;
    }

    if (compliance && !compliance.isCompliant) {
      alert(
        `Veröffentlichung blockiert! Ihr Rechtsprofil ist unvollständig (${compliance.missingFields.join(
          ", "
        )}). Bitte vervollständigen Sie Ihr Rechtsprofil in den Einstellungen.`
      );
      return;
    }

    setLoading(true);

    try {
      const formattedTiers = tiers.map((t) => ({
        name: t.name || "Standard Pass",
        priceCents: Math.round(parseFloat(t.price || "0") * 100),
        quantityAvailable: parseInt(t.quantityAvailable || "0", 10),
      }));

      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizerId: "user_organizer_01",
          title,
          slug,
          description,
          venue,
          bannerUrl,
          startDate,
          endDate,
          isListedInDirectory,
          tiers: formattedTiers,
        }),
      });

      const data = await res.json();
      if (data.success) {
        router.push("/organizer/events");
        router.refresh();
      } else {
        alert(data.error || "Event konnte nicht erstellt werden.");
      }
    } catch (err: any) {
      alert("Fehler: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const isBlockedByLegal = compliance ? !compliance.isCompliant : false;

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-3xl">
      {/* Publication Guard Warning Banner */}
      {compliance && !compliance.isCompliant && (
        <div className="p-6 rounded-2xl bg-amber-950/40 border border-amber-800/60 text-amber-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-amber-300">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
              <span>Veröffentlichungsschutz aktiv (Publication Guard)</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
              Event-Publishing Blockiert
            </span>
          </div>

          <p className="text-xs text-amber-300/90 leading-relaxed">
            Gemäß deutsches Recht (§ 312j BGB &amp; TMG) können Sie Events erst veröffentlichen (<span className="font-mono text-amber-200">is_published = true</span>), sobald Ihr Veranstalter-Rechtsprofil vollständig eingerichtet ist.
          </p>

          <div className="text-xs font-semibold text-amber-200">
            Fehlende Pflichtangaben:
            <ul className="list-disc list-inside mt-1 space-y-0.5 font-normal text-amber-300/80">
              {compliance.missingFields.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          </div>

          <div className="pt-2">
            <Link
              href="/organizer/settings/legal"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shadow-lg shadow-amber-500/20"
            >
              <ShieldCheck className="w-4 h-4" /> Rechtliches Profil Vervollständigen
            </Link>
          </div>
        </div>
      )}

      {/* Basic Event Information */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Calendar className="w-5 h-5 text-indigo-400" /> Event Details
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">Event Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="e.g. Summer Music Festival 2026"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">URL Slug</label>
            <div className="flex rounded-xl bg-slate-950 border border-slate-800 overflow-hidden text-sm">
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
        </div>

        <div>
          <label className="text-xs font-medium text-slate-300 block mb-1">Description</label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Tell attendees what your event is about..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">Venue / City Location</label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="e.g. Convention Center, San Francisco, CA"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">Cover Image URL</label>
            <div className="relative">
              <Image className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="url"
                value={bannerUrl}
                onChange={(e) => setBannerUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">Start Date &amp; Time *</label>
            <input
              type="datetime-local"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">End Date &amp; Time *</label>
            <input
              type="datetime-local"
              required
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Directory Visibility Toggle */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isListedInDirectory ? "bg-indigo-500/10 text-indigo-400" : "bg-slate-800 text-slate-400"}`}>
              {isListedInDirectory ? <Globe className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
            </div>
            <div>
              <p className="text-xs font-bold text-white">List in Public GateMate Directory</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {isListedInDirectory ? "Visible on home page search & upcoming event discovery" : "Unlisted (private link / embed widget access only)"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsListedInDirectory(!isListedInDirectory)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              isListedInDirectory ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-400"
            }`}
          >
            {isListedInDirectory ? "Listed (Public)" : "Unlisted (Private)"}
          </button>
        </div>
      </div>

      {/* Ticket Tiers Section */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Ticket className="w-5 h-5 text-indigo-400" /> Ticket Tiers &amp; Pricing
          </h3>
          <button
            type="button"
            onClick={addTier}
            className="px-3 py-1.5 rounded-lg bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 text-xs font-medium flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add Tier
          </button>
        </div>

        <div className="space-y-3">
          {tiers.map((tier, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center gap-3">
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-medium text-slate-400 block mb-1">Tier Name</label>
                  <input
                    type="text"
                    required
                    value={tier.name}
                    onChange={(e) => updateTier(idx, "name", e.target.value)}
                    placeholder="e.g. VIP Access Pass"
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-medium text-slate-400 block mb-1">Price (EUR €)</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1.5 text-xs text-slate-500">€</span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={tier.price}
                      onChange={(e) => updateTier(idx, "price", e.target.value)}
                      placeholder="49.00"
                      className="w-full pl-6 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-medium text-slate-400 block mb-1">Quantity Capacity</label>
                  <input
                    type="number"
                    required
                    value={tier.quantityAvailable}
                    onChange={(e) => updateTier(idx, "quantityAvailable", e.target.value)}
                    placeholder="100"
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {tiers.length > 1 && (
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

      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || isBlockedByLegal}
          className={`px-6 py-2.5 rounded-xl font-medium text-xs shadow-lg flex items-center gap-2 transition-all ${
            isBlockedByLegal
              ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
              : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20"
          }`}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Erstelle Event...
            </>
          ) : isBlockedByLegal ? (
            <>
              <AlertTriangle className="w-4 h-4 text-amber-400" /> Veröffentlichung blockiert
            </>
          ) : (
            "Publish Event"
          )}
        </button>
      </div>
    </form>
  );
}
