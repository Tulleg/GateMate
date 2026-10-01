import { db } from "@/db";
import { platformSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getPlatformFeePercent(): Promise<number> {
  try {
    const settingRecords = await db
      .select()
      .from(platformSettings)
      .where(eq(platformSettings.key, "stripe_platform_fee_percent"));
    const setting = settingRecords[0];
    if (setting && setting.value) {
      const parsed = parseFloat(setting.value);
      if (!isNaN(parsed) && parsed >= 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error("[getPlatformFeePercent] Error fetching fee from DB:", err);
  }
  return parseFloat(process.env.STRIPE_PLATFORM_FEE_PERCENT || "5.0");
}
