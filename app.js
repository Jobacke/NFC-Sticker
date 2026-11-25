(function () {
  "use strict";

  const cfg = window.CARD_CONFIG || {};

  const ICONS = {
    phone: `<svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92Z"/></svg>`,
    mail: `<svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2.5"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>`,
    copy: `<svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`,
    check: `<svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>`
  };

  let toastTimer = null;

  function showToast(message) {
    const toast = document.getElementById("toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove("visible");
    }, 2200);
  }

  async function copyToClipboard(text, successMsg, buttonEl) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const area = document.createElement("textarea");
        area.value = text;
        area.setAttribute("readonly", "");
        area.style.position = "fixed";
        area.style.opacity = "0";
        document.body.appendChild(area);
        area.select();
        document.execCommand("copy");
        area.remove();
      }
      if (buttonEl) {
        buttonEl.innerHTML = ICONS.check;
        buttonEl.classList.add("copied");
        setTimeout(() => {
          buttonEl.innerHTML = ICONS.copy;
          buttonEl.classList.remove("copied");
        }, 1600);
      }
      showToast(successMsg);
    } catch {
      showToast("Kopieren nicht möglich");
    }
  }

  function escapeVCard(value) {
    return String(value || "")
      .replace(/\\/g, "\\\\")
      .replace(/\n/g, "\\n")
      .replace(/;/g, "\\;")
      .replace(/,/g, "\\,");
  }

  function buildVCard() {
    const fullName = [cfg.firstName, cfg.lastName].filter(Boolean).join(" ");
    const lines = [
      "BEGIN:VCARD",
      "VERSION:3.0",
      `N;CHARSET=UTF-8:${escapeVCard(cfg.lastName)};${escapeVCard(cfg.firstName)};;;`,
      `FN;CHARSET=UTF-8:${escapeVCard(fullName)}`
    ];

    if (cfg.role) {
      lines.push(`TITLE;CHARSET=UTF-8:${escapeVCard(cfg.role)}`);
    }
    if (cfg.subtitle) {
      lines.push(`ORG;CHARSET=UTF-8:${escapeVCard(cfg.subtitle)}`);
    }

    (cfg.phones || []).forEach((phone) => {
      if (!phone || !phone.number) return;
      const type = phone.vcardType || "VOICE";
      lines.push(`TEL;TYPE=${type}:${phone.number.replace(/\s+/g, "")}`);
    });

    (cfg.emails || []).forEach((mail) => {
      if (!mail || !mail.address) return;
      const type = mail.vcardType || "INTERNET";
      lines.push(`EMAIL;TYPE=INTERNET,${type}:${mail.address.trim()}`);
    });

    if (cfg.location && cfg.location.trim()) {
      lines.push(`ADR;TYPE=HOME;CHARSET=UTF-8:;;${escapeVCard(cfg.location.trim())};;;;`);
    }

    if (window.location.href && window.location.protocol.startsWith("http")) {
      lines.push(`URL:${window.location.href}`);
    }

    if (cfg.vcardNote) {
      lines.push(`NOTE;CHARSET=UTF-8:${escapeVCard(cfg.vcardNote)}`);
    }

    lines.push("END:VCARD");
    return lines.join("\r\n") + "\r\n";
  }

  function downloadVCard() {
    const vcardContent = buildVCard();
    const safeName = [cfg.firstName, cfg.lastName]
      .filter(Boolean)
      .join("_")
      .replace(/[^a-zA-Z0-9_-]/g, "") || "Kontakt";

    const blob = new Blob([vcardContent], { type: "text/vcard;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${safeName}.vcf`;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();

    setTimeout(() => URL.revokeObjectURL(url), 4000);
    showToast("Kontaktkarte bereit zum Speichern");
  }

  function createContactRow({ href, icon, label, value, copyValue, copyLabel }) {
    const row = document.createElement("div");
    row.className = "contact-row";

    const link = document.createElement("a");
    link.className = "contact-link";
    link.href = href;

    const iconBox = document.createElement("span");
    iconBox.className = "contact-icon-box";
    iconBox.innerHTML = icon;

    const meta = document.createElement("span");
    meta.className = "contact-meta";

    const labelEl = document.createElement("span");
    labelEl.className = "contact-label";
    labelEl.textContent = label;

    const valueEl = document.createElement("span");
    valueEl.className = "contact-value";
    valueEl.textContent = value;

    meta.append(labelEl, valueEl);
    link.append(iconBox, meta);

    const copyBtn = document.createElement("button");
    copyBtn.type = "button";
    copyBtn.className = "copy-btn";
    copyBtn.setAttribute("aria-label", `${label} kopieren`);
    copyBtn.title = "Kopieren";
    copyBtn.innerHTML = ICONS.copy;
    copyBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      copyToClipboard(copyValue, copyLabel, copyBtn);
    });

    row.append(link, copyBtn);
    return row;
  }

  function renderCard() {
    const fullName = [cfg.firstName, cfg.lastName].filter(Boolean).join(" ") || "Visitenkarte";
    document.title = `${fullName} · Digitale Visitenkarte`;

    document.getElementById("fullName").textContent = fullName;
    document.getElementById("roleText").textContent = cfg.role || "";
    document.getElementById("monogramText").textContent = cfg.monogram || "JB";
    document.querySelector(".footer-brand").textContent = fullName;

    const versionStr = cfg.version ? `v${cfg.version}` : "v1.0.0";
    document.getElementById("versionBadge").textContent = versionStr;

    // Optionales Profilbild statt Monogramm
    const avatarImg = document.getElementById("avatarImg");
    const monogramText = document.getElementById("monogramText");
    if (cfg.photoUrl && cfg.photoUrl.trim()) {
      avatarImg.src = cfg.photoUrl.trim();
      avatarImg.alt = fullName;
      avatarImg.hidden = false;
      monogramText.hidden = true;
    }

    // Optionaler Untertitel
    const subtitleEl = document.getElementById("subtitleText");
    if (cfg.subtitle && cfg.subtitle.trim()) {
      subtitleEl.textContent = cfg.subtitle.trim();
      subtitleEl.hidden = false;
    }

    // Optionaler Ort
    const locationLine = document.getElementById("locationLine");
    const locationText = document.getElementById("locationText");
    if (cfg.location && cfg.location.trim()) {
      locationText.textContent = cfg.location.trim();
      locationLine.hidden = false;
    }

    // WhatsApp Button
    const whatsappBtn = document.getElementById("whatsappBtn");
    const primaryActions = document.querySelector(".primary-actions");
    if (cfg.whatsapp && cfg.whatsapp.enabled && cfg.whatsapp.number) {
      const digits = cfg.whatsapp.number.replace(/\D/g, "");
      const textParam = cfg.whatsapp.prefillMessage
        ? `?text=${encodeURIComponent(cfg.whatsapp.prefillMessage)}`
        : "";
      whatsappBtn.href = `https://wa.me/${digits}${textParam}`;
      document.getElementById("whatsappLabel").textContent = cfg.whatsapp.label || "WhatsApp";
    } else {
      whatsappBtn.hidden = true;
      primaryActions.classList.add("single");
    }

    // Telefonnummern rendern
    const phones = (cfg.phones || []).filter((p) => p && p.number);
    const phonesSection = document.getElementById("phonesSection");
    const phonesList = document.getElementById("phonesList");
    const phonesCount = document.getElementById("phonesCount");
    phonesList.innerHTML = "";
    if (phones.length === 0) {
      phonesSection.hidden = true;
    } else {
      phonesCount.textContent = phones.length === 1 ? "1 Nummer" : `${phones.length} Nummern`;
      phones.forEach((phone) => {
        const cleanNum = phone.number.replace(/\s+/g, "");
        phonesList.appendChild(
          createContactRow({
            href: `tel:${cleanNum}`,
            icon: ICONS.phone,
            label: phone.label || "Telefon",
            value: phone.display || phone.number,
            copyValue: phone.display || phone.number,
            copyLabel: `${phone.label || "Nummer"} kopiert`
          })
        );
      });
    }

    // E-Mail-Adressen rendern
    const emails = (cfg.emails || []).filter((m) => m && m.address);
    const emailsSection = document.getElementById("emailsSection");
    const emailsList = document.getElementById("emailsList");
    const emailsCount = document.getElementById("emailsCount");
    emailsList.innerHTML = "";
    if (emails.length === 0) {
      emailsSection.hidden = true;
    } else {
      emailsCount.textContent = emails.length === 1 ? "1 Adresse" : `${emails.length} Adressen`;
      emails.forEach((mail) => {
        emailsList.appendChild(
          createContactRow({
            href: `mailto:${mail.address.trim()}`,
            icon: ICONS.mail,
            label: mail.label || "E-Mail",
            value: mail.address.trim(),
            copyValue: mail.address.trim(),
            copyLabel: `${mail.label || "E-Mail"} kopiert`
          })
        );
      });
    }
  }

  function setupInteractions() {
    // Kontakt speichern (.vcf)
    document.getElementById("saveContactBtn").addEventListener("click", downloadVCard);

    // Native Share / Link kopieren
    document.getElementById("shareBtn").addEventListener("click", async () => {
      const fullName = [cfg.firstName, cfg.lastName].filter(Boolean).join(" ");
      const shareData = {
        title: `${fullName} – ${cfg.role || "Visitenkarte"}`,
        text: `Digitale Visitenkarte von ${fullName}`,
        url: window.location.href
      };

      if (navigator.share) {
        try {
          await navigator.share(shareData);
          return;
        } catch (err) {
          if (err && err.name === "AbortError") return;
        }
      }
      copyToClipboard(window.location.href, "Visitenkarten-Link kopiert");
    });

    // QR-Code Modal
    const qrModal = document.getElementById("qrModal");
    const qrContainer = document.getElementById("qrCodeContainer");
    const qrUrlText = document.getElementById("qrUrlText");

    function openQrModal() {
      const currentUrl = window.location.href;
      const svg = window.MiniQR ? window.MiniQR.toSVG(currentUrl, "#0c0f18") : null;
      if (svg) {
        qrContainer.innerHTML = svg;
      } else {
        qrContainer.textContent = "QR-Code konnte nicht erzeugt werden.";
      }
      qrUrlText.textContent = currentUrl;
      qrModal.hidden = false;
    }

    function closeQrModal() {
      qrModal.hidden = true;
    }

    document.getElementById("qrBtn").addEventListener("click", openQrModal);
    document.getElementById("closeQrBtn").addEventListener("click", closeQrModal);
    qrModal.addEventListener("click", (e) => {
      if (e.target === qrModal) closeQrModal();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !qrModal.hidden) closeQrModal();
    });

    document.getElementById("copyUrlBtn").addEventListener("click", () => {
      copyToClipboard(window.location.href, "Link kopiert");
    });
  }

  function registerServiceWorker() {
    if ("serviceWorker" in navigator && window.location.protocol.startsWith("http")) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("./sw.js").catch(() => {
          // Service Worker optional bei lokalem Dateizugriff
        });
      });
    }
  }

  renderCard();
  setupInteractions();
  registerServiceWorker();
})();
