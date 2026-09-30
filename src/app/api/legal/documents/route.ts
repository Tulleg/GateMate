import { NextResponse } from "next/server";
import { db } from "@/db";
import { legalDocuments, users } from "@/db/schema";
import { eq, and, isNull, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { publishLegalDocument } from "@/lib/legal-server";
import { LEGAL_DOCUMENT_METADATA, LegalDocumentType } from "@/lib/legal";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const scope = searchParams.get("scope"); // 'platform' | 'organizer' | 'all'
    const documentType = searchParams.get("documentType");
    const status = searchParams.get("status");

    const conditions = [];

    // Filter scope
    if (scope === "platform") {
      conditions.push(isNull(legalDocuments.organizerId));
    } else if (scope === "organizer") {
      if (user.role !== "superadmin") {
        conditions.push(eq(legalDocuments.organizerId, user.id));
      }
    } else {
      // Default: if not superadmin, only show user's docs & platform docs
      if (user.role !== "superadmin") {
        conditions.push(eq(legalDocuments.organizerId, user.id));
      }
    }

    if (documentType) {
      conditions.push(eq(legalDocuments.documentType, documentType as any));
    }

    if (status) {
      conditions.push(eq(legalDocuments.status, status as any));
    }

    const docs = await db
      .select()
      .from(legalDocuments)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(legalDocuments.updatedAt));

    return NextResponse.json({ documents: docs });
  } catch (error: any) {
    console.error("GET /api/legal/documents error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
    }

    const body = await request.json();
    const { documentType, title, content, url, eventType, applicableModules, isPlatform, status } = body;

    if (!documentType) {
      return NextResponse.json({ error: "documentType ist erforderlich" }, { status: 400 });
    }

    // Platform docs can only be edited/created by superadmin
    let targetOrganizerId: string | null = user.id;
    if (isPlatform || LEGAL_DOCUMENT_METADATA[documentType as LegalDocumentType]?.scope === "platform") {
      if (user.role !== "superadmin") {
        return NextResponse.json({ error: "Nur Plattform-Administratoren können Plattformdokumente verwalten." }, { status: 403 });
      }
      targetOrganizerId = null;
    }

    const docMeta = LEGAL_DOCUMENT_METADATA[documentType as LegalDocumentType];
    const docTitle = title || docMeta?.title || documentType;

    const result = await publishLegalDocument({
      organizerId: targetOrganizerId,
      documentType: documentType as LegalDocumentType,
      title: docTitle,
      content,
      url,
      eventType,
      applicableModules,
      status: status || "published",
    });

    return NextResponse.json({ success: true, document: result });
  } catch (error: any) {
    console.error("POST /api/legal/documents error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
