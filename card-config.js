/**
 * Konfiguration deiner digitalen NFC-Visitenkarte.
 * Bearbeite einfach die Werte unten – Webseite, WhatsApp-Link und
 * die herunterladbare .vcf-Kontaktdatei aktualisieren sich automatisch.
 */
window.CARD_CONFIG = {
  version: "1.0.2",

  // Persönliche Angaben
  firstName: "Johannes",
  lastName: "Backhaus",
  monogram: "JB",
  role: "Rettungssanitäter",

  // Optional: Organisation / Zusatzzeile (leer lassen zum Ausblenden)
  subtitle: "",

  // Optional: Ort / Adresse (leer lassen, um den Ort auszublenden)
  location: "Wotanstrasse 5, 85579 Neubiberg",
  address: {
    street: "Wotanstrasse 5",
    postalCode: "85579",
    city: "Neubiberg",
    country: "Deutschland"
  },

  // Optional: Dateiname oder URL eines Profilbilds (z. B. "./profil.jpg").
  // Leer lassen, um das edle Monogramm anzuzeigen.
  photoUrl: "",

  // 3 Telefonnummern (werden als anklickbare Einträge & in der vCard gespeichert)
  phones: [
    {
      label: "Mobil privat",
      display: "+49 174 93 277 82",
      number: "+491749327782",
      vcardType: "CELL,VOICE"
    },
    {
      label: "Mobil JUH",
      display: "+49 173 94 75 393",
      number: "+491739475393",
      vcardType: "WORK,CELL,VOICE"
    },
    {
      label: "Telefon privat",
      display: "+49 89 21 899 874",
      number: "+498921899874",
      vcardType: "HOME,VOICE"
    }
  ],

  // WhatsApp-Direktbutton (Nummer im internationalen Format ohne + und Leerzeichen)
  whatsapp: {
    enabled: true,
    label: "WhatsApp",
    number: "491749327782",
    prefillMessage: "Hallo Johannes, ich habe gerade deine digitale Visitenkarte gescannt!"
  },

  // 2 E-Mail-Adressen (werden als anklickbare Einträge & in der vCard gespeichert)
  emails: [
    {
      label: "Privat",
      address: "johannes@vjbackhaus.com",
      vcardType: "HOME"
    },
    {
      label: "Dienstlich",
      address: "johannes.backhaus@johanniter.de",
      vcardType: "WORK"
    }
  ],

  // Notiz in der gespeicherten Kontaktkarte (.vcf)
  vcardNote: "Gespeichert über digitale NFC-Visitenkarte"
};
