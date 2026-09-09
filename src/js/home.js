document.addEventListener('DOMContentLoaded', () => {
  const catalog = window.CODIMAS_CATALOG;
  const utils = window.CODIMAS_UTILS;
  if (!catalog || !utils) return;

  const categoryCount = document.getElementById('category-count');
  if (categoryCount) categoryCount.textContent = catalog.categories.length;

  const categoriesGrid = document.getElementById('categories-grid');
  if (categoriesGrid) {
    categoriesGrid.innerHTML = catalog.categories.map((category) => `
      <a href="categorias/${category.slug}.html" class="codimas-card group block p-6 md:p-7 min-h-[310px] flex flex-col justify-between">
        <div>
          <div class="flex items-start justify-between gap-4">
            <span class="text-[11px] font-black tracking-[0.32em] uppercase text-codimas-blue">${category.world}</span>
            <span class="text-3xl font-black text-slate-200 group-hover:text-codimas-yellow transition-colors">${category.number}</span>
          </div>
          <h3 class="text-2xl md:text-3xl font-black tracking-tight mt-6 leading-none group-hover:text-codimas-blue transition-colors">${category.title}</h3>
          <p class="text-slate-500 font-semibold leading-relaxed mt-4">${category.short}</p>
        </div>
        <div class="mt-8">
          <div class="codimas-rule mb-5"></div>
          <div class="flex flex-wrap gap-2">
            ${category.subcategories.slice(0, 4).map((item) => `<span class="text-[11px] font-extrabold uppercase tracking-wide bg-slate-100 text-slate-600 px-3 py-2">${item}</span>`).join('')}
          </div>
        </div>
      </a>
    `).join('');
  }

  const worldsGrid = document.getElementById('product-worlds-grid');
  if (worldsGrid) {
    worldsGrid.innerHTML = catalog.productWorlds.map((world) => `
      <article class="border-t-4 border-codimas-yellow bg-white p-7 md:p-9">
        <p class="text-xs font-black uppercase tracking-[0.28em] text-codimas-blue">Mundo de productos</p>
        <h3 class="text-3xl font-black tracking-tight mt-4">${world.title}</h3>
        <p class="text-slate-500 font-semibold leading-relaxed mt-4">${world.text}</p>
        <div class="mt-7 space-y-2">
          ${world.links.map((slug) => {
            const category = utils.getCategory(slug);
            return category ? `<a class="flex items-center justify-between border-b border-slate-200 py-3 font-black hover:text-codimas-blue" href="categorias/${category.slug}.html"><span>${category.title}</span><span>→</span></a>` : '';
          }).join('')}
        </div>
      </article>
    `).join('');
  }

  const servicesGrid = document.getElementById('services-grid');
  if (servicesGrid) {
    servicesGrid.innerHTML = catalog.services.map((service, index) => `
      <article class="bg-white border border-slate-200 p-7">
        <span class="text-codimas-blue font-black text-sm">0${index + 1}</span>
        <h3 class="text-2xl font-black tracking-tight mt-5">${service.title}</h3>
        <p class="text-slate-500 font-semibold leading-relaxed mt-3">${service.text}</p>
      </article>
    `).join('');
  }

  const brandsGrid = document.getElementById('brands-grid');
  if (brandsGrid) {
    brandsGrid.innerHTML = catalog.brands.map((brand) => `
      <div class="bg-white border border-slate-200 px-5 py-4 text-center font-black text-sm uppercase tracking-wide text-slate-700">${brand}</div>
    `).join('');
  }

  const featuredGrid = document.getElementById('featured-products-grid');
  if (featuredGrid) {
    const featured = catalog.categories.flatMap((category) =>
      category.featuredProducts.slice(0, 1).map((product) => ({ ...product, category: category.title, slug: category.slug }))
    ).slice(0, 8);

    featuredGrid.innerHTML = featured.map((product) => `
      <article class="codimas-card p-5 flex flex-col min-h-[290px]">
        <div class="aspect-[4/3] bg-slate-100 border border-slate-200 flex items-center justify-center mb-5">
          <img src="public/images/codimas-category.svg" alt="${product.name}" class="w-24 opacity-80">
        </div>
        <p class="text-[11px] font-black tracking-[0.22em] uppercase text-codimas-blue">${product.category}</p>
        <h3 class="text-xl font-black leading-tight mt-2">${product.name}</h3>
        <p class="text-sm text-slate-500 font-bold mt-2">${product.brand} · ${product.code}</p>
        <p class="text-sm text-slate-600 mt-3 flex-1">${product.spec}</p>
        <button class="quote-add-btn codimas-btn codimas-btn-dark text-xs mt-5" data-name="${product.name}" data-code="${product.code}" data-category="${product.category}" data-spec="${product.spec}">Agregar a cotización</button>
      </article>
    `).join('');
  }

  const searchForm = document.getElementById('catalog-search-form');
  const searchInput = document.getElementById('catalog-search-input');
  const searchResults = document.getElementById('catalog-search-results');

  function renderSearchResults(query) {
    if (!searchResults) return;
    const results = utils.searchCatalog(query);
    if (!query) {
      searchResults.classList.add('hidden');
      searchResults.innerHTML = '';
      return;
    }
    searchResults.classList.remove('hidden');
    searchResults.innerHTML = results.length
      ? results.map((category) => `
          <a href="categorias/${category.slug}.html" class="block border-b border-slate-200 p-4 hover:bg-slate-50">
            <div class="text-xs font-black uppercase tracking-[0.24em] text-codimas-blue">${category.world} · ${category.number}</div>
            <div class="font-black text-lg mt-1">${category.title}</div>
            <div class="text-sm text-slate-500 font-semibold mt-1">${category.short}</div>
          </a>
        `).join('')
      : `<div class="p-4 text-slate-500 font-bold">No encontramos coincidencias. Puedes solicitar una cotización describiendo lo que necesitas.</div>`;
  }

  searchInput?.addEventListener('input', (event) => renderSearchResults(event.target.value.trim()));
  searchForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    const query = searchInput?.value.trim();
    const firstResult = utils.searchCatalog(query)[0];
    if (firstResult) window.location.href = `categorias/${firstResult.slug}.html`;
  });

  document.addEventListener('click', (event) => {
    const button = event.target.closest('.quote-add-btn');
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
    }, 450);
  });
});
