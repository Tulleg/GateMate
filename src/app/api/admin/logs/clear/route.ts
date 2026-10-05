import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/db";
import { systemLogs } from "@/db/schema";

export async function DELETE() {
  try {
    const cookieStore = await cookies();
    const role = cookieStore.get("gatemate_role")?.value;

    if (role !== "superadmin") {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
    }

    await db.delete(systemLogs);

    return NextResponse.json({ success: true, message: "System-Logs geleert" });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
