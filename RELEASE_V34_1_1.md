# Correctifs de stabilité — V34.1.1

19 novembre 2026.

## Corrections

- Édition d’une commande existante par UPDATE ciblé, avec confirmation de la ligne retournée. Conservation de la date, de l’identifiant du panier et des prix historiques. Seuls les champs modifiés sont transmis, afin de conserver les autres mises à jour d’un collègue.
- Formulaire administrateur : deux champs Nom / Prénom, format NOM Prénom, classes harmonisées. Message dans le formulaire en cas de refus, absence de confirmation ou délai dépassé ; bouton réactivé et saisie conservée. Double soumission bloquée.
- Modification accessible depuis les commandes AS ; formulaire EPS conservé lors du contrôle de rôle, sans ouvrir les autres fonctions d’administration.
- Requêtes centrales bornées à 15 secondes (attente d’authentification comprise) ; événements d’authentification traités hors du callback de la bibliothèque.
- Commandes importées affichées après confirmation, sans devoir recharger pour les retrouver.
- Documents et produits : une réponse sans ligne confirmée n’est plus présentée comme un enregistrement réussi. Pas de suppression d’une nouvelle photo après une réponse d’écriture incertaine.
- Confidentialité : commandes retirées du cache privé lors de la déconnexion et du chargement public ; une ancienne réponse ne peut plus rétablir le cache après un changement de session.
- Badge Convocation PDF/TV aligné sur le bleu AS #004aad ; tests mis à jour pour les choix de présentation validés.

## Vérifications

Tests avec données fictives : édition administrateur et EPS, historique, refus, réponse vide, délai dépassé, double clic, conservation du défilement et des statuts, correction d’identité, import, boutique, licences, convocations, quotas concurrents, documents, produits, droits et navigation sur 60 combinaisons rôle/page. Génération des PDF calendrier A4 et TV, polices TTF, débordements et couleurs contrôlés. Lecture du véritable export HelloAsso fourni (18 lignes), sans import en production.

Contrôle public en navigateur : accueil, catalogue, ajout de deux articles au panier, formulaire sans soumission, calendrier, convocation non publiée et documents. Aucun plantage de l’application observé sur ces parcours. Ressources, intégrité du SDK et manifeste PWA contrôlés.

Aucune commande réelle n’a été créée ou modifiée pour les tests. Les écritures authentifiées en production n’ont pas été exercées faute de session de test disponible. Les tests ne constituent pas une garantie d’absence de tout défaut, sur tous les appareils et dans toutes les situations réseau.

## Point de configuration restant

La protection Supabase contre les mots de passe compromis reste désactivée (avertissement de configuration, distinct du blocage des commandes). La projection publique des convocations est volontairement accessible et limitée aux prénoms et initiales des convocations publiées à venir.

Référence de configuration : https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection
