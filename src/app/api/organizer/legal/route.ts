import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { checkOrganizerLegalCompliance } from "@/lib/legal";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const cookieStore = await cookies();
    let organizerId = searchParams.get("organizerId") || cookieStore.get("gatemate_user_id")?.value;

    if (!organizerId) {
      if (process.env.ENABLE_DEMO_ACCOUNTS === "true") {
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

    const compliance = checkOrganizerLegalCompliance(organizer);

    return NextResponse.json({
      organizer,
      compliance,
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
      if (process.env.ENABLE_DEMO_ACCOUNTS === "true") {
        organizerId = "user_organizer_01";
      } else {
        return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
      }
    }

    const {
      legalName,
      street,
      zip,
      city,
      country = "Deutschland",
      vatId,
      isSmallBusiness = false,
      legalMode = "custom_text",
      impressumUrl,
      impressumContent,
      privacyUrl,
      privacyContent,
      termsUrl,
      termsContent,
      revocationNoticeCustom,
    } = body;

    const updateData = {
      legalName: legalName || null,
      street: street || null,
      zip: zip || null,
      city: city || null,
      country: country || "Deutschland",
      vatId: vatId || null,
      isSmallBusiness: Boolean(isSmallBusiness),
      legalMode: legalMode || "custom_text",
      impressumUrl: impressumUrl || null,
      impressumContent: impressumContent || null,
      privacyUrl: privacyUrl || null,
      privacyContent: privacyContent || null,
      termsUrl: termsUrl || null,
      termsContent: termsContent || null,
      revocationNoticeCustom: revocationNoticeCustom || null,
      updatedAt: new Date(),
    };

    await db.update(users).set(updateData).where(eq(users.id, organizerId));

    const updatedRecords = await db.select().from(users).where(eq(users.id, organizerId));
    const updatedOrganizer = updatedRecords[0];

    const compliance = checkOrganizerLegalCompliance(updatedOrganizer);

    return NextResponse.json({
      success: true,
      organizer: updatedOrganizer,
      compliance,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  return PUT(req);
}
