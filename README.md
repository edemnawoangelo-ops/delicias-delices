# DÉLICIA’S DÉLICES — site vitrine

Site multipage de pâtisserie (Lomé, Togo) en HTML5, CSS3 et JavaScript vanilla. Aucun framework, aucun backend, aucun paquet à installer.

## Lancer le site (Live Server)
1. Ouvrir le dossier `delicias-delices` dans Visual Studio Code (Fichier > Ouvrir le dossier).
2. Installer l’extension **Live Server** (Ritwick Dey).
3. Clic droit sur `index.html` > **Open with Live Server**.

Les polices viennent de Google Fonts : sans connexion Internet, des polices de remplacement s’affichent.

## Structure
```text
delicias-delices/
├── index.html · produits.html · details-produit.html · services.html
├── a-propos.html · galerie.html · contact.html · mentions-legales.html
├── css/   style.css (commun) · accueil · produits · details-produit · services
│          a-propos · galerie · contact · panier · responsive
├── js/    donnees-produits.js (données) · panier.js · main.js · accueil · produits
│          details-produit · galerie · contact · services (vide, non chargé)
└── images/ logo · hero · produits · galerie · services · a-propos
```
Ordre de chargement des scripts : `donnees-produits.js`, `panier.js`, `main.js`, puis le script de la page.

## Images
- `images/produits/` : une photo par produit, au nom indiqué dans le champ `image` de `donnees-produits.js`. Sans photo, une pastille colorée avec un emoji s’affiche.
- `images/hero/` (accueil), `images/galerie/` (galerie et accueil), `images/a-propos/`, `images/logo/` (logo à fournir).
- Les photos actuelles sont des **recadrages du flyer, en basse résolution** : à remplacer par des photos HD en gardant les mêmes noms (format conseillé : 4:3, 800 px de large minimum, moins de 200 Ko).
- Galerie : copier une ligne `<a class="media gallery-item reveal" …>` dans `galerie.html`.

## Modifier les produits et les prix
Tout est dans `js/donnees-produits.js` :
- `PRODUCTS` : un objet par produit (`id` unique, `name`, `category`, `price` en FCFA, `image`, `description`, `popular`). Pour un produit sur devis, `price` peut être `null` avec `quoteOnly: true` : le prix est confirmé sur WhatsApp et le produit n’est pas ajouté au panier. Autres champs facultatifs : `details` (description complète) et `images` (liste de photos pour la page détails).
- `CATEGORIES` et `CATEGORY_EMOJI` : catégories du catalogue.
- Tarif de gros : `SITE.bulkPricing` définit la quantité minimale et la réduction appliquée à chaque produit éligible dès ce seuil. `bulkEligible: false` désactive ce tarif pour un produit ; les produits sur devis ne sont pas concernés.
- Les prix de démonstration actuels sont **à remplacer par les vrais prix**. Ils s’affichent partout via `formatPrice()`.
- Livraison : `SITE.deliveryOrigin` contient les coordonnées de la pâtisserie ; `SITE.deliveryPricing` définit le tarif indicatif par tranche de distance. Le GPS et les coordonnées d’un lien Maps sont calculés localement à vol d’oiseau. Une adresse écrite seule est transmise sur WhatsApp pour confirmation ; le livreur peut ajuster les frais.

## Modifier le numéro WhatsApp
- Commandes, contact et boutons WhatsApp : `SITE.phone` dans `js/donnees-produits.js`. Le lien retire automatiquement le `+` et les espaces (`+228 79 19 92 78` devient `22879199278`).
- Le numéro affiché et les liens `tel:` sont écrits dans le HTML (pied de page de chaque page, `contact.html`, `mentions-legales.html`) : utiliser Ctrl+Maj+F dans VS Code pour chercher `79 19 92 78` et `22879199278`.
- Facebook / Instagram : ajouter les liens à l’emplacement du commentaire dans le pied de page, uniquement avec les adresses officielles.

## À compléter avant la mise en ligne
Prix réels · photos HD · logo · adresse précise et horaires (page Contact) · informations légales (`mentions-legales.html`, repères jaunes « à compléter ») · liens Facebook / Instagram.

## Limites liées à l’absence de backend
- Aucune commande n’est enregistrée : le client envoie un message WhatsApp et la pâtisserie confirme manuellement.
- Pas de paiement en ligne : le client indique dans le panier s’il souhaite payer en espèces, par TMoney ou par Flooz ; le mode et le paiement sont confirmés avec la pâtisserie sur WhatsApp. Pas de gestion de stock ni de compte client.
- Le panier est conservé dans le navigateur (`localStorage`) : il est propre à chaque appareil et disparaît si les données du navigateur sont effacées.
- Le formulaire de contact n’envoie ni e-mail ni donnée à un serveur : il prépare un message que le client envoie lui-même depuis WhatsApp.
- Les prix du site sont visibles et modifiables côté navigateur : ils ne remplacent pas la confirmation de la pâtisserie.

## Vérifications conseillées
Ouvrir les outils de développement du navigateur (mode appareil) et contrôler les largeurs 320, 375, 390, 430, 768, 1024, 1280, 1440 et 1920 px, ainsi que la navigation au clavier.
