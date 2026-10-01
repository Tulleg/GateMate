import { db } from "@/db";
import { orders } from "@/db/schema";
import { eq, and, lt } from "drizzle-orm";

/**
 * Sweeps the database for pending orders whose reservation window (expiresAt) has passed,
 * and updates their status to 'failed' so that their reserved ticket quantities are released.
 */
export async function cleanupExpiredOrders(): Promise<{ cleanedCount: number }> {
  try {
    const now = new Date();
    const result = await db
      .update(orders)
      .set({
        status: "failed",
        updatedAt: now,
      })
      .where(
        and(
          eq(orders.status, "pending"),
          lt(orders.expiresAt, now)
        )
      )
      .returning({ id: orders.id });

    if (result.length > 0) {
      console.log(`[ORDER CLEANUP] Marked ${result.length} expired pending orders as failed.`);
    }

    return { cleanedCount: result.length };
  } catch (error) {
    console.error("[ORDER CLEANUP ERROR] Failed to clean up expired orders:", error);
    return { cleanedCount: 0 };
  }
}
