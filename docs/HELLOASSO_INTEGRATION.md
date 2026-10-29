# Intégration HelloAsso — Association Sportive du Bon Sauveur

Cette branche contient une intégration à tester. Elle n'est pas encore activée sur le site public ou sur la base de production.

## Parcours attendu

1. Le formulaire public enregistre la commande et fige son montant en centimes sur Supabase.
2. La fonction serveur helloasso-checkout crée un paiement HelloAsso et redirige le parent vers son URL officielle.
3. Après paiement, helloasso-webhook reconsulte les APIs HelloAsso pour confirmer indépendamment l'identité du checkout, le paiement, le montant et son statut.
4. Le serveur seul marque la commande « Payée ». Le navigateur n'a aucune autorité de validation bancaire.
5. Les commandes par chèque et virement restent possibles ; le suivi de la distribution est inchangé.

## Activation — actions à terminer

- Vérifier le compte HelloAsso bénéficiaire : la fiche boutique affiche un lien sous association-sportive-les-chamois, différent du nom « AS du Bon Sauveur ». Ne pas reprendre ce slug sans confirmation.
- Activer les accès API Checkout dans le compte de la bonne association.
- Renseigner dans les secrets Supabase : HELLOASSO_ORG_SLUG, HELLOASSO_CLIENT_ID et HELLOASSO_CLIENT_SECRET. Ne jamais les publier sur GitHub ni dans le navigateur.
- Appliquer et vérifier le fichier SQL supabase/migration_v31_9_helloasso_checkout.sql sur le projet Supabase AS Bon Sauveur.
- Déployer les fonctions public-order, helloasso-checkout, helloasso-webhook (verify_jwt désactivé uniquement pour ces points publics ; validation côté serveur).
- Configurer dans HelloAsso les notifications vers https://qafwwsxmhiesbfaydcih.supabase.co/functions/v1/helloasso-webhook.
- Tester le parcours en **environnement HelloAsso Sandbox**, en adaptant d'abord les URLs d'API et le contrôle du domaine de redirection à cet environnement.

## Vérifications avant ouverture aux familles

- Montants côté serveur : 1 tee-shirt à 14 € et 2 à 28 €.
- Paiement non abouti = commande En attente ; paiement autorisé = commande Payée.
- Retour du navigateur seul ne modifie jamais le statut.
- Notifications forgées, mauvais montant, mauvais checkout, doublons et remboursements.
- Reprise d'une commande après interruption et expiration du lien de paiement (15 minutes).
- Compatibilité iPad/Mac, suivi administrateur, export Excel et purge RGPD du 1er juillet.
- Aucun secret HelloAsso ni donnée nominative dans les URL, sources publiques ou journaux.

IMPORTANT : Sans les secrets, le bon compte HelloAsso et les tests Sandbox, ne pas déployer cette fonctionnalité en production.
