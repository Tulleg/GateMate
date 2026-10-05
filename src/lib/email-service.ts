import { db } from "@/db";
import { events, ticketTiers, users, orders } from "@/db/schema";
import { eq } from "drizzle-orm";
import { sendTicketConfirmationEmail } from "@/lib/email";
import { formatLegalAddress } from "@/lib/legal";
import { logSystemEvent } from "@/lib/system-logger";

export interface TicketEmailDispatchParams {
  orderId: string;
  eventId: string;
  tierId: string;
  targetEmail: string;
  buyerName: string;
  ticketCount: number;
  amountTotal: number;
}

/**
 * Asynchronously fetches necessary event, organizer & order metadata, and dispatches ticket confirmation email.
 * Runs outside of blocking database transactions to prevent transaction timeouts & email delays.
 */
export async function sendTicketConfirmationEmailAsync(params: TicketEmailDispatchParams): Promise<void> {
  const { orderId, eventId, tierId, targetEmail, buyerName, ticketCount, amountTotal } = params;

  try {
    const eventRecords = await db.select().from(events).where(eq(events.id, eventId));
    const tierRecords = await db.select().from(ticketTiers).where(eq(ticketTiers.id, tierId));
    const orderRecords = await db.select().from(orders).where(eq(orders.id, orderId));

    const currentEvent = eventRecords[0];
    const currentTier = tierRecords[0];
    const currentOrder = orderRecords[0];

    const organizerRecords = currentEvent?.organizerId
      ? await db.select().from(users).where(eq(users.id, currentEvent.organizerId))
      : [];
    const organizer = organizerRecords[0];

    const result = await sendTicketConfirmationEmail({
      buyerEmail: targetEmail,
      buyerName,
      orderId,
      eventTitle: currentEvent?.title || "GateMate Event",
      eventDate: currentEvent?.startDate,
      venue: currentEvent?.venue,
      ticketCount,
      tierName: currentTier?.name || "Standard Ticket",
      totalCents: currentOrder?.totalCents || amountTotal || 0,
      organizerLegalName: organizer?.legalName || organizer?.name || "Veranstalter",
      organizerAddress: formatLegalAddress(organizer),
      organizerVatId: organizer?.vatId,
      isSmallBusiness: organizer?.isSmallBusiness,
    });

    if (!result.success) {
      console.warn(`[DECOUPLED EMAIL SERVICE] Ticket confirmation email delivery warning for order ${orderId}:`, result.error);
      await logSystemEvent({
        severity: "warning",
        category: "email",
        message: `E-Mail-Bestätigung für Bestellung ${orderId} fehlgeschlagen`,
        details: String(result.error),
        relatedEntityId: orderId,
      });
    } else {
      await logSystemEvent({
        severity: "info",
        category: "email",
        message: `Ticket-Bestätigung erfolgreich per E-Mail an ${targetEmail} gesendet`,
        relatedEntityId: orderId,
      });
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[DECOUPLED EMAIL SERVICE ERROR] Failed to dispatch ticket confirmation email for order ${orderId}:`, errorMsg);
    await logSystemEvent({
      severity: "critical",
      category: "email",
      message: `Kritischer Fehler beim E-Mail-Versand für Bestellung ${orderId}`,
      details: errorMsg,
      relatedEntityId: orderId,
    });
  }
}
