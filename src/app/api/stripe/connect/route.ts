import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();
    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // 1. Fetch user record
    const userRecords = await db.select().from(users).where(eq(users.id, userId));
    const user = userRecords[0];

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let stripeAccountId = user.stripeConnectedAccountId;

    // 2. Create Express connected account if user doesn't have one yet
    if (!stripeAccountId) {
      const account = await stripe.accounts.create({
        type: "express",
        email: user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_profile: {
          name: user.name || "GateMate Organizer",
        },
      });

      stripeAccountId = account.id;

      // Update user record with new Stripe connected account ID
      await db.update(users).set({ stripeConnectedAccountId: stripeAccountId }).where(eq(users.id, userId));
    }

    // 3. Create Account Link for Stripe Express Onboarding
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
