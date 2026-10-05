"use server";

import { db } from "@/db";
import { contactMessages, contactMessageReplies } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { sendAdminNewMessageNotificationEmail, sendContactConfirmationEmail, sendAdminSupportReplyEmail } from "@/lib/email";
import { contactMessageSchema } from "@/lib/validation";
import { ActionResult, formatZodErrors } from "@/types";
import { getCurrentUser } from "@/lib/auth";

export async function submitContactForm(formData: FormData): Promise<ActionResult<{ messageId: string }>> {
  try {
    const rawData = {
      name: formData.get("name")?.toString().trim() || "",
      email: formData.get("email")?.toString().trim() || "",
      category: formData.get("category")?.toString().trim() || "general",
      subject: formData.get("subject")?.toString().trim() || "",
      message: formData.get("message")?.toString().trim() || "",
      type: "general" as const,
    };

    const validated = contactMessageSchema.safeParse(rawData);
    if (!validated.success) {
      return {
        success: false,
        error: "Ungültige Eingabedaten. Bitte überprüfe deine Angaben.",
        fieldErrors: formatZodErrors(validated.error),
      };
    }

    const { name, email, category, subject, message } = validated.data;
    const id = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    await db.insert(contactMessages).values({
      id,
      type: "general",
      name,
      email,
      category,
      subject,
      message,
      status: "new",
    });

    // Send emails asynchronously
    sendAdminNewMessageNotificationEmail({
      id,
      type: "general",
      name,
      email,
      category,
      subject,
      message,
    }).catch(console.error);

    sendContactConfirmationEmail({
      name,
      email,
      subject,
      type: "general",
    }).catch(console.error);

    return {
      success: true,
      data: { messageId: id },
      message: "Vielen Dank! Deine Nachricht wurde erfolgreich übermittelt. Wir melden uns in Kürze.",
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Fehler beim Senden der Nachricht.";
    console.error("[SUBMIT CONTACT FORM ERROR]", err);
    return {
      success: false,
      error: errorMsg,
    };
  }
}

export async function submitDsaReportForm(formData: FormData): Promise<ActionResult<{ messageId: string }>> {
  try {
    const rawData = {
      name: formData.get("name")?.toString().trim() || "",
      email: formData.get("email")?.toString().trim() || "",
      category: "legal_dsa",
      subject: `DSA-Meldung: ${formData.get("violationType")?.toString().trim() || "Sonstiger Verstoß"}`,
      message: `Gemeldete URL: ${formData.get("targetUrl")?.toString().trim() || ""}\nVerstoßtyp: ${
        formData.get("violationType")?.toString().trim() || ""
      }\nBegründung: ${formData.get("legalReason")?.toString().trim() || ""}`,
      type: "dsa_notice" as const,
      targetUrl: formData.get("targetUrl")?.toString().trim() || "",
      violationType: formData.get("violationType")?.toString().trim() || "Sonstiger rechtswidriger Inhalt",
      legalReason: formData.get("legalReason")?.toString().trim() || "",
      dsaDeclaration: formData.get("dsaDeclaration") === "on" || formData.get("dsaDeclaration") === "true",
    };

    const validated = contactMessageSchema.safeParse(rawData);
    if (!validated.success) {
      return {
        success: false,
        error: "Ungültige Angaben bei der DSA-Meldung.",
        fieldErrors: formatZodErrors(validated.error),
      };
    }

    if (!validated.data.dsaDeclaration) {
      return {
        success: false,
        error: "Bitte bestätige die Erklärung in gutem Glauben gemäß Art. 16 DSA.",
      };
    }

    const { name, email, subject, message, targetUrl, violationType, legalReason } = validated.data;
    const id = `dsa_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    await db.insert(contactMessages).values({
      id,
      type: "dsa_notice",
      name,
      email,
      category: "legal_dsa",
      subject,
      message,
      targetUrl: targetUrl || null,
      violationType: violationType || null,
      legalReason: legalReason || null,
      dsaDeclaration: true,
      status: "new",
    });

    // Send emails asynchronously
    sendAdminNewMessageNotificationEmail({
      id,
      type: "dsa_notice",
      name,
      email,
      category: "legal_dsa (Art. 16 DSA)",
      subject,
      message,
      targetUrl,
      violationType,
      legalReason,
    }).catch(console.error);

    sendContactConfirmationEmail({
      name,
      email,
      subject,
      type: "dsa_notice",
    }).catch(console.error);

    return {
      success: true,
      data: { messageId: id },
      message: "Vielen Dank. Ihre Meldung gemäß Art. 16 DSA wurde erfolgreich eingereicht und wird umgehend geprüft.",
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Fehler beim Einreichen der DSA-Meldung.";
    console.error("[SUBMIT DSA REPORT ERROR]", err);
    return {
      success: false,
      error: errorMsg,
    };
  }
}

export async function updateMessageStatus(
  id: string,
  status: "new" | "in_progress" | "replied" | "archived",
  adminNotes?: string
): Promise<ActionResult> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "superadmin") {
      return {
        success: false,
        error: "Keine Berechtigung. Nur Superadmins können den Nachrichtenstatus ändern.",
      };
    }

    await db
      .update(contactMessages)
      .set({
        status,
        ...(adminNotes !== undefined ? { adminNotes } : {}),
        updatedAt: new Date(),
      })
      .where(eq(contactMessages.id, id));

    revalidatePath("/admin/messages");
    revalidatePath("/admin");

    return {
      success: true,
      message: "Nachrichtenstatus erfolgreich aktualisiert.",
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Fehler beim Aktualisieren des Status.";
    console.error("[UPDATE MESSAGE STATUS ERROR]", err);
    return {
      success: false,
      error: errorMsg,
    };
  }
}

export interface ContactReplyItem {
  id: string;
  messageId: string;
  senderName: string;
  senderEmail: string;
  replyText: string;
  createdAt: Date;
}

export async function replyToContactMessage(
  messageId: string,
  replyText: string
): Promise<ActionResult<{ reply: ContactReplyItem }>> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "superadmin") {
      return {
        success: false,
        error: "Keine Berechtigung. Nur Superadmins können auf Supportanfragen antworten.",
      };
    }

    const trimmedText = replyText.trim();
    if (!trimmedText) {
      return {
        success: false,
        error: "Bitte gib eine Antwortnachricht ein.",
      };
    }

    const [msg] = await db.select().from(contactMessages).where(eq(contactMessages.id, messageId));
    if (!msg) {
      return {
        success: false,
        error: "Nachricht nicht gefunden.",
      };
    }

    const replyId = `rpl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const adminName = currentUser.name || "GateMate Support";
    const adminEmail = currentUser.email || "support@gatemate.io";

    // Insert reply into history table
    await db.insert(contactMessageReplies).values({
      id: replyId,
      messageId,
      senderName: adminName,
      senderEmail: adminEmail,
      replyText: trimmedText,
    });

    // Update message status to "replied"
    await db
      .update(contactMessages)
      .set({
        status: "replied",
        updatedAt: new Date(),
      })
      .where(eq(contactMessages.id, messageId));

    // Send email to the requester via Resend
    await sendAdminSupportReplyEmail({
      recipientEmail: msg.email,
      recipientName: msg.name,
      originalSubject: msg.subject,
      originalMessage: msg.message,
      replyText: trimmedText,
      adminName,
    });

    revalidatePath("/admin/messages");
    revalidatePath("/admin");

    return {
      success: true,
      message: "Antwort wurde erfolgreich per E-Mail gesendet und in der Historie gespeichert.",
      data: {
        reply: {
          id: replyId,
          messageId,
          senderName: adminName,
          senderEmail: adminEmail,
          replyText: trimmedText,
          createdAt: new Date(),
        },
      },
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Fehler beim Senden der Antwort.";
    console.error("[REPLY TO CONTACT MESSAGE ERROR]", err);
    return {
      success: false,
      error: errorMsg,
    };
  }
}

export async function getContactMessageReplies(messageId: string): Promise<ContactReplyItem[]> {
  try {
    const rawReplies = await db
      .select()
      .from(contactMessageReplies)
      .where(eq(contactMessageReplies.messageId, messageId))
      .orderBy(asc(contactMessageReplies.createdAt));

    return rawReplies.map((r) => ({
      id: r.id,
      messageId: r.messageId,
      senderName: r.senderName,
      senderEmail: r.senderEmail,
      replyText: r.replyText,
      createdAt: r.createdAt,
    }));
  } catch (err) {
    console.error("[GET CONTACT MESSAGE REPLIES ERROR]", err);
    return [];
  }
}
