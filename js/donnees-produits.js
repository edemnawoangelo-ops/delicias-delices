/* =====================================================================
   DONNÉES UNIQUES DU SITE — seul fichier à modifier pour les produits,
   les prix, les frais de livraison et le numéro WhatsApp.
   ⚠ Les prix ci-dessous sont des PRIX DE DÉMONSTRATION : à remplacer
   par les vrais prix de la pâtisserie.
   ===================================================================== */
const SITE = {
    brand: "DÉLICIA’S DÉLICES",
    phone: "+228 79 19 92 78",                       // numéro WhatsApp / téléphone
    deliveryFees: { retrait: 0, livraison: null },
    deliveryOrigin: { latitude: 6.200505, longitude: 1.192377 },
    deliveryPricing: { stepKm: 5, feePerStep: 500 },
    bulkPricing: { minimumQuantity: 5, discountPercent: 10 },
    deliveryLabels: { retrait: "Retrait sur place", livraison: "Livraison selon la distance" }
};

const CATEGORIES = ["Gâteaux", "Donuts", "Glaces", "Yaourts", "Dègué", "Pastels", "Samoussas",
    "Croissants", "Amuse-bouche", "Coffrets cadeaux", "Madeleines"];

// Emoji affiché tant qu'une photo de produit n'existe pas encore.
const CATEGORY_EMOJI = {
    "Gâteaux": "🎂", "Donuts": "🍩", "Glaces": "🍨", "Yaourts": "🥛", "Dègué": "🥣", "Pastels": "🥟",
    "Samoussas": "🥟", "Croissants": "🥐", "Amuse-bouche": "🍢", "Coffrets cadeaux": "🎁", "Madeleines": "🧁"
};

// Champs facultatifs par produit : details, images, quoteOnly et bulkEligible (tarif de gros).
const PRODUCTS = [
    { id: 1, name: "Donut sucré", category: "Donuts", price: 1500, image: "images/produits/donut-sucre.jpg", description: "Un donut moelleux, enrobé de sucre.", popular: true },
    { id: 2, name: "Gâteau roulé", category: "Gâteaux", price: 5000, image: "images/produits/gateau-roule.jpg", description: "Un biscuit moelleux roulé et garni de crème.", popular: true },
    { id: 3, name: "Yaourt maison", category: "Yaourts", price: 1000, image: "images/produits/yaourt-maison.jpg", description: "Un yaourt onctueux, préparé maison.", popular: true },
    { id: 4, name: "Samoussas", category: "Samoussas", price: 2000, image: "images/produits/samoussas.jpg", description: "Des samoussas croustillants, dorés à point.", popular: true },
    { id: 5, name: "Dègué", category: "Dègué", price: 1500, image: "images/produits/Dègué.jpg", description: "Le dessert frais et crémeux, préparé maison.", popular: false },
    { id: 6, name: "Pastels", category: "Pastels", price: 1500, image: "images/produits/pastel.jpg", description: "Des pastels dorés, croustillants à souhait.", popular: false },
    { id: 7, name: "Croissant", category: "Croissants", price: 1500, image: "images/produits/croissants.jpg", description: "Un croissant tendre et doré.", popular: false },
    { id: 8, name: "Madeleines", category: "Madeleines", price: 2000, image: "images/produits/madeleines.jpg", description: "De petites madeleines moelleuses et dorées.", popular: false },
    { id: 9, name: "Glace", category: "Glaces", price: 1000, image: "images/produits/Glace.jpg", description: "Une glace fraîche pour se faire plaisir.", popular: false },
    { id: 10, name: "Assortiment d'amuse-bouche", category: "Amuse-bouche", price: 3000, image: "images/produits/Amuse-bouche.jpg", description: "Des bouchées salées à partager.", popular: false },
    { id: 11, name: "Coffret cadeau", category: "Coffrets cadeaux", price: null, image: "images/produits/coffret-cadeau.jpg", description: "Une sélection de douceurs joliment emballée.", popular: false, quoteOnly: true, bulkEligible: false },
    { id: 12, name: "Gâteau d'anniversaire", category: "Gâteaux", price: null, image: "images/produits/gateau-anniv.jpg", description: "Un gâteau personnalisé pour célébrer vos moments spéciaux.", popular: false, quoteOnly: true, bulkEligible: false }
];

function formatPrice(amount) {
    return Number(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, "\u00A0") + "\u00A0FCFA";
}

function getProductById(id) {
    return PRODUCTS.find(p => p.id === Number(id));
}

function getProductUnitPrice(product, quantity = 1) {
    if (!product || product.price == null) return null;
    if (product.bulkEligible === false || quantity < SITE.bulkPricing.minimumQuantity) return product.price;
    return Math.round(product.price * (100 - SITE.bulkPricing.discountPercent) / 100);
}
