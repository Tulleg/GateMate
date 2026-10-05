# GateMate – Staging User Testing & Regressionstest-Katalog

Dieses Dokument dient als systematischer Testkatalog für Usertests und Regressionsprüfungen auf der Staging-Umgebung von GateMate. Nach jedem Update/Deployment soll dieses Protokoll durchgegangen werden, um sicherzustellen, dass keine bestehenden Funktionen beeinträchtigt wurden (Regression) und neue Features einwandfrei funktionieren.

---

## 📋 Übersicht der Testbereiche

1. [Authentifizierung & Benutzerkonten](#1-authentifizierung--benutzerkonten)
2. [Multi-Step Veranstalter Onboarding](#2-multi-step-veranstalter-onboarding)
3. [Admin-Dashboard, Legal & Nachrichten Inbox](#3-admin-dashboard-legal--nachrichten-inbox)
4. [Veranstalter-Dashboard & Buchungsverwaltung](#4-veranstalter-dashboard--buchungsverwaltung)
5. [Ticket-Shop & Checkout (Stripe Staging Integration)](#5-ticket-shop--checkout-stripe-staging-integration)
6. [Einlass- & Check-in System (QR-Scanner)](#6-einlass--check-in-system-qr-scanner)
7. [E-Mails & Ticket-Generierung](#7-e-mails--ticket-generierung)
8. [Embedded Ticket Widget](#8-embedded-ticket-widget)
9. [Rechtliche Compliance & Layout/Responsive Testing](#9-rechtliche-compliance--layoutresponsive-testing)

---

## 🛠️ Testumgebung & Vorbedingungen

- **Staging-URL:** `https://staging.gatemate.de` (bzw. entsprechende Staging-Domain)
- **Stripe Testkreditkarten:**
  - Standard-Erfolg: `4242 4242 4242 4242` (Gültiges Datum z.B. `12/28`, CVC `123`)
  - Ablehnung/Fehler: `4000 0002 0127 3710` (Card Declined)
  - 3D-Secure Test: `4000 0000 0000 3020`
- **Test-Accounts:**
  - Admin-Account: `admin@staging.gatemate.de`
  - Veranstalter-Account: `organizer@staging.gatemate.de`
  - Kunden-Account / Gast-Kauf

---

## 1. Authentifizierung & Benutzerkonten

| Test-ID | Testfall | Schritte | Erwartetes Ergebnis | Status |
| :--- | :--- | :--- | :--- | :---: |
| **AUTH-01** | Registrierung Veranstalter (Deaktiviert) | 1. Navigiere zu `/login`<br>2. Prüfen, dass kein Registrierungs-Link vorhanden ist | Selbstregistrierung deaktiviert; es existiert kein Registrierungs-Link auf der Login-Seite | `[ ] Pass` |
| **AUTH-02** | Login mit gültigen Daten | 1. Navigiere zu `/login`<br>2. E-Mail & Passwort eingeben<br>3. Anmelden klicken | Erfolgreicher Login, Weiterleitung zum jeweiligen Dashboard (Organizer/Admin) | `[ ] Pass` |
| **AUTH-03** | Login mit ungültigen Daten | 1. Navigiere zu `/login`<br>2. Falsches Passwort eingeben | Fehlermeldung erscheint ("Ungültige Anmeldedaten"), kein Zugriff | `[ ] Pass` |
| **AUTH-04** | Passwort zurücksetzen | 1. Navigiere zu `/reset-password`<br>2. E-Mail eingeben & anfordern | Erfolgsmeldung für E-Mail-Versand erscheint | `[ ] Pass` |
| **AUTH-05** | Logout | 1. Im Dashboard auf "Abmelden" klicken | Session wird beendet, Weiterleitung zur Startseite/Login | `[ ] Pass` |
| **AUTH-06** | Organizer Hub Button Sichtbarkeit (Startseite) | 1. Startseite (`/`) ohne Login aufrufen<br>2. Prüfen, ob "Organizer Hub" ausgeblendet ist<br>3. Einloggen & erneut `/` aufrufen | Uneingeloggt: "Organizer Hub" Button ist verborgen (nur "Sign In").<br>Eingeloggt: "Organizer Hub" Button wird angezeigt. | `[ ] Pass` |

---

## 2. Multi-Step Veranstalter Onboarding

| Test-ID | Testfall | Schritte | Erwartetes Ergebnis | Status |
| :--- | :--- | :--- | :--- | :---: |
| **ONB-01** | Erzwungener Onboarding-Redirect | 1. Neuer Veranstalter-Account ruft `/organizer` auf | Automatische Umleitung zu `/onboarding` (Wizard) | `[ ] Pass` |
| **ONB-02** | Schritt 1: Stripe Connect Express | 1. Auf "Stripe verbinden" klicken<br>2. Stripe Express Ablauf durchgehen | Rückkehr zum Onboarding, Schritt 1 als abgeschlossen markiert | `[ ] Pass` |
| **ONB-03** | Schritt 2: DSA KYTC Stammdaten | 1. Rechtsform, Registergericht, Registriernummer & Telefon eingeben<br>2. Weiter klicken | Validierung erfolgreich, Daten gespeichert, Wechsel zu Schritt 3 | `[ ] Pass` |
| **ONB-04** | Schritt 3: AGB & AVV Zustimmung | 1. Rechtstexte & AVV prüfen<br>2. Checkboxen aktivieren & Zustimmen klicken | `onboardingCompleted` wird `true`, Weiterleitung zum Hauptdashboard | `[ ] Pass` |

---

## 3. Admin-Dashboard, Legal & Nachrichten Inbox

| Test-ID | Testfall | Schritte | Erwartetes Ergebnis | Status |
| :--- | :--- | :--- | :--- | :---: |
| **ADM-01** | Admin-Zugriffsbeschränkung | 1. Als normaler Veranstalter angemeldet versuchen `/admin` aufzurufen | Zugriff verweigert / Weiterleitung (403 oder Redirect zu Organizer) | `[ ] Pass` |
| **ADM-02** | Benutzerübersicht laden | 1. Als Admin einloggen<br>2. `/admin/users` aufrufen | Liste aller registrierten Benutzer wird vollständig & fehlerfrei geladen | `[ ] Pass` |
| **ADM-03** | Rechtstext-Verwaltung (`/admin/legal`) | 1. Zu `/admin/legal` navigieren<br>2. Neue Version der AGB/AVV veröffentlichen | Neue Version gespeichert, öffentlich unter `/agb` bzw. `/avv` sofort aktualisiert | `[ ] Pass` |
| **ADM-04** | Admin Nachrichten Posteingang (`/admin/messages`) | 1. Formular `/kontakt` oder `/notice-and-action` ausfüllen<br>2. Als Admin `/admin/messages` öffnen | Nachricht wird gelistet, Filter nach Typ/Status funktioniert, Statusänderung möglich | `[ ] Pass` |
| **ADM-05** | Dynamische Stripe-Plattformgebühr (`/admin`) | 1. Als Superadmin `/admin` aufrufen<br>2. In der Kachel "Plattform-Gebühr" auf "Bearbeiten" klicken<br>3. Neuen Prozentsatz eingeben (z. B. `6.5`%) & Speichern<br>4. Seite neu laden | Neuer Gebührensatz wird persistiert; Kachel "Plattform-Einnahmen" berechnet Betrag sofort mit dem neuen Satz | `[ ] Pass` |

---

## 4. Veranstalter-Dashboard & Buchungsverwaltung

| Test-ID | Testfall | Schritte | Erwartetes Ergebnis | Status |
| :--- | :--- | :--- | :--- | :---: |
| **ORG-01** | Dashboard Kennzahlen | 1. Als Veranstalter einloggen (`/organizer`) | Verkaufszahlen, Umsatz und Event-Übersicht laden ohne Fehler | `[ ] Pass` |
| **ORG-02** | Event erstellen | 1. Zu `/organizer/events/new` navigieren<br>2. Titel, Datum, Ort, Beschreibung eingeben<br>3. Ticketkategorien anlegen<br>4. Speichern | Event wird erfolgreich angelegt & in der Übersicht gelistet | `[ ] Pass` |
| **ORG-03** | Event bearbeiten & veröffentlichen | 1. Event in Liste auswählen<br>2. Details ändern & Status auf "Veröffentlicht" setzen<br>3. Speichern | Event-Status schaltet auf ÖFFENTLICH, Änderungen gespeichert | `[ ] Pass` |
| **ORG-04** | Buchungsübersicht & Finanzamt-Export | 1. Zu `/organizer/bookings` navigieren<br>2. Datum/Event filtern<br>3. Export-Modal öffnen & CSV/PDF herunterladen | Generierter Bericht enthält korrekte Aufschlüsselung von Umsatz, Gebühren & Netto | `[ ] Pass` |

---

## 5. Ticket-Shop & Checkout (Stripe Staging Integration)

| Test-ID | Testfall | Schritte | Erwartetes Ergebnis | Status |
| :--- | :--- | :--- | :--- | :---: |
| **SHOP-01** | Öffentliche Event-Seite laden | 1. URL `/e/[eventSlug]` im Inkognito-Fenster aufrufen | Event-Details, Datum, Ort, Veranstalter & Ticketkategorien werden angezeigt | `[ ] Pass` |
| **SHOP-02** | Ticket-Auswahl & Reservierung | 1. Ticket-Anzahl wählen (z.B. 2x Standard)<br>2. Auf "Tickets kaufen" klicken | Zusammenfassung stimmt überein, Ticketkontingent für 15 Minuten reserviert | `[ ] Pass` |
| **SHOP-03** | Erfolgreiche Test-Zahlung (Stripe) | 1. Käuferdaten ausfüllen (Name, E-Mail)<br>2. Zahlungsart Kreditkarte wählen<br>3. Karte `4242 4242 4242 4242` eingeben<br>4. Bezahlen | Weiterleitung zur Bestätigungsseite (`/tickets/[orderId]`), Bestellung als "Bezahlt" markiert | `[ ] Pass` |
| **SHOP-04** | Abgebrochene / Fehlgeschlagene Zahlung | 1. Zahlungsablauf starten<br>2. Testkarte für Ablehnung (`4000 0002 0127 3710`) eingeben | Fehlermeldung "Karte abgelehnt", keine Ticket-Erstellung, Rückkehr zum Formular | `[ ] Pass` |
| **SHOP-05** | Order Auto-Cleanup bei Expiration | 1. Checkout starten aber nicht bezahlen<br>2. 15 Minuten warten oder `/api/cron/cleanup-orders` triggern | Kontingent wird freigegeben, Order auf `cancelled` gesetzt | `[ ] Pass` |
| **SHOP-06** | Dynamische Plattformgebühr bei Stripe Checkout | 1. Im Admin Gebühr auf 10.0% konfigurieren<br>2. Ticket für 50,00 € kaufen<br>3. Stripe Payment Intent prüfen | `application_fee_amount` beträgt exakt 5,00 € (10%), Restbetrag fließt an Veranstalter-Connect-Konto | `[ ] Pass` |

---

## 6. Einlass- & Check-in System (QR-Scanner)

| Test-ID | Testfall | Schritte | Erwartetes Ergebnis | Status |
| :--- | :--- | :--- | :--- | :---: |
| **CHK-01** | Check-in Maske aufrufen | 1. Als Veranstalter zu `/check-in/[eventId]` navigieren | Check-in UI lädt, Kamera-Freigabe wird direkt via Html5Qrcode angefordert | `[ ] Pass` |
| **CHK-02** | Gültiges Ticket scannen / entwerten | 1. QR-Code eines bezahlten Tickets in Kamera halten | Meldung: "Gültig - Einlass gewährt", Ticket-Status wechselt auf `checked_in` | `[ ] Pass` |
| **CHK-03** | Bereits entwertetes Ticket erneut scannen | 1. Dasselbe Ticket nochmals scannen | Warnmeldung: "Bereits entwertet am [Zeitpunkt]", Einlass verweigert | `[ ] Pass` |
| **CHK-04** | Ungültigen QR-Code scannen | 1. Beliebigen ungültigen QR-Code scannen | Fehlermeldung: "Ungültiges Ticket", Einlass verweigert | `[ ] Pass` |

---

## 7. E-Mails & Ticket-Generierung (Resend Integration)

| Test-ID | Testfall | Schritte | Erwartetes Ergebnis | Status |
| :--- | :--- | :--- | :--- | :---: |
| **MAIL-01** | Resend Ticketbestätigungs-Mail | 1. Erfolgreichen Testkauf im Shop durchführen<br>2. Posteingang der angegebenen Käufer-E-Mail prüfen | HTML-E-Mail von Resend mit Event-Titel, Datum, Ort, Impressum des Veranstalters & Direktlink zu `/tickets/[orderId]` trifft ein | `[ ] Pass` |
| **MAIL-02** | Resend Passwort-Reset Mail | 1. Zu `/reset-password` navigieren<br>2. E-Mail eingeben & anfordern | Resend stellt E-Mail mit Reset-Link zu | `[ ] Pass` |
| **MAIL-03** | Widerrufsausschluss-Belehrung & Pflicht-Footer | 1. Ticketbestätigungs-Mail und Passwort-Reset-Mail öffnen | Ticket-Mail enthält Hinweis zu § 312g Abs. 2 Nr. 9 BGB; alle Mails enthalten Footer-Links zu Impressum, Datenschutz & AGB | `[ ] Pass` |

---

## 8. Embedded Ticket Widget

| Test-ID | Testfall | Schritte | Erwartetes Ergebnis | Status |
| :--- | :--- | :--- | :--- | :---: |
| **EMB-01** | Embedded Widget Rendering | 1. `/embed/[eventId]` in einem iFrame oder Browser aufrufen | Klares, schlankes Widget-Design ohne Header/Footer lädt reibungslos | `[ ] Pass` |
| **EMB-02** | Kaufabwicklung im Widget | 1. Ticket über das iFrame-Widget auswählen und Checkout durchführen | Kauf wird korrekt abgeschlossen und auf Bestätigung weitergeleitet | `[ ] Pass` |

---

## 9. Rechtliche Compliance & Layout/Responsive Testing

| Test-ID | Testfall | Schritte | Erwartetes Ergebnis | Status |
| :--- | :--- | :--- | :--- | :---: |
| **LEG-01** | Impressum, Datenschutz & AVV Links | 1. Footer aller Seiten prüfen | Impressum, Datenschutz, AGB & AVV sind voll erreichbar & aktuell | `[ ] Pass` |
| **LEG-02** | Mobile Viewport (Responsive) | 1. Entwicklertools auf Mobile (z.B. iPhone 14 / 360px-430px) stellen<br>2. Shop & Check-in testen | Keine horizontalen Scrollbalken, Buttons gut tippbar, Scanner nutzbar | `[ ] Pass` |
| **LEG-03** | Konsolenfehler / Network Errors | 1. Entwicklerkonsole öffnen und Hauptpfade durchklicken | Keine unerwarteten `Uncaught SyntaxError` oder `500 Internal Server Errors` | `[ ] Pass` |
| **LEG-04** | PWA Manifest & Favicons | 1. `/site.webmanifest` und `/favicon.ico` im Browser anfragen | Manifest liefert gültiges JSON mit App-Namen; Icons und Favicon werden korrekt ausgeliefert | `[ ] Pass` |

---

## 📝 Regressions-Protokoll Formular (Für Jedes Staging-Update)

**Release/Commit Version:** `____________________`  
**Getestet am:** `DD.MM.YYYY`  
**Tester:** `____________________`  

- [ ] Alle AUTH- & ONB-Tests bestanden
- [ ] Alle ADM-, LEG- & MSG-Tests bestanden
- [ ] Alle ORG- & BOOKINGS-Tests bestanden
- [ ] Alle SHOP- & Stripe-Tests bestanden
- [ ] Alle CHK-Check-in-Tests bestanden
- [ ] Alle MAIL- & EMB-Tests bestanden

**Gefundene Bugs / Anmerkungen:**
> *Hier gefundene Abweichungen oder Fehler eintragen...*
