# Boutique — V34.2.1

23 novembre 2026.

- Liste unique par défaut : toutes les commandes sont visibles. Nom et classe regroupés par personne, même si les articles appartiennent à deux envois différents.
- Colonne « Commande n° » avec une tuile Commande 1 / Commande 2 par article. Réaffectation réservée aux administrateurs, confirmée par le serveur avant affichage, sans changement des statuts Payé/Distribué. Bouton temporairement désactivé pendant la requête et protection contre le double clic.
- Choix « Commande numéro » dans l’ajout multi-articles administrateur et dans la modification détaillée d’administration. Les familles et enseignants conservent leur parcours existant.
- Saisie administrateur jusqu’à 100 unités par ligne : 17 tee-shirts peuvent être saisis ensemble et affectés à Commande 1. Enregistrement en une seule insertion atomique, découpée techniquement selon la limite de 10 unités par ligne en base. Une reprise réseau retrouve la même saisie et n’en crée pas une seconde.
- Filtre fournisseur facultatif, tri par numéro et export du périmètre choisi ; export de toutes les commandes par défaut.

Tests avec données fictives : regroupement d’une identité sur deux envois, colonne de réaffectation administrateur et refus enseignant, formulaire conditionnel, 17 unités en Commande 1, réessai sans doublon, régressions application/boutique/imports et protections existantes. Aucune commande réelle créée ou réaffectée lors des tests. Aucun changement de droits ni de schéma SQL nécessaire.
