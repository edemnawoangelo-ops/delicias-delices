/* Catalogue : recherche en temps réel, filtres par catégorie et tri (combinables).
   Dépend de donnees-produits.js, panier.js et main.js (chargés avant). */
document.addEventListener("DOMContentLoaded", () => {
    const grid = document.getElementById("product-grid");
    if (!grid) return;

    const searchInput = document.getElementById("search");
    const sortSelect = document.getElementById("sort");
    const filterBox = document.getElementById("filters");
    const count = document.getElementById("result-count");
    const empty = document.getElementById("empty");

    const state = { category: "Tous", query: "", sort: "default" };
    let firstRender = true;

    // Recherche sans tenir compte des accents ni des majuscules : « degue » trouve « Dègué ».
    const normalize = text => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

    function getVisibleProducts() {
        const q = normalize(state.query);
        const list = PRODUCTS.filter(p =>
            (state.category === "Tous" || p.category === state.category) &&
            (!q || normalize(p.name + " " + p.category + " " + p.description).includes(q)));
        if (state.sort === "price-asc") list.sort((a, b) => {
            if (a.price == null) return b.price == null ? 0 : 1;
            if (b.price == null) return -1;
            return a.price - b.price;
        });
        else if (state.sort === "price-desc") list.sort((a, b) => {
            if (a.price == null) return b.price == null ? 0 : 1;
            if (b.price == null) return -1;
            return b.price - a.price;
        });
        else if (state.sort === "name") list.sort((a, b) => a.name.localeCompare(b.name, "fr", { sensitivity: "base" }));
        return list;
    }

    function updateChips() {
        filterBox.querySelectorAll(".chip").forEach(chip =>
            chip.setAttribute("aria-pressed", String(chip.dataset.category === state.category)));
    }

    function render() {
        const list = getVisibleProducts();
        grid.innerHTML = list.map(p => productCardHTML(p)).join("");
        if (firstRender) {
            firstRender = false;
            observeReveals(grid);   // animation d'entrée au premier affichage seulement
        } else {
            grid.classList.add("instant");
            grid.querySelectorAll(".reveal").forEach(card => card.classList.add("is-visible"));
        }
        empty.hidden = list.length > 0;
        const plural = list.length > 1 ? "s" : "";
        count.textContent = list.length + " produit" + plural + " affiché" + plural;
    }

    /* Filtres : « Tous » + les catégories de donnees-produits.js */
    filterBox.innerHTML = ["Tous", ...CATEGORIES].map(c =>
        `<button type="button" class="chip" data-category="${c}" aria-pressed="false">${c}</button>`).join("");

    /* État initial, avec lien direct possible : produits.html?categorie=Donuts&q=choco */
    const params = new URLSearchParams(window.location.search);
    if (CATEGORIES.includes(params.get("categorie"))) state.category = params.get("categorie");
    state.query = (params.get("q") || "").slice(0, 80);
    searchInput.value = state.query;

    filterBox.addEventListener("click", e => {
        const chip = e.target.closest(".chip");
        if (!chip) return;
        state.category = chip.dataset.category;
        updateChips();
        render();
    });
    searchInput.addEventListener("input", () => { state.query = searchInput.value; render(); });
    searchInput.addEventListener("keydown", e => { if (e.key === "Enter") searchInput.blur(); });   // ferme le clavier mobile
    sortSelect.addEventListener("change", () => { state.sort = sortSelect.value; render(); });
    document.getElementById("reset").addEventListener("click", () => {
        state.category = "Tous";
        state.query = "";
        searchInput.value = "";
        updateChips();
        render();
        searchInput.focus();
    });

    updateChips();
    render();
});
