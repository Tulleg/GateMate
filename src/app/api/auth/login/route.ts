import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyPassword } from "@/lib/passwords";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "E-Mail-Adresse und Passwort sind erforderlich." },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const userRecords = await db.select().from(users).where(eq(users.email, cleanEmail));

    if (userRecords.length === 0) {
      return NextResponse.json(
        { error: "Ungültige E-Mail-Adresse oder Passwort." },
        { status: 401 }
      );
    }

    const user = userRecords[0];

    if (!user.passwordHash) {
      return NextResponse.json(
        { error: "Für diesen Account ist kein Passwort gesetzt." },
        { status: 401 }
      );
    }

    const isValid = verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: "Ungültige E-Mail-Adresse oder Passwort." },
        { status: 401 }
      );
    }

    // Set session cookies
    const cookieStore = await cookies();
    const maxAge = 60 * 60 * 24 * 7; // 7 days

    cookieStore.set("gatemate_role", user.role, { path: "/", maxAge });
    cookieStore.set("gatemate_user_id", user.id, { path: "/", maxAge });
    cookieStore.set("gatemate_user_email", user.email, { path: "/", maxAge });
    cookieStore.set("gatemate_user_name", user.name || "", { path: "/", maxAge });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organizerSlug: user.organizerSlug,
      },
    });
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: error.message || "Anmeldung fehlgeschlagen." },
      { status: 500 }
    );
  }
}
