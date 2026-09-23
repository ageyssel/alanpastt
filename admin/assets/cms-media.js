(function(){
'use strict';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
let initialized=false;
function app(){return window.CODIMAS_ADMIN}
function setAt(path,value){
  const parts=path.split('.');
  let cursor=app().site;
  parts.forEach((key,index)=>{if(index===parts.length-1)cursor[key]=value;else cursor=cursor[key]});
  app().syncRaw();
}
function human(path){
  const parts=path.split('.');
  if(path==='global.logo_url') return ['Marca','Logo principal'];
  if(path==='global.logo_negative_url') return ['Marca','Logo negativo / footer'];
  if(path==='global.favicon_url') return ['Marca','Favicon'];
  if(path==='home.hero.image_url') return ['Inicio','Imagen principal del hero'];
  if(/^home\.promos\.\d+\.image_url$/.test(path)){const i=Number(parts[2]);return ['Inicio',app().site.home.promos?.[i]?.eyebrow||`Banner ${i+1}`]}
  if(path==='home.enterprise.image_url') return ['Inicio','Imagen Codimas Empresas'];
  if(path==='quote.hero_image_url') return ['Cotización','Imagen principal'];
  if(path==='tracking.hero_image_url') return ['Seguimiento','Imagen principal'];
  if(/^catalog\.categories\.\d+\.image_url$/.test(path)){const i=Number(parts[2]);return ['Categoría',app().site.catalog.categories?.[i]?.title||`Categoría ${i+1}`]}
  if(/^catalog\.categories\.\d+\.featuredProducts\.\d+\.image_url$/.test(path)){
    const ci=Number(parts[2]),pi=Number(parts[4]);
    const c=app().site.catalog.categories?.[ci],p=c?.featuredProducts?.[pi];
    return [c?.title||'Producto',p?.name||`Producto ${pi+1}`];
  }
  if(/^catalog\.services\.\d+\.image_url$/.test(path)){const i=Number(parts[2]);return ['Servicio',app().site.catalog.services?.[i]?.title||`Servicio ${i+1}`]}
  return ['Sitio',parts.slice(0,-1).join(' › ')];
}
function collect(value,path='',out=[]){
  if(Array.isArray(value)){value.forEach((item,i)=>collect(item,path?`${path}.${i}`:String(i),out));return out}
  if(value&&typeof value==='object'){
    Object.entries(value).forEach(([key,val])=>{
      const next=path?`${path}.${key}`:key;
      if(/^(image_url|hero_image_url|logo_url|logo_negative_url|favicon_url)$/.test(key)) out.push({path:next,value:val||''});
      else collect(val,next,out);
    });
  }
  return out;
}
function esc(v=''){return app().escapeHTML(v)}
async function publishPath(path,value){
  const previous=path.split('.').reduce((cursor,key)=>cursor?.[key],app().site);
  setAt(path,value);
  try{
    await app().saveAll();
    return true;
  }catch(error){
    setAt(path,previous??'');
    throw error;
  }
}
function render(){
  const root=$('#media-admin-grid');if(!root)return;
  const media=collect(app().site);
  root.innerHTML=media.map((item,index)=>{
    const [section,label]=human(item.path), id=`media-field-${index}`;
    return `<article class="cms-media-card" data-media-path="${esc(item.path)}">
      <div class="cms-media-card-preview">${item.value?`<img src="${esc(item.value)}" alt="${esc(label)}" loading="lazy">`:'<div class="cms-media-empty">Sin imagen asignada</div>'}</div>
      <div class="cms-media-card-body">
        <span class="cms-media-section">${esc(section)}</span>
        <h3>${esc(label)}</h3>
        <label class="cms-field"><span>URL actual</span><input id="${id}" type="url" value="${esc(item.value)}" data-media-url="${esc(item.path)}" placeholder="https://..."></label>
        <div class="cms-media-actions">
          <button type="button" class="cms-btn cms-btn-primary" data-media-upload="${esc(item.path)}">Cambiar imagen</button>
          <button type="button" class="cms-btn cms-btn-light" data-media-publish="${esc(item.path)}">Publicar URL</button>
          <input type="file" class="cms-media-file" data-media-file="${esc(item.path)}" accept="image/png,image/jpeg,image/webp,image/gif">
        </div>
        <small class="cms-media-path">${esc(item.path)}</small>
      </div>
    </article>`;
  }).join('');

  $$('[data-media-url]',root).forEach(input=>input.addEventListener('input',()=>{
    setAt(input.dataset.mediaUrl,input.value.trim());
    const preview=$('.cms-media-card-preview',input.closest('.cms-media-card'));
    preview.innerHTML=input.value.trim()?`<img src="${esc(input.value.trim())}" alt="" loading="lazy">`:'<div class="cms-media-empty">Sin imagen asignada</div>';
  }));

  $$('[data-media-upload]',root).forEach(button=>button.addEventListener('click',()=>{
    const path=button.dataset.mediaUpload;
    const input=$$('.cms-media-file',root).find(el=>el.dataset.mediaFile===path);
    input?.click();
  }));

  $$('.cms-media-file',root).forEach(input=>input.addEventListener('change',async()=>{
    const file=input.files?.[0];if(!file)return;
    try{
      app().status('Subiendo y verificando imagen...');
      const url=await app().upload(file);
      await publishPath(input.dataset.mediaFile,url);
      render();
      app().status('Imagen publicada y verificada correctamente.','success');
    }catch(error){
      console.error('[Codimas CMS] Error al publicar imagen:',error);
      app().status(`No se pudo publicar la imagen: ${error.message||'error desconocido'}`,'error');
      alert(`No se pudo cambiar la imagen.\n\n${error.message||'Error desconocido'}`);
    }finally{input.value=''}
  }));

  $$('[data-media-publish]',root).forEach(button=>button.addEventListener('click',async()=>{
    const card=button.closest('.cms-media-card');
    const input=$('[data-media-url]',card);
    try{
      app().status('Publicando y verificando URL...');
      await publishPath(button.dataset.mediaPublish,input?.value.trim()||'');
      render();
      app().status('URL publicada y verificada correctamente.','success');
    }catch(error){
      console.error('[Codimas CMS] Error al publicar URL de imagen:',error);
      app().status(`No se pudo publicar la URL: ${error.message||'error desconocido'}`,'error');
      alert(`No se pudo publicar la imagen.\n\n${error.message||'Error desconocido'}`);
    }
  }));

  const count=$('#media-count');if(count)count.textContent=String(media.length);
}
function init(){
  if(initialized||!app())return;
  initialized=true;
  render();
  window.addEventListener('codimas:cms-saved',render);
}
if(window.CODIMAS_ADMIN)init();else window.addEventListener('codimas:admin-core-ready',init,{once:true});
})();