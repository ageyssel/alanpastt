(function(){
'use strict';
const cfg=window.ALANPASTT_CONFIG||{};
const sb=window.alanpasttSupabase||(window.alanpasttSupabase=window.supabase.createClient(cfg.supabaseUrl||cfg.SUPABASE_URL,cfg.supabaseAnonKey||cfg.SUPABASE_ANON_KEY));
const publicSb=window.supabase.createClient(cfg.supabaseUrl||cfg.SUPABASE_URL,cfg.supabaseAnonKey||cfg.SUPABASE_ANON_KEY,{auth:{storageKey:'codimas-public-anon',persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
const bucket=cfg.storageBucket||'alanpastt-assets';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const clone=v=>JSON.parse(JSON.stringify(v));
const isObj=v=>v&&typeof v==='object'&&!Array.isArray(v);
function merge(a,b){if(!isObj(a))return b===undefined?a:b;const o={...a};if(!isObj(b))return o;Object.keys(b).forEach(k=>{if(Array.isArray(b[k]))o[k]=b[k];else if(isObj(b[k])&&isObj(a[k]))o[k]=merge(a[k],b[k]);else if(b[k]!==undefined&&b[k]!==null)o[k]=b[k]});return o}
function normalizeSite(site,defaults){const out=site||{};out.catalog=out.catalog||{};const dc=defaults.catalog?.categories||[];const ds=defaults.catalog?.services||[];const currentCategories=out.catalog.categories?.length?out.catalog.categories:dc;out.catalog.categories=currentCategories.map((category)=>{const base=dc.find((item)=>item.slug===category.slug)||{};const merged={...base,...category};if(merged.image_url===undefined||merged.image_url===null)merged.image_url=base.image_url||'';const baseProducts=base.featuredProducts||[];const products=category.featuredProducts||baseProducts;merged.featuredProducts=products.map((product,index)=>({...baseProducts[index],...product,image_url:product.image_url??baseProducts[index]?.image_url??''}));return merged});const currentServices=out.catalog.services?.length?out.catalog.services:ds;out.catalog.services=currentServices.map((service,index)=>({...ds[index],...service,image_url:service.image_url??ds[index]?.image_url??''}));out.catalog.brands=out.catalog.brands||defaults.catalog?.brands||[];return out}
function esc(v=''){return String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;')}
function canonical(v){if(Array.isArray(v))return v.map(canonical);if(isObj(v))return Object.keys(v).sort().reduce((o,k)=>{o[k]=canonical(v[k]);return o},{});return v}
function status(msg,type='info'){const el=$('#status');if(!el)return;el.textContent=msg;el.className=`cms-status is-${type}`;if(type==='success')setTimeout(()=>el.classList.add('is-hidden'),4200)}
const labels={logo_url:'Logo principal',logo_negative_url:'Logo negativo / footer',favicon_url:'Favicon',company_name:'Nombre de empresa',legal_name:'Descripción corporativa',tagline:'Bajada de marca',sales_email:'Email de ventas',phone:'Teléfono visible',whatsapp:'WhatsApp',topbar_left:'Texto superior izquierdo',topbar_company:'Enlace superior empresas',topbar_contact:'Enlace superior contacto',footer_country:'Texto inferior footer',developer_credit:'Crédito del sitio',eyebrow:'Etiqueta superior',title_html:'Título',subtitle:'Subtítulo',image_url:'Imagen',primary_text:'Texto botón principal',primary_href:'Destino botón principal',secondary_text:'Texto botón secundario',secondary_href:'Destino botón secundario',text:'Texto',title:'Título',button_text:'Texto del botón',button_href:'Destino del botón',hero_eyebrow:'Etiqueta del hero',hero_title_html:'Título del hero',hero_text:'Texto del hero',hero_image_url:'Imagen del hero',items_title:'Título productos agregados',form_eyebrow:'Etiqueta formulario',form_title_html:'Título formulario',submit_text:'Texto botón enviar',search_eyebrow:'Etiqueta buscador',search_title_html:'Título buscador'};
const label=k=>labels[k]||k.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
function setPath(path,val){const parts=path.split('.');let c=window.CODIMAS_ADMIN.site;parts.forEach((p,i)=>{if(i===parts.length-1)c[p]=val;else{if(c[p]===undefined)c[p]={};c=c[p]}});syncRaw()}
const isMedia=k=>/(image|logo|favicon).*(_url)?$/i.test(k)||/(_image|_logo)$/i.test(k);
const isLong=(k,v)=>/text|subtitle|description|title_html|legal_name|credit/i.test(k)||String(v||'').length>100;
function field(k,v,path){const id=`cms-${path.replace(/[^a-z0-9]+/gi,'-')}`;if(isMedia(k))return `<label class="cms-field"><span>${label(k)}</span><div class="cms-media-field"><input id="${id}" data-cms-path="${path}" type="url" value="${esc(v||'')}" placeholder="URL de imagen"><button type="button" class="cms-upload-btn" data-target-id="${id}">Subir</button><input type="file" class="cms-file-input" data-target-id="${id}" accept="image/png,image/jpeg,image/webp,image/gif"></div>${v?`<img class="cms-media-preview" src="${esc(v)}" alt="Vista previa">`:''}</label>`;if(typeof v==='boolean')return `<label class="cms-field cms-checkbox"><span>${label(k)}</span><input data-cms-path="${path}" type="checkbox" ${v?'checked':''}></label>`;if(isLong(k,v))return `<label class="cms-field"><span>${label(k)}</span><textarea data-cms-path="${path}" rows="${String(v||'').length>180?5:3}">${esc(v||'')}</textarea>${/_html$/.test(k)?'<small>Se permite HTML básico para negritas y saltos.</small>':''}</label>`;const t=/href|url/i.test(k)?'url':/email/i.test(k)?'email':'text';return `<label class="cms-field"><span>${label(k)}</span><input data-cms-path="${path}" type="${t}" value="${esc(v??'')}"></label>`}
function renderObj(root,obj,base){if(!root)return;root.innerHTML='';Object.entries(obj||{}).forEach(([k,v])=>{const path=`${base}.${k}`;if(Array.isArray(v)){const wrap=document.createElement('div');wrap.className='cms-array-group';wrap.innerHTML=`<div class="cms-array-title"><h3>${label(k)}</h3><span>${v.length} elementos</span></div>`;const body=document.createElement('div');body.className='cms-array-body';v.forEach((item,i)=>{if(isObj(item)){const card=document.createElement('div');card.className='cms-editor-card compact';card.innerHTML=`<div class="cms-item-number">${String(i+1).padStart(2,'0')}</div><div class="cms-form-grid two-cols">${Object.entries(item).map(([ck,cv])=>field(ck,cv,`${path}.${i}.${ck}`)).join('')}</div>`;body.appendChild(card)}});wrap.appendChild(body);root.appendChild(wrap)}else if(isObj(v)){const s=document.createElement('div');s.className='cms-object-group';s.innerHTML=`<div class="cms-subhead"><div><h3>${label(k)}</h3></div></div><div class="cms-form-grid two-cols">${Object.entries(v).map(([ck,cv])=>field(ck,cv,`${path}.${ck}`)).join('')}</div>`;root.appendChild(s)}else root.insertAdjacentHTML('beforeend',field(k,v,path))});bindInputs(root);bindUploads(root)}
function bindInputs(root=document){$$('[data-cms-path]',root).forEach(el=>el.addEventListener('input',()=>setPath(el.dataset.cmsPath,el.type==='checkbox'?el.checked:el.value)))}
function fileToDataUrl(file){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result||''));reader.onerror=()=>reject(new Error('No se pudo leer la imagen seleccionada.'));reader.readAsDataURL(file)})}
function loadBitmap(file){return new Promise((resolve,reject)=>{const img=new Image();const url=URL.createObjectURL(file);img.onload=()=>{URL.revokeObjectURL(url);resolve(img)};img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('El archivo seleccionado no es una imagen válida.'))};img.src=url})}
async function optimizeImage(file){
  if(!file)return null;
  const allowed=['image/jpeg','image/png','image/webp','image/gif'];
  if(!allowed.includes(file.type))throw new Error('Formato no permitido. Usa JPG, PNG, WebP o GIF.');
  if(file.size>12*1024*1024)throw new Error('La imagen supera 12 MB. Reduce su tamaño antes de subirla.');
  if(file.type==='image/gif')return {blob:file,fileName:file.name,dataUrl:await fileToDataUrl(file),optimized:false};
  const img=await loadBitmap(file);
  const max=2200,scale=Math.min(1,max/Math.max(img.naturalWidth||img.width,img.naturalHeight||img.height));
  const width=Math.max(1,Math.round((img.naturalWidth||img.width)*scale));
  const height=Math.max(1,Math.round((img.naturalHeight||img.height)*scale));
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
  const ctx=canvas.getContext('2d',{alpha:true});if(!ctx)throw new Error('El navegador no pudo preparar la imagen.');
  ctx.drawImage(img,0,0,width,height);
  const outputType=file.type==='image/png'&&file.size<1400000?'image/png':'image/webp';
  const quality=outputType==='image/webp'?0.84:0.92;
  const blob=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('No se pudo optimizar la imagen.')),outputType,quality));
  const ext=outputType==='image/webp'?'webp':'png';
  const base=file.name.replace(/\.[^.]+$/,'').replace(/[^a-zA-Z0-9_-]+/g,'-').toLowerCase()||'imagen';
  const optimizedFile=new File([blob],`${base}.${ext}`,{type:outputType,lastModified:Date.now()});
  return {blob:optimizedFile,fileName:optimizedFile.name,dataUrl:await fileToDataUrl(optimizedFile),optimized:true};
}
async function assertAdminSession(){
  const {data,error}=await sb.auth.getSession();
  if(error)throw new Error('No se pudo validar la sesión: '+error.message);
  const session=data?.session;if(!session)throw new Error('La sesión administrativa expiró. Cierra sesión y vuelve a ingresar.');
  const {data:profile,error:profileError}=await sb.from('admin_profiles').select('role').eq('user_id',session.user.id).maybeSingle();
  if(profileError)throw new Error('No se pudo validar el rol administrador: '+profileError.message);
  if(!profile||profile.role!=='admin')throw new Error('Este usuario no tiene permisos de administrador para subir imágenes.');
  return session;
}
async function upload(file){
  if(!file)return null;
  await assertAdminSession();
  const prepared=await optimizeImage(file);
  const safeName=prepared.fileName.replace(/[^a-zA-Z0-9._-]+/g,'-').toLowerCase();
  const path=`cms/${Date.now()}-${Math.random().toString(36).slice(2,8)}-${safeName}`;
  const result=await sb.storage.from(bucket).upload(path,prepared.blob,{cacheControl:'3600',upsert:false,contentType:prepared.blob.type});
  if(!result.error){
    const publicUrl=sb.storage.from(bucket).getPublicUrl(path).data.publicUrl;
    if(!publicUrl)throw new Error('Storage recibió la imagen, pero no devolvió una URL pública.');
    console.info('[Codimas CMS] Imagen subida a Storage:',publicUrl);
    return publicUrl;
  }
  console.error('[Codimas CMS] Falló Supabase Storage:',{message:result.error.message,statusCode:result.error.statusCode,error:result.error});
  if(prepared.dataUrl.length>1800000){
    throw new Error(`Storage rechazó la imagen (${result.error.message}). La imagen optimizada aún es demasiado grande para usar el respaldo automático.`);
  }
  console.warn('[Codimas CMS] Usando respaldo embebido en cms_site porque Storage rechazó la carga.');
  status('Storage rechazó la carga; publicando mediante respaldo seguro del CMS...','info');
  return prepared.dataUrl;
}
function bindUploads(root=document){$$('.cms-upload-btn',root).forEach(btn=>{if(btn.dataset.bound)return;btn.dataset.bound='1';btn.addEventListener('click',()=>{const id=btn.dataset.targetId||btn.dataset.target;$(`.cms-file-input[data-target-id="${id}"],.cms-file-input[data-target="${id}"]`)?.click()})});$$('.cms-file-input',root).forEach(inp=>{if(inp.dataset.bound)return;inp.dataset.bound='1';inp.addEventListener('change',async()=>{const f=inp.files?.[0];if(!f)return;const id=inp.dataset.targetId||inp.dataset.target;const target=document.getElementById(id);try{status('Subiendo imagen...');const url=await upload(f);if(target){target.value=url;target.dispatchEvent(new Event('input',{bubbles:true}));let p=target.closest('.cms-field')?.querySelector('.cms-media-preview');if(!p){p=document.createElement('img');p.className='cms-media-preview';target.closest('.cms-field')?.appendChild(p)}if(p)p.src=url}status('Imagen subida correctamente.','success')}catch(e){console.error('[Codimas CMS] Error al cambiar imagen:',e);status(`No se pudo cambiar la imagen: ${e.message}`,'error')}finally{inp.value=''}})})}
function syncRaw(){const el=$('#raw-json');if(el&&window.CODIMAS_ADMIN?.site)el.value=JSON.stringify(window.CODIMAS_ADMIN.site,null,2)}
async function auth(){const {data}=await sb.auth.getSession();if(!data.session){location.href='login.html';return null}const {data:profile}=await sb.from('admin_profiles').select('role').eq('user_id',data.session.user.id).maybeSingle();if(!profile||profile.role!=='admin'){await sb.auth.signOut();location.href='login.html';return null}$('#user-email').textContent=data.session.user.email||'';return data.session}
async function loadContact(){const {data}=await sb.from('contact_settings').select('*').eq('id',1).maybeSingle();window.CODIMAS_ADMIN.contact=data||{id:1,sales_email:window.CODIMAS_ADMIN.site.global.sales_email||'',contact_email:'',whatsapp_number:window.CODIMAS_ADMIN.site.global.whatsapp||'',whatsapp_message:'',footer_text:window.CODIMAS_ADMIN.site.global.tagline||''};const c=window.CODIMAS_ADMIN.contact;$('#contact-sales-email').value=c.sales_email||'';$('#contact-email').value=c.contact_email||'';$('#contact-whatsapp').value=c.whatsapp_number||'';$('#contact-whatsapp-message').value=c.whatsapp_message||'';$('#contact-footer').value=c.footer_text||''}
function collectContact(){const c={id:1,sales_email:$('#contact-sales-email').value.trim(),contact_email:$('#contact-email').value.trim(),whatsapp_number:$('#contact-whatsapp').value.replace(/\D/g,''),whatsapp_message:$('#contact-whatsapp-message').value.trim(),footer_text:$('#contact-footer').value.trim()};window.CODIMAS_ADMIN.contact=c;const s=window.CODIMAS_ADMIN.site;s.global.sales_email=c.sales_email||s.global.sales_email;s.global.whatsapp=c.whatsapp_number||s.global.whatsapp;if(c.whatsapp_number)s.global.phone=`+${c.whatsapp_number}`}
async function saveAll(){
  collectContact();
  if($('#brands-editor'))window.CODIMAS_ADMIN.site.catalog.brands=$('#brands-editor').value.split('\n').map(v=>v.trim()).filter(Boolean);
  status('Guardando cambios...');
  const {error:e1}=await sb.from('site_content').upsert([{key:'cms_site',value:window.CODIMAS_ADMIN.site}],{onConflict:'key'});
  if(e1){status(`No se pudo guardar: ${e1.message}`,'error');throw e1}
  const {error:e2}=await sb.from('contact_settings').upsert([window.CODIMAS_ADMIN.contact],{onConflict:'id'});
  if(e2){status(`Contenido guardado, pero falló contacto: ${e2.message}`,'error');throw e2}
  const {data:check,error:e3}=await sb.from('site_content').select('value').eq('key','cms_site').maybeSingle();
  if(e3||!check?.value){const err=e3||new Error('Supabase no devolvió el contenido guardado.');status('El cambio se envió, pero no pudo verificarse.','error');throw err}
  const expected=JSON.stringify(canonical(window.CODIMAS_ADMIN.site));
  const actual=JSON.stringify(canonical(check.value));
  if(expected!==actual){const err=new Error('El contenido guardado no coincide con el editor.');status('Supabase respondió, pero la verificación detectó diferencias.','error');throw err}
  const {data:publicCheck,error:e4}=await publicSb.from('site_content').select('value').eq('key','cms_site').maybeSingle();
  if(e4||!publicCheck?.value){const err=e4||new Error('El sitio público no puede leer el CMS.');status('Guardado correcto, pero la lectura pública del CMS falló. Revisa RLS.', 'error');throw err}
  const publicActual=JSON.stringify(canonical(publicCheck.value));
  if(publicActual!==expected){const err=new Error('La lectura pública no coincide con lo guardado.');status('El CMS se guardó, pero la versión pública todavía no coincide.', 'error');throw err}
  syncRaw();
  status('Cambios publicados y verificados también como visitante público.','success');
  window.dispatchEvent(new CustomEvent('codimas:cms-saved',{detail:publicCheck.value}));
  return true
}
function mediaPaths(value,path='',out=[]){
  if(Array.isArray(value)){value.forEach((item,i)=>mediaPaths(item,path?`${path}.${i}`:String(i),out));return out}
  if(value&&typeof value==='object'){Object.entries(value).forEach(([key,val])=>{const next=path?`${path}.${key}`:key;if(/^(image_url|hero_image_url|logo_url|logo_negative_url|favicon_url)$/.test(key))out.push({path:next,value:val||''});else mediaPaths(val,next,out)});}
  return out
}
async function verifyImage(url,timeout=8000){
  if(!url)return {ok:true,empty:true};
  return await new Promise((resolve)=>{
    const img=new Image(),timer=setTimeout(()=>resolve({ok:false,error:'timeout'}),timeout);
    img.onload=()=>{clearTimeout(timer);resolve({ok:true})};
    img.onerror=()=>{clearTimeout(timer);resolve({ok:false,error:'load'})};
    img.src=url+(url.includes('?')?'&':'?')+'cmscheck='+Date.now();
  })
}
async function runDiagnostics(){
  const button=$('#run-diagnostics'),panel=$('#diagnostics-result');
  if(button)button.disabled=true;
  if(panel){panel.className='cms-diagnostics is-running';panel.textContent='Validando CMS, Storage e imágenes...'}
  try{
    const {data:adminRead,error:aerr}=await sb.from('site_content').select('value').eq('key','cms_site').maybeSingle();
    if(aerr||!adminRead?.value)throw aerr||new Error('No se puede leer cms_site como administrador.');
    const {data:publicRead,error:perr}=await publicSb.from('site_content').select('value').eq('key','cms_site').maybeSingle();
    if(perr||!publicRead?.value)throw perr||new Error('RLS impide leer cms_site como visitante.');
    const media=mediaPaths(window.CODIMAS_ADMIN.site);
    const required=['global.logo_url','global.logo_negative_url','global.favicon_url','home.hero.image_url','home.promos.0.image_url','home.promos.1.image_url','home.enterprise.image_url','quote.hero_image_url','tracking.hero_image_url'];
    const paths=new Set(media.map(item=>item.path));
    const missing=required.filter(path=>!paths.has(path));
    if(missing.length)throw new Error('Faltan campos de imagen: '+missing.join(', '));
    const testBytes=Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Zf7sAAAAASUVORK5CYII='),c=>c.charCodeAt(0));
    const testPath=`cms/diagnostics/${Date.now()}-test.png`;
    const up=await sb.storage.from(bucket).upload(testPath,new Blob([testBytes],{type:'image/png'}),{upsert:false,cacheControl:'60'});
    if(up.error)throw new Error('Storage no permite subir imágenes: '+up.error.message);
    const publicUrl=sb.storage.from(bucket).getPublicUrl(testPath).data.publicUrl;
    const storageImage=await verifyImage(publicUrl,6000);
    await sb.storage.from(bucket).remove([testPath]);
    if(!storageImage.ok)throw new Error('La imagen de prueba se subió, pero no es accesible públicamente.');
    const nonEmpty=media.filter(item=>item.value);
    const sample=nonEmpty.slice(0,Math.min(nonEmpty.length,12));
    const checks=await Promise.all(sample.map(item=>verifyImage(item.value)));
    const failed=sample.filter((_,i)=>!checks[i].ok);
    if(panel){
      panel.className='cms-diagnostics is-success';
      panel.innerHTML=`<strong>Validación completa aprobada.</strong><span>${media.length} campos de imagen editables · lectura pública OK · escritura/lectura de Storage OK · ${sample.length} imágenes verificadas${failed.length?` · ${failed.length} URL externas no respondieron al test de carga`:''}.</span>`;
    }
    status('Validación del CMS completada correctamente.','success');
    return {mediaCount:media.length,failedImages:failed.map(item=>item.path)}
  }catch(error){
    console.error(error);
    if(panel){panel.className='cms-diagnostics is-error';panel.innerHTML=`<strong>La validación detectó un problema.</strong><span>${esc(error.message||'Error desconocido')}</span>`}
    status(`Validación fallida: ${error.message||'error desconocido'}`,'error');
    throw error
  }finally{if(button)button.disabled=false}
}
function renderMainEditors(){const s=window.CODIMAS_ADMIN.site;renderObj($('#editor-global'),s.global,'global');renderObj($('#editor-navigation'),s.navigation,'navigation');renderObj($('#editor-home'),s.home,'home');renderObj($('#editor-quote'),s.quote,'quote');renderObj($('#editor-tracking'),s.tracking,'tracking');syncRaw()}
function tabs(){$$('.cms-nav-item').forEach(b=>b.addEventListener('click',()=>{const t=b.dataset.tab;$$('.cms-nav-item').forEach(x=>x.classList.toggle('is-active',x===b));$$('.cms-tab').forEach(p=>p.classList.toggle('is-active',p.dataset.panel===t));history.replaceState(null,'',`#${t}`)}));const t=location.hash.replace('#','');if(t)$(`.cms-nav-item[data-tab="${t}"]`)?.click()}
async function init(){if(window.__CODIMAS_CORE_INIT__)return;window.__CODIMAS_CORE_INIT__=true;if(!await auth())return;const defaults=window.CODIMAS_CMS_DEFAULTS();const {data,error}=await sb.from('site_content').select('value').eq('key','cms_site').maybeSingle();if(error){status(`No se pudo cargar: ${error.message}`,'error');return}const site=normalizeSite(data?.value?merge(defaults,data.value):defaults,defaults);window.CODIMAS_ADMIN={site,contact:null,sb,publicSb,bucket,clone,escapeHTML:esc,status,upload,bindUploads,syncRaw,saveAll,runDiagnostics,renderMainEditors};if(!data?.value){const seeded=await sb.from('site_content').upsert([{key:'cms_site',value:site}],{onConflict:'key'});if(seeded.error)console.warn(seeded.error)}renderMainEditors();await loadContact();tabs();$('#save-all').addEventListener('click',()=>saveAll().catch(console.error));$('#run-diagnostics')?.addEventListener('click',()=>runDiagnostics().catch(()=>{}));$('#apply-json').addEventListener('click',async()=>{try{window.CODIMAS_ADMIN.site=JSON.parse($('#raw-json').value);await saveAll();location.reload()}catch(e){if(!(e&&e.message&&e.message.includes('No se pudo')))status('JSON inválido o no se pudo guardar.','error')}});$('#reset-defaults').addEventListener('click',async()=>{if(!confirm('¿Restaurar todos los contenidos a los valores por defecto?'))return;window.CODIMAS_ADMIN.site=window.CODIMAS_CMS_DEFAULTS();renderMainEditors();try{await saveAll();location.reload()}catch(e){console.error(e)}});$('#logout-btn').addEventListener('click',async()=>{await sb.auth.signOut();location.href='login.html'});window.dispatchEvent(new Event('codimas:admin-core-ready'))}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();