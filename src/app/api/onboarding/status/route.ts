import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { decryptText } from "@/lib/encryption";
import { stripe, hasPlatformStripeKey } from "@/lib/stripe";

function isDemoAllowed(): boolean {
  return process.env.NODE_ENV !== "production" && process.env.ENABLE_DEMO_ACCOUNTS === "true";
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    let userId = cookieStore.get("gatemate_user_id")?.value;

    if (!userId) {
      if (isDemoAllowed()) {
        userId = "user_organizer_01";
      } else {
        return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
      }
    }

    const records = await db.select().from(users).where(eq(users.id, userId));
    const user = records[0];

    if (!user) {
      return NextResponse.json({ error: "Benutzer nicht gefunden" }, { status: 404 });
    }

    // Check Stripe Express / Standard connection status
    let stripeExpressDetailsSubmitted = false;
    let stripeAccountId = user.stripeAccountId || user.stripeConnectedAccountId || null;

    if (stripeAccountId) {
      // Standard accounts connected via OAuth or Connect accounts with stripeAccountId are connected
      stripeExpressDetailsSubmitted = true;

      if (hasPlatformStripeKey()) {
        try {
          const acc = await stripe.accounts.retrieve(stripeAccountId);
          if (acc.details_submitted || acc.charges_enabled) {
            stripeExpressDetailsSubmitted = true;
          }
        } catch (err) {
          console.error("Error retrieving Stripe connected account:", err);
        }
      }
    }

    const decryptedSecretKey = decryptText(user.stripeSecretKey);

    if (user.onboardingCompleted) {
      const isProd = process.env.NODE_ENV === "production";
      cookieStore.set("gatemate_onboarding_completed", "true", {
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
        httpOnly: true,
        secure: isProd,
        sameSite: "lax",
      });
    }

    return NextResponse.json({
      success: true,
      onboardingCompleted: Boolean(user.onboardingCompleted),
      onboardingStep: user.onboardingStep || "stripe_connect",
      stripeAccountType: user.stripeAccountType || "standard",
      stripeAccountId,
      stripeExpressDetailsSubmitted,
      stripePublishableKey: user.stripePublishableKey || "",
      hasSecretKey: Boolean(decryptedSecretKey && decryptedSecretKey.trim().length > 0),
      legalCompanyName: user.legalCompanyName || user.legalName || "",
      legalVatId: user.legalVatId || user.vatId || "",
      legalAddress: (user.legalAddress as any) || {
        street: user.street || "",
        zip: user.zip || "",
        city: user.city || "",
        country: user.country || "Deutschland",
      },
      termsAcceptedAt: user.termsAcceptedAt,
      privacyAcceptedAt: user.privacyAcceptedAt,
      avvAcceptedAt: user.avvAcceptedAt,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Serverfehler" }, { status: 500 });
  }
}
