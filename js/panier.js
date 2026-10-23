/* Panier global — dépend de donnees-produits.js (à charger avant). */
const CART_KEY = "delicias_cart_v1";
const MAX_QTY = 99;
let cart = { items: [], mode: "retrait", paymentMethod: "cash" };   // items : [{ id, qty }]
let cartOpener = null;
const deliveryLocation = { address: "", coordinates: null, distanceKm: null, status: "" };

/* ---------- Lien WhatsApp ---------- */
function whatsappLink(text) {
    const digits = SITE.phone.replace(/[+\s]/g, "");
    return "https://wa.me/" + digits + "?text=" + encodeURIComponent(text);
}

/* ---------- Stockage ---------- */
function loadCart() {
    try {
        const data = JSON.parse(localStorage.getItem(CART_KEY));
        if (data && Array.isArray(data.items)) {
            cart.items = data.items
                .map(i => ({ id: Number(i.id), qty: Math.floor(Number(i.qty)) }))
                .filter(i => {
                    const product = getProductById(i.id);
                    return product && product.price != null && !product.quoteOnly && i.qty >= 1;
                })
                .map(i => ({ id: i.id, qty: Math.min(i.qty, MAX_QTY) }));
            cart.mode = Object.hasOwn(SITE.deliveryFees, data.mode) ? data.mode : "retrait";
            cart.paymentMethod = ["cash", "tmoney", "flooz"].includes(data.paymentMethod)
                ? data.paymentMethod : "cash";
        }
    } catch (e) {
        cart = { items: [], mode: "retrait", paymentMethod: "cash" };
    }
}

function saveCart() {
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) { /* stockage indisponible */ }
}

/* ---------- Actions ---------- */
function findItem(id) { return cart.items.find(i => i.id === Number(id)); }

function addToCart(id, qty = 1) {
    const product = getProductById(id);
    qty = Math.floor(Number(qty));
    if (!product || product.price == null || product.quoteOnly || !(qty >= 1)) return;
    const item = findItem(product.id);
    if (item) item.qty = Math.min(item.qty + qty, MAX_QTY);
    else cart.items.push({ id: product.id, qty: Math.min(qty, MAX_QTY) });
    saveCart();
    renderCart();
    bumpBadge();
    if (typeof showToast === "function") showToast(product.name + " ajouté au panier");
}

function removeFromCart(id) {
    cart.items = cart.items.filter(i => i.id !== Number(id));
    saveCart();
    renderCart();
}

function clearCart() {
    cart = { items: [], mode: "retrait", paymentMethod: "cash" };
    deliveryLocation.address = "";
    deliveryLocation.coordinates = null;
    deliveryLocation.distanceKm = null;
    deliveryLocation.status = "";
    saveCart();
    renderCart();
}

function increaseQuantity(id) {
    const item = findItem(id);
    if (item && item.qty < MAX_QTY) { item.qty++; saveCart(); renderCart(); }
}

function decreaseQuantity(id) {
    const item = findItem(id);
    if (item && item.qty > 1) { item.qty--; saveCart(); renderCart(); }
}

/* ---------- Calculs ---------- */
function calculateSubtotal() {
    return cart.items.reduce((sum, i) => {
        const product = getProductById(i.id);
        return sum + getProductUnitPrice(product, i.qty) * i.qty;
    }, 0);
}

function calculateDelivery() {
    if (!cart.items.length || cart.mode === "retrait") return 0;
    if (deliveryLocation.distanceKm == null) return null;
    const { stepKm, feePerStep } = SITE.deliveryPricing;
    return Math.max(1, Math.ceil(deliveryLocation.distanceKm / stepKm)) * feePerStep;
}

function calculateTotal() {
    const delivery = calculateDelivery();
    return delivery == null ? null : calculateSubtotal() + delivery;
}

function getDistanceKm(from, to) {
    const radians = degrees => degrees * Math.PI / 180;
    const latitudeDelta = radians(to.latitude - from.latitude);
    const longitudeDelta = radians(to.longitude - from.longitude);
    const a = Math.sin(latitudeDelta / 2) ** 2 +
        Math.cos(radians(from.latitude)) * Math.cos(radians(to.latitude)) *
        Math.sin(longitudeDelta / 2) ** 2;
    return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function parseCoordinates(value) {
    const match = value.match(/!3d(-?\d{1,2}(?:\.\d+)?)!4d(-?\d{1,3}(?:\.\d+)?)/i) ||
        value.match(/(-?\d{1,2}(?:\.\d+)?)\s*[,;]\s*(-?\d{1,3}(?:\.\d+)?)/);
    if (!match) return null;
    const latitude = Number(match[1]);
    const longitude = Number(match[2]);
    if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null;
    return { latitude, longitude };
}

function updateDeliverySummary() {
    const fee = document.getElementById("delivery-fee");
    const total = document.getElementById("cart-total");
    const status = document.getElementById("delivery-status");
    if (!fee || !total || !status) return;

    const delivery = calculateDelivery();
    fee.textContent = delivery == null ? "À confirmer" : formatPrice(delivery);
    total.textContent = calculateTotal() == null ? "À confirmer" : formatPrice(calculateTotal());
    status.textContent = deliveryLocation.status;
}

function useCurrentLocation() {
    const status = document.getElementById("delivery-status");
    if (!window.isSecureContext) {
        deliveryLocation.status = "La localisation nécessite une connexion sécurisée (HTTPS). Ouvrez le site avec une adresse https:// puis réessayez.";
        updateDeliverySummary();
        return;
    }
    if (!navigator.geolocation) {
        deliveryLocation.status = "La géolocalisation n’est pas disponible dans ce navigateur. Saisissez une adresse ou un lien Maps.";
        updateDeliverySummary();
        return;
    }

    const address = document.getElementById("delivery-address");
    deliveryLocation.status = "Localisation en cours…";
    status.textContent = deliveryLocation.status;
    try {
        navigator.geolocation.getCurrentPosition(position => {
            deliveryLocation.coordinates = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
            };
            deliveryLocation.address = "";
            if (address) address.value = "";
            deliveryLocation.distanceKm = getDistanceKm(SITE.deliveryOrigin, deliveryLocation.coordinates);
            deliveryLocation.status = `Distance approximative à vol d’oiseau : ${deliveryLocation.distanceKm.toFixed(1)} km. Les frais peuvent varier selon le livreur.`;
            updateDeliverySummary();
            refocus("[data-delivery-gps]");
        }, error => {
            if (error.code === error.PERMISSION_DENIED) {
                deliveryLocation.status = "Accès à la localisation refusé. Autorisez la localisation dans les réglages du navigateur, puis réessayez ou saisissez une adresse.";
            } else if (error.code === error.POSITION_UNAVAILABLE) {
                deliveryLocation.status = "Position indisponible. Activez la localisation de votre appareil ou saisissez une adresse ou un lien Maps.";
            } else {
                deliveryLocation.status = "Délai de localisation dépassé. Réessayez ou saisissez une adresse ou un lien Maps.";
            }
            updateDeliverySummary();
            refocus("[data-delivery-gps]");
        }, { enableHighAccuracy: true, timeout: 30000, maximumAge: 0 });
    } catch (error) {
        deliveryLocation.status = error.name === "SecurityError"
            ? "Le navigateur bloque la localisation pour ce site. Ouvrez-le en HTTPS et vérifiez les autorisations du navigateur."
            : "Impossible d’ouvrir la localisation. Vérifiez les autorisations du navigateur ou saisissez une adresse.";
        updateDeliverySummary();
        refocus("[data-delivery-gps]");
    }
}

/* ---------- Affichage ---------- */
function updateCartCount() {
    const n = cart.items.reduce((sum, i) => sum + i.qty, 0);
    document.querySelectorAll("[data-cart-count]").forEach(el => { el.textContent = n; el.hidden = n === 0; });
}

function bumpBadge() {
    document.querySelectorAll("[data-cart-count]").forEach(el => {
        el.classList.remove("bump");
        void el.offsetWidth;
        el.classList.add("bump");
    });
}

function buildCartPanel() {
    document.body.insertAdjacentHTML("beforeend", `
        <div class="cart-overlay" data-cart-close></div>
        <aside class="cart-panel" id="cart-panel" role="dialog" aria-modal="true" aria-labelledby="cart-title" tabindex="-1">
            <header class="cart-head">
                <h2 id="cart-title">Votre panier</h2>
                <button class="cart-close" data-cart-close aria-label="Fermer le panier">✕</button>
            </header>
            <div class="cart-body" id="cart-items"></div>
            <footer class="cart-foot" id="cart-foot"></footer>
        </aside>`);
}

function renderCart() {
    const list = document.getElementById("cart-items");
    const foot = document.getElementById("cart-foot");
    updateCartCount();
    if (!list || !foot) return;

    if (!cart.items.length) {
        list.innerHTML = `<div class="cart-empty"><img class="cart-empty-image" src="https://res.cloudinary.com/dyo3r3lph/image/upload/v1792654843/panier_vide._ecq9es.jpg" alt="" width="320" height="320">
            <p>Votre panier est vide.</p>
            <a class="btn btn-primary" href="produits.html">Voir nos produits</a></div>`;
        foot.innerHTML = "";
        return;
    }

    list.innerHTML = cart.items.map(({ id, qty }) => {
        const p = getProductById(id);
        const unitPrice = getProductUnitPrice(p, qty);
        const bulkApplied = p.bulkEligible !== false && qty >= SITE.bulkPricing.minimumQuantity;
        const priceNote = bulkApplied
            ? `Tarif de gros (−${SITE.bulkPricing.discountPercent} %)`
            : p.bulkEligible !== false
                ? `Tarif unitaire · dès ${SITE.bulkPricing.minimumQuantity} : ${formatPrice(getProductUnitPrice(p, SITE.bulkPricing.minimumQuantity))}/u`
                : "Prix sur devis";
        return `<article class="cart-item">
            <div class="media" data-emoji="${CATEGORY_EMOJI[p.category] || "🍰"}">
                <img src="${p.image}" alt="${p.name}" width="72" height="72" loading="lazy"></div>
            <div>
                <h3>${p.name}</h3>
                <p class="muted">${priceNote}<br>${formatPrice(unitPrice)} l’unité</p>
                <div class="qty" role="group" aria-label="Quantité : ${p.name}">
                    <button data-cart-dec="${id}" aria-label="Diminuer la quantité" ${qty <= 1 ? "disabled" : ""}>−</button>
                    <output>${qty}</output>
                    <button data-cart-inc="${id}" aria-label="Augmenter la quantité" ${qty >= MAX_QTY ? "disabled" : ""}>+</button>
                </div>
            </div>
            <div class="cart-item-side">
                <strong>${formatPrice(unitPrice * qty)}</strong>
                <button class="link-danger" data-cart-remove="${id}" aria-label="Supprimer ${p.name} du panier">Supprimer</button>
            </div>
        </article>`;
    }).join("");

    foot.innerHTML = `
        <fieldset class="delivery"><legend>Mode de livraison</legend>
            ${Object.keys(SITE.deliveryFees).map(k => `
            <label><input type="radio" name="delivery" value="${k}" ${cart.mode === k ? "checked" : ""}>
                <span>${SITE.deliveryLabels[k]}</span><em>${k === "retrait" ? formatPrice(SITE.deliveryFees[k]) : "À calculer"}</em></label>`).join("")}
        </fieldset>
        <fieldset class="payment"><legend>Mode de paiement</legend>
            <label><input type="radio" name="payment" value="cash" ${cart.paymentMethod === "cash" ? "checked" : ""}>
                <span>Espèces au retrait / à la livraison</span></label>
            <label><input type="radio" name="payment" value="tmoney" ${cart.paymentMethod === "tmoney" ? "checked" : ""}>
                <span>TMoney</span></label>
            <label><input type="radio" name="payment" value="flooz" ${cart.paymentMethod === "flooz" ? "checked" : ""}>
                <span>Flooz</span></label>
        </fieldset>
        <p class="muted small payment-note">Le paiement sera confirmé avec la pâtisserie sur WhatsApp. Aucun paiement n’est effectué sur ce site.</p>
        <div class="delivery-location" ${cart.mode !== "livraison" ? "hidden" : ""}>
            <label for="delivery-address">Adresse, coordonnées ou lien Google Maps</label>
            <input id="delivery-address" type="text" maxlength="300" autocomplete="street-address"
                placeholder="Ex. 6.20, 1.19 ou lien de position Maps">
            <button class="btn btn-ghost btn-sm" type="button" data-delivery-gps>Utiliser ma position GPS</button>
            <p class="muted small" id="delivery-status" aria-live="polite"></p>
            <p class="muted small">Votre position sert à estimer les frais et sera ajoutée au message WhatsApp de commande.</p>
            <p class="muted small">Estimation calculée à vol d'oiseau : 0 à 5 km = 500 FCFA, puis +500 FCFA par tranche de 5 km. Pour calculer depuis une saisie, indiquez des coordonnées ou un lien Google Maps contenant les coordonnées. Une adresse seule ne permet pas le calcul automatique. Les frais peuvent varier selon le livreur.</p>
        </div>
        <dl class="totals">
            <div><dt>Sous-total</dt><dd>${formatPrice(calculateSubtotal())}</dd></div>
            <div><dt>Livraison</dt><dd id="delivery-fee">${calculateDelivery() == null ? "À confirmer" : formatPrice(calculateDelivery())}</dd></div>
            <div class="grand"><dt>Total</dt><dd id="cart-total">${calculateTotal() == null ? "À confirmer" : formatPrice(calculateTotal())}</dd></div>
        </dl>
        <button class="btn btn-whatsapp btn-block" data-cart-order>Commander sur WhatsApp</button>
        <p class="muted small">Votre commande n’est confirmée qu’après la réponse de la pâtisserie sur WhatsApp.</p>`;
    document.getElementById("delivery-address").value = deliveryLocation.address;
    updateDeliverySummary();
}

function openCart() {
    const panel = document.getElementById("cart-panel");
    if (!panel) return;
    panel.classList.add("open");
    document.querySelector(".cart-overlay").classList.add("open");
    document.body.classList.add("no-scroll");
    panel.querySelector(".cart-close").focus();
}

function closeCart() {
    const panel = document.getElementById("cart-panel");
    if (!panel || !panel.classList.contains("open")) return;
    panel.classList.remove("open");
    document.querySelector(".cart-overlay").classList.remove("open");
    document.body.classList.remove("no-scroll");
    if (cartOpener) cartOpener.focus();
}

/* ---------- Commande WhatsApp ---------- */
function buildWhatsAppMessage() {
    const lines = cart.items.map(({ id, qty }) => {
        const p = getProductById(id);
        const unitPrice = getProductUnitPrice(p, qty);
        const tier = p.bulkEligible !== false && qty >= SITE.bulkPricing.minimumQuantity
            ? ` (tarif de gros, −${SITE.bulkPricing.discountPercent} %)`
            : "";
        return qty + " × " + p.name + " à " + formatPrice(unitPrice) +
            " l’unité" + tier + " = " + formatPrice(unitPrice * qty);
    });
    const delivery = calculateDelivery();
    const deliveryDetails = cart.mode === "retrait"
        ? "Mode de livraison : " + SITE.deliveryLabels[cart.mode] + "."
        : [
            "Mode de livraison : " + SITE.deliveryLabels[cart.mode] + ".",
            deliveryLocation.address ? "Adresse de livraison : " + deliveryLocation.address : "",
            deliveryLocation.coordinates
                ? "Position de livraison : https://maps.google.com/?q=" +
                    deliveryLocation.coordinates.latitude + "," + deliveryLocation.coordinates.longitude
                : "",
            deliveryLocation.distanceKm != null
                ? "Distance estimée à vol d’oiseau : " + deliveryLocation.distanceKm.toFixed(1) + " km."
                : "",
            "Frais de livraison estimés : " + (delivery == null ? "à confirmer" : formatPrice(delivery)) +
                " (ils peuvent varier selon le livreur)."
        ].filter(Boolean).join("\n");
    return [
        "Bonjour " + SITE.brand + ",", "",
        "Je souhaite passer une commande.", "",
        ...lines, "",
        "Sous-total : " + formatPrice(calculateSubtotal()),
        "Livraison : " + (delivery == null ? "à confirmer" : formatPrice(delivery)),
        "Total : " + (calculateTotal() == null ? "à confirmer" : formatPrice(calculateTotal())), "",
        "Mode de paiement souhaité : " + {
            cash: "Espèces au retrait / à la livraison",
            tmoney: "TMoney",
            flooz: "Flooz"
        }[cart.paymentMethod] + ".",
        deliveryDetails, "",
        "Merci."
    ].join("\n");
}

function orderOnWhatsApp() {
    if (!cart.items.length) return;
    if (cart.mode === "livraison" && !deliveryLocation.address && !deliveryLocation.coordinates) {
        deliveryLocation.status = "Indiquez votre adresse, un lien Maps ou utilisez votre position GPS avant de commander.";
        updateDeliverySummary();
        document.getElementById("delivery-address").focus();
        return;
    }
    const orderWindow = window.open(whatsappLink(buildWhatsAppMessage()), "_blank");
    if (!orderWindow) {
        if (typeof showToast === "function") showToast("WhatsApp n’a pas pu s’ouvrir. Autorisez les fenêtres pop-up puis réessayez.");
        return;
    }
    orderWindow.opener = null;
    clearCart();
    if (typeof showToast === "function") showToast("WhatsApp est ouvert. Votre panier a été vidé.");
}

/* ---------- Événements (délégation : fonctionne aussi pour le contenu dynamique) ---------- */
function refocus(selector) {
    const el = document.querySelector(selector);
    if (el && !el.disabled) el.focus();
}

document.addEventListener("click", e => {
    const t = e.target;
    const add = t.closest("[data-add-to-cart]");
    const open = t.closest("[data-cart-open]");
    const inc = t.closest("[data-cart-inc]");
    const dec = t.closest("[data-cart-dec]");
    const rem = t.closest("[data-cart-remove]");
    const gps = t.closest("[data-delivery-gps]");

    if (gps) useCurrentLocation();
    else if (add) addToCart(add.dataset.addToCart, add.dataset.qty || 1);
    else if (open) { cartOpener = open; openCart(); }
    else if (t.closest("[data-cart-close]")) closeCart();
    else if (inc) { increaseQuantity(inc.dataset.cartInc); refocus(`[data-cart-inc="${inc.dataset.cartInc}"]`); }
    else if (dec) { decreaseQuantity(dec.dataset.cartDec); refocus(`[data-cart-dec="${dec.dataset.cartDec}"]`); }
    else if (rem) { removeFromCart(rem.dataset.cartRemove); refocus(".cart-close"); }
    else if (t.closest("[data-cart-order]")) orderOnWhatsApp();
});

document.addEventListener("change", e => {
    if (e.target.name === "delivery" && Object.hasOwn(SITE.deliveryFees, e.target.value)) {
        cart.mode = e.target.value;
        saveCart();
        renderCart();
        refocus(`input[name="delivery"][value="${cart.mode}"]`);
    }
    if (e.target.name === "payment" && ["cash", "tmoney", "flooz"].includes(e.target.value)) {
        cart.paymentMethod = e.target.value;
        saveCart();
    }
});

document.addEventListener("input", e => {
    if (e.target.id !== "delivery-address") return;
    deliveryLocation.address = e.target.value.trim();
    deliveryLocation.coordinates = parseCoordinates(deliveryLocation.address);
    if (deliveryLocation.coordinates) {
        deliveryLocation.distanceKm = getDistanceKm(SITE.deliveryOrigin, deliveryLocation.coordinates);
        deliveryLocation.status = `Distance approximative à vol d’oiseau : ${deliveryLocation.distanceKm.toFixed(1)} km. Les frais peuvent varier selon le livreur.`;
    } else {
        deliveryLocation.distanceKm = null;
        deliveryLocation.status = deliveryLocation.address
            ? "Adresse notée. Les frais exacts seront confirmés par la pâtisserie et le livreur."
            : "";
    }
    updateDeliverySummary();
});

document.addEventListener("keydown", e => {
    const panel = document.getElementById("cart-panel");
    if (!panel || !panel.classList.contains("open")) return;
    if (e.key === "Escape") closeCart();
    if (e.key === "Tab") {   // garde le focus dans le panneau
        const f = [...panel.querySelectorAll("button:not([disabled]), a[href], input")];
        if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    }
});

window.addEventListener("storage", e => {   // synchronise les onglets ouverts
    if (e.key === CART_KEY) { loadCart(); renderCart(); }
});

document.addEventListener("DOMContentLoaded", () => {
    loadCart();
    buildCartPanel();
    renderCart();
});
