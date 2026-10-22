/* Détails d'un produit : choisi par l'identifiant de l'URL (details-produit.html?id=3).
   Dépend de donnees-produits.js, panier.js et main.js (chargés avant). */
document.addEventListener("DOMContentLoaded", () => {
    const box = document.getElementById("product-detail");
    if (!box) return;

    const crumb = document.getElementById("crumb-name");
    const product = getProductById(new URLSearchParams(window.location.search).get("id"));

    if (!product) {   // identifiant absent ou invalide
        document.title = "Produit introuvable — " + SITE.brand;
        crumb.textContent = "Introuvable";
        box.innerHTML = `<div class="empty">
            <span aria-hidden="true">🍰</span>
            <h1>Produit introuvable</h1>
            <p>Ce produit n’existe pas ou n’est plus proposé. Retrouvez toutes nos gourmandises dans le catalogue.</p>
            <a class="btn btn-primary" href="produits.html">Voir tous les produits</a>
        </div>`;
        return;
    }

    const images = product.images && product.images.length ? product.images : [product.image];
    const emoji = CATEGORY_EMOJI[product.category] || "🍰";
    let qty = 1;
    document.title = product.name + " — " + SITE.brand;
    crumb.textContent = product.name;

    const thumbs = images.length > 1
        ? `<div class="thumbs" role="group" aria-label="Photos : ${product.name}">${images.map((src, i) =>
            `<button type="button" class="thumb" data-src="${src}" aria-label="Voir la photo ${i + 1}" aria-pressed="${i === 0}"><img src="${src}" alt="" width="96" height="72" loading="lazy"></button>`).join("")}</div>`
        : "";
    const purchaseControls = product.quoteOnly
        ? `<a class="btn btn-whatsapp btn-block" id="wa-btn" href="#" target="_blank" rel="noopener">Demander un devis sur WhatsApp</a>
            <p class="muted">Le prix sera confirmé selon le format et la personnalisation souhaités.</p>`
        : `<div class="buy">
                <div class="qty" role="group" aria-label="Quantité">
                    <button type="button" id="q-dec" aria-label="Diminuer la quantité" disabled>−</button>
                    <output id="q-val" aria-live="polite">1</output>
                    <button type="button" id="q-inc" aria-label="Augmenter la quantité">+</button>
                </div>
                <button type="button" class="btn btn-primary" id="add-btn" data-add-to-cart="${product.id}" data-qty="1">Ajouter au panier</button>
            </div>
            <a class="btn btn-whatsapp btn-block" id="wa-btn" href="#" target="_blank" rel="noopener">Commander sur WhatsApp</a>
            <p class="muted">Votre commande n’est confirmée qu’après la réponse de la pâtisserie sur WhatsApp.</p>`;

    box.innerHTML = `<article class="detail">
        <div class="detail-gallery">
            <figure class="media detail-main" data-emoji="${emoji}">
                <img id="main-img" src="${images[0]}" alt="${product.name}" width="640" height="480">
                ${product.popular ? '<span class="badge">Populaire</span>' : ""}
            </figure>
            ${thumbs}
        </div>
        <div class="detail-info">
            <a class="card-cat" href="produits.html?categorie=${encodeURIComponent(product.category)}">${product.category}</a>
            <h1>${product.name}</h1>
            <p class="price" id="detail-unit-price">${product.quoteOnly ? "Prix à confirmer sur WhatsApp" : formatPrice(getProductUnitPrice(product, qty)) + " l’unité"}</p>
            ${!product.quoteOnly && product.bulkEligible !== false
                ? `<p class="muted price-detail">1 à ${SITE.bulkPricing.minimumQuantity - 1} unités : ${formatPrice(product.price)} l’unité. Dès ${SITE.bulkPricing.minimumQuantity} unités : ${formatPrice(getProductUnitPrice(product, SITE.bulkPricing.minimumQuantity))} l’unité (−${SITE.bulkPricing.discountPercent} %).</p>`
                : ""}
            <p class="detail-desc">${product.details || product.description}</p>
            ${purchaseControls}
        </div>
    </article>`;

    const waBtn = document.getElementById("wa-btn");

    if (product.quoteOnly) {
        waBtn.href = whatsappLink([
            "Bonjour " + SITE.brand + ",", "",
            "J’aimerais obtenir un devis pour un " + product.name + ".",
            "Pouvez-vous m’indiquer le prix selon le format et la personnalisation souhaités ?",
            "Date souhaitée : à préciser.",
            "Merci."
        ].join("\n"));
    } else {
        const qVal = document.getElementById("q-val");
        const qDec = document.getElementById("q-dec");
        const qInc = document.getElementById("q-inc");
        const addBtn = document.getElementById("add-btn");
        const unitPrice = document.getElementById("detail-unit-price");

        function updateBuy() {
            qVal.textContent = qty;
            qDec.disabled = qty <= 1;
            qInc.disabled = qty >= MAX_QTY;
            addBtn.dataset.qty = qty;   // lu par panier.js au clic sur « Ajouter au panier »
            const currentUnitPrice = getProductUnitPrice(product, qty);
            unitPrice.textContent = formatPrice(currentUnitPrice) + " l’unité";
            waBtn.href = whatsappLink([
                "Bonjour " + SITE.brand + ",", "",
                "Je souhaite commander :",
                qty + " × " + product.name + " à " + formatPrice(currentUnitPrice) +
                    " l’unité = " + formatPrice(currentUnitPrice * qty), "",
                "Pouvez-vous me confirmer la disponibilité et les modalités de retrait ou de livraison ? Merci."
            ].join("\n"));
        }
        qDec.addEventListener("click", () => { qty = Math.max(1, qty - 1); updateBuy(); });
        qInc.addEventListener("click", () => { qty = Math.min(MAX_QTY, qty + 1); updateBuy(); });
        updateBuy();
    }

    /* Galerie : miniatures (uniquement si le produit possède plusieurs photos) */
    const mainImg = document.getElementById("main-img");
    box.querySelectorAll(".thumb").forEach(btn => btn.addEventListener("click", () => {
        mainImg.parentElement.classList.remove("no-img");
        mainImg.src = btn.dataset.src;
        box.querySelectorAll(".thumb").forEach(b => b.setAttribute("aria-pressed", String(b === btn)));
    }));

    /* Produits similaires : même catégorie d'abord, puis le reste du catalogue */
    const others = PRODUCTS.filter(p => p.id !== product.id);
    const similar = [...others.filter(p => p.category === product.category), ...others.filter(p => p.category !== product.category)].slice(0, 4);
    const similarBox = document.getElementById("similar");
    if (similar.length) {
        document.getElementById("similar-grid").innerHTML = similar.map(p => productCardHTML(p)).join("");
        similarBox.hidden = false;
        observeReveals(similarBox);
    }
});
