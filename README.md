# GateMate 🎟️⚡

[![Next.js](https://img.shields.io/badge/Next.js-15.1-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-0.38-C5F74F?style=for-the-badge&logo=drizzle)](https://orm.drizzle.team/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Stripe](https://img.shields.io/badge/Stripe-Connect-635BFF?style=for-the-badge&logo=stripe)](https://stripe.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker)](https://www.docker.com/)

**GateMate** ist eine moderne, skalierbare **Multi-Tenant Event-Ticketing & Einlass-Plattform**. Sie ermöglicht es Veranstaltern, Events zu erstellen, Tickets anzubieten und Zahlungen direkt via **Stripe Connect** zu empfangen. Für den Einlass vor Ort bietet GateMate eine echtzeitfähige PWA-Scanner-App zur Validierung kryptographisch signierter **QR-Tickets**.

---

## 🌟 Hauptfunktionen

- 🏢 **Multi-Tenant & Veranstalter-Hub:** Isolation von Veranstaltern, Events, Ticketkategorien und Team-Mitgliedern.
- 💳 **Stripe Connect Integration:** Direkte Ticket-Zahlungen an den Veranstalter mit konfigurierbarer Plattform-Gebühr (*Application Fee Cut*).
- 🔐 **Kryptographische QR-Tickets:** HMAC-SHA256 / JWT-signierte digitalisierte Tickets zur Verhinderung von Fälschungen und Mehrfach-Scans.
- 📱 **PWA Kamera QR-Scanner (`/check-in`):** Mobile-optimierte Einlass-Scanner-App für Smartphone-Kameras und Handhelds mit Sofort-Feedback & Offline-Sicherheit.
- 📧 **Automatischer E-Mail-Versand:** Sofortige Zustellung von Bestellbestätigungen & QR-Pässen via **Resend**.
- 🧩 **Einbettbare Ticket-Widgets (`/embed`):** Iframe- & Standalone-Checkout-Widgets zur direkten Integration auf externen Websites.
- 📊 **Veranstalter- & Admin-Dashboard:** Analysen zu Ticketverkäufen, Umsatzstatistiken, Buchungsverwaltung, Kundenanfragen und Exporte.
- 📜 **Rechtssicherheit & Consent:** DSGVO-konformer Cookie-Consent-Banner und rechtliche Dokumentenversionierung.

---

## 🛠️ Technologie-Stack

| Komponente | Technologie |
| :--- | :--- |
| **Framework** | Next.js 15 (App Router, Server Actions, React 19) |
| **Sprache** | TypeScript 5.7 |
| **Styling** | Tailwind CSS, Radix UI, Lucide Icons |
| **Datenbank** | PostgreSQL 16 |
| **ORM & Tools** | Drizzle ORM, Drizzle-Kit |
| **Authentifizierung** | Better-Auth / Lucia Drizzle Adapter |
| **Zahlungsabwicklung** | Stripe Checkout & Stripe Connect API |
| **QR-Signatur & Scan** | `jose` (JWT), `@zxing/library`, `html5-qrcode` |
| **E-Mail Service** | Resend API |
| **Containerisierung** | Docker & Docker Compose |

---

## 📁 Projektstruktur

```text
gatemate/
├── docs/                      # Projektdokumentation & Testkataloge
├── drizzle/                   # Datenbank-Migrationen & Drizzle-Schemas
├── public/                    # Statische Assets & Logos
├── src/
│   ├── app/                   # Next.js App Router (Pages, Layouts & API)
│   │   ├── (auth)/            # Login, Registrierung & Passwort-Resets
│   │   ├── (dashboard)/       # Dashboard Layout & Routen
│   │   ├── (public)/          # Landingpage, Event-Suche & Ticketshop
│   │   ├── check-in/          # Mobile QR-Code Einlass-Scanner
│   │   ├── embed/             # Einbettbares Ticket-Kauf-Widget
│   │   ├── onboarding/        # Multi-Step Veranstalter Onboarding
│   │   └── api/               # Stripe Webhooks & REST API Endpunkte
│   ├── components/            # UI-Komponenten (Public, Dashboard, QR-Scanner)
│   ├── db/                    # Drizzle DB-Client, Schemas & Seed-Skripte
│   │   ├── schema/            # Tabellendefinitionen (Users, Events, Tickets, etc.)
│   │   ├── seed.ts            # Demodaten-Generator für Dev/Staging
│   │   └── seed-admin.ts      # Superadmin-Initialisierungs-Skript
│   ├── lib/                   # Utility-Funktionen, Auth & QR-Token-Signatur
│   └── middleware.ts          # Next.js Middleware (Auth & Session Guarding)
├── .env.example               # Vorlage für Umgebungsvariablen
├── docker-compose.yml         # Container-Orchestrierung (App + Postgres)
├── Dockerfile                 # Multi-Stage Production Build
├── drizzle.config.ts          # Drizzle ORM Konfiguration
└── package.json               # Abhängigkeiten & NPM Scripts
```

---

## 🚀 Schnellstart & Lokale Entwicklung

### Voraussetzungen

Stelle sicher, dass folgende Software auf deinem System installiert ist:
- **Node.js** v20.x oder neuer
- **npm** oder **pnpm**
- **Docker & Docker Compose** (optional, aber empfohlen für Postgres)

### 1. Repository klonen & Abhängigkeiten installieren

```bash
git clone https://github.com/your-org/gatemate.git
cd gatemate
npm install
```

### 2. Umgebungsvariablen einrichten

Kopiere die `.env.example` Datei und passe deine Werte an:

```bash
cp .env.example .env
```

Wichtige Parameter in `.env`:
- `DATABASE_URL`: Verbindungs-String zu deiner PostgreSQL-Datenbank.
- `BETTER_AUTH_SECRET`: Mindestens 32 Zeichen langer Zufallsschlüssel.
- `STRIPE_SECRET_KEY` & `STRIPE_WEBHOOK_SECRET`: Stripe API-Keys.
- `QR_SIGNING_SECRET`: Mindestens 32 Zeichen für die kryptographische QR-Token-Signatur.
- `RESEND_API_KEY`: API-Schlüssel von Resend für den E-Mail-Versand.

### 3. Datenbank starten (Docker)

Starte die PostgreSQL 16 Datenbank via Docker Compose:

```bash
docker-compose up postgres -d
```

### 4. Datenbank-Schema pushen & Seeding

Wende das Datenbank-Schema an und befüllen die Datenbank mit initialen Testdaten:

```bash
# Schema in die Datenbank pushen
npm run db:push

# Optional: Demodaten (Events, Veranstalter & Tickets) einfügen
npm run db:seed

# Optional: Initialen Superadmin-Account anlegen
npm run db:seed-admin
```

### 5. Entwicklungsserver starten

```bash
npm run dev
```

Die Anwendung ist nun unter `http://localhost:3000` erreichbar.

---

## 📜 Verfügbare NPM Scripts

| Befehl | Beschreibung |
| :--- | :--- |
| `npm run dev` | Startet den Next.js Entwicklungsserver (Port 3000) |
| `npm run build` | Erstellt den optimierten Production-Build |
| `npm run start` | Startet den Production-Server |
| `npm run lint` | Führt ESLint-Analysen durch |
| `npm run db:push` | Überträgt Schema-Änderungen direkt in die Datenbank |
| `npm run db:generate` | Generiert Drizzle SQL-Migrationen |
| `npm run db:migrate` | Führt ausstehende Migrationen aus |
| `npm run db:studio` | Öffnet das visuelle Drizzle Studio zur Datenbanksicht |
| `npm run db:seed` | Führt das Demodaten-Seed-Skript aus |
| `npm run db:seed-admin` | Legt den konfigurierten Superadmin-User an |

---

## 🐳 Deployment mit Docker

Für ein schnelles Deployment der gesamten Anwendung inklusive PostgreSQL-Datenbank steht ein optimiertes `docker-compose.yml` bereit:

```bash
# Container bauen und im Hintergrund starten
docker-compose up -d --build
```

Die App verbindet sich automatisch mit dem Postgres-Service und ist auf dem in der `.env` definierten Port verfügbar.

---

## 🔒 Sicherheit & Datenschutz

- **Kryptographische QR-Tickets:** Verhindert Ticket-Duplikation durch signierte JWTs mit Zeitstempel und Einlassstatus.
- **Stripe Connect Auth:** Sichere Abwicklung aller Finanzdaten direkt über zertifizierte Stripe-Checkout-Flows.
- **Demo-Guard:** Testzugänge und Seeding-Funktionen werden in Produktionsumgebungen durch die Umgebungsvariable `ENABLE_DEMO_ACCOUNTS=false` deaktiviert.
- **Rechtliche Dokumenten-Historie:** Alle Versionsstände von AGBs, Datenschutzbestimmungen und Impressum werden nachvollziehbar in der Datenbank protokolliert.

---

## 📄 Lizenz

Dieses Projekt ist unter der **MIT Lizenz** veröffentlicht.
