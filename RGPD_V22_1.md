# Registre simplifié RGPD — AS Bon Sauveur — V22.1

Document de travail destiné au responsable de traitement / DPO de l’établissement. Il décrit les traitements réellement mis en œuvre par l’application au 15 septembre 2026.

## Responsable de traitement
Ensemble scolaire du Bon Sauveur — Rue Élisabeth de Surville, 50000 Saint-Lô  
Contact : secretariatdirection@ensemblescolaire-bonsauveur.fr — 02 33 72 53 53

## Traitements
### Inscriptions aux événements
Finalité : organiser la participation à une activité sportive.  
Données : nom, prénom, classe, événement.  
Base légale : exécution de la demande d’inscription et intérêt légitime d’organisation.  
Destinataires : enseignants AS / administrateurs autorisés.  
Conservation : jusqu’à minuit le jour de l’événement.

### Convocations
Finalité : organiser les déplacements et participants.  
Données : identité de l’élève, classe, activité, rendez-vous.  
Base légale : intérêt légitime de l’établissement et organisation de l’activité scolaire/associative.  
Destinataires : personnels autorisés selon rôle.  
Conservation nominative : jusqu’à minuit le jour de l’activité.

### Licences et suivi des élèves
Finalité : gestion de l’adhésion, cotisation, activité et suivi sportif.  
Données : identité, classe, catégorie, spécialité, paiement, charte.  
Base légale : exécution de l’adhésion/demande et intérêt légitime d’organisation.  
Conservation : jusqu’au 1er juillet de l’année scolaire concernée.

### Appréciations sportives
Finalité : suivi pédagogique des dispositifs sportifs et transfert vers les outils scolaires.  
Données : identité de l’élève, texte d’appréciation, trimestre, éducateur.  
Base légale : intérêt légitime / mission éducative de l’établissement à confirmer dans le registre institutionnel.  
Conservation : jusqu’au 1er juillet de l’année scolaire concernée.

### Commandes
Finalité : gérer les commandes de vêtements/articles AS et leur paiement/distribution.  
Données : nom de l’élève, classe, produit, taille, quantité, paiement, état de distribution.  
Base légale : exécution de la commande ; obligations comptables applicables le cas échéant.  
Conservation dans l’application : jusqu’au 1er juillet de l’année scolaire concernée.

### Bilans AS
Finalité : suivi des activités et compétitions de l’Association Sportive.  
Données : date, activité, effectifs et, lorsqu’un commentaire en contient, données personnelles liées à l’activité.  
Base légale : intérêt légitime de l’établissement à assurer le suivi de ses activités sportives.  
Conservation : jusqu’au 1er juillet de l’année scolaire concernée.

### Comptes staff et sécurité
Finalité : authentification, gestion des droits, prévention des tentatives abusives.  
Données : identité du compte, rôle, identifiant technique ; PIN stocké uniquement sous forme gérée par Supabase Auth ; compteurs anti-abus pseudonymisés.  
Base légale : intérêt légitime à sécuriser l’accès aux données.  
Conservation : durée d’habilitation du compte ; compteurs anti-abus 48 h ; tentatives PIN 30 jours maximum.

## Sous-traitants / services techniques
- Supabase : base de données, authentification et fonctions serveur ; projet configuré en région européenne.
- GitHub Pages : hébergement statique de l’application.
- jsDelivr : livraison de bibliothèques JavaScript nécessaires au fonctionnement.
- Instagram : aucun chargement automatique du flux ; connexion au réseau social uniquement lorsque l’utilisateur clique sur le lien.

## Mesures techniques
- RLS activée sur les tables contenant des données personnelles.
- Écriture publique directe supprimée pour commandes et inscriptions.
- Formulaires publics via fonctions serveur, validation et limitation de débit.
- données privées exclues du localStorage persistant ; compatibilité temporaire via sessionStorage.
- comptes éducateurs/enseignants via PIN et rôle serveur.
- purge quotidienne des données arrivées à échéance.
- LanguageTool désactivé : les appréciations ne sont pas envoyées automatiquement vers un correcteur externe.
- Google Fonts supprimé du chargement de l’application.

## Droits des personnes
Point de contact : secretariatdirection@ensemblescolaire-bonsauveur.fr.  
Droits applicables selon le traitement : accès, rectification, effacement, limitation et opposition lorsque prévue par la base légale.  
Réclamation possible auprès de la CNIL.

## Validation organisationnelle à conserver hors code
Le responsable de traitement/DPO doit valider la qualification exacte des bases légales, la durée institutionnelle des pièces comptables éventuellement exportées hors de l’application, la liste contractuelle des sous-traitants et l’inscription de ces traitements dans le registre officiel de l’établissement.
