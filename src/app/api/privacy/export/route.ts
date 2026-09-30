import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/db";
import { users, orders, tickets, checkInLogs } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";

/**
 * DSGVO Auskunftsrecht & Datenübertragbarkeit (Art. 15, 20 DSGVO)
 * GET /api/privacy/export?email=user@example.com
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const cookieStore = await cookies();

    const paramEmail = searchParams.get("email");
    const sessionEmail = cookieStore.get("gatemate_user_email")?.value;

    const targetEmail = (paramEmail || sessionEmail || "").toLowerCase().trim();

    if (!targetEmail) {
      return NextResponse.json(
        { error: "Bitte geben Sie eine E-Mail-Adresse für die Datenauskunft an." },
        { status: 400 }
      );
    }

    // 1. Fetch User Record (if account exists)
    const userRecords = await db.select().from(users).where(eq(users.email, targetEmail));
    const userAccount = userRecords[0]
      ? {
          id: userRecords[0].id,
          email: userRecords[0].email,
          name: userRecords[0].name,
          role: userRecords[0].role,
          organizerSlug: userRecords[0].organizerSlug,
          createdAt: userRecords[0].createdAt,
          legalName: userRecords[0].legalName,
          city: userRecords[0].city,
        }
      : null;

    // 2. Fetch Orders for this email
    const orderRecords = await db.select().from(orders).where(eq(orders.customerEmail, targetEmail));
    const orderIds = orderRecords.map((o) => o.id);

    // 3. Fetch Tickets for these orders
    const ticketRecords = orderIds.length > 0
      ? await db.select().from(tickets).where(inArray(tickets.orderId, orderIds))
      : [];

    const ticketIds = ticketRecords.map((t) => t.id);

    // 4. Fetch Check-In Logs for these tickets
    const checkInRecords = ticketIds.length > 0
      ? await db.select().from(checkInLogs).where(inArray(checkInLogs.ticketId, ticketIds))
      : [];

    const exportData = {
      exportTimestamp: new Date().toISOString(),
      subjectEmail: targetEmail,
      userAccount,
      ordersCount: orderRecords.length,
      orders: orderRecords.map((o) => ({
        orderId: o.id,
        eventId: o.eventId,
        customerEmail: o.customerEmail,
        totalCents: o.totalCents,
        status: o.status,
        createdAt: o.createdAt,
      })),
      ticketsCount: ticketRecords.length,
      tickets: ticketRecords.map((t) => ({
        ticketId: t.id,
        orderId: t.orderId,
        attendeeName: t.attendeeName,
        status: t.status,
        createdAt: t.createdAt,
      })),
      checkInLogsCount: checkInRecords.length,
      checkInLogs: checkInRecords.map((c) => ({
        logId: c.id,
        ticketId: c.ticketId,
        scannedAt: c.scannedAt,
        deviceInfo: c.deviceInfo,
      })),
    };

    return NextResponse.json(exportData);
  } catch (error: any) {
    console.error("GDPR Export Error:", error);
    return NextResponse.json({ error: error.message || "Auskunftsanfrage fehlgeschlagen." }, { status: 500 });
  }
}
