import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "@/lib/passwords";
import crypto from "crypto";

export async function GET() {
  try {
    const allUsers = await db.select().from(users);
    const sanitizedUsers = allUsers.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      organizerSlug: u.organizerSlug,
      stripeConnectedAccountId: u.stripeConnectedAccountId,
      emailVerified: u.emailVerified,
      createdAt: u.createdAt,
    }));

    return NextResponse.json({ users: sanitizedUsers });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch users." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, role, password, organizerSlug } = body;

    if (!email || !password || !name) {
      return NextResponse.json({ error: "Name, Email, and Password are required." }, { status: 400 });
    }

    const existingUser = await db.select().from(users).where(eq(users.email, email.toLowerCase().trim()));
    if (existingUser.length > 0) {
      return NextResponse.json({ error: "A user with this email address already exists." }, { status: 409 });
    }

    const userId = `user_${role || "user"}_${crypto.randomBytes(6).toString("hex")}`;
    const passwordHash = hashPassword(password);
    const userRole = role === "superadmin" ? "superadmin" : "organizer";
    const slug = userRole === "organizer"
      ? (organizerSlug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""))
      : null;

    await db.insert(users).values({
      id: userId,
      email: email.toLowerCase().trim(),
      name: name.trim(),
      role: userRole,
      organizerSlug: slug,
      passwordHash: passwordHash,
      emailVerified: true,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        email: email.toLowerCase().trim(),
        name: name.trim(),
        role: userRole,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create user." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { userId, role, newPassword, name } = body;

    if (!userId) {
      return NextResponse.json({ error: "User ID is required." }, { status: 400 });
    }

    const targetUser = await db.select().from(users).where(eq(users.id, userId));
    if (targetUser.length === 0) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const updateData: Record<string, any> = { updatedAt: new Date() };

    if (role && ["superadmin", "organizer"].includes(role)) {
      updateData.role = role;
    }

    if (name && name.trim()) {
      updateData.name = name.trim();
    }

    if (newPassword && newPassword.length >= 6) {
      updateData.passwordHash = hashPassword(newPassword);
    }

    await db.update(users).set(updateData).where(eq(users.id, userId));

    return NextResponse.json({ success: true, message: "User updated successfully." });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update user." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "User ID is required." }, { status: 400 });
    }

    await db.delete(users).where(eq(users.id, userId));

    return NextResponse.json({ success: true, message: "User deleted successfully." });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete user." }, { status: 500 });
  }
}
