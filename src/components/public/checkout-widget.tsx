"use client";

import { useState } from "react";
import { Ticket, Check, ShieldCheck, Building2, Info, Lock, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { formatLegalAddress, formatTaxDisclosure, STATUTORY_WITHDRAWAL_NOTICE, OrganizerLegalProfile } from "@/lib/legal";
import { createCheckoutSessionAction } from "@/app/actions/checkout-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface Tier {
  id: string;
  name: string;
  priceCents: number;
  feeCents?: number;
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
  const [termsAccepted, setTermsAccepted] = useState<boolean>(false);
  const [revocationAccepted, setRevocationAccepted] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedTier = tiers.find((t) => t.id === selectedTierId) || tiers[0];
  const tierBasePrice = selectedTier ? selectedTier.priceCents : 0;
  const tierFeePrice = selectedTier ? (selectedTier.feeCents || 0) : 0;
  const unitPrice = tierBasePrice + tierFeePrice;
  const totalPriceCents = unitPrice * quantity;

  const organizerSlug = organizer?.organizerSlug || "demo-organizer";
  const legalName = organizer?.legalName || organizer?.name || "Demo Events GmbH";
  const taxNotice = formatTaxDisclosure(organizer?.isSmallBusiness);
  const legalAddressText = formatLegalAddress(organizer);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (isCancelled) {
      setErrorMessage("Dieses Event wurde storniert. Es können keine Tickets mehr erworben werden.");
      return;
    }
    if (!isPublished) {
      setErrorMessage("Dieses Event befindet sich im Entwurfsmodus. Es können noch keine Tickets erworben werden.");
      return;
    }

    if (!termsAccepted) {
      setErrorMessage("Bitte bestätigen Sie die AGB und Datenschutzerklärung, um fortzufahren.");
      return;
    }
    if (!revocationAccepted) {
      setErrorMessage("Bitte bestätigen Sie die Kenntnisnahme zum Widerrufsausschluss, um fortzufahren.");
      return;
    }

    setLoading(true);

    try {
      const res = await createCheckoutSessionAction({
        eventId,
        ticketTierId: selectedTierId,
        quantity,
        customerName: buyerName,
        customerEmail: buyerEmail,
        termsAccepted: termsAccepted,
        privacyAccepted: termsAccepted,
        revocationExemptionAccepted: revocationAccepted,
      });

      if (!res.success) {
        setErrorMessage(res.error || "Stripe Checkout konnte nicht gestartet werden.");
        setLoading(false);
        return;
      }

      if (res.data?.checkoutUrl) {
        window.location.href = res.data.checkoutUrl;
      } else {
        setErrorMessage("Keine Checkout-URL von Stripe erhalten.");
        setLoading(false);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unerwarteter Fehler bei der Bestellung.";
      setErrorMessage(msg);
      setLoading(false);
    }
  };

  if (isCancelled) {
    return (
      <div className="bg-slate-900 border border-rose-800/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
        <div className="flex items-center gap-3 text-rose-400 border-b border-rose-900/50 pb-4">
          <div className="p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/20">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Ticketverkauf Gestoppt</h3>
            <p className="text-xs text-rose-400 mt-0.5">Veranstaltung wurde storniert</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-200 space-y-2">
          <p className="font-semibold text-rose-300">Dieses Event findet nicht statt.</p>
          <p className="text-rose-300/80">
            Grund: <span className="font-semibold text-white">{cancelReason || "Veranstaltung abgesagt"}</span>
          </p>
        </div>

        <Button disabled variant="secondary" className="w-full cursor-not-allowed">
          <Lock className="w-4 h-4 mr-2" /> Ticketkauf nicht verfügbar
        </Button>
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

        <Button disabled variant="secondary" className="w-full cursor-not-allowed">
          <Lock className="w-4 h-4 mr-2" /> Ticketkauf deaktiviert (Entwurf)
        </Button>
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
        <Badge variant="success" className="flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5" /> Stripe Sicher
        </Badge>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs sm:text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-400" />
          <p>{errorMessage}</p>
        </div>
      )}

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
            <Input
              type="text"
              required
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
              placeholder="Vor- und Nachname"
            />
            <Input
              type="email"
              required
              value={buyerEmail}
              onChange={(e) => setBuyerEmail(e.target.value)}
              placeholder="E-Mail-Adresse (für Ticketzustellung)"
            />
          </div>
        </div>

        {/* Statutory Withdrawal Notice (§ 312g BGB) */}
        <div className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-800/30 text-[11px] text-amber-300/90 leading-relaxed flex items-start gap-2">
          <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-300 mb-0.5">Widerrufsbelehrung & Rückgabe</p>
            <p>{STATUTORY_WITHDRAWAL_NOTICE}</p>
            {organizer?.revocationNoticeCustom && (
              <p className="mt-1 font-medium text-amber-200">{organizer.revocationNoticeCustom}</p>
            )}
          </div>
        </div>

        {/* Price Breakdown & Pre-Checkout Summary (§ 312j BGB) */}
        <div className="pt-4 border-t border-slate-800 space-y-4">
          {/* Detailed Order Summary Box */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center justify-between border-b border-slate-800 pb-2">
              <span>Bestellzusammenfassung</span>
              <span className="text-[10px] text-indigo-400 font-normal">Vor Absenden prüfen</span>
            </h4>

            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-slate-300">
                <span>Veranstaltung:</span>
                <span className="font-semibold text-white truncate max-w-[200px]">{eventTitle}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Vertragspartner & Verkäufer:</span>
                <span className="font-semibold text-white truncate max-w-[200px]">{legalName}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Ticketkategorie:</span>
                <span className="font-semibold text-white">{selectedTier?.name} ({quantity}x)</span>
              </div>
              <div className="flex justify-between text-slate-400 text-[11px]">
                <span>Einzelpreis Ticket:</span>
                <span>{formatCurrency(tierBasePrice)}</span>
              </div>
              <div className="flex justify-between text-slate-400 text-[11px]">
                <span>Vorverkaufs- / Systemgebühr:</span>
                <span>{tierFeePrice > 0 ? formatCurrency(tierFeePrice) : `${formatCurrency(0)} (Inkludiert)`}</span>
              </div>
              <div className="flex justify-between items-center text-sm pt-2 border-t border-slate-800 font-bold">
                <span className="text-white">Gesamtpreis:</span>
                <span className="text-xl font-extrabold text-indigo-400">{formatCurrency(totalPriceCents)}</span>
              </div>
              <p className="text-[10px] text-slate-400 text-right">{taxNotice}</p>
            </div>
          </div>

          {/* Separate Legal Checkboxes (AGB & Separater Widerrufsausschluss) */}
          <div className="space-y-3 pt-3 text-xs border-t border-slate-800">
            {/* Checkbox 1: AGB & Datenschutz */}
            <label className="flex items-start gap-2.5 cursor-pointer text-slate-300 hover:text-white transition-colors group p-3 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500 shrink-0 cursor-pointer"
              />
              <span className="leading-relaxed text-[11px]">
                Ich akzeptiere die{" "}
                <Link
                  href={`/o/${organizerSlug}/agb`}
                  target="_blank"
                  className="text-indigo-400 hover:underline font-semibold"
                  onClick={(e) => e.stopPropagation()}
                >
                  AGB von {legalName}
                </Link>{" "}
                sowie die{" "}
                <Link
                  href="/agb"
                  target="_blank"
                  className="text-indigo-400 hover:underline font-semibold"
                  onClick={(e) => e.stopPropagation()}
                >
                  GateMate Nutzungsbedingungen
                </Link>{" "}
                und nehme die{" "}
                <Link
                  href={`/o/${organizerSlug}/datenschutz`}
                  target="_blank"
                  className="text-indigo-400 hover:underline font-semibold"
                  onClick={(e) => e.stopPropagation()}
                >
                  Datenschutzerklärung
                </Link>{" "}
                zur Kenntnis. <span className="text-red-400">*</span>
              </span>
            </label>

            {/* Checkbox 2: Separater Widerrufsausschluss (§ 312g Abs. 2 Nr. 9 BGB) */}
            <label className="flex items-start gap-2.5 cursor-pointer text-slate-300 hover:text-white transition-colors group p-3 rounded-xl bg-amber-950/20 border border-amber-800/40 hover:border-amber-700/60">
              <input
                type="checkbox"
                checked={revocationAccepted}
                onChange={(e) => setRevocationAccepted(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-amber-700/60 bg-slate-950 text-amber-500 focus:ring-amber-500 shrink-0 cursor-pointer"
              />
              <span className="leading-relaxed text-[11px] text-amber-200/90">
                <strong className="text-amber-100 block font-semibold mb-0.5">Widerrufsausschluss (§ 312g Abs. 2 Nr. 9 BGB):</strong>
                Ich stimme ausdrücklich zu und nehme zur Kenntnis, dass bei Verträgen zur Erbringung von Dienstleistungen im Zusammenhang mit Freizeitbetätigungen zu einem spezifischen Termin <strong className="text-white">kein Widerrufsrecht</strong> besteht. <span className="text-red-400">*</span>
              </span>
            </label>
          </div>

          <Button
            type="submit"
            isLoading={loading}
            className="w-full py-4 rounded-2xl text-base font-extrabold shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2"
          >
            <Lock className="w-5 h-5" /> Zahlungspflichtig bestellen
          </Button>
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
