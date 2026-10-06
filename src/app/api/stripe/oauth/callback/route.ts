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
    const state = searchParams.get("state");
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

    let currentUser = await getCurrentUser();
    let userId = currentUser?.id;

    if (!userId && state) {
      const stateUsers = await db.select().from(users).where(eq(users.id, state));
      if (stateUsers[0]) {
        userId = stateUsers[0].id;
      }
    }

    if (!userId) {
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
      .where(eq(users.id, userId));

    const response = NextResponse.redirect(`${appUrl}/onboarding?stripe_success=true`);
    const isProd = process.env.NODE_ENV === "production";
    response.cookies.set("gatemate_user_id", userId, {
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
    });

    return response;
  } catch (err: any) {
    console.error("Stripe OAuth Callback error:", err);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return NextResponse.redirect(
      `${appUrl}/onboarding?stripe_refresh=true&error=${encodeURIComponent(err.message || "OAuth_failed")}`
    );
  }
}
