/* Accueil : affiche les 4 produits populaires depuis PRODUCTS (donnees-produits.js). */
document.addEventListener("DOMContentLoaded", () => {
    const box = document.getElementById("featured-products");
    if (!box) return;
    const featured = PRODUCTS.filter(p => p.popular).slice(0, 4);
    box.innerHTML = featured.map(p => productCardHTML(p)).join("");
    observeReveals(box);
});
