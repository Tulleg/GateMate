import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import path from "path";
import fs from "fs/promises";
import crypto from "crypto";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
];

const EXTENSION_MAP: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
};

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser && process.env.ENABLE_DEMO_ACCOUNTS !== "true") {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Keine Datei hochgeladen" }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Ungültiges Dateiformat. Erlaubt sind JPG, PNG, WEBP, GIF und SVG." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Dateigröße überschreitet das Limit von 5 MB." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = EXTENSION_MAP[file.type] || "jpg";
    const filename = `evt-${Date.now()}-${crypto.randomBytes(6).toString("hex")}.${ext}`;

    const uploadDir = path.join(process.cwd(), "public", "uploads", "events");
    await fs.mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, filename);
    await fs.writeFile(filePath, buffer);

    const publicUrl = `/uploads/events/${filename}`;

    return NextResponse.json({
      url: publicUrl,
      filename,
      size: file.size,
    });
  } catch (error: any) {
    console.error("Error uploading event image:", error);
    return NextResponse.json(
      { error: "Fehler beim Hochladen des Bildes." },
      { status: 500 }
    );
  }
}
