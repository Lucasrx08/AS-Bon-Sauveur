(() => {
'use strict';
const CONTACT_EMAIL='secretariatdirection@ensemblescolaire-bonsauveur.fr';
const CONTACT_ADDRESS='Ensemble scolaire du Bon Sauveur — Rue Élisabeth de Surville, 50000 Saint-Lô';
const CNIL_URL='https://www.cnil.fr/fr/plaintes';
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

function close(){document.getElementById('v221-privacy-modal')?.remove()}
function openPrivacy(){
  close();
  const w=document.createElement('div');
  w.id='v221-privacy-modal'; w.className='v19-modal-backdrop';
  w.innerHTML=
    '<div class="v19-modal wide v221-privacy-modal" role="dialog" aria-modal="true" aria-labelledby="v221-privacy-title">'+
      '<div class="v19-modal-head"><div><div class="v19-kicker">DONNÉES PERSONNELLES</div><h2 id="v221-privacy-title">Confidentialité & RGPD</h2></div><button class="v19-icon-btn" type="button" data-close aria-label="Fermer">×</button></div>'+
      '<div class="v19-modal-body">'+
        '<div class="v221-privacy-lead"><strong>Association Sportive du Bon Sauveur</strong><p>Cette application utilise uniquement les données nécessaires à l’organisation des activités sportives, des convocations, des inscriptions et des commandes.</p></div>'+
        '<div class="v221-privacy-grid">'+
          '<section><h3>Responsable du traitement</h3><p><strong>Ensemble scolaire du Bon Sauveur</strong><br>'+esc(CONTACT_ADDRESS)+'<br><a href="mailto:'+CONTACT_EMAIL+'">'+CONTACT_EMAIL+'</a> · 02 33 72 53 53</p></section>'+
          '<section><h3>Pourquoi ces données ?</h3><p>Organiser les activités de l’AS, gérer les licences et convocations, recueillir les inscriptions, suivre les commandes, et permettre aux éducateurs de rédiger les appréciations liées aux dispositifs sportifs.</p></section>'+
          '<section><h3>Données utilisées</h3><p>Selon la fonctionnalité : nom et prénom, classe, activité ou spécialité sportive, inscription à un événement, statut de licence/cotisation, commande, et appréciation pédagogique.</p></section>'+
          '<section><h3>Base légale</h3><p>Selon la fonctionnalité : exécution d’une demande ou d’une commande de la famille (article 6-1-b du RGPD), respect d’obligations légales applicables (article 6-1-c), et intérêt légitime de l’établissement à organiser et sécuriser ses activités sportives et leur suivi (article 6-1-f). Aucun usage publicitaire ni profilage commercial n’est réalisé.</p></section>'+
          '<section><h3>Qui peut y accéder ?</h3><p>Uniquement les personnels autorisés de l’Association Sportive et de l’établissement selon leur rôle. Supabase assure l’hébergement technique de la base et de l’authentification ; jsDelivr est utilisé uniquement pour livrer des bibliothèques logicielles nécessaires au fonctionnement.</p></section>'+
          '<section><h3>Durées de conservation</h3><ul><li>inscriptions : jusqu’à minuit le jour de l’événement ;</li><li>liste nominative d’une convocation : jusqu’à minuit le jour de l’activité ;</li><li>commandes : jusqu’au 1er juillet de l’année scolaire concernée ;</li><li>élèves, licences et appréciations sportives : jusqu’au 1er juillet de l’année scolaire concernée ;</li><li>bilans AS comportant des données personnelles : jusqu’au 1er juillet de l’année scolaire concernée ;</li><li>compteurs techniques anti-abus : 48 h ; tentatives PIN : 30 jours maximum.</li></ul></section>'+
          '<section><h3>Vos droits</h3><p>Vous pouvez demander l’accès, la rectification, l’effacement ou la limitation de vos données, selon les conditions prévues par le RGPD. Le droit d’opposition s’applique lorsque la base légale du traitement le permet.</p><p>Écrivez à <a href="mailto:'+CONTACT_EMAIL+'">'+CONTACT_EMAIL+'</a>. Une vérification d’identité peut être demandée uniquement si elle est nécessaire.</p></section>'+
          '<section><h3>Réclamation</h3><p>Si vous estimez que vos droits ne sont pas respectés, vous pouvez saisir la CNIL.</p><p><a href="'+CNIL_URL+'" target="_blank" rel="noopener noreferrer">Accéder au site de la CNIL ↗</a></p></section>'+
          '<section><h3>Cookies et suivi</h3><p>L’application n’utilise pas de cookie publicitaire ni d’outil de mesure d’audience. Les éléments techniques nécessaires à la connexion et à la sécurité servent uniquement au fonctionnement de l’application.</p></section>'+
          '<section><h3>Mineurs</h3><p>L’application étant destinée notamment à des élèves mineurs, la collecte est limitée au strict nécessaire pour chaque fonctionnalité et l’information est présentée en termes simples.</p></section>'+
        '</div>'+
        '<div class="v221-privacy-version">Notice V24 · mise à jour : 15 septembre 2026</div>'+
      '</div>'+
    '</div>';
  document.body.appendChild(w);
  w.querySelector('[data-close]').onclick=close;
  w.onclick=e=>{if(e.target===w)close()};
  return w;
}
function injectFooter(){
  const shell=document.querySelector('.v19-shell'); if(!shell)return;
  if(shell.querySelector('.v221-privacy-footer'))return;
  const f=document.createElement('footer'); f.className='v221-privacy-footer';
  f.innerHTML='<button type="button" data-privacy>Données personnelles & RGPD</button><span>V25</span>';
  f.querySelector('[data-privacy]').onclick=openPrivacy;
  shell.appendChild(f);
}
function install(){
  window.app=window.app||{};
  window.app.privacy=openPrivacy;
  injectFooter();
  new MutationObserver(()=>requestAnimationFrame(injectFooter)).observe(document.getElementById('app')||document.body,{childList:true,subtree:true});
}
install();
setTimeout(()=>{
  if(document.querySelector('script[data-v251-functional]'))return;
  const s=document.createElement('script');
  s.src='v25-1-functional.js?v=20260915-v25-1';
  s.dataset.v251Functional='1';
  document.body.appendChild(s);
},0);
})();