document.addEventListener('DOMContentLoaded', () => {
  if (!document.querySelector('link[href*="style.css"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '../src/css/style.css?v=20260909-wuerth-2';
    document.head.appendChild(link);
  }

  const slug = document.body.dataset.category;
  const catalog = window.CODIMAS_CATALOG;
  const utils = window.CODIMAS_UTILS;
  const category = utils?.getCategory(slug);
  const root = document.getElementById('category-root');

  if (!root || !category || !catalog) {
    if (root) root.innerHTML = '<main class="p-10 font-bold">Categoría no encontrada.</main>';
    return;
  }

  const related = catalog.categories
    .filter((item) => item.slug !== category.slug && item.world === category.world)
    .slice(0, 4);

  root.innerHTML = `
    <header class="codimas-main-header">
      <div class="codimas-topbar">
        <div class="codimas-shell h-9 flex items-center justify-between gap-6">
          <span>Catálogo Codimas · ${category.world}</span>
          <div class="flex items-center gap-5"><a href="../seguimiento.html" class="hover:text-codimas-blue">Seguimiento</a><a href="mailto:ventas@codimas.cl">ventas@codimas.cl</a></div>
        </div>
      </div>
      <div class="codimas-shell codimas-header-row">
        <a href="../index.html" class="codimas-logo-link"><img src="../public/images/codimas-logo.svg" alt="Codimas SpA" class="codimas-logo"></a>
        <form id="category-search-form" class="codimas-search"><input id="category-search-input" type="search" placeholder="Buscar producto, categoría, código o marca"><button type="submit">Buscar</button><div id="category-search-results" class="codimas-search-results hidden"></div></form>
        <div class="codimas-actions"><a href="../seguimiento.html" class="codimas-action-link optional">Seguimiento</a><a href="../cotizacion.html" class="codimas-btn codimas-btn-dark">Cotización</a></div>
      </div>
      <div class="codimas-nav-wrap">
        <div class="codimas-shell"><nav class="codimas-nav"><a class="is-primary" href="../index.html#categorias">Productos</a><a href="../index.html#soluciones">Soluciones</a><a href="../index.html#servicios">Servicios</a><a href="../index.html#empresas">Empresas</a><a href="../index.html#contacto">Contacto</a></nav></div>
      </div>
    </header>

    <main>
      <section class="bg-white border-b border-slate-200">
        <div class="codimas-shell py-4 text-sm font-bold text-slate-500">
          <a href="../index.html" class="hover:text-codimas-blue">Inicio</a><span class="mx-2">/</span><a href="../index.html#categorias" class="hover:text-codimas-blue">Productos</a><span class="mx-2">/</span><span class="text-slate-900">${category.title}</span>
        </div>
      </section>

      <section class="bg-white">
        <div class="codimas-shell grid lg:grid-cols-[.46fr_.54fr] gap-12 py-12 md:py-18 items-stretch">
          <div class="py-6">
            <p class="codimas-kicker">${category.world}</p>
            <h1 class="codimas-heading text-6xl md:text-8xl uppercase mt-6">${category.title}</h1>
            <p class="codimas-copy mt-7">${category.description}</p>
            <div class="flex flex-col sm:flex-row gap-3 mt-9">
              <a href="../cotizacion.html?categoria=${encodeURIComponent(category.title)}" class="codimas-btn codimas-btn-primary">Cotizar categoría</a>
              <a href="#productos" class="codimas-btn codimas-btn-outline">Productos de referencia</a>
            </div>
          </div>
          <div class="codimas-panel">
            <div class="codimas-panel-header flex items-center justify-between gap-5"><h2 class="font-heading text-4xl uppercase font-black">Datos para cotizar</h2><span class="text-5xl font-black text-codimas-blue">${category.number}</span></div>
            <div class="p-7 grid md:grid-cols-2 gap-6">
              <div><p class="text-xs font-black uppercase tracking-[0.18em] text-codimas-blue">Información recomendada</p><p class="text-slate-600 font-semibold leading-relaxed mt-3">${category.quoteHint}</p></div>
              <div><p class="text-xs font-black uppercase tracking-[0.18em] text-codimas-blue">Aplicaciones</p><ul class="mt-3 space-y-2">${category.applications.map((item) => `<li class="font-bold border-b border-slate-200 pb-2">${item}</li>`).join('')}</ul></div>
            </div>
          </div>
        </div>
      </section>

      <section class="bg-codimas-gray-50 border-y border-slate-200">
        <div class="codimas-shell py-9 grid md:grid-cols-4 gap-5">
          <div><strong class="font-heading text-5xl font-black text-codimas-blue">${category.subcategories.length}</strong><p class="text-xs font-black uppercase tracking-wide text-slate-500">Subcategorías</p></div>
          <div><strong class="font-heading text-5xl font-black text-codimas-blue">${category.featuredProducts.length}</strong><p class="text-xs font-black uppercase tracking-wide text-slate-500">Referencias</p></div>
          <div><strong class="font-heading text-5xl font-black text-codimas-blue">B2B</strong><p class="text-xs font-black uppercase tracking-wide text-slate-500">Cotización por volumen</p></div>
          <div><strong class="font-heading text-5xl font-black text-codimas-blue">COD</strong><p class="text-xs font-black uppercase tracking-wide text-slate-500">Seguimiento</p></div>
        </div>
      </section>

      <section class="codimas-section bg-white">
        <div class="codimas-shell grid lg:grid-cols-[300px_1fr] gap-10 items-start">
          <aside class="codimas-panel sticky top-40 hidden lg:block">
            <div class="codimas-panel-header"><h2 class="font-heading text-3xl uppercase font-black">Subcategorías</h2></div>
            <div class="p-5 space-y-1">
              ${category.subcategories.map((item) => `<a href="../cotizacion.html?categoria=${encodeURIComponent(category.title)}&producto=${encodeURIComponent(item)}" class="block py-3 border-b border-slate-200 font-bold hover:text-codimas-blue">${item}</a>`).join('')}
            </div>
          </aside>

          <div id="productos">
            <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-5 mb-8">
              <div><p class="codimas-kicker">Listado</p><h2 class="codimas-heading text-5xl md:text-7xl uppercase mt-4">Productos de referencia</h2></div>
              <a href="../cotizacion.html?categoria=${encodeURIComponent(category.title)}" class="codimas-btn codimas-btn-dark">Enviar requerimiento</a>
            </div>

            <div class="codimas-table-list mb-8 bg-white">
              ${category.featuredProducts.map((product) => `
                <article class="codimas-table-row">
                  <div class="flex items-center gap-5">
                    <div class="w-24 h-24 bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0"><img src="../public/images/codimas-category.svg" alt="${product.name}" class="w-14 opacity-80"></div>
                    <div><p class="text-[11px] font-black uppercase tracking-[0.16em] text-codimas-blue">${product.brand}</p><h3 class="text-xl font-black leading-tight mt-1">${product.name}</h3><p class="text-sm text-slate-500 font-semibold mt-2">${product.spec}</p></div>
                  </div>
                  <div><p class="text-xs font-black uppercase tracking-wide text-slate-400">Código</p><p class="font-black">${product.code}</p></div>
                  <div><p class="text-xs font-black uppercase tracking-wide text-slate-400">Unidad</p><p class="font-black">${product.unit}</p></div>
                  <button class="quote-add-btn codimas-btn codimas-btn-primary text-xs" data-name="${product.name}" data-code="${product.code}" data-category="${category.title}" data-spec="${product.spec}">Cotizar</button>
                </article>
              `).join('')}
            </div>
          </div>
        </div>
      </section>

      <section class="codimas-section bg-codimas-gray-50 border-y border-slate-200">
        <div class="codimas-shell">
          <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-8">
            <div><p class="codimas-kicker">Relacionadas</p><h2 class="codimas-heading text-5xl md:text-6xl uppercase mt-4">Otras líneas del mismo mundo</h2></div>
            <a href="../index.html#categorias" class="codimas-btn codimas-btn-outline">Ver todo el catálogo</a>
          </div>
          <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            ${related.map((item) => `<a href="${item.slug}.html" class="codimas-card p-6 block"><span class="text-codimas-blue font-black">${item.number}</span><h3 class="font-heading text-3xl font-black uppercase leading-none mt-4">${item.title}</h3><p class="text-sm text-slate-500 font-semibold mt-3">${item.short}</p></a>`).join('')}
          </div>
        </div>
      </section>
    </main>

    <footer class="codimas-footer">
      <div class="codimas-shell py-14 codimas-footer-grid">
        <div><img src="../public/images/codimas-logo.svg" alt="Codimas SpA" class="h-20 bg-white p-3 mb-6"><p>Productos, suministros y soluciones.</p></div>
        <div><h3>Comprar</h3><a href="../index.html#categorias">Productos</a><a href="../index.html#marcas">Marcas</a><a href="../cotizacion.html">Cotización</a></div>
        <div><h3>Empresas</h3><a href="../index.html#empresas">Codimas Empresas</a><a href="../index.html#servicios">Servicios</a><a href="../seguimiento.html">Seguimiento</a></div>
        <div><h3>Ayuda</h3><a href="../index.html#contacto">Contacto</a><a href="mailto:ventas@codimas.cl">ventas@codimas.cl</a></div>
        <div><h3>Legal</h3><p>Codimas SpA</p><a href="../admin/login.html">Acceso equipo</a></div>
      </div>
    </footer>
  `;

  function renderSearchResults(query) {
    const resultsBox = document.getElementById('category-search-results');
    if (!resultsBox) return;
    const clean = query.trim();
    const results = utils.searchCatalog(clean);
    if (!clean) {
      resultsBox.classList.add('hidden');
      resultsBox.innerHTML = '';
      return;
    }
    resultsBox.classList.remove('hidden');
    resultsBox.innerHTML = results.length
      ? results.map((item) => `<a href="${item.slug}.html" class="block border-b border-slate-200 p-4 hover:bg-slate-50"><p class="text-xs font-black uppercase tracking-[0.16em] text-codimas-blue">${item.world}</p><h3 class="font-heading text-3xl font-black uppercase mt-1">${item.title}</h3></a>`).join('')
      : '<div class="p-4 text-slate-500 font-bold">No encontramos coincidencias. Envía tu requerimiento para revisarlo.</div>';
  }

  document.getElementById('category-search-input')?.addEventListener('input', (event) => renderSearchResults(event.target.value));
  document.getElementById('category-search-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const query = document.getElementById('category-search-input')?.value || '';
    const first = utils.searchCatalog(query)[0];
    if (first) window.location.href = `${first.slug}.html`;
    else window.location.href = `../cotizacion.html?busqueda=${encodeURIComponent(query)}`;
  });

  document.addEventListener('click', (event) => {
    const button = event.target.closest('.quote-add-btn');
    if (!button) return;
    const item = { name: button.dataset.name, code: button.dataset.code, category: button.dataset.category, spec: button.dataset.spec };
    const list = utils.addQuoteItem(item);
    button.textContent = `Agregado (${list.length})`;
    button.classList.remove('codimas-btn-primary');
    button.classList.add('codimas-btn-dark');
    setTimeout(() => { window.location.href = '../cotizacion.html'; }, 420);
  });
});
