import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { onboardingStep2Schema } from "@/lib/validation";

function isDemoAllowed(): boolean {
  return process.env.NODE_ENV !== "production" && process.env.ENABLE_DEMO_ACCOUNTS === "true";
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const parseResult = onboardingStep2Schema.safeParse(body);
    if (!parseResult.success) {
      const firstError = parseResult.error.errors[0]?.message || "Ungültige Stammdaten im Formular.";
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

    const addressJson = {
      street: data.street.trim(),
      zip: data.zip.trim(),
      city: data.city.trim(),
      country: data.country.trim(),
    };

    await db
      .update(users)
      .set({
        legalCompanyName: data.legalCompanyName.trim(),
        legalName: data.legalCompanyName.trim(),
        legalVatId: data.legalVatId.trim(),
        vatId: data.legalVatId.trim(),
        legalAddress: addressJson,
        street: data.street.trim(),
        zip: data.zip.trim(),
        city: data.city.trim(),
        country: data.country.trim(),
        onboardingStep: "agb_terms",
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    return NextResponse.json({
      success: true,
      nextStep: "agb_terms",
      message: "Stammdaten & Rechtliches erfolgreich gespeichert.",
    });
  } catch (error: any) {
    console.error("Step 2 Legal error:", error);
    return NextResponse.json({ error: error.message || "Fehler beim Speichern der Stammdaten" }, { status: 500 });
  }
}
