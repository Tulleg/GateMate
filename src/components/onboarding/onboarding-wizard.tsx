"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CreditCard,
  Building2,
  FileCheck2,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Lock,
  ExternalLink,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  Sparkles,
  LogOut,
} from "lucide-react";

export function OnboardingWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Wizard state
  const [currentStep, setCurrentStep] = useState<number>(1); // 1, 2, 3, 4 (completed)

  // Step 1 State: Stripe
  const [stripeAccountType, setStripeAccountType] = useState<"express" | "custom_keys">("express");
  const [stripePublishableKey, setStripePublishableKey] = useState("");
  const [stripeSecretKey, setStripeSecretKey] = useState("");
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [stripeAccountId, setStripeAccountId] = useState<string | null>(null);
  const [stripeExpressDetailsSubmitted, setStripeExpressDetailsSubmitted] = useState(false);
  const [hasSecretKey, setHasSecretKey] = useState(false);

  // Step 2 State: Legal Master Data
  const [legalCompanyName, setLegalCompanyName] = useState("");
  const [legalVatId, setLegalVatId] = useState("");
  const [street, setStreet] = useState("");
  const [zip, setZip] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("Deutschland");

  // Step 3 State: Terms Acceptance
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [avvAccepted, setAvvAccepted] = useState(false);
  const [activeLegalModal, setActiveLegalModal] = useState<"agb" | "privacy" | "avv" | null>(null);

  // Field error state for Zod validations
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/onboarding/status");
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        setErrorMessage(data.error || "Fehler beim Laden des Onboarding-Status.");
        return;
      }

      if (data.onboardingCompleted) {
        router.push("/organizer");
        return;
      }

      // Map step string to step number
      if (data.onboardingStep === "legal_info") {
        setCurrentStep(2);
      } else if (data.onboardingStep === "agb_terms") {
        setCurrentStep(3);
      } else if (data.onboardingStep === "completed") {
        setCurrentStep(4);
      } else {
        setCurrentStep(1);
      }

      // Pre-fill Stripe data
      setStripeAccountType(data.stripeAccountType || "express");
      setStripeAccountId(data.stripeAccountId || null);
      setStripeExpressDetailsSubmitted(Boolean(data.stripeExpressDetailsSubmitted));
      setStripePublishableKey(data.stripePublishableKey || "");
      setHasSecretKey(Boolean(data.hasSecretKey));

      // Pre-fill Legal master data
      setLegalCompanyName(data.legalCompanyName || "");
      setLegalVatId(data.legalVatId || "");
      if (data.legalAddress) {
        setStreet(data.legalAddress.street || "");
        setZip(data.legalAddress.zip || "");
        setCity(data.legalAddress.city || "");
        setCountry(data.legalAddress.country || "Deutschland");
      }

      // Handle Stripe OAuth Return query params
      if (searchParams.get("stripe_success") === "true") {
        setSuccessToast("Stripe Express Onboarding erfolgreich abgeschlossen!");
        setCurrentStep(2);
      }
    } catch (err: any) {
      setErrorMessage("Verbindungsfehler beim Laden des Onboarding-Status.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  // Step 1 Submission
  const submitStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setFieldErrors({});

    if (stripeAccountType === "custom_keys") {
      const errors: Record<string, string> = {};
      if (!stripePublishableKey.trim()) errors.stripePublishableKey = "Bitte gib deinen Publishable Key ein.";
      else if (!stripePublishableKey.trim().startsWith("pk_")) errors.stripePublishableKey = "Publishable Key muss mit 'pk_' beginnen.";

      if (!hasSecretKey && !stripeSecretKey.trim()) errors.stripeSecretKey = "Bitte gib deinen Secret Key ein.";
      else if (stripeSecretKey.trim() && !stripeSecretKey.trim().startsWith("sk_") && !stripeSecretKey.trim().startsWith("rk_")) {
        errors.stripeSecretKey = "Secret Key muss mit 'sk_' oder 'rk_' beginnen.";
      }

      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        return;
      }
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/onboarding/step-1-stripe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stripeAccountType,
          stripePublishableKey,
          stripeSecretKey,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || "Fehler beim Verbinden mit Stripe.");
        return;
      }

      if (stripeAccountType === "express" && data.url) {
        // Redirect user to Stripe Express hosted onboarding
        window.location.href = data.url;
        return;
      }

      setSuccessToast("Schritt 1 (Zahlungsanbindung) erfolgreich gespeichert!");
      setCurrentStep(2);
    } catch (err: any) {
      setErrorMessage("Serverfehler bei der Validierung des Stripe-Kontos.");
    } finally {
      setSubmitting(false);
    }
  };

  // Step 2 Submission
  const submitStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setFieldErrors({});

    const errors: Record<string, string> = {};
    if (!legalCompanyName.trim()) errors.legalCompanyName = "Firmenname / Rechnungsname ist erforderlich.";
    if (!legalVatId.trim()) errors.legalVatId = "Steuernummer / USt-IdNr. ist erforderlich.";
    if (!street.trim()) errors.street = "Straße und Hausnummer sind erforderlich.";
    if (!zip.trim()) errors.zip = "Postleitzahl ist erforderlich.";
    if (!city.trim()) errors.city = "Ort / Stadt ist erforderlich.";
    if (!country.trim()) errors.country = "Land ist erforderlich.";

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/onboarding/step-2-legal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          legalCompanyName,
          legalVatId,
          street,
          zip,
          city,
          country,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || "Fehler beim Speichern der Stammdaten.");
        return;
      }

      setSuccessToast("Stammdaten & Rechtliches erfolgreich gespeichert!");
      setCurrentStep(3);
    } catch (err: any) {
      setErrorMessage("Serverfehler beim Speichern der Stammdaten.");
    } finally {
      setSubmitting(false);
    }
  };

  // Step 3 Submission
  const submitStep3 = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setFieldErrors({});

    const errors: Record<string, string> = {};
    if (!termsAccepted) errors.termsAccepted = "Du musst den AGB zustimmen.";
    if (!privacyAccepted) errors.privacyAccepted = "Du musst der Datenschutzerklärung zustimmen.";
    if (!avvAccepted) errors.avvAccepted = "Du musst dem Auftragsverarbeitungsvertrag (AVV) zustimmen.";

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/onboarding/step-3-terms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          termsAccepted,
          privacyAccepted,
          avvAccepted,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || "Fehler beim Abschließen des Onboardings.");
        return;
      }

      setSuccessToast("Onboarding erfolgreich abgeschlossen!");
      setCurrentStep(4);
      setTimeout(() => {
        router.push(data.redirectUrl || "/organizer");
      }, 1500);
    } catch (err: any) {
      setErrorMessage("Serverfehler beim Absenden der Zustimmungen.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-200">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
        <p className="text-sm text-slate-400 font-medium">Lade Onboarding-Workflow...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      {/* Top Header Bar */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-white text-lg tracking-tight">GateMate</span>
              <span className="text-xs text-indigo-400 font-semibold block leading-tight">Organizer Setup</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 hidden sm:inline-flex items-center gap-1.5">
              <Lock className="w-3 h-3 text-emerald-400" /> Geschützter Ersteinrichtungs-Flow
            </span>
            <button
              onClick={handleLogout}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" /> Abmelden
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 md:p-8 flex flex-col justify-center my-6">
        {/* Progress Stepper Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4 px-2">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Willkommen bei GateMate!
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Bitte schließe die 3 Schritte des Onboarding-Assistenten ab, um deine Auszahlungen und Rechtssicherheit zu aktivieren.
              </p>
            </div>
            <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-3 py-1.5 rounded-xl border border-indigo-500/20">
              Schritt {Math.min(currentStep, 3)} von 3
            </span>
          </div>

          {/* Stepper Bar */}
          <div className="grid grid-cols-3 gap-3">
            {/* Step 1 Indicator */}
            <div
              className={`p-3.5 rounded-2xl border transition-all flex items-center gap-3 ${
                currentStep === 1
                  ? "bg-slate-900 border-indigo-500 shadow-lg shadow-indigo-500/10"
                  : currentStep > 1
                  ? "bg-slate-900/60 border-emerald-500/50 text-slate-300"
                  : "bg-slate-900/30 border-slate-800/80 text-slate-500"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs ${
                  currentStep > 1
                    ? "bg-emerald-500 text-slate-950"
                    : currentStep === 1
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "bg-slate-800 text-slate-400"
                }`}
              >
                {currentStep > 1 ? <CheckCircle2 className="w-5 h-5" /> : <CreditCard className="w-4 h-4" />}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-bold text-white leading-none">1. Stripe Payment</p>
                <p className="text-[10px] text-slate-400 mt-1">Zahlungsverbindung</p>
              </div>
            </div>

            {/* Step 2 Indicator */}
            <div
              className={`p-3.5 rounded-2xl border transition-all flex items-center gap-3 ${
                currentStep === 2
                  ? "bg-slate-900 border-indigo-500 shadow-lg shadow-indigo-500/10"
                  : currentStep > 2
                  ? "bg-slate-900/60 border-emerald-500/50 text-slate-300"
                  : "bg-slate-900/30 border-slate-800/80 text-slate-500"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs ${
                  currentStep > 2
                    ? "bg-emerald-500 text-slate-950"
                    : currentStep === 2
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "bg-slate-800 text-slate-400"
                }`}
              >
                {currentStep > 2 ? <CheckCircle2 className="w-5 h-5" /> : <Building2 className="w-4 h-4" />}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-bold text-white leading-none">2. Stammdaten</p>
                <p className="text-[10px] text-slate-400 mt-1">Firma &amp; USt-IdNr.</p>
              </div>
            </div>

            {/* Step 3 Indicator */}
            <div
              className={`p-3.5 rounded-2xl border transition-all flex items-center gap-3 ${
                currentStep === 3
                  ? "bg-slate-900 border-indigo-500 shadow-lg shadow-indigo-500/10"
                  : currentStep > 3
                  ? "bg-slate-900/60 border-emerald-500/50 text-slate-300"
                  : "bg-slate-900/30 border-slate-800/80 text-slate-500"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs ${
                  currentStep > 3
                    ? "bg-emerald-500 text-slate-950"
                    : currentStep === 3
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "bg-slate-800 text-slate-400"
                }`}
              >
                {currentStep > 3 ? <CheckCircle2 className="w-5 h-5" /> : <FileCheck2 className="w-4 h-4" />}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-bold text-white leading-none">3. Rechtliches</p>
                <p className="text-[10px] text-slate-400 mt-1">AGB, Privacy &amp; AVV</p>
              </div>
            </div>
          </div>
        </div>

        {/* Global Toast & Alert Banners */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm flex items-center gap-3 animate-shake">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successToast && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
            <span>{successToast}</span>
          </div>
        )}

        {/* Wizard Step Forms Container */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
          {/* STEP 1: Stripe Payment Connection */}
          {currentStep === 1 && (
            <form onSubmit={submitStep1} className="space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-indigo-400" /> Schritt 1: Zahlungsanbindung (Stripe)
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Verbinde deinen Ticket-Shop mit Stripe, um Einnahmen aus Ticketverkäufen direkt auf dein Bankkonto zu erhalten.
                </p>
              </div>

              {/* Selection Options Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Option A: Stripe Express */}
                <div
                  onClick={() => setStripeAccountType("express")}
                  className={`p-5 rounded-2xl border-2 cursor-pointer transition-all space-y-3 relative ${
                    stripeAccountType === "express"
                      ? "bg-indigo-600/10 border-indigo-500 shadow-md shadow-indigo-600/10"
                      : "bg-slate-950/40 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-400">Option A</span>
                    <input
                      type="radio"
                      name="stripe_option"
                      checked={stripeAccountType === "express"}
                      onChange={() => setStripeAccountType("express")}
                      className="w-4 h-4 text-indigo-600 accent-indigo-500"
                    />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">Mit Stripe Express verbinden</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Schnelles Onboarding über Stripe Connect. Inklusive automatischer Steueraufschlüsselung &amp; Auszahlungen.
                    </p>
                  </div>
                  {stripeAccountId && (
                    <div className="pt-2">
                      <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Stripe-Konto ({stripeAccountId}) erstellt
                      </span>
                    </div>
                  )}
                </div>

                {/* Option B: Custom API Keys */}
                <div
                  onClick={() => setStripeAccountType("custom_keys")}
                  className={`p-5 rounded-2xl border-2 cursor-pointer transition-all space-y-3 relative ${
                    stripeAccountType === "custom_keys"
                      ? "bg-indigo-600/10 border-indigo-500 shadow-md shadow-indigo-600/10"
                      : "bg-slate-950/40 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-400">Option B</span>
                    <input
                      type="radio"
                      name="stripe_option"
                      checked={stripeAccountType === "custom_keys"}
                      onChange={() => setStripeAccountType("custom_keys")}
                      className="w-4 h-4 text-indigo-600 accent-indigo-500"
                    />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">Eigene Stripe API-Keys hinterlegen</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Nutze dein bestehendes Stripe Dashboard. Secret Key wird sicher AES-256 verschlüsselt gespeichert.
                    </p>
                  </div>
                </div>
              </div>

              {/* Input details for Option B */}
              {stripeAccountType === "custom_keys" && (
                <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4 animate-fadeIn">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Stripe Publishable Key (pk_test_... / pk_live_...)
                    </label>
                    <input
                      type="text"
                      placeholder="pk_test_..."
                      value={stripePublishableKey}
                      onChange={(e) => setStripePublishableKey(e.target.value)}
                      className={`w-full px-4 py-2.5 rounded-xl bg-slate-900 border text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono ${
                        fieldErrors.stripePublishableKey ? "border-red-500" : "border-slate-700"
                      }`}
                    />
                    {fieldErrors.stripePublishableKey && (
                      <p className="text-xs text-red-400 mt-1">{fieldErrors.stripePublishableKey}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Stripe Secret Key (sk_test_... / rk_live_...)
                    </label>
                    <div className="relative">
                      <input
                        type={showSecretKey ? "text" : "password"}
                        placeholder={hasSecretKey ? "•••••••••••••••••••• (Hinterlegt)" : "sk_test_..."}
                        value={stripeSecretKey}
                        onChange={(e) => setStripeSecretKey(e.target.value)}
                        className={`w-full pl-4 pr-11 py-2.5 rounded-xl bg-slate-900 border text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono ${
                          fieldErrors.stripeSecretKey ? "border-red-500" : "border-slate-700"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowSecretKey(!showSecretKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        {showSecretKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {fieldErrors.stripeSecretKey && (
                      <p className="text-xs text-red-400 mt-1">{fieldErrors.stripeSecretKey}</p>
                    )}
                    <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> API-Keys werden vor Speicherung live gegen die Stripe API getestet.
                    </p>
                  </div>
                </div>
              )}

              {/* Navigation controls */}
              <div className="flex justify-end pt-4 border-t border-slate-800">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Verarbeite...
                    </>
                  ) : stripeAccountType === "express" ? (
                    <>
                      Mit Stripe verbinden <ExternalLink className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      Weiter zu Schritt 2 <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: Legal Master Data Form */}
          {currentStep === 2 && (
            <form onSubmit={submitStep2} className="space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-indigo-400" /> Schritt 2: Stammdaten &amp; Rechtliches
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Rechtliche Pflichtangaben gemäß DSA &amp; Kaufvertragsrecht für korrekte Ticket-Rechnungen.
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Firmenname / Rechnungsname *
                    </label>
                    <input
                      type="text"
                      placeholder="z. B. Acme Events GmbH"
                      value={legalCompanyName}
                      onChange={(e) => setLegalCompanyName(e.target.value)}
                      className={`w-full px-4 py-2.5 rounded-xl bg-slate-950 border text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        fieldErrors.legalCompanyName ? "border-red-500" : "border-slate-700"
                      }`}
                    />
                    {fieldErrors.legalCompanyName && (
                      <p className="text-xs text-red-400 mt-1">{fieldErrors.legalCompanyName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Steuernummer / USt-IdNr. *
                    </label>
                    <input
                      type="text"
                      placeholder="z. B. DE123456789 oder 12/345/67890"
                      value={legalVatId}
                      onChange={(e) => setLegalVatId(e.target.value)}
                      className={`w-full px-4 py-2.5 rounded-xl bg-slate-950 border text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        fieldErrors.legalVatId ? "border-red-500" : "border-slate-700"
                      }`}
                    />
                    {fieldErrors.legalVatId && (
                      <p className="text-xs text-red-400 mt-1">{fieldErrors.legalVatId}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Straße &amp; Hausnummer *
                  </label>
                  <input
                    type="text"
                    placeholder="z. B. Hauptstraße 42"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-xl bg-slate-950 border text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      fieldErrors.street ? "border-red-500" : "border-slate-700"
                    }`}
                  />
                  {fieldErrors.street && <p className="text-xs text-red-400 mt-1">{fieldErrors.street}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">PLZ *</label>
                    <input
                      type="text"
                      placeholder="z. B. 10115"
                      value={zip}
                      onChange={(e) => setZip(e.target.value)}
                      className={`w-full px-4 py-2.5 rounded-xl bg-slate-950 border text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        fieldErrors.zip ? "border-red-500" : "border-slate-700"
                      }`}
                    />
                    {fieldErrors.zip && <p className="text-xs text-red-400 mt-1">{fieldErrors.zip}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Ort / Stadt *</label>
                    <input
                      type="text"
                      placeholder="z. B. Berlin"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className={`w-full px-4 py-2.5 rounded-xl bg-slate-950 border text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        fieldErrors.city ? "border-red-500" : "border-slate-700"
                      }`}
                    />
                    {fieldErrors.city && <p className="text-xs text-red-400 mt-1">{fieldErrors.city}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Land *</label>
                    <input
                      type="text"
                      placeholder="z. B. Deutschland"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className={`w-full px-4 py-2.5 rounded-xl bg-slate-950 border text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        fieldErrors.country ? "border-red-500" : "border-slate-700"
                      }`}
                    />
                    {fieldErrors.country && <p className="text-xs text-red-400 mt-1">{fieldErrors.country}</p>}
                  </div>
                </div>
              </div>

              {/* Navigation Controls */}
              <div className="flex justify-between pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Zurück zu Schritt 1
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Speichere...
                    </>
                  ) : (
                    <>
                      Weiter zu Schritt 3 <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Legal Agreements & Checkboxes */}
          {currentStep === 3 && (
            <form onSubmit={submitStep3} className="space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <FileCheck2 className="w-5 h-5 text-indigo-400" /> Schritt 3: Rechtliche Texte &amp; Zustimmungen
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  DSGVO-konforme Bestätigung der AGB, Datenschutzerklärung und Auftragsverarbeitung (AVV).
                </p>
              </div>

              <div className="space-y-4">
                {/* Checkbox AGB */}
                <div
                  className={`p-4 rounded-2xl border transition-all ${
                    fieldErrors.termsAccepted ? "border-red-500 bg-red-500/5" : "border-slate-800 bg-slate-950/40"
                  }`}
                >
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="w-5 h-5 mt-0.5 rounded text-indigo-600 accent-indigo-500 shrink-0"
                    />
                    <div className="text-xs text-slate-300 leading-relaxed">
                      <span className="font-bold text-white">Ich akzeptiere die Allgemeinen Geschäftsbedingungen (AGB)</span>{" "}
                      für Veranstalter der Plattform GateMate.
                      <button
                        type="button"
                        onClick={() => setActiveLegalModal("agb")}
                        className="text-indigo-400 underline font-semibold ml-1.5 hover:text-indigo-300"
                      >
                        AGB anzeigen
                      </button>
                    </div>
                  </label>
                  {fieldErrors.termsAccepted && (
                    <p className="text-xs text-red-400 mt-1.5 ml-8">{fieldErrors.termsAccepted}</p>
                  )}
                </div>

                {/* Checkbox Privacy */}
                <div
                  className={`p-4 rounded-2xl border transition-all ${
                    fieldErrors.privacyAccepted ? "border-red-500 bg-red-500/5" : "border-slate-800 bg-slate-950/40"
                  }`}
                >
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={privacyAccepted}
                      onChange={(e) => setPrivacyAccepted(e.target.checked)}
                      className="w-5 h-5 mt-0.5 rounded text-indigo-600 accent-indigo-500 shrink-0"
                    />
                    <div className="text-xs text-slate-300 leading-relaxed">
                      <span className="font-bold text-white">
                        Ich habe die Datenschutzerklärung gelesen und stimme dieser zu.
                      </span>{" "}
                      Die Verarbeitung meiner Daten erfolgt gemäß DSGVO.
                      <button
                        type="button"
                        onClick={() => setActiveLegalModal("privacy")}
                        className="text-indigo-400 underline font-semibold ml-1.5 hover:text-indigo-300"
                      >
                        Datenschutz anzeigen
                      </button>
                    </div>
                  </label>
                  {fieldErrors.privacyAccepted && (
                    <p className="text-xs text-red-400 mt-1.5 ml-8">{fieldErrors.privacyAccepted}</p>
                  )}
                </div>

                {/* Checkbox AVV */}
                <div
                  className={`p-4 rounded-2xl border transition-all ${
                    fieldErrors.avvAccepted ? "border-red-500 bg-red-500/5" : "border-slate-800 bg-slate-950/40"
                  }`}
                >
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={avvAccepted}
                      onChange={(e) => setAvvAccepted(e.target.checked)}
                      className="w-5 h-5 mt-0.5 rounded text-indigo-600 accent-indigo-500 shrink-0"
                    />
                    <div className="text-xs text-slate-300 leading-relaxed">
                      <span className="font-bold text-white">
                        Ich schließe den Vertrag zur Auftragsverarbeitung (AVV gem. Art. 28 DSGVO)
                      </span>{" "}
                      mit GateMate als technischem Verarbeiter der Ticketkäuferdaten ab.
                      <button
                        type="button"
                        onClick={() => setActiveLegalModal("avv")}
                        className="text-indigo-400 underline font-semibold ml-1.5 hover:text-indigo-300"
                      >
                        AVV-Vertragstext anzeigen
                      </button>
                    </div>
                  </label>
                  {fieldErrors.avvAccepted && (
                    <p className="text-xs text-red-400 mt-1.5 ml-8">{fieldErrors.avvAccepted}</p>
                  )}
                </div>
              </div>

              {/* Navigation Controls */}
              <div className="flex justify-between pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Zurück zu Schritt 2
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-sm flex items-center gap-2 shadow-xl shadow-indigo-600/30 transition-all disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Schließe ab...
                    </>
                  ) : (
                    <>
                      Onboarding Abschließen <CheckCircle2 className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 4: Success Celebration State */}
          {currentStep === 4 && (
            <div className="text-center py-8 space-y-6 animate-fadeIn">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-white">Onboarding erfolgreich abgeschlossen!</h2>
                <p className="text-sm text-slate-400 max-w-md mx-auto">
                  Dein Veranstalterkonto ist jetzt vollständig eingerichtet und freigeschaltet. Du wirst in Kürze auf dein Organizer Dashboard weitergeleitet...
                </p>
              </div>
              <div>
                <button
                  onClick={() => router.push("/organizer")}
                  className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm inline-flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/30"
                >
                  Direkt zum Dashboard <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modal View for Legal Documents */}
      {activeLegalModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[80vh] flex flex-col shadow-2xl overflow-hidden animate-scaleIn">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h3 className="font-bold text-white text-lg">
                {activeLegalModal === "agb" && "Allgemeine Geschäftsbedingungen (AGB)"}
                {activeLegalModal === "privacy" && "Datenschutzerklärung (DSGVO)"}
                {activeLegalModal === "avv" && "Auftragsverarbeitungsvertrag (AVV gem. Art. 28 DSGVO)"}
              </h3>
              <button
                onClick={() => setActiveLegalModal(null)}
                className="text-slate-400 hover:text-white text-sm px-3 py-1 rounded-lg hover:bg-slate-800"
              >
                Schließen ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto text-xs text-slate-300 space-y-4 leading-relaxed font-sans">
              {activeLegalModal === "agb" && (
                <>
                  <p className="font-semibold text-white">§ 1 Geltungsbereich &amp; Vertragsgegenstand</p>
                  <p>
                    Diese AGB regeln die Bereitstellung der SaaS-Plattform GateMate für Veranstalter zur Abwicklung von Ticketverkäufen, Einlasskontrollen und Zahlungsabwicklungen.
                  </p>
                  <p className="font-semibold text-white">§ 2 Pflichten des Veranstalters</p>
                  <p>
                    Der Veranstalter verpflichtet sich, wahrheitsgemäße Angaben zu seinen Stammdaten zu machen und Veranstaltungen in Übereinstimmung mit allen geltenden rechtlichen Bestimmungen durchzuführen.
                  </p>
                </>
              )}
              {activeLegalModal === "privacy" && (
                <>
                  <p className="font-semibold text-white">§ 1 Verantwortlicher &amp; Datenschutzbeauftragter</p>
                  <p>
                    Verantwortlicher für die Datenverarbeitung im Rahmen dieser Plattform ist GateMate. Personenbezogene Daten werden ausschließlich zur Vertragserfüllung und Ticketabwicklung erhoben.
                  </p>
                  <p className="font-semibold text-white">§ 2 Betroffenenrechte</p>
                  <p>
                    Sie haben das Recht auf Auskunft, Berichtigung, Löschung und Einschränkung der Verarbeitung Ihrer personenbezogenen Daten gemäß Art. 15-21 DSGVO.
                  </p>
                </>
              )}
              {activeLegalModal === "avv" && (
                <>
                  <p className="font-semibold text-white">§ 1 Gegenstand &amp; Dauer des Auftrags</p>
                  <p>
                    GateMate verarbeitet personenbezogene Daten von Ticketkäufern im Auftrag und nach Weisung des Veranstalters zur Bereitstellung von Ticket-Codes, E-Mails und Einlassverifizierung.
                  </p>
                  <p className="font-semibold text-white">§ 2 Technisch-Organisatorische Maßnahmen (TOMs)</p>
                  <p>
                    GateMate gewährleistet die Sicherheit der Datenverarbeitung durch State-of-the-Art Verschlüsselung (TLS 1.3, AES-256) und streng kontrollierte Zugriffsbeschränkungen.
                  </p>
                </>
              )}
            </div>
            <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex justify-end">
              <button
                onClick={() => setActiveLegalModal(null)}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
              >
                Gelesen &amp; Schließen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 px-6 text-center text-[11px] text-slate-500">
        &copy; {new Date().getFullYear()} GateMate Ticketing &amp; Gate Management Platform. Alle Rechte vorbehalten.
      </footer>
    </div>
  );
}
