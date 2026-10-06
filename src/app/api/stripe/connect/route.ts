import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { stripe, hasPlatformStripeKey } from "@/lib/stripe";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

function isDemoAllowed(): boolean {
  return process.env.NODE_ENV !== "production" && process.env.ENABLE_DEMO_ACCOUNTS === "true";
}

export async function POST(req: Request) {
  try {
    if (!hasPlatformStripeKey()) {
      return NextResponse.json(
        {
          error:
            "Stripe Connect ist auf der Server-Plattform nicht konfiguriert (STRIPE_SECRET_KEY fehlt in den Umgebungsvariablen). Bitte Plattform-Schlüssel hinterlegen oder manuelle API-Keys verwenden.",
        },
        { status: 400 }
      );
    }

    let bodyUserId: string | undefined;
    try {
      const body = await req.json();
      bodyUserId = body?.userId;
    } catch {}

    const cookieStore = await cookies();
    let targetUserId = bodyUserId || cookieStore.get("gatemate_user_id")?.value;

    if (!targetUserId) {
      if (isDemoAllowed()) {
        targetUserId = "user_organizer_01";
      } else {
        return NextResponse.json({ error: "Benutzer-ID fehlt oder nicht autorisiert" }, { status: 400 });
      }
    }

    // 1. Fetch user record
    const userRecords = await db.select().from(users).where(eq(users.id, targetUserId));
    const user = userRecords[0];

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let stripeAccountId = user.stripeAccountId || user.stripeConnectedAccountId;

    // 1. If user already has a connected account and onboarding is submitted:
    if (stripeAccountId) {
      try {
        const existingAccount = await stripe.accounts.retrieve(stripeAccountId);
        if (existingAccount.details_submitted) {
          if (existingAccount.type === "express") {
            try {
              const loginLink = await stripe.accounts.createLoginLink(stripeAccountId);
              return NextResponse.json({ url: loginLink.url });
            } catch (loginErr) {
              console.warn("Could not create Express login link:", loginErr);
            }
          }
          return NextResponse.json({ url: "https://dashboard.stripe.com" });
        }
      } catch (err) {
        console.error("Stripe retrieve account error:", err);
      }
    }

    // 2. Start Stripe Connect OAuth Flow
    const connectClientId = process.env.STRIPE_CONNECT_CLIENT_ID;
    if (!connectClientId || !connectClientId.startsWith("ca_")) {
      return NextResponse.json(
        {
          error:
            "Stripe Connect Client-ID fehlt in den Server-Umgebungsvariablen (STRIPE_CONNECT_CLIENT_ID ist nicht gesetzt oder beginnt nicht mit 'ca_'). Bitte trage deine Client-ID aus dem Stripe Dashboard in der .env-Datei ein.",
        },
        { status: 400 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const oauthUrl = `https://connect.stripe.com/oauth/authorize?response_type=code&client_id=${connectClientId}&scope=read_write&redirect_uri=${encodeURIComponent(
      `${appUrl}/api/stripe/oauth/callback`
    )}&user[email]=${encodeURIComponent(user.email)}`;

    return NextResponse.json({ url: oauthUrl });
  } catch (error: any) {
    console.error("Stripe Connect onboarding error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
