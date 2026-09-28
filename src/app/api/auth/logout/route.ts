import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  try {
    const cookieStore = await cookies();

    cookieStore.delete("gatemate_role");
    cookieStore.delete("gatemate_user_id");
    cookieStore.delete("gatemate_user_email");
    cookieStore.delete("gatemate_user_name");

    return NextResponse.json({ success: true, message: "Erfolgreich abgemeldet." });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Fehler beim Abmelden." },
      { status: 500 }
    );
  }
}
