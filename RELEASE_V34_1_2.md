# Commandes — V34.1.2

19 novembre 2026.

- Vue partagée AS : une ligne par article, sans bandeau récapitulatif qui doublait le nom et la classe. Les liens « Modifier la commande » et « Modifier le nom / la classe » sont retirés pour tous les profils de cette vue.
- Un seul champ de recherche pour nom, classe, article et règlement. Les menus de filtre/tri sont remplacés par des en-têtes cliquables ; chaque clic inverse le sens. Un seul critère de tri est actif et il s’applique à l’ensemble des lignes.
- Les enseignants AS conservent l’ajout d’une commande et les deux statuts Payé / Distribué.
- Modification détaillée uniquement pour les administrateurs dans Administration → Commandes. Contrôle du rôle et du parcours à l’ouverture comme à l’enregistrement.
- Protection dans PostgreSQL : un enseignant peut seulement modifier paid et distributed sur une commande existante. Les autres champs sont protégés par un déclencheur SECURITY INVOKER ; la politique de suppression exige le rôle administrateur. Les processus techniques de maintenance restent opérationnels.

Vérifications : clics sur les en-têtes (tri croissant/décroissant), dates, recherche persistante, absence de la deuxième couche de tri, accès direct refusé hors administration, rôle enseignant refusé, formulaire administrateur fonctionnel. Tests PostgreSQL en mémoire sur le suivi autorisé, huit modifications détaillées refusées et suppression refusée pour un enseignant ; modification et suppression autorisées pour l’administrateur. Tests de régression commandes, import, identité, boutique et convocations.

La migration ne modifie aucune commande existante. Les contrôles en production ont vérifié les définitions du déclencheur et des droits ; aucun compte/PIN de production ni commande réelle n’a servi de donnée de test.
