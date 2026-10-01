import { NextResponse } from "next/server";
import { cleanupExpiredOrders } from "@/lib/orders-cleanup";

export async function GET(req: Request) {
  try {
    const { cleanedCount } = await cleanupExpiredOrders();
    return NextResponse.json({
      success: true,
      cleanedCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Cron cleanup error:", error);
    return NextResponse.json({ error: error.message || "Cron cleanup failed" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  return GET(req);
}
