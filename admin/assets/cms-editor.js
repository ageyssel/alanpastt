(function(){
  const nav=document.querySelector('.cms-sidebar nav');
  const catalogButton=nav?.querySelector('[data-tab="catalogo"]');
  if(nav&&catalogButton&&!nav.querySelector('[data-tab="pagina-categoria"]')){
    const button=document.createElement('button');
    button.className='cms-nav-item';
    button.dataset.tab='pagina-categoria';
    button.textContent='Páginas de categoría';
    nav.insertBefore(button,catalogButton);
  }

  const catalogPanel=document.querySelector('.cms-tab[data-panel="catalogo"]');
  if(catalogPanel&&!document.querySelector('.cms-tab[data-panel="pagina-categoria"]')){
    const panel=document.createElement('section');
    panel.className='cms-tab';
    panel.dataset.panel='pagina-categoria';
    panel.innerHTML='<div class="cms-section-head"><div><p class="cms-kicker">Contenido común</p><h2>Páginas de categoría</h2><p>Edita títulos de sección, botones y textos comunes de todas las páginas de categoría.</p></div></div><div id="editor-category-page" class="cms-form-grid two-cols"></div>';
    catalogPanel.parentNode.insertBefore(panel,catalogPanel);
  }

  const labels={breadcrumb_home:'Breadcrumb · Inicio',breadcrumb_categories:'Breadcrumb · Categorías',quote_button:'Botón cotizar categoría',references_button:'Botón ver referencias',subcategories_eyebrow:'Etiqueta subcategorías',subcategories_title_html:'Título subcategorías',products_eyebrow:'Etiqueta productos',products_title_html:'Título productos',product_button:'Botón producto',applications_eyebrow:'Etiqueta aplicaciones',applications_title_html:'Título aplicaciones',application_text:'Texto aplicaciones',related_eyebrow:'Etiqueta relacionadas',related_title_html:'Título relacionadas',related_link:'Enlace ver todas',related_item_link:'Enlace cada relacionada',cta_eyebrow:'Etiqueta CTA final',cta_title:'Título CTA final',cta_button:'Botón CTA final'};
  const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  function renderCategoryPageEditor(){
    const app=window.CODIMAS_ADMIN,root=document.getElementById('editor-category-page');
    if(!app||!root)return;
    const data=app.site.category_page||{};
    root.innerHTML=Object.entries(data).map(([key,value])=>{
      const long=key.includes('title_html')||String(value).length>90;
      return `<label class="cms-field ${long?'span-2':''}"><span>${labels[key]||key}</span>${long?`<textarea rows="3" data-category-ui="${key}">${esc(value)}</textarea>`:`<input type="text" data-category-ui="${key}" value="${esc(value)}">`}${key.includes('title_html')?'<small>Se permite HTML básico, por ejemplo &lt;strong&gt;texto&lt;/strong&gt;.</small>':''}</label>`;
    }).join('');
    root.querySelectorAll('[data-category-ui]').forEach(input=>input.addEventListener('input',()=>{app.site.category_page[input.dataset.categoryUi]=input.value;app.syncRaw()}));
  }

  window.addEventListener('codimas:admin-core-ready',renderCategoryPageEditor);

  const core=document.createElement('script');
  core.src='assets/cms-core.js?v=20260923-bindfix-2';
  core.onload=()=>{
    if(window.CODIMAS_ADMIN)renderCategoryPageEditor();
    const catalog=document.createElement('script');
    catalog.src='assets/cms-catalog.js?v=20260923-bindfix-2';
    catalog.onload=()=>{
      const media=document.createElement('script');
      media.src='assets/cms-media.js?v=20260923-bindfix-2';
      document.body.appendChild(media);
    };
    document.body.appendChild(catalog);
  };
  document.body.appendChild(core);
})();