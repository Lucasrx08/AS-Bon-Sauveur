# V31.7 — Correctifs de l’audit du 5 octobre 2026

## Parcours publics

- exports Programme et TV limités au pôle actuellement consulté, y compris pour les événements multi-spécialités ;
- recherche du calendrier réparée avec un masquage CSS explicite des résultats non correspondants ;
- horaires `00:00 → 00:00` remplacés par « Horaire à confirmer » dans l’interface et les exports ;
- produits inactifs ou arrivés à échéance retirés de la boutique, avec une seconde vérification avant l’ouverture du formulaire ;
- calcul de l’échéance des commandes harmonisé sur le fuseau `Europe/Paris` côté navigateur et fonction Edge ;
- bouton RGPD rendu fiable après chaque rendu de page ;
- actions « Consulter » et « Télécharger » des documents désormais distinctes.

## Synchronisation et sécurité

- détection des convocations sur toutes les spécialités d’un événement, dans l’interface et dans `public-registration` ;
- intégrité SRI ajoutée aux bibliothèques externes Supabase, jsPDF, SheetJS et ExcelJS ;
- V31.7.0–31.7.2 ont réactivé la demande de double authentification pour les comptes ayant un ancien facteur vérifié ; cette régression d’accès est corrigée en V31.7.3 ;
- politique de provenance du référent renforcée dans la page.

## PWA et qualité

- coque applicative, ressources locales, fonds PDF, polices et dépendances épinglées précachés par version ;
- navigation hors connexion servie depuis la coque V31.7 avant la page de secours ;
- ancien test V31.5 rendu indépendant du numéro de version ;
- nouveau test V31.7 couvrant les corrections fonctionnelles et de sécurité.

## V31.7.3 — correction de la connexion administrateur

- retour au contrat de connexion V31.6 : e-mail et mot de passe pour l’administration, nom et PIN existant pour l’équipe sportive ;
- aucune demande automatique de code TOTP et retrait du bouton d’activation ajouté par V31.7 ; le module MFA n’est plus chargé ni précaché ;
- distinction explicite entre PIN d’équipe et accès administrateur dans la fenêtre de connexion ;
- aucun facteur Supabase supprimé ou réinitialisé, aucune modification des comptes, des PIN, des rôles ni des politiques RLS ;
- précache et ressources versionnés en V31.7.3 pour remplacer la version concernée ;
- tests isolés de connexion sans MFA, de refus d’un profil inaccessible et de garde MFA lors d’une activation explicite future ; aucune connexion de production utilisée pour ces tests.

## Actions de production associées

- redéployer `public-order` et `public-registration` pour appliquer les contrôles serveur ;
- la protection Supabase contre les mots de passe compromis reste dépendante du niveau d’abonnement du projet ;
- les en-têtes HTTP CSP, `X-Content-Type-Options` et `Permissions-Policy` restent limités par GitHub Pages.
