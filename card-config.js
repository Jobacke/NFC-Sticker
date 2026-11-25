/**
 * Konfiguration deiner digitalen NFC-Visitenkarte.
 * Bearbeite einfach die Werte unten – Webseite, WhatsApp-Link und
 * die herunterladbare .vcf-Kontaktdatei aktualisieren sich automatisch.
 */
window.CARD_CONFIG = {
  version: "1.0.1",

  // Persönliche Angaben
  firstName: "Johannes",
  lastName: "Backhaus",
  monogram: "JB",
  role: "Rettungssanitäter",

  // Optional: Organisation / Zusatzzeile (leer lassen zum Ausblenden)
  subtitle: "",

  // Optional: Ort (z. B. "Berlin" – leer lassen, um den Ort auszublenden)
  location: "",

  // Optional: Dateiname oder URL eines Profilbilds (z. B. "./profil.jpg").
  // Leer lassen, um das edle Monogramm anzuzeigen.
  photoUrl: "",

  // 3 Telefonnummern (werden als anklickbare Einträge & in der vCard gespeichert)
  phones: [
    {
      label: "Mobil",
      display: "+49 170 0000001",
      number: "+491700000001",
      vcardType: "CELL,VOICE"
    },
    {
      label: "Dienstlich",
      display: "+49 171 0000002",
      number: "+491710000002",
      vcardType: "WORK,VOICE"
    },
    {
      label: "Privat / Zweitnummer",
      display: "+49 30 0000003",
      number: "+4930000003",
      vcardType: "HOME,VOICE"
    }
  ],

  // WhatsApp-Direktbutton (Nummer im internationalen Format ohne + und Leerzeichen)
  whatsapp: {
    enabled: true,
    label: "WhatsApp",
    number: "491700000001",
    prefillMessage: "Hallo Johannes, ich habe gerade deine digitale Visitenkarte gescannt!"
  },

  // 2 E-Mail-Adressen (werden als anklickbare Einträge & in der vCard gespeichert)
  emails: [
    {
      label: "Privat",
      address: "johannes@beispiel.de",
      vcardType: "HOME"
    },
    {
      label: "Dienstlich",
      address: "j.backhaus@rettungsdienst-beispiel.de",
      vcardType: "WORK"
    }
  ],

  // Notiz in der gespeicherten Kontaktkarte (.vcf)
  vcardNote: "Gespeichert über digitale NFC-Visitenkarte"
};
