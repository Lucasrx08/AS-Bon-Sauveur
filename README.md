# Bon Sauveur Sport — V1

Application PWA mobile-first pour regrouper :
- Association Sportive du Bon Sauveur ;
- Section football ;
- Option escalade ;
- Sport-études gymnastique.

## Ce que contient cette V1

- Accueil adapté au profil.
- Calendrier filtrable par pôle.
- Informations importantes avec niveaux NORMAL / IMPORTANT / URGENT.
- Centre de documents.
- Convocations aux compétitions.
- Boutique et saisie de commandes.
- Appréciations éducateurs.
- Gestion des licences.
- Bilans AS.
- Administration moderne avec création / modification / duplication / suppression.
- Mode clair / sombre.
- Responsive smartphone / tablette / ordinateur.
- PWA (manifest + service worker).
- Connexion Supabase prête à être activée.
- Schéma PostgreSQL + RLS dans `supabase/schema.sql`.

## Lancer la démo immédiatement

Le projet fonctionne sans installation grâce au mode démonstration local.

1. Lancer un petit serveur HTTP dans ce dossier :
   `python3 -m http.server 8080`
2. Ouvrir `http://localhost:8080`.
3. Utiliser le bouton de profil en haut à droite pour tester les rôles : Élève/Parent, Éducateur, Enseignant AS, Administrateur.

Les modifications faites en mode démo sont conservées dans `localStorage` du navigateur.

## Passer en mode production Supabase

1. Créer un projet Supabase.
2. Exécuter `supabase/schema.sql` dans le SQL Editor.
3. Créer les comptes utilisateurs dans Supabase Auth.
4. Définir le rôle de chaque compte dans la table `profiles`.
5. Modifier `config.js` :

```js
window.APP_CONFIG = {
  appName: "Bon Sauveur Sport",
  supabaseUrl: "https://VOTRE-PROJET.supabase.co",
  supabaseAnonKey: "VOTRE_CLE_ANON",
  demoMode: false
};
```

La clé `anon` est conçue pour être publique côté navigateur. La sécurité des données sensibles repose sur les politiques RLS du fichier SQL, pas sur le masquage de l'interface.

## Mise en ligne

Le projet étant statique côté front, il peut être hébergé sur GitHub Pages, Netlify, Cloudflare Pages ou un hébergement équivalent. Supabase fournit l'authentification, la base PostgreSQL et le stockage.

Pour GitHub Pages, placez tous les fichiers à la racine du dépôt et activez Pages sur la branche principale.

## Logos

Les quatre logos transmis sont intégrés dans `assets/` et utilisés comme identité des différents pôles.

## Points à brancher avant ouverture réelle aux familles

- Renseigner les vrais événements, documents, élèves et utilisateurs.
- Créer les buckets Supabase Storage et adapter les politiques de fichiers.
- Relier chaque compte élève/parent à l'élève concerné si vous souhaitez afficher des convocations nominatives.
- Définir précisément la durée de conservation des données personnelles et le processus d'archivage/suppression.
- Tester les permissions RLS avec un compte de chaque rôle avant publication.
- Remplacer les exemples de données de démonstration par les données réelles.

## Structure

- `index.html` : point d'entrée.
- `styles.css` : charte graphique et responsive.
- `app.js` : navigation, écrans, CRUD, mode démo, connexion Supabase.
- `config.js` : configuration de l'environnement.
- `manifest.webmanifest` + `sw.js` : PWA.
- `assets/` : logos.
- `supabase/schema.sql` : tables, rôles et politiques RLS.
