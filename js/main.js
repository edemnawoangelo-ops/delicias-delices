/* Fonctions communes à toutes les pages — dépend de donnees-produits.js et panier.js. */

/* ---------- Notification ---------- */
function showToast(message) {
    const box = document.querySelector(".toast-box");
    if (!box) return;
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.setAttribute("role", "status");
    toast.textContent = message;
    box.appendChild(toast);
    setTimeout(() => {
        toast.classList.add("hide");
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}

/* ---------- Apparition au défilement (IntersectionObserver) ---------- */
let revealObserver = null;

function observeReveals(root = document) {
    const items = root.querySelectorAll(".reveal:not(.is-visible)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || !("IntersectionObserver" in window)) {
        items.forEach(el => el.classList.add("is-visible"));
        return;
    }
    revealObserver = revealObserver || new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("is-visible");
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12 });
    items.forEach(el => revealObserver.observe(el));
}

/* ---------- Carte produit (partagée : accueil, catalogue, produits similaires) ---------- */
function productCardHTML(p) {
    const emoji = CATEGORY_EMOJI[p.category] || "🍰";
    const price = p.quoteOnly
        ? "Prix à confirmer sur WhatsApp"
        : `1 à ${SITE.bulkPricing.minimumQuantity - 1} unités : ${formatPrice(p.price)} l’unité`;
    const bulkPrice = !p.quoteOnly && p.bulkEligible !== false
        ? `<p class="muted price-detail">Dès ${SITE.bulkPricing.minimumQuantity} unités : ${formatPrice(getProductUnitPrice(p, SITE.bulkPricing.minimumQuantity))} l’unité (−${SITE.bulkPricing.discountPercent} %)</p>`
        : "";
    const actions = p.quoteOnly
        ? `<a class="btn btn-primary btn-sm" href="${whatsappLink("Bonjour " + SITE.brand + ", j’aimerais obtenir un devis pour un " + p.name + ".")}" target="_blank" rel="noopener">Demander un devis</a>
                <a class="btn btn-ghost btn-sm" href="details-produit.html?id=${p.id}">Détails</a>`
        : `<button class="btn btn-primary btn-sm" data-add-to-cart="${p.id}">Ajouter au panier</button>
                <a class="btn btn-ghost btn-sm" href="details-produit.html?id=${p.id}">Détails</a>`;
    return `<article class="card product-card reveal">
        <a class="media" href="details-produit.html?id=${p.id}" data-emoji="${emoji}" aria-label="Voir le détail : ${p.name}">
            <img src="${p.image}" alt="${p.name}" width="480" height="360" loading="lazy">
            ${p.popular ? '<span class="badge">Populaire</span>' : ""}
        </a>
        <div class="card-body">
            <p class="card-cat">${p.category}</p>
            <h3>${p.name}</h3>
            <p class="card-text">${p.description}</p>
            <p class="price">${price}</p>
            ${bulkPrice}
            <div class="card-actions">
                ${actions}
            </div>
        </div>
    </article>`;
}

/* ---------- Image manquante : on garde le fond coloré + emoji ---------- */
document.addEventListener("error", e => {
    if (e.target.tagName === "IMG" && e.target.closest(".media")) e.target.closest(".media").classList.add("no-img");
}, true);

document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".media img").forEach(img => {
        if (img.complete && img.naturalWidth === 0) img.closest(".media").classList.add("no-img");
    });

    /* Éléments communs injectés une seule fois : progression, notifications, retour en haut */
    document.body.insertAdjacentHTML("beforeend",
        '<div class="scroll-progress" aria-hidden="true"></div>' +
        '<div class="toast-box" aria-live="polite"></div>' +
        '<button class="to-top" aria-label="Retour en haut de la page">↑</button>' +
        '<a class="whatsapp-float" href="' + whatsappLink("Bonjour " + SITE.brand + ",") +
        '" target="_blank" rel="noopener" aria-label="Contacter DÉLICIA’S DÉLICES sur WhatsApp" title="Écrire sur WhatsApp">' +
        '<svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">' +
        '<path d="M16 3a12.8 12.8 0 0 0-11 19.3L3.3 29l6.9-1.8A12.9 12.9 0 1 0 16 3zm0 23.4a10.5 10.5 0 0 1-5.3-1.4l-.4-.2-4.1 1.1 1.1-4-.3-.4A10.5 10.5 0 1 1 16 26.4zm5.8-7.9c-.3-.2-1.9-.9-2.2-1s-.5-.2-.7.2-.8 1-1 1.2-.4.2-.7.1a8.5 8.5 0 0 1-2.6-1.6 9.6 9.6 0 0 1-1.8-2.2c-.2-.3 0-.5.1-.6l.5-.6.3-.5c.1-.2 0-.4 0-.6s-.7-1.7-1-2.3-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4s-1.2 1.2-1.2 2.8 1.2 3.2 1.4 3.4 2.4 3.7 5.8 5.1c.8.3 1.4.5 1.9.6.8.3 1.5.2 2.1.1.7-.1 1.9-.8 2.2-1.5s.3-1.3.2-1.5-.3-.3-.6-.5z"/>' +
        '</svg></a>');

    /* Menu mobile */
    const toggle = document.querySelector(".nav-toggle");
    const menu = document.getElementById("nav-menu");
    const setMenu = open => {
        toggle.setAttribute("aria-expanded", String(open));
        toggle.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
        menu.classList.toggle("open", open);
        document.body.classList.toggle("no-scroll", open);
    };
    if (toggle && menu) {
        toggle.addEventListener("click", () => setMenu(toggle.getAttribute("aria-expanded") !== "true"));
        menu.addEventListener("click", e => { if (e.target.closest("a")) setMenu(false); });
        document.addEventListener("keydown", e => { if (e.key === "Escape") setMenu(false); });
        window.addEventListener("resize", () => { if (window.innerWidth > 900) setMenu(false); });
    }

    /* Barre de progression, navbar « verre », bouton retour en haut */
    const bar = document.querySelector(".scroll-progress");
    const header = document.querySelector(".site-header");
    const topBtn = document.querySelector(".to-top");
    let ticking = false;
    const onScroll = () => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        bar.style.transform = "scaleX(" + (max > 0 ? window.scrollY / max : 0) + ")";
        if (header) header.classList.toggle("scrolled", window.scrollY > 20);
        topBtn.classList.toggle("show", window.scrollY > 500);
        ticking = false;
    };
    window.addEventListener("scroll", () => {
        if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
    }, { passive: true });
    onScroll();
    topBtn.addEventListener("click", () => {
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
    });

    /* Liens WhatsApp : [data-whatsapp="message"] */
    document.querySelectorAll("[data-whatsapp]").forEach(a => {
        a.href = whatsappLink(a.dataset.whatsapp);
        a.target = "_blank";
        a.rel = "noopener";
    });

    observeReveals();
});
