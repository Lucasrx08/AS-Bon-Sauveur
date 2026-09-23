# V31.5 — Commandes adultes et sécurité Supabase

## Changements

- « Enseignant » et « Personnel » sont proposés après les classes dans le formulaire public de commande.
- La création et la modification manuelles d’une commande utilisent la même liste.
- La fonction Edge `public-order` accepte et contrôle ces deux profils.
- Le `search_path` de `public.v20_events_sync_specialties()` est désormais fixé explicitement.

## Vérifications prévues

- contrôles de syntaxe JavaScript et TypeScript ;
- tests de non-régression V31.3 et V31.4 ;
- test V31.5 sur le formulaire, le serveur et la migration ;
- nouvel audit Supabase après migration.

## Limitation Supabase

La protection contre les mots de passe compromis nécessite un abonnement Supabase Pro ou supérieur. Le projet étant sur l’offre gratuite, cette alerte ne peut pas être supprimée sans changement d’abonnement.
