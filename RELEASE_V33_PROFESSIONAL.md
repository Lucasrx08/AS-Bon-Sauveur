# V33 — consolidation avant diffusion aux familles

- Exports XLSX : ANTON/Montserrat, bleu #004aad, jaune #ffd502 pour commandes, licences, bilans, convocations, appréciations, inscriptions et modèle d’import. PDF calendrier/TV/convocation : couleurs de texte accordées à la charte, fonds et compositions conservés.
- Convocations : accepte les noms en majuscules/minuscules et les prénoms composés ; conserve la projection prénom + initiale, filtre publication, visibilité et date ; ne modifie aucun droit d’accès. Les noms fournis en un seul mot restent sous forme d’initiale. Les noms complets stockés en une seule chaîne sont intrinsèquement ambigus ; les données d’origine ne sont pas réécrites.
- RGPD : notice actualisée (public/personnels/HelloAsso), fin du jour de l’événement et nettoyage horaire précisés.
- Commandes : vue par personne conservée, vue panier/référence ajoutée pour vérifier séparément les achats en cas d’homonymie.
- Anti-abus : familles 300 requêtes/h/IP, 30/min/IP et 6/h/identité ; personnel 120/h/compte après validation du JWT et du rôle stocké en base. Une session invalide ou un rôle non autorisé est refusé. Aucun mot de passe ni PIN modifié.
- Protection Supabase contre mots de passe compromis : réglage non accessible au connecteur ; tableau de bord non authentifié, reste à activer par le propriétaire.

Validation : npm test, test:shop, test:pdf, test:quota, test:audit ; génération/relecture XLSX avec ExcelJS 4.4.0 sur données fictives. Aucun achat/inscription de test créé en production.

Déploiement : migration professional_audit_v33, fonction public-order (JWT public existant conservé, validation explicite des appels du personnel dans la fonction), publication statique, vérification HTTP et parcours publics.
