# AS Bon Sauveur — Correctif V31.3

## Objectif

Stabiliser les changements de profil, supprimer la double connexion, empêcher le retour d’une ancienne interface et corriger l’affichage sur téléphone.

## Correctifs inclus

- authentification appliquée en une seule passe, sans rechargement de page concurrent ;
- marqueur d’authentification V31 isolé de l’ancien module de compatibilité ;
- profil déjà connecté affiché depuis l’état courant, sans nouvelle requête inutile ;
- déconnexion et expiration après 30 minutes sans « crash » visuel ;
- chargement parallèle des données du profil ;
- suppression du module historique `v21-auth-fix.js` du point d’entrée ;
- purge de tous les anciens caches `as-bon-sauveur-*` ;
- suppression du secours de navigation qui pouvait restaurer une ancienne page ;
- interdiction de mélanger les ressources de deux versions différentes ;
- version unique `31.3.0` appliquée à toutes les ressources ;
- formulaires mobiles à 16 px minimum pour éviter le zoom automatique d’iOS ;
- largeur mobile limitée à 100 % et suppression du recentrage pendant la saisie.

## Déploiement

1. Publier l’ensemble des fichiers modifiés sur la branche GitHub Pages.
2. Attendre la fin du déploiement GitHub Pages.
3. Ouvrir l’application avec `?v=31.3.0` ajouté une fois à l’adresse.
4. Vérifier que le pied de page affiche `V31.3` et que le bouton de profil public affiche `P`.
5. Sur une PWA déjà installée, la fermer complètement puis la rouvrir après le message de mise à jour.

Aucune migration Supabase ni modification des données n’est nécessaire pour cette version.

## Contrôles avant publication

```bash
for f in *.js tests/*.mjs; do node --check "$f" || exit 1; done
node tests/smoke-v31-3.mjs
git diff --check
```

Résultat attendu : `Smoke V31.3 : OK`.
