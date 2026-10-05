"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import {
  onboardingStep1Schema,
  onboardingStep2Schema,
  onboardingStep3Schema,
  OnboardingStep1Input,
  OnboardingStep2Input,
  OnboardingStep3Input,
} from "@/lib/validation";
import { ActionResult, formatZodErrors } from "@/types";
import { getCurrentUser } from "@/lib/auth";
import { encryptText } from "@/lib/encryption";

export async function saveStep1StripeAction(input: unknown): Promise<ActionResult> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return {
        success: false,
        error: "Nicht authentifiziert. Bitte melde dich an.",
      };
    }

    const validated = onboardingStep1Schema.safeParse(input);
    if (!validated.success) {
      return {
        success: false,
        error: "Ungültige Stripe-Konfiguration.",
        fieldErrors: formatZodErrors(validated.error),
      };
    }

    const data: OnboardingStep1Input = validated.data;

    if (data.stripeAccountType === "standard" || data.stripeAccountType === "express") {
      await db
        .update(users)
        .set({
          stripeAccountType: data.stripeAccountType,
          stripeMode: "connect",
          onboardingStep: "legal_info",
          updatedAt: new Date(),
        })
        .where(eq(users.id, currentUser.id));
    } else {
      const encryptedSecretKey = encryptText(data.stripeSecretKey);
      await db
        .update(users)
        .set({
          stripeAccountType: "custom_keys",
          stripeMode: "direct_keys",
          stripePublishableKey: data.stripePublishableKey.trim(),
          stripeSecretKey: encryptedSecretKey,
          onboardingStep: "legal_info",
          updatedAt: new Date(),
        })
        .where(eq(users.id, currentUser.id));
    }

    revalidatePath("/onboarding");

    return {
      success: true,
      message: "Schritt 1 (Zahlungskonto) erfolgreich gespeichert.",
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Fehler beim Speichern von Schritt 1.";
    console.error("[ONBOARDING STEP 1 ERROR]", err);
    return {
      success: false,
      error: errorMsg,
    };
  }
}

export async function saveStep2LegalAction(input: unknown): Promise<ActionResult> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return {
        success: false,
        error: "Nicht authentifiziert. Bitte melde dich an.",
      };
    }

    const validated = onboardingStep2Schema.safeParse(input);
    if (!validated.success) {
      return {
        success: false,
        error: "Ungültige Stammdaten.",
        fieldErrors: formatZodErrors(validated.error),
      };
    }

    const data: OnboardingStep2Input = validated.data;

    await db
      .update(users)
      .set({
        legalCompanyName: data.legalCompanyName,
        legalVatId: data.legalVatId,
        legalName: data.legalCompanyName,
        street: data.street,
        zip: data.zip,
        city: data.city,
        country: data.country,
        onboardingStep: "agb_terms",
        updatedAt: new Date(),
      })
      .where(eq(users.id, currentUser.id));

    revalidatePath("/onboarding");

    return {
      success: true,
      message: "Schritt 2 (Veranstalterdaten) erfolgreich gespeichert.",
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Fehler beim Speichern von Schritt 2.";
    console.error("[ONBOARDING STEP 2 ERROR]", err);
    return {
      success: false,
      error: errorMsg,
    };
  }
}

export async function saveStep3TermsAction(input: unknown): Promise<ActionResult> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return {
        success: false,
        error: "Nicht authentifiziert. Bitte melde dich an.",
      };
    }

    const validated = onboardingStep3Schema.safeParse(input);
    if (!validated.success) {
      return {
        success: false,
        error: "Den Nutzungsbedingungen und Verträgen muss zugestimmt werden.",
        fieldErrors: formatZodErrors(validated.error),
      };
    }

    const now = new Date();

    await db
      .update(users)
      .set({
        onboardingCompleted: true,
        onboardingStep: "completed",
        termsAcceptedAt: now,
        privacyAcceptedAt: now,
        avvAcceptedAt: now,
        updatedAt: now,
      })
      .where(eq(users.id, currentUser.id));

    revalidatePath("/onboarding");
    revalidatePath("/organizer");

    return {
      success: true,
      message: "Onboarding erfolgreich abgeschlossen! Du kannst GateMate nun vollständig nutzen.",
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Fehler beim Abschließen des Onboardings.";
    console.error("[ONBOARDING STEP 3 ERROR]", err);
    return {
      success: false,
      error: errorMsg,
    };
  }
}
