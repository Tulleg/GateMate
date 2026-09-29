# Staging Test-Katalog Pflege-Regel

Bei jeder relevanten Code-Änderung (neue Features, geänderte API-Routen, neue Formulare, geänderte Workflows, Zahlungslogik oder Check-in Funktionen) MUSS der Staging-Testkatalog unter `docs/STAGING_TEST_CATALOG.md` überprüft und entsprechend aktualisiert bzw. erweitert werden.

## Richtlinien:
1. Neue Endpunkte, Pages oder Modals erhalten eigene Test-IDs in der entsprechenden Kategorie (z.B. `SHOP-06`, `ORG-05`, `CHK-06`).
2. Wenn sich ein bestehender Ablauf ändert, müssen die Schritte im entsprechenden Testfall aktualisiert werden.
3. Änderungen am Dokument sollen zusammen mit den Code-Änderungen eingepflegt werden.
