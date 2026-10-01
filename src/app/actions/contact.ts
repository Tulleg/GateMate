"use server";

import { db } from "@/db";
import { contactMessages } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { sendAdminNewMessageNotificationEmail, sendContactConfirmationEmail } from "@/lib/email";

export type ActionResponse = {
  success: boolean;
  message?: string;
  error?: string;
};

export async function submitContactForm(formData: FormData): Promise<ActionResponse> {
  try {
    const name = formData.get("name")?.toString().trim();
    const email = formData.get("email")?.toString().trim();
    const category = (formData.get("category")?.toString().trim() || "general") as
      | "general"
      | "organizer_support"
      | "buyer_support"
      | "billing"
      | "legal_dsa"
      | "other";
    const subject = formData.get("subject")?.toString().trim();
    const message = formData.get("message")?.toString().trim();

    if (!name || !email || !subject || !message) {
      return { success: false, error: "Bitte fülle alle Pflichtfelder aus." };
    }

    if (!email.includes("@") || !email.includes(".")) {
      return { success: false, error: "Bitte gib eine gültige E-Mail-Adresse ein." };
    }

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
    await sendAdminNewMessageNotificationEmail({
      id,
      type: "general",
      name,
      email,
      category,
      subject,
      message,
    }).catch(console.error);

    await sendContactConfirmationEmail({
      name,
      email,
      subject,
      type: "general",
    }).catch(console.error);

    return {
      success: true,
      message: "Vielen Dank! Deine Nachricht wurde erfolgreich übermittelt. Wir melden uns in Kürze.",
    };
  } catch (err: any) {
    console.error("[SUBMIT CONTACT FORM ERROR]", err);
    return {
      success: false,
      error: "Fehler beim Senden der Nachricht. Bitte versuche es später erneut.",
    };
  }
}

export async function submitDsaReportForm(formData: FormData): Promise<ActionResponse> {
  try {
    const name = formData.get("name")?.toString().trim();
    const email = formData.get("email")?.toString().trim();
    const targetUrl = formData.get("targetUrl")?.toString().trim();
    const violationType = formData.get("violationType")?.toString().trim() || "Sonstiger rechtswidriger Inhalt";
    const legalReason = formData.get("legalReason")?.toString().trim();
    const dsaDeclaration = formData.get("dsaDeclaration") === "on" || formData.get("dsaDeclaration") === "true";

    if (!name || !email || !targetUrl || !legalReason) {
      return { success: false, error: "Bitte fülle alle erforderlichen Pflichtfelder aus." };
    }

    if (!dsaDeclaration) {
      return { success: false, error: "Bitte bestätige die Erklärung in gutem Glauben gemäß Art. 16 DSA." };
    }

    const id = `dsa_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const subject = `DSA-Meldung: ${violationType} (${targetUrl})`;
    const message = `Gemeldete URL: ${targetUrl}\nVerstoßtyp: ${violationType}\nBegründung: ${legalReason}`;

    await db.insert(contactMessages).values({
      id,
      type: "dsa_notice",
      name,
      email,
      category: "legal_dsa",
      subject,
      message,
      targetUrl,
      violationType,
      legalReason,
      dsaDeclaration: true,
      status: "new",
    });

    // Send emails asynchronously
    await sendAdminNewMessageNotificationEmail({
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

    await sendContactConfirmationEmail({
      name,
      email,
      subject,
      type: "dsa_notice",
    }).catch(console.error);

    return {
      success: true,
      message: "Vielen Dank. Ihre Meldung gemäß Art. 16 DSA wurde erfolgreich eingereicht und wird umgehend geprüft.",
    };
  } catch (err: any) {
    console.error("[SUBMIT DSA REPORT ERROR]", err);
    return {
      success: false,
      error: "Fehler beim Einreichen der DSA-Meldung. Bitte versuchen Sie es erneut.",
    };
  }
}

export async function updateMessageStatus(
  id: string,
  status: "new" | "in_progress" | "replied" | "archived",
  adminNotes?: string
): Promise<ActionResponse> {
  try {
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

    return { success: true, message: "Nachrichtenstatus erfolgreich aktualisiert." };
  } catch (err: any) {
    console.error("[UPDATE MESSAGE STATUS ERROR]", err);
    return { success: false, error: "Fehler beim Aktualisieren des Status." };
  }
}
