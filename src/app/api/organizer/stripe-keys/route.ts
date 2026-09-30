import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { stripe, hasPlatformStripeKey } from "@/lib/stripe";
import { encryptText, decryptText } from "@/lib/encryption";

function isDemoAllowed(): boolean {
  return process.env.NODE_ENV !== "production" && process.env.ENABLE_DEMO_ACCOUNTS === "true";
}

function maskKey(key?: string | null, prefixLen = 7, suffixLen = 4): string | null {
  const decrypted = decryptText(key);
  if (!decrypted || decrypted.trim().length === 0) return null;
  const trimmed = decrypted.trim();
  if (trimmed.length <= prefixLen + suffixLen) return "••••••••";
  return `${trimmed.substring(0, prefixLen)}••••${trimmed.substring(trimmed.length - suffixLen)}`;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const cookieStore = await cookies();
    let organizerId = searchParams.get("organizerId") || cookieStore.get("gatemate_user_id")?.value;

    if (!organizerId) {
      if (isDemoAllowed()) {
        organizerId = "user_organizer_01";
      } else {
        return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
      }
    }

    const records = await db.select().from(users).where(eq(users.id, organizerId));
    const organizer = records[0];

    if (!organizer) {
      return NextResponse.json({ error: "Veranstalter nicht gefunden" }, { status: 404 });
    }

    let detailsSubmitted = false;
    let chargesEnabled = false;

    if (organizer.stripeConnectedAccountId && hasPlatformStripeKey()) {
      try {
        const acc = await stripe.accounts.retrieve(organizer.stripeConnectedAccountId);
        detailsSubmitted = Boolean(acc.details_submitted);
        chargesEnabled = Boolean(acc.charges_enabled);
      } catch (err) {
        console.error("Failed to retrieve connected account from Stripe:", err);
      }
    }

    const decryptedSecretKey = decryptText(organizer.stripeSecretKey);
    const decryptedWebhookSecret = decryptText(organizer.stripeWebhookSecret);

    return NextResponse.json({
      stripeMode: organizer.stripeMode || "connect",
      stripeConnectedAccountId: organizer.stripeConnectedAccountId || null,
      detailsSubmitted,
      chargesEnabled,
      stripePublishableKey: organizer.stripePublishableKey || "",
      stripeSecretKeyMasked: maskKey(organizer.stripeSecretKey),
      hasSecretKey: Boolean(decryptedSecretKey && decryptedSecretKey.trim().length > 0),
      stripeWebhookSecretMasked: maskKey(organizer.stripeWebhookSecret, 6, 4),
      hasWebhookSecret: Boolean(decryptedWebhookSecret && decryptedWebhookSecret.trim().length > 0),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const cookieStore = await cookies();
    let organizerId = body.organizerId || cookieStore.get("gatemate_user_id")?.value;

    if (!organizerId) {
      if (isDemoAllowed()) {
        organizerId = "user_organizer_01";
      } else {
        return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
      }
    }

    const { stripePublishableKey, stripeSecretKey, stripeWebhookSecret, stripeMode } = body;

    // Optional Key format validation
    if (stripePublishableKey && stripePublishableKey.trim() !== "" && !stripePublishableKey.trim().startsWith("pk_")) {
      return NextResponse.json(
        { error: "Ungültiger Stripe Publishable Key. Ein Publishable Key muss mit 'pk_' beginnen." },
        { status: 400 }
      );
    }

    if (
      stripeSecretKey &&
      stripeSecretKey.trim() !== "" &&
      !stripeSecretKey.trim().startsWith("sk_") &&
      !stripeSecretKey.trim().startsWith("rk_")
    ) {
      return NextResponse.json(
        { error: "Ungültiger Stripe Secret Key. Ein Secret Key muss mit 'sk_' oder 'rk_' beginnen." },
        { status: 400 }
      );
    }

    if (stripeWebhookSecret && stripeWebhookSecret.trim() !== "" && !stripeWebhookSecret.trim().startsWith("whsec_")) {
      return NextResponse.json(
        { error: "Ungültiges Stripe Webhook Secret. Ein Webhook Secret muss mit 'whsec_' beginnen." },
        { status: 400 }
      );
    }

    const records = await db.select().from(users).where(eq(users.id, organizerId));
    const existingUser = records[0];
    if (!existingUser) {
      return NextResponse.json({ error: "Veranstalter nicht gefunden" }, { status: 404 });
    }

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (stripeMode !== undefined) {
      updateData.stripeMode = stripeMode;
    }

    if (stripePublishableKey !== undefined) {
      updateData.stripePublishableKey = stripePublishableKey.trim() || null;
    }

    if (stripeSecretKey !== undefined && stripeSecretKey.trim() !== "" && !stripeSecretKey.includes("••••")) {
      updateData.stripeSecretKey = encryptText(stripeSecretKey.trim());
    } else if (stripeSecretKey === "") {
      updateData.stripeSecretKey = null;
    }

    if (stripeWebhookSecret !== undefined && stripeWebhookSecret.trim() !== "" && !stripeWebhookSecret.includes("••••")) {
      updateData.stripeWebhookSecret = encryptText(stripeWebhookSecret.trim());
    } else if (stripeWebhookSecret === "") {
      updateData.stripeWebhookSecret = null;
    }

    await db.update(users).set(updateData).where(eq(users.id, organizerId));

    const updatedRecords = await db.select().from(users).where(eq(users.id, organizerId));
    const updatedOrganizer = updatedRecords[0];

    const decryptedSecretKey = decryptText(updatedOrganizer.stripeSecretKey);
    const decryptedWebhookSecret = decryptText(updatedOrganizer.stripeWebhookSecret);

    return NextResponse.json({
      success: true,
      message: "Stripe Einstellungen erfolgreich gespeichert.",
      stripeMode: updatedOrganizer.stripeMode || "connect",
      stripeConnectedAccountId: updatedOrganizer.stripeConnectedAccountId || null,
      stripePublishableKey: updatedOrganizer.stripePublishableKey || "",
      stripeSecretKeyMasked: maskKey(updatedOrganizer.stripeSecretKey),
      hasSecretKey: Boolean(decryptedSecretKey && decryptedSecretKey.trim().length > 0),
      stripeWebhookSecretMasked: maskKey(updatedOrganizer.stripeWebhookSecret, 6, 4),
      hasWebhookSecret: Boolean(decryptedWebhookSecret && decryptedWebhookSecret.trim().length > 0),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  return PUT(req);
}

