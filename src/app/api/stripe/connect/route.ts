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

    let stripeAccountId = user.stripeConnectedAccountId;

    // 2. Create Standard connected account if user doesn't have one yet
    if (!stripeAccountId) {
      const account = await stripe.accounts.create({
        type: "standard",
        email: user.email,
        business_profile: {
          name: user.legalCompanyName || user.name || "GateMate Organizer",
        },
      });

      stripeAccountId = account.id;

      // Update user record with new Stripe connected account ID and account type
      await db
        .update(users)
        .set({
          stripeConnectedAccountId: stripeAccountId,
          stripeAccountId: stripeAccountId,
          stripeAccountType: "standard",
          stripeMode: "connect",
          updatedAt: new Date(),
        })
        .where(eq(users.id, targetUserId));
    }

    // 3. If account exists and onboarding is submitted, generate dashboard link
    try {
      const existingAccount = await stripe.accounts.retrieve(stripeAccountId);
      if (existingAccount.details_submitted) {
        if (existingAccount.type === "express") {
          try {
            const loginLink = await stripe.accounts.createLoginLink(stripeAccountId);
            return NextResponse.json({ url: loginLink.url });
          } catch (loginErr) {
            console.warn("Could not create Express login link, redirecting to Stripe Dashboard:", loginErr);
          }
        }
        return NextResponse.json({ url: "https://dashboard.stripe.com" });
      }
    } catch (err) {
      console.error("Stripe retrieve account error:", err);
    }

    // 4. Create Account Link for Stripe Standard Onboarding
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${appUrl}/organizer?stripe_refresh=true`,
      return_url: `${appUrl}/organizer?stripe_success=true`,
      type: "account_onboarding",
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (error: any) {
    console.error("Stripe Connect onboarding error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
