(() => {
'use strict';
/* Évite une réécriture continue des options de filtre par le patch V5. */
const descriptor=Object.getOwnPropertyDescriptor(Element.prototype,'innerHTML');
if(!descriptor?.get||!descriptor?.set)return;
Object.defineProperty(Element.prototype,'innerHTML',{
  configurable:descriptor.configurable,
  enumerable:descriptor.enumerable,
  get:descriptor.get,
  set(value){
    try{
      if(this.tagName==='SELECT'){
        const field=this.closest?.('.filter-field');
        const label=field?.querySelector('span')?.textContent?.trim().toUpperCase();
        if(label==='CATÉGORIE'&&descriptor.get.call(this)===String(value))return;
      }
    }catch(e){}
    return descriptor.set.call(this,value);
  }
});
})();
