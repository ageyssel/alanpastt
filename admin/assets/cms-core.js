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
function migrateLegacyEmails(value){if(typeof value==='string')return value.replace(/([A-Z0-9._%+-]+)@alanpastt\.cl/gi,'$1@codimas.cl');if(Array.isArray(value))return value.map(migrateLegacyEmails);if(isObj(value))return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,migrateLegacyEmails(item)]));return value}
function hasLegacyEmails(value){try{return /@alanpastt\.cl/i.test(JSON.stringify(value))}catch{return false}}
function normalizeSite(site,defaults){const out=site||{};out.catalog=out.catalog||{};const dc=defaults.catalog?.categories||[];const ds=defaults.catalog?.services||[];const currentCategories=out.catalog.categories?.length?out.catalog.categories:dc;out.catalog.categories=currentCategories.map((category)=>{const base=dc.find((item)=>item.slug===category.slug)||{};const merged={...base,...category};if(merged.image_url===undefined||merged.image_url===null)merged.image_url=base.image_url||'';const baseProducts=base.featuredProducts||[];const products=category.featuredProducts||baseProducts;merged.featuredProducts=products.map((product,index)=>({...baseProducts[index],...product,image_url:product.image_url??baseProducts[index]?.image_url??''}));return merged});const currentServices=out.catalog.services?.length?out.catalog.services:ds;out.catalog.services=currentServices.map((service,index)=>({...ds[index],...service,image_url:service.image_url??ds[index]?.image_url??''}));out.catalog.brands=out.catalog.brands||defaults.catalog?.brands||[];return migrateLegacyEmails(out)}
function esc(v=''){return String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;')}
function canonical(v){if(Array.isArray(v))return v.map(canonical);if(isObj(v))return Object.keys(v).sort().reduce((o,k)=>{o[k]=canonical(v[k]);return o},{});return v}
function status(msg,type='info'){const el=$('#status');if(!el)return;el.textContent=msg;el.className=`cms-status is-${type}`;if(type==='success')setTimeout(()=>el.classList.add('is-hidden'),4200)}
const labels={logo_url:'Logo principal',logo_negative_url:'Logo negativo / footer',favicon_url:'Favicon',company_name:'Nombre de empresa',legal_name:'Descripción corporativa',tagline:'Bajada de marca',sales_email:'Email de ventas',phone:'Teléfono visible',whatsapp:'WhatsApp',topbar_left:'Texto superior izquierdo',topbar_company:'Enlace superior empresas',topbar_contact:'Enlace superior contacto',footer_country:'Texto inferior footer',developer_credit:'Crédito del sitio',eyebrow:'Etiqueta superior',title_html:'Título',subtitle:'Subtítulo',image_url:'Imagen',primary_text:'Texto botón principal',primary_href:'Destino botón principal',secondary_text:'Texto botón secundario',secondary_href:'Destino botón secundario',text:'Texto',title:'Título',button_text:'Texto del botón',button_href:'Destino del botón',hero_eyebrow:'Etiqueta del hero',hero_title_html:'Título del hero',hero_text:'Texto del hero',hero_image_url:'Imagen del hero',items_title:'Título productos agregados',form_eyebrow:'Etiqueta formulario',form_title_html:'Título formulario',submit_text:'Texto botón enviar',search_eyebrow:'Etiqueta buscador',search_title_html:'Título buscador'};
const label=k=>labels[k]||k.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
function setPath(path,val){const parts=path.split('.');let c=window.CODIMAS_ADMIN.site;parts.forEach((p,i)=>{if(i===parts.length-1)c[p]=val;else{if(c[p]===undefined)c[p]={};c=c[p]}});const mirrors={'global.sales_email':'#contact-sales-email','global.contact_email':'#contact-email','global.whatsapp':'#contact-whatsapp','global.phone':'#contact-whatsapp','global.whatsapp_message':'#contact-whatsapp-message','global.tagline':'#contact-footer'};const mirror=mirrors[path]?$(mirrors[path]):null;if(mirror&&mirror.value!==String(val??''))mirror.value=String(val??'');if(path==='global.whatsapp'&&window.CODIMAS_ADMIN.site.global)window.CODIMAS_ADMIN.site.global.phone=val?`+${String(val).replace(/\D/g,'')}`:window.CODIMAS_ADMIN.site.global.phone;if(path==='global.phone'&&window.CODIMAS_ADMIN.site.global){const digits=String(val||'').replace(/\D/g,'');if(digits){window.CODIMAS_ADMIN.site.global.whatsapp=digits;const w=$('#contact-whatsapp');if(w)w.value=digits}}syncRaw()}
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
async function loadContact(){const {data,error}=await sb.from('contact_settings').select('*').eq('id',1).maybeSingle();if(error)throw error;const fallback={id:1,sales_email:window.CODIMAS_ADMIN.site.global.sales_email||'ventas@codimas.cl',contact_email:window.CODIMAS_ADMIN.site.global.contact_email||'contacto@codimas.cl',whatsapp_number:window.CODIMAS_ADMIN.site.global.whatsapp||'',whatsapp_message:window.CODIMAS_ADMIN.site.global.whatsapp_message||'Hola Codimas, me gustaría solicitar una cotización.',footer_text:window.CODIMAS_ADMIN.site.global.tagline||''};const raw=data||fallback;const migrated=migrateLegacyEmails(raw);if(data&&hasLegacyEmails(data)){const {error:migrationError}=await sb.from('contact_settings').upsert([migrated],{onConflict:'id'});if(migrationError)throw migrationError;console.info('[Codimas CMS] Contactos migrados a @codimas.cl');}window.CODIMAS_ADMIN.contact=migrated;const contact=window.CODIMAS_ADMIN.contact;const s=window.CODIMAS_ADMIN.site;s.global=s.global||{};s.global.sales_email=contact.sales_email||s.global.sales_email;s.global.contact_email=contact.contact_email||s.global.contact_email;s.global.whatsapp=contact.whatsapp_number||s.global.whatsapp;s.global.whatsapp_message=contact.whatsapp_message||s.global.whatsapp_message;if(contact.whatsapp_number)s.global.phone=`+${contact.whatsapp_number}`;if(contact.footer_text)s.global.tagline=contact.footer_text;const values={'#contact-sales-email':contact.sales_email,'#contact-email':contact.contact_email,'#contact-whatsapp':contact.whatsapp_number,'#contact-whatsapp-message':contact.whatsapp_message,'#contact-footer':contact.footer_text};Object.entries(values).forEach(([selector,value])=>{const el=$(selector);if(el)el.value=value||''});const mirrors={'global.sales_email':contact.sales_email,'global.contact_email':contact.contact_email,'global.whatsapp':contact.whatsapp_number,'global.whatsapp_message':contact.whatsapp_message,'global.tagline':contact.footer_text,'global.phone':contact.whatsapp_number?`+${contact.whatsapp_number}`:s.global.phone};Object.entries(mirrors).forEach(([path,value])=>{const el=$(`[data-cms-path="${path}"]`);if(el&&value!==undefined)el.value=value||''});['#contact-sales-email','#contact-email','#contact-whatsapp','#contact-whatsapp-message','#contact-footer'].forEach(selector=>$(selector)?.addEventListener('input',()=>{const c={sales_email:$('#contact-sales-email').value.trim(),contact_email:$('#contact-email').value.trim(),whatsapp_number:$('#contact-whatsapp').value.replace(/\D/g,''),whatsapp_message:$('#contact-whatsapp-message').value,footer_text:$('#contact-footer').value};s.global.sales_email=c.sales_email;s.global.contact_email=c.contact_email;s.global.whatsapp=c.whatsapp_number;s.global.whatsapp_message=c.whatsapp_message;if(c.whatsapp_number)s.global.phone=`+${c.whatsapp_number}`;s.global.tagline=c.footer_text;syncRaw()}));syncRaw()}
function syncContactInputsFromSite(){const s=window.CODIMAS_ADMIN.site?.global||{};const values={'#contact-sales-email':s.sales_email||'','#contact-email':s.contact_email||'','#contact-whatsapp':s.whatsapp||String(s.phone||'').replace(/\D/g,''),'#contact-whatsapp-message':s.whatsapp_message||'','#contact-footer':s.tagline||''};Object.entries(values).forEach(([selector,value])=>{const el=$(selector);if(el)el.value=value})}
function collectContact(){const c={id:1,sales_email:$('#contact-sales-email').value.trim().toLowerCase(),contact_email:$('#contact-email').value.trim().toLowerCase(),whatsapp_number:$('#contact-whatsapp').value.replace(/\D/g,''),whatsapp_message:$('#contact-whatsapp-message').value.trim(),footer_text:$('#contact-footer').value.trim()};const emailOk=value=>/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value);if(!emailOk(c.sales_email))throw new Error('Ingresa un email de ventas válido.');if(!emailOk(c.contact_email))throw new Error('Ingresa un email de contacto válido.');if(c.whatsapp_number&&c.whatsapp_number.length<8)throw new Error('Ingresa un número de WhatsApp/teléfono válido.');window.CODIMAS_ADMIN.contact=c;const s=window.CODIMAS_ADMIN.site;s.global=s.global||{};s.global.sales_email=c.sales_email;s.global.contact_email=c.contact_email;s.global.whatsapp=c.whatsapp_number||s.global.whatsapp;s.global.whatsapp_message=c.whatsapp_message||s.global.whatsapp_message;if(c.whatsapp_number)s.global.phone=`+${c.whatsapp_number}`;if(c.footer_text)s.global.tagline=c.footer_text;if(s.home?.contact&&c.sales_email&&/@/.test(s.home.contact.secondary_text||''))s.home.contact.secondary_text=c.sales_email}
async function saveAll(options={}){
  const saveButton=$('#save-all');
  if(saveButton?.dataset.saving==='1')return false;
  if(saveButton){saveButton.dataset.saving='1';saveButton.disabled=true}
  let beforeSite=null,beforeContact=null,siteWritten=false,contactWritten=false;
  try{
    if(options.flushDrafts!==false)window.dispatchEvent(new CustomEvent('codimas:before-save'));
    collectContact();
    if($('#brands-editor'))window.CODIMAS_ADMIN.site.catalog.brands=$('#brands-editor').value.split('\n').map(v=>v.trim()).filter(Boolean);
    status('Guardando y verificando cambios...');

    const [{data:siteSnapshot,error:siteSnapshotError},{data:contactSnapshot,error:contactSnapshotError}]=await Promise.all([
      sb.from('site_content').select('value').eq('key','cms_site').maybeSingle(),
      sb.from('contact_settings').select('*').eq('id',1).maybeSingle()
    ]);
    if(siteSnapshotError)throw new Error('No se pudo preparar respaldo del contenido: '+siteSnapshotError.message);
    if(contactSnapshotError)throw new Error('No se pudo preparar respaldo de contacto: '+contactSnapshotError.message);
    beforeSite=siteSnapshot;
    beforeContact=contactSnapshot;

    const {error:e1}=await sb.from('site_content').upsert([{key:'cms_site',value:window.CODIMAS_ADMIN.site}],{onConflict:'key'});
    if(e1)throw new Error('No se pudo guardar contenido: '+e1.message);
    siteWritten=true;

    const {error:e2}=await sb.from('contact_settings').upsert([window.CODIMAS_ADMIN.contact],{onConflict:'id'});
    if(e2)throw new Error('No se pudo guardar contacto: '+e2.message);
    contactWritten=true;

    const {data:check,error:e3}=await sb.from('site_content').select('value').eq('key','cms_site').maybeSingle();
    if(e3||!check?.value)throw e3||new Error('Supabase no devolvió el contenido guardado.');
    const expected=JSON.stringify(canonical(window.CODIMAS_ADMIN.site));
    const actual=JSON.stringify(canonical(check.value));
    if(expected!==actual)throw new Error('El contenido guardado no coincide con el editor.');

    const [{data:publicCheck,error:e4},{data:publicContact,error:e5}]=await Promise.all([
      publicSb.from('site_content').select('value').eq('key','cms_site').maybeSingle(),
      publicSb.from('contact_settings').select('sales_email,contact_email,whatsapp_number,whatsapp_message,footer_text').eq('id',1).maybeSingle()
    ]);
    if(e4||!publicCheck?.value)throw e4||new Error('El sitio público no puede leer el CMS.');
    if(JSON.stringify(canonical(publicCheck.value))!==expected)throw new Error('La lectura pública del contenido no coincide con lo guardado.');
    if(e5||!publicContact)throw e5||new Error('El sitio público no puede leer los datos de contacto.');

    const contactExpected=canonical({
      sales_email:window.CODIMAS_ADMIN.contact.sales_email,
      contact_email:window.CODIMAS_ADMIN.contact.contact_email,
      whatsapp_number:window.CODIMAS_ADMIN.contact.whatsapp_number,
      whatsapp_message:window.CODIMAS_ADMIN.contact.whatsapp_message,
      footer_text:window.CODIMAS_ADMIN.contact.footer_text
    });
    if(JSON.stringify(canonical(publicContact))!==JSON.stringify(contactExpected))throw new Error('La lectura pública de contacto no coincide con lo guardado.');

    syncRaw();
    status('Cambios publicados y verificados en contenido, contacto y lectura pública.','success');
    window.dispatchEvent(new CustomEvent('codimas:cms-saved',{detail:publicCheck.value}));
    return true;
  }catch(error){
    console.error('[Codimas CMS] Guardado fallido; intentando restaurar respaldo.',error);
    try{
      if(contactWritten){
        if(beforeContact)await sb.from('contact_settings').upsert([beforeContact],{onConflict:'id'});
        else await sb.from('contact_settings').delete().eq('id',1);
      }
      if(siteWritten){
        if(beforeSite?.value)await sb.from('site_content').upsert([{key:'cms_site',value:beforeSite.value}],{onConflict:'key'});
        else await sb.from('site_content').delete().eq('key','cms_site');
      }
    }catch(rollbackError){
      console.error('[Codimas CMS] Falló restauración automática:',rollbackError);
      status('Error al guardar y también al restaurar el respaldo. No sigas editando hasta revisar Supabase.','error');
      throw rollbackError;
    }
    status('No se publicaron los cambios. Se restauró automáticamente la versión anterior. '+(error.message||''),'error');
    throw error;
  }finally{
    if(saveButton){saveButton.dataset.saving='0';saveButton.disabled=false}
  }
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
    img.src=/^(data:|blob:)/i.test(url)?url:url+(url.includes('?')?'&':'?')+'cmscheck='+Date.now();
  })
}
async function runQuoteModuleDiagnostics(){
  const session=await assertAdminSession();
  const stamp=Date.now().toString(36).toUpperCase();
  const trackingCode=`COD-HEALTH-${stamp}`;
  const email='healthcheck@codimas.cl';
  let quoteId=null,responseId=null,attachmentId=null,storagePath=null,failed=false;
  try{
    const {data:quote,error:quoteError}=await sb.from('cotizaciones_entrantes').insert({
      tracking_code:trackingCode,
      nombre:'Diagnóstico Codimas',
      email,
      telefono:'+56900000000',
      empresa:'Codimas · prueba automática',
      mensaje:'Registro temporal creado por Verificar sistema.',
      estado:'Nueva'
    }).select('id,tracking_code,estado').single();
    if(quoteError||!quote)throw quoteError||new Error('No se pudo crear solicitud de diagnóstico.');
    quoteId=quote.id;

    for(const estado of ['En revisión','Cotizando','Respondida','Cerrada']){
      const {data:updated,error}=await sb.from('cotizaciones_entrantes').update({estado,internal_notes:'Diagnóstico automático'}).eq('id',quoteId).select('estado,internal_notes').single();
      if(error)throw new Error(`No se pudo aplicar el estado "${estado}": ${error.message}`);
      if(updated?.estado!==estado||updated?.internal_notes!=='Diagnóstico automático')throw new Error(`Supabase no confirmó correctamente el estado "${estado}".`);
    }

    const {data:response,error:responseError}=await sb.from('quote_responses').insert({
      quote_id:quoteId,
      subject:'Diagnóstico interno',
      body:'Respuesta temporal para validar el módulo administrativo.',
      sent_to:email,
      sent_by:session.user.id,
      attachment_ids:[]
    }).select('id').single();
    if(responseError||!response)throw responseError||new Error('No se pudo escribir en quote_responses.');
    responseId=response.id;

    storagePath=`${quoteId}/healthcheck-${stamp}.pdf`;
    const testFile=new Blob(['%PDF-1.4\n% Codimas admin health check\n%%EOF'],{type:'application/pdf'});
    const {error:storageError}=await sb.storage.from('quote-attachments').upload(storagePath,testFile,{upsert:false,cacheControl:'60'});
    if(storageError)throw new Error('No se pudo escribir en quote-attachments Storage: '+storageError.message);

    const {data:attachment,error:attachmentError}=await sb.from('quote_attachments').insert({
      quote_id:quoteId,
      file_name:'healthcheck.pdf',
      file_path:storagePath,
      file_type:'application/pdf',
      file_size:testFile.size,
      uploaded_by:session.user.id
    }).select('id').single();
    if(attachmentError||!attachment)throw attachmentError||new Error('No se pudo escribir en quote_attachments.');
    attachmentId=attachment.id;

    const {data:tracking,error:trackingError}=await publicSb.rpc('get_quote_tracking',{
      p_tracking_code:trackingCode,
      p_email:email
    });
    if(trackingError)throw new Error('RPC de seguimiento falló: '+trackingError.message);
    if(!tracking?.found)throw new Error('El seguimiento público no encontró la solicitud temporal.');
    if(tracking.quote?.estado!=='Cerrada')throw new Error('El seguimiento público no reflejó el último estado.');
    if(!(tracking.responses||[]).some(item=>item.subject==='Diagnóstico interno'))throw new Error('El seguimiento público no reflejó la respuesta temporal.');
    if(!(tracking.attachments||[]).some(item=>item.file_name==='healthcheck.pdf'))throw new Error('El seguimiento público no reflejó el adjunto temporal.');

    return {ok:true};
  }catch(error){
    failed=true;
    throw error;
  }finally{
    const cleanupErrors=[];
    if(attachmentId){const {error}=await sb.from('quote_attachments').delete().eq('id',attachmentId);if(error)cleanupErrors.push('quote_attachments: '+error.message)}
    if(storagePath){const {error}=await sb.storage.from('quote-attachments').remove([storagePath]);if(error)cleanupErrors.push('Storage adjuntos: '+error.message)}
    if(responseId){const {error}=await sb.from('quote_responses').delete().eq('id',responseId);if(error)cleanupErrors.push('quote_responses: '+error.message)}
    if(quoteId){const {error}=await sb.from('cotizaciones_entrantes').delete().eq('id',quoteId);if(error)cleanupErrors.push('solicitud temporal: '+error.message)}
    if(cleanupErrors.length){
      console.error('[Codimas CMS] Falló limpieza del diagnóstico:',cleanupErrors);
      if(!failed)throw new Error('La prueba funcionó, pero no pudo limpiar datos temporales: '+cleanupErrors.join(' · '));
    }
  }
}
async function runDiagnostics(){
  const button=$('#run-diagnostics'),panel=$('#diagnostics-result');
  if(button)button.disabled=true;
  if(panel){panel.className='cms-diagnostics is-running';panel.textContent='Validando CMS, Storage e imágenes...'}
  try{
    const {data:adminRead,error:aerr}=await sb.from('site_content').select('value').eq('key','cms_site').maybeSingle();
    if(aerr||!adminRead?.value)throw aerr||new Error('No se puede leer cms_site como administrador.');
    const [{data:publicRead,error:perr},{data:publicContact,error:pcerr}]=await Promise.all([
      publicSb.from('site_content').select('value').eq('key','cms_site').maybeSingle(),
      publicSb.from('contact_settings').select('sales_email,contact_email,whatsapp_number,whatsapp_message,footer_text').eq('id',1).maybeSingle()
    ]);
    if(perr||!publicRead?.value)throw perr||new Error('RLS impide leer cms_site como visitante.');
    if(pcerr||!publicContact)throw pcerr||new Error('RLS impide leer contact_settings como visitante.');
    await assertAdminSession();
    const {error:siteWriteError}=await sb.from('site_content').update({value:adminRead.value}).eq('key','cms_site');
    if(siteWriteError)throw new Error('No se puede escribir site_content: '+siteWriteError.message);
    const {error:contactWriteError}=await sb.from('contact_settings').update({
      sales_email:publicContact.sales_email,
      contact_email:publicContact.contact_email,
      whatsapp_number:publicContact.whatsapp_number,
      whatsapp_message:publicContact.whatsapp_message,
      footer_text:publicContact.footer_text
    }).eq('id',1);
    if(contactWriteError)throw new Error('No se puede escribir contact_settings: '+contactWriteError.message);
    await runQuoteModuleDiagnostics();
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
      panel.innerHTML=`<strong>Validación completa aprobada.</strong><span>Autenticación admin OK · CMS lectura/escritura OK · contacto público OK · solicitudes/estados/notas OK · respuestas/adjuntos OK · seguimiento público OK · ambos Storage OK · ${media.length} campos de imagen editables · ${sample.length} imágenes verificadas${failed.length?` · ${failed.length} URL externas no respondieron al test de carga`:''}.</span>`;
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
async function init(){if(window.__CODIMAS_CORE_INIT__)return;window.__CODIMAS_CORE_INIT__=true;if(!await auth())return;const defaults=window.CODIMAS_CMS_DEFAULTS();const {data,error}=await sb.from('site_content').select('value').eq('key','cms_site').maybeSingle();if(error){status(`No se pudo cargar: ${error.message}`,'error');return}const legacySite=hasLegacyEmails(data?.value);const site=normalizeSite(data?.value?merge(defaults,data.value):defaults,defaults);window.CODIMAS_ADMIN={site,contact:null,sb,publicSb,bucket,clone,escapeHTML:esc,status,upload,bindUploads,syncRaw,saveAll,runDiagnostics,renderMainEditors};if(!data?.value||legacySite){const seeded=await sb.from('site_content').upsert([{key:'cms_site',value:site}],{onConflict:'key'});if(seeded.error){status(`No se pudo migrar el contenido: ${seeded.error.message}`,'error');console.warn(seeded.error)}else if(legacySite)console.info('[Codimas CMS] Correos del contenido migrados a @codimas.cl')}renderMainEditors();await loadContact();tabs();$('#save-all').addEventListener('click',()=>saveAll().catch(console.error));$('#run-diagnostics')?.addEventListener('click',()=>runDiagnostics().catch(()=>{}));$('#apply-json').addEventListener('click',async()=>{try{const parsed=JSON.parse($('#raw-json').value);window.CODIMAS_ADMIN.site=normalizeSite(parsed,window.CODIMAS_CMS_DEFAULTS());renderMainEditors();syncContactInputsFromSite();await saveAll({flushDrafts:false});location.reload()}catch(e){console.error(e);if(!(e&&e.message&&e.message.includes('No se')))status('JSON inválido o no se pudo guardar.','error')}});$('#reset-defaults').addEventListener('click',async()=>{if(!confirm('¿Restaurar todos los contenidos a los valores por defecto?'))return;window.CODIMAS_ADMIN.site=window.CODIMAS_CMS_DEFAULTS();renderMainEditors();syncContactInputsFromSite();try{await saveAll({flushDrafts:false});location.reload()}catch(e){console.error(e)}});$('#logout-btn').addEventListener('click',async()=>{await sb.auth.signOut();location.href='login.html'});window.dispatchEvent(new Event('codimas:admin-core-ready'))}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();