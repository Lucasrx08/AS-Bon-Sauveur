# Association Sportive du Bon Sauveur — V21.12

PWA mobile-first pour l’Association Sportive du Bon Sauveur, la section football, l’option escalade et le sport-études gymnastique.

## V21.12 — exports PDF professionnels

- sélection visuelle des rendez-vous du programme ;
- composition automatique depuis les données de l’application ;
- fonds officiels, polices embarquées et texte vectoriel net à l’impression ;
- confidentialité de la liste nominative conservée selon le profil connecté.

## V20 — socle de l’application

- conserver l’interface V19 validée ;
- supprimer le faux changement de rôle côté navigateur ;
- activer une authentification réelle Supabase ;
- synchroniser les données entre appareils ;
- protéger les données élèves avec RLS ;
- permettre l’invitation et la réinitialisation des accès depuis l’administration ;
- fiabiliser la PWA et les mises à jour ;
- améliorer SEO, partage, accessibilité et performances ;
- améliorer les exports PDF des convocations et calendriers.

## Sécurité

Les rôles sont définis dans `profiles` et vérifiés côté serveur par les politiques RLS. Modifier `localStorage` ou le HTML ne donne donc pas accès aux données protégées.

Les données élèves, licences, appréciations, bilans et listes nominatives de convocations ne sont jamais lisibles anonymement.

Les éducateurs ne peuvent accéder qu’aux élèves et appréciations correspondant à leur spécialité.

## Activation Supabase

1. Créer ou ouvrir le projet Supabase.
2. Exécuter le schéma initial si nécessaire : `supabase/schema.sql`.
3. Exécuter les migrations existantes dans l’ordre.
4. Exécuter `supabase/migration_v20.sql`.
5. Déployer la fonction Edge `supabase/functions/admin-users`.
6. Renseigner dans `config.js` :

```js
window.APP_CONFIG = {
  appName: "Association Sportive du Bon Sauveur",
  supabaseUrl: "https://VOTRE-PROJET.supabase.co",
  supabaseAnonKey: "VOTRE_CLE_ANON",
  demoMode: false,
  productionMode: true,
  enableExternalGrammar: false
};
```

La clé `anon` est une clé publique prévue pour le navigateur. La confidentialité repose sur les politiques RLS et non sur le masquage de cette clé.

## Comptes utilisateurs

Une fois connecté avec un compte `admin`, l’espace Administration affiche **Utilisateurs & accès**. Il permet :

- d’inviter un éducateur ou enseignant par e-mail ;
- de choisir son rôle ;
- de visualiser les comptes existants ;
- d’envoyer un e-mail de réinitialisation de mot de passe.

## PWA

Le service worker V20 ne met plus en cache les anciennes versions V3 à V18. Seul le shell réellement utilisé est préchargé. Les bibliothèques lourdes Excel et PDF sont chargées à la demande.

## Correction grammaticale

L’envoi des appréciations vers LanguageTool est désactivé par défaut avec `enableExternalGrammar: false`. Cela évite de transmettre automatiquement des textes pédagogiques à un service tiers. La validation locale reste disponible.

## Exports

- fonds PNG officiels utilisés sans modification ;
- textes vectoriels avec les polices Anton et BroshK embarquées dans le PDF ;
- sélection guidée de 1 à 3 rendez-vous pour le programme ;
- une catégorie unique par convocation ;
- convocations A4 paysage et programmes A4 portrait ;
- convocations multi-pages conservées pour les listes importantes et données nominatives réservées aux espaces sécurisés.

## Principaux fichiers V20

- `index.html` : point d’entrée production ;
- `v19-app.js` : interface principale conservée ;
- `v20.css` : accessibilité et finitions ;
- `v20-preflight.js` : verrouillage des rôles avant démarrage ;
- `v20-bridge.js` : authentification, synchronisation et chargement à la demande ;
- `v20-admin.js` : gestion des comptes ;
- `v20-exports.js` : moteur PDF ;
- `sw.js` + `manifest.webmanifest` : PWA ;
- `supabase/migration_v20.sql` : tables V20 et politiques RLS.

## Mise en production

Ne fusionner la branche V20 vers `main` qu’après avoir renseigné `supabaseUrl` et `supabaseAnonKey`, appliqué `migration_v20.sql` et testé au minimum un compte administrateur et un compte éducateur.
