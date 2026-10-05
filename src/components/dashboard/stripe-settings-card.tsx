"use client";

import { useState, useEffect } from "react";
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Loader2,
  ChevronDown,
  ChevronUp,
  Key,
  Copy,
  Check,
  Save,
  Trash2,
  HelpCircle,
} from "lucide-react";

interface StripeSettingsCardProps {
  userId?: string;
}

export function StripeSettingsCard({ userId }: StripeSettingsCardProps) {
  const [connectLoading, setConnectLoading] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);

  // Stripe Keys state
  const [stripeMode, setStripeMode] = useState<"connect" | "direct_keys">("connect");
  const [connectedAccountId, setConnectedAccountId] = useState<string | null>(null);
  const [detailsSubmitted, setDetailsSubmitted] = useState(false);
  const [chargesEnabled, setChargesEnabled] = useState(false);
  const [publishableKey, setPublishableKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");

  const [hasSecretKey, setHasSecretKey] = useState(false);
  const [hasWebhookSecret, setHasWebhookSecret] = useState(false);

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [statusSuccess, setStatusSuccess] = useState<string | null>(null);
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  const [appUrl, setAppUrl] = useState("");

  useEffect(() => {
    setAppUrl(window.location.origin);
    fetchStripeStatus();
  }, []);

  const fetchStripeStatus = async () => {
    setFetching(true);
    try {
      const res = await fetch("/api/organizer/stripe-keys");
      const data = await res.json();

      if (res.ok) {
        setStripeMode(data.stripeMode || "connect");
        setConnectedAccountId(data.stripeConnectedAccountId || null);
        setDetailsSubmitted(Boolean(data.detailsSubmitted));
        setChargesEnabled(Boolean(data.chargesEnabled));
        setPublishableKey(data.stripePublishableKey || "");
        setSecretKey(data.stripeSecretKeyMasked || "");
        setHasSecretKey(data.hasSecretKey);
        setWebhookSecret(data.stripeWebhookSecretMasked || "");
        setHasWebhookSecret(data.hasWebhookSecret);
      }
    } catch (err) {
      console.error("Error fetching stripe status:", err);
    } finally {
      setFetching(false);
    }
  };

  const handleConnectStripeExpress = async () => {
    setConnectLoading(true);
    setConnectError(null);
    try {
      const res = await fetch("/api/stripe/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (data.url) {
        window.open(data.url, "_blank", "noopener,noreferrer");
      } else {
        setConnectError(data.error || "Stripe Express Onboarding konnte nicht gestartet werden.");
      }
    } catch (err: any) {
      setConnectError("Netzwerkfehler: " + err.message);
    } finally {
      setConnectLoading(false);
    }
  };

  const handleSaveKeys = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusError(null);
    setStatusSuccess(null);

    try {
      const res = await fetch("/api/organizer/stripe-keys", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stripePublishableKey: publishableKey,
          stripeSecretKey: secretKey,
          stripeWebhookSecret: webhookSecret,
          stripeMode: "direct_keys",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Fehler beim Speichern der Stripe Schlüssel.");
      }

      setStatusSuccess("Stripe Keys erfolgreich gespeichert!");
      setStripeMode(data.stripeMode);
      setPublishableKey(data.stripePublishableKey || "");
      setSecretKey(data.stripeSecretKeyMasked || "");
      setHasSecretKey(data.hasSecretKey);
      setWebhookSecret(data.stripeWebhookSecretMasked || "");
      setHasWebhookSecret(data.hasWebhookSecret);
    } catch (err: any) {
      setStatusError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleClearKeys = async () => {
    if (!confirm("Möchten Sie die manuell hinterlegten Stripe Keys wirklich löschen?")) return;

    setSaving(true);
    setStatusError(null);
    setStatusSuccess(null);

    try {
      const res = await fetch("/api/organizer/stripe-keys", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stripePublishableKey: "",
          stripeSecretKey: "",
          stripeWebhookSecret: "",
          stripeMode: "connect",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Fehler beim Zurücksetzen der Keys.");
      }

      setStatusSuccess("Manuelle Keys entfernt. Stripe Connect wieder aktiv.");
      setPublishableKey("");
      setSecretKey("");
      setWebhookSecret("");
      setHasSecretKey(false);
      setHasWebhookSecret(false);
      setStripeMode("connect");
    } catch (err: any) {
      setStatusError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const webhookEndpointUrl = `${appUrl}/api/webhooks/stripe`;

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookEndpointUrl);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  const isTestMode = publishableKey.startsWith("pk_test_") || secretKey.startsWith("sk_test_");
  const isLiveMode = publishableKey.startsWith("pk_live_") || secretKey.startsWith("sk_live_");

  if (fetching) {
    return (
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center gap-3 text-slate-400 text-sm">
        <Loader2 className="w-5 h-5 animate-spin text-indigo-400" /> Stripe Konfiguration laden...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Primary Card: Stripe Connect Express */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-900 border border-indigo-800/40 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Zahlungsabwicklung & Payouts (Stripe)
                {hasSecretKey ? (
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono border border-amber-500/30">
                    {isTestMode ? "Test-Modus (Direkte Keys)" : isLiveMode ? "Live-Modus (Direkte Keys)" : "Manuelle Keys Aktiv"}
                  </span>
                ) : connectedAccountId && detailsSubmitted ? (
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/30">
                    Connect Standard Aktiv
                  </span>
                ) : connectedAccountId && !detailsSubmitted ? (
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono border border-amber-500/30">
                    Onboarding Unvollständig
                  </span>
                ) : (
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono border border-slate-700">
                    Nicht Verknüpft
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {hasSecretKey
                  ? "Ihre manuellen Stripe API-Schlüssel sind aktiv. Auszahlungen fließen direkt in Ihr eigenes Stripe-Konto."
                  : connectedAccountId && detailsSubmitted
                  ? `Verknüpft mit Stripe Standard Konto ${connectedAccountId}. Ticket-Einnahmen werden direkt ausgezahlt.`
                  : connectedAccountId && !detailsSubmitted
                  ? `Stripe Standard Konto ${connectedAccountId} wurde erstellt, aber die Registrierung bei Stripe wurde noch nicht abgeschlossen.`
                  : "Verknüpfen Sie Ihr Bankkonto per 1-Klick über Stripe Standard, um Ticketverkäufe zu empfangen."}
              </p>
            </div>
          </div>

          <button
            onClick={handleConnectStripeExpress}
            disabled={connectLoading}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-all shrink-0"
          >
            {connectLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Verbinde mit Stripe...
              </>
            ) : (
              <>
                {connectedAccountId && detailsSubmitted
                  ? "Stripe Dashboard verwalten"
                  : connectedAccountId && !detailsSubmitted
                  ? "Onboarding fortsetzen"
                  : "Stripe Standard verbinden"}{" "}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {connectError && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">{connectError}</p>
              <p className="text-[11px] text-red-400/80">
                Tipp: Auf Staging-Servern muss der Plattform-Test-Key in der Server-Umgebung gesetzt sein. Sie können alternativ unten eigene Stripe Test-Keys eintragen.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Secondary Collapsible: Manual Stripe API Keys for Staging / Direct Accounts */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden transition-all">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full p-4 px-6 bg-slate-900/80 hover:bg-slate-800/60 flex items-center justify-between text-xs font-semibold text-slate-300 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <Key className="w-4 h-4 text-indigo-400" />
            <span>Erweiterte Stripe-Einstellungen (Eigene API-Keys für Staging / Direct Mode)</span>
            {hasSecretKey && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]">
                Keys hinterlegt
              </span>
            )}
          </div>
          {showAdvanced ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {showAdvanced && (
          <div className="p-6 pt-2 border-t border-slate-800/80 space-y-6">
            <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-800/30 text-xs text-indigo-300/90 flex items-start gap-2.5">
              <HelpCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Hier können Sie Ihre eigenen Stripe API-Schlüssel hinterlegen. Dies ist besonders nützlich für das <strong>Testen auf Staging</strong> mit Ihren eigenen Stripe Test-Keys (<code>sk_test_...</code> / <code>pk_test_...</code>) oder falls Sie ein eigenständiges Stripe-Konto nutzen möchten.
              </p>
            </div>

            <form onSubmit={handleSaveKeys} className="space-y-4">
              {statusError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{statusError}</span>
                </div>
              )}

              {statusSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{statusSuccess}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300">Stripe Publishable Key</label>
                  <input
                    type="text"
                    placeholder="pk_test_... oder pk_live_..."
                    value={publishableKey}
                    onChange={(e) => setPublishableKey(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300">Stripe Secret Key</label>
                  <input
                    type="text"
                    placeholder={hasSecretKey ? "•••••••••••• (Schlüssel gespeichert)" : "sk_test_... oder sk_live_..."}
                    value={secretKey}
                    onChange={(e) => setSecretKey(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5 text-xs">
                <label className="font-semibold text-slate-300">Stripe Webhook Secret (optional)</label>
                <input
                  type="text"
                  placeholder={hasWebhookSecret ? "•••••••••••• (Webhook Secret gespeichert)" : "whsec_..."}
                  value={webhookSecret}
                  onChange={(e) => setWebhookSecret(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Copy Webhook URL section */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2 text-xs">
                <label className="font-semibold text-slate-300">Webhook Endpoint URL in Ihrem Stripe Dashboard:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={webhookEndpointUrl}
                    className="flex-1 px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-indigo-300 font-mono text-[11px]"
                  />
                  <button
                    type="button"
                    onClick={copyWebhookUrl}
                    className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
                  >
                    {copiedWebhook ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedWebhook ? "Kopiert!" : "Kopieren"}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all"
                >
                  <Save className="w-4 h-4" />
                  {saving ? "Speichere..." : "Stripe Keys speichern"}
                </button>

                {hasSecretKey && (
                  <button
                    type="button"
                    onClick={handleClearKeys}
                    disabled={saving}
                    className="px-4 py-2 rounded-xl bg-red-600/10 hover:bg-red-600/20 text-red-400 text-xs font-medium flex items-center gap-1.5 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Keys entfernen & Connect nutzen
                  </button>
                )}
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
