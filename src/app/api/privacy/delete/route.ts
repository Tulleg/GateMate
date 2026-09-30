import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/db";
import { orders, tickets, checkInLogs } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";

/**
 * DSGVO Recht auf Löschung & Anonymisierung (Art. 17 DSGVO)
 * Unter Beachtung gesetzlicher Aufbewahrungsfristen (§ 147 AO / § 257 HGB: 10 Jahre Rechnungsdaten).
 * POST /api/privacy/delete
 */
export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    const cookieStore = await cookies();

    const sessionEmail = cookieStore.get("gatemate_user_email")?.value;
    const targetEmail = (email || sessionEmail || "").toLowerCase().trim();

    if (!targetEmail) {
      return NextResponse.json(
        { error: "Bitte geben Sie eine E-Mail-Adresse für die Löschungsanfrage an." },
        { status: 400 }
      );
    }

    // 1. Fetch Orders for this email
    const orderRecords = await db.select().from(orders).where(eq(orders.customerEmail, targetEmail));
    const orderIds = orderRecords.map((o) => o.id);

    if (orderIds.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Keine verknüpften Datensätze für diese E-Mail-Adresse gefunden.",
        anonymizedOrdersCount: 0,
        anonymizedTicketsCount: 0,
      });
    }

    // 2. Fetch Tickets for these orders
    const ticketRecords = await db.select().from(tickets).where(inArray(tickets.orderId, orderIds));
    const ticketIds = ticketRecords.map((t) => t.id);

    // 3. Delete non-essential Check-In Logs (Art. 17 DSGVO)
    let deletedLogsCount = 0;
    if (ticketIds.length > 0) {
      const logsToDelete = await db.select().from(checkInLogs).where(inArray(checkInLogs.ticketId, ticketIds));
      deletedLogsCount = logsToDelete.length;
      await db.delete(checkInLogs).where(inArray(checkInLogs.ticketId, ticketIds));
    }

    // 4. Anonymize Ticket Attendee Names (Art. 17 DSGVO)
    if (ticketIds.length > 0) {
      await db
        .update(tickets)
        .set({ attendeeName: "Anonymisierter Teilnehmer", updatedAt: new Date() })
        .where(inArray(tickets.id, ticketIds));
    }

    // 5. Anonymize Customer E-Mail in Orders while retaining financial record (§ 147 AO)
    for (const order of orderRecords) {
      const anonymizedEmail = `anonymized_${order.id}@deleted.gatemate.io`;
      await db
        .update(orders)
        .set({
          customerEmail: anonymizedEmail,
          updatedAt: new Date(),
        })
        .where(eq(orders.id, order.id));
    }

    return NextResponse.json({
      success: true,
      message:
        "Personenbezogene Daten wurden gemäß Art. 17 DSGVO anonymisiert und gelöscht. Transaktionssummen wurden gemäß § 147 AO für steuerliche Pflichten anonymisiert aufbewahrt.",
      anonymizedOrdersCount: orderRecords.length,
      anonymizedTicketsCount: ticketRecords.length,
      deletedLogsCount,
    });
  } catch (error: any) {
    console.error("GDPR Deletion Error:", error);
    return NextResponse.json({ error: error.message || "Löschungsanfrage fehlgeschlagen." }, { status: 500 });
  }
}
