import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "@/lib/passwords";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, organizerSlug, initialPassword } = body;

    if (!email || !initialPassword || !name) {
      return NextResponse.json(
        { error: "Name, Email, and Initial Password are required." },
        { status: 400 }
      );
    }

    if (initialPassword.length < 6) {
      return NextResponse.json(
        { error: "Initial password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingEmail = await db.select().from(users).where(eq(users.email, email.toLowerCase().trim()));
    if (existingEmail.length > 0) {
      return NextResponse.json(
        { error: "A user with this email address already exists." },
        { status: 409 }
      );
    }

    // Generate slug if not provided
    const slug = (organizerSlug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")) || `org-${Date.now()}`;

    // Check slug uniqueness
    const existingSlug = await db.select().from(users).where(eq(users.organizerSlug, slug));
    if (existingSlug.length > 0) {
      return NextResponse.json(
        { error: `Organizer slug '${slug}' is already taken. Please choose another.` },
        { status: 409 }
      );
    }

    const userId = `user_org_${crypto.randomBytes(6).toString("hex")}`;
    const passwordHash = hashPassword(initialPassword);

    await db.insert(users).values({
      id: userId,
      email: email.toLowerCase().trim(),
      name: name.trim(),
      organizerSlug: slug,
      passwordHash: passwordHash,
      role: "organizer",
      emailVerified: true,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        email: email.toLowerCase().trim(),
        name: name.trim(),
        organizerSlug: slug,
        role: "organizer",
      },
    });
  } catch (error: any) {
    console.error("Error creating organizer account:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create organizer account." },
      { status: 500 }
    );
  }
}
