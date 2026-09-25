import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword, verifyPassword } from "@/lib/passwords";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, currentPassword, newPassword } = body;

    if (!email || !currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "E-Mail, aktuelles Passwort und neues Passwort sind erforderlich." },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "Das neue Passwort muss mindestens 6 Zeichen lang sein." },
        { status: 400 }
      );
    }

    const foundUsers = await db.select().from(users).where(eq(users.email, email.toLowerCase().trim()));
    if (foundUsers.length === 0) {
      return NextResponse.json(
        { error: "Benutzer nicht gefunden." },
        { status: 404 }
      );
    }

    const user = foundUsers[0];

    // If user has a passwordHash, verify it
    if (user.passwordHash) {
      const isValid = verifyPassword(currentPassword, user.passwordHash);
      if (!isValid) {
        return NextResponse.json(
          { error: "Das aktuelle Passwort ist falsch." },
          { status: 401 }
        );
      }
    }

    const newHash = hashPassword(newPassword);

    await db
      .update(users)
      .set({
        passwordHash: newHash,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    return NextResponse.json({
      success: true,
      message: "Passwort wurde erfolgreich geändert.",
    });
  } catch (error: any) {
    console.error("Error changing password:", error);
    return NextResponse.json(
      { error: error.message || "Fehler beim Ändern des Passworts." },
      { status: 500 }
    );
  }
}
