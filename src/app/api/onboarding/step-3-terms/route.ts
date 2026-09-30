import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { onboardingStep3Schema } from "@/lib/validation";

function isDemoAllowed(): boolean {
  return process.env.NODE_ENV !== "production" && process.env.ENABLE_DEMO_ACCOUNTS === "true";
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const parseResult = onboardingStep3Schema.safeParse(body);
    if (!parseResult.success) {
      const firstError = parseResult.error.errors[0]?.message || "Bitte stimme allen rechtlichen Vereinbarungen zu.";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

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

    const now = new Date();

    await db
      .update(users)
      .set({
        termsAcceptedAt: now,
        privacyAcceptedAt: now,
        avvAcceptedAt: now,
        onboardingCompleted: true,
        onboardingStep: "completed",
        updatedAt: now,
      })
      .where(eq(users.id, userId));

    // Update session cookie so middleware immediately grants dashboard access
    const isProd = process.env.NODE_ENV === "production";
    cookieStore.set("gatemate_onboarding_completed", "true", {
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
    });

    return NextResponse.json({
      success: true,
      onboardingCompleted: true,
      onboardingStep: "completed",
      redirectUrl: "/organizer",
      message: "Onboarding erfolgreich abgeschlossen!",
    });
  } catch (error: any) {
    console.error("Step 3 Terms error:", error);
    return NextResponse.json({ error: error.message || "Fehler beim Abschließen des Onboardings" }, { status: 500 });
  }
}
