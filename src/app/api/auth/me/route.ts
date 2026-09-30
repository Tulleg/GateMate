import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("gatemate_user_id")?.value;

    if (!userId) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    }

    const userRecords = await db.select().from(users).where(eq(users.id, userId));
    if (userRecords.length === 0) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 404 });
    }

    const u = userRecords[0];
    const isProd = process.env.NODE_ENV === "production";
    cookieStore.set("gatemate_onboarding_completed", String(Boolean(u.onboardingCompleted)), { path: "/", maxAge: 60 * 60 * 24 * 7, httpOnly: true, secure: isProd, sameSite: "lax" });

    return NextResponse.json({
      authenticated: true,
      user: {
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        organizerSlug: u.organizerSlug,
        legalName: u.legalName,
        onboardingCompleted: Boolean(u.onboardingCompleted),
        onboardingStep: u.onboardingStep || "stripe_connect",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Fehler beim Abrufen des Benutzerprofils." },
      { status: 500 }
    );
  }
}
