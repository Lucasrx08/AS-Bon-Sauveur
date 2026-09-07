(() => {
'use strict';
/* Sur un nouvel appareil, on conserve les données de démonstration V4 en mémoire
   au lieu de les remplacer par un stockage partiel lors de la première visite. */
if(!localStorage.getItem('bs-app-data-v4')){
  localStorage.setItem('bs-v5-migrated','v5-20260907-2');
}
})();
