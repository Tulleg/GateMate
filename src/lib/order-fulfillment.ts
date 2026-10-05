import { db } from "@/db";
import { orders, tickets, ticketTiers } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { generateSignedTicketJwt } from "@/lib/qr";
import { sendTicketConfirmationEmailAsync } from "@/lib/email-service";
import crypto from "crypto";

export interface FulfillOrderResult {
  success: boolean;
  alreadyCompleted?: boolean;
  ticketsIssued?: number;
  error?: string;
}

/**
 * Atomically & idempotently fulfills an order:
 * 1. Sets orders.status = "completed"
 * 2. Increments ticketTiers.quantitySold
 * 3. Generates cryptographic QR codes and inserts tickets
 * 4. Triggers asynchronous email dispatch
 */
export async function fulfillOrder(
  orderId: string,
  paymentIntentId?: string | null
): Promise<FulfillOrderResult> {
  try {
    let numQty = 0;
    let tierId = "";
    let eventId = "";
    let buyerEmail = "";
    let buyerName = "Kunde";
    let totalCents = 0;
    let shouldDispatchEmail = false;

    await db.transaction(async (tx) => {
      // 1. Fetch Order Record
      const orderRecords = await tx.select().from(orders).where(eq(orders.id, orderId));
      const orderRecord = orderRecords[0];

      if (!orderRecord) {
        throw new Error(`Order ${orderId} not found`);
      }

      // Idempotency check: if already completed, do nothing
      if (orderRecord.status === "completed") {
        console.log(`[ORDER FULFILLMENT] Order ${orderId} is already completed. Idempotent skip.`);
        shouldDispatchEmail = false;
        return;
      }

      numQty = orderRecord.quantity;
      tierId = orderRecord.ticketTierId || "";
      eventId = orderRecord.eventId;
      buyerEmail = orderRecord.customerEmail;
      totalCents = orderRecord.totalCents;

      // 2. Mark Order as Completed
      await tx
        .update(orders)
        .set({
          status: "completed",
          stripePaymentIntentId: paymentIntentId || orderRecord.stripePaymentIntentId || null,
          updatedAt: new Date(),
        })
        .where(eq(orders.id, orderId));

      // 3. Increment Quantity Sold on Ticket Tier
      await tx
        .update(ticketTiers)
        .set({
          quantitySold: sql`${ticketTiers.quantitySold} + ${numQty}`,
          updatedAt: new Date(),
        })
        .where(eq(ticketTiers.id, tierId));

      // 4. Generate Cryptographic QR Tickets & Insert
      const ticketInserts = [];
      for (let i = 1; i <= numQty; i++) {
        const ticketId = `tkt_${orderId}_${i}`;
        const nonce = crypto.randomBytes(16).toString("hex");

        const signedJwt = await generateSignedTicketJwt({
          ticketId,
          orderId,
          eventId,
          tierId,
          organizationId: "default_org",
          issuedAt: Date.now(),
          nonce,
        });

        ticketInserts.push({
          id: ticketId,
          orderId,
          ticketTierId: tierId,
          attendeeName: buyerName,
          qrHashToken: signedJwt,
          status: "valid" as const,
        });
      }

      if (ticketInserts.length > 0) {
        await tx.insert(tickets).values(ticketInserts);
      }

      shouldDispatchEmail = true;
      console.log(`[ORDER FULFILLMENT SUCCESS] Issued ${numQty} tickets for Order ${orderId}`);
    });

    // 5. Decoupled Asynchronous Email Dispatch (Outside Transaction)
    if (shouldDispatchEmail && buyerEmail) {
      sendTicketConfirmationEmailAsync({
        orderId,
        eventId,
        tierId,
        targetEmail: buyerEmail,
        buyerName,
        ticketCount: numQty,
        amountTotal: totalCents,
      }).catch((emailErr) => {
        console.error("[DECOUPLED EMAIL DISPATCH ERROR]", emailErr);
      });
    }

    return {
      success: true,
      ticketsIssued: numQty,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[ORDER FULFILLMENT ERROR] Failed to fulfill order ${orderId}:`, errorMsg);
    return {
      success: false,
      error: errorMsg,
    };
  }
}
