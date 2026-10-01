"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { platformSettings } from "@/db/schema";
import { ActionResult } from "@/types";

export async function updatePlatformFeeAction(
  feePercent: number
): Promise<ActionResult<{ feePercent: number }>> {
  try {
    const cookieStore = await cookies();
    const role = cookieStore.get("gatemate_role")?.value;

    if (role !== "superadmin") {
      return {
        success: false,
        error: "Zugriff verweigert: Nur Superadmins dürfen Plattformgebühren ändern.",
      };
    }

    if (typeof feePercent !== "number" || isNaN(feePercent) || feePercent < 0 || feePercent > 100) {
      return {
        success: false,
        error: "Ungültiger Gebührensatz. Bitte einen Wert zwischen 0% und 100% eingeben.",
      };
    }

    // Format rounded to max 2 decimals for clean storage (e.g. 5.5)
    const formattedVal = (Math.round(feePercent * 100) / 100).toString();

    await db
      .insert(platformSettings)
      .values({
        key: "stripe_platform_fee_percent",
        value: formattedVal,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: platformSettings.key,
        set: {
          value: formattedVal,
          updatedAt: new Date(),
        },
      });

    revalidatePath("/admin");

    return {
      success: true,
      data: { feePercent: parseFloat(formattedVal) },
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Fehler beim Speichern der Plattformgebühr.";
    console.error("[UPDATE PLATFORM FEE ACTION ERROR]", err);
    return {
      success: false,
      error: errorMsg,
    };
  }
}
