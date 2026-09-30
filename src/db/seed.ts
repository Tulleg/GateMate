import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { users, events, ticketTiers, legalDocuments } from "./schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

async function seed() {
  if (process.env.ENABLE_DEMO_ACCOUNTS !== "true") {
    console.log("[SEED SKIPPED] Demo accounts disabled. Set ENABLE_DEMO_ACCOUNTS=true in environment to seed demo accounts and sample events.");
    process.exit(0);
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("[SEED ERROR] DATABASE_URL environment variable is missing.");
    process.exit(1);
  }

  console.log("Connecting to database for seeding...");


  
  const client = postgres(connectionString, { max: 1 });
  const db = drizzle(client);

  try {
    const adminEmail = "admin@gatemate.io";
    const existingAdmin = await db.select().from(users).where(eq(users.email, adminEmail));

    if (existingAdmin.length === 0) {
      const superadminId = "user_superadmin_01";
      await db.insert(users).values({
        id: superadminId,
        email: adminEmail,
        name: "GateMate SuperAdmin",
        passwordHash: hashPassword("SuperAdmin123!"),
        role: "superadmin",
        emailVerified: true,
      });

      console.log(`[SEED SUCCESS] Created Superadmin user: ${adminEmail}`);

      const organizerId = "user_organizer_01";
      const organizerEmail = "organizer@gatemate.io";
      await db.insert(users).values({
        id: organizerId,
        email: organizerEmail,
        name: "Demo Event Organizer",
        organizerSlug: "demo-organizer",
        bio: "Organizer of world-class tech summits, developer conferences, and music festivals.",
        passwordHash: hashPassword("Organizer123!"),
        role: "organizer",
        emailVerified: true,
        legalName: "Demo Events GmbH",
        street: "Friedrichstraße 100",
        zip: "10117",
        city: "Berlin",
        country: "Deutschland",
        vatId: "DE123456789",
        isSmallBusiness: false,
        legalMode: "custom_text",
        impressumContent: `# Impressum

**Angaben gemäß § 5 TMG**

Demo Events GmbH  
Friedrichstraße 100  
10117 Berlin  

**Vertreten durch:**  
Max Mustermann  

**Kontakt:**  
E-Mail: kontakt@demo-events.de  

**Umsatzsteuer-ID:**  
Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz: DE123456789  
`,
        privacyContent: `# Datenschutzerklärung

Wir nehmen den Schutz Ihrer persönlichen Daten sehr ernst. Nachfolgend informieren wir Sie über die Erhebung und Verarbeitung personenbezogener Daten bei der Nutzung unserer Dienste und des Ticketkaufs.

1. **Verantwortliche Stelle**: Demo Events GmbH, Friedrichstraße 100, 10117 Berlin.
2. **Erhebung personenbezogener Daten**: Zur Abwicklung von Ticketbestellungen erheben wir Namen, E-Mail-Adresse und Zahlungsdaten.
3. **Zweck der Datenverarbeitung**: Erfüllung des Kaufvertrags gemäß Art. 6 Abs. 1 lit. b DSGVO.
`,
        termsContent: `# Allgemeine Geschäftsbedingungen (AGB)

1. **Geltungsbereich**: Diese AGB gelten für alle Ticketkäufe über GateMate bei Demo Events GmbH.
2. **Vertragsschluss**: Der Vertrag kommt mit Abschluss des Bezahlvorgangs zustande.
3. **Widerrufsrecht**: Kein Widerrufsrecht gemäß § 312g Abs. 2 Nr. 9 BGB bei datierten Freizeitveranstaltungen.
`,
        revocationNoticeCustom: "Bei Dienstleistungen im Zusammenhang mit Freizeitbetätigungen zu einem spezifischen Termin besteht gemäß § 312g Abs. 2 Nr. 9 BGB kein Widerrufsrecht.",
      });

      console.log(`[SEED SUCCESS] Created Organizer user: ${organizerEmail} (/o/demo-organizer)`);

      const eventId = "evt_tech_conf_2026";
      await db.insert(events).values({
        id: eventId,
        organizerId: organizerId,
        title: "GateMate Tech Summit 2026",
        slug: "gatemate-tech-summit-2026",
        description: "The premier developer conference for modern fullstack ticketing systems.",
        venue: "Convention Center, San Francisco, CA",
        bannerUrl: "https://images.unsplash.com/photo-1540575467063-178a50c2df87",
        startDate: new Date("2026-11-15T09:00:00Z"),
        endDate: new Date("2026-11-15T18:00:00Z"),
        isPublished: true,
        isListedInDirectory: true,
      });

      await db.insert(ticketTiers).values([
        {
          id: "tier_vip_01",
          eventId: eventId,
          name: "VIP All Access Pass",
          priceCents: 19900,
          quantityAvailable: 50,
          quantitySold: 0,
        },
        {
          id: "tier_ga_01",
          eventId: eventId,
          name: "General Admission",
          priceCents: 4900,
          quantityAvailable: 300,
          quantitySold: 0,
        }
      ]);
      // Seed Platform Legal Documents
      const generateHash = (str: string) => crypto.createHash("sha256").update(str).digest("hex");

      const platformImpressumText = `# Plattform-Impressum GateMate

**Diensteanbieter gemäß § 5 DDG:**  
GateMate Ticketing Platforms GmbH  
Musterstraße 42  
10115 Berlin, Deutschland  

**Vertreten durch:**  
Geschäftsführung GateMate  

**Handelsregister:**  
Amtsgericht Berlin-Charlottenburg, HRB 123456 B  

**Umsatzsteuer-ID:**  
DE312345678  

**Kontakt:**  
E-Mail: support@gatemate.io  
`;

      const platformPrivacyText = `# Plattform-Datenschutzerklärung GateMate

GateMate verarbeitet personenbezogene Daten im Rahmen der Bereitstellung der Softwareplattform zur Ticketvermittlung und Veranstaltungsabwicklung.

1. **Geltungsbereich**: Diese Erklärung gilt für die Nutzung der Plattform GateMate.
2. **Datenverarbeitung**: Wir speichern Nutzerkonto-Daten, Zugriffslogs und Transaktionsdaten.
`;

      const platformTermsText = `# Plattform-Nutzungsbedingungen GateMate

1. **Vertragsgegenstand**: GateMate stellt Softwareinfrastruktur für Veranstalter und Ticketkäufer zur Verfügung.
2. **Vermittlerrolle**: Kaufverträge über Veranstaltungen kommen direkt zwischen dem Ticketkäufer und dem jeweiligen Veranstalter zustande.
`;

      await db.insert(legalDocuments).values([
        {
          id: "doc_plat_imp_01",
          organizerId: null,
          documentType: "platform_impressum",
          title: "Plattform-Impressum",
          content: platformImpressumText,
          version: 1,
          status: "published",
          hash: generateHash(platformImpressumText),
          publishedAt: new Date(),
        },
        {
          id: "doc_plat_priv_01",
          organizerId: null,
          documentType: "platform_privacy",
          title: "Plattform-Datenschutzerklärung",
          content: platformPrivacyText,
          version: 1,
          status: "published",
          hash: generateHash(platformPrivacyText),
          publishedAt: new Date(),
        },
        {
          id: "doc_plat_trm_01",
          organizerId: null,
          documentType: "platform_terms",
          title: "Plattform-Nutzungsbedingungen",
          content: platformTermsText,
          version: 1,
          status: "published",
          hash: generateHash(platformTermsText),
          publishedAt: new Date(),
        },
      ]);

      console.log(`[SEED SUCCESS] Created Platform Legal Documents.`);

      console.log(`[SEED SUCCESS] Created sample event and ticket tiers.`);
    }
  } catch (error) {
    console.error("[SEED ERROR] Failed to seed database:", error);
  } finally {
    await client.end();
  }
}

seed();
