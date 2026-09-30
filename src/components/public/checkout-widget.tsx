"use client";

import { useState } from "react";
import { Ticket, ShoppingBag, Loader2, Check, ShieldCheck, Building2, Info, Lock } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { formatLegalAddress, formatTaxDisclosure, STATUTORY_WITHDRAWAL_NOTICE, OrganizerLegalProfile } from "@/lib/legal";
import Link from "next/link";

interface Tier {
  id: string;
  name: string;
  priceCents: number;
  quantityAvailable: number;
  quantitySold: number;
}

interface CheckoutWidgetProps {
  eventId: string;
  eventTitle: string;
  tiers: Tier[];
  organizer?: OrganizerLegalProfile | null;
  isCancelled?: boolean;
  cancelReason?: string | null;
  isPublished?: boolean;
}

export function CheckoutWidget({
  eventId,
  eventTitle,
  tiers,
  organizer,
  isCancelled,
  cancelReason,
  isPublished = true,
}: CheckoutWidgetProps) {
  const [selectedTierId, setSelectedTierId] = useState<string>(tiers[0]?.id || "");
  const [quantity, setQuantity] = useState<number>(1);
  const [buyerName, setBuyerName] = useState<string>("");
  const [buyerEmail, setBuyerEmail] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const selectedTier = tiers.find((t) => t.id === selectedTierId) || tiers[0];
  const unitPrice = selectedTier ? selectedTier.priceCents : 0;
  const totalPriceCents = unitPrice * quantity;

  const organizerSlug = organizer?.organizerSlug || "demo-organizer";
  const legalName = organizer?.legalName || organizer?.name || "Demo Events GmbH";
  const taxNotice = formatTaxDisclosure(organizer?.isSmallBusiness);
  const legalAddressText = formatLegalAddress(organizer);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCancelled) {
      alert("Dieses Event wurde storniert. Es können keine Tickets mehr erworben werden.");
      return;
    }
    if (!isPublished) {
      alert("Dieses Event befindet sich im Entwurfsmodus. Es können noch keine Tickets erworben werden.");
      return;
    }
    if (!buyerName || !buyerEmail) {
      alert("Bitte geben Sie Ihren Namen und Ihre E-Mail-Adresse ein.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/checkout/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          tierId: selectedTierId,
          quantity,
          buyerName,
          buyerEmail,
        }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Stripe Checkout konnte nicht gestartet werden.");
      }
    } catch (err: any) {
      alert("Fehler: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (isCancelled) {
    return (
      <div className="bg-slate-900 border border-red-800/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
        <div className="flex items-center gap-3 text-red-400 border-b border-red-900/50 pb-4">
          <div className="p-2.5 rounded-2xl bg-red-500/10 border border-red-500/20">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Ticketverkauf Gestoppt</h3>
            <p className="text-xs text-red-400 mt-0.5">Veranstaltung wurde storniert</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-red-950/40 border border-red-800/60 text-xs text-red-200 space-y-2">
          <p className="font-semibold text-red-300">Dieses Event findet nicht statt.</p>
          <p className="text-red-300/80">
            Grund: <span className="font-semibold text-white">{cancelReason || "Veranstaltung abgesagt"}</span>
          </p>
        </div>

        <button
          disabled
          className="w-full py-4 rounded-2xl bg-slate-800 text-slate-500 font-bold text-base cursor-not-allowed border border-slate-700 flex items-center justify-center gap-2"
        >
          <Lock className="w-5 h-5 text-slate-500" /> Ticketkauf nicht verfügbar
        </button>
      </div>
    );
  }

  if (!isPublished) {
    return (
      <div className="bg-slate-900 border border-amber-800/60 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
        <div className="flex items-center gap-3 text-amber-400 border-b border-amber-900/50 pb-4">
          <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Event im Entwurf</h3>
            <p className="text-xs text-amber-400 mt-0.5">Noch nicht veröffentlicht</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-800/60 text-xs text-amber-200 space-y-2">
          <p className="font-semibold text-amber-300">Vorschau für Veranstalter</p>
          <p className="text-amber-300/80">
            Der Ticketverkauf wird aktiviert, sobald der Veranstalter das Event veröffentlicht.
          </p>
        </div>

        <button
          disabled
          className="w-full py-4 rounded-2xl bg-slate-800 text-slate-500 font-bold text-base cursor-not-allowed border border-slate-700 flex items-center justify-center gap-2"
        >
          <Lock className="w-5 h-5 text-slate-500" /> Ticketkauf deaktiviert (Entwurf)
        </button>
      </div>
    );
  }

  if (!tiers || tiers.length === 0) {
    return (
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center text-slate-400 text-sm">
        Keine aktiven Ticket-Kategorien für dieses Event verfügbar.
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Ticket className="w-5 h-5 text-indigo-400" /> Tickets wählen
          </h3>
          <p className="text-xs text-slate-400 mt-1">Sofortige digitale QR-Ticket Zustellung per E-Mail.</p>
        </div>
        <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5" /> Stripe Sicher
        </span>
      </div>

      {/* Contract Partner Box (§ 312j BGB Requirement) */}
      <div className="p-4 rounded-2xl bg-slate-950/80 border border-indigo-500/20 space-y-1 text-xs">
        <div className="flex items-center gap-1.5 font-bold text-indigo-300">
          <Building2 className="w-3.5 h-3.5 text-indigo-400" />
          <span>Vertragspartner für diese Buchung:</span>
        </div>
        <p className="text-slate-200 font-semibold pl-5">
          {legalName}
        </p>
        <p className="text-[11px] text-slate-400 pl-5">
          {legalAddressText}
          {organizer?.vatId && ` • USt-ID: ${organizer.vatId}`}
        </p>
      </div>

      <form onSubmit={handleCheckout} className="space-y-6">
        {/* Tier Selector List */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">Ticket-Kategorie</label>
          <div className="space-y-2">
            {tiers.map((t) => {
              const isSoldOut = t.quantitySold >= t.quantityAvailable;
              const isSelected = t.id === selectedTierId;

              return (
                <div
                  key={t.id}
                  onClick={() => !isSoldOut && setSelectedTierId(t.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? "bg-indigo-600/10 border-indigo-500 text-white shadow-lg shadow-indigo-600/10"
                      : "bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700"
                  } ${isSoldOut ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        isSelected ? "border-indigo-400 bg-indigo-600 text-white" : "border-slate-700"
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-white">{t.name}</p>
                      <p className="text-[11px] text-slate-400">
                        {isSoldOut ? "Ausverkauft" : `Noch ${t.quantityAvailable - t.quantitySold} Tickets verfügbar`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-extrabold text-indigo-400 block">
                      {formatCurrency(t.priceCents)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">{taxNotice}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quantity Picker */}
        <div className="flex items-center justify-between p-4 bg-slate-950/60 border border-slate-800 rounded-2xl">
          <div>
            <p className="text-xs font-semibold text-white">Anzahl</p>
            <p className="text-[11px] text-slate-400">Anzahl der Tickets</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm flex items-center justify-center transition-colors"
            >
              -
            </button>
            <span className="font-bold text-base text-white w-4 text-center">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity(Math.min(10, quantity + 1))}
              className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm flex items-center justify-center transition-colors"
            >
              +
            </button>
          </div>
        </div>

        {/* Buyer Info Inputs */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">Käufer / Teilnehmer Daten</label>
          <div className="space-y-3">
            <input
              type="text"
              required
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
              placeholder="Vor- und Nachname"
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="email"
              required
              value={buyerEmail}
              onChange={(e) => setBuyerEmail(e.target.value)}
              placeholder="E-Mail-Adresse (für Ticketzustellung)"
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Statutory Withdrawal Notice (§ 312g BGB) */}
        <div className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-800/30 text-[11px] text-amber-300/90 leading-relaxed flex items-start gap-2">
          <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-300 mb-0.5">Widerrufsbelehrung &amp; Rückgabe</p>
            <p>{STATUTORY_WITHDRAWAL_NOTICE}</p>
            {organizer?.revocationNoticeCustom && (
              <p className="mt-1 font-medium text-amber-200">{organizer.revocationNoticeCustom}</p>
            )}
          </div>
        </div>

        {/* Price Breakdown & Final German Button-Lösung Submit Button (§ 312j BGB) */}
        <div className="pt-4 border-t border-slate-800 space-y-4">
          <div className="space-y-1">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400">Gesamtbetrag ({quantity} Ticket{quantity > 1 ? "s" : ""})</span>
              <span className="text-2xl font-extrabold text-white">{formatCurrency(totalPriceCents)}</span>
            </div>
            <p className="text-[11px] text-slate-400 text-right">{taxNotice}</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-base shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Weiter zu Stripe...
              </>
            ) : (
              <>
                <Lock className="w-5 h-5" /> Zahlungspflichtig bestellen
              </>
            )}
          </button>
        </div>
      </form>

      {/* Clear Separation in Checkout Footer: Organizer Legal vs. Platform Legal */}
      <div className="pt-4 border-t border-slate-800/80 space-y-3 text-[11px] text-slate-400">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="font-semibold text-slate-300 block mb-1">Veranstalter Rechtliches:</span>
            <div className="flex flex-wrap gap-3">
              <Link
                href={`/o/${organizerSlug}/impressum`}
                target="_blank"
                className="hover:text-indigo-400 underline underline-offset-2 transition-colors"
              >
                Veranstalter Impressum
              </Link>
              <Link
                href={`/o/${organizerSlug}/datenschutz`}
                target="_blank"
                className="hover:text-indigo-400 underline underline-offset-2 transition-colors"
              >
                Datenschutz
              </Link>
              <Link
                href={`/o/${organizerSlug}/agb`}
                target="_blank"
                className="hover:text-indigo-400 underline underline-offset-2 transition-colors"
              >
                Veranstalter AGB
              </Link>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-800/50 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-500">
          <span>GateMate agiert ausschließlich als technischer Dienstleister und Vermittler.</span>
          <div className="flex gap-2">
            <span className="text-slate-400 font-semibold">GateMate Platform</span>
          </div>
        </div>
      </div>
    </div>
  );
}
