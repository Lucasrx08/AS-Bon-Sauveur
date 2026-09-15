# Association Sportive du Bon Sauveur — V22.1

PWA mobile-first pour l’Association Sportive du Bon Sauveur, la section football, l’option escalade et le sport-études gymnastique.

## V22.1 — finalisation RGPD

- notice « Données personnelles & RGPD » accessible depuis toutes les pages ;
- information courte affichée au moment d’une inscription ou d’une commande ;
- responsable de traitement et contact officiel de l’établissement affichés ;
- finalités, bases légales, destinataires, durées de conservation, droits et recours CNIL explicités ;
- purge automatisée étendue aux listes nominatives de convocations, élèves, licences, appréciations et bilans ;
- fonctions de rôle privilégiées déplacées hors du schéma API public ;
- fonctions publiques de rôle converties en SECURITY INVOKER ;
- chargement Google Fonts supprimé ;
- flux Instagram automatique désactivé : ouverture uniquement après clic volontaire ;
- version de supabase-js fixée ;
- registre simplifié des traitements : `RGPD_V22_1.md` ;
- migration de production archivée : `supabase/migration_v22_1.sql`.

## V22 — sécurité, RGPD et stabilité

- données nominatives et pédagogiques retirées du stockage local persistant du navigateur ;
- conservation temporaire en session pour rester compatible avec l’interface existante ;
- Supabase demeure la source centrale pour les données partagées entre enseignants ;
- commandes publiques transmises via une fonction serveur sécurisée, avec validation, anti-doublon et limitation de débit ;
- inscriptions publiques transmises via une fonction serveur sécurisée, avec contrôle de l’événement et limitation de débit ;
- suppression des accès SQL publics directs aux tables nominatives de commandes et d’inscriptions ;
- durée de conservation automatisée : suppression des inscriptions et listes nominatives à minuit le jour de l’activité ; autres données de suivi jusqu’au 1er juillet de l’année scolaire concernée ;
- nettoyage RGPD quotidien côté base de données ;
- désactivation du module de réconciliation V20 susceptible de supprimer des lignes serveur à partir d’un état local incomplet ;
- codes PIN conservés pour les enseignants/éducateurs, avec compte administrateur de secours.

## V21.15 — inscriptions et suivi pédagogique

- inscription libre depuis le calendrier lorsqu’aucune convocation n’est disponible ;
- saisie publique limitée au nom, prénom et à une classe prédéfinie ;
- liste nominative réservée aux enseignants AS et administrateurs ;
- filtres par spécialité et événement, avec export Excel professionnel ;
- consultation centralisée des appréciations dans « Plus » ;
- filtres par spécialité et trimestre, puis copie directe vers ÉcoleDirecte.

### Correctif V21.15.1

- confirmation immédiate de l’événement dans Supabase avant d’ouvrir les inscriptions ;
- même règle d’affichage du bouton « Inscription » sur l’accueil et le calendrier ;
- priorité donnée aux inscriptions ouvertes dans les cinq rendez-vous de l’accueil ;
- accès direct aux inscriptions et appréciations depuis la page Administration ;
- actualisation fiable du rôle et des données après le chargement Supabase ;
- retrait des anciennes données nominatives de démonstration du code public.

### Correctif V21.15.2

- bouton « Retirer » sur chaque ligne de la liste des inscriptions ;
- confirmation précisant que seule l’inscription de la date affichée est supprimée ;
- suppression ciblée par identifiant unique, sans toucher aux autres dates de l’élève ;
- droit de suppression réservé aux enseignants AS et administrateurs par les politiques RLS.

## V21.14 — décors PDF HD

- fonds de programme et de convocation haute définition ;
- jusqu’à cinq dates par programme ;
- typographie agrandie et composition optimisée pour une lecture à distance.

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

Les données élèves, licences, appréciations, bilans, listes nominatives de convocations et listes d’inscriptions ne sont jamais lisibles anonymement.

Une personne non connectée peut uniquement ajouter une inscription à un événement public, à venir, explicitement ouvert et sans convocation. Elle ne peut jamais consulter la liste obtenue.

Les éducateurs ne peuvent accéder qu’aux élèves et appréciations correspondant à leur spécialité.

## Activation Supabase

1. Créer ou ouvrir le projet Supabase.
2. Exécuter le schéma initial si nécessaire : `supabase/schema.sql`.
3. Exécuter les migrations existantes dans l’ordre.
4. Exécuter `supabase/migration_v20.sql`.
5. Exécuter `supabase/migration_v21_15.sql`.
6. Exécuter `supabase/migration_v21_15_2.sql`.
7. Déployer la fonction Edge `supabase/functions/admin-users`.
8. Renseigner dans `config.js` :

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
- sélection guidée de 1 à 5 rendez-vous pour le programme ;
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
- `v21-15.css` : présentation des inscriptions et de la supervision pédagogique ;
- `sw.js` + `manifest.webmanifest` : PWA ;
- `supabase/migration_v20.sql` : tables V20 et politiques RLS.
- `supabase/migration_v21_15.sql` : ouverture des inscriptions et protection de leur liste nominative.
- `supabase/migration_v21_15_2.sql` : suppression ciblée d’une inscription par le staff AS.

## Mise en production

La V22.1 est active sur `main`. Les migrations V22 et V22.1 sont appliquées sur le projet Supabase de production. Avant toute modification future des traitements de données, mettre à jour la notice RGPD et le registre simplifié.
