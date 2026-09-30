import { Resend } from "resend";
import { formatTaxDisclosure, formatLegalAddress, OrganizerLegalProfile } from "@/lib/legal";

const apiKey = process.env.RESEND_API_KEY;
const resend = apiKey ? new Resend(apiKey) : null;

const DEFAULT_FROM = process.env.EMAIL_FROM || "GateMate Tickets <onboarding@resend.dev>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://gatemate.io";

export interface TicketConfirmationEmailParams {
  buyerEmail: string;
  buyerName: string;
  orderId: string;
  eventTitle: string;
  eventDate?: string | Date | null;
  venue?: string | null;
  ticketCount: number;
  tierName?: string;
  totalCents: number;
  organizerLegalName?: string | null;
  organizerAddress?: string | null;
  organizerVatId?: string | null;
  isSmallBusiness?: boolean | null;
}

export interface PasswordResetEmailParams {
  email: string;
  resetUrl: string;
}

/**
 * Formats EUR currency from cents (e.g. 1500 -> 15,00 €)
 */
function formatEur(cents: number): string {
  return (cents / 100).toLocaleString("de-DE", {
    style: "currency",
    currency: "EUR",
  });
}

/**
 * Sends a ticket confirmation email via Resend after a successful purchase.
 */
export async function sendTicketConfirmationEmail(params: TicketConfirmationEmailParams) {
  const {
    buyerEmail,
    buyerName,
    orderId,
    eventTitle,
    eventDate,
    venue,
    ticketCount,
    tierName,
    totalCents,
    organizerLegalName,
    organizerAddress,
    organizerVatId,
    isSmallBusiness,
  } = params;

  if (!resend) {
    console.warn(
      `[RESEND SKIPPED] RESEND_API_KEY is not set. Ticket confirmation email for order ${orderId} (${buyerEmail}) was not sent.`
    );
    return { success: false, error: "RESEND_API_KEY missing" };
  }

  const ticketPageUrl = `${APP_URL}/tickets/${orderId}`;
  const formattedDate = eventDate
    ? new Date(eventDate).toLocaleDateString("de-DE", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Datum folgt";

  const formattedVenue = venue || "Online / TBD";
  const formattedPrice = formatEur(totalCents);
  const displayLegalName = organizerLegalName || "dem Veranstalter";
  const displayAddress = organizerAddress || "";
  const taxDisclosureText = formatTaxDisclosure(isSmallBusiness);

  const html = `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Deine Tickets für ${eventTitle}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #020617; color: #f8fafc; margin: 0; padding: 24px; }
        .container { max-width: 600px; margin: 0 auto; background-color: #0f172a; border-radius: 24px; border: 1px solid #1e293b; padding: 32px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); }
        .header { text-align: center; border-bottom: 1px solid #1e293b; padding-bottom: 24px; margin-bottom: 24px; }
        .logo { font-size: 24px; font-weight: 800; color: #818cf8; text-decoration: none; }
        .title { font-size: 22px; font-weight: 700; color: #ffffff; margin-top: 12px; margin-bottom: 8px; }
        .badge { display: inline-block; background-color: rgba(99, 102, 241, 0.15); color: #818cf8; font-weight: 600; font-size: 12px; padding: 4px 12px; border-radius: 9999px; border: 1px solid rgba(99, 102, 241, 0.3); }
        .details-card { background-color: #1e293b; border-radius: 16px; padding: 20px; margin: 24px 0; border: 1px solid #334155; }
        .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #334155; font-size: 14px; }
        .detail-row:last-child { border-bottom: none; }
        .detail-label { color: #94a3b8; }
        .detail-value { font-weight: 600; color: #f8fafc; text-align: right; }
        .btn { display: block; width: 100%; text-align: center; background-color: #4f46e5; color: #ffffff; font-weight: 700; font-size: 16px; padding: 14px 0; border-radius: 14px; text-decoration: none; margin-top: 24px; box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.3); }
        .footer { text-align: center; margin-top: 32px; font-size: 12px; color: #64748b; border-top: 1px solid #1e293b; padding-top: 16px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🎟️ GateMate Ticket-Service</div>
          <h1 class="title">Bestellbestätigung im Auftrag von ${displayLegalName}</h1>
          <div class="badge">Zahlung Erfolgreich</div>
        </div>

        <p>Hallo <strong>${buyerName}</strong>,</p>
        <p>vielen Dank für Ihre Ticketbestellung bei <strong>${displayLegalName}</strong>!</p>
        <p style="font-size: 13px; color: #94a3b8;">Vertragspartner und Verkäufer für diese Buchung ist <strong>${displayLegalName}</strong>${displayAddress ? ` (${displayAddress})` : ""}.</p>

        <div class="details-card">
          <div class="detail-row">
            <span class="detail-label">Veranstalter / Verkäufer:</span>
            <span class="detail-value">${displayLegalName}</span>
          </div>
          ${
            displayAddress
              ? `<div class="detail-row">
            <span class="detail-label">Veranstalteradresse:</span>
            <span class="detail-value">${displayAddress}</span>
          </div>`
              : ""
          }
          ${
            organizerVatId
              ? `<div class="detail-row">
            <span class="detail-label">USt-ID:</span>
            <span class="detail-value">${organizerVatId}</span>
          </div>`
              : ""
          }
          <div class="detail-row">
            <span class="detail-label">Event:</span>
            <span class="detail-value">${eventTitle}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Datum & Uhrzeit:</span>
            <span class="detail-value">${formattedDate}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Veranstaltungsort:</span>
            <span class="detail-value">${formattedVenue}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Ticketkategorie:</span>
            <span class="detail-value">${tierName || "Standard Ticket"} (${ticketCount}x)</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Bestell-ID:</span>
            <span class="detail-value font-mono">${orderId}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Gesamtbetrag:</span>
            <span class="detail-value">${formattedPrice} <span style="font-size: 11px; font-weight: normal; color: #94a3b8;">(${taxDisclosureText})</span></span>
          </div>
        </div>

        <p>Sie können Ihre digitalen QR-Tickets jederzeit auf Ihrer persönlichen Ticket-Seite aufrufen, als PDF herunterladen oder ausdrucken:</p>

        <a href="${ticketPageUrl}" class="btn" target="_blank">Jetzt Digitales Ticket & QR-Code Öffnen →</a>

        <div class="footer">
          GateMate agiert ausschließlich als technischer Dienstleister und Vermittler im Auftrag von ${displayLegalName}.<br>
          Bestell-ID: ${orderId} &bull; ${buyerEmail}
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const rawFromEmail = DEFAULT_FROM.includes("<") ? DEFAULT_FROM.split("<")[1].replace(">", "").trim() : DEFAULT_FROM.trim();
    const senderName = displayLegalName ? `${displayLegalName} via GateMate` : "GateMate Tickets";
    const dynamicFrom = `${senderName} <${rawFromEmail}>`;

    const data = await resend.emails.send({
      from: dynamicFrom,
      to: [buyerEmail],
      subject: `Deine Tickets für ${eventTitle} (Verkäufer: ${displayLegalName}) 🎟️`,
      html,
    });

    console.log(`[RESEND EMAIL SUCCESS] Confirmation sent to ${buyerEmail} for Order ${orderId}:`, data);
    return { success: true, data };
  } catch (err: any) {
    console.error(`[RESEND EMAIL ERROR] Failed to send email to ${buyerEmail}:`, err?.message || err);
    return { success: false, error: err?.message || err };
  }
}

/**
 * Sends a password reset email via Resend.
 */
export async function sendPasswordResetEmail(params: PasswordResetEmailParams) {
  const { email, resetUrl } = params;

  if (!resend) {
    console.warn(
      `[RESEND SKIPPED] RESEND_API_KEY is not set. Password reset email for ${email} was not sent.`
    );
    return { success: false, error: "RESEND_API_KEY missing" };
  }

  const html = `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="utf-8">
      <title>GateMate Passwort zurücksetzen</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #020617; color: #f8fafc; padding: 24px; }
        .container { max-width: 500px; margin: 0 auto; background-color: #0f172a; border-radius: 24px; border: 1px solid #1e293b; padding: 32px; }
        .btn { display: block; width: 100%; text-align: center; background-color: #4f46e5; color: #ffffff; font-weight: 700; font-size: 15px; padding: 12px 0; border-radius: 12px; text-decoration: none; margin-top: 24px; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Passwort zurücksetzen</h2>
        <p>Hallo,</p>
        <p>Du hast das Zurücksetzen deines Passworts für deinen GateMate-Account angefordert. Klicke auf den Button unten, um ein neues Passwort festzulegen:</p>
        <a href="${resetUrl}" class="btn" target="_blank">Neues Passwort festlegen →</a>
        <p style="margin-top: 24px; font-size: 12px; color: #64748b;">Falls du diese Anfrage nicht gestellt hast, kannst du diese E-Mail einfach ignorieren.</p>
      </div>
    </body>
    </html>
  `;

  try {
    const data = await resend.emails.send({
      from: DEFAULT_FROM,
      to: [email],
      subject: "GateMate – Passwort zurücksetzen 🔒",
      html,
    });

    console.log(`[RESEND EMAIL SUCCESS] Password reset email sent to ${email}:`, data);
    return { success: true, data };
  } catch (err: any) {
    console.error(`[RESEND EMAIL ERROR] Failed to send password reset email to ${email}:`, err?.message || err);
    return { success: false, error: err?.message || err };
  }
}
