import { Resend } from "resend";
import { formatTaxDisclosure, formatLegalAddress, OrganizerLegalProfile, STATUTORY_WITHDRAWAL_NOTICE } from "@/lib/legal";

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
        .legal-notice { background-color: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 14px 16px; margin-top: 24px; font-size: 12px; color: #94a3b8; line-height: 1.5; text-align: left; }
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

        <div class="legal-notice">
          <strong style="color: #cbd5e1;">Verbraucherinformation zum Widerrufsrecht:</strong><br>
          ${STATUTORY_WITHDRAWAL_NOTICE}
        </div>

        <div class="footer">
          <p style="margin: 0 0 6px 0;">
            GateMate agiert ausschließlich als technischer Dienstleister und Vermittler im Auftrag von <strong>${displayLegalName}</strong>.
          </p>
          <p style="margin: 0 0 8px 0; font-size: 11px; color: #475569;">
            Bestell-ID: ${orderId} &bull; Empfänger: ${buyerEmail}
          </p>
          <p style="margin: 8px 0 0 0; font-size: 11px; color: #64748b;">
            GateMate Ticketing Platform &bull; 
            <a href="${APP_URL}/impressum" style="color: #818cf8; text-decoration: underline;">Impressum</a> &bull; 
            <a href="${APP_URL}/datenschutz" style="color: #818cf8; text-decoration: underline;">Datenschutzerklärung</a> &bull; 
            <a href="${APP_URL}/agb" style="color: #818cf8; text-decoration: underline;">AGB</a>
          </p>
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
        <div style="text-align: center; margin-top: 24px; font-size: 11px; color: #64748b; border-top: 1px solid #1e293b; padding-top: 16px;">
          GateMate Platform &bull; 
          <a href="${APP_URL}/impressum" style="color: #818cf8; text-decoration: underline;">Impressum</a> &bull; 
          <a href="${APP_URL}/datenschutz" style="color: #818cf8; text-decoration: underline;">Datenschutzerklärung</a>
        </div>
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

export interface AdminMessageNotificationEmailParams {
  id: string;
  type: "general" | "dsa_notice";
  name: string;
  email: string;
  category: string;
  subject: string;
  message: string;
  targetUrl?: string | null;
  violationType?: string | null;
  legalReason?: string | null;
}

export interface ContactConfirmationEmailParams {
  name: string;
  email: string;
  subject: string;
  type: "general" | "dsa_notice";
}

/**
 * Sends a notification email to the Superadmin when a new contact or DSA message is received.
 */
export async function sendAdminNewMessageNotificationEmail(params: AdminMessageNotificationEmailParams) {
  const { id, type, name, email, category, subject, message, targetUrl, violationType, legalReason } = params;
  const adminEmail = process.env.ADMIN_EMAIL || "admin@gatemate.io";

  if (!resend) {
    console.warn(
      `[RESEND SKIPPED] RESEND_API_KEY is not set. Admin notification for message ${id} (${email}) was not sent.`
    );
    return { success: false, error: "RESEND_API_KEY missing" };
  }

  const isDsa = type === "dsa_notice";
  const dashboardUrl = `${APP_URL}/admin/messages`;
  const subjectPrefix = isDsa ? "🚨 [DSA-Meldung Art. 16]" : "📩 [Neue Anfragen]";

  const html = `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="utf-8">
      <title>Neue Nachricht auf GateMate</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #020617; color: #f8fafc; padding: 24px; }
        .container { max-width: 600px; margin: 0 auto; background-color: #0f172a; border-radius: 24px; border: 1px solid #1e293b; padding: 32px; }
        .badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-weight: 700; font-size: 12px; }
        .badge-dsa { background-color: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3); }
        .badge-general { background-color: rgba(99, 102, 241, 0.15); color: #818cf8; border: 1px solid rgba(99, 102, 241, 0.3); }
        .card { background-color: #1e293b; border-radius: 16px; padding: 20px; margin: 20px 0; border: 1px solid #334155; font-size: 14px; }
        .btn { display: block; width: 100%; text-align: center; background-color: #4f46e5; color: #ffffff; font-weight: 700; font-size: 15px; padding: 14px 0; border-radius: 14px; text-decoration: none; margin-top: 24px; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>${isDsa ? "🚨 Neue DSA-Meldung eingegangen" : "📩 Neue Kontaktanfrage eingegangen"}</h2>
        <p>Eine neue Nachricht wurde über die GateMate Plattform übermittelt:</p>

        <div class="card">
          <p><strong>Typ:</strong> <span class="badge ${isDsa ? "badge-dsa" : "badge-general"}">${isDsa ? "Art. 16 DSA Meldung" : "Allgemeiner Kontakt"}</span></p>
          <p><strong>Absender:</strong> ${name} (&lt;${email}&gt;)</p>
          <p><strong>Kategorie:</strong> ${category}</p>
          <p><strong>Betreff:</strong> ${subject}</p>
          ${targetUrl ? `<p><strong>Gemeldete URL:</strong> <a href="${targetUrl}" style="color: #818cf8;">${targetUrl}</a></p>` : ""}
          ${violationType ? `<p><strong>Verstoßtyp:</strong> ${violationType}</p>` : ""}
          ${legalReason ? `<p><strong>Begründung der Rechtswidrigkeit:</strong><br>${legalReason}</p>` : ""}
          <p><strong>Nachrichtentext:</strong></p>
          <div style="background-color: #0f172a; padding: 12px; border-radius: 8px; font-family: monospace; white-space: pre-wrap;">${message}</div>
        </div>

        <a href="${dashboardUrl}" class="btn" target="_blank">Im Superadmin Portal Öffnen & Bearbeiten →</a>
      </div>
    </body>
    </html>
  `;

  try {
    const data = await resend.emails.send({
      from: DEFAULT_FROM,
      to: [adminEmail],
      subject: `${subjectPrefix} ${subject} (${name})`,
      html,
    });
    return { success: true, data };
  } catch (err: any) {
    console.error(`[RESEND EMAIL ERROR] Failed to send admin message notification:`, err?.message || err);
    return { success: false, error: err?.message || err };
  }
}

/**
 * Sends a receipt confirmation email to the user who sent a message or DSA report.
 */
export async function sendContactConfirmationEmail(params: ContactConfirmationEmailParams) {
  const { name, email, subject, type } = params;

  if (!resend) {
    return { success: false, error: "RESEND_API_KEY missing" };
  }

  const isDsa = type === "dsa_notice";

  const html = `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="utf-8">
      <title>Bestätigung deiner Anfrage bei GateMate</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #020617; color: #f8fafc; padding: 24px; }
        .container { max-width: 550px; margin: 0 auto; background-color: #0f172a; border-radius: 24px; border: 1px solid #1e293b; padding: 32px; }
        .footer { text-align: center; margin-top: 24px; font-size: 12px; color: #64748b; }
      </style>
    </head>
    <body>
      <div class="container">
        <h3>Vielen Dank für deine Kontaktaufnahme!</h3>
        <p>Hallo <strong>${name}</strong>,</p>
        <p>wir haben deine ${isDsa ? "Meldung gemäß Art. 16 DSA" : "Anfrage"} bezüglich <strong>"${subject}"</strong> erfolgreich erhalten.</p>
        <p>${
          isDsa
            ? "Gemäß Artikel 16 der Verordnung (EU) 2022/2065 (DSA) prüfen wir deine Meldung umgehend und informieren dich über das Ergebnis der Prüfung."
            : "Unser Support-Team prüft dein Anliegen und wird sich in Kürze bei dir melden."
        }</p>
        <div class="footer">
          <p style="margin: 0 0 6px 0;">GateMate Platform &bull; Automatisierte Empfangsbestätigung</p>
          <p style="margin: 0; font-size: 11px; color: #64748b;">
            <a href="${APP_URL}/impressum" style="color: #818cf8; text-decoration: underline;">Impressum</a> &bull; 
            <a href="${APP_URL}/datenschutz" style="color: #818cf8; text-decoration: underline;">Datenschutzerklärung</a> &bull; 
            <a href="${APP_URL}/kontakt" style="color: #818cf8; text-decoration: underline;">Kontakt</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const data = await resend.emails.send({
      from: DEFAULT_FROM,
      to: [email],
      subject: `Empfangsbestätigung: ${subject} | GateMate`,
      html,
    });
    return { success: true, data };
  } catch (err: any) {
    console.error(`[RESEND EMAIL ERROR] Failed to send contact confirmation email to ${email}:`, err?.message || err);
    return { success: false, error: err?.message || err };
  }
}

export interface AdminSupportReplyEmailParams {
  recipientEmail: string;
  recipientName: string;
  originalSubject: string;
  originalMessage: string;
  replyText: string;
  adminName?: string;
}

/**
 * Sends a support reply email to a customer from the Superadmin dashboard via Resend.
 */
export async function sendAdminSupportReplyEmail(params: AdminSupportReplyEmailParams) {
  const { recipientEmail, recipientName, originalSubject, originalMessage, replyText, adminName } = params;

  if (!resend) {
    console.warn(`[RESEND SKIPPED] RESEND_API_KEY is missing. Support reply email for ${recipientEmail} was not sent.`);
    return { success: false, error: "RESEND_API_KEY missing" };
  }

  const senderLabel = adminName ? `GateMate Support (${adminName})` : "GateMate Support";
  const rawFromEmail = DEFAULT_FROM.includes("<") ? DEFAULT_FROM.split("<")[1].replace(">", "").trim() : DEFAULT_FROM.trim();
  const dynamicFrom = `${senderLabel} <${rawFromEmail}>`;

  const html = `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="utf-8">
      <title>Antwort auf Ihre Anfrage | GateMate</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #020617; color: #f8fafc; padding: 24px; margin: 0; }
        .container { max-width: 600px; margin: 0 auto; background-color: #0f172a; border-radius: 24px; border: 1px solid #1e293b; padding: 32px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); }
        .header { border-bottom: 1px solid #1e293b; padding-bottom: 16px; margin-bottom: 20px; }
        .logo { font-size: 20px; font-weight: 800; color: #818cf8; text-decoration: none; }
        .reply-box { background-color: #1e293b; border-radius: 16px; padding: 20px; border-left: 4px solid #6366f1; margin: 20px 0; font-size: 15px; line-height: 1.6; white-space: pre-wrap; color: #f8fafc; }
        .original-box { background-color: #090d16; border-radius: 12px; padding: 16px; border: 1px solid #1e293b; font-size: 13px; color: #94a3b8; margin-top: 24px; }
        .footer { text-align: center; margin-top: 24px; font-size: 11px; color: #64748b; border-top: 1px solid #1e293b; padding-top: 16px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🎟️ GateMate Support-Team</div>
        </div>

        <p>Hallo <strong>${recipientName}</strong>,</p>
        <p>vielen Dank für deine Geduld. Hier ist unsere Antwort auf deine Anfrage:</p>

        <div class="reply-box">${replyText}</div>

        <div class="original-box">
          <strong style="color: #cbd5e1;">Deine ursprüngliche Anfrage:</strong><br>
          <span style="color: #64748b; font-size: 12px;">Betreff: ${originalSubject}</span>
          <p style="margin: 8px 0 0 0; white-space: pre-wrap;">${originalMessage}</p>
        </div>

        <div class="footer">
          GateMate Ticketing Platform &bull; 
          <a href="${APP_URL}/impressum" style="color: #818cf8; text-decoration: underline;">Impressum</a> &bull; 
          <a href="${APP_URL}/datenschutz" style="color: #818cf8; text-decoration: underline;">Datenschutzerklärung</a> &bull; 
          <a href="${APP_URL}/kontakt" style="color: #818cf8; text-decoration: underline;">Kontakt</a>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const data = await resend.emails.send({
      from: dynamicFrom,
      to: [recipientEmail],
      subject: `Re: ${originalSubject} | GateMate Support`,
      html,
    });

    console.log(`[RESEND EMAIL SUCCESS] Support reply sent to ${recipientEmail}:`, data);
    return { success: true, data };
  } catch (err: any) {
    console.error(`[RESEND EMAIL ERROR] Failed to send support reply to ${recipientEmail}:`, err?.message || err);
    return { success: false, error: err?.message || err };
  }
}

