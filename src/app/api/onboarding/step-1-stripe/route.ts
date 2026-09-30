import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import Stripe from "stripe";
import { stripe, hasPlatformStripeKey } from "@/lib/stripe";
import { encryptText } from "@/lib/encryption";
import { onboardingStep1Schema } from "@/lib/validation";

function isDemoAllowed(): boolean {
  return process.env.NODE_ENV !== "production" && process.env.ENABLE_DEMO_ACCOUNTS === "true";
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const parseResult = onboardingStep1Schema.safeParse(body);
    if (!parseResult.success) {
      const firstError = parseResult.error.errors[0]?.message || "Ungültige Angaben für Schritt 1.";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const data = parseResult.data;

    const cookieStore = await cookies();
    let userId = cookieStore.get("gatemate_user_id")?.value;

    if (!userId) {
      if (isDemoAllowed()) {
        userId = "user_organizer_01";
      } else {
        return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
      }
    }

    const userRecords = await db.select().from(users).where(eq(users.id, userId));
    const user = userRecords[0];

    if (!user) {
      return NextResponse.json({ error: "Benutzer nicht gefunden" }, { status: 404 });
    }

    if (data.stripeAccountType === "custom_keys") {
      // Validate direct API keys against Stripe API live test call
      try {
        const testStripeClient = new Stripe(data.stripeSecretKey.trim(), {
          apiVersion: "2024-12-18.acacia" as any,
        });
        await testStripeClient.balance.retrieve();
      } catch (stripeErr: any) {
        console.error("Stripe key validation failed:", stripeErr);
        return NextResponse.json(
          {
            error: `Stripe API-Key Validierung fehlgeschlagen: ${
              stripeErr.message || "Der angegebene Secret Key ist ungültig oder wurde von Stripe abgelehnt."
            }`,
          },
          { status: 400 }
        );
      }

      // Securely encrypt Secret Key before persisting
      const encryptedSecret = encryptText(data.stripeSecretKey.trim());

      await db
        .update(users)
        .set({
          stripeAccountType: "custom_keys",
          stripePublishableKey: data.stripePublishableKey.trim(),
          stripeSecretKey: encryptedSecret,
          stripeMode: "direct_keys",
          onboardingStep: "legal_info",
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      return NextResponse.json({
        success: true,
        nextStep: "legal_info",
        message: "Eigene Stripe API-Keys wurden erfolgreich validiert und gespeichert.",
      });
    } else {
      // Option a: Stripe Connect Express Flow
      if (!hasPlatformStripeKey()) {
        return NextResponse.json(
          {
            error:
              "Stripe Connect ist auf der Server-Plattform nicht konfiguriert (STRIPE_SECRET_KEY fehlt in den Server-Umgebungsvariablen). Bitte wähle 'Eigene Stripe API-Keys hinterlegen'.",
          },
          { status: 400 }
        );
      }

      let stripeAccountId = user.stripeAccountId || user.stripeConnectedAccountId;

      if (!stripeAccountId) {
        const account = await stripe.accounts.create({
          type: "express",
          email: user.email,
          capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
          },
          business_profile: {
            name: user.legalCompanyName || user.name || "GateMate Organizer",
          },
        });
        stripeAccountId = account.id;

        await db
          .update(users)
          .set({
            stripeAccountId: stripeAccountId,
            stripeConnectedAccountId: stripeAccountId,
            stripeAccountType: "express",
            stripeMode: "connect",
            updatedAt: new Date(),
          })
          .where(eq(users.id, userId));
      } else {
        await db
          .update(users)
          .set({
            stripeAccountType: "express",
            stripeMode: "connect",
            updatedAt: new Date(),
          })
          .where(eq(users.id, userId));
      }

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const accountLink = await stripe.accountLinks.create({
        account: stripeAccountId,
        refresh_url: `${appUrl}/onboarding?stripe_refresh=true`,
        return_url: `${appUrl}/onboarding?stripe_success=true`,
        type: "account_onboarding",
      });

      // Update onboarding step to legal_info so user progresses after return
      await db
        .update(users)
        .set({ onboardingStep: "legal_info" })
        .where(eq(users.id, userId));

      return NextResponse.json({
        success: true,
        url: accountLink.url,
        nextStep: "legal_info",
      });
    }
  } catch (error: any) {
    console.error("Step 1 Stripe error:", error);
    return NextResponse.json({ error: error.message || "Fehler beim Verarbeiten von Schritt 1" }, { status: 500 });
  }
}
