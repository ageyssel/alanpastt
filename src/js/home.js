document.addEventListener('DOMContentLoaded', () => {
  const catalog = window.CODIMAS_CATALOG;
  const utils = window.CODIMAS_UTILS;
  if (!catalog || !utils) return;

  const categoryCount = document.getElementById('category-count');
  if (categoryCount) categoryCount.textContent = catalog.categories.length;

  const categoriesGrid = document.getElementById('categories-grid');
  if (categoriesGrid) {
    categoriesGrid.innerHTML = catalog.categories.map((category, index) => `
      <a href="categorias/${category.slug}.html" class="codimas-card codimas-category-card group">
        <div class="codimas-category-visual">
          <img src="public/images/codimas-category.svg" alt="${category.title}">
          <span class="absolute top-4 left-4 bg-white text-codimas-black px-3 py-2 text-xs font-black">${category.number}</span>
        </div>
        <div class="p-5 flex flex-col">
          <p class="text-[11px] font-black tracking-[0.16em] uppercase text-codimas-blue">${category.world}</p>
          <h3 class="font-heading text-3xl font-black uppercase leading-none mt-3 group-hover:text-codimas-blue transition-colors">${category.title}</h3>
          <p class="text-sm text-slate-500 font-semibold leading-relaxed mt-3 flex-1">${category.short}</p>
          <div class="mt-5 pt-4 border-t border-slate-200 flex items-center justify-between text-sm font-black uppercase tracking-wide">
            <span>Ver categoría</span><span>→</span>
          </div>
        </div>
      </a>
    `).join('');
  }

  const worldsGrid = document.getElementById('product-worlds-grid');
  if (worldsGrid) {
    worldsGrid.innerHTML = catalog.productWorlds.map((world, index) => `
      <article class="codimas-panel bg-white">
        <div class="codimas-panel-header">
          <p class="text-xs font-black uppercase tracking-[0.16em] text-codimas-blue">Mundo ${String(index + 1).padStart(2, '0')}</p>
          <h3 class="font-heading text-4xl font-black uppercase mt-2">${world.title}</h3>
        </div>
        <div class="p-6">
          <p class="text-slate-500 font-semibold leading-relaxed">${world.text}</p>
          <div class="mt-6 codimas-table-list">
            ${world.links.map((slug) => {
              const category = utils.getCategory(slug);
              return category ? `<a class="flex items-center justify-between py-3 border-b border-slate-200 font-black text-sm hover:text-codimas-blue" href="categorias/${category.slug}.html"><span>${category.title}</span><span>→</span></a>` : '';
            }).join('')}
          </div>
        </div>
      </article>
    `).join('');
  }

  const servicesGrid = document.getElementById('services-grid');
  if (servicesGrid) {
    servicesGrid.innerHTML = catalog.services.map((service, index) => `
      <article class="codimas-card p-6 md:p-7">
        <div class="codimas-rule mb-6"></div>
        <span class="text-codimas-blue font-black text-sm">${String(index + 1).padStart(2, '0')}</span>
        <h3 class="font-heading text-4xl font-black uppercase leading-none mt-4">${service.title}</h3>
        <p class="text-slate-500 font-semibold leading-relaxed mt-4">${service.text}</p>
        <a href="cotizacion.html?servicio=${encodeURIComponent(service.title)}" class="inline-flex mt-6 font-black uppercase text-sm tracking-wide hover:text-codimas-blue">Cotizar servicio →</a>
      </article>
    `).join('');
  }

  const brandsGrid = document.getElementById('brands-grid');
  if (brandsGrid) {
    brandsGrid.innerHTML = catalog.brands.map((brand) => `
      <div class="bg-white border border-slate-200 min-h-[72px] px-5 py-4 flex items-center justify-center text-center font-black text-sm uppercase tracking-wide text-slate-700 hover:border-codimas-blue transition-colors">${brand}</div>
    `).join('');
  }

  const featuredGrid = document.getElementById('featured-products-grid');
  if (featuredGrid) {
    const featured = catalog.categories.flatMap((category) =>
      category.featuredProducts.slice(0, 1).map((product) => ({ ...product, category: category.title, slug: category.slug }))
    ).slice(0, 8);

    featuredGrid.innerHTML = featured.map((product) => `
      <article class="codimas-card codimas-product-card">
        <div class="codimas-product-image">
          <img src="public/images/codimas-category.svg" alt="${product.name}" class="w-28 opacity-85">
        </div>
        <div class="p-5 flex flex-col">
          <p class="text-[11px] font-black tracking-[0.16em] uppercase text-codimas-blue">${product.category}</p>
          <h3 class="text-xl font-black leading-tight mt-3">${product.name}</h3>
          <p class="text-sm text-slate-500 font-bold mt-2">${product.brand}</p>
          <div class="mt-4 space-y-2 text-sm font-semibold text-slate-600 flex-1">
            <p><strong class="text-slate-900">Código ref.</strong> ${product.code}</p>
            <p>${product.spec}</p>
            <p><strong class="text-slate-900">Unidad</strong> ${product.unit}</p>
          </div>
          <div class="mt-5 flex items-center justify-between gap-3">
            <span class="codimas-price-placeholder">Precio a cotizar</span>
          </div>
          <button class="quote-add-btn codimas-btn codimas-btn-dark text-xs mt-5" data-name="${product.name}" data-code="${product.code}" data-category="${product.category}" data-spec="${product.spec}">Agregar a cotización</button>
        </div>
      </article>
    `).join('');
  }

  function wireSearch(formId, inputId, resultsId) {
    const searchForm = document.getElementById(formId);
    const searchInput = document.getElementById(inputId);
    const searchResults = document.getElementById(resultsId);
    if (!searchForm || !searchInput || !searchResults) return;

    function renderSearchResults(query) {
      const clean = query.trim();
      const results = utils.searchCatalog(clean);
      if (!clean) {
        searchResults.classList.add('hidden');
        searchResults.innerHTML = '';
        return;
      }
      searchResults.classList.remove('hidden');
      searchResults.innerHTML = results.length
        ? results.map((category) => `
            <a href="categorias/${category.slug}.html" class="block border-b border-slate-200 p-4 hover:bg-slate-50">
              <div class="text-xs font-black uppercase tracking-[0.18em] text-codimas-blue">${category.world} · ${category.number}</div>
              <div class="font-heading text-3xl font-black uppercase mt-1">${category.title}</div>
              <div class="text-sm text-slate-500 font-semibold mt-1">${category.short}</div>
            </a>
          `).join('')
        : `<div class="p-4 text-slate-500 font-bold">No encontramos coincidencias. Puedes describir el requerimiento en una solicitud de cotización.</div>`;
    }

    searchInput.addEventListener('input', (event) => renderSearchResults(event.target.value));
    searchForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const query = searchInput.value.trim();
      const firstResult = utils.searchCatalog(query)[0];
      if (firstResult) window.location.href = `categorias/${firstResult.slug}.html`;
      else window.location.href = `cotizacion.html?busqueda=${encodeURIComponent(query)}`;
    });
  }

  wireSearch('catalog-search-form', 'catalog-search-input', 'catalog-search-results');
  wireSearch('catalog-search-form-mobile', 'catalog-search-input-mobile', 'catalog-search-results-mobile');

  const megaToggle = document.getElementById('mega-toggle');
  const megaMenu = document.getElementById('mega-menu');
  megaToggle?.addEventListener('click', () => {
    const isOpen = megaMenu?.classList.toggle('is-open');
    megaToggle.setAttribute('aria-expanded', String(Boolean(isOpen)));
  });

  document.addEventListener('click', (event) => {
    const target = event.target;
    if (megaMenu && megaToggle && !megaMenu.contains(target) && !megaToggle.contains(target)) {
      megaMenu.classList.remove('is-open');
      megaToggle.setAttribute('aria-expanded', 'false');
    }

    const button = target.closest?.('.quote-add-btn');
    if (!button) return;
    const item = {
      name: button.dataset.name,
      code: button.dataset.code,
      category: button.dataset.category,
      spec: button.dataset.spec
    };
    const list = utils.addQuoteItem(item);
    button.textContent = `Agregado (${list.length})`;
    button.classList.remove('codimas-btn-dark');
    button.classList.add('codimas-btn-primary');
    setTimeout(() => {
      window.location.href = 'cotizacion.html';
    }, 420);
  });
});
