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
    panel.innerHTML='<div class="cms-section-head"><div><p class="cms-kicker">Contenido común</p><h2>Páginas de categoría</h2><p>Edita títulos de sección, botones y textos comunes de todas las páginas de categoría.</p></div></div><div id="editor-category-page" class="cms-form-grid"></div>';
    catalogPanel.parentNode.insertBefore(panel,catalogPanel);
  }

  const core=document.createElement('script');
  core.src='assets/cms-core.js?v=20260916-cms-2';
  core.onload=()=>{
    const catalog=document.createElement('script');
    catalog.src='assets/cms-catalog.js?v=20260916-cms-2';
    document.body.appendChild(catalog);
  };
  document.body.appendChild(core);
})();