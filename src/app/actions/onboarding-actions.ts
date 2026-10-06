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

import { stripe, hasPlatformStripeKey } from "@/lib/stripe";
import Stripe from "stripe";

export async function saveStep1StripeAction(input: unknown): Promise<ActionResult<{ url?: string }>> {
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

    const userRecords = await db.select().from(users).where(eq(users.id, currentUser.id));
    const userRecord = userRecords[0];

    if (!userRecord) {
      return {
        success: false,
        error: "Benutzerkonto nicht in der Datenbank gefunden.",
      };
    }

    if (data.stripeAccountType === "standard" || data.stripeAccountType === "express") {
      if (!hasPlatformStripeKey()) {
        return {
          success: false,
          error:
            "Stripe Connect ist auf der Server-Plattform nicht konfiguriert (STRIPE_SECRET_KEY fehlt in den Server-Umgebungsvariablen). Bitte wähle Option B ('Eigene Stripe API-Keys hinterlegen').",
        };
      }

      let stripeAccountId = userRecord.stripeAccountId || userRecord.stripeConnectedAccountId;
      const targetAccountType = data.stripeAccountType === "express" ? "express" : "standard";

      if (!stripeAccountId) {
        const account = await stripe.accounts.create({
          type: targetAccountType,
          email: userRecord.email,
          business_profile: {
            name: userRecord.legalCompanyName || userRecord.name || "GateMate Organizer",
          },
        });
        stripeAccountId = account.id;

        await db
          .update(users)
          .set({
            stripeAccountId: stripeAccountId,
            stripeConnectedAccountId: stripeAccountId,
            stripeAccountType: targetAccountType,
            stripeMode: "connect",
            onboardingStep: "legal_info",
            updatedAt: new Date(),
          })
          .where(eq(users.id, currentUser.id));
      } else {
        await db
          .update(users)
          .set({
            stripeAccountType: targetAccountType,
            stripeMode: "connect",
            onboardingStep: "legal_info",
            updatedAt: new Date(),
          })
          .where(eq(users.id, currentUser.id));
      }

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const accountLink = await stripe.accountLinks.create({
        account: stripeAccountId,
        refresh_url: `${appUrl}/onboarding?stripe_refresh=true`,
        return_url: `${appUrl}/onboarding?stripe_success=true`,
        type: "account_onboarding",
      });

      revalidatePath("/onboarding");

      return {
        success: true,
        data: { url: accountLink.url },
        message: "Stripe Connect Onboarding gestartet.",
      };
    } else {
      // Validate direct API keys against Stripe API live test call
      try {
        const testStripeClient = new Stripe(data.stripeSecretKey.trim(), {
          apiVersion: "2024-12-18.acacia" as any,
        });
        await testStripeClient.balance.retrieve();
      } catch (stripeErr: any) {
        console.error("Stripe key validation failed:", stripeErr);
        return {
          success: false,
          error: `Stripe API-Key Validierung fehlgeschlagen: ${
            stripeErr.message || "Der angegebene Secret Key ist ungültig oder wurde von Stripe abgelehnt."
          }`,
        };
      }

      const encryptedSecretKey = encryptText(data.stripeSecretKey.trim());
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

      revalidatePath("/onboarding");

      return {
        success: true,
        message: "Schritt 1 (Zahlungskonto) erfolgreich gespeichert.",
      };
    }
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
