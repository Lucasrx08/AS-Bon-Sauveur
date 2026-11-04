# Boutique V32 — panier et historique

Les familles saisissent leur identité une seule fois et peuvent commander plusieurs modèles, finitions, tailles et quantités. Le panier est enregistré par une seule insertion atomique, avec un identifiant conservé lors d’une reprise après erreur réseau.

- Espèces : « Espèces à transmettre à un enseignant d’EPS. »
- Chèque : « Chèque à l’ordre de l’AS du Bon Sauveur, à transmettre à un enseignant d’EPS. »
- Virement : après enregistrement confirmé, ouverture de la boutique HelloAsso fournie par Lucas. Un message demande de sélectionner à nouveau les mêmes articles ; le statut reste en attente jusqu’à vérification manuelle.

Chaque ligne conserve son nom de produit et son prix unitaire historiques. La modification du catalogue ou sa suppression ne modifie plus les montants ni les noms dans l’interface et les deux exports comptables. Un article déjà commandé est retiré de la vente dans l’interface de gestion. Une commande liée à un article supprimé peut encore être modifiée.

Catalogue préparé : sweats rose/bleu/gris, floqués 22 € et brodés 26 € ; t-shirt bleu ciel, floqué 10 € et brodé 12 €. Date limite : 1er décembre 2026 inclus. Visuels repris du lien HelloAsso transmis.

## Mise en ligne, après revue de l’aperçu

1. Appliquer la migration `shop_checkout_history` (ne modifie pas les politiques RLS). Elle complète les anciennes lignes quand le produit existe encore ; les noms déjà perdus ne peuvent pas être inventés.
2. Déployer `public-order` avec ses dépendances `_shared/http.ts`, en conservant son point d’accès public existant.
3. Importer `supabase/seeds/shop_2026.sql`, sans écraser les articles déjà présents.
4. Publier la version statique V32.

Validation : `npm test`, `npm run test:shop`, `npm run test:quota`, `npm run test:pdf`. Tests fictifs uniquement, aucun règlement ni commande de production.

L’aperçu HTML est autonome et simulé : son formulaire n’appelle pas Supabase et ne redirige pas automatiquement. Le bouton HelloAsso reste disponible pour vérifier la destination. L’export de démonstration est un CSV compatible Excel ; les exports de l’application conservent le format XLSX.

## Complément personnel et préparation fabricant
- Personnel AS/admin vérifié : panier avec Chèque, Espèces, Virement ; aucune redirection ni consigne destinée aux familles. Permet la saisie manuelle de commandes HelloAsso reçues directement.
- Gestion : filtres règlement/article et tri date/article/règlement, conservés pendant les changements de statut.
- Statuts : confirmation serveur, protection double clic, refresh sans navigation ni retour en haut.
- Excel : feuilles Par règlement, Par article, Quantités fabricant (modèle/finition/taille, quantités additionnées). Toutes les commandes figurent dans le classeur, avec filtres Excel.
- Tests complémentaires avec données fictives : parcours personnel sans lien HelloAsso, statut confirmé sans navigation, regroupement des quantités et tri des règlements.
