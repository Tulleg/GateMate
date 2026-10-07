import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Sidebar } from "@/components/dashboard/sidebar";
import { EventForm } from "@/components/dashboard/event-form";
import Link from "next/link";
import { AlertTriangle, ArrowRight } from "lucide-react";

import { getPlatformFeePercent } from "@/lib/platform-settings";

export default async function CreateEventPage() {
  const platformFeePercent = await getPlatformFeePercent();
  const cookieStore = await cookies();
  const role = cookieStore.get("gatemate_role")?.value;

  if (role === "superadmin") {
    redirect("/admin");
  }

  let organizerId = cookieStore.get("gatemate_user_id")?.value;

  if (!organizerId && process.env.ENABLE_DEMO_ACCOUNTS === "true") {
    organizerId = "user_organizer_01";
  }

  let isFullyCompleted = true;
  let missingText = "";

  if (organizerId) {
    const userRecords = await db.select().from(users).where(eq(users.id, organizerId));
    const user = userRecords[0];

    const connectedAccountId = user?.stripeAccountId || user?.stripeConnectedAccountId;
    const hasStripe = Boolean(connectedAccountId || (user?.stripeSecretKey && user.stripeSecretKey.trim().length > 0));
    const hasLegalInfo = Boolean((user?.legalCompanyName || user?.legalName) && (user?.street || user?.legalAddress));
    const hasTerms = Boolean(
      user?.termsAcceptedAt ||
        user?.privacyAcceptedAt ||
        user?.avvAcceptedAt ||
        user?.onboardingStep === "completed" ||
        user?.onboardingCompleted ||
        (user?.termsContent && user.termsContent.trim().length > 0) ||
        (user?.privacyContent && user.privacyContent.trim().length > 0)
    );

    isFullyCompleted = Boolean(user?.onboardingCompleted || (hasStripe && hasLegalInfo && hasTerms));

    if (user && !user.onboardingCompleted && isFullyCompleted) {
      await db.update(users).set({ onboardingCompleted: true, onboardingStep: "completed" }).where(eq(users.id, organizerId));
      cookieStore.set("gatemate_onboarding_completed", "true", {
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });
    }

    const missing: string[] = [];
    if (!hasStripe) missing.push("Stripe Payment");
    if (!hasLegalInfo) missing.push("Veranstalter-Stammdaten");
    if (!hasTerms) missing.push("Rechtstexte & AGB");
    missingText = missing.join(", ");
  }

  return (
    <div className="flex flex-col md:flex-row min-h-dvh md:h-dvh md:overflow-hidden bg-slate-950 text-slate-50">
      <Sidebar />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-8 overflow-y-auto min-w-0 md:h-full">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Neues Event erstellen</h1>
          <p className="text-sm text-slate-400 mt-1">
            Event-Details, Veranstaltungsort, Bannerbild und individuelle Ticket-Kategorien konfigurieren.
          </p>
        </div>

        {!isFullyCompleted && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
              <span>
                <strong>Freischaltung erforderlich:</strong> Bitte vervollständige dein Onboarding ({missingText}), um Tickets zu verkaufen und Events freizuschalten.
              </span>
            </div>
            <Link
              href="/onboarding"
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1 shrink-0 self-start sm:self-auto"
            >
              Onboarding vervollständigen <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        <EventForm platformFeePercent={platformFeePercent} />
      </main>
    </div>
  );
}
