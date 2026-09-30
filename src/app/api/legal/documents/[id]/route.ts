import { NextResponse } from "next/server";
import { db } from "@/db";
import { legalDocuments } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { generateHash } from "@/lib/legal-server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
    }

    const resolvedParams = await params;
    const docId = resolvedParams.id;

    const docs = await db
      .select()
      .from(legalDocuments)
      .where(eq(legalDocuments.id, docId));

    const doc = docs[0];
    if (!doc) {
      return NextResponse.json({ error: "Dokument nicht gefunden" }, { status: 404 });
    }

    // Permission check
    if (doc.organizerId && doc.organizerId !== user.id && user.role !== "superadmin") {
      return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 });
    }

    // Fetch version history for this doc type & organizer
    const history = await db
      .select()
      .from(legalDocuments)
      .where(
        and(
          eq(legalDocuments.documentType, doc.documentType),
          doc.organizerId ? eq(legalDocuments.organizerId, doc.organizerId) : eq(legalDocuments.id, doc.id)
        )
      )
      .orderBy(desc(legalDocuments.version));

    return NextResponse.json({ document: doc, history });
  } catch (error: any) {
    console.error("GET /api/legal/documents/[id] error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
    }

    const resolvedParams = await params;
    const docId = resolvedParams.id;

    const existingDocs = await db
      .select()
      .from(legalDocuments)
      .where(eq(legalDocuments.id, docId));

    const existingDoc = existingDocs[0];
    if (!existingDoc) {
      return NextResponse.json({ error: "Dokument nicht gefunden" }, { status: 404 });
    }

    // Authorization
    if (existingDoc.organizerId && existingDoc.organizerId !== user.id && user.role !== "superadmin") {
      return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 });
    }
    if (!existingDoc.organizerId && user.role !== "superadmin") {
      return NextResponse.json({ error: "Nur Superadmins können Plattformdokumente ändern" }, { status: 403 });
    }

    const body = await request.json();
    const { title, content, url, status, eventType, applicableModules, createNewVersion } = body;

    const modulesJson = applicableModules && applicableModules.length > 0 ? JSON.stringify(applicableModules) : null;
    const rawString = `${content || ""}|${url || ""}|${modulesJson || ""}`;
    const hash = generateHash(rawString);

    if (createNewVersion || status === "published") {
      // Create a brand new version entry
      const nextVersion = existingDoc.version + 1;
      const newId = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

      await db.insert(legalDocuments).values({
        id: newId,
        organizerId: existingDoc.organizerId,
        documentType: existingDoc.documentType,
        title: title || existingDoc.title,
        content: content !== undefined ? content : existingDoc.content,
        url: url !== undefined ? url : existingDoc.url,
        eventType: eventType !== undefined ? eventType : existingDoc.eventType,
        applicableModules: modulesJson !== undefined ? modulesJson : existingDoc.applicableModules,
        version: nextVersion,
        status: status || "published",
        hash,
        createdAt: new Date(),
        publishedAt: status === "published" ? new Date() : existingDoc.publishedAt,
        updatedAt: new Date(),
        validFrom: new Date(),
      });

      return NextResponse.json({ success: true, newVersion: nextVersion, id: newId });
    } else {
      // In-place update of draft
      await db
        .update(legalDocuments)
        .set({
          title: title !== undefined ? title : existingDoc.title,
          content: content !== undefined ? content : existingDoc.content,
          url: url !== undefined ? url : existingDoc.url,
          eventType: eventType !== undefined ? eventType : existingDoc.eventType,
          applicableModules: modulesJson !== undefined ? modulesJson : existingDoc.applicableModules,
          status: status || existingDoc.status,
          hash,
          updatedAt: new Date(),
        })
        .where(eq(legalDocuments.id, docId));

      return NextResponse.json({ success: true, updated: true });
    }
  } catch (error: any) {
    console.error("PUT /api/legal/documents/[id] error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
    }

    const resolvedParams = await params;
    const docId = resolvedParams.id;

    const existing = await db
      .select()
      .from(legalDocuments)
      .where(eq(legalDocuments.id, docId));

    const doc = existing[0];
    if (!doc) {
      return NextResponse.json({ error: "Dokument nicht gefunden" }, { status: 404 });
    }

    if (doc.organizerId && doc.organizerId !== user.id && user.role !== "superadmin") {
      return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 });
    }

    // Archive document
    await db
      .update(legalDocuments)
      .set({ status: "archived", updatedAt: new Date() })
      .where(eq(legalDocuments.id, docId));

    return NextResponse.json({ success: true, archived: true });
  } catch (error: any) {
    console.error("DELETE /api/legal/documents/[id] error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
