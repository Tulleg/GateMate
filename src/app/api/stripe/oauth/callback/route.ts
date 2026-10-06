import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    if (error) {
      console.error("Stripe OAuth Error:", error, errorDescription);
      return NextResponse.redirect(
        `${appUrl}/onboarding?stripe_refresh=true&error=${encodeURIComponent(errorDescription || error)}`
      );
    }

    if (!code) {
      return NextResponse.redirect(`${appUrl}/onboarding?stripe_refresh=true&error=Missing_code`);
    }

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.redirect(`${appUrl}/login`);
    }

    // Exchange OAuth authorization code for connected account token
    const tokenResponse = await stripe.oauth.token({
      grant_type: "authorization_code",
      code,
    });

    const connectedAccountId = tokenResponse.stripe_user_id;

    if (!connectedAccountId) {
      return NextResponse.redirect(`${appUrl}/onboarding?stripe_refresh=true&error=No_account_returned`);
    }

    await db
      .update(users)
      .set({
        stripeAccountId: connectedAccountId,
        stripeConnectedAccountId: connectedAccountId,
        stripeAccountType: "standard",
        stripeMode: "connect",
        onboardingStep: "legal_info",
        updatedAt: new Date(),
      })
      .where(eq(users.id, currentUser.id));

    return NextResponse.redirect(`${appUrl}/onboarding?stripe_success=true`);
  } catch (err: any) {
    console.error("Stripe OAuth Callback error:", err);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return NextResponse.redirect(
      `${appUrl}/onboarding?stripe_refresh=true&error=${encodeURIComponent(err.message || "OAuth_failed")}`
    );
  }
}
