# Digitale NFC-Visitenkarte (`v1.0.0`)

Edle, dunkle Web-Visitenkarte speziell für den Einsatz mit NFC-Stickern auf iPhone & Android.

## Features
- **Dunkel & edel** mit gebürstetem Champagnergold-Monogramm (`JB`)
- **Berufs-Badge** (*Rettungssanitäter*) & optionaler **Ort**
- **1-Klick Kontakt speichern (`.vcf`)** – öffnet direkt die iOS-/Android-Kontakte-Vorschau mit allen Nummern & E-Mail-Adressen
- **Direkter WhatsApp-Button**
- **3 Telefonnummern & 2 E-Mail-Adressen** mit Direktwahl und Ein-Klick-Kopieren
- **Offline-QR-Code & Teilen-Button** als Fallback, falls ein Gerät NFC deaktiviert hat
- **PWA- & Offline-fähig** mit Service Worker und sichtbarer Versionsnummer

## Eigene Daten eintragen
Alle persönlichen Angaben liegen gesammelt in [`card-config.js`](./card-config.js):
- `firstName`, `lastName`, `monogram`, `role`
- `location` (optional – leer lassen zum Ausblenden)
- `phones` (3 Telefonnummern)
- `whatsapp` (Nummer im Format `49170...` ohne `+`)
- `emails` (2 E-Mail-Adressen)

## GitHub Pages aktivieren
1. Repository auf GitHub unter `Jobacke/NFC-Sticker` anlegen (ohne README/Lizenz).
2. Lokal pushen: `git push -u origin main`
3. Auf GitHub unter **Settings → Pages → Build and deployment**: Source auf **Deploy from a branch**, Branch **`main`** (`/ (root)`) stellen.
4. Deine Visitenkarte ist dann erreichbar unter:  
   `https://jobacke.github.io/NFC-Sticker/`

## NFC-Sticker mit dem iPhone beschreiben
1. Kostenlose App **NFC Tools** aus dem App Store installieren.
2. **Schreiben → Datensatz hinzufügen → URL / URI**.
3. `https://jobacke.github.io/NFC-Sticker/` eintragen und bestätigen.
4. Auf **Schreiben** tippen und den NFC-Sticker oben an die Rückseite des iPhones halten.
5. Fertig – jedes iPhone und Android öffnet beim Dranhalten sofort deine Visitenkarte!
