# AS Bon Sauveur — Correctif V31.4

## Problème corrigé

Le formulaire produit enregistrait uniquement une adresse texte. Un lien de partage Google Drive était ensuite utilisé directement comme source de l’image, alors qu’il pointe souvent vers une page Drive ou une ressource privée. La boutique affichait donc une image cassée.

## Nouvelle utilisation

1. Ouvrir **Administration → Boutique & produits**.
2. Ajouter ou modifier un produit.
3. Dans **Photo du produit**, toucher **Choisir un fichier**.
4. Sélectionner la photo dans Google Drive, l’app Fichiers ou la photothèque.
5. Vérifier l’aperçu puis enregistrer.

L’image est redimensionnée à 1 600 px maximum, convertie en WebP ou JPEG et limitée à 5 Mo avant son stockage. Elle est ensuite accessible publiquement dans la boutique, sans dépendre des permissions Google Drive.

## Sécurité

- bucket public limité aux images JPEG, PNG et WebP ;
- taille maximale stockée : 5 Mo ;
- écriture et suppression réservées aux comptes `teacher_as` et `admin` via les politiques RLS existantes ;
- aucun rôle privilégié ni clé secrète dans le navigateur.

## Déploiement

- appliquer `supabase/migration_v31_4_product_images.sql` ;
- publier les fichiers V31.4 sur GitHub Pages ;
- vérifier le dépôt d’une photo avec un compte autorisé ;
- contrôler l’affichage public du produit sur un second navigateur.
