# Boutique — V34.2.0 (23 novembre 2026)

- Correction du plantage DateTimeFormat : dates ISO avec heure/fuseau, dates simples et valeurs invalides prises en charge lors du rendu. Le plantage survenait après la confirmation du paiement et pouvait annoncer à tort une absence d’enregistrement.
- Une erreur d’affichage après confirmation d’un statut est distinguée d’une erreur d’écriture.
- Articles réunis par identité, classe et lot fournisseur. Nom et classe affichés une seule fois par groupe ; paiements et distribution restent suivis par article.
- Recherche et tri conservent le lot sélectionné ; les groupes ne sont pas dispersés par un clic d’en-tête.
- Les 29 lignes existantes ont été classées en Commande 1 (transmise au prestataire). Vérification avant/après : 26 payées, aucune distribuée, sans changement de ces statuts.
- Les nouvelles insertions prennent automatiquement le numéro 2 en base. Vue et exports Excel séparés par lot, avec titre et nom de fichier explicites.
- Les modifications détaillées restent réservées à l’administration.

Tests : dates ISO et invalides, mise à jour de paiement confirmée puis affichée, regroupement par élève, conservation du lot au tri, migration PostgreSQL en mémoire ancien=1/nouveau=2, paiements conservés. Régressions application, boutique, imports et fiabilité exécutées avec données fictives. Aucune commande de test créée en production.
