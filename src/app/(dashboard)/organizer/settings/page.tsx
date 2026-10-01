"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/dashboard/sidebar";
import { StripeSettingsCard } from "@/components/dashboard/stripe-settings-card";
import { Key, ShieldCheck, User, Sparkles, CheckCircle2, AlertCircle, Eye, EyeOff, Save, LogOut } from "lucide-react";

export default function OrganizerSettingsPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user?.email) {
          setEmail(data.user.email);
        }
      })
      .catch(() => {});
  }, []);


  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword !== confirmPassword) {
      setError("Die eingegebenen neuen Passwörter stimmen nicht überein.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Das neue Passwort muss mindestens 6 Zeichen lang sein.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Fehler beim Ändern des Passworts.");
      }

      setSuccess("Passwort erfolgreich aktualisiert!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-dvh bg-slate-950 text-slate-50 overflow-x-hidden">
      <Sidebar />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-8 overflow-y-auto max-w-5xl min-w-0">
        {/* Header */}
        <div className="border-b border-slate-800/80 pb-6">
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            Konto-Einstellungen <ShieldCheck className="w-6 h-6 text-indigo-400" />
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Verwalten Sie Ihre Profilinformationen, Sicherheitsoptionen und ändern Sie Ihr Passwort.
          </p>
        </div>

        {/* Section 1: Profile Info */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Organizer Profil</h2>
              <p className="text-xs text-slate-400">Ihre öffentlich sichtbaren Veranstalter-Informationen</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300">E-Mail Adresse</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300">Organizer Slug / URL</label>
              <input
                type="text"
                disabled
                value="/o/demo-organizer"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60 text-slate-400 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Section: Stripe & Payments */}
        <StripeSettingsCard />

        {/* Section 2: Password Change Form */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Passwort ändern</h2>
              <p className="text-xs text-slate-400">
                Legen Sie ein neues, sicheres Passwort für Ihr Konto fest
              </p>
            </div>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
            {error && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <div className="space-y-1.5 text-xs">
              <label className="font-semibold text-slate-300">Aktuelles Passwort (vom Admin zugewiesen)</label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  required
                  placeholder="Aktuelles Passwort eingeben"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <label className="font-semibold text-slate-300">Neues Passwort</label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  required
                  minLength={6}
                  placeholder="Mindestens 6 Zeichen"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <label className="font-semibold text-slate-300">Neues Passwort bestätigen</label>
              <input
                type="password"
                required
                minLength={6}
                placeholder="Neues Passwort erneut eingeben"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-600/20"
              >
                <Save className="w-4 h-4" />
                {loading ? "Speichere..." : "Neues Passwort speichern"}
              </button>
            </div>
          </form>
        </div>

        {/* Section 3: Session & Logout */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
              <LogOut className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Sitzung beenden</h2>
              <p className="text-xs text-slate-400">Melden Sie sich sicher aus Ihrem Veranstalter-Konto ab</p>
            </div>
          </div>
          <div>
            <button
              onClick={async () => {
                try {
                  await fetch("/api/auth/sign-out", { method: "POST" });
                } catch {}
                router.push("/login");
              }}
              className="px-5 py-2.5 rounded-xl bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/30 text-xs font-bold flex items-center gap-2 transition-all"
            >
              <LogOut className="w-4 h-4" />
              Jetzt abmelden
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
