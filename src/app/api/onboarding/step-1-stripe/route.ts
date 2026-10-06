import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import Stripe from "stripe";
import { stripe, hasPlatformStripeKey } from "@/lib/stripe";
import { encryptText } from "@/lib/encryption";
import { onboardingStep1Schema } from "@/lib/validation";

import { getCurrentUser } from "@/lib/auth";

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

    let currentUser = await getCurrentUser();
    let userId = currentUser?.id;

    if (!userId) {
      if (isDemoAllowed()) {
        userId = "user_organizer_01";
      }
    }

    if (!userId) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
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
      // Option a: Stripe Connect Standard OAuth Flow
      if (!hasPlatformStripeKey()) {
        return NextResponse.json(
          {
            error:
              "Stripe Connect ist auf der Server-Plattform nicht konfiguriert (STRIPE_SECRET_KEY fehlt in den Server-Umgebungsvariablen). Bitte wähle 'Eigene Stripe API-Keys hinterlegen'.",
          },
          { status: 400 }
        );
      }

      const connectClientId = process.env.STRIPE_CONNECT_CLIENT_ID;
      if (!connectClientId || !connectClientId.startsWith("ca_")) {
        return NextResponse.json(
          {
            error:
              "Stripe Connect Client-ID fehlt in den Server-Umgebungsvariablen (STRIPE_CONNECT_CLIENT_ID ist nicht gesetzt oder beginnt nicht mit 'ca_'). Bitte trage deine Client-ID aus dem Stripe Dashboard in die .env-Datei ein oder nutze Option B ('Eigene Stripe API-Keys hinterlegen').",
          },
          { status: 400 }
        );
      }

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const oauthUrl = `https://connect.stripe.com/oauth/authorize?response_type=code&client_id=${connectClientId}&scope=read_write&redirect_uri=${encodeURIComponent(
        `${appUrl}/api/stripe/oauth/callback`
      )}&user[email]=${encodeURIComponent(user.email)}`;

      return NextResponse.json({
        success: true,
        url: oauthUrl,
      });
    }
  } catch (error: any) {
    console.error("Step 1 Stripe error:", error);
    return NextResponse.json({ error: error.message || "Fehler beim Verarbeiten von Schritt 1" }, { status: 500 });
  }
}
