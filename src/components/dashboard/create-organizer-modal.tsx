"use client";

import { useState } from "react";
import { UserPlus, Key, Copy, Check, Eye, EyeOff, Sparkles, X, ShieldAlert } from "lucide-react";
import { generateRandomPassword } from "@/lib/passwords";

interface CreateOrganizerModalProps {
  onSuccess?: () => void;
}

export function CreateOrganizerModal({ onSuccess }: CreateOrganizerModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [organizerSlug, setOrganizerSlug] = useState("");
  const [initialPassword, setInitialPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Success result state
  const [createdResult, setCreatedResult] = useState<{
    name: string;
    email: string;
    organizerSlug: string;
    initialPassword: string;
  } | null>(null);

  const [copied, setCopied] = useState(false);

  const handleNameChange = (val: string) => {
    setName(val);
    if (!organizerSlug || organizerSlug === name.toLowerCase().replace(/[^a-z0-9]+/g, "-")) {
      setOrganizerSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""));
    }
  };

  const handleGeneratePassword = () => {
    const pw = generateRandomPassword(12);
    setInitialPassword(pw);
    setShowPassword(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/organizers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          organizerSlug,
          initialPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Fehler beim Erstellen des Organizer-Accounts.");
      }

      setCreatedResult({
        name,
        email,
        organizerSlug: data.user.organizerSlug,
        initialPassword,
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCredentials = () => {
    if (!createdResult) return;
    const text = `Willkommen bei GateMate!

Zugangsdaten für dein Organizer-Konto:
Name: ${createdResult.name}
E-Mail: ${createdResult.email}
Initiales Passwort: ${createdResult.initialPassword}
Organizer Portal: /o/${createdResult.organizerSlug}

Bitte melde dich an und ändere dein Passwort in den Einstellungen.`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleResetForm = () => {
    setName("");
    setEmail("");
    setOrganizerSlug("");
    setInitialPassword("");
    setError(null);
    setCreatedResult(null);
    setIsOpen(false);
  };

  return (
    <>
      <button
        onClick={() => {
          setIsOpen(true);
          handleGeneratePassword();
        }}
        className="h-10 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold inline-flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/20 whitespace-nowrap shrink-0"
      >
        <UserPlus className="w-4 h-4" /> Neuen Organizer anlegen
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg max-h-[90dvh] overflow-y-auto bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-4 sm:px-6 py-4 border-b border-slate-800/80 bg-slate-900/50">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">Organizer-Account anlegen</h3>
                  <p className="text-xs text-slate-400">Neuen Event-Veranstalter mit initialem Passwort registrieren</p>
                </div>
              </div>
              <button
                onClick={handleResetForm}
                className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content area */}
            <div className="p-6 space-y-4">
              {createdResult ? (
                /* Success View with Credentials Copy */
                <div className="space-y-6">
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-start gap-3">
                    <Sparkles className="w-5 h-5 shrink-0 mt-0.5" />
                    <div className="text-xs space-y-1">
                      <p className="font-bold text-emerald-300">Organizer-Konto erfolgreich erstellt!</p>
                      <p className="text-slate-300">
                        Teilen Sie dem Organizer das initiale Passwort mit, damit er sich anmelden und sein Passwort festlegen kann.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs">
                    <div>
                      <span className="text-slate-500 block">Name:</span>
                      <span className="text-white font-semibold">{createdResult.name}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">E-Mail Adresse:</span>
                      <span className="text-indigo-400">{createdResult.email}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Initiales Passwort:</span>
                      <span className="text-emerald-400 bg-emerald-950/40 px-2 py-1 rounded border border-emerald-800/40 font-bold inline-block mt-0.5">
                        {createdResult.initialPassword}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Organizer Slug:</span>
                      <span className="text-slate-300">/o/{createdResult.organizerSlug}</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleCopyCredentials}
                      className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-600/20"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                      {copied ? "Zugangsdaten kopiert!" : "Zugangsdaten kopieren"}
                    </button>
                    <button
                      onClick={handleResetForm}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
                    >
                      Schließen
                    </button>
                  </div>
                </div>
              ) : (
                /* Form View */
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Name des Veranstalters</label>
                    <input
                      type="text"
                      required
                      placeholder="z. B. Festival GmbH / Max Mustermann"
                      value={name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">E-Mail Adresse</label>
                    <input
                      type="email"
                      required
                      placeholder="organizer@beispiel.de"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Organizer URL Slug</label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 font-mono">/o/</span>
                      <input
                        type="text"
                        required
                        placeholder="festival-gmbh"
                        value={organizerSlug}
                        onChange={(e) => setOrganizerSlug(e.target.value)}
                        className="flex-1 px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                        <Key className="w-3.5 h-3.5 text-indigo-400" /> Initiales Passwort
                      </label>
                      <button
                        type="button"
                        onClick={handleGeneratePassword}
                        className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
                      >
                        <Sparkles className="w-3 h-3" /> Zufallspasswort generieren
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        minLength={6}
                        placeholder="Initiales Passwort festlegen"
                        value={initialPassword}
                        onChange={(e) => setInitialPassword(e.target.value)}
                        className="w-full px-3.5 py-2 pr-10 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Der Organizer kann dieses Passwort nach der Anmeldung selbstständig ändern.
                    </p>
                  </div>

                  <div className="pt-2 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={handleResetForm}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                    >
                      Abbrechen
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20"
                    >
                      {loading ? "Erstelle..." : "Organizer anlegen"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
