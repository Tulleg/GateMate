# GateMate – Staging User Testing & Regressionstest-Katalog

Dieses Dokument dient als systematischer Testkatalog für Usertests und Regressionsprüfungen auf der Staging-Umgebung von GateMate. Nach jedem Update/Deployment soll dieses Protokoll durchgegangen werden, um sicherzustellen, dass keine bestehenden Funktionen beeinträchtigt wurden (Regression) und neue Features einwandfrei funktionieren.

---

## 📋 Übersicht der Testbereiche

1. [Authentifizierung & Benutzerkonten](#1-authentifizierung--benutzerkonten)
2. [Admin-Dashboard & Systemverwaltung](#2-admin-dashboard--systemverwaltung)
3. [Veranstalter-Dashboard & Event-Management](#3-veranstalter-dashboard--event-management)
4. [Ticket-Shop & Checkout (Stripe Staging Integration)](#4-ticket-shop--checkout-stripe-staging-integration)
5. [Einlass- & Check-in System (QR-Scanner)](#5-einlass--check-in-system-qr-scanner)
6. [E-Mails & Ticket-Generierung](#6-e-mails--ticket-generierung)
7. [Embedded Ticket Widget](#7-embedded-ticket-widget)
8. [Rechtliche Compliance & Layout/Responsive Testing](#8-rechtliche-compliance--layoutresponsive-testing)

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

## 2. Admin-Dashboard & Systemverwaltung

| Test-ID | Testfall | Schritte | Erwartetes Ergebnis | Status |
| :--- | :--- | :--- | :--- | :---: |
| **ADM-01** | Admin-Zugriffsbeschränkung | 1. Als normaler Veranstalter angemeldet versuchen `/admin` aufzurufen | Zugriff verweigert / Weiterleitung (403 oder Redirect zu Organizer) | `[ ] Pass` |
| **ADM-02** | Benutzerübersicht laden | 1. Als Admin einloggen<br>2. `/admin/users` aufrufen | Liste aller registrierten Benutzer wird vollständig & fehlerfrei geladen | `[ ] Pass` |
| **ADM-03** | Benutzerstatus / Rolle verwalten | 1. Rolle eines Benutzers anpassen oder Passwort zurücksetzen | Änderung wird in der Datenbank übernommen & UI aktualisiert | `[ ] Pass` |

---

## 3. Veranstalter-Dashboard & Event-Management

| Test-ID | Testfall | Schritte | Erwartetes Ergebnis | Status |
| :--- | :--- | :--- | :--- | :---: |
| **ORG-01** | Dashboard Kennzahlen | 1. Als Veranstalter einloggen (`/organizer`) | Verkaufszahlen, Umsatz und Event-Übersicht laden ohne Fehler | `[ ] Pass` |
| **ORG-02** | Event erstellen | 1. Zu `/organizer/events/new` navigieren<br>2. Titel, Datum, Ort, Beschreibung eingeben<br>3. Ticketkategorien anlegen (z.B. Standard 15€, VIP 30€)<br>4. Speichern | Event wird erfolgreich angelegt & in der Übersicht gelistet | `[ ] Pass` |
| **ORG-03** | Event bearbeiten & veröffentlichen | 1. Event in Liste auswählen<br>2. Details ändern & Status auf "Veröffentlicht" setzen<br>3. Speichern | Event-Status schaltet auf ÖFFENTLICH, Änderungen gespeichert | `[ ] Pass` |
| **ORG-04** | Stripe Connect / Integration Prüfen | 1. Zu `/organizer/settings` navigieren<br>2. Stripe Staging Status prüfen | Stripe Account als verknüpft/bereit für Testzahlungen markiert | `[ ] Pass` |

---

## 4. Ticket-Shop & Checkout (Stripe Staging Integration)

| Test-ID | Testfall | Schritte | Erwartetes Ergebnis | Status |
| :--- | :--- | :--- | :--- | :---: |
| **SHOP-01** | Öffentliche Event-Seite laden | 1. URL `/e/[eventSlug]` im Inkognito-Fenster aufrufen | Event-Details, Datum, Ort, Veranstalter & Ticketkategorien werden angezeigt | `[ ] Pass` |
| **SHOP-02** | Ticket-Auswahl & Warenkorb | 1. Ticket-Anzahl wählen (z.B. 2x Standard)<br>2. Auf "Tickets kaufen" klicken | Zusammenfassung stimmt überein, Weiterleitung zum Checkout/Formular | `[ ] Pass` |
| **SHOP-03** | Erfolgreiche Test-Zahlung (Stripe) | 1. Käuferdaten ausfüllen (Name, E-Mail)<br>2. Zahlungsart Kreditkarte wählen<br>3. Karte `4242 4242 4242 4242` eingeben<br>4. Bezahlen | Weiterleitung zur Bestätigungsseite (`/tickets/[orderId]`), Bestellung als "Bezahlt" markiert | `[ ] Pass` |
| **SHOP-04** | Abgebrochene / Fehlgeschlagene Zahlung | 1. Zahlungsablauf starten<br>2. Testkarte für Ablehnung (`4000 0002 0127 3710`) eingeben | Fehlermeldung "Karte abgelehnt", keine Ticket-Erstellung, Rückkehr zum Formular | `[ ] Pass` |
| **SHOP-05** | Ausverkaufte Tickets / Limits | 1. Event mit Kontingent 1 anlegen<br>2. 1 Ticket kaufen<br>3. Seite erneut laden | Ticketkategorie zeigt "Ausverkauft" / Button deaktiviert | `[ ] Pass` |

---

## 5. Einlass- & Check-in System (QR-Scanner)

| Test-ID | Testfall | Schritte | Erwartetes Ergebnis | Status |
| :--- | :--- | :--- | :--- | :---: |
| **CHK-01** | Check-in Maske aufrufen | 1. Als Veranstalter zu `/check-in/[eventId]` navigieren | Check-in UI lädt, Kamera-Freigabe wird ggf. angefordert | `[ ] Pass` |
| **CHK-02** | Gültiges Ticket scannen / entwerten | 1. QR-Code eines bezahlten Tickets in Kamera halten (oder Ticket-ID manuell eingeben) | Meldung: "Gültig - Einlass gewährt", Ticket-Status wechselt auf `checked_in` | `[ ] Pass` |
| **CHK-03** | Bereits entwertetes Ticket erneut scannen | 1. Dasselbe Ticket nochmals scannen | Warnmeldung: "Bereits entwertet am [Zeitpunkt]", Einlass verweigert | `[ ] Pass` |
| **CHK-04** | Ungültigen QR-Code scannen | 1. Beliebigen ungültigen QR-Code scannen | Fehlermeldung: "Ungültiges Ticket", Einlass verweigert | `[ ] Pass` |
| **CHK-05** | Manuelle Suche nach Namen | 1. Nach Käufernamen im Suchfeld suchen<br>2. Auf "Manuell einchecken" klicken | Ticket wird in der Liste gefunden und erfolgreich entwertet | `[ ] Pass` |

---

## 6. E-Mails & Ticket-Generierung

| Test-ID | Testfall | Schritte | Erwartetes Ergebnis | Status |
| :--- | :--- | :--- | :--- | :---: |
| **MAIL-01** | Bestellbestätigungs-E-Mail | 1. Nach erfolgreichem Ticketkauf Posteingang prüfen (bzw. Mail-Catch/Logs) | E-Mail mit Bestellzusammenfassung & Ticket-Link ist angekommen | `[ ] Pass` |
| **MAIL-02** | PDF-Ticket Download | 1. Auf `/tickets/[orderId]` oder in der E-Mail auf "PDF herunterladen" klicken | PDF wird heruntergeladen, QR-Code & Event-Daten sind gut lesbar | `[ ] Pass` |

---

## 7. Embedded Ticket Widget

| Test-ID | Testfall | Schritte | Erwartetes Ergebnis | Status |
| :--- | :--- | :--- | :--- | :---: |
| **EMB-01** | Embedded Widget Rendering | 1. `/embed/[eventId]` in einem iFrame oder Browser aufrufen | Klares, schlankes Widget-Design ohne Header/Footer lädt reibungslos | `[ ] Pass` |
| **EMB-02** | Kaufabwicklung im Widget | 1. Ticket über das iFrame-Widget auswählen und Checkout durchführen | Kauf wird korrekt abgeschlossen und auf Bestätigung weitergeleitet | `[ ] Pass` |

---

## 8. Rechtliche Compliance & Layout/Responsive Testing

| Test-ID | Testfall | Schritte | Erwartetes Ergebnis | Status |
| :--- | :--- | :--- | :--- | :---: |
| **LEG-01** | Impressum & Datenschutz Links | 1. Footer aller public & dashboard Seiten prüfen | Impressum & Datenschutz sind von jeder Seite aus erreichbar & aktuell | `[ ] Pass` |
| **LEG-02** | Mobile Viewport (Responsive) | 1. Entwicklertools auf Mobile (z.B. iPhone 14 / Pixel) stellen<br>2. Shop & Check-in testen | Keine horizontalen Scrollbalken, Buttons gut tippbar, Scanner nutzbar | `[ ] Pass` |
| **LEG-03** | Konsolenfehler / Network Errors | 1. Entwicklerkonsole öffnen und Hauptpfade durchklicken | Keine unerwarteten `Uncaught SyntaxError` oder `500 Internal Server Errors` | `[ ] Pass` |

---

## 📝 Regressions-Protokoll Formular (Für Jedes Staging-Update)

**Release/Commit Version:** `____________________`  
**Getestet am:** `DD.MM.YYYY`  
**Tester:** `____________________`  

- [ ] Alle AUTH-Tests bestanden
- [ ] Alle ORG- & ADM-Tests bestanden
- [ ] Alle SHOP- & Stripe-Tests bestanden
- [ ] Alle CHK-Check-in-Tests bestanden
- [ ] Alle MAIL- & LEG-Tests bestanden

**Gefundene Bugs / Anmerkungen:**
> *Hier gefundene Abweichungen oder Fehler eintragen...*
