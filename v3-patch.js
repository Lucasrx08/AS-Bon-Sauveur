(() => {
  if (!window.app) return;
  const esc = v => String(v ?? '').replace(/[&<>\"]/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[s]));
  const cats = ['AS','Football','Escalade','Gymnastique'];
  app.editEvent = function(){
    const d=document.createElement('div'); d.id='event-patch-modal'; d.className='modal-backdrop';
    d.innerHTML=`<div class="modal"><div class="modal-head"><h2>Ajouter un événement</h2><button class="icon-btn" id="ep-close">×</button></div><form id="ep-form"><div class="form-grid"><div class="field"><label>Titre</label><input name="title" required></div><div class="field"><label>Catégorie</label><select name="category">${cats.map(c=>`<option>${c}</option>`).join('')}</select></div><div class="field"><label>Date</label><input type="date" name="date" required></div><div class="field"><label>Heure</label><input type="time" name="time"></div><div class="field full"><label>Lieu</label><input name="place"></div></div><div class="actions end"><button class="btn">Enregistrer</button></div></form></div>`;
    document.body.appendChild(d); d.querySelector('#ep-close').onclick=()=>d.remove(); d.onclick=e=>{if(e.target===d)d.remove()};
    d.querySelector('#ep-form').onsubmit=e=>{e.preventDefault();const o=Object.fromEntries(new FormData(e.target).entries());let data;try{data=JSON.parse(localStorage.getItem('bs-app-data-v3')||'{}')}catch{data={}};data.events=Array.isArray(data.events)?data.events:[];data.events.unshift({id:'e'+Math.random().toString(36).slice(2,10),...o});localStorage.setItem('bs-app-data-v3',JSON.stringify(data));d.remove();location.reload()};
  };
})();