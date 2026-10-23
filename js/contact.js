/* Contact : validation, puis aperçu du message avant l'ouverture de WhatsApp.
   Le site n'a pas de serveur : rien n'est envoyé ni enregistré automatiquement.
   Dépend de donnees-produits.js et panier.js (whatsappLink). */
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("contact-form");
    if (!form) return;
    const preview = document.getElementById("preview");
    const previewText = document.getElementById("preview-text");
    const status = document.getElementById("form-status");
    const fields = ["name", "phone", "email", "subject", "message"];
    const el = id => document.getElementById("c-" + id);

    const rules = {
        name: v => !v ? "Veuillez indiquer votre nom." : v.length < 2 ? "Votre nom doit contenir au moins 2 caractères." : "",
        phone: v => {
            if (!v) return "Veuillez indiquer votre numéro de téléphone.";
            const digits = v.replace(/[\s.()-]/g, "");
            return /^[+\d\s().-]+$/.test(v) && /^\+?\d{8,15}$/.test(digits)
                ? "" : "Numéro invalide : entrez 8 à 15 chiffres, par exemple +228 90 00 00 00.";
        },
        email: v => !v || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? "" : "Adresse e-mail invalide, par exemple nom@exemple.com.",
        subject: v => v ? "" : "Veuillez choisir un sujet.",
        message: v => !v ? "Veuillez écrire votre message." : v.length < 10 ? "Votre message doit contenir au moins 10 caractères." : ""
    };

    function validate(id) {
        const input = el(id);
        const message = rules[id](input.value.trim());
        document.getElementById("c-" + id + "-err").textContent = message;
        input.setAttribute("aria-invalid", String(Boolean(message)));
        return !message;
    }

    function buildMessage() {
        const v = id => el(id).value.trim();
        const subject = el("subject").options[el("subject").selectedIndex].text;
        return ["Bonjour " + SITE.brand + ",", "",
        "Sujet : " + subject,
        "Nom : " + v("name"),
        "Téléphone : " + v("phone"),
        ...(v("email") ? ["E-mail : " + v("email")] : []), "",
            "Message :", v("message"), "",
            "Merci."].join("\n");
    }

    fields.forEach(id => {
        el(id).addEventListener("blur", () => { if (el(id).value.trim()) validate(id); });
        el(id).addEventListener("input", () => { if (el(id).getAttribute("aria-invalid") === "true") validate(id); });
    });

    form.addEventListener("submit", e => {
        e.preventDefault();
        const results = fields.map(validate);   // tous les champs sont vérifiés
        const firstInvalid = fields.find((id, i) => !results[i]);
        if (firstInvalid) {
            status.textContent = "Certains champs sont à corriger avant de continuer.";
            el(firstInvalid).focus();
            return;
        }
        status.textContent = "";
        previewText.textContent = buildMessage();
        form.hidden = true;
        preview.hidden = false;
        preview.focus();
    });

    document.getElementById("edit-msg").addEventListener("click", () => {
        preview.hidden = true;
        form.hidden = false;
        el("name").focus();
    });
    document.getElementById("confirm-send").addEventListener("click", () => {
        window.open(whatsappLink(previewText.textContent), "_blank", "noopener");
    });
});
