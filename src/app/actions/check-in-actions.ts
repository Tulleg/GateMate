"use server";

import { db } from "@/db";
import { tickets, checkInLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { scanRequestSchema, ScanRequestInput } from "@/lib/validation";
import { ActionResult, formatZodErrors, CheckInResponse } from "@/types";
import { getCurrentUser } from "@/lib/auth";
import { verifyTicketJwtDetailed } from "@/lib/qr";

export async function validateAndCheckInTicketAction(
  input: unknown
): Promise<ActionResult<CheckInResponse>> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return {
        success: false,
        error: "Nicht authentifiziert. Bitte melden Sie sich an, um Tickets zu entwerten.",
      };
    }

    const validated = scanRequestSchema.safeParse(input);
    if (!validated.success) {
      return {
        success: false,
        error: "Ungültige Scan-Eingabedaten.",
        fieldErrors: formatZodErrors(validated.error),
      };
    }

    const { qrToken, eventId, deviceInfo }: ScanRequestInput = validated.data;

    // 1. Crypto Verification of QR JWT
    const cryptoVerification = await verifyTicketJwtDetailed(qrToken);
    if (!cryptoVerification.valid || !cryptoVerification.payload) {
      return {
        success: true,
        data: {
          success: false,
          message: cryptoVerification.error || "Ungültiges oder gefälschtes Ticket.",
          error: cryptoVerification.status,
        },
      };
    }

    const ticketIdFromJwt = cryptoVerification.payload.ticketId;

    // 2. Query Ticket Record in DB with Relational Data
    const ticketRecord = await db.query.tickets.findFirst({
      where: (t, { eq, or }) => or(eq(t.id, ticketIdFromJwt), eq(t.qrHashToken, qrToken)),
      with: {
        order: {
          with: {
            event: true,
          },
        },
        tier: true,
      },
    });

    if (!ticketRecord) {
      return {
        success: true,
        data: {
          success: false,
          message: "Ticket existiert nicht in der Datenbank.",
          error: "NOT_FOUND",
        },
      };
    }

    // Check optional Event-Scope
    if (eventId && ticketRecord.order?.eventId !== eventId) {
      return {
        success: true,
        data: {
          success: false,
          message: `Ticket gehört nicht zu diesem Event (${ticketRecord.order?.event?.title || "Anderes Event"}).`,
          error: "EVENT_MISMATCH",
        },
      };
    }

    // Check Status
    if (ticketRecord.status === "cancelled") {
      return {
        success: true,
        data: {
          success: false,
          message: "Dieses Ticket wurde storniert / widerrufen.",
          error: "CANCELLED",
        },
      };
    }

    // Check Previous Check-In Logs
    const existingLog = await db.query.checkInLogs.findFirst({
      where: (l, { eq }) => eq(l.ticketId, ticketRecord.id),
    });

    if (existingLog || ticketRecord.status === "used") {
      const scannedAtStr = existingLog
        ? new Date(existingLog.scannedAt).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })
        : "unbekannt";

      return {
        success: true,
        data: {
          success: false,
          message: `ABGELEHNT: Ticket wurde bereits entwertet (um ${scannedAtStr} Uhr).`,
          error: "ALREADY_USED",
          ticket: {
            id: ticketRecord.id,
            attendeeName: ticketRecord.attendeeName,
            attendeeEmail: ticketRecord.order?.customerEmail || "",
            tierName: ticketRecord.tier?.name || "Standard Ticket",
            checkedInAt: existingLog ? existingLog.scannedAt.toISOString() : new Date().toISOString(),
          },
        },
      };
    }

    // 3. Atomic Check-In Transaction
    const now = new Date();
    const logId = `chk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    await db.transaction(async (tx) => {
      await tx
        .update(tickets)
        .set({ status: "used", updatedAt: now })
        .where(eq(tickets.id, ticketRecord.id));

      await tx.insert(checkInLogs).values({
        id: logId,
        ticketId: ticketRecord.id,
        scannedByUserId: currentUser.id,
        scannedAt: now,
        deviceInfo: deviceInfo || "Scanner App",
      });
    });

    return {
      success: true,
      data: {
        success: true,
        message: `GÜLTIG: Einlass gewährt für ${ticketRecord.attendeeName}`,
        ticket: {
          id: ticketRecord.id,
          attendeeName: ticketRecord.attendeeName,
          attendeeEmail: ticketRecord.order?.customerEmail || "",
          tierName: ticketRecord.tier?.name || "Standard Ticket",
          checkedInAt: now.toISOString(),
        },
      },
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Fehler beim Ticket-Check-in.";
    console.error("[VALIDATE AND CHECK IN TICKET ACTION ERROR]", err);
    return {
      success: false,
      error: errorMsg,
    };
  }
}
