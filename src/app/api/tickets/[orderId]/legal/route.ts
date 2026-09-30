import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const resolvedParams = await params;
    const orderId = resolvedParams.orderId;

    const foundOrders = await db.select().from(orders).where(eq(orders.id, orderId));
    const order = foundOrders[0];

    if (!order) {
      return NextResponse.json({ error: "Bestellung nicht gefunden" }, { status: 404 });
    }

    let snapshot = null;
    if (order.documentVersionsSnapshot) {
      try {
        snapshot = JSON.parse(order.documentVersionsSnapshot);
      } catch (e) {
        snapshot = order.documentVersionsSnapshot;
      }
    }

    let legalProfile = null;
    if (order.legalProfileSnapshot) {
      try {
        legalProfile = JSON.parse(order.legalProfileSnapshot);
      } catch (e) {
        legalProfile = order.legalProfileSnapshot;
      }
    }

    return NextResponse.json({
      orderId: order.id,
      purchasedAt: order.createdAt,
      snapshot,
      legalProfile,
    });
  } catch (error: any) {
    console.error("GET /api/tickets/[orderId]/legal error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
