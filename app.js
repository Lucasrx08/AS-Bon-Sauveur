(() => {
  'use strict';

  const cfg = window.APP_CONFIG || {};
  const root = document.getElementById('app');
  const hasSupabase = !!(cfg.supabaseUrl && cfg.supabaseAnonKey && window.supabase);
  const supabase = hasSupabase ? window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey) : null;

  const CATS = {
    AS: { label: 'Association Sportive', css: 'as', logo: 'assets/logo-as.png' },
    Football: { label: 'Football', css: 'football', logo: 'assets/logo-football.png' },
    Escalade: { label: 'Escalade', css: 'escalade', logo: 'assets/logo-escalade.png' },
    Gymnastique: { label: 'Gymnastique', css: 'gymnastique', logo: 'assets/logo-gymnastique.png' },
  };

  const ROLE_LABELS = {
    public: 'Élève / Parent',
    educator: 'Éducateur',
    teacher: 'Enseignant AS',
    admin: 'Administrateur'
  };

  const seed = {
    events: [
      {id:'e1',title:'Entraînement AS multisports',category:'AS',date:'2026-09-09',time:'13:30',place:'Gymnase du Bon Sauveur',description:'Reprise des activités du mercredi.',audience:'Tous',level:'Tous'},
      {id:'e2',title:'Entraînement section football',category:'Football',date:'2026-09-10',time:'15:30',place:'Stade',description:'Séance technique et opposition.',audience:'Élèves',level:'Tous'},
      {id:'e3',title:'Option escalade',category:'Escalade',date:'2026-09-10',time:'15:30',place:'Salle d’escalade',description:'Séance de rentrée et constitution des cordées.',audience:'Élèves',level:'Tous'},
      {id:'e4',title:'Sport-études gymnastique',category:'Gymnastique',date:'2026-09-08',time:'14:30',place:'Saint-Loise Gymnastique',description:'Entraînement sport-études.',audience:'Élèves',level:'Tous'},
      {id:'e5',title:'Compétition UGSEL — Football',category:'Football',date:'2026-09-23',time:'13:00',place:'Saint-Lô',description:'Rencontre de secteur.',audience:'Élèves',level:'Collège'}
    ],
    infos: [
      {id:'i1',title:'Inscriptions AS ouvertes',text:'L’adhésion annuelle permet de participer librement aux activités proposées le midi et le mercredi.',category:'AS',importance:'IMPORTANT',publishedAt:'2026-09-05',expiresAt:'2026-09-30'},
      {id:'i2',title:'Horaires de rentrée',text:'Pensez à consulter les horaires propres à chaque dispositif sportif avant la première séance.',category:'AS',importance:'NORMAL',publishedAt:'2026-09-05',expiresAt:'2026-09-20'},
      {id:'i3',title:'Matériel escalade',text:'Prévoir une tenue de sport adaptée et une gourde. Le matériel technique est fourni.',category:'Escalade',importance:'NORMAL',publishedAt:'2026-09-05',expiresAt:'2026-09-20'}
    ],
    documents: [
      {id:'d1',title:'Règlement de l’Association Sportive',category:'AS',description:'Règles de fonctionnement et informations utiles.',date:'2026-09-01',url:'#'},
      {id:'d2',title:'Horaires section football',category:'Football',description:'Horaires hebdomadaires de la section.',date:'2026-09-01',url:'#'},
      {id:'d3',title:'Horaires option escalade',category:'Escalade',description:'Organisation et horaires de l’option.',date:'2026-09-01',url:'#'},
      {id:'d4',title:'Horaires sport-études gymnastique',category:'Gymnastique',description:'Organisation des prises en charge et retours.',date:'2026-09-01',url:'#'}
    ],
    products: [
      {id:'p1',name:'Sweat officiel Bon Sauveur Sport',description:'Sweat aux couleurs du Bon Sauveur Sport.',price:35,sizes:['XS','S','M','L','XL'],deadline:'2026-10-05',category:'AS'},
      {id:'p2',name:'T-shirt Association Sportive',description:'T-shirt technique pour les entraînements et événements.',price:15,sizes:['XS','S','M','L','XL'],deadline:'2026-10-05',category:'AS'}
    ],
    orders: [],
    students: [
      {id:'s1',lastName:'DUPONT',firstName:'Emma',className:'6e Avignon',specialty:'Gymnastique'},
      {id:'s2',lastName:'MARTIN',firstName:'Léo',className:'5e Auriol',specialty:'Football'},
      {id:'s3',lastName:'BERNARD',firstName:'Inès',className:'4e More',specialty:'Escalade'},
      {id:'s4',lastName:'ROBERT',firstName:'Noah',className:'3e Gaudí',specialty:'Gymnastique'},
      {id:'s5',lastName:'THOMAS',firstName:'Jade',className:'5e Coleman',specialty:'Football'},
      {id:'s6',lastName:'PETIT',firstName:'Louis',className:'4e Delaunay',specialty:'Escalade'}
    ],
    appreciations: [
      {id:'a1',studentId:'s2',term:1,text:'Très bonne implication dans les séances.',status:'validated'},
      {id:'a2',studentId:'s5',term:1,text:'',status:'todo'},
      {id:'a3',studentId:'s3',term:1,text:'Participation sérieuse et régulière.',status:'draft'}
    ],
    licenses: [
      {id:'l1',studentId:'s1',activity:'Gymnastique',status:'Active',date:'2026-09-02'},
      {id:'l2',studentId:'s2',activity:'Football',status:'Active',date:'2026-09-03'},
      {id:'l3',studentId:'s3',activity:'Escalade',status:'En attente',date:'2026-09-04'}
    ],
    reports: [
      {id:'b1',date:'2026-09-02',activity:'AS multisports',participants:34,levels:'Collège',result:'',comment:'Belle reprise, forte participation.'}
    ],
    convocations: [
      {id:'c1',title:'UGSEL Football — secteur',category:'Football',date:'2026-09-23',departure:'12:45',returnTime:'17:30',place:'Saint-Lô',transport:'Minibus',equipment:'Tenue de sport, gourde',studentIds:['s2','s5'],status:'published'}
    ]
  };

  const state = {
    route: 'home',
    adminTab: 'dashboard',
    categoryFilter: 'Tous',
    search: '',
    dark: localStorage.getItem('bs-dark') === '1',
    user: null,
    role: 'public',
    data: loadLocal(),
    online: navigator.onLine,
    authReady: false
  };

  if (state.dark) document.body.classList.add('dark');

  function loadLocal(){
    try {
      const raw = localStorage.getItem('bs-app-data-v1');
      return raw ? JSON.parse(raw) : structuredClone(seed);
    } catch { return structuredClone(seed); }
  }
  function saveLocal(){
    if (!hasSupabase || cfg.demoMode) localStorage.setItem('bs-app-data-v1', JSON.stringify(state.data));
  }
  function uid(prefix='x'){ return prefix + Math.random().toString(36).slice(2,10); }
  function fmtDate(d){
    if (!d) return '';
    return new Intl.DateTimeFormat('fr-FR',{weekday:'short',day:'numeric',month:'short'}).format(new Date(d+'T12:00:00'));
  }
  function fmtLongDate(d){
    if (!d) return '';
    return new Intl.DateTimeFormat('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(new Date(d+'T12:00:00'));
  }
  function esc(v=''){ return String(v).replace(/[&<>"]/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[s])); }
  function categoryBadge(cat){ const c=CATS[cat]||CATS.AS; return `<span class="badge ${c.css}">${esc(c.label)}</span>`; }
  function toast(msg){
    const el=document.createElement('div'); el.className='toast'; el.textContent=msg; document.body.appendChild(el);
    setTimeout(()=>el.remove(),2400);
  }
  function roleAllows(min){
    const rank={public:0,educator:1,teacher:2,admin:3}; return rank[state.role] >= rank[min];
  }
  function visibleByCategory(item){ return state.categoryFilter==='Tous' || item.category===state.categoryFilter; }
  function dateParts(d){ const x=new Date(d+'T12:00:00'); return {day:x.getDate(),month:x.toLocaleDateString('fr-FR',{month:'short'}).replace('.','')}; }

  async function initAuth(){
    if (hasSupabase && !cfg.demoMode){
      const {data:{session}} = await supabase.auth.getSession();
      if (session) await hydrateUser(session.user);
      supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) await hydrateUser(session.user); else { state.user=null; state.role='public'; render(); }
      });
    }
    state.authReady = true;
    render();
  }

  async function hydrateUser(authUser){
    try{
      const {data:profile,error}=await supabase.from('profiles').select('*').eq('id',authUser.id).single();
      if(error) throw error;
      state.user={id:authUser.id,name:profile.display_name||authUser.email,email:authUser.email};
      state.role=profile.role==='admin'?'admin':profile.role==='teacher_as'?'teacher':profile.role?.startsWith('educator')?'educator':'public';
      await loadRemoteData();
    }catch(e){ console.error(e); state.user={id:authUser.id,name:authUser.email,email:authUser.email}; state.role='public'; }
  }

  async function loadRemoteData(){
    if (!hasSupabase || cfg.demoMode) return;
    const map={events:'events',infos:'announcements',documents:'documents',products:'products',students:'students',appreciations:'appreciations',licenses:'licenses',reports:'as_reports',convocations:'convocations',orders:'orders'};
    for (const [key,table] of Object.entries(map)) {
      const {data,error}=await supabase.from(table).select('*');
      if(!error && Array.isArray(data)) state.data[key]=normalizeRemote(key,data);
    }
  }

  function normalizeRemote(key,rows){
    const snakeToCamel = o => Object.fromEntries(Object.entries(o).map(([k,v])=>[k.replace(/_([a-z])/g,(_,c)=>c.toUpperCase()),v]));
    return rows.map(snakeToCamel);
  }

  function layout(content){
    const nav = [
      ['home','⌂','Accueil'],['calendar','▣','Calendrier'],['documents','▤','Documents'],['shop','◫','Boutique'],['more','•••','Plus']
    ];
    return `<div class="app-shell">
      <header class="topbar">
        <div class="brand" onclick="app.go('home')">
          <img src="assets/logo-as.png" alt="Logo Association Sportive">
          <div><div class="brand-title">BON SAUVEUR SPORT</div><div class="brand-sub">Saint-Lô · Association Sportive</div></div>
        </div>
        <div style="display:flex;gap:8px;align-items:center">
          <button class="icon-btn" onclick="app.toggleTheme()" aria-label="Changer le thème">${state.dark?'☀':'☾'}</button>
          <button class="profile-btn" onclick="app.openProfile()"><span class="avatar">${initials()}</span><span class="profile-name">${esc(state.user?.name || ROLE_LABELS[state.role])}</span></button>
        </div>
      </header>
      <main>${content}</main>
      <nav class="bottom-nav" aria-label="Navigation principale">
        ${nav.map(([r,ico,label])=>`<button class="nav-item ${state.route===r?'active':''}" onclick="app.go('${r}')"><span class="nav-ico">${ico}</span><span>${label}</span></button>`).join('')}
      </nav>
    </div>`;
  }
  function initials(){ const n=state.user?.name||ROLE_LABELS[state.role]; return n.split(/\s+/).slice(0,2).map(x=>x[0]).join('').toUpperCase(); }

  function render(){
    if (!state.authReady) { root.innerHTML='<div class="login-wrap"><div class="card">Chargement…</div></div>'; return; }
    if (!state.user && !cfg.demoMode && hasSupabase) { root.innerHTML=loginScreen(); return; }
    let page='';
    if(state.route==='home') page=homePage();
    if(state.route==='calendar') page=calendarPage();
    if(state.route==='documents') page=documentsPage();
    if(state.route==='shop') page=shopPage();
    if(state.route==='more') page=morePage();
    if(state.route==='convocations') page=convocationsPage();
    if(state.route==='appreciations') page=appreciationsPage();
    if(state.route==='admin') page=adminPage();
    if(state.route==='licenses') page=licensesPage();
    if(state.route==='reports') page=reportsPage();
    root.innerHTML=layout(page);
  }

  function loginScreen(){
    return `<div class="login-wrap"><div class="login-card">
      <section class="login-visual"><div><div class="kicker" style="color:#ffe36a">BON SAUVEUR · SAINT-LÔ</div><h1>Le sport,<br>en un coup d’œil.</h1><p>Calendrier, convocations, documents et informations utiles réunis dans une seule application.</p></div>
      <div class="login-logos">${Object.values(CATS).map(c=>`<img src="${c.logo}" alt="${esc(c.label)}">`).join('')}</div></section>
      <section class="login-form"><div class="kicker">Connexion sécurisée</div><h2 style="font-size:2rem;margin:.4rem 0 1rem">Bienvenue</h2>
      <form onsubmit="app.login(event)"><div class="field"><label>E-mail</label><input name="email" type="email" required autocomplete="username"></div><div class="field" style="margin-top:10px"><label>Mot de passe</label><input name="password" type="password" required autocomplete="current-password"></div><button class="btn" style="width:100%;margin-top:16px">Se connecter</button></form>
      <p class="note">Les droits et les données sensibles sont contrôlés par Supabase et ses règles RLS.</p></section>
    </div></div>`;
  }

  function homePage(){
    const now=new Date().toISOString().slice(0,10);
    const events=[...state.data.events].filter(e=>e.date>=now).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
    const next=events[0];
    return `<div class="container">
      <section class="hero"><div class="hero-row"><div><div class="kicker" style="color:#ffe36a">TOUT LE SPORT DU BON SAUVEUR</div><h1>Simple. Rapide.<br>Au bon endroit.</h1><p>Retrouvez les informations qui vous concernent sans chercher dans plusieurs outils.</p></div><div class="hero-logo-stack">${Object.values(CATS).map(c=>`<div class="hero-logo"><img src="${c.logo}" alt="${esc(c.label)}"></div>`).join('')}</div></div></section>
      ${next?`<div class="section-head"><div><h2>Prochain événement</h2><p>L’information essentielle, immédiatement.</p></div><button class="link-btn" onclick="app.go('calendar')">Tout voir →</button></div>${eventCard(next,true)}`:''}
      <div class="section-head"><div><h2>Informations importantes</h2><p>Les dernières informations publiées.</p></div></div>
      <div class="grid grid-3">${state.data.infos.slice(0,3).map(infoCard).join('')}</div>
      <div class="section-head"><div><h2>Accès rapides</h2></div></div>
      <div class="grid grid-4">
        ${quick('▣','Calendrier','Tous les rendez-vous','calendar')}
        ${quick('✓','Convocations','Compétitions et départs','convocations')}
        ${quick('▤','Documents','Les fichiers utiles','documents')}
        ${quick('◫','Boutique','Commandes AS','shop')}
      </div>
      <div class="section-head"><div><h2>Cette semaine</h2></div></div>
      <div class="grid">${events.slice(0,4).map(e=>eventCard(e,false)).join('')||'<div class="empty">Aucun événement prévu.</div>'}</div>
    </div>`;
  }
  function quick(ico,title,sub,route){ return `<div class="card clickable quick" onclick="app.go('${route}')"><div class="quick-ico">${ico}</div><div><strong>${title}</strong><span>${sub}</span></div></div>`; }
  function eventCard(e,large=false){ const p=dateParts(e.date); return `<article class="card ${large?'clickable':''} event-card"><div class="date-badge"><div class="day">${p.day}</div><div class="month">${p.month}</div></div><div><div class="event-title">${esc(e.title)}</div><div class="meta"><span>${esc(e.time||'')}</span><span>• ${esc(e.place||'')}</span></div></div>${categoryBadge(e.category)}</article>`; }
  function infoCard(i){ return `<article class="card info-card ${(i.importance||'NORMAL').toLowerCase()}"><span class="badge ${(i.importance||'NORMAL').toLowerCase()}">${esc(i.importance||'NORMAL')}</span><div class="info-title">${esc(i.title)}</div><div class="info-text">${esc(i.text||i.description||'')}</div><div class="actions">${categoryBadge(i.category)}</div></article>`; }

  function filters(){
    return `<div class="filters">${['Tous',...Object.keys(CATS)].map(c=>`<button class="filter-btn ${state.categoryFilter===c?'active':''}" onclick="app.filter('${c}')">${c==='Tous'?'Tout':esc(CATS[c].label)}</button>`).join('')}</div>`;
  }

  function calendarPage(){
    const rows=state.data.events.filter(visibleByCategory).filter(e=>e.title.toLowerCase().includes(state.search.toLowerCase())||e.place.toLowerCase().includes(state.search.toLowerCase())).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
    return `<div class="container"><div class="page-title"><div><div class="kicker">CALENDRIER</div><h1>À venir</h1><p>Une lecture chronologique et claire des rendez-vous.</p></div>${roleAllows('teacher')?'<button class="btn" onclick="app.openCrud(\'event\')">+ Événement</button>':''}</div>${filters()}<input class="search" placeholder="Rechercher un événement ou un lieu…" value="${esc(state.search)}" oninput="app.search(this.value)"><div class="grid" style="margin-top:15px">${rows.map(e=>eventCard(e,false)).join('')||'<div class="empty">Aucun événement ne correspond à votre recherche.</div>'}</div></div>`;
  }

  function documentsPage(){
    const q=state.search.toLowerCase();
    const docs=state.data.documents.filter(visibleByCategory).filter(d=>`${d.title} ${d.description}`.toLowerCase().includes(q));
    return `<div class="container"><div class="page-title"><div><div class="kicker">DOCUMENTS</div><h1>Centre de documents</h1><p>Retrouvez rapidement les documents utiles.</p></div>${roleAllows('teacher')?'<button class="btn" onclick="app.openCrud(\'document\')">+ Document</button>':''}</div>${filters()}<input class="search" placeholder="Rechercher un document…" value="${esc(state.search)}" oninput="app.search(this.value)"><div class="grid grid-2" style="margin-top:15px">${docs.map(d=>`<article class="card doc-card"><div class="doc-icon">PDF</div><div style="min-width:0"><div class="event-title">${esc(d.title)}</div><div class="meta"><span>${fmtDate(d.date)}</span></div><p class="info-text">${esc(d.description||'')}</p><div class="actions">${categoryBadge(d.category)}<button class="btn secondary" onclick="app.fakeDownload('${d.id}')">Consulter</button></div></div></article>`).join('')||'<div class="empty">Aucun document disponible.</div>'}</div></div>`;
  }

  function shopPage(){
    return `<div class="container"><div class="page-title"><div><div class="kicker">BOUTIQUE</div><h1>Boutique AS</h1><p>Des commandes simples, sans paiement en ligne obligatoire.</p></div>${roleAllows('teacher')?'<button class="btn" onclick="app.openCrud(\'product\')">+ Produit</button>':''}</div><div class="grid grid-2">${state.data.products.map(p=>`<article class="card product"><div class="product-photo"><img src="assets/logo-as.png" alt="Produit"></div><div class="product-body"><div class="event-title">${esc(p.name)}</div><p class="info-text">${esc(p.description)}</p><div class="product-price">${Number(p.price).toFixed(2).replace('.',',')} €</div><div class="meta">Commande avant le ${fmtDate(p.deadline)}</div><div class="actions"><button class="btn yellow" onclick="app.order('${p.id}')">Commander</button></div></div></article>`).join('')}</div></div>`;
  }

  function convocationsPage(){
    return `<div class="container"><div class="page-title"><div><div class="kicker">COMPÉTITIONS</div><h1>Convocations</h1><p>Les informations de départ, de retour et le matériel à prévoir.</p></div>${roleAllows('teacher')?'<button class="btn" onclick="app.openCrud(\'convocation\')">+ Convocation</button>':''}</div><div class="grid">${state.data.convocations.map(c=>`<article class="card"><div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start"><div><div class="event-title">${esc(c.title)}</div><div class="meta"><span>${fmtLongDate(c.date)}</span><span>• ${esc(c.place)}</span></div></div>${categoryBadge(c.category)}</div><div class="grid grid-3" style="margin-top:16px"><div><div class="kicker">Départ</div><strong>${esc(c.departure||'—')}</strong></div><div><div class="kicker">Retour</div><strong>${esc(c.returnTime||'—')}</strong></div><div><div class="kicker">Transport</div><strong>${esc(c.transport||'—')}</strong></div></div><p class="info-text" style="margin-top:16px"><strong>À prévoir :</strong> ${esc(c.equipment||'')}</p></article>`).join('')||'<div class="empty">Aucune convocation en cours.</div>'}</div></div>`;
  }

  function morePage(){
    const tiles=[
      ['✓','Convocations','convocations','public'],
      ['✎','Appréciations','appreciations','educator'],
      ['⚑','Licences','licenses','teacher'],
      ['↗','Bilans AS','reports','teacher'],
      ['⚙','Administration','admin','teacher']
    ].filter(x=>roleAllows(x[3]));
    return `<div class="container"><div class="page-title"><div><div class="kicker">PLUS</div><h1>Outils</h1><p>Les fonctions complémentaires adaptées à votre profil.</p></div></div><div class="grid more-grid">${tiles.map(t=>`<div class="card clickable more-tile" onclick="app.go('${t[2]}')"><div class="big-icon">${t[0]}</div><strong>${t[1]}</strong></div>`).join('')}</div><div class="section-head"><div><h2>Votre profil</h2></div></div><div class="card"><strong>${esc(ROLE_LABELS[state.role])}</strong><p class="info-text">${state.user?esc(state.user.name):'Mode démonstration'} · ${state.online?'En ligne':'Hors ligne'}</p>${cfg.demoMode?'<div class="actions"><button class="btn secondary" onclick="app.openProfile()">Changer de profil démo</button></div>':''}</div></div>`;
  }

  function appreciationsPage(){
    if(!roleAllows('educator')) return forbidden();
    const rows=state.data.students.map(s=>{
      const a=state.data.appreciations.find(x=>x.studentId===s.id && Number(x.term)===1) || {id:null,studentId:s.id,term:1,text:'',status:'todo'};
      return `<tr><td><strong>${esc(s.lastName)} ${esc(s.firstName)}</strong><div class="meta">${esc(s.className)} · ${esc(s.specialty)}</div></td><td><textarea style="width:100%;min-width:260px;border:1px solid var(--line);border-radius:12px;background:var(--bg);color:var(--ink);padding:10px" onchange="app.saveAppreciation('${s.id}',this.value)">${esc(a.text)}</textarea></td><td><span class="badge ${a.status==='validated'?'normal':a.status==='draft'?'important':'urgent'}">${a.status==='validated'?'VALIDÉ':a.status==='draft'?'BROUILLON':'À FAIRE'}</span></td></tr>`;
    }).join('');
    const done=state.data.appreciations.filter(a=>Number(a.term)===1 && a.status==='validated').length;
    const total=state.data.students.length;
    return `<div class="container"><div class="page-title"><div><div class="kicker">ÉDUCATEUR</div><h1>Appréciations</h1><p>Trimestre 1 · saisie rapide.</p></div></div><div class="card"><div style="display:flex;justify-content:space-between;gap:12px;margin-bottom:10px"><strong>${done} / ${total} appréciations validées</strong><span class="badge important">Échéance · 30 nov.</span></div><div class="progress"><span style="width:${Math.round(done/Math.max(total,1)*100)}%"></span></div></div><div class="card" style="margin-top:14px;overflow:auto"><table class="admin-table"><thead><tr><th>Élève</th><th>Appréciation</th><th>Statut</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
  }

  function licensesPage(){
    if(!roleAllows('teacher')) return forbidden();
    const students=Object.fromEntries(state.data.students.map(s=>[s.id,s]));
    return `<div class="container"><div class="page-title"><div><div class="kicker">GESTION</div><h1>Licences</h1><p>Recherche et statut des élèves licenciés.</p></div><button class="btn" onclick="app.openCrud('license')">+ Licence</button></div><div class="card" style="overflow:auto"><table class="admin-table"><thead><tr><th>Élève</th><th>Classe</th><th>Activité</th><th>Statut</th><th>Date</th></tr></thead><tbody>${state.data.licenses.map(l=>{const s=students[l.studentId]||{};return `<tr><td><strong>${esc((s.lastName||'')+' '+(s.firstName||''))}</strong></td><td>${esc(s.className||'')}</td><td>${esc(l.activity)}</td><td><span class="badge ${l.status==='Active'?'normal':'important'}">${esc(l.status)}</span></td><td>${fmtDate(l.date)}</td></tr>`}).join('')}</tbody></table></div></div>`;
  }

  function reportsPage(){
    if(!roleAllows('teacher')) return forbidden();
    return `<div class="container"><div class="page-title"><div><div class="kicker">BILAN AS</div><h1>Bilans du mercredi</h1><p>Quelques secondes après chaque mercredi pour préparer le bilan annuel.</p></div><button class="btn" onclick="app.openCrud('report')">+ Bilan</button></div><div class="grid">${state.data.reports.map(r=>`<article class="card"><div style="display:flex;justify-content:space-between;gap:10px"><div><div class="event-title">${esc(r.activity)}</div><div class="meta">${fmtDate(r.date)} · ${esc(r.levels||'')}</div></div><div class="date-badge"><div class="day">${esc(r.participants)}</div><div class="month">élèves</div></div></div><p class="info-text">${esc(r.comment||'')}</p></article>`).join('')}</div></div>`;
  }

  function adminPage(){
    if(!roleAllows('teacher')) return forbidden();
    const tabs=[['dashboard','Tableau de bord'],['infos','Informations'],['events','Événements'],['convocations','Convocations'],['documents','Documents'],['products','Boutique']];
    let body='';
    if(state.adminTab==='dashboard') body=adminDashboard();
    if(state.adminTab==='infos') body=adminList('infos','Informations','announcement');
    if(state.adminTab==='events') body=adminList('events','Événements','event');
    if(state.adminTab==='convocations') body=adminList('convocations','Convocations','convocation');
    if(state.adminTab==='documents') body=adminList('documents','Documents','document');
    if(state.adminTab==='products') body=adminList('products','Boutique','product');
    return `<div class="container"><div class="page-title"><div><div class="kicker">ADMINISTRATION</div><h1>Bonjour ${esc((state.user?.name||'Lucas').split(' ')[0])}</h1><p>Publier ou modifier les contenus en quelques clics.</p></div></div><div class="admin-layout"><aside class="card admin-side"><div class="admin-menu">${tabs.map(t=>`<button class="${state.adminTab===t[0]?'active':''}" onclick="app.adminTab('${t[0]}')">${t[1]}</button>`).join('')}</div></aside><section>${body}</section></div></div>`;
  }

  function adminDashboard(){
    const totalOrders=state.data.orders.length;
    const missing=Math.max(0,state.data.students.length-state.data.appreciations.filter(a=>a.status==='validated').length);
    return `<div class="grid grid-2"><div class="card clickable" onclick="app.openCrud('announcement')"><div class="kicker">Raccourci</div><h2>+ Information</h2><p class="info-text">Publier une information en moins d’une minute.</p></div><div class="card clickable" onclick="app.openCrud('event')"><div class="kicker">Raccourci</div><h2>+ Événement</h2><p class="info-text">Ajouter une date au calendrier.</p></div></div><div class="section-head"><div><h2>Vue synthétique</h2></div></div><div class="grid grid-3">${stat('Événements à venir',state.data.events.length)}${stat('Informations publiées',state.data.infos.length)}${stat('Convocations',state.data.convocations.length)}${stat('Appréciations à compléter',missing)}${stat('Commandes boutique',totalOrders)}${stat('Licenciés',state.data.licenses.length)}</div><div class="section-head"><div><h2>Derniers bilans</h2></div></div><div class="grid">${state.data.reports.slice(-3).reverse().map(r=>`<div class="card admin-stat"><div><strong style="font-size:1rem">${esc(r.activity)}</strong><div class="meta">${fmtDate(r.date)} · ${esc(r.participants)} participants</div></div><span class="badge normal">SAISI</span></div>`).join('')}</div>`;
  }
  function stat(label,n){ return `<div class="card admin-stat"><div><div class="info-text">${label}</div><strong>${n}</strong></div><span class="quick-ico" style="width:42px;height:42px">↗</span></div>`; }
  function adminList(key,title,type){
    const rows=state.data[key]||[];
    return `<div class="card"><div style="display:flex;justify-content:space-between;gap:12px;align-items:center"><div><h2 style="margin:0">${title}</h2><p class="info-text">${rows.length} élément(s)</p></div><button class="btn" onclick="app.openCrud('${type}')">+ Ajouter</button></div><div style="overflow:auto;margin-top:14px"><table class="admin-table"><thead><tr><th>Titre</th><th>Catégorie</th><th>Date</th><th>Actions</th></tr></thead><tbody>${rows.map(r=>`<tr><td><strong>${esc(r.title||r.name||r.activity||'Sans titre')}</strong></td><td>${r.category?categoryBadge(r.category):'—'}</td><td>${fmtDate(r.date||r.publishedAt||r.deadline)}</td><td><button class="btn secondary" onclick="app.editItem('${type}','${r.id}')">Modifier</button> <button class="btn secondary" onclick="app.duplicate('${key}','${r.id}')">Dupliquer</button> <button class="btn danger" onclick="app.remove('${key}','${r.id}')">Supprimer</button></td></tr>`).join('')}</tbody></table></div></div>`;
  }

  function forbidden(){ return `<div class="container"><div class="empty"><h2>Accès réservé</h2><p>Cette rubrique n’est pas disponible avec votre profil.</p></div></div>`; }

  function modal(html){ const d=document.createElement('div'); d.className='modal-backdrop'; d.id='modal-root'; d.innerHTML=`<div class="modal">${html}</div>`; d.addEventListener('click',e=>{if(e.target===d)d.remove()}); document.body.appendChild(d); }
  function closeModal(){ document.getElementById('modal-root')?.remove(); }

  function openProfile(){
    if(cfg.demoMode){
      modal(`<div class="modal-head"><h2>Profil de démonstration</h2><button class="icon-btn" onclick="app.closeModal()">×</button></div><p class="info-text">Choisissez un rôle pour tester l’application.</p><div class="role-grid">${Object.entries(ROLE_LABELS).map(([k,v])=>`<button class="role-btn ${state.role===k?'active':''}" onclick="app.setRole('${k}')"><strong>${v}</strong><div class="note">${k==='public'?'Consultation':k==='educator'?'Appréciations et informations de groupe':k==='teacher'?'Gestion AS et contenus':'Tous les droits'}</div></button>`).join('')}</div>${state.role!=='public'?'<div class="actions"><button class="btn secondary" onclick="app.go(\'admin\');app.closeModal()">Ouvrir l’administration</button></div>':''}`);
    } else {
      modal(`<div class="modal-head"><h2>Mon compte</h2><button class="icon-btn" onclick="app.closeModal()">×</button></div><p><strong>${esc(state.user?.name||'')}</strong></p><p class="info-text">${esc(state.user?.email||'')} · ${ROLE_LABELS[state.role]}</p><div class="actions"><button class="btn danger" onclick="app.logout()">Se déconnecter</button></div>`);
    }
  }

  function openCrud(type,item=null){
    const cOpt=Object.keys(CATS).map(c=>`<option ${item?.category===c?'selected':''}>${c}</option>`).join('');
    const head=`<div class="modal-head"><h2>${item?'Modifier':'Ajouter'} ${crudLabel(type)}</h2><button class="icon-btn" onclick="app.closeModal()">×</button></div>`;
    let fields='';
    if(type==='event') fields=`${input('title','Titre',item?.title,true)}${select('category','Catégorie',cOpt)}${input('date','Date',item?.date,true,'date')}${input('time','Heure',item?.time,false,'time')}${input('place','Lieu',item?.place)}${input('audience','Public concerné',item?.audience||'Tous')}${textarea('description','Description',item?.description)}`;
    if(type==='announcement') fields=`${input('title','Titre',item?.title,true)}${select('category','Catégorie',cOpt)}${select('importance','Importance',`<option ${item?.importance==='NORMAL'?'selected':''}>NORMAL</option><option ${item?.importance==='IMPORTANT'?'selected':''}>IMPORTANT</option><option ${item?.importance==='URGENT'?'selected':''}>URGENT</option>`)}${input('publishedAt','Date de publication',item?.publishedAt||'2026-09-05',true,'date')}${input('expiresAt','Fin de publication',item?.expiresAt,false,'date')}${textarea('text','Description',item?.text)}`;
    if(type==='document') fields=`${input('title','Titre',item?.title,true)}${select('category','Catégorie',cOpt)}${input('date','Date',item?.date||'2026-09-05',true,'date')}${input('url','Lien / URL',item?.url||'#')}${textarea('description','Description',item?.description)}`;
    if(type==='product') fields=`${input('name','Nom du produit',item?.name,true)}${input('price','Prix (€)',item?.price,true,'number')}${input('deadline','Date limite',item?.deadline,true,'date')}${input('sizes','Tailles (séparées par des virgules)',Array.isArray(item?.sizes)?item.sizes.join(', '):(item?.sizes||''))}${textarea('description','Description',item?.description)}`;
    if(type==='convocation') fields=`${input('title','Compétition',item?.title,true)}${select('category','Catégorie',cOpt)}${input('date','Date',item?.date,true,'date')}${input('place','Lieu',item?.place)}${input('departure','Heure de départ',item?.departure,false,'time')}${input('returnTime','Heure de retour',item?.returnTime,false,'time')}${input('transport','Transport',item?.transport)}${textarea('equipment','Matériel nécessaire',item?.equipment)}`;
    if(type==='license') fields=`${select('studentId','Élève',state.data.students.map(s=>`<option value="${s.id}">${esc(s.lastName)} ${esc(s.firstName)} — ${esc(s.className)}</option>`).join(''))}${input('activity','Activité','AS')}${select('status','Statut','<option>Active</option><option>En attente</option><option>Inactive</option>')}${input('date','Date','2026-09-05',true,'date')}`;
    if(type==='report') fields=`${input('activity','Activité',item?.activity,true)}${input('date','Date',item?.date||'2026-09-05',true,'date')}${input('participants','Nombre de participants',item?.participants,true,'number')}${input('levels','Niveaux / classes',item?.levels)}${input('result','Résultats éventuels',item?.result)}${textarea('comment','Commentaire',item?.comment)}`;
    modal(`${head}<form onsubmit="app.saveCrud(event,'${type}','${item?.id||''}')"><div class="form-grid">${fields}</div><div class="actions" style="justify-content:flex-end"><button type="button" class="btn secondary" onclick="app.closeModal()">Annuler</button><button class="btn">${item?'Enregistrer':'Publier'}</button></div></form>`);
  }
  function crudLabel(t){return ({event:'un événement',announcement:'une information',document:'un document',product:'un produit',convocation:'une convocation',license:'une licence',report:'un bilan'})[t]||'un élément';}
  function input(name,label,value='',req=false,type='text'){return `<div class="field"><label>${label}</label><input name="${name}" type="${type}" value="${esc(value??'')}" ${req?'required':''}></div>`;}
  function select(name,label,opts){return `<div class="field"><label>${label}</label><select name="${name}">${opts}</select></div>`;}
  function textarea(name,label,value=''){return `<div class="field full"><label>${label}</label><textarea name="${name}">${esc(value??'')}</textarea></div>`;}

  async function saveCrud(ev,type,id){
    ev.preventDefault(); const form=new FormData(ev.target); const obj=Object.fromEntries(form.entries());
    const map={event:['events','events'],announcement:['infos','announcements'],document:['documents','documents'],product:['products','products'],convocation:['convocations','convocations'],license:['licenses','licenses'],report:['reports','as_reports']};
    const [key,table]=map[type];
    if(type==='product'){ obj.price=Number(obj.price||0); obj.sizes=(obj.sizes||'').split(',').map(x=>x.trim()).filter(Boolean); obj.category='AS'; }
    if(type==='report') obj.participants=Number(obj.participants||0);
    if(type==='convocation'){ obj.status='published'; obj.studentIds=[]; }
    obj.id=id||uid(type[0]);

    if(hasSupabase && !cfg.demoMode){
      const remote=camelToSnake(obj); const {error}=await supabase.from(table).upsert(remote); if(error){toast('Erreur : '+error.message);return;}
      await loadRemoteData();
    } else {
      const arr=state.data[key]; const ix=arr.findIndex(x=>x.id===obj.id); if(ix>=0) arr[ix]={...arr[ix],...obj}; else arr.unshift(obj); saveLocal();
    }
    closeModal(); render(); toast(id?'Modification enregistrée':'Publication effectuée');
  }
  function camelToSnake(o){return Object.fromEntries(Object.entries(o).map(([k,v])=>[k.replace(/[A-Z]/g,m=>'_'+m.toLowerCase()),v]));}

  function editItem(type,id){ const key={event:'events',announcement:'infos',document:'documents',product:'products',convocation:'convocations'}[type]; const item=state.data[key].find(x=>x.id===id); openCrud(type,item); }
  function duplicate(key,id){ const arr=state.data[key]; const item=arr.find(x=>x.id===id); if(!item)return; arr.unshift({...structuredClone(item),id:uid('d'),title:item.title?item.title+' — copie':undefined,name:item.name?item.name+' — copie':undefined}); saveLocal(); render(); toast('Élément dupliqué'); }
  async function remove(key,id){
    if(!confirm('Supprimer cet élément ?'))return;
    const table={events:'events',infos:'announcements',documents:'documents',products:'products',convocations:'convocations'}[key];
    if(hasSupabase && !cfg.demoMode && table){ const {error}=await supabase.from(table).delete().eq('id',id); if(error){toast(error.message);return;} await loadRemoteData(); }
    else { state.data[key]=state.data[key].filter(x=>x.id!==id); saveLocal(); }
    render(); toast('Élément supprimé');
  }

  function order(productId){
    const p=state.data.products.find(x=>x.id===productId); if(!p)return;
    const opts=(p.sizes||[]).map(s=>`<option>${esc(s)}</option>`).join('');
    modal(`<div class="modal-head"><h2>Commander</h2><button class="icon-btn" onclick="app.closeModal()">×</button></div><p><strong>${esc(p.name)}</strong></p><form onsubmit="app.saveOrder(event,'${p.id}')"><div class="form-grid">${input('name','Nom et prénom','',true)}${select('size','Taille',opts)}${input('quantity','Quantité','1',true,'number')}</div><div class="actions"><button class="btn yellow">Valider la commande</button></div></form>`);
  }
  function saveOrder(e,productId){e.preventDefault();const fd=Object.fromEntries(new FormData(e.target).entries());state.data.orders.push({id:uid('o'),productId,...fd,quantity:Number(fd.quantity||1),status:'received'});saveLocal();closeModal();toast('Commande enregistrée');}

  function saveAppreciation(studentId,text){
    let a=state.data.appreciations.find(x=>x.studentId===studentId&&Number(x.term)===1);
    if(!a){a={id:uid('a'),studentId,term:1,text:'',status:'todo'};state.data.appreciations.push(a)}
    a.text=text; a.status=text.trim()?'draft':'todo'; saveLocal(); toast('Brouillon enregistré'); render();
  }

  const app = {
    go(route){ state.route=route; state.search=''; state.categoryFilter='Tous'; render(); window.scrollTo({top:0,behavior:'smooth'}); },
    filter(c){state.categoryFilter=c;render();},
    search(v){state.search=v;render(); const s=document.querySelector('.search'); if(s){s.focus();s.setSelectionRange(v.length,v.length)}},
    toggleTheme(){state.dark=!state.dark;document.body.classList.toggle('dark',state.dark);localStorage.setItem('bs-dark',state.dark?'1':'0');render();},
    openProfile, closeModal,
    setRole(r){state.role=r;state.user={name:r==='admin'?'Lucas — Admin':ROLE_LABELS[r],email:'demo@bonsauveur.fr'};closeModal();render();toast('Profil : '+ROLE_LABELS[r]);},
    adminTab(t){state.adminTab=t;render();},
    openCrud, saveCrud, editItem, duplicate, remove,
    order, saveOrder, saveAppreciation,
    fakeDownload(){toast('Branchez ici le fichier réel depuis Supabase Storage.');},
    async login(e){e.preventDefault();const fd=Object.fromEntries(new FormData(e.target).entries());const {error}=await supabase.auth.signInWithPassword({email:fd.email,password:fd.password});if(error)toast('Connexion impossible : '+error.message);},
    async logout(){await supabase.auth.signOut();closeModal();},
  };
  window.app=app;

  window.addEventListener('online',()=>{state.online=true;}); window.addEventListener('offline',()=>{state.online=false;});
  if('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(console.warn);
  initAuth();
})();
