import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Gültige E-Mail-Adresse erforderlich." }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if user exists
    const userRecords = await db.select().from(users).where(eq(users.email, cleanEmail));
    const user = userRecords[0];

    // Always respond success to prevent email enumeration attacks
    if (user) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://gatemate.io";
      const resetUrl = `${appUrl}/reset-password?email=${encodeURIComponent(cleanEmail)}`;

      await sendPasswordResetEmail({
        email: cleanEmail,
        resetUrl,
      });
    }

    return NextResponse.json({ success: true, message: "Reset-Instruktionen versendet." });
  } catch (err: any) {
    console.error("Password reset request error:", err?.message || err);
    return NextResponse.json(
      { error: "Fehler beim Verarbeiten der Reset-Anfrage." },
      { status: 500 }
    );
  }
}
