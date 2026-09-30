import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "@/lib/passwords";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { name, email, password, role = "organizer" } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, E-Mail-Adresse und Passwort sind erforderlich." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Das Passwort muss mindestens 6 Zeichen lang sein." },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const existingUsers = await db.select().from(users).where(eq(users.email, cleanEmail));

    if (existingUsers.length > 0) {
      return NextResponse.json(
        { error: "Ein Benutzer mit dieser E-Mail-Adresse existiert bereits." },
        { status: 409 }
      );
    }

    const userRole = role === "attendee" ? "attendee" : "organizer";
    const userId = `usr_${crypto.randomUUID().replace(/-/g, "").substring(0, 16)}`;
    const passwordHash = hashPassword(password);

    let organizerSlug: string | undefined = undefined;
    if (userRole === "organizer") {
      const baseSlug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") || "organizer";
      const randomSuffix = crypto.randomBytes(3).toString("hex");
      organizerSlug = `${baseSlug}-${randomSuffix}`;
    }

    await db.insert(users).values({
      id: userId,
      email: cleanEmail,
      name: name.trim(),
      passwordHash,
      role: userRole,
      organizerSlug: organizerSlug ?? null,
      emailVerified: true,
    });

    // Set session cookies with security flags
    const cookieStore = await cookies();
    const maxAge = 60 * 60 * 24 * 7; // 7 days
    const isProd = process.env.NODE_ENV === "production";

    cookieStore.set("gatemate_role", userRole, { path: "/", maxAge, httpOnly: true, secure: isProd, sameSite: "lax" });
    cookieStore.set("gatemate_user_id", userId, { path: "/", maxAge, httpOnly: true, secure: isProd, sameSite: "lax" });
    cookieStore.set("gatemate_user_email", cleanEmail, { path: "/", maxAge, httpOnly: true, secure: isProd, sameSite: "lax" });
    cookieStore.set("gatemate_user_name", name.trim(), { path: "/", maxAge, httpOnly: true, secure: isProd, sameSite: "lax" });

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        email: cleanEmail,
        name: name.trim(),
        role: userRole,
        organizerSlug,
      },
    });
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: error.message || "Registrierung fehlgeschlagen." },
      { status: 500 }
    );
  }
}
